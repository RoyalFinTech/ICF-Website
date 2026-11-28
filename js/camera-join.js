(function(){
'use strict';
var room=null,stream=null,publishedTrack=null,outputCanvas=null,outputContext=null,outputStream=null,outputFrame=0;
var paused=false,facing='environment',connecting=false,wakeLock=null,trackName='',retryCount=0;
var publishOptions={name:'',videoCodec:'vp8',videoEncoding:{maxBitrate:4500000,maxFramerate:30,priority:'high'},degradationPreference:'maintain-resolution',simulcast:true};
function el(id){return document.getElementById(id);}
function status(message,kind){var e=el('camera-status'),s=el('live-state');if(e)e.textContent=message||'';if(s){s.dataset.kind=kind||'info';s.textContent=kind==='live'?'CONNECTED':kind==='error'?'CONNECTION ERROR':'READY';}}
function token(){return localStorage.getItem('icf_admin_token')||'';}
async function request(path,method,body){var headers={'Authorization':'Bearer '+token()};if(body!==undefined)headers['Content-Type']='application/json';var r=await fetch('/api'+path,{method:method||'GET',headers:headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});var d=await r.json().catch(function(){return {};});if(!r.ok)throw new Error(d.error||'Request failed ('+r.status+').');return d;}
function isLandscape(){try{if(screen.orientation&&screen.orientation.type)return screen.orientation.type.indexOf('landscape')===0;}catch(_e){}try{return window.matchMedia('(orientation: landscape)').matches;}catch(_e){}return window.innerWidth>window.innerHeight;}
function orientationAngle(){try{if(screen.orientation&&typeof screen.orientation.angle==='number')return ((screen.orientation.angle%360)+360)%360;}catch(_e){}if(typeof window.orientation==='number')return ((window.orientation%360)+360)%360;return 0;}
function stopComposer(){if(outputFrame)cancelAnimationFrame(outputFrame);outputFrame=0;if(outputStream){outputStream.getTracks().forEach(function(t){t.stop();});outputStream=null;}outputCanvas=null;outputContext=null;}
function drawCameraFrame(){
 if(!outputCanvas||!outputContext)return;
 var video=el('phone-preview'),w=video.videoWidth,h=video.videoHeight;
 if(w>0&&h>0&&video.readyState>=2){
  var ctx=outputContext,W=outputCanvas.width,H=outputCanvas.height,screenWide=isLandscape(),frameWide=w>=h,angle=orientationAngle(),rotation=0;
  if(screenWide!==frameWide){
   if(screenWide)rotation=(angle===270?-90:90);
   else rotation=(angle===90?-90:90);
  }else if(angle===180){rotation=180;}
  ctx.fillStyle='#071329';ctx.fillRect(0,0,W,H);
  ctx.save();ctx.translate(W/2,H/2);if(rotation)ctx.rotate(rotation*Math.PI/180);
  var rotatedWide=(rotation===90||rotation===-90)?!frameWide:frameWide;
  if(rotatedWide){var scale=Math.max(W/w,H/h);ctx.drawImage(video,-w*scale/2,-h*scale/2,w*scale,h*scale);}
  else{var scaleFit=Math.min(W/w,H/h);ctx.drawImage(video,-w*scaleFit/2,-h*scaleFit/2,w*scaleFit,h*scaleFit);}
  ctx.restore();
 }
 outputFrame=requestAnimationFrame(drawCameraFrame);
}
function startComposer(){
 stopComposer();
 outputCanvas=document.createElement('canvas');outputCanvas.width=1920;outputCanvas.height=1080;
 outputContext=outputCanvas.getContext('2d',{alpha:false,desynchronized:true});
 if(!outputContext)throw new Error('This browser cannot prepare the landscape camera output.');
 outputContext.fillStyle='#071329';outputContext.fillRect(0,0,1920,1080);
 drawCameraFrame();outputStream=outputCanvas.captureStream(30);
 if(!outputStream||!outputStream.getVideoTracks().length)throw new Error('Could not create the landscape camera stream on this device.');
}
async function publishPhoneOutput(){
 if(!room||!outputStream)return;
 var outgoing=outputStream.getVideoTracks()[0];if(!outgoing)throw new Error('The landscape camera output is unavailable.');
 publishOptions.name=trackName;publishedTrack=new LivekitClient.LocalVideoTrack(outgoing);
 await room.localParticipant.publishTrack(publishedTrack,publishOptions);
}
async function keepAwake(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen');}catch(_e){}}
async function startDevice(){
 if(room&&publishedTrack){try{await room.localParticipant.unpublishTrack(publishedTrack);}catch(_e){}try{publishedTrack.stop();}catch(_e){}publishedTrack=null;}
 stopComposer();
 if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}
 var next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1080},aspectRatio:{ideal:16/9},frameRate:{ideal:30,max:30}},audio:false});
 var video=el('phone-preview');video.srcObject=next;video.muted=true;video.playsInline=true;video.autoplay=true;await video.play();stream=next;
 if(video.readyState<2||!video.videoWidth){await new Promise(function(resolve,reject){var timer=setTimeout(function(){cleanup();reject(new Error('The camera started but did not provide picture frames. Try reconnecting.'));},7000);function ready(){cleanup();resolve();}function cleanup(){clearTimeout(timer);video.removeEventListener('loadeddata',ready);video.removeEventListener('resize',ready);}video.addEventListener('loadeddata',ready,{once:true});video.addEventListener('resize',ready,{once:true});});}
 startComposer();
 if(room)await publishPhoneOutput();
}
async function connect(){
 if(connecting||room&&publishedTrack)return;
 connecting=true;el('connect-phone').disabled=true;
 try{
  if(!token())throw new Error('Sign in to ICF first. Use the Sign in button in Camera options, then this page will connect automatically.');
  if(!window.LivekitClient)throw new Error('LiveKit could not load. Check your internet connection and refresh.');
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('Camera access requires HTTPS and a supported mobile browser. Open this link directly in Chrome or Safari.');
  var slug=new URLSearchParams(location.search).get('slug');if(!slug)throw new Error('The QR/link is missing its broadcast code. Generate a fresh link from the ICF studio.');
  status('Checking the active ICF service…','info');
  var list=await request('/admin/broadcast/sessions'),session=(list.sessions||[]).find(function(s){return s.slug===slug;});
  if(!session)throw new Error('This ICF camera link does not match an existing broadcast. Generate a new QR code.');
  if(!['preparing','live'].includes(session.status))throw new Error('ICF_WAITING_FOR_LIVE');
  var credentials=await request('/admin/broadcast/sessions/'+session.id+'/camera-token','POST',{cameraName:(el('camera-name').value||'').trim()});
  trackName=credentials.trackName;retryCount=0;status('Requesting this phone’s camera permission…','info');
  await startDevice();room=new LivekitClient.Room({adaptiveStream:true,dynacast:true});
  room.on(LivekitClient.RoomEvent.Disconnected,function(){if(room){room=null;publishedTrack=null;}status('The studio connection was interrupted. Reconnect to resume sending video.','error');el('connect-phone').disabled=false;});
  await room.connect(credentials.serverUrl,credentials.token);await publishPhoneOutput();
  var settings=stream.getVideoTracks()[0].getSettings?stream.getVideoTracks()[0].getSettings():{},resolution=settings.width&&settings.height?settings.width+'×'+settings.height:'camera resolution selected automatically';
  el('flip-phone').disabled=false;el('pause-phone').disabled=false;el('disconnect-phone').disabled=false;
  el('connect-phone').textContent='Connected';el('camera-device-status').textContent='Connected as '+credentials.cameraName+'. Camera source: '+resolution+'. The outgoing feed is normalised to 16:9 landscape and uses enhanced HD encoding.';
  el('drawer-toggle').setAttribute('aria-label','Camera options · connected');keepAwake();
  status('Your phone is connected. Rotate to landscape for the widest, clearest broadcast picture. Video stays upright in the ICF studio.','live');
 }catch(e){
  if(e.message==='ICF_WAITING_FOR_LIVE'&&retryCount<45){retryCount++;status('Your QR link is recognised. Waiting for the operator to start the live service…','info');el('connect-phone').textContent='Waiting for studio…';setTimeout(function(){if(!room&&!connecting)connect();},2500);}
  else{status(e.message,'error');el('connect-phone').disabled=false;el('connect-phone').textContent='Try connect again';}
 }finally{connecting=false;}
}
async function flip(){
 try{facing=facing==='environment'?'user':'environment';status('Switching camera…','info');await startDevice();status('Camera switched. The landscape feed is continuing to the ICF studio.','live');}
 catch(e){facing=facing==='environment'?'user':'environment';status('Could not switch camera: '+e.message,'error');}
}
function togglePause(){
 if(!stream||!outputStream)return;paused=!paused;stream.getVideoTracks().forEach(function(t){t.enabled=!paused;});outputStream.getVideoTracks().forEach(function(t){t.enabled=!paused;});
 el('pause-phone').textContent=paused?'▶':'Ⅱ';el('pause-phone').setAttribute('aria-label',paused?'Resume camera':'Pause camera');
 status(paused?'Camera paused. Tap Resume to continue sending video.':'Camera resumed. Live video is being sent to the studio.','live');
}
async function disconnect(){
 try{
  if(room){if(publishedTrack){try{await room.localParticipant.unpublishTrack(publishedTrack);}catch(_e){}try{publishedTrack.stop();}catch(_e){}publishedTrack=null;}await room.disconnect();room=null;}
  stopComposer();if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}el('phone-preview').srcObject=null;
  el('flip-phone').disabled=true;el('pause-phone').disabled=true;el('pause-phone').textContent='Ⅱ';el('disconnect-phone').disabled=true;el('connect-phone').disabled=false;el('connect-phone').textContent='Connect camera';paused=false;
  if(wakeLock){try{await wakeLock.release();}catch(_e){}wakeLock=null;}status('Camera disconnected.','info');
 }catch(e){status(e.message,'error');}
}
function openSignIn(){var loginUrl=location.origin+'/?page=admin-login';window.open(loginUrl,'icf-admin-signin','noopener');status('Sign in in the new tab. This camera will connect automatically after successful administrator sign-in.','info');}
function toggleDrawer(){el('camera-drawer').classList.toggle('open');}
function fullscreen(){var target=el('camera-app');if(target.requestFullscreen)target.requestFullscreen().catch(function(){});else if(target.webkitRequestFullscreen)target.webkitRequestFullscreen();}
function orientationChanged(){if(outputCanvas&&outputContext)drawCameraFrame();}
el('connect-phone').addEventListener('click',connect);el('flip-phone').addEventListener('click',flip);el('pause-phone').addEventListener('click',togglePause);el('disconnect-phone').addEventListener('click',disconnect);
el('login-phone').addEventListener('click',openSignIn);el('drawer-toggle').addEventListener('click',toggleDrawer);el('fullscreen-phone').addEventListener('click',fullscreen);
window.addEventListener('storage',function(e){if(e.key==='icf_admin_token'&&e.newValue&&!room)connect();});
window.addEventListener('focus',function(){if(token()&&!room&&!connecting)connect();});
window.addEventListener('orientationchange',orientationChanged);window.addEventListener('resize',orientationChanged);
try{if(screen.orientation&&screen.orientation.addEventListener)screen.orientation.addEventListener('change',orientationChanged);}catch(_e){}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&token()&&!room&&!connecting)connect();if(document.visibilityState==='visible')keepAwake();});
window.addEventListener('beforeunload',function(){if(room)room.disconnect();stopComposer();if(stream)stream.getTracks().forEach(function(t){t.stop();});});
if(token())connect();else status('Scan the ICF camera QR code, then use Sign in under Options. This page will connect automatically after login.','info');
})();