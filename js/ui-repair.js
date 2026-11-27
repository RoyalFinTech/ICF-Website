(function(){
 function repairICFUI(){
  var nav=document.getElementById('nav-mobile');
  var btn=document.querySelector('.nav-hamburger');
  if(btn){btn.setAttribute('aria-controls','nav-mobile');btn.setAttribute('aria-expanded',nav&&nav.classList.contains('open')?'true':'false');}
  document.querySelectorAll('img[data-logo="1"]').forEach(function(img){
   if(!img.getAttribute('src'))img.src='/icf-logo-transparent.png';
   img.addEventListener('error',function(){if(img.src.indexOf('/icf-logo-transparent.png')===-1)img.src='/icf-logo-transparent.png';},{once:true});
  });
  var footer=document.getElementById('footer');if(footer){footer.style.display='block';footer.style.visibility='visible';}
 }
 window.toggleMobileNav=function(){
  var nav=document.getElementById('nav-mobile');if(!nav)return;
  var open=nav.classList.toggle('open');
  var btn=document.querySelector('.nav-hamburger');if(btn)btn.setAttribute('aria-expanded',open?'true':'false');
  document.body.classList.toggle('icf-menu-open',open);
 };
 document.addEventListener('click',function(e){
  var nav=document.getElementById('nav-mobile');if(!nav||!nav.classList.contains('open'))return;
  if(e.target.closest('#nav-mobile')){if(e.target.closest('a,button')){nav.classList.remove('open');document.body.classList.remove('icf-menu-open');var b=document.querySelector('.nav-hamburger');if(b)b.setAttribute('aria-expanded','false');}}
  else if(!e.target.closest('.nav-hamburger')){nav.classList.remove('open');document.body.classList.remove('icf-menu-open');}
 });
 document.addEventListener('DOMContentLoaded',repairICFUI);
 window.addEventListener('load',repairICFUI);
})();
