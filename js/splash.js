/* Splash lifecycle: wait for app initialization, but never cover or trap the homepage. */
(function(){
 var startedAt=Date.now(), finished=false;
 function dismiss(timedOut){
  if(finished)return;
  finished=true;
  var splash=document.getElementById('icf-splash');
  if(!splash)return;
  if(timedOut){
   var status=document.getElementById('icf-splash-status');
   if(status)status.textContent='Homepage is available · some live updates may still be connecting';
  }
  splash.classList.add('is-leaving');
  window.setTimeout(function(){if(splash.parentNode)splash.parentNode.removeChild(splash);},260);
 }
 window.addEventListener('icf:app-ready',function(){
  var remaining=Math.max(0,1200-(Date.now()-startedAt));
  window.setTimeout(function(){dismiss(false);},remaining);
 },{once:true});
 window.setTimeout(function(){dismiss(true);},8000);
})();
