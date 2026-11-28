(function(){
'use strict';
var room=null,stream=null,publishedTrack=null,outputCanvas=null,outputContext=null,outputStream=null,outputFrame=0;
var paused=false,facing='environment',connecting=false,wakeLock=null,trackName='',retryCount=0,manualDisconnect=false,reconnectTimer=0,reconnectAttempts=0;
var statusTimer=0,brandingTimer=0,controlsTimer=0,activeSessionId='',sensorReady=false,sensorListenerRegistered=false,sensorLandscape=null,sensorAngle=null,lastFrameAt=0;
var digitalZoom=1,brightness=1,contrast=1,panX=0,panY=0,hardwareZoomSupported=false,hardwareZoomBase=1,networkQuality='unknown';
var publishOptions={name:'',videoCodec:'vp8',videoEncoding:{maxBitrate:1800000,maxFramerate:30,priority:'high'},degradationPreference:'maintain-framerate',simulcast:false};
function el(id){return document.getElementById(id);}
function status(message,kind){
 var e=el('camera-status'),s=el('live-state');if(e){e.textContent=message||'';e.dataset.visible=message?'true':'false';}
 if(s){s.dataset.kind=kind||'info';if(kind==='live')s.textContent='CONNECTED'+(networkQuality!=='unknown'?' · '+networkQuality.toUpperCase():'');else if(kind==='error')s.textContent='CONNECTION ERROR';else s.textContent='READY';}
 if(statusTimer)clearTimeout(statusTimer);
 if(message){statusTimer=setTimeout(function(){if(e)e.dataset.visible='false';statusTimer=0;},kind==='error'?5200:2300);}
}
function token(){return localStorage.getItem('icf_admin_token')||'';}
async function request(path,method,body){var headers={'Authorization':'Bearer '+token()};if(body!==undefined)headers['Content-Type']='application/json';var r=await fetch('/api'+path,{method:method||'GET',headers:headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});var d=await r.json().catch(function(){return {};});if(!r.ok)throw new Error(d.error||'Request failed ('+r.status+').');return d;}
function fallbackLandscape(){try{if(screen.orientation&&screen.orientation.type)return screen.orientation.type.indexOf('landscape')===0;}catch(_e){}try{return window.matchMedia('(orientation: landscape)').matches;}catch(_e){}return window.innerWidth>window.innerHeight;}
function physicalLandscape(){return sensorReady&&sensorLandscape!==null?sensorLandscape:fallbackLandscape();}
function currentAngle(){if(sensorReady&&sensorAngle!==null)return sensorAngle;try{if(screen.orientation&&typeof screen.orientation.angle==='number')return ((screen.orientation.angle%360)+360)%360;}catch(_e){}if(typeof window.orientation==='number')return ((window.orientation%360)+360)%360;return 0;}
function handleDeviceOrientation(event){
 if(!event||typeof event.gamma!=='number'||!Number.isFinite(event.gamma))return;
 var g=event.gamma,b=Number(event.beta)||0,previous=sensorLandscape;
 if(Math.abs(g)>38){sensorLandscape=true;sensorAngle=g>0?90:270;sensorReady=true;}
 else if(Math.abs(g)<22){sensorLandscape=false;sensorAngle=(b>145||b< -145)?180:0;sensorReady=true;}
 if(previous!==sensorLandscape){var app=el('camera-app');if(app)app.dataset.physicalOrientation=sensorLandscape?'landscape':'portrait';}
}
async function enableOrientationSensor(){
 if(sensorReady)return true;
 try{
  if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
   var permission=await DeviceOrientationEvent.requestPermission();if(permission!=='granted')return false;
  }
  if(!sensorListenerRegistered){window.addEventListener('deviceorientation',handleDeviceOrientation,true);sensorListenerRegistered=true;}
  return true;
 }catch(_e){return false;}
}
function stopComposer(){if(outputFrame)cancelAnimationFrame(outputFrame);outputFrame=0;lastFrameAt=0;if(outputStream){outputStream.getTracks().forEach(function(t){t.stop();});outputStream=null;}outputCanvas=null;outputContext=null;}
function drawCameraFrame(timestamp){
 if(!outputCanvas||!outputContext)return;
 if(!timestamp||timestamp-lastFrameAt>=1000/30){
  lastFrameAt=timestamp||performance.now();
  var video=el('phone-preview'),w=video.videoWidth,h=video.videoHeight;
  if(w>0&&h>0&&video.readyState>=2){
   var ctx=outputContext,W=outputCanvas.width,H=outputCanvas.height,screenWide=physicalLandscape(),frameWide=w>=h,angle=currentAngle(),rotation=0;
   if(screenWide!==frameWide){rotation=screenWide?(angle===270?-90:90):(angle===180?-90:90);if(facing==='user')rotation=-rotation;}
   else if(angle===180){rotation=180;}
   var rotated=rotation===90||rotation===-90,effectiveW=rotated?h:w,effectiveH=rotated?w:h;
   var scale=Math.max(W/effectiveW,H/effectiveH);
   ctx.save();ctx.fillStyle='#071329';ctx.fillRect(0,0,W,H);ctx.translate(W/2+panX*W*.12,H/2+panY*H*.12);if(rotation)ctx.rotate(rotation*Math.PI/180);
   if('filter'in ctx)ctx.filter='brightness('+brightness+') contrast('+contrast+')';
   ctx.scale(digitalZoom,digitalZoom);
   ctx.drawImage(video,-w*scale/2,-h*scale/2,w*scale,h*scale);
   ctx.restore();if('filter'in ctx)ctx.filter='none';
  }
 }
 outputFrame=requestAnimationFrame(drawCameraFrame);
}
function startComposer(){
 stopComposer();outputCanvas=document.createElement('canvas');outputCanvas.width=1280;outputCanvas.height=720;
 outputContext=outputCanvas.getContext('2d',{alpha:false,desynchronized:true});if(!outputContext)throw new Error('This browser cannot prepare the camera output.');
 outputContext.fillStyle='#071329';outputContext.fillRect(0,0,1280,720);
 drawCameraFrame(performance.now());outputStream=outputCanvas.captureStream(30);
 if(!outputStream||!outputStream.getVideoTracks().length)throw new Error('Could not create the camera output on this device.');
}
async function publishPhoneOutput(){
 if(!room||!outputStream)return;
 var outgoing=outputStream.getVideoTracks()[0];if(!outgoing)throw new Error('The camera output is unavailable.');
 publishOptions.name=trackName;publishedTrack=new LivekitClient.LocalVideoTrack(outgoing);
 await room.localParticipant.publishTrack(publishedTrack,publishOptions);
}
async function keepAwake(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen');}catch(_e){}}
function syncPreviewTransform(){var video=el('phone-preview');if(video)video.style.transform='translate3d('+(panX*12)+'%, '+(panY*12)+'%, 0) scale('+digitalZoom+')';}
function syncZoomControls(){
 var v=el('phone-zoom'),d=el('zoom-display'),q=el('zoom-value');if(v)v.value=String(currentZoom);if(d)d.textContent=currentZoom.toFixed(1)+'×';if(q)q.textContent=currentZoom.toFixed(1)+'×';syncPreviewTransform();
}
var currentZoom=1;
async function setZoom(value){
 currentZoom=Math.max(1,Math.min(4,Math.round(Number(value)*10)/10));digitalZoom=currentZoom;
 var track=stream&&stream.getVideoTracks()[0];
 if(track&&typeof track.getCapabilities==='function'&&typeof track.applyConstraints==='function'){
  try{var caps=track.getCapabilities(),settings=track.getSettings?track.getSettings():{};if(caps.zoom){var min=caps.zoom.min||1,max=caps.zoom.max||4,hardware=Math.max(min,Math.min(max,currentZoom));await track.applyConstraints({advanced:[{zoom:hardware}]});hardwareZoomSupported=true;hardwareZoomBase=hardware;digitalZoom=Math.max(1,currentZoom/hardware);}}
  catch(_e){hardwareZoomSupported=false;digitalZoom=currentZoom;}
 }
 syncZoomControls();
}
function stepZoom(amount){setZoom(currentZoom+amount).catch(function(){});}
function moveFrame(dx,dy){panX=Math.max(-.4,Math.min(.4,panX+dx));panY=Math.max(-.4,Math.min(.4,panY+dy));syncPreviewTransform();}
function resetFrame(){panX=0;panY=0;setZoom(1).catch(function(){});if(el('phone-brightness'))el('phone-brightness').value='1';if(el('phone-contrast'))el('phone-contrast').value='1';setPictureAdjustments();}
function setPictureAdjustments(){
 brightness=Number(el('phone-brightness')&&el('phone-brightness').value)||1;
 contrast=Number(el('phone-contrast')&&el('phone-contrast').value)||1;
 var b=el('brightness-display'),c=el('contrast-display');if(b)b.textContent=Math.round(brightness*100)+'%';if(c)c.textContent=Math.round(contrast*100)+'%';
 var video=el('phone-preview');if(video)video.style.filter='brightness('+brightness+') contrast('+contrast+')';
}
function applyPhonePresentation(presentation){
 if(!presentation)return;
 var logo=el('phone-brand-logo'),welcome=el('phone-brand-welcome'),slide=el('phone-brand-slide'),scripture=el('phone-brand-scripture');
 var url=String(presentation.logo_url||presentation.logoUrl||'').trim()||'/icf-logo-transparent.png';
 if(logo){if(logo.getAttribute('src')!==url){logo.onerror=function(){if(this.getAttribute('src')!=='/icf-logo-transparent.png')this.src='/icf-logo-transparent.png';};logo.src=url;}logo.style.display='block';logo.dataset.position=presentation.logo_position||presentation.logoPosition||'top-left';}
 var config=presentation.presentation_config||presentation.presentationConfig||{},mode=config.mode||'camera';
 var welcomeText=String(presentation.overlay_text||presentation.overlayText||'');
 if(welcome){welcome.textContent=welcomeText;welcome.style.display=welcomeText?'block':'none';welcome.classList.toggle('is-marquee',!!welcomeText);}
 var slideText=[config.slideTitle||'',config.slideBody||''].filter(Boolean).join('\n');
 if(slide){slide.textContent=slideText;slide.hidden=!(mode==='slide'||mode==='ticker')||!slideText;}
 var scriptureText=String(presentation.scripture_text||presentation.scriptureText||'').trim(),reference=String(presentation.scripture_reference||presentation.scriptureReference||'').trim();
 if(scripture){scripture.textContent=(reference?reference+'\n':'')+scriptureText;scripture.style.display=(reference||scriptureText)?'block':'none';}
}
async function syncPhonePresentation(){
 if(!activeSessionId||!token())return;
 try{var d=await request('/admin/broadcast/sessions/'+activeSessionId+'/phone-presentation');applyPhonePresentation(d.presentation);}
 catch(_e){}
}
function startBrandingSync(){if(brandingTimer)clearInterval(brandingTimer);syncPhonePresentation();brandingTimer=setInterval(syncPhonePresentation,5000);}
async function startDevice(){
 if(room&&publishedTrack){try{await room.localParticipant.unpublishTrack(publishedTrack);}catch(_e){}try{publishedTrack.stop();}catch(_e){}publishedTrack=null;}
 stopComposer();if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}
 var next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:720},aspectRatio:{ideal:16/9},frameRate:{ideal:24,max:30}},audio:false});
 var video=el('phone-preview');video.srcObject=next;video.muted=true;video.playsInline=true;video.autoplay=true;await video.play();stream=next;
 if(video.readyState<2||!video.videoWidth){await new Promise(function(resolve,reject){var timer=setTimeout(function(){cleanup();reject(new Error('The camera started but did not provide picture frames. Try reconnecting.'));},7000);function ready(){cleanup();resolve();}function cleanup(){clearTimeout(timer);video.removeEventListener('loadeddata',ready);video.removeEventListener('resize',ready);}video.addEventListener('loadeddata',ready,{once:true});video.addEventListener('resize',ready,{once:true});});}
 currentZoom=1;digitalZoom=1;setPictureAdjustments();syncZoomControls();startComposer();if(room)await publishPhoneOutput();
}
function scheduleReconnect(reason){if(manualDisconnect||!token()||reconnectTimer)return;var delay=Math.min(20000,1000*Math.pow(2,Math.min(reconnectAttempts,4)));reconnectAttempts++;if(reason)status(reason+' Reconnecting in '+Math.ceil(delay/1000)+'s…','error');reconnectTimer=setTimeout(function(){reconnectTimer=0;if(!room&&!connecting&&!manualDisconnect&&navigator.onLine!==false)connect();},delay);}
window.addEventListener('online',function(){if(!manualDisconnect&&token()&&!room&&!connecting){if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=0;}connect();}});
async function connect(){
 if(connecting||room&&publishedTrack)return;
 manualDisconnect=false;if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=0;}
 connecting=true;if(el('connect-phone'))el('connect-phone').disabled=true;
 try{
  if(!token())throw new Error('Sign in to ICF first. Use the Sign in button in Camera options, then this page will connect automatically.');
  if(!window.LivekitClient)throw new Error('LiveKit could not load. Check your internet connection and refresh.');
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('Camera access requires HTTPS and a supported mobile browser.');
  var slug=new URLSearchParams(location.search).get('slug');if(!slug)throw new Error('The QR/link is missing its broadcast code. Generate a fresh link from the ICF studio.');
  status('Checking the active ICF service…','info');
  var list=await request('/admin/broadcast/sessions'),session=(list.sessions||[]).find(function(s){return s.slug===slug;});
  if(!session)throw new Error('This ICF camera link does not match an existing broadcast. Generate a new QR code.');
  if(!['preparing','live'].includes(session.status))throw new Error('ICF_WAITING_FOR_LIVE');
  activeSessionId=session.id;applyPhonePresentation(session);await enableOrientationSensor();
  var credentials=await request('/admin/broadcast/sessions/'+session.id+'/camera-token','POST',{cameraName:(el('camera-name').value||'').trim()});
  trackName=credentials.trackName;retryCount=0;status('Allow camera access to connect this phone.','info');
  await startDevice();room=new LivekitClient.Room({adaptiveStream:false,dynacast:false});
  room.on(LivekitClient.RoomEvent.Reconnecting,function(){status('Connection interrupted. Keeping the camera ready while LiveKit reconnects…','info');});room.on(LivekitClient.RoomEvent.Reconnected,function(){reconnectAttempts=0;status('Camera connection restored.','live');});room.on(LivekitClient.RoomEvent.Disconnected,function(){room=null;publishedTrack=null;if(el('connect-phone')){el('connect-phone').disabled=false;el('connect-phone').textContent='Reconnect camera';}scheduleReconnect('Studio connection interrupted.');});
  if(LivekitClient.RoomEvent.ConnectionQualityChanged){room.on(LivekitClient.RoomEvent.ConnectionQualityChanged,function(quality,participant){if(participant&&participant.isLocal){networkQuality=String(quality||'unknown').toLowerCase();var state=el('live-state');if(state&&room)state.textContent='CONNECTED · '+networkQuality.toUpperCase();}});}
  await room.connect(credentials.serverUrl,credentials.token);await publishPhoneOutput();
  var settings=stream.getVideoTracks()[0].getSettings?stream.getVideoTracks()[0].getSettings():{},resolution=settings.width&&settings.height?settings.width+'×'+settings.height:'720p mode';
  if(el('flip-phone'))el('flip-phone').disabled=false;if(el('pause-phone'))el('pause-phone').disabled=false;if(el('disconnect-phone'))el('disconnect-phone').disabled=false;
  if(el('connect-phone')){el('connect-phone').textContent='Connected';el('connect-phone').disabled=true;}
  if(el('camera-device-status'))el('camera-device-status').textContent='Connected as '+credentials.cameraName+'. Camera source '+resolution+'. Phone preview branding is shown locally; the Worship Studio composes programme graphics into the live output and recording.';
  reconnectAttempts=0;keepAwake();startBrandingSync();status('Camera connected.','live');
 }catch(e){
  if(e.message==='ICF_WAITING_FOR_LIVE'&&retryCount<45){retryCount++;status('QR link recognised. Waiting for the operator to start the live service…','info');if(el('connect-phone'))el('connect-phone').textContent='Waiting for studio…';setTimeout(function(){if(!room&&!connecting)connect();},2500);}
  else{if(room){try{await room.disconnect();}catch(_e){}room=null;publishedTrack=null;}status(e.message,'error');if(el('connect-phone')){el('connect-phone').disabled=false;el('connect-phone').textContent='Try connect again';}scheduleReconnect('Camera connection failed.');}
 }finally{connecting=false;}
}
async function flip(){
 try{facing=facing==='environment'?'user':'environment';status('Switching camera…','info');await startDevice();status('Camera switched. Live video continues.','live');}
 catch(e){facing=facing==='environment'?'user':'environment';status('Could not switch camera: '+e.message,'error');}
}
function togglePause(){
 if(!stream||!outputStream)return;paused=!paused;stream.getVideoTracks().forEach(function(t){t.enabled=!paused;});outputStream.getVideoTracks().forEach(function(t){t.enabled=!paused;});
 el('pause-phone').textContent=paused?'▶':'Ⅱ';el('pause-phone').setAttribute('aria-label',paused?'Resume camera':'Pause camera');
 status(paused?'Camera paused. Tap Resume to continue.':'Camera resumed.','live');
}
async function disconnect(){
 manualDisconnect=true;if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=0;}
 try{
  if(room){if(publishedTrack){try{await room.localParticipant.unpublishTrack(publishedTrack);}catch(_e){}try{publishedTrack.stop();}catch(_e){}publishedTrack=null;}await room.disconnect();room=null;}
  stopComposer();if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}el('phone-preview').srcObject=null;
  if(brandingTimer)clearInterval(brandingTimer);brandingTimer=0;activeSessionId='';
  ['flip-phone','pause-phone','disconnect-phone'].forEach(function(id){if(el(id))el(id).disabled=true;});
  el('pause-phone').textContent='Ⅱ';el('connect-phone').disabled=false;el('connect-phone').textContent='Connect camera';paused=false;
  if(wakeLock){try{await wakeLock.release();}catch(_e){}wakeLock=null;}status('Camera disconnected.','info');
 }catch(e){status(e.message,'error');}
}
function openSignIn(){var loginUrl=location.origin+'/?page=admin-login';window.open(loginUrl,'icf-admin-signin','noopener');status('Sign in in the new tab. This camera will connect automatically after login.','info');}
function revealControls(){var app=el('camera-app');if(!app)return;app.classList.remove('controls-hidden');if(controlsTimer)clearTimeout(controlsTimer);if(!el('camera-drawer').classList.contains('open'))controlsTimer=setTimeout(function(){app.classList.add('controls-hidden');},3600);}
function toggleDrawer(){el('camera-drawer').classList.toggle('open');revealControls();}
function fullscreen(){var target=el('camera-app');var entered=target.requestFullscreen?target.requestFullscreen():target.webkitRequestFullscreen?target.webkitRequestFullscreen():null;if(entered&&typeof entered.then==='function')entered.then(function(){try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(function(){});}catch(_e){}}).catch(function(){});}
function orientationChanged(){
 var app=el('camera-app');if(!app)return;
 if(sensorReady&&sensorLandscape!==null)app.dataset.physicalOrientation=sensorLandscape?'landscape':'portrait';
 else app.dataset.physicalOrientation=fallbackLandscape()?'landscape':'portrait';
 
}
el('connect-phone').addEventListener('click',function(){enableOrientationSensor().finally(connect);});
el('flip-phone').addEventListener('click',flip);el('pause-phone').addEventListener('click',togglePause);el('disconnect-phone').addEventListener('click',disconnect);
el('login-phone').addEventListener('click',openSignIn);el('drawer-toggle').addEventListener('click',toggleDrawer);el('fullscreen-phone').addEventListener('click',fullscreen);
el('zoom-in').addEventListener('click',function(){stepZoom(.2);});el('zoom-out').addEventListener('click',function(){stepZoom(-.2);});
el('phone-zoom').addEventListener('change',function(){setZoom(this.value);});
el('frame-up').addEventListener('click',function(){moveFrame(0,-.08);});el('frame-down').addEventListener('click',function(){moveFrame(0,.08);});el('frame-left').addEventListener('click',function(){moveFrame(-.08,0);});el('frame-right').addEventListener('click',function(){moveFrame(.08,0);});el('frame-reset').addEventListener('click',resetFrame);
el('phone-brightness').addEventListener('input',setPictureAdjustments);el('phone-contrast').addEventListener('input',setPictureAdjustments);
el('camera-status').addEventListener('click',function(){this.dataset.visible='false';if(statusTimer)clearTimeout(statusTimer);});
el('camera-app').addEventListener('pointerdown',revealControls,{passive:true});
revealControls();
window.addEventListener('storage',function(e){if(e.key==='icf_admin_token'&&e.newValue&&!room)connect();});
window.addEventListener('focus',function(){if(!manualDisconnect&&token()&&!room&&!connecting)connect();});
window.addEventListener('orientationchange',orientationChanged);window.addEventListener('resize',orientationChanged);
try{if(screen.orientation&&screen.orientation.addEventListener)screen.orientation.addEventListener('change',orientationChanged);}catch(_e){}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&!manualDisconnect&&token()&&!room&&!connecting)connect();if(document.visibilityState==='visible')keepAwake();});
window.addEventListener('beforeunload',function(){manualDisconnect=true;if(reconnectTimer)clearTimeout(reconnectTimer);if(room)room.disconnect();if(brandingTimer)clearInterval(brandingTimer);stopComposer();if(stream)stream.getTracks().forEach(function(t){t.stop();});});
window.addEventListener('pointerdown',function(){if(!sensorReady)enableOrientationSensor();},{once:true});
if(token())connect();else status('Scan the ICF camera QR code, then use Sign in under Options.','info');
})();