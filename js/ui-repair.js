(function(){
 function closeMobileNav(){
  var nav=document.getElementById('nav-mobile');
  if(!nav)return;
  nav.classList.remove('open');
  document.body.classList.remove('icf-menu-open');
  var btn=document.querySelector('.nav-hamburger');
  if(btn)btn.setAttribute('aria-expanded','false');
 }
 function repairICFUI(){
  var nav=document.getElementById('nav-mobile');
  var btn=document.querySelector('.nav-hamburger');
  if(btn){
   btn.type='button';
   btn.removeAttribute('onclick');
   btn.setAttribute('aria-controls','nav-mobile');
   btn.setAttribute('aria-expanded',nav&&nav.classList.contains('open')?'true':'false');
   if(btn.dataset.icfMenuBound!=='1'){
    btn.dataset.icfMenuBound='1';
    btn.addEventListener('click',function(){
     var menu=document.getElementById('nav-mobile');
     if(!menu)return;
     var open=menu.classList.toggle('open');
     document.body.classList.toggle('icf-menu-open',open);
     btn.setAttribute('aria-expanded',open?'true':'false');
    });
   }
  }
  document.querySelectorAll('img[data-logo="1"]').forEach(function(img){
   if(!img.getAttribute('src'))img.src='/icf-logo-transparent.png';
   if(img.dataset.icfLogoGuard!=='1'){
    img.dataset.icfLogoGuard='1';
    img.addEventListener('error',function(){
     if(img.src.indexOf('/icf-logo-transparent.png')===-1)img.src='/icf-logo-transparent.png';
    },{once:true});
   }
  });
  var footer=document.getElementById('footer');
  if(footer){footer.style.display='block';footer.style.visibility='visible';}
 }
 document.addEventListener('click',function(e){
  var nav=document.getElementById('nav-mobile');
  if(!nav||!nav.classList.contains('open'))return;
  if(e.target.closest('#nav-mobile')){
   if(e.target.closest('a,button'))closeMobileNav();
  }else if(!e.target.closest('.nav-hamburger'))closeMobileNav();
 });
 // If the main application bundle fails to load, keep primary page navigation usable.
 document.addEventListener('click',function(e){
  if(typeof window.navigate==='function')return;
  var control=e.target.closest('[onclick*="navigate("]');
  if(!control)return;
  var match=(control.getAttribute('onclick')||'').match(/navigate\(['"]([a-z-]+)['"]\)/);
  if(!match)return;
  e.preventDefault();
  document.querySelectorAll('.page').forEach(function(page){page.classList.remove('active');});
  var page=document.getElementById('page-'+match[1]);
  if(page)page.classList.add('active');
  closeMobileNav();
  window.scrollTo(0,0);
 },true);
 document.addEventListener('DOMContentLoaded',repairICFUI);
 window.addEventListener('load',repairICFUI);
})();