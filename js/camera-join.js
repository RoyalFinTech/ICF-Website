(function(){
'use strict';
var room=null,stream=null,publishedTrack=null,paused=false,facing='environment',connecting=false,wakeLock=null,trackName='';
function el(id){return document.getElementById(id);}
function status(message,kind){var e=el('camera-status'),s=el('live-state');if(e)e.textContent=message||'';if(s){s.dataset.kind=kind||'info';s.textContent=kind==='live'?'CONNECTED':kind==='error'?'CONNECTION ERROR':'READY';}}
function token(){return localStorage.getItem('icf_admin_token')||'';}
async function request(path,method,body){var headers={'Authorization':'Bearer '+token()};if(body!==undefined)headers['Content-Type']='application/json';var r=await fetch('/api'+path,{method:method||'GET',headers:headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});var d=await r.json().catch(function(){return {};});if(!r.ok)throw new Error(d.error||'Request failed ('+r.status+').');return d;}
async function keepAwake(){try{if('wakeLock'in navigator)wakeLock=await navigator.wakeLock.request('screen');}catch(_e){}}
async function startDevice(){
 if(room&&publishedTrack){try{await room.localParticipant.unpublishTrack(publishedTrack);}catch(_e){}publishedTrack.stop();publishedTrack=null;}
 if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}
 var next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30,max:30}},audio:false});
 var video=el('phone-preview');video.srcObject=next;video.muted=true;video.playsInline=true;video.autoplay=true;await video.play();stream=next;
 if(room){publishedTrack=new LivekitClient.LocalVideoTrack(next.getVideoTracks()[0]);await room.localParticipant.publishTrack(publishedTrack,{name:trackName});}
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
  if(!session||!['preparing','live'].includes(session.status))throw new Error('The ICF operator must start the broadcast before this phone can join.');
  var credentials=await request('/admin/broadcast/sessions/'+session.id+'/camera-token','POST',{cameraName:el('camera-name').value||'Phone camera'});
  trackName=credentials.trackName;
  status('Requesting this phone’s camera permission…','info');await startDevice();
  room=new LivekitClient.Room({adaptiveStream:true,dynacast:true});
  room.on(LivekitClient.RoomEvent.Disconnected,function(){if(room){room=null;publishedTrack=null;}status('The studio connection was interrupted. Reconnect to resume sending video.','error');el('connect-phone').disabled=false;});
  await room.connect(credentials.serverUrl,credentials.token);
  publishedTrack=new LivekitClient.LocalVideoTrack(stream.getVideoTracks()[0]);
  await room.localParticipant.publishTrack(publishedTrack,{name:trackName});
  el('flip-phone').disabled=false;el('pause-phone').disabled=false;el('disconnect-phone').disabled=false;
  el('connect-phone').textContent='Connected';el('camera-device-status').textContent='Connected as '+credentials.cameraName+'. The operator can now select this feed in the camera roster.';
  el('drawer-toggle').setAttribute('aria-label','Camera options · connected');keepAwake();
  status('Your live camera is connected to the ICF Worship Studio. Keep this page open while filming.','live');
 }catch(e){status(e.message,'error');el('connect-phone').disabled=false;el('connect-phone').textContent='Try connect again';}
 finally{connecting=false;}
}
async function flip(){
 try{facing=facing==='environment'?'user':'environment';status('Switching camera…','info');await startDevice();status('Camera switched. Live video is continuing to the ICF studio.','live');}
 catch(e){facing=facing==='environment'?'user':'environment';status('Could not switch camera: '+e.message,'error');}
}
function togglePause(){
 if(!stream)return;paused=!paused;stream.getVideoTracks().forEach(function(t){t.enabled=!paused;});
 el('pause-phone').textContent=paused?'▶':'Ⅱ';el('pause-phone').setAttribute('aria-label',paused?'Resume camera':'Pause camera');
 status(paused?'Camera paused. Tap Resume to continue sending video.':'Camera resumed. Live video is being sent to the studio.','live');
}
async function disconnect(){
 try{if(room){if(publishedTrack){try{await room.localParticipant.unpublishTrack(publishedTrack);}catch(_e){}publishedTrack.stop();publishedTrack=null;}await room.disconnect();room=null;}
  if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}el('phone-preview').srcObject=null;
  el('flip-phone').disabled=true;el('pause-phone').disabled=true;el('pause-phone').textContent='Ⅱ';el('disconnect-phone').disabled=true;el('connect-phone').disabled=false;el('connect-phone').textContent='Connect camera';paused=false;
  if(wakeLock){try{await wakeLock.release();}catch(_e){}wakeLock=null;}status('Camera disconnected.','info');}
 catch(e){status(e.message,'error');}
}
function openSignIn(){var loginUrl=location.origin+'/?page=admin-login';window.open(loginUrl,'icf-admin-signin','noopener');status('Sign in in the new tab. This camera will connect automatically after successful administrator sign-in.','info');}
function toggleDrawer(){el('camera-drawer').classList.toggle('open');}
function fullscreen(){var target=el('camera-app');if(target.requestFullscreen)target.requestFullscreen().catch(function(){});else if(target.webkitRequestFullscreen)target.webkitRequestFullscreen();}
el('connect-phone').addEventListener('click',connect);el('flip-phone').addEventListener('click',flip);el('pause-phone').addEventListener('click',togglePause);el('disconnect-phone').addEventListener('click',disconnect);
el('login-phone').addEventListener('click',openSignIn);el('drawer-toggle').addEventListener('click',toggleDrawer);el('fullscreen-phone').addEventListener('click',fullscreen);
window.addEventListener('storage',function(e){if(e.key==='icf_admin_token'&&e.newValue&&!room)connect();});
window.addEventListener('focus',function(){if(token()&&!room&&!connecting)connect();});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&token()&&!room&&!connecting)connect();if(document.visibilityState==='visible')keepAwake();});
window.addEventListener('beforeunload',function(){if(room)room.disconnect();if(stream)stream.getTracks().forEach(function(t){t.stop();});});
if(token())connect();else status('Scan the ICF camera QR code, then use Sign in under Options. This page will connect automatically after login.','info');
})();