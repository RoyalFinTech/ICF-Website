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
  var adminToggle=document.getElementById('admin-menu-toggle');
  var adminSidebar=document.getElementById('admin-sidebar');
  var adminBackdrop=document.getElementById('admin-nav-backdrop');
  if(adminToggle&&adminToggle.dataset.bound!=='1'){
   adminToggle.dataset.bound='1';
   adminToggle.addEventListener('click',function(){
    var open=!document.body.classList.contains('icf-admin-menu-open');
    document.body.classList.toggle('icf-admin-menu-open',open);
    adminToggle.setAttribute('aria-expanded',open?'true':'false');
   });
  }
  if(adminBackdrop&&adminBackdrop.dataset.bound!=='1'){
   adminBackdrop.dataset.bound='1';
   adminBackdrop.addEventListener('click',function(){
    document.body.classList.remove('icf-admin-menu-open');
    if(adminToggle)adminToggle.setAttribute('aria-expanded','false');
   });
  }
  if(adminSidebar&&adminSidebar.dataset.bound!=='1'){
   adminSidebar.dataset.bound='1';
   adminSidebar.addEventListener('click',function(event){
    if(event.target.closest('.sidebar-item')){
     document.body.classList.remove('icf-admin-menu-open');
     if(adminToggle)adminToggle.setAttribute('aria-expanded','false');
    }
   });
  }
  var adminTheme=document.getElementById('admin-theme-btn');
  if(adminTheme&&adminTheme.dataset.bound!=='1'){
   adminTheme.dataset.bound='1';
   adminTheme.addEventListener('click',function(){if(typeof window.toggleTheme==='function')window.toggleTheme();});
  }
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
 document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
   document.body.classList.remove('icf-admin-menu-open');
   var adminToggle=document.getElementById('admin-menu-toggle');
   if(adminToggle)adminToggle.setAttribute('aria-expanded','false');
  }
 });
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