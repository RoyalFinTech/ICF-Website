

/* ICF monthly theme and hero slider */
let icfHeroIndex=0,icfHeroTimer=null;
function icfHeroGo(index){
  if(window.ICFHeroSlider){window.ICFHeroSlider.go(index);icfHeroIndex=window.ICFHeroSlider.index;return;}
  const slides=[...document.querySelectorAll(".icf-hero-slide")],dots=[...document.querySelectorAll(".icf-hero-dots button")];
  if(!slides.length)return;
  icfHeroIndex=(index+slides.length)%slides.length;
  slides.forEach((slide,i)=>{
    slide.classList.toggle("active",i===icfHeroIndex);
    if(i===icfHeroIndex){const image=slide.querySelector("img[data-src]");if(image){const source=image.getAttribute("data-src");if(source){image.src=source;image.removeAttribute("data-src");}}}
  });
  dots.forEach((dot,i)=>dot.classList.toggle("active",i===icfHeroIndex));
}
function icfHeroMove(step){
  if(window.ICFHeroSlider){window.ICFHeroSlider.move(step);icfHeroIndex=window.ICFHeroSlider.index;return;}
  icfHeroGo(icfHeroIndex+step);icfHeroStart();
}
function icfHeroStart(){
  if(window.ICFHeroSlider){window.ICFHeroSlider.start();icfHeroIndex=window.ICFHeroSlider.index;return;}
  if(icfHeroTimer)clearInterval(icfHeroTimer);
  const slides=document.querySelectorAll(".icf-hero-slide");
  if(slides.length>1)icfHeroTimer=setInterval(()=>icfHeroGo(icfHeroIndex+1),5000);
}
function icfThemeData(){
 const settings=DB.get("siteSettings",{});
 const defaults={enabled:true,theme:"Living by Grace in Holiness",month:"November",verse:"God’s grace trains us to live godly lives. — Titus 2:11–12",ticker:"Grace • Holiness • Obedience • Christlikeness",slide1:"church-worship-service.jpg",slide2:"church-mummy-prayer.jpg",slide3:"church-baptism-group.jpg"};
 const saved=settings.icfThemeSlider;
 if(!saved)return defaults;
 const data=Object.assign({},defaults,saved);
 if(String(data.month||"").toLowerCase()==="october" || data.theme==="The Power of Prayer"){
  data.theme=defaults.theme;data.month=defaults.month;data.verse=defaults.verse;data.ticker=defaults.ticker;
  if(!data.slide1 || data.slide1==="church-mummy-prayer.jpg")data.slide1=defaults.slide1;
 }
 return data;
}
function icfThemeSettingsHTML(){const s=icfThemeData();return '<div class="admin-section-head"><div><h2>🎞️ Theme & Hero Slider</h2><p>Manage the monthly theme ribbon and homepage slides.</p></div></div><div class="card"><div class="card-body"><label class="form-label">Monthly theme</label><input class="form-control" id="icf-theme-name" value="'+escH(s.theme||"The Power of Prayer")+'"><label class="form-label" style="margin-top:12px">Month label</label><input class="form-control" id="icf-theme-month" value="'+escH(s.month||"October")+'"><label class="form-label" style="margin-top:12px">Scripture / verse</label><input class="form-control" id="icf-theme-verse" value="'+escH(s.verse||"")+'"><label class="form-label" style="margin-top:12px">Scrolling message</label><textarea class="form-control" id="icf-theme-ticker" rows="2">'+escH(s.ticker||"")+'</textarea><label class="form-label" style="margin-top:12px">Hero image 1 URL / path</label><input class="form-control" id="icf-theme-slide1" value="'+escH(s.slide1||"church-mummy-prayer.jpg")+'"><label class="form-label" style="margin-top:12px">Hero image 2 URL / path</label><input class="form-control" id="icf-theme-slide2" value="'+escH(s.slide2||"church-worship-service.jpg")+'"><label class="form-label" style="margin-top:12px">Hero image 3 URL / path</label><input class="form-control" id="icf-theme-slide3" value="'+escH(s.slide3||"church-baptism-group.jpg")+'"><label style="display:flex;gap:10px;align-items:center;margin:16px 0"><input type="checkbox" id="icf-theme-enabled" '+(s.enabled!==false?"checked":"")+' > Show the monthly scrolling ribbon</label><button class="btn btn-primary" onclick="saveIcfThemeSettings()">💾 Save & Publish</button><p class="form-hint">The monthly theme appears consistently across pages. Hero image publishing will be available through the media library once the uploaded images are added.</p></div></div>';}
function saveIcfThemeSettings(){const settings=DB.get("siteSettings",{});const old=icfThemeData();const value={...old,theme:document.getElementById("icf-theme-name").value.trim(),month:document.getElementById("icf-theme-month").value.trim(),verse:document.getElementById("icf-theme-verse").value.trim(),ticker:document.getElementById("icf-theme-ticker").value.trim(),slide1:document.getElementById("icf-theme-slide1").value.trim(),slide2:document.getElementById("icf-theme-slide2").value.trim(),slide3:document.getElementById("icf-theme-slide3").value.trim(),enabled:document.getElementById("icf-theme-enabled").checked,updatedAt:new Date().toISOString()};DB.set("siteSettings",{...settings,icfThemeSlider:value});icfApplyThemeSettings();toast("Theme settings published","Your monthly theme has been updated.","success");}
function icfApplyThemeSettings(){
 const s=icfThemeData();if(!s)return;
 const imgs=document.querySelectorAll(".icf-hero-image");
 [s.slide1,s.slide2,s.slide3].forEach((src,i)=>{
  if(!src||!imgs[i])return;
  if(i===0){imgs[i].src=src;}
  else {imgs[i].setAttribute("data-src",src);if(imgs[i].getAttribute("src"))imgs[i].removeAttribute("src");}
 });
 const firstSlide=document.querySelector('.icf-hero-slide[data-slide="0"]');
 if(firstSlide){
  const eyebrow=firstSlide.querySelector(".icf-eyebrow");
  const heading=firstSlide.querySelector("h1");
  const verse=firstSlide.querySelector(".icf-hero-verse");
  const description=firstSlide.querySelector(".icf-hero-copy > p:not(.icf-hero-verse)");
  if(eyebrow)eyebrow.textContent="✦ "+String(s.month||"Monthly").toUpperCase()+" MONTHLY THEME ✦";
  if(heading)heading.textContent=s.theme||"";
  if(verse)verse.textContent="📖 "+(s.verse||"");
  if(description)description.textContent="Live by God’s grace, grow in holiness, and reflect the character of Jesus in daily life.";
  if(imgs[0])imgs[0].alt=String(s.month||"Monthly")+" theme: "+String(s.theme||"");
 }
 const ribbon=document.getElementById("icf-theme-ribbon");
 if(ribbon)ribbon.style.display=s.enabled===false?"none":"";
 const spans=document.querySelectorAll(".icf-ribbon-content span");
 if(spans.length){
  spans[0].innerHTML="✨ <strong>"+escH((s.month||"Monthly")+" THEME: "+(s.theme||""))+"</strong>";
  spans[1].textContent="📖 "+(s.verse||"");
  spans[2].textContent="🙏 "+(s.ticker||"");
  spans[4].innerHTML=spans[0].innerHTML;
  spans[5].textContent=spans[1].textContent;
  spans[6].textContent=spans[2].textContent;
 }
}

/* ══════════════════════════════════════════════════════════
   LOGO — inlined once as base64 and applied to every logo
   <img data-logo="1"> on the page. This guarantees the logo
   always renders with zero external file dependency, no
   matter how or where this single HTML file is opened.
   Source file: /icf-logo-transparent.png (official transparent ICF logo).
   ══════════════════════════════════════════════════════════ */
/* Official PNG logo URLs are assigned in the HTML before the application boot. */

/* ══ COUNTRY + PHONE CODE DATA ══ */
const COUNTRIES = [
  {code:'GM',name:'The Gambia',flag:'🇬🇲',dialCode:'+220'},
  {code:'NG',name:'Nigeria',flag:'🇳🇬',dialCode:'+234'},
  {code:'SN',name:'Senegal',flag:'🇸🇳',dialCode:'+221'},
  {code:'GH',name:'Ghana',flag:'🇬🇭',dialCode:'+233'},
  {code:'SL',name:'Sierra Leone',flag:'🇸🇱',dialCode:'+232'},
  {code:'LR',name:'Liberia',flag:'🇱🇷',dialCode:'+231'},
  {code:'GN',name:'Guinea',flag:'🇬🇳',dialCode:'+224'},
  {code:'GW',name:'Guinea-Bissau',flag:'🇬🇼',dialCode:'+245'},
  {code:'CV',name:'Cape Verde',flag:'🇨🇻',dialCode:'+238'},
  {code:'MR',name:'Mauritania',flag:'🇲🇷',dialCode:'+222'},
  {code:'ML',name:'Mali',flag:'🇲🇱',dialCode:'+223'},
  {code:'BF',name:'Burkina Faso',flag:'🇧🇫',dialCode:'+226'},
  {code:'CI',name:"Cote d'Ivoire",flag:'🇨🇮',dialCode:'+225'},
  {code:'TG',name:'Togo',flag:'🇹🇬',dialCode:'+228'},
  {code:'BJ',name:'Benin',flag:'🇧🇯',dialCode:'+229'},
  {code:'NE',name:'Niger',flag:'🇳🇪',dialCode:'+227'},
  {code:'CM',name:'Cameroon',flag:'🇨🇲',dialCode:'+237'},
  {code:'KE',name:'Kenya',flag:'🇰🇪',dialCode:'+254'},
  {code:'TZ',name:'Tanzania',flag:'🇹🇿',dialCode:'+255'},
  {code:'UG',name:'Uganda',flag:'🇺🇬',dialCode:'+256'},
  {code:'RW',name:'Rwanda',flag:'🇷🇼',dialCode:'+250'},
  {code:'ET',name:'Ethiopia',flag:'🇪🇹',dialCode:'+251'},
  {code:'ZA',name:'South Africa',flag:'🇿🇦',dialCode:'+27'},
  {code:'ZW',name:'Zimbabwe',flag:'🇿🇼',dialCode:'+263'},
  {code:'ZM',name:'Zambia',flag:'🇿🇲',dialCode:'+260'},
  {code:'MW',name:'Malawi',flag:'🇲🇼',dialCode:'+265'},
  {code:'MZ',name:'Mozambique',flag:'🇲🇿',dialCode:'+258'},
  {code:'AO',name:'Angola',flag:'🇦🇴',dialCode:'+244'},
  {code:'CD',name:'DR Congo',flag:'🇨🇩',dialCode:'+243'},
  {code:'CG',name:'Congo',flag:'🇨🇬',dialCode:'+242'},
  {code:'GA',name:'Gabon',flag:'🇬🇦',dialCode:'+241'},
  {code:'GQ',name:'Equatorial Guinea',flag:'🇬🇶',dialCode:'+240'},
  {code:'SD',name:'Sudan',flag:'🇸🇩',dialCode:'+249'},
  {code:'SS',name:'South Sudan',flag:'🇸🇸',dialCode:'+211'},
  {code:'EG',name:'Egypt',flag:'🇪🇬',dialCode:'+20'},
  {code:'MA',name:'Morocco',flag:'🇲🇦',dialCode:'+212'},
  {code:'TN',name:'Tunisia',flag:'🇹🇳',dialCode:'+216'},
  {code:'DZ',name:'Algeria',flag:'🇩🇿',dialCode:'+213'},
  {code:'LY',name:'Libya',flag:'🇱🇾',dialCode:'+218'},
  {code:'SO',name:'Somalia',flag:'🇸🇴',dialCode:'+252'},
  {code:'ER',name:'Eritrea',flag:'🇪🇷',dialCode:'+291'},
  {code:'DJ',name:'Djibouti',flag:'🇩🇯',dialCode:'+253'},
  {code:'MG',name:'Madagascar',flag:'🇲🇬',dialCode:'+261'},
  {code:'SC',name:'Seychelles',flag:'🇸🇨',dialCode:'+248'},
  {code:'MU',name:'Mauritius',flag:'🇲🇺',dialCode:'+230'},
  {code:'BW',name:'Botswana',flag:'🇧🇼',dialCode:'+267'},
  {code:'NA',name:'Namibia',flag:'🇳🇦',dialCode:'+264'},
  {code:'LS',name:'Lesotho',flag:'🇱🇸',dialCode:'+266'},
  {code:'SZ',name:'Eswatini',flag:'🇸🇿',dialCode:'+268'},
  {code:'US',name:'United States',flag:'🇺🇸',dialCode:'+1'},
  {code:'GB',name:'United Kingdom',flag:'🇬🇧',dialCode:'+44'},
  {code:'CA',name:'Canada',flag:'🇨🇦',dialCode:'+1'},
  {code:'AU',name:'Australia',flag:'🇦🇺',dialCode:'+61'},
  {code:'NZ',name:'New Zealand',flag:'🇳🇿',dialCode:'+64'},
  {code:'IE',name:'Ireland',flag:'🇮🇪',dialCode:'+353'},
  {code:'DE',name:'Germany',flag:'🇩🇪',dialCode:'+49'},
  {code:'FR',name:'France',flag:'🇫🇷',dialCode:'+33'},
  {code:'ES',name:'Spain',flag:'🇪🇸',dialCode:'+34'},
  {code:'IT',name:'Italy',flag:'🇮🇹',dialCode:'+39'},
  {code:'PT',name:'Portugal',flag:'🇵🇹',dialCode:'+351'},
  {code:'NL',name:'Netherlands',flag:'🇳🇱',dialCode:'+31'},
  {code:'BE',name:'Belgium',flag:'🇧🇪',dialCode:'+32'},
  {code:'SE',name:'Sweden',flag:'🇸🇪',dialCode:'+46'},
  {code:'NO',name:'Norway',flag:'🇳🇴',dialCode:'+47'},
  {code:'DK',name:'Denmark',flag:'🇩🇰',dialCode:'+45'},
  {code:'FI',name:'Finland',flag:'🇫🇮',dialCode:'+358'},
  {code:'CH',name:'Switzerland',flag:'🇨🇭',dialCode:'+41'},
  {code:'AT',name:'Austria',flag:'🇦🇹',dialCode:'+43'},
  {code:'PL',name:'Poland',flag:'🇵🇱',dialCode:'+48'},
  {code:'RU',name:'Russia',flag:'🇷🇺',dialCode:'+7'},
  {code:'TR',name:'Turkey',flag:'🇹🇷',dialCode:'+90'},
  {code:'SA',name:'Saudi Arabia',flag:'🇸🇦',dialCode:'+966'},
  {code:'AE',name:'UAE',flag:'🇦🇪',dialCode:'+971'},
  {code:'IN',name:'India',flag:'🇮🇳',dialCode:'+91'},
  {code:'CN',name:'China',flag:'🇨🇳',dialCode:'+86'},
  {code:'JP',name:'Japan',flag:'🇯🇵',dialCode:'+81'},
  {code:'KR',name:'South Korea',flag:'🇰🇷',dialCode:'+82'},
  {code:'BR',name:'Brazil',flag:'🇧🇷',dialCode:'+55'},
  {code:'MX',name:'Mexico',flag:'🇲🇽',dialCode:'+52'},
  {code:'AR',name:'Argentina',flag:'🇦🇷',dialCode:'+54'},
  {code:'CO',name:'Colombia',flag:'🇨🇴',dialCode:'+57'},
  {code:'PH',name:'Philippines',flag:'🇵🇭',dialCode:'+63'},
  {code:'SG',name:'Singapore',flag:'🇸🇬',dialCode:'+65'},
  {code:'MY',name:'Malaysia',flag:'🇲🇾',dialCode:'+60'},
  {code:'ID',name:'Indonesia',flag:'🇮🇩',dialCode:'+62'},
  {code:'PK',name:'Pakistan',flag:'🇵🇰',dialCode:'+92'},
  {code:'BD',name:'Bangladesh',flag:'🇧🇩',dialCode:'+880'},
  {code:'GR',name:'Greece',flag:'🇬🇷',dialCode:'+30'},
  {code:'CZ',name:'Czech Republic',flag:'🇨🇿',dialCode:'+420'},
  {code:'HU',name:'Hungary',flag:'🇭🇺',dialCode:'+36'},
  {code:'RO',name:'Romania',flag:'🇷🇴',dialCode:'+40'},
  {code:'UA',name:'Ukraine',flag:'🇺🇦',dialCode:'+380'},
  {code:'IL',name:'Israel',flag:'🇮🇱',dialCode:'+972'},
  {code:'LB',name:'Lebanon',flag:'🇱🇧',dialCode:'+961'},
  {code:'JO',name:'Jordan',flag:'🇯🇴',dialCode:'+962'},
  {code:'TH',name:'Thailand',flag:'🇹🇭',dialCode:'+66'},
  {code:'VN',name:'Vietnam',flag:'🇻🇳',dialCode:'+84'},
  {code:'TW',name:'Taiwan',flag:'🇹🇼',dialCode:'+886'},
  {code:'HK',name:'Hong Kong',flag:'🇭🇰',dialCode:'+852'},
];

/* ══ LANGUAGE DATA ══ */
const LANGUAGES = [
  // International
  {code:'en',name:'English',native:'English',flag:'🇬🇧',rtl:false},
  {code:'fr',name:'French',native:'Français',flag:'🇫🇷',rtl:false},
  {code:'es',name:'Spanish',native:'Español',flag:'🇪🇸',rtl:false},
  {code:'pt',name:'Portuguese',native:'Português',flag:'🇵🇹',rtl:false},
  {code:'ar',name:'Arabic',native:'العربية',flag:'🇸🇦',rtl:true},
  {code:'de',name:'German',native:'Deutsch',flag:'🇩🇪',rtl:false},
  {code:'it',name:'Italian',native:'Italiano',flag:'🇮🇹',rtl:false},
  {code:'ru',name:'Russian',native:'Русский',flag:'🇷🇺',rtl:false},
  {code:'zh',name:'Chinese (Simplified)',native:'中文(简体)',flag:'🇨🇳',rtl:false},
  {code:'zh-TW',name:'Chinese (Traditional)',native:'中文(繁體)',flag:'🇹🇼',rtl:false},
  {code:'ja',name:'Japanese',native:'日本語',flag:'🇯🇵',rtl:false},
  {code:'ko',name:'Korean',native:'한국어',flag:'🇰🇷',rtl:false},
  {code:'hi',name:'Hindi',native:'हिन्दी',flag:'🇮🇳',rtl:false},
  {code:'tr',name:'Turkish',native:'Türkçe',flag:'🇹🇷',rtl:false},
  {code:'nl',name:'Dutch',native:'Nederlands',flag:'🇳🇱',rtl:false},
  {code:'sv',name:'Swedish',native:'Svenska',flag:'🇸🇪',rtl:false},
  // African
  {code:'wo',name:'Wolof',native:'Wolof',flag:'🇸🇳',rtl:false},
  {code:'man',name:'Mandinka',native:'Mandinka',flag:'🇬🇲',rtl:false},
  {code:'ff',name:'Fula (Fulani)',native:'Fulfulde',flag:'🇬🇳',rtl:false},
  {code:'jo',name:'Jola',native:'Jola',flag:'🇬🇲',rtl:false},
  {code:'sr',name:'Serer',native:'Serer',flag:'🇸🇳',rtl:false},
  {code:'ak',name:'Aku',native:'Aku',flag:'🇬🇲',rtl:false},
  {code:'ha',name:'Hausa',native:'Hausa',flag:'🇳🇬',rtl:false},
  {code:'yo',name:'Yoruba',native:'Yorùbá',flag:'🇳🇬',rtl:false},
  {code:'ig',name:'Igbo',native:'Igbo',flag:'🇳🇬',rtl:false},
  {code:'sw',name:'Swahili',native:'Kiswahili',flag:'🇰🇪',rtl:false},
  {code:'zu',name:'Zulu',native:'isiZulu',flag:'🇿🇦',rtl:false},
  {code:'xh',name:'Xhosa',native:'isiXhosa',flag:'🇿🇦',rtl:false},
  {code:'am',name:'Amharic',native:'አማርኛ',flag:'🇪🇹',rtl:false},
  {code:'om',name:'Oromo',native:'Oromoo',flag:'🇪🇹',rtl:false},
  {code:'tw',name:'Twi',native:'Twi',flag:'🇬🇭',rtl:false},
  {code:'ee',name:'Ewe',native:'Eʋegbe',flag:'🇬🇭',rtl:false},
  {code:'sn',name:'Shona',native:'chiShona',flag:'🇿🇼',rtl:false},
  {code:'nd',name:'Ndebele',native:'isiNdebele',flag:'🇿🇼',rtl:false},
  {code:'ln',name:'Lingala',native:'Lingála',flag:'🇨🇩',rtl:false},
  {code:'rw',name:'Kinyarwanda',native:'Kinyarwanda',flag:'🇷🇼',rtl:false},
];

/* ══ TRANSLATIONS ══ */
const T = {
  en:{
    home:'Home',about:'About',ministries:'Ministries',events:'Events',
    prayer:'Prayer',baptism:'Baptism',contact:'Contact',sermons:'Sermons',
    news:'News',login:'Login',signup:'Sign Up',admin:'Admin',
    joinChurch:'Join Our Church',submitPrayer:'Submit Prayer',upcomingEvents:'Upcoming Events',
    welcomeTitle:'International Christian Fellowship',
    welcomeSub:'"Pleasing God Is All About Jesus."',
    ourMinistries:'Our Ministries',joinWorship:'Join Us for Worship',
    fullName:'Full Name',phoneNumber:'Phone Number',email:'Email Address',
    address:'Residential Address / Location',password:'Password',
    confirmPassword:'Confirm Password',nationality:'Nationality',
    createAccount:'Create Account',signIn:'Sign In',
    prayerRequests:'Prayer Requests',bookBaptism:'Book My Baptism',
    sendMessage:'Send Message',submitRequest:'Submit Request',
    submitBooking:'Submit Booking',cancel:'Cancel',
    allWelcome:'All are welcome at ICF Solution Centre, Mariama Kunda',
    pleaseEnter:'Please enter',yourName:'your name',
    dashboard:'Dashboard',members:'Members',baptisms:'Baptisms',
    settings:'Settings',logout:'Logout',analytics:'Analytics',
    announcements:'Announcements',gallery:'Gallery',
    selectLanguage:'Language',selectNationality:'Select your nationality',
    searchCountry:'Search country...',
  },
  fr:{
    home:'Accueil',about:'À Propos',ministries:'Ministères',events:'Événements',
    prayer:'Prière',baptism:'Baptême',contact:'Contact',sermons:'Sermons',
    news:'Nouvelles',login:'Connexion',signup:"S'inscrire",admin:'Admin',
    joinChurch:'Rejoindre Notre Église',submitPrayer:'Soumettre une Prière',upcomingEvents:'Événements à Venir',
    welcomeTitle:'Communauté Chrétienne Internationale',
    welcomeSub:'"Plaire à Dieu, c\'est tout Jésus."',
    ourMinistries:'Nos Ministères',joinWorship:'Rejoignez-nous pour Adorer',
    fullName:'Nom Complet',phoneNumber:'Numéro de Téléphone',email:'Adresse Email',
    address:'Adresse Résidentielle / Lieu',password:'Mot de Passe',
    confirmPassword:'Confirmer le Mot de Passe',nationality:'Nationalité',
    createAccount:'Créer un Compte',signIn:'Se Connecter',
    prayerRequests:'Demandes de Prière',bookBaptism:'Réserver mon Baptême',
    sendMessage:'Envoyer le Message',submitRequest:'Soumettre la Demande',
    submitBooking:'Soumettre la Réservation',cancel:'Annuler',
    allWelcome:'Tous sont bienvenus au Centre de Solutions ICF',
    pleaseEnter:'Veuillez entrer',yourName:'votre nom',
    dashboard:'Tableau de Bord',members:'Membres',baptisms:'Baptêmes',
    settings:'Paramètres',logout:'Déconnexion',analytics:'Analytiques',
    announcements:'Annonces',gallery:'Galerie',
    selectLanguage:'Langue',selectNationality:'Sélectionnez votre nationalité',
    searchCountry:'Rechercher un pays...',
  },
  es:{
    home:'Inicio',about:'Acerca de',ministries:'Ministerios',events:'Eventos',
    prayer:'Oración',baptism:'Bautismo',contact:'Contacto',sermons:'Sermones',
    news:'Noticias',login:'Iniciar Sesión',signup:'Registrarse',admin:'Admin',
    joinChurch:'Únase a Nuestra Iglesia',submitPrayer:'Enviar Oración',upcomingEvents:'Próximos Eventos',
    welcomeTitle:'Comunidad Cristiana Internacional',
    welcomeSub:'"Agradar a Dios es todo sobre Jesús."',
    ourMinistries:'Nuestros Ministerios',joinWorship:'Únase a Nosotros en Adoración',
    fullName:'Nombre Completo',phoneNumber:'Número de Teléfono',email:'Correo Electrónico',
    address:'Dirección Residencial / Ubicación',password:'Contraseña',
    confirmPassword:'Confirmar Contraseña',nationality:'Nacionalidad',
    createAccount:'Crear Cuenta',signIn:'Iniciar Sesión',
    prayerRequests:'Peticiones de Oración',bookBaptism:'Reservar mi Bautismo',
    sendMessage:'Enviar Mensaje',submitRequest:'Enviar Solicitud',
    submitBooking:'Enviar Reserva',cancel:'Cancelar',
    allWelcome:'Todos son bienvenidos al Centro de Soluciones ICF',
    pleaseEnter:'Por favor ingrese',yourName:'su nombre',
    dashboard:'Tablero',members:'Miembros',baptisms:'Bautismos',
    settings:'Configuración',logout:'Cerrar Sesión',analytics:'Análisis',
    announcements:'Anuncios',gallery:'Galería',
    selectLanguage:'Idioma',selectNationality:'Seleccione su nacionalidad',
    searchCountry:'Buscar país...',
  },
  pt:{
    home:'Início',about:'Sobre',ministries:'Ministérios',events:'Eventos',
    prayer:'Oração',baptism:'Batismo',contact:'Contato',sermons:'Sermões',
    news:'Notícias',login:'Entrar',signup:'Cadastrar',admin:'Admin',
    joinChurch:'Junte-se à Nossa Igreja',submitPrayer:'Enviar Oração',upcomingEvents:'Próximos Eventos',
    welcomeTitle:'Comunidade Cristã Internacional',
    welcomeSub:'"Agradar a Deus é tudo sobre Jesus."',
    ourMinistries:'Nossos Ministérios',joinWorship:'Junte-se a Nós no Culto',
    fullName:'Nome Completo',phoneNumber:'Número de Telefone',email:'Endereço de E-mail',
    address:'Endereço Residencial / Localização',password:'Senha',
    confirmPassword:'Confirmar Senha',nationality:'Nacionalidade',
    createAccount:'Criar Conta',signIn:'Entrar',
    prayerRequests:'Pedidos de Oração',bookBaptism:'Reservar meu Batismo',
    sendMessage:'Enviar Mensagem',submitRequest:'Enviar Solicitação',
    submitBooking:'Enviar Reserva',cancel:'Cancelar',
    allWelcome:'Todos são bem-vindos ao ICF Solution Centre',
    pleaseEnter:'Por favor insira',yourName:'seu nome',
    dashboard:'Painel',members:'Membros',baptisms:'Batismos',
    settings:'Configurações',logout:'Sair',analytics:'Análises',
    announcements:'Anúncios',gallery:'Galeria',
    selectLanguage:'Idioma',selectNationality:'Selecione sua nacionalidade',
    searchCountry:'Pesquisar país...',
  },
  ar:{
    home:'الرئيسية',about:'من نحن',ministries:'الخدمات',events:'الأحداث',
    prayer:'الصلاة',baptism:'المعمودية',contact:'اتصل بنا',sermons:'العظات',
    news:'الأخبار',login:'تسجيل الدخول',signup:'إنشاء حساب',admin:'المشرف',
    joinChurch:'انضم إلى كنيستنا',submitPrayer:'تقديم طلب صلاة',upcomingEvents:'الأحداث القادمة',
    welcomeTitle:'الزمالة المسيحية الدولية',
    welcomeSub:'"إرضاء الله هو كل شيء عن يسوع."',
    ourMinistries:'خدماتنا',joinWorship:'انضم إلينا في العبادة',
    fullName:'الاسم الكامل',phoneNumber:'رقم الهاتف',email:'البريد الإلكتروني',
    address:'العنوان السكني / الموقع',password:'كلمة المرور',
    confirmPassword:'تأكيد كلمة المرور',nationality:'الجنسية',
    createAccount:'إنشاء حساب',signIn:'تسجيل الدخول',
    prayerRequests:'طلبات الصلاة',bookBaptism:'حجز معموديتي',
    sendMessage:'إرسال الرسالة',submitRequest:'تقديم الطلب',
    submitBooking:'تقديم الحجز',cancel:'إلغاء',
    allWelcome:'الجميع مرحب بهم في مركز ICF',
    pleaseEnter:'يرجى إدخال',yourName:'اسمك',
    dashboard:'لوحة التحكم',members:'الأعضاء',baptisms:'المعمودية',
    settings:'الإعدادات',logout:'تسجيل الخروج',analytics:'التحليلات',
    announcements:'الإعلانات',gallery:'المعرض',
    selectLanguage:'اللغة',selectNationality:'اختر جنسيتك',
    searchCountry:'ابحث عن دولة...',
  },
  de:{
    home:'Startseite',about:'Über uns',ministries:'Ministerien',events:'Veranstaltungen',
    prayer:'Gebet',baptism:'Taufe',contact:'Kontakt',sermons:'Predigten',
    news:'Neuigkeiten',login:'Anmelden',signup:'Registrieren',admin:'Admin',
    joinChurch:'Unserer Gemeinde beitreten',submitPrayer:'Gebet einreichen',upcomingEvents:'Kommende Veranstaltungen',
    welcomeTitle:'Internationale Christliche Gemeinschaft',
    welcomeSub:'"Gott zu gefallen dreht sich alles um Jesus."',
    ourMinistries:'Unsere Ministerien',joinWorship:'Beten Sie mit uns',
    fullName:'Vollständiger Name',phoneNumber:'Telefonnummer',email:'E-Mail-Adresse',
    address:'Wohnadresse / Standort',password:'Passwort',
    confirmPassword:'Passwort bestätigen',nationality:'Nationalität',
    createAccount:'Konto erstellen',signIn:'Anmelden',
    prayerRequests:'Gebetsanliegen',bookBaptism:'Taufe buchen',
    sendMessage:'Nachricht senden',submitRequest:'Anfrage einreichen',
    submitBooking:'Buchung einreichen',cancel:'Abbrechen',
    allWelcome:'Alle sind im ICF Solution Centre willkommen',
    pleaseEnter:'Bitte eingeben',yourName:'Ihren Namen',
    dashboard:'Dashboard',members:'Mitglieder',baptisms:'Taufen',
    settings:'Einstellungen',logout:'Abmelden',analytics:'Analytik',
    announcements:'Ankündigungen',gallery:'Galerie',
    selectLanguage:'Sprache',selectNationality:'Nationalität wählen',
    searchCountry:'Land suchen...',
  },
  wo:{
    home:'Kër',about:'Nun',ministries:'Liggey',events:'Yëgël',
    prayer:'Jàng',baptism:'Bateem',contact:'Tëdd',sermons:'Wax Yàlla',
    news:'Xibaar',login:'Dugg',signup:'Bind sa tur',admin:'Admin',
    joinChurch:'Dugal ci Kër bu Yàlla bi',submitPrayer:'Yóbbal Jàng',upcomingEvents:'Yëgël yi di ñëw',
    welcomeTitle:'ICF Gambie',
    welcomeSub:'"Soxor Yàlla mooy Yeesu."',
    ourMinistries:'Liggey yi',joinWorship:'Kanam ak nun',
    fullName:'Tur bu dëkk',phoneNumber:'Nimer telefon',email:'Email',
    address:'Adresse',password:'Waaw sirr',
    confirmPassword:'Seetlu waaw sirr',nationality:'Dëkk',
    createAccount:'Sos kont',signIn:'Dugg',
    prayerRequests:'Jàng yi',bookBaptism:'Jël Bateem',
    sendMessage:'Yóonal message',submitRequest:'Yóbbal',
    submitBooking:'Yóbbal',cancel:'Bañal',
    allWelcome:'Nekk ci ICF Solution Centre',
    pleaseEnter:'Dugal',yourName:'sa tur',
    dashboard:'Tableau',members:'Xarit yi',baptisms:'Bateem',
    settings:'Yeesal',logout:'Génn',analytics:'Liggey',
    announcements:'Xibaar',gallery:'Nettali',
    selectLanguage:'Làkk',selectNationality:'Tann sa dëkk',
    searchCountry:'Seet dëkk...',
  },
  man:{
    home:'Kono',about:'Anu',ministries:'Barikamalolu',events:'Kumolu',
    prayer:'Dua',baptism:'Batisimo',contact:'Karo',sermons:'Kumolu',
    news:'Xibaaro',login:'Soto',signup:'Tongo',admin:'Admin',
    joinChurch:'ICF Sotome',submitPrayer:'Dua Kono',upcomingEvents:'Kumolu Kulolu',
    welcomeTitle:'ICF Gambia',
    welcomeSub:'"Alla Sene Yeso la."',
    ourMinistries:'Barikamalolu',joinWorship:'Nu ye koro',
    fullName:'Togo Fanma',phoneNumber:'Portable Sibo',email:'Email',
    address:'Fanma',password:'Gundo Kuma',
    confirmPassword:'Gundo Kuma Fanta',nationality:'Janfa',
    createAccount:'Konto Folosi',signIn:'Soto',
    prayerRequests:'Dua Fololu',bookBaptism:'Batisimo Bolo',
    sendMessage:'Kumandi',submitRequest:'Sigi',
    submitBooking:'Sigi',cancel:'Hayi',
    allWelcome:'ICF Solution Centre',
    pleaseEnter:'Sigi',yourName:'i togo',
    dashboard:'Fari',members:'Morilu',baptisms:'Batisimolu',
    settings:'Sirata',logout:'Boli',analytics:'Kafo',
    announcements:'Xibaaro',gallery:'Fonnolu',
    selectLanguage:'Kuma',selectNationality:'I janfa sigi',
    searchCountry:'Fanfa fen...',
  },
  ha:{
    home:'Gida',about:'Game da mu',ministries:'Hidima',events:'Abubuwa',
    prayer:'Addu\'a',baptism:'Baftisma',contact:'Tuntuɓi',sermons:'Wa\'azi',
    news:'Labarai',login:'Shiga',signup:'Yi rajista',admin:'Admin',
    joinChurch:'Shiga Ikilisiyarmu',submitPrayer:'Aika Addu\'a',upcomingEvents:'Abubuwa masu zuwa',
    welcomeTitle:'ICF Gambia',
    welcomeSub:'"Jin daɗin Allah shine duk game da Yesu."',
    ourMinistries:'Hidimominmu',joinWorship:'Mu tare',
    fullName:'Cikakken Suna',phoneNumber:'Lambar Waya',email:'Imel',
    address:'Adireshi',password:'Kalmar Sirri',
    confirmPassword:'Tabbatar Kalmar Sirri',nationality:'Ƙasa',
    createAccount:'Ƙirƙiri Asusun',signIn:'Shiga',
    prayerRequests:'Buƙatun Addu\'a',bookBaptism:'Ajiye Baftisma',
    sendMessage:'Aika Saƙo',submitRequest:'Gabatar',
    submitBooking:'Ajiye',cancel:'Soke',
    allWelcome:'Duk ana maraba a ICF',
    pleaseEnter:'Don Allah shigar da',yourName:'sunanka',
    dashboard:'Allon',members:'Mambobbin',baptisms:'Baftisma',
    settings:'Saituna',logout:'Fita',analytics:'Nazari',
    announcements:'Sanarwa',gallery:'Hotunan',
    selectLanguage:'Harshe',selectNationality:'Zaɓi ƙasarka',
    searchCountry:'Nemi ƙasa...',
  },
  yo:{
    home:'Ile',about:'Nipa wa',ministries:'Iṣẹ',events:'Awọn iṣẹlẹ',
    prayer:'Adura',baptism:'Baptismu',contact:'Kan si wa',sermons:'Iwasu',
    news:'Irohin',login:'Wọle',signup:'Forukọsilẹ',admin:'Admin',
    joinChurch:'Darapọ mọ Ijo Wa',submitPrayer:'Fi Adura Silẹ',upcomingEvents:'Awọn iṣẹlẹ ti mbọ',
    welcomeTitle:'ICF Gambia',
    welcomeSub:'"Lati Jẹ ki Ọlọrun Dunu ni gbogbo Nipa Jesu."',
    ourMinistries:'Awọn Iṣẹ Wa',joinWorship:'Darapọ mọ wa',
    fullName:'Orukọ Ni Kikun',phoneNumber:'Nọmba Foonu',email:'Adirẹsi Imeeli',
    address:'Adirẹsi Ile',password:'Ọrọ Aṣina',
    confirmPassword:'Jẹrisi Ọrọ Aṣina',nationality:'Orilẹ-ede',
    createAccount:'Ṣẹda Akọọlẹ',signIn:'Wọle',
    prayerRequests:'Awọn Ìbéèrè Ìdájọ́',bookBaptism:'Ṣeto Baptismu',
    sendMessage:'Firanṣẹ',submitRequest:'Fi silẹ',
    submitBooking:'Ṣeto',cancel:'Fagilee',
    allWelcome:'Gbogbo eniyan kaabọ si ICF',
    pleaseEnter:'Jọwọ tẹ sii',yourName:'orukọ rẹ',
    dashboard:'Pẹpẹ',members:'Awọn ọmọ ẹgbẹ',baptisms:'Baptismu',
    settings:'Eto',logout:'Jade',analytics:'Itupalẹ',
    announcements:'Awọn ikede',gallery:'Ibi aworan',
    selectLanguage:'Ede',selectNationality:'Yan orilẹ-ede rẹ',
    searchCountry:'Wa orilẹ-ede...',
  },
  sw:{
    home:'Nyumbani',about:'Kuhusu',ministries:'Huduma',events:'Matukio',
    prayer:'Sala',baptism:'Ubatizo',contact:'Wasiliana',sermons:'Mahubiri',
    news:'Habari',login:'Ingia',signup:'Jisajili',admin:'Admin',
    joinChurch:'Jiunge na Kanisa Letu',submitPrayer:'Omba Sala',upcomingEvents:'Matukio Yanayokuja',
    welcomeTitle:'ICF Gambia',
    welcomeSub:'"Kumpendeza Mungu ni yote kuhusu Yesu."',
    ourMinistries:'Huduma Zetu',joinWorship:'Jiunge Nasi',
    fullName:'Jina Kamili',phoneNumber:'Nambari ya Simu',email:'Barua Pepe',
    address:'Anwani / Mahali',password:'Nywila',
    confirmPassword:'Thibitisha Nywila',nationality:'Utaifa',
    createAccount:'Unda Akaunti',signIn:'Ingia',
    prayerRequests:'Maombi ya Sala',bookBaptism:'Hifadhi Ubatizo',
    sendMessage:'Tuma Ujumbe',submitRequest:'Wasilisha',
    submitBooking:'Hifadhi',cancel:'Ghairi',
    allWelcome:'Wote wanakaribushwa ICF',
    pleaseEnter:'Tafadhali ingiza',yourName:'jina lako',
    dashboard:'Dashibodi',members:'Wanachama',baptisms:'Ubatizo',
    settings:'Mipangilio',logout:'Toka',analytics:'Takwimu',
    announcements:'Matangazo',gallery:'Picha',
    selectLanguage:'Lugha',selectNationality:'Chagua utaifa wako',
    searchCountry:'Tafuta nchi...',
  },
};
// Fallback all missing langs to English
LANGUAGES.forEach(l=>{if(!T[l.code])T[l.code]=T.en;});


/* ═══════════════════════════════════════════════
   ICF GAMBIA – COUNTRY + LANGUAGE SYSTEM v5
   Uses data-* attributes — NO inline onclick strings
   ═══════════════════════════════════════════════ */

/* ── Dial code state ─────────────────────────── */
var selectedDialCode = '+220';
var selectedCountryCode = 'GM';

/* ── Render country list into a container ────── */
function renderCountryList(listEl, type, idPrefix) {
  if (!listEl) return;
  var html = '';
  for (var i = 0; i < COUNTRIES.length; i++) {
    var c = COUNTRIES[i];
    html += '<div class="country-item"' +
      ' data-code="' + c.code + '"' +
      ' data-dial="' + c.dialCode + '"' +
      ' data-name="' + c.name.replace(/"/g, '&quot;') + '"' +
      ' data-flag="' + c.flag + '"' +
      ' data-type="' + type + '"' +
      ' data-prefix="' + idPrefix + '"' +
      ' onclick="handleCountryClick(this)">' +
      '<span>' + c.flag + '</span>' +
      (type === 'phone' ? '<span style="min-width:52px;color:var(--text-muted)">' + c.dialCode + '</span>' : '') +
      '<span>' + c.name + '</span>' +
      '</div>';
  }
  listEl.innerHTML = html;
}

/* ── Safe click handler using data attributes ── */
function handleCountryClick(el) {
  var code   = el.getAttribute('data-code');
  var dial   = el.getAttribute('data-dial');
  var name   = el.getAttribute('data-name');
  var flag   = el.getAttribute('data-flag');
  var type   = el.getAttribute('data-type');
  var prefix = el.getAttribute('data-prefix');
  selectCountry(prefix, code, dial, name, flag, type);
}

/* ── Toggle dropdown open/close ──────────────── */
function toggleCountryDropdown(id) {
  var dd = document.getElementById('dd-' + id);
  if (!dd) return;
  var isOpen = dd.style.display !== 'none';
  // Close all dropdowns first
  document.querySelectorAll('.country-dropdown').forEach(function(d) { d.style.display = 'none'; });
  if (!isOpen) {
    dd.style.display = 'block';
    var si = dd.querySelector('input[type="text"]');
    if (si) setTimeout(function() { si.focus(); }, 60);
  }
}

/* ── Select a country ────────────────────────── */
function selectCountry(id, code, dialCode, name, flag, type) {
  if (type === 'phone') {
    selectedDialCode = dialCode;
    selectedCountryCode = code;
    var fd = document.getElementById('flag-display-' + id);
    if (fd) fd.textContent = flag;
    var cd = document.getElementById('code-display-' + id);
    if (cd) cd.textContent = dialCode;
    // Also update the text node display
    var btn = document.getElementById('flag-btn-' + id);
    if (btn) {
      var spans = btn.querySelectorAll('span');
      if (spans[0]) spans[0].textContent = flag;
      if (spans[1]) spans[1].textContent = dialCode;
    }
  } else {
    var nd = document.getElementById('nat-display-' + id);
    if (nd) nd.textContent = flag + ' ' + name;
    var hi = document.getElementById('su-nationality-val');
    if (hi) hi.value = name;
    var hc = document.getElementById('su-nationality-code');
    if (hc) hc.value = code;
  }
  // Close dropdown and clear search
  var dd = document.getElementById('dd-' + id);
  if (dd) dd.style.display = 'none';
  var si = document.getElementById('dd-' + id + '-search');
  if (si) { si.value = ''; filterCountries(id, '', type); }
}

/* ── Filter country list by search query ─────── */
function filterCountries(id, query, type) {
  var list = document.getElementById('list-' + id);
  if (!list) return;
  var q = (query || '').toLowerCase().trim();
  var items = list.querySelectorAll('.country-item');
  items.forEach(function(item) {
    var name = (item.getAttribute('data-name') || '').toLowerCase();
    var dial = (item.getAttribute('data-dial') || '').toLowerCase();
    item.style.display = (!q || name.indexOf(q) !== -1 || dial.indexOf(q) !== -1) ? 'flex' : 'none';
  });
}

/* ── Build and inject country lists ──────────── */
function populateCountryLists() {
  var phoneList = document.getElementById('list-phone');
  if (phoneList) renderCountryList(phoneList, 'phone', 'phone');

  var natList = document.getElementById('list-nationality');
  if (natList) renderCountryList(natList, 'nationality', 'nationality');
}

/* ── Build the phone input search handler ──────  */
function setupCountrySearch(id, type) {
  var searchEl = document.getElementById('dd-' + id + '-search');
  if (!searchEl) return;
  searchEl.oninput = function() { filterCountries(id, this.value, type); };
}

/* ── Close dropdowns on outside click ───────── */
document.addEventListener('click', function(e) {
  if (!e.target.closest('.country-selector-wrap') &&
      !e.target.closest('.country-dropdown')) {
    document.querySelectorAll('.country-dropdown').forEach(function(d) {
      d.style.display = 'none';
    });
  }
});
// Event delegation for all country search inputs
document.addEventListener('input', function(e) {
  if (e.target && e.target.classList.contains('country-search-input')) {
    var dd = e.target.closest('.country-dropdown');
    if (!dd) return;
    var ddId = dd.id; // e.g. "dd-phone" or "dd-nationality"
    var id = ddId.replace('dd-', '');
    var list = document.getElementById('list-' + id);
    if (!list) return;
    var q = e.target.value.toLowerCase().trim();
    list.querySelectorAll('.country-item').forEach(function(item) {
      var name = (item.getAttribute('data-name') || '').toLowerCase();
      var dial = (item.getAttribute('data-dial') || '').toLowerCase();
      item.style.display = (!q || name.indexOf(q) !== -1 || dial.indexOf(q) !== -1) ? 'flex' : 'none';
    });
  }
});

/* ══ LANGUAGE ENGINE ══════════════════════════ */
var currentLang = 'en';

function t(key) {
  var langData = T[currentLang];
  if (langData && langData[key] !== undefined) return langData[key];
  return (T['en'] && T['en'][key]) || key;
}

function setLanguage(code) {
  var lang = null;
  for (var i = 0; i < LANGUAGES.length; i++) {
    if (LANGUAGES[i].code === code) { lang = LANGUAGES[i]; break; }
  }
  if (!lang) lang = LANGUAGES[0];
  currentLang = lang.code;
  try { _store.setItem('icf_lang', code); } catch(e) {}
  document.documentElement.lang = code;
  document.documentElement.dir = lang.rtl ? 'rtl' : 'ltr';
  document.body.style.direction = lang.rtl ? 'rtl' : 'ltr';
  applyTranslations();
  updateLangSelectors(code);
  // Refresh search placeholders
  document.querySelectorAll('.country-search-input').forEach(function(el) {
    el.placeholder = t('searchCountry');
  });
}

function initLanguage() {
  var saved = 'en';
  try { saved = _store.getItem('icf_lang') || 'en'; } catch(e) {}
  setLanguage(saved);
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
}

function updateLangSelectors(code) {
  document.querySelectorAll('.lang-selector').forEach(function(sel) {
    sel.value = code;
  });
}

/* ── Populate all language selectors ─────────── */
function populateLangSelectors() {
  var enabledCodes = null;
  try { enabledCodes = JSON.parse(_store.getItem('icf_enabledLangs')); } catch(e) {}
  if (!Array.isArray(enabledCodes)) enabledCodes = null;

  var opts = '';
  for (var i = 0; i < LANGUAGES.length; i++) {
    var l = LANGUAGES[i];
    if (enabledCodes && !enabledCodes.includes(l.code)) continue;
    opts += '<option value="' + l.code + '">' + l.flag + ' ' + l.native + '</option>';
  }
  document.querySelectorAll('.lang-selector').forEach(function(sel) {
    sel.innerHTML = opts;
    sel.value = currentLang;
    sel.onchange = function() { setLanguage(this.value); };
  });
}

/* ── Nationality Analytics (Admin) ───────────── */
function adminNationalityHTML() {
  var members = DB.get('members', []);
  var byCountry = {};
  members.forEach(function(m) {
    var nat = m.nationality || 'Unknown';
    byCountry[nat] = (byCountry[nat] || 0) + 1;
  });
  var sorted = Object.entries(byCountry).sort(function(a, b) { return b[1] - a[1]; });
  var total = members.length || 1;

  var contMap = {
    'The Gambia':'Africa','Nigeria':'Africa','Senegal':'Africa','Ghana':'Africa',
    'Sierra Leone':'Africa','Liberia':'Africa','Kenya':'Africa','Tanzania':'Africa',
    'South Africa':'Africa','Zimbabwe':'Africa','Uganda':'Africa','Rwanda':'Africa',
    'Ethiopia':'Africa','Cameroon':'Africa','Niger':'Africa','Mali':'Africa',
    'United States':'Americas','Canada':'Americas','Brazil':'Americas','Mexico':'Americas',
    'Colombia':'Americas','Argentina':'Americas',
    'United Kingdom':'Europe','Germany':'Europe','France':'Europe','Italy':'Europe',
    'Spain':'Europe','Portugal':'Europe','Netherlands':'Europe','Sweden':'Europe',
    'Russia':'Europe','Poland':'Europe','Ukraine':'Europe','Greece':'Europe',
    'India':'Asia','China':'Asia','Japan':'Asia','South Korea':'Asia',
    'Philippines':'Asia','Indonesia':'Asia','Pakistan':'Asia','Bangladesh':'Asia',
    'Singapore':'Asia','Malaysia':'Asia','Thailand':'Asia','Vietnam':'Asia',
    'Saudi Arabia':'Asia','UAE':'Asia','Turkey':'Asia',
    'Australia':'Oceania','New Zealand':'Oceania',
  };
  var byCont = {};
  members.forEach(function(m) {
    var cont = contMap[m.nationality] || 'Other';
    byCont[cont] = (byCont[cont] || 0) + 1;
  });
  var contSorted = Object.entries(byCont).sort(function(a,b){return b[1]-a[1];});

  var countryRows = '';
  if (sorted.length) {
    sorted.forEach(function(entry) {
      var nat = entry[0], count = entry[1];
      var pct = Math.round((count / total) * 100);
      var c = COUNTRIES.find(function(x) { return x.name === nat; });
      countryRows += '<div style="margin-bottom:12px">' +
        '<div class="flex items-center justify-between" style="margin-bottom:4px">' +
          '<span class="text-sm">' + (c ? c.flag : '🏳️') + ' ' + nat + '</span>' +
          '<span class="text-sm font-bold">' + count + ' (' + pct + '%)</span>' +
        '</div>' +
        '<div style="background:var(--border2);border-radius:999px;height:8px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:var(--blue-g);border-radius:999px;transition:width .6s"></div>' +
        '</div></div>';
    });
  } else {
    countryRows = '<p class="text-dim text-sm">No nationality data yet. Members need to register with nationality.</p>';
  }

  var contRows = '';
  var contIcons = {Africa:'🌍',Americas:'🌎',Europe:'🌍',Asia:'🌏',Oceania:'🌏',Other:'🌐'};
  contSorted.forEach(function(entry) {
    var cont = entry[0], count = entry[1];
    var pct = Math.round((count/total)*100);
    contRows += '<div style="margin-bottom:10px">' +
      '<div class="flex items-center justify-between" style="margin-bottom:3px">' +
        '<span class="text-sm">' + (contIcons[cont]||'🌐') + ' ' + cont + '</span>' +
        '<span class="text-sm font-bold">' + count + '</span>' +
      '</div>' +
      '<div style="background:var(--border2);border-radius:999px;height:6px;overflow:hidden">' +
        '<div style="height:100%;width:' + pct + '%;background:var(--gold);border-radius:999px"></div>' +
      '</div></div>';
  });
  if (!contRows) contRows = '<p class="text-dim text-sm">No data yet.</p>';

  var now = Date.now();
  var day = 86400000;
  var trends = [
    {label:'Today', ms: day},
    {label:'This Week', ms: 7*day},
    {label:'This Month', ms: 30*day},
    {label:'All Time', ms: Infinity}
  ];
  var trendRows = '';
  trends.forEach(function(p) {
    var cnt = members.filter(function(m) { return now - new Date(m.joinedAt).getTime() < p.ms; }).length;
    trendRows += '<div class="flex items-center justify-between"><span class="text-dim">' + p.label + '</span>' +
      '<span class="badge badge-blue">' + cnt + '</span></div>';
  });

  return '<div>' +
    '<h2 class="section-title" style="margin-bottom:20px">🌍 Nationality Analytics</h2>' +
    '<div class="admin-stats" style="margin-bottom:22px">' +
      '<div class="admin-stat"><div class="admin-stat-value">' + members.length + '</div><div class="admin-stat-label">👥 Total Members</div></div>' +
      '<div class="admin-stat"><div class="admin-stat-value">' + sorted.length + '</div><div class="admin-stat-label">🌍 Nationalities</div></div>' +
      '<div class="admin-stat"><div class="admin-stat-value">' + Object.keys(byCont).length + '</div><div class="admin-stat-label">🌐 Continents</div></div>' +
    '</div>' +
    '<div class="grid-2">' +
      '<div class="card"><div class="card-header"><div class="font-bold">🏳️ Members by Country</div></div>' +
        '<div class="card-body">' + countryRows + '</div></div>' +
      '<div>' +
        '<div class="card" style="margin-bottom:14px"><div class="card-header"><div class="font-bold">🌐 Members by Continent</div></div>' +
          '<div class="card-body">' + contRows + '</div></div>' +
        '<div class="card"><div class="card-header"><div class="font-bold">📊 Registration Trends</div></div>' +
          '<div class="card-body" style="display:flex;flex-direction:column;gap:10px">' + trendRows + '</div></div>' +
      '</div>' +
    '</div></div>';
}

/* ── Language Management (Admin) ─────────────── */
function adminLanguageHTML() {
  var enabledLangs = DB.get('enabledLangs', ['en','fr','es','pt','de','ar','wo','man','ha','yo','sw']);
  var keys = Object.keys(T.en).length;

  var langRows = '';
  LANGUAGES.forEach(function(l) {
    var covered = Object.keys(T[l.code] || {}).length;
    var pct = Math.round((covered / keys) * 100);
    var isEnabled = enabledLangs.indexOf(l.code) !== -1;
    langRows += '<div class="flex items-center justify-between" style="padding:9px 0;border-bottom:1px solid var(--border2)">' +
      '<label style="display:flex;align-items:center;gap:8px;cursor:pointer">' +
        '<input type="checkbox" ' + (isEnabled ? 'checked' : '') +
          ' onchange="toggleLang(\'' + l.code + '\',this.checked)"' +
          ' style="accent-color:var(--gold);width:15px;height:15px"/>' +
        '<span>' + l.flag + ' ' + l.name + '</span>' +
        '<span class="text-dim text-xs">' + l.native + '</span>' +
      '</label>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<div style="width:60px;background:var(--border2);border-radius:999px;height:4px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:' + (pct>=90?'var(--green)':pct>=50?'var(--amber)':'var(--red)') + ';border-radius:999px"></div>' +
        '</div>' +
        '<span class="text-xs text-dim">' + pct + '%</span>' +
        (l.code === currentLang ?
          '<span class="badge badge-green">Active</span>' :
          '<button class="btn btn-sm btn-outline" onclick="setLanguage(\'' + l.code + '\');renderAdminSection(\'language\')">Set</button>'
        ) +
      '</div>' +
    '</div>';
  });

  var langOptions = '';
  LANGUAGES.forEach(function(l) {
    langOptions += '<option value="' + l.code + '"' + (l.code === currentLang ? ' selected' : '') + '>' + l.flag + ' ' + l.name + '</option>';
  });

  return '<div>' +
    '<h2 class="section-title" style="margin-bottom:20px">🌐 Language Management</h2>' +
    '<div class="grid-2">' +
      '<div class="card"><div class="card-header"><div class="font-bold">✅ Enable / Disable Languages</div></div>' +
        '<div class="card-body" style="max-height:420px;overflow-y:auto">' + langRows + '</div></div>' +
      '<div>' +
        '<div class="card" style="margin-bottom:14px"><div class="card-header"><div class="font-bold">⚙️ Default Language</div></div>' +
          '<div class="card-body">' +
            '<div class="form-group"><label class="form-label">Set Default Language</label>' +
              '<select class="form-select" onchange="setLanguage(this.value);populateLangSelectors();renderAdminSection(\'language\')">' + langOptions + '</select>' +
            '</div>' +
            '<p class="text-dim text-sm">Current: <strong>' + (LANGUAGES.find(function(l){return l.code===currentLang;})||LANGUAGES[0]).name + '</strong></p>' +
            '<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">' +
              '<button class="btn btn-primary btn-sm" onclick="exportTranslations()">⬇️ Export JSON</button>' +
              '<button class="btn btn-outline btn-sm" onclick="populateLangSelectors();toast(\'Selectors refreshed\',\'\',\'success\')">🔄 Refresh Selectors</button>' +
            '</div>' +
          '</div></div>' +
      '</div>' +
    '</div></div>';
}

function toggleLang(code, enabled) {
  var langs = DB.get('enabledLangs', ['en','fr','es','pt','de','ar','wo','man','ha','yo','sw']);
  if (enabled && langs.indexOf(code) === -1) langs.push(code);
  else if (!enabled) { var i = langs.indexOf(code); if (i > -1) langs.splice(i, 1); }
  DB.set('enabledLangs', langs);
  try { _store.setItem('icf_enabledLangs', JSON.stringify(langs)); } catch(e) {}
  populateLangSelectors();
  toast('Language settings saved', '', 'success');
}

function exportTranslations() {
  var data = JSON.stringify(T, null, 2);
  var a = document.createElement('a');
  a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
  a.download = 'icf-translations.json';
  a.click();
  toast('Translations exported as JSON', '', 'success');
}

/* ── Expose all new globals ──────────────────── */
window.handleCountryClick      = handleCountryClick;
window.toggleCountryDropdown   = toggleCountryDropdown;
window.selectCountry           = selectCountry;
window.filterCountries         = filterCountries;
window.populateCountryLists    = populateCountryLists;
window.populateLangSelectors   = populateLangSelectors;
window.setLanguage             = setLanguage;
window.initLanguage            = initLanguage;
window.applyTranslations       = applyTranslations;
window.adminNationalityHTML    = adminNationalityHTML;
window.adminLanguageHTML       = adminLanguageHTML;
window.toggleLang              = toggleLang;
window.exportTranslations      = exportTranslations;
window.setupCountrySearch      = setupCountrySearch;



/* ══ I18N ENGINE ══ */

function t(key){return (T[currentLang]&&T[currentLang][key])||T.en[key]||key;}





/* ══ COUNTRY SELECTOR LOGIC ══ */











// Close dropdowns on outside click
document.addEventListener('click',function(e){
  if(!e.target.closest('.country-selector-wrap')){
    document.querySelectorAll('.country-dropdown').forEach(d=>d.style.display='none');
  }
});

/* ══ LANG SELECTOR HTML BUILDER ══ */


/* ══ NATIONALITY ANALYTICS FOR ADMIN ══ */


/* ══ ADMIN LANGUAGE MANAGEMENT ══ */




// Expose globally



/* ICF GAMBIA – Solution Centre | v3.0 */

/* ── Safe Storage ── */
const _store=(()=>{try{localStorage.setItem('__icf__','1');localStorage.removeItem('__icf__');return localStorage;}catch(e){const d={};return{getItem(k){return d[k]??null},setItem(k,v){d[k]=String(v)},removeItem(k){delete d[k]}}}})();
const DB={
  get:(k,def)=>{try{const r=_store.getItem('icf_'+k);return r===null?def:JSON.parse(r)??def}catch{return def}},
  set:(k,v)=>{try{_store.setItem('icf_'+k,JSON.stringify(v))}catch{}},
  remove:(k)=>{try{_store.removeItem('icf_'+k)}catch{}},
  push:(k,item)=>{const a=DB.get(k,[]);a.unshift(item);DB.set(k,a);return item}
};

/* ── Seed Data ── */
function seedData(){ /* Demo records removed; production records load from Supabase. */ }
/* Media (Gallery) content is versioned independently of the one-time
   'seeded' flag above. This guarantees that once the real ICF/Fofuo
   photographs are published, every browser — including ones that
   already visited an older version of the site and have a stale
   'seeded' flag in localStorage — is force-refreshed with the current
   real photo set instead of continuing to show old/demo gallery cards. */
const MEDIA_SEED_VERSION = 3;
function seedMedia(){
  if(DB.get('mediaVersion') === MEDIA_SEED_VERSION) return;
  DB.set('media',[
    {id:uid(),title:'Women Gathering for Teaching and Fellowship',url:'fofuo-women-teaching.jpg',category:'Women\'s Ministry',type:'image',description:'Women of the Fofuo community seated together during a time of teaching and fellowship',alt:'Women of the Fofuo community seated together during a time of teaching and fellowship',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Serving the Fofuo Community',url:'fofuo-distribution-1.jpg',category:'Fofuo Mission Outreach',type:'image',description:'ICF mission team members bringing supplies into the Fofuo community',alt:'ICF mission team members bringing supplies into the Fofuo community',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'ICF Mission Team with the Fofuo Community',url:'fofuo-team-tree.jpg',category:'ICF Mission Team',type:'image',description:'The mission team gathered with children and families of Fofuo under the shade of a tree',alt:'The mission team gathered with children and families of Fofuo under the shade of a tree',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Children Listening Under the Shade',url:'fofuo-children-teaching.jpg',category:'Children & Youth',type:'image',description:'Children of Fofuo seated together, listening attentively during the outreach',alt:'Children of Fofuo seated together, listening attentively during the outreach',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Praise and Worship in Fofuo',url:'fofuo-worship-circle.jpg',category:'Prayer & Ministry',type:'image',description:'Members of the community joined together in praise and worship',alt:'Members of the community joined together in praise and worship',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Ministering to the Fofuo Community',url:'fofuo-daddy-mummy-community.jpg',category:'Pastors & Leadership',type:'image',description:'Pastor Mrs. Cecilia Romano and Evangelist Daniel Romano seated with the Fofuo community',alt:'Pastor Mrs. Cecilia Romano and Evangelist Daniel Romano seated with the Fofuo community',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Teaching and Ministry in Fofuo',url:'fofuo-teaching-table.jpg',category:'Fofuo Mission Outreach',type:'image',description:'A member of the mission team sharing the Word with the gathered community',alt:'A member of the mission team sharing the Word with the gathered community',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Children Receiving Gifts in Fofuo',url:'fofuo-shoebox-1.jpg',category:'Children & Youth',type:'image',description:'Children of Fofuo holding gift boxes given during the outreach',alt:'Children of Fofuo holding gift boxes given during the outreach',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Ministry to the Children and Youth of Fofuo',url:'fofuo-youth-teaching.jpg',category:'Children & Youth',type:'image',description:'A mission team member ministering to the children and youth of Fofuo',alt:'A mission team member ministering to the children and youth of Fofuo',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Ministering to Mothers and Families',url:'fofuo-mother-baby.jpg',category:'Prayer & Ministry',type:'image',description:'The mission team ministering to mothers and young families in Fofuo',alt:'The mission team ministering to mothers and young families in Fofuo',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Worship Amid Provisions Shared',url:'fofuo-worship-supplies.jpg',category:'Fellowship & Refreshments',type:'image',description:'Women of Fofuo in praise, surrounded by supplies brought by the mission team',alt:'Women of Fofuo in praise, surrounded by supplies brought by the mission team',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Children of Fofuo with Their Gifts',url:'fofuo-shoebox-2.jpg',category:'Children & Youth',type:'image',description:'Children of Fofuo seated together, each holding a gift box',alt:'Children of Fofuo seated together, each holding a gift box',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Children Gathered in the Fofuo Community',url:'fofuo-children-yard.jpg',category:'Community & Village',type:'image',description:'Children of the Fofuo community gathered together during the outreach',alt:'Children of the Fofuo community gathered together during the outreach',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Fellowship in the Community',url:'fofuo-fellowship-walk.jpg',category:'Fellowship & Refreshments',type:'image',description:'Members of the mission team and community in fellowship',alt:'Members of the mission team and community in fellowship',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Children of Fofuo Gathered Together',url:'fofuo-children-large-group.jpg',category:'Children & Youth',type:'image',description:'A large group of children from Fofuo gathered for the outreach',alt:'A large group of children from Fofuo gathered for the outreach',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Children of Fofuo with Their Gifts',url:'fofuo-shoebox-3.jpg',category:'Children & Youth',type:'image',description:'More children of Fofuo receiving and holding their gift boxes',alt:'More children of Fofuo receiving and holding their gift boxes',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Fofuo Community Gathered for Outreach',url:'fofuo-community-gathering.jpg',category:'Fofuo Mission Outreach',type:'image',description:'Children, youths, and adults of Fofuo gathered together for the outreach',alt:'Children, youths, and adults of Fofuo gathered together for the outreach',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Distributing Gifts to the Children',url:'fofuo-gift-distribution.jpg',category:'Children & Youth',type:'image',description:'A mission team member distributing gift boxes to the children of Fofuo',alt:'A mission team member distributing gift boxes to the children of Fofuo',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Mummy and Daddy Pastor in Fofuo',url:'fofuo-mummy-daddy-1.jpg',category:'Pastors & Leadership',type:'image',description:'Pastor Mrs. Cecilia Romano and Evangelist Daniel Romano rejoicing together during the outreach',alt:'Pastor Mrs. Cecilia Romano and Evangelist Daniel Romano rejoicing together during the outreach',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'ICF Mission Team and the Fofuo Community',url:'fofuo-team-community-tree.jpg',category:'ICF Mission Team',type:'image',description:'The mission team together with the Fofuo community and supplies gathered under the tree',alt:'The mission team together with the Fofuo community and supplies gathered under the tree',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Mummy and Daddy Pastor Ministering Together',url:'fofuo-mummy-daddy-2.jpg',category:'Pastors & Leadership',type:'image',description:'Pastor Mrs. Cecilia Romano and Evangelist Daniel Romano in a joyful moment during the mission',alt:'Pastor Mrs. Cecilia Romano and Evangelist Daniel Romano in a joyful moment during the mission',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Evangelist Daniel Romano Ministering in Fofuo',url:'fofuo-daddy-addressing.jpg',category:'Pastors & Leadership',type:'image',description:'Evangelist Daniel Romano addressing the children and families of Fofuo',alt:'Evangelist Daniel Romano addressing the children and families of Fofuo',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Sharing Refreshments with the Children',url:'fofuo-daddy-snacks.jpg',category:'Fellowship & Refreshments',type:'image',description:'Evangelist Daniel Romano sharing snacks with the children of Fofuo',alt:'Evangelist Daniel Romano sharing snacks with the children of Fofuo',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Ministering the Word in Fofuo',url:'fofuo-daddy-mummy-teaching.jpg',category:'Pastors & Leadership',type:'image',description:'Evangelist Daniel Romano and Pastor Mrs. Cecilia Romano ministering to the community',alt:'Evangelist Daniel Romano and Pastor Mrs. Cecilia Romano ministering to the community',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'ICF Mission Team and Community Members',url:'fofuo-team-community-group.jpg',category:'ICF Mission Team',type:'image',description:'The full mission team together with the Fofuo community and provisions shared',alt:'The full mission team together with the Fofuo community and provisions shared',event:'fofuo',eventLabel:'Fofuo Mission Outreach · Jul 22, 2026',createdAt:daysAgo(2)},
    {id:uid(),title:'Pastor Mrs. Cecilia Romano Ministering',url:'church-mummy-preaching.jpg',category:'Prayer & Ministry',type:'image',description:'Pastor Mrs. Cecilia Romano ministering to the community during outreach',alt:'Pastor Mrs. Cecilia Romano ministering to the community during outreach',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'ICF Baptism Service',url:'church-baptism-1.jpg',category:'Fellowship & Refreshments',type:'image',description:'Candidates gathered at the water\'s edge for baptism',alt:'Candidates gathered at the water\'s edge for baptism',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'ICF Sunday Worship Service',url:'church-worship-service.jpg',category:'Prayer & Ministry',type:'image',description:'The congregation lifting hands in worship at ICF Solution Centre',alt:'The congregation lifting hands in worship at ICF Solution Centre',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'ICF Church Family at the Baptism',url:'church-baptism-group.jpg',category:'Fellowship & Refreshments',type:'image',description:'Church members gathered together to celebrate the baptism service',alt:'Church members gathered together to celebrate the baptism service',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'Celebrating Together as a Church Family',url:'church-birthday.jpg',category:'Fellowship & Refreshments',type:'image',description:'Children gathered to celebrate a birthday within the ICF church family',alt:'Children gathered to celebrate a birthday within the ICF church family',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'Children in Fellowship',url:'church-beach-fellowship.jpg',category:'Fellowship & Refreshments',type:'image',description:'Children sharing a meal together during a church fellowship outing',alt:'Children sharing a meal together during a church fellowship outing',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'ICF Church Family Together',url:'church-family-photo.jpg',category:'ICF Mission Team',type:'image',description:'Members of the ICF church family gathered for a group photograph',alt:'Members of the ICF church family gathered for a group photograph',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'Prayer and Ministry',url:'church-mummy-prayer.jpg',category:'Prayer & Ministry',type:'image',description:'Pastor Mrs. Cecilia Romano praying with a member of the community',alt:'Pastor Mrs. Cecilia Romano praying with a member of the community',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'ICF Family Fellowship',url:'church-fellowship-flags.jpg',category:'Fellowship & Refreshments',type:'image',description:'Church members in fellowship at ICF Solution Centre',alt:'Church members in fellowship at ICF Solution Centre',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'Preparing Refreshments for Fellowship',url:'church-refreshments-beach.jpg',category:'Fellowship & Refreshments',type:'image',description:'Church members preparing refreshments during a fellowship outing',alt:'Church members preparing refreshments during a fellowship outing',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'Evangelist Daniel Romano and Pastor Mrs. Cecilia Romano',url:'church-daddy-mummy-office.jpg',category:'Pastors & Leadership',type:'image',description:'Evangelist Daniel Romano and Pastor Mrs. Cecilia Romano at ICF Solution Centre',alt:'Evangelist Daniel Romano and Pastor Mrs. Cecilia Romano at ICF Solution Centre',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'ICF Children Singing Unto the Lord',url:'church-children-choir.jpg',category:'Children & Youth',type:'image',description:'Children of ICF Gambia singing and praising the Lord',alt:'Children of ICF Gambia singing and praising the Lord',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'Church Family Celebration',url:'church-celebration.jpg',category:'Fellowship & Refreshments',type:'image',description:'The ICF church family gathered together in celebration and fellowship',alt:'The ICF church family gathered together in celebration and fellowship',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'ICF Mission Team in Fellowship',url:'church-beach-men.jpg',category:'ICF Mission Team',type:'image',description:'Members of the ICF mission team together at the beach',alt:'Members of the ICF mission team together at the beach',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'Serving the Community',url:'church-supply-delivery.jpg',category:'Community & Village',type:'image',description:'Pastor Mrs. Cecilia Romano and the mission team bringing provisions to a community in need',alt:'Pastor Mrs. Cecilia Romano and the mission team bringing provisions to a community in need',event:'church-life',eventLabel:'ICF Mission & Outreach',createdAt:daysAgo(40)},
    {id:uid(),title:'ICF Members Serving Together',url:'church-group-casual.jpg',category:'ICF Mission Team',type:'image',description:'Members of the ICF church family gathered together',alt:'Members of the ICF church family gathered together',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'Evangelist Daniel Romano',url:'church-daddy-portrait.jpg',category:'Pastors & Leadership',type:'image',description:'Evangelist Daniel Romano at ICF Solution Centre',alt:'Evangelist Daniel Romano at ICF Solution Centre',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'ICF Youth in Praise and Worship',url:'church-youth-dance.jpg',category:'Children & Youth',type:'image',description:'ICF youths dancing and praising the Lord during a special service',alt:'ICF youths dancing and praising the Lord during a special service',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'Women in Fellowship',url:'church-women-waiting.jpg',category:'Women\'s Ministry',type:'image',description:'Women of the ICF church family gathered together',alt:'Women of the ICF church family gathered together',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'ICF Sunday Worship Service',url:'church-service-standing.jpg',category:'Prayer & Ministry',type:'image',description:'The congregation gathered in worship at ICF Solution Centre',alt:'The congregation gathered in worship at ICF Solution Centre',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'ICF Church Family Together',url:'church-nations-family.jpg',category:'ICF Mission Team',type:'image',description:'The ICF church family, representing many nations, gathered together',alt:'The ICF church family, representing many nations, gathered together',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
    {id:uid(),title:'Evangelist Daniel Romano with the Children',url:'church-daddy-kids.jpg',category:'Pastors & Leadership',type:'image',description:'Evangelist Daniel Romano in fellowship with the children of ICF',alt:'Evangelist Daniel Romano in fellowship with the children of ICF',event:'church-life',eventLabel:'ICF Church Life & Fellowship',createdAt:daysAgo(40)},
  ]);
  DB.set('mediaVersion', MEDIA_SEED_VERSION);
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function daysAgo(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString()}
function fmtDate(iso){if(!iso)return'—';return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}

/* ── Toast ── */
function toast(title,desc='',type='success'){
  const c=document.getElementById('toast-container');
  const t=document.createElement('div');
  t.className='toast toast-'+type;
  t.innerHTML='<div><div class="toast-title">'+title+'</div>'+(desc?'<div class="toast-desc">'+desc+'</div>':'')+'</div>';
  c.appendChild(t);
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),250)},3200);
}

/* ── Theme ── */
function toggleTheme(){
  const body=document.body;
  const isDark=body.getAttribute('data-theme')==='dark';
  const next=isDark?'light':'dark';
  body.setAttribute('data-theme',next);
  _store.setItem('icf_theme',next);
  const btn=document.getElementById('theme-btn');
  if(btn)btn.textContent=isDark?'🌙':'☀️';
}
function initTheme(){
  const saved=_store.getItem('icf_theme')||'light';
  document.body.setAttribute('data-theme',saved);
  const btn=document.getElementById('theme-btn');
  if(btn)btn.textContent=saved==='dark'?'☀️':'🌙';
}

/* ── Router ── */
const ROUTES=['home','about','services','events','prayers','baptisms','contact','login','signup','admin-login','admin-portal','sermons','gallery','announcements','membership','workers'];
function navigate(page){
  if(page==='admin-portal'){if(!_store.getItem('icf_admin_token')){navigate('admin-login');return}}
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById('page-'+page);
  if(el)el.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.toggle('active',l.dataset.page===page));
  if(page!=='home'&&window.ICFHeroSlider)window.ICFHeroSlider.stop();
  renderPage(page);
  const mobileNav=document.getElementById('nav-mobile');
  if(mobileNav)mobileNav.classList.remove('open');
  window.scrollTo(0,0);
  try{history.pushState({page},'','#'+page)}catch(e){}
}
function renderPage(page){
  switch(page){
    case 'home':renderHome();renderLivestreamWidget();break;
    case 'prayers':renderPrayers();break;
    case 'baptisms':renderBaptisms();break;
    case 'events':renderEvents();break;
    case 'sermons':renderSermons();break;
    case 'gallery':renderGallery();break;
    case 'announcements':renderAnnouncements();break;
    case 'admin-portal':renderAdminPortal();break;
  }
}

/* ── Home ── */
function renderHome(){
  icfHeroStart();icfApplyThemeSettings();
  document.getElementById('stat-prayers').textContent=DB.get('prayers',[]).length;
  document.getElementById('stat-baptisms').textContent=DB.get('baptisms',[]).length;
  document.getElementById('stat-events').textContent=DB.get('events',[]).length;
  document.getElementById('stat-members').textContent=DB.get('members',[]).length;
}

/* ── Prayers ── */
function renderPrayers(filter){
  filter=filter||'all';
  let prayers=DB.get('prayers',[]);
  if(filter!=='all')prayers=prayers.filter(p=>p.category===filter);
  const grid=document.getElementById('prayers-grid');
  if(!prayers.length){grid.innerHTML='<div class="empty-state"><div class="empty-state-emoji">🙏</div><h3>No prayer requests yet</h3><p>Be the first to submit a prayer request.</p></div>';return}
  const sBadge=s=>{const m={pending:'badge-yellow',praying:'badge-blue',answered:'badge-green'};return'<span class="badge '+(m[s]||'badge-gray')+'">'+s+'</span>'};
  grid.innerHTML=prayers.map(p=>'<div class="card request-card"><div class="card-header"><div class="flex items-center justify-between flex-wrap gap-2"><span class="badge badge-gold">'+p.category+'</span>'+sBadge(p.status)+'</div><div style="margin-top:10px;font-weight:700;font-size:1rem">Prayer for '+(p.anonymous?'Anonymous':p.requesterName)+'</div><div class="text-xs text-dim" style="margin-top:3px">'+fmtDate(p.createdAt)+'</div></div><div class="card-body"><p class="request-quote">"'+p.request+'"</p>'+(p.adminNote?'<div class="admin-note"><span class="admin-note-label">Update from Prayer Team</span>'+p.adminNote+'</div>':'')+'</div></div>').join('');
}
function openPrayerModal(){document.getElementById('prayer-modal').classList.add('open')}
function closePrayerModal(){
  document.getElementById('prayer-modal').classList.remove('open');
  const f=document.getElementById('prayer-form');
  if(f)f.querySelectorAll('input,textarea').forEach(el=>{el.type==='checkbox'?el.checked=false:el.value=''});
  const ng=document.getElementById('prayer-name-group');if(ng)ng.style.display='block';
}
function submitPrayerForm(){
  const anon=document.getElementById('anon-checkbox')&&document.getElementById('anon-checkbox').checked;
  const name=(document.getElementById('pf-name')||{value:''}).value.trim();
  const req=(document.getElementById('pf-request')||{value:''}).value.trim();
  if(!anon&&!name){toast('Please enter your name','','error');return}
  if(!req){toast('Please enter your prayer request','','error');return}
  DB.push('prayers',{id:uid(),requesterName:anon?'Anonymous':name,email:(document.getElementById('pf-email')||{value:''}).value.trim(),category:(document.getElementById('pf-category')||{value:'other'}).value,request:req,status:'pending',adminNote:'',anonymous:!!anon,createdAt:new Date().toISOString()});
  closePrayerModal();renderPrayers();toast('Prayer request submitted 🙏','Our team will intercede on your behalf.','success');
}

/* ── Baptisms ── */
function renderBaptisms(){
  const baptisms=DB.get('baptisms',[]);
  const grid=document.getElementById('baptisms-grid');
  if(!baptisms.length){grid.innerHTML='<div class="empty-state"><div class="empty-state-emoji">💧</div><h3>No baptisms booked yet</h3><p>Be the first — book your baptism today!</p></div>';return}
  const sBadge=s=>{const m={pending:'badge-yellow',approved:'badge-green',rejected:'badge-rose'};return'<span class="badge '+(m[s]||'badge-gray')+'">'+s+'</span>'};
  grid.innerHTML=baptisms.map(b=>'<div class="card"><div class="card-header"><div class="flex items-center justify-between"><span style="font-size:1.4rem">💧</span>'+sBadge(b.status)+'</div><div style="margin-top:10px;font-weight:700;font-size:1rem">'+b.fullName+'</div><div class="text-xs text-dim">Booked '+fmtDate(b.createdAt)+'</div></div><div class="card-body" style="display:flex;flex-direction:column;gap:8px"><div class="text-sm"><span style="color:var(--gold)">📅</span> Preferred: <strong>'+b.preferredDate+'</strong></div>'+(b.phone?'<div class="text-sm"><span style="color:var(--gold)">📞</span> '+b.phone+'</div>':'')+(b.testimony?'<div class="text-xs text-dim" style="font-style:italic">"'+b.testimony.slice(0,100)+(b.testimony.length>100?'...':'')+'"</div>':'')+(b.adminNote?'<div class="admin-note"><span class="admin-note-label">Note</span>'+b.adminNote+'</div>':'')+'</div></div>').join('');
}
function openBaptismModal(){document.getElementById('baptism-modal').classList.add('open')}
function closeBaptismModal(){document.getElementById('baptism-modal').classList.remove('open');document.getElementById('baptism-form').querySelectorAll('input,textarea').forEach(el=>el.value='')}
function submitBaptismForm(){
  const n=(document.getElementById('bf-name')||{value:''}).value.trim();
  const ph=(document.getElementById('bf-phone')||{value:''}).value.trim();
  const dt=(document.getElementById('bf-date')||{value:''}).value;
  if(!n){toast('Please enter your full name','','error');return}
  if(!ph){toast('Please enter your phone number','','error');return}
  if(!dt){toast('Please select a baptism date','','error');return}
  DB.push('baptisms',{id:uid(),fullName:n,phone:ph,email:(document.getElementById('bf-email')||{value:''}).value.trim(),testimony:(document.getElementById('bf-testimony')||{value:''}).value.trim(),preferredDate:dt,status:'pending',adminNote:'',createdAt:new Date().toISOString()});
  closeBaptismModal();renderBaptisms();toast('Baptism booking received 💧','We will contact you to confirm.','success');
}

/* ── Events ── */
function renderEvents(filter){
  filter=filter||'all';
  let events=DB.get('events',[]).slice().sort((a,b)=>new Date(a.date||0)-new Date(b.date||0));
  if(filter!=='all')events=events.filter(e=>e.type===filter);
  const grid=document.getElementById('events-grid');
  if(!events.length){grid.innerHTML='<div class="empty-state"><div class="empty-state-emoji">📅</div><h3>No events scheduled</h3><p>Check back soon for upcoming events.</p></div>';return}
  const tBadge=t=>{const m={crusade:'badge-orange',fellowship:'badge-blue',prayer:'badge-rose',service:'badge-gold',other:'badge-gray'};const l={crusade:'🔥 Crusade',fellowship:'🤝 Fellowship',prayer:'🙏 Prayer',service:'⛪ Service',other:'📌 Event'};return'<span class="badge '+(m[t]||'badge-gray')+'">'+(l[t]||t)+'</span>'};
  const now=Date.now();
  grid.innerHTML=events.map(ev=>'<div class="card"><div class="card-header"><div class="flex items-center justify-between">'+tBadge(ev.type)+'<span class="badge '+(new Date(ev.date).getTime()>now?'badge-green':'badge-gray')+'">'+(new Date(ev.date).getTime()>now?'Upcoming':'Past')+'</span></div><div style="margin-top:12px;font-weight:700;font-size:1.02rem;line-height:1.3">'+ev.title+'</div></div><div class="card-body" style="display:flex;flex-direction:column;gap:7px"><div class="text-sm"><span style="color:var(--gold)">📅</span> <strong>'+fmtDate(ev.date)+(ev.endDate?' – '+fmtDate(ev.endDate):'')+'</strong></div><div class="text-sm"><span style="color:var(--gold)">📍</span> '+ev.location+'</div>'+(ev.speaker?'<div class="text-sm"><span style="color:var(--gold)">🎤</span> '+ev.speaker+'</div>':'')+'<div class="text-dim text-sm" style="margin-top:4px">'+ev.description+'</div></div></div>').join('');
}

/* ── Contact ── */
function submitContactForm(){
  const n=(document.getElementById('contact-name')||{value:''}).value.trim();
  const e=(document.getElementById('contact-email')||{value:''}).value.trim();
  const m=(document.getElementById('contact-message')||{value:''}).value.trim();
  if(!n){toast('Please enter your name','','error');return}
  if(!e){toast('Please enter your email','','error');return}
  if(!m){toast('Please enter a message','','error');return}
  ['contact-name','contact-email','contact-phone','contact-message'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
  toast('Message sent! ✉️','We will get back to you soon.','success');
}

/* ── Password Strength ── */
function checkPasswordStrength(pw){
  const bar=document.getElementById('pw-bar');
  const hint=document.getElementById('pw-hint');
  if(!bar||!hint)return;
  let score=0;
  if(pw.length>=8)score++;
  if(/[A-Z]/.test(pw))score++;
  if(/[0-9]/.test(pw))score++;
  if(/[^A-Za-z0-9]/.test(pw))score++;
  const pcts=[0,25,50,75,100];
  const colors=['','#ef4444','#f59e0b','#3b82f6','#16a34a'];
  const labels=['','Weak','Fair','Good','Strong'];
  bar.style.width=pcts[score]+'%';
  bar.style.background=colors[score]||'transparent';
  hint.textContent=score?labels[score]+' password':'Minimum 8 characters';
  hint.style.color=colors[score]||'var(--text-muted)';
}

/* ── Sign Up ── */
function submitSignup(){
  let valid=true;
  function chk(id,errId,test,msg){
    const el=document.getElementById(id);
    const err=document.getElementById(errId);
    const val=el?el.value.trim():'';
    const ok=test(val);
    if(err){err.style.display=ok?'none':'block';if(!ok)err.textContent=msg}
    if(!ok)valid=false;
    return ok?val:null;
  }
  const name=chk('su-name','err-name',s=>s.length>1,'Please enter your full name');
  const phone=chk('su-phone','err-phone',s=>s.length>5,'Please enter your phone number');
  const addr=chk('su-address','err-address',s=>s.length>2,'Please enter your address');
  const natVal=(document.getElementById('su-nationality-val')||{value:''}).value;
  const natCode=(document.getElementById('su-nationality-code')||{value:''}).value;
  const natErr=document.getElementById('err-nationality');
  if(!natVal){if(natErr)natErr.style.display='block';valid=false;}else{if(natErr)natErr.style.display='none';}
  const pass=chk('su-pass','err-pass',s=>s.length>=12,'Password must be at least 12 characters');
  const confirm=(document.getElementById('su-confirm')||{value:''}).value;
  const errConf=document.getElementById('err-confirm');
  const passOk=pass&&confirm===pass;
  if(errConf)errConf.style.display=passOk?'none':'block';
  if(!passOk)valid=false;
  const agree=(document.getElementById('su-agree')||{checked:false}).checked;
  const errAg=document.getElementById('err-agree');
  if(errAg)errAg.style.display=agree?'none':'block';
  if(!agree)valid=false;
  if(!valid)return;
  const existing=DB.get('members',[]);
  if(existing.some(m=>m.phone===phone)){toast('Phone number already registered','Please use a different number.','error');return}
  const email=(document.getElementById('su-email')||{value:''}).value.trim();
  const fullPhone=selectedDialCode+' '+(phone||'');const newMember={id:uid(),name:name,phone:fullPhone,phoneRaw:phone,dialCode:selectedDialCode,email:email,address:addr,nationality:natVal||'',nationalityCode:natCode||'',role:'member',status:'pending',joinedAt:new Date().toISOString()};
  DB.push('members',newMember);
  _store.setItem('icf_member_token','member_'+newMember.id);
  _store.setItem('icf_member_user',JSON.stringify(newMember));
  ['su-name','su-phone','su-email','su-address','su-pass','su-confirm'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
  const cb=document.getElementById('su-agree');if(cb)cb.checked=false;
  const bar=document.getElementById('pw-bar');if(bar)bar.style.width='0%';
  toast('Welcome to ICF Gambia! 🎉','Your registration is pending approval. We will contact you soon.','success');
  setTimeout(()=>navigate('home'),1800);
}

/* ── Member Login ── */
function doMemberLogin(){
  const user=(document.getElementById('login-email')||{value:''}).value.trim();
  const pass=(document.getElementById('login-pass')||{value:''}).value;
  if(!user||!pass){toast('Please enter email/phone and password','','error');return}
  const members=DB.get('members',[]);
  const found=members.find(m=>(m.email===user||m.phone===user));
  if(found){
    if(found.status==='pending'){toast('Account pending approval','Please wait for admin to approve your account.','info');return}
    if(found.status==='suspended'){toast('Account suspended','Please contact the church office.','error');return}
    _store.setItem('icf_member_token','member_'+found.id);
    _store.setItem('icf_member_user',JSON.stringify(found));
    toast('Welcome back, '+found.name+'! 👋','','success');
    setTimeout(()=>navigate('home'),1200);
  } else {
    toast('Account not found','Please check your email/phone or sign up first.','error');
  }
}

/* ── Admin Login ── */
function doAdminLogin(){}
function submitAdminLogin(e){if(e&&e.preventDefault)e.preventDefault();doAdminLogin()}
function adminLogout(){
  _store.removeItem('icf_admin_token');_store.removeItem('icf_admin_user');
  navigate('home');toast('Logged out successfully','','info');
}

/* ── Admin Portal ── */
let adminSection='dashboard';
function renderAdminPortal(){
  const u=JSON.parse(_store.getItem('icf_admin_user')||'{}');
  const el=document.getElementById('admin-user-name');if(el)el.textContent=u.name||'Admin';
  renderAdminSection(adminSection);
}
function setAdminSection(s){
  adminSection=s;
  document.querySelectorAll('.sidebar-item').forEach(el=>el.classList.toggle('active',el.dataset.section===s));
  renderAdminSection(s);
}
function renderAdminSection(s){
  const c=document.getElementById('admin-content');if(!c)return;
  switch(s){
    case 'dashboard':c.innerHTML=adminDashHTML();break;
    case 'members':c.innerHTML=adminMembersHTML();break;
    case 'prayers':c.innerHTML=adminPrayersHTML();break;
    case 'messages':c.innerHTML=adminContactMessagesHTML();break;
    case 'baptisms':c.innerHTML=adminBaptismsHTML();break;
    case 'events':c.innerHTML=adminEventsHTML();break;
    case 'sermons':c.innerHTML=adminSermonsHTML();break;
    case 'media':c.innerHTML=adminMediaHTML();break;
    case 'announcements':c.innerHTML=adminAnnouncementsHTML();break;
    case 'theme-slider':c.innerHTML=icfThemeSettingsHTML();break;
    case 'newsletter':c.innerHTML=adminNewsletterHTML();break;
    case 'livestream':c.innerHTML=adminLivestreamHTML();break;
    case 'analytics':c.innerHTML=adminAnalyticsHTML();break;
    case 'nationality':c.innerHTML=adminNationalityHTML();break;
    case 'language':c.innerHTML=adminLanguageHTML();break;
    case 'settings':c.innerHTML=adminSettingsHTML();break;
    default:c.innerHTML=adminSettingsHTMLFull();break;
  }
}

function adminDashHTML(){
  const prayers=DB.get('prayers',[]),baptisms=DB.get('baptisms',[]),events=DB.get('events',[]),members=DB.get('members',[]);
  const approved=members.filter(m=>m.status==='approved').length;
  const pendingM=members.filter(m=>m.status==='pending').length;
  const suspended=members.filter(m=>m.status==='suspended').length;
  return '<div><h2 class="section-title" style="margin-bottom:20px">📊 Dashboard</h2><div class="admin-stats">'+
    '<div class="admin-stat"><div class="admin-stat-value">'+members.length+'</div><div class="admin-stat-label">👥 Total Members</div></div>'+
    '<div class="admin-stat" style="border-color:rgba(22,163,74,0.3)"><div class="admin-stat-value" style="color:var(--green)">'+approved+'</div><div class="admin-stat-label">✅ Approved Members</div></div>'+
    '<div class="admin-stat" style="border-color:rgba(217,119,6,0.3)"><div class="admin-stat-value" style="color:var(--amber)">'+pendingM+'</div><div class="admin-stat-label">⏳ Pending Members</div></div>'+
    '<div class="admin-stat" style="border-color:rgba(220,38,38,0.3)"><div class="admin-stat-value" style="color:var(--red)">'+suspended+'</div><div class="admin-stat-label">🚫 Suspended Members</div></div>'+
    '<div class="admin-stat"><div class="admin-stat-value">'+prayers.length+'</div><div class="admin-stat-label">🙏 Prayer Requests</div></div>'+
    '<div class="admin-stat"><div class="admin-stat-value">'+baptisms.length+'</div><div class="admin-stat-label">💧 Baptism Bookings</div></div>'+
    '<div class="admin-stat"><div class="admin-stat-value">'+events.length+'</div><div class="admin-stat-label">📅 Events</div></div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:10px;margin-top:18px">'+
    '<button class="btn btn-outline" onclick="setAdminSection(\'members\')">👥 Manage Members</button>'+
    '<button class="btn btn-outline" onclick="setAdminSection(\'prayers\')">🙏 Review Prayers</button>'+
    '<button class="btn btn-outline" onclick="setAdminSection(\'baptisms\')">💧 Review Baptisms</button>'+
    '<button class="btn btn-outline" onclick="setAdminSection(\'events\')">📅 Manage Events</button>'+
    '</div></div>';
}

function adminMembersHTML(){
  const members=DB.get('members',[]);
  const rows=members.map(m=>'<tr>'+
    '<td><strong>'+m.name+'</strong>'+(m.email?'<div class="text-xs text-dim">'+m.email+'</div>':'')+'</td>'+
    '<td class="text-dim">'+(m.nationality?((COUNTRIES.find(c=>c.name===m.nationality)||{flag:'🏳️'}).flag+' '+m.nationality):'—')+'</td>'+
    '<td class="text-dim">'+(m.phone||'—')+'</td>'+
    '<td><span class="badge '+(m.role==='admin'?'badge-gold':m.role==='leader'?'badge-blue':'badge-gray')+'">'+m.role+'</span></td>'+
    '<td><select class="filter-select" style="font-size:11px;padding:3px 7px" onchange="updateMemberStatus(\''+m.id+'\',this.value)">'+
      '<option value="approved"'+(m.status==='approved'?' selected':'')+'>✅ Approved</option>'+
      '<option value="pending"'+(m.status==='pending'?' selected':'')+'>⏳ Pending</option>'+
      '<option value="suspended"'+(m.status==='suspended'?' selected':'')+'>🚫 Suspended</option>'+
    '</select></td>'+
    '<td class="text-dim text-sm">'+fmtDate(m.joinedAt)+'</td>'+
    '<td><button class="btn btn-sm btn-danger" onclick="deleteRecord(\'members\',\''+m.id+'\')">Delete</button></td>'+
  '</tr>').join('');
  return '<div>'+
    '<div class="flex items-center justify-between flex-wrap gap-3" style="margin-bottom:20px">'+
    '<h2 class="section-title">👥 Members ('+members.length+')</h2>'+
    '<div class="flex gap-2 flex-wrap">'+
    '<select class="filter-select" onchange="filterMembersTable(this.value)"><option value="all">All Status</option><option value="approved">✅ Approved</option><option value="pending">⏳ Pending</option><option value="suspended">🚫 Suspended</option></select>'+
    '<button class="btn btn-primary btn-sm" onclick="exportMembers()">⬇️ Export CSV</button>'+
    '<button class="btn btn-outline btn-sm" onclick="openAddMemberModal()">+ Add Member</button>'+
    '</div></div>'+
    '<div class="table-wrap"><table id="members-table">'+
    '<thead><tr><th>Name</th><th>Nationality</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>'+
    '<tbody>'+rows+(members.length?'':'<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--text-dim)">No members yet</td></tr>')+'</tbody>'+
    '</table></div></div>';
}

function adminPrayersHTML(){
  const prayers=DB.get('prayers',[]);
  const rows=prayers.map(p=>'<tr>'+
    '<td><strong>'+(p.anonymous?'Anonymous':p.requesterName)+'</strong></td>'+
    '<td><span class="badge badge-gold">'+p.category+'</span></td>'+
    '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-dim)">'+p.request+'</td>'+
    '<td><select class="filter-select" style="font-size:11px;padding:3px 7px" onchange="updatePrayerStatus(\''+p.id+'\',this.value)">'+
      '<option value="pending"'+(p.status==='pending'?' selected':'')+'>Pending</option>'+
      '<option value="praying"'+(p.status==='praying'?' selected':'')+'>Praying</option>'+
      '<option value="answered"'+(p.status==='answered'?' selected':'')+'>Answered</option>'+
    '</select></td>'+
    '<td class="text-dim text-sm">'+fmtDate(p.createdAt)+'</td>'+
    '<td style="display:flex;gap:6px">'+
    '<button class="btn btn-sm btn-outline" onclick="openAdminNoteModal(\'prayers\',\''+p.id+'\')">Note</button>'+
    '<button class="btn btn-sm btn-danger" onclick="deleteRecord(\'prayers\',\''+p.id+'\')">Del</button>'+
    '</td></tr>').join('');
  return '<div><h2 class="section-title" style="margin-bottom:20px">🙏 Prayer Requests ('+prayers.length+')</h2>'+
    '<div class="table-wrap"><table><thead><tr><th>Name</th><th>Category</th><th>Request</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>'+
    '<tbody>'+rows+(prayers.length?'':'<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--text-dim)">No prayer requests yet</td></tr>')+
    '</tbody></table></div></div>';
}

function adminBaptismsHTML(){
  const baptisms=DB.get('baptisms',[]);
  const rows=baptisms.map(b=>'<tr>'+
    '<td><strong>'+b.fullName+'</strong>'+(b.testimony?'<div class="text-xs text-dim">"'+b.testimony.slice(0,50)+'..."</div>':'')+'</td>'+
    '<td>'+(b.phone||'—')+'</td>'+
    '<td><strong>'+b.preferredDate+'</strong></td>'+
    '<td><select class="filter-select" style="font-size:11px;padding:3px 7px" onchange="updateBaptismStatus(\''+b.id+'\',this.value)">'+
      '<option value="pending"'+(b.status==='pending'?' selected':'')+'>Pending</option>'+
      '<option value="approved"'+(b.status==='approved'?' selected':'')+'>Approved</option>'+
      '<option value="rejected"'+(b.status==='rejected'?' selected':'')+'>Rejected</option>'+
    '</select></td>'+
    '<td class="text-dim text-sm">'+fmtDate(b.createdAt)+'</td>'+
    '<td style="display:flex;gap:6px">'+
    '<button class="btn btn-sm btn-outline" onclick="openAdminNoteModal(\'baptisms\',\''+b.id+'\')">Note</button>'+
    '<button class="btn btn-sm btn-danger" onclick="deleteRecord(\'baptisms\',\''+b.id+'\')">Del</button>'+
    '</td></tr>').join('');
  return '<div><h2 class="section-title" style="margin-bottom:20px">💧 Baptism Bookings ('+baptisms.length+')</h2>'+
    '<div class="table-wrap"><table><thead><tr><th>Full Name</th><th>Phone</th><th>Preferred Date</th><th>Status</th><th>Booked</th><th>Actions</th></tr></thead>'+
    '<tbody>'+rows+(baptisms.length?'':'<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--text-dim)">No baptism bookings</td></tr>')+
    '</tbody></table></div></div>';
}

function adminEventsHTML(){
  const events=DB.get('events',[]);
  const cards=events.map(ev=>'<div class="card">'+
    '<div class="card-header"><div class="flex items-center justify-between"><span class="badge badge-gold">'+ev.type+'</span><button class="btn btn-sm btn-danger" onclick="deleteRecord(\'events\',\''+ev.id+'\')">Delete</button></div><div style="font-weight:700;margin-top:10px">'+ev.title+'</div></div>'+
    '<div class="card-body text-sm" style="display:flex;flex-direction:column;gap:6px">'+
    '<div><span style="color:var(--gold)">📅</span> '+fmtDate(ev.date)+'</div>'+
    '<div><span style="color:var(--gold)">📍</span> '+ev.location+'</div>'+
    (ev.speaker?'<div><span style="color:var(--gold)">🎤</span> '+ev.speaker+'</div>':'')+
    '<div class="text-dim">'+ev.description+'</div>'+
    '</div></div>').join('');
  return '<div><div class="flex items-center justify-between flex-wrap gap-3" style="margin-bottom:20px">'+
    '<h2 class="section-title">📅 Events ('+events.length+')</h2>'+
    '<button class="btn btn-primary btn-sm" onclick="openAddEventModal()">+ Add Event</button>'+
    '</div><div class="grid-2">'+cards+
    (events.length?'':'<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-emoji">📅</div><h3>No events yet</h3></div>')+
    '</div></div>';
}

function adminSettingsHTML(){
  return '<div><h2 class="section-title" style="margin-bottom:20px">⚙️ Settings</h2>'+
    '<div class="card" style="max-width:500px"><div class="card-header"><div class="font-bold">Admin Credentials</div></div><div class="card-body"><p class="text-dim text-sm" style="margin-bottom:11px">Create the administrator in Supabase Authentication, then grant access in the admin_users table.</p></div></div>'+
    '<div class="card" style="max-width:500px;margin-top:14px"><div class="card-header"><div class="font-bold">Church Information</div></div><div class="card-body text-sm" style="display:flex;flex-direction:column;gap:7px"><div><strong>Name:</strong> <span class="text-dim">International Christian Fellowship – Solution Centre</span></div><div><strong>Location:</strong> <span class="text-dim">Mariama Kunda, Kombo North, The Gambia</span></div><div><strong>Phone:</strong> <span class="text-dim">+220 9526987</span></div><div><strong>Overseers:</strong> <span class="text-dim">Pastor Mrs. Cecilia Romano &amp; Evangelist Daniel Romano</span></div></div></div>'+
    '<div class="card" style="max-width:500px;margin-top:14px;border-color:rgba(220,38,38,0.2)"><div class="card-header"><div class="font-bold text-sm" style="color:var(--red)">Danger Zone</div></div><div class="card-body"><p class="text-dim text-sm" style="margin-bottom:11px">Clear all locally stored data (cannot be undone).</p><button class="btn btn-danger" onclick="clearAllData()">🗑️ Clear All Data</button></div></div>'+
    '</div>';
}

function adminCSHTML(s){return adminSettingsHTMLFull();}

/* ── Admin Actions ── */
function updatePrayerStatus(id,s){const a=DB.get('prayers',[]),i=a.find(p=>p.id===id);if(i){i.status=s;DB.set('prayers',a);toast('Status updated','','success')}}
function updateBaptismStatus(id,s){const a=DB.get('baptisms',[]),i=a.find(b=>b.id===id);if(i){i.status=s;DB.set('baptisms',a);toast('Status updated','','success')}}
function updateMemberStatus(id,s){const a=DB.get('members',[]),i=a.find(m=>m.id===id);if(i){i.status=s;DB.set('members',a);toast('Member status updated','','success')}}
function filterMembersTable(s){
  const t=document.getElementById('members-table');if(!t)return;
  t.querySelectorAll('tbody tr').forEach(r=>{
    if(s==='all'){r.style.display='';return}
    const sel=r.querySelector('select');
    if(sel)r.style.display=sel.value===s?'':'none';
  });
}
function exportMembers(){
  const members=DB.get('members',[]);
  const csv=['Name,Email,Phone,Address,Role,Status,Joined',...members.map(m=>[m.name,m.email||'',m.phone||'',m.address||'',m.role,m.status,fmtDate(m.joinedAt)].join(','))].join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='icf-members.csv';a.click();
  toast('Members exported as CSV','','success');
}
function deleteRecord(table,id){
  if(!confirm('Delete this record?'))return;
  DB.set(table,DB.get(table,[]).filter(r=>r.id!==id));
  renderAdminSection(adminSection);toast('Record deleted','','info');
}
function clearAllData(){
  if(!confirm('This will delete all data. Are you sure?'))return;
  ['prayers','baptisms','events','members','seeded'].forEach(k=>DB.remove(k));
  seedData();seedMedia();renderAdminSection(adminSection);toast('Data cleared and reseeded','','info');
}

/* ── Admin Note Modal ── */
let noteCtx=null;
function openAdminNoteModal(table,id){
  noteCtx={table,id};
  const items=DB.get(table,[]),item=items.find(r=>r.id===id);
  document.getElementById('admin-note-text').value=item&&item.adminNote||'';
  document.getElementById('admin-note-modal').classList.add('open');
}
function closeAdminNoteModal(){document.getElementById('admin-note-modal').classList.remove('open');noteCtx=null}
function saveAdminNote(){
  if(!noteCtx)return;
  const note=document.getElementById('admin-note-text').value.trim();
  const items=DB.get(noteCtx.table,[]),item=items.find(r=>r.id===noteCtx.id);
  if(item){item.adminNote=note;DB.set(noteCtx.table,items)}
  closeAdminNoteModal();renderAdminSection(adminSection);toast('Note saved','','success');
}

/* ── Add Member Modal ── */
function openAddMemberModal(){document.getElementById('add-member-modal').classList.add('open')}
function closeAddMemberModal(){document.getElementById('add-member-modal').classList.remove('open');document.getElementById('add-member-form').querySelectorAll('input').forEach(el=>el.value='')}
function submitAddMemberForm(){
  const n=(document.getElementById('am-name')||{value:''}).value.trim();
  if(!n){toast('Please enter a name','','error');return}
  DB.push('members',{id:uid(),name:n,email:(document.getElementById('am-email')||{value:''}).value.trim(),phone:(document.getElementById('am-phone')||{value:''}).value.trim(),address:'',role:(document.getElementById('am-role')||{value:'member'}).value,status:'approved',joinedAt:new Date().toISOString()});
  closeAddMemberModal();renderAdminSection('members');toast('Member added','','success');
}

/* ── Add Event Modal ── */
function openAddEventModal(){document.getElementById('add-event-modal').classList.add('open')}
function closeAddEventModal(){document.getElementById('add-event-modal').classList.remove('open');document.getElementById('add-event-form').querySelectorAll('input,textarea').forEach(el=>el.value='')}
function submitAddEventForm(){
  const ti=(document.getElementById('ae-title')||{value:''}).value.trim();
  const da=(document.getElementById('ae-date')||{value:''}).value;
  const lo=(document.getElementById('ae-location')||{value:''}).value.trim();
  const de=(document.getElementById('ae-desc')||{value:''}).value.trim();
  if(!ti){toast('Please enter an event title','','error');return}
  if(!da){toast('Please select a start date','','error');return}
  if(!lo){toast('Please enter a location','','error');return}
  if(!de){toast('Please enter a description','','error');return}
  DB.push('events',{id:uid(),title:ti,date:da,endDate:(document.getElementById('ae-enddate')||{value:''}).value,location:lo,description:de,type:(document.getElementById('ae-type')||{value:'other'}).value,speaker:(document.getElementById('ae-speaker')||{value:''}).value.trim(),createdAt:new Date().toISOString()});
  closeAddEventModal();renderAdminSection('events');toast('Event added','','success');
}

/* ── Misc ── */
function toggleAnonymous(){
  const cb=document.getElementById('anon-checkbox');
  const ng=document.getElementById('prayer-name-group');
  if(ng)ng.style.display=cb&&cb.checked?'none':'block';
}
function toggleMobileNav(){document.getElementById('nav-mobile').classList.toggle('open')}

/* ── Global Exports ── */
window.showAddSermonForm=showAddSermonForm;window.hideAddSermonForm=hideAddSermonForm;
window.saveSermon=saveSermon;window.toggleSermonPublish=toggleSermonPublish;
window.showAddMediaForm=showAddMediaForm;window.hideAddMediaForm=hideAddMediaForm;
window.saveMedia=saveMedia;window.openLightbox=openLightbox;
window.showAddAnnouncementForm=showAddAnnouncementForm;window.hideAddAnnouncementForm=hideAddAnnouncementForm;
window.saveAnnouncement=saveAnnouncement;window.loadEmailTemplate=loadEmailTemplate;window.sendEmail=sendEmail;
window.saveLivestreamConfig=saveLivestreamConfig;window.startLivestream=startLivestream;window.stopLivestream=stopLivestream;
window.saveChurchSettings=saveChurchSettings;window.applyTheme=applyTheme;
window.navigate=navigate;window.doAdminLogin=doAdminLogin;window.submitAdminLogin=submitAdminLogin;
window.adminLogout=adminLogout;window.setAdminSection=setAdminSection;
window.openPrayerModal=openPrayerModal;window.closePrayerModal=closePrayerModal;window.submitPrayerForm=submitPrayerForm;
window.openBaptismModal=openBaptismModal;window.closeBaptismModal=closeBaptismModal;window.submitBaptismForm=submitBaptismForm;
window.submitContactForm=submitContactForm;window.submitSignup=submitSignup;window.doMemberLogin=doMemberLogin;
window.renderEvents=renderEvents;window.renderPrayers=renderPrayers;
window.toggleAnonymous=toggleAnonymous;window.toggleMobileNav=toggleMobileNav;window.toggleTheme=toggleTheme;
window.openAdminNoteModal=openAdminNoteModal;window.closeAdminNoteModal=closeAdminNoteModal;window.saveAdminNote=saveAdminNote;
window.openAddMemberModal=openAddMemberModal;window.closeAddMemberModal=closeAddMemberModal;window.submitAddMemberForm=submitAddMemberForm;
window.openAddEventModal=openAddEventModal;window.closeAddEventModal=closeAddEventModal;window.submitAddEventForm=submitAddEventForm;
window.updatePrayerStatus=updatePrayerStatus;window.updateBaptismStatus=updateBaptismStatus;
window.updateMemberStatus=updateMemberStatus;window.filterMembersTable=filterMembersTable;window.exportMembers=exportMembers;
window.deleteRecord=deleteRecord;window.clearAllData=clearAllData;window.checkPasswordStrength=checkPasswordStrength;

/* ── Init ── */


function icfStartupStep(name,callback){
  try{callback();}
  catch(error){console.error('[ICF startup] '+name+' failed:',error);}
}
document.addEventListener('DOMContentLoaded',()=>{
  icfStartupStep('theme',initTheme);
  icfStartupStep('seed data',seedData);
  icfStartupStep('seed media',seedMedia);
  icfStartupStep('language',initLanguage);
  icfStartupStep('language selectors',populateLangSelectors);
  icfStartupStep('country lists',populateCountryLists);
  icfStartupStep('phone search',()=>setupCountrySearch('phone','phone'));
  icfStartupStep('nationality search',()=>setupCountrySearch('nationality','nationality'));
  let hash='home';
  try{hash=window.location.hash.slice(1)||'home';}catch(error){}
  const requestedPage=ROUTES.includes(hash)?hash:'home';
  try{navigate(requestedPage);}
  catch(error){
    console.error('[ICF startup] initial route failed:',error);
    document.querySelectorAll('.page').forEach(page=>page.classList.remove('active'));
    const fallback=document.getElementById('page-'+requestedPage)||document.getElementById('page-home');
    if(fallback)fallback.classList.add('active');
    if(requestedPage==='home')icfStartupStep('hero slider fallback',icfHeroStart);
  }
  window.addEventListener('popstate',event=>{
    const page=(event.state&&event.state.page)||'home';
    document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
    const element=document.getElementById('page-'+page);
    if(element){
      element.classList.add('active');
      icfStartupStep('route render '+page,()=>renderPage(page));
    }
    document.querySelectorAll('.nav-link').forEach(link=>link.classList.toggle('active',link.dataset.page===page));
    if(page!=='home'&&window.ICFHeroSlider)window.ICFHeroSlider.stop();
  });
  window.dispatchEvent(new Event('icf:app-ready'));
},{once:true});
