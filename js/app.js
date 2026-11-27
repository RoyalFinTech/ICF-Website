

/* ICF monthly theme and hero slider */
let icfHeroIndex=0,icfHeroTimer=null;
function icfHeroGo(index){
  if(window.ICFHeroSlider){window.ICFHeroSlider.go(index);icfHeroIndex=window.ICFHeroSlider.index;return;}
  const slides=[...document.querySelectorAll(".icf-hero-slide")],dots=[...document.querySelectorAll(".icf-hero-dots button")];
  if(!slides.length)return;
  icfHeroIndex=(index+slides.length)%slides.length;
  slides.forEach((slide,i)=>slide.classList.toggle("active",i===icfHeroIndex));
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
 [s.slide1,s.slide2,s.slide3].forEach((src,i)=>{if(src&&imgs[i])imgs[i].src=src;});
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


/* ══════════════════════════════════════════════
   ICF GAMBIA – FULL ADMIN MODULES v4.0
   Sermons · Media · Announcements · Email
   Livestream · Analytics · Settings
   All fully functional, localStorage persistent
══════════════════════════════════════════════ */

/* ── SERMONS MODULE ─────────────────────────── */
function adminSermonsHTML(){
  const sermons=DB.get('sermons',[]);
  const rows=sermons.map(s=>'<tr>'+
    '<td><div style="font-weight:700">'+s.title+'</div><div class="text-xs text-dim">'+s.preacher+'</div></td>'+
    '<td class="text-dim text-sm">'+s.category+'</td>'+
    '<td class="text-dim text-sm">'+fmtDate(s.date)+'</td>'+
    '<td><span class="badge '+(s.published?'badge-green':'badge-yellow')+'">'+(s.published?'Published':'Draft')+'</span></td>'+
    '<td style="display:flex;gap:5px;flex-wrap:wrap">'+
      (s.videoUrl?'<a href="'+s.videoUrl+'" target="_blank" class="btn btn-sm btn-outline">▶ Video</a>':'')+
      (s.audioUrl?'<a href="'+s.audioUrl+'" target="_blank" class="btn btn-sm btn-outline">🎵 Audio</a>':'')+
      '<button class="btn btn-sm '+(s.published?'btn-danger':'btn-success')+'" onclick="toggleSermonPublish(\''+s.id+'\')">'+
        (s.published?'Unpublish':'Publish')+'</button>'+
      '<button class="btn btn-sm btn-danger" onclick="deleteRecord(\'sermons\',\''+s.id+'\')">Del</button>'+
    '</td>'+
  '</tr>').join('');

  return '<div>'+
    '<div class="flex items-center justify-between flex-wrap gap-3" style="margin-bottom:20px">'+
      '<h2 class="section-title">📖 Sermons ('+sermons.length+')</h2>'+
      '<button class="btn btn-primary btn-sm" onclick="showAddSermonForm()">+ Add Sermon</button>'+
    '</div>'+
    '<div class="card" id="add-sermon-panel" style="display:none;margin-bottom:22px">'+
      '<div class="card-header"><div class="font-bold">📖 Add New Sermon</div></div>'+
      '<div class="card-body">'+
        '<div class="form-row"><div class="form-group"><label class="form-label">Title *</label><input class="form-input" id="serm-title" placeholder="Sermon title"/></div>'+
        '<div class="form-group"><label class="form-label">Preacher *</label><input class="form-input" id="serm-preacher" placeholder="Speaker name"/></div></div>'+
        '<div class="form-row"><div class="form-group"><label class="form-label">Date *</label><input class="form-input" type="date" id="serm-date"/></div>'+
        '<div class="form-group"><label class="form-label">Category</label><select class="form-select" id="serm-cat"><option value="sunday">Sunday Service</option><option value="wednesday">Wednesday Teaching</option><option value="special">Special Message</option><option value="series">Series</option><option value="other">Other</option></select></div></div>'+
        '<div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="serm-desc" rows="3" placeholder="Sermon description or notes..."></textarea></div>'+
        '<div class="form-row"><div class="form-group"><label class="form-label">Video URL <span>(YouTube / direct)</span></label><input class="form-input" id="serm-video" placeholder="https://youtube.com/watch?v=..."/></div>'+
        '<div class="form-group"><label class="form-label">Audio URL <span>(MP3 link)</span></label><input class="form-input" id="serm-audio" placeholder="https://..."/></div></div>'+
        '<div class="form-group"><label class="form-label">PDF Notes URL <span>(Optional)</span></label><input class="form-input" id="serm-pdf" placeholder="https://..."/></div>'+
        '<div style="display:flex;gap:10px;margin-top:6px">'+
          '<button class="btn btn-outline" onclick="hideAddSermonForm()">Cancel</button>'+
          '<button class="btn btn-outline-gold" onclick="saveSermon(false)">💾 Save as Draft</button>'+
          '<button class="btn btn-primary" onclick="saveSermon(true)">🚀 Save &amp; Publish</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="table-wrap"><table>'+
      '<thead><tr><th>Sermon</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>'+
      '<tbody>'+rows+(sermons.length?'':'<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--text-dim)">No sermons yet. Add your first sermon above.</td></tr>')+
      '</tbody></table></div>'+
  '</div>';
}
function showAddSermonForm(){const p=document.getElementById('add-sermon-panel');if(p)p.style.display='block'}
function hideAddSermonForm(){const p=document.getElementById('add-sermon-panel');if(p)p.style.display='none'}
function saveSermon(publish){
  const title=(document.getElementById('serm-title')||{value:''}).value.trim();
  const preacher=(document.getElementById('serm-preacher')||{value:''}).value.trim();
  const date=(document.getElementById('serm-date')||{value:''}).value;
  if(!title){toast('Please enter a sermon title','','error');return}
  if(!preacher){toast('Please enter the preacher name','','error');return}
  if(!date){toast('Please select a date','','error');return}
  const sermon={
    id:uid(),title,preacher,date,
    category:(document.getElementById('serm-cat')||{value:'other'}).value,
    description:(document.getElementById('serm-desc')||{value:''}).value.trim(),
    videoUrl:(document.getElementById('serm-video')||{value:''}).value.trim(),
    audioUrl:(document.getElementById('serm-audio')||{value:''}).value.trim(),
    pdfUrl:(document.getElementById('serm-pdf')||{value:''}).value.trim(),
    published:publish,
    views:0,
    createdAt:new Date().toISOString()
  };
  DB.push('sermons',sermon);
  renderAdminSection('sermons');
  toast(publish?'Sermon published! 📖':'Sermon saved as draft','','success');
}
function toggleSermonPublish(id){
  const sermons=DB.get('sermons',[]);
  const s=sermons.find(s=>s.id===id);
  if(s){s.published=!s.published;DB.set('sermons',sermons);renderAdminSection('sermons');toast(s.published?'Sermon published':'Sermon unpublished','','success')}
}

/* ── MEDIA GALLERY MODULE ───────────────────── */
function adminMediaHTML(){
  const media=DB.get('media',[]);
  const cats=['All','Worship','Events','Community','Youth','Other'];
  const cards=media.map(m=>'<div class="card" style="overflow:hidden">'+
    '<div style="background:var(--bg2);height:140px;display:flex;align-items:center;justify-content:center;font-size:3rem;position:relative;overflow:hidden">'+
      (m.url?'<img src="'+m.url+'" alt="'+(m.title||'Gallery photo').replace(/"/g,'&quot;')+'" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'"/>':'📷')+
    '</div>'+
    '<div class="card-body" style="padding:12px 14px">'+
      '<div class="font-bold text-sm" style="margin-bottom:4px">'+m.title+'</div>'+
      '<div class="text-xs text-dim" style="margin-bottom:10px">'+m.category+' · '+fmtDate(m.createdAt)+'</div>'+
      '<div style="display:flex;gap:6px">'+
        (m.url?'<a href="'+m.url+'" target="_blank" class="btn btn-sm btn-outline">👁 View</a>':'')+
        '<button class="btn btn-sm btn-danger" onclick="deleteRecord(\'media\',\''+m.id+'\')">Delete</button>'+
      '</div>'+
    '</div>'+
  '</div>').join('');

  return '<div>'+
    '<div class="flex items-center justify-between flex-wrap gap-3" style="margin-bottom:20px">'+
      '<h2 class="section-title">📷 Media Gallery ('+media.length+')</h2>'+
      '<button class="btn btn-primary btn-sm" onclick="showAddMediaForm()">+ Upload Media</button>'+
    '</div>'+
    '<div class="card" id="add-media-panel" style="display:none;margin-bottom:22px">'+
      '<div class="card-header"><div class="font-bold">📷 Add Media Item</div></div>'+
      '<div class="card-body">'+
        '<div class="form-row">'+
          '<div class="form-group"><label class="form-label">Title *</label><input class="form-input" id="med-title" placeholder="Image or video title"/></div>'+
          '<div class="form-group"><label class="form-label">Category</label><select class="form-select" id="med-cat"><option value="Worship">Worship</option><option value="Events">Events</option><option value="Community">Community</option><option value="Youth">Youth</option><option value="Other">Other</option></select></div>'+
        '</div>'+
        '<div class="form-group"><label class="form-label">Media URL *<span> (Image or Video link)</span></label><input class="form-input" id="med-url" placeholder="https://... (direct image URL or YouTube link)"/></div>'+
        '<div class="form-group"><label class="form-label">Type</label><select class="form-select" id="med-type"><option value="image">🖼️ Image</option><option value="video">🎥 Video</option></select></div>'+
        '<div class="form-group"><label class="form-label">Description <span>(Optional)</span></label><textarea class="form-textarea" id="med-desc" rows="2" placeholder="Caption or description..."></textarea></div>'+
        '<div style="display:flex;gap:10px;margin-top:6px">'+
          '<button class="btn btn-outline" onclick="hideAddMediaForm()">Cancel</button>'+
          '<button class="btn btn-primary" onclick="saveMedia()">📷 Add to Gallery</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
    (media.length?
      '<div class="grid-3">'+cards+'</div>':
      '<div class="empty-state"><div class="empty-state-emoji">📷</div><h3>No media yet</h3><p>Upload your first image or video above.</p></div>'
    )+
  '</div>';
}
function showAddMediaForm(){const p=document.getElementById('add-media-panel');if(p)p.style.display='block'}
function hideAddMediaForm(){const p=document.getElementById('add-media-panel');if(p)p.style.display='none'}
function saveMedia(){
  const title=(document.getElementById('med-title')||{value:''}).value.trim();
  const url=(document.getElementById('med-url')||{value:''}).value.trim();
  if(!title){toast('Please enter a title','','error');return}
  if(!url){toast('Please enter a media URL','','error');return}
  DB.push('media',{id:uid(),title,url,
    category:(document.getElementById('med-cat')||{value:'Other'}).value,
    type:(document.getElementById('med-type')||{value:'image'}).value,
    description:(document.getElementById('med-desc')||{value:''}).value.trim(),
    createdAt:new Date().toISOString()
  });
  renderAdminSection('media');
  toast('Media added to gallery 📷','','success');
}

/* ── ANNOUNCEMENTS MODULE ───────────────────── */
function adminAnnouncementsHTML(){
  const announcements=DB.get('announcements',[]);
  const prioBadge=p=>({high:'badge-rose',medium:'badge-yellow',low:'badge-gray'}[p]||'badge-gray');

  return '<div>'+
    '<div class="flex items-center justify-between flex-wrap gap-3" style="margin-bottom:20px">'+
      '<h2 class="section-title">📢 Announcements ('+announcements.length+')</h2>'+
      '<button class="btn btn-primary btn-sm" onclick="showAddAnnouncementForm()">+ New Announcement</button>'+
    '</div>'+
    '<div class="card" id="add-ann-panel" style="display:none;margin-bottom:22px">'+
      '<div class="card-header"><div class="font-bold">📢 Create Announcement</div></div>'+
      '<div class="card-body">'+
        '<div class="form-group"><label class="form-label">Title *</label><input class="form-input" id="ann-title" placeholder="Announcement title"/></div>'+
        '<div class="form-group"><label class="form-label">Content *</label><textarea class="form-textarea" id="ann-content" rows="4" placeholder="Full announcement content..."></textarea></div>'+
        '<div class="form-row">'+
          '<div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="ann-priority"><option value="high">🔴 High</option><option value="medium" selected>🟡 Medium</option><option value="low">🟢 Low</option></select></div>'+
          '<div class="form-group"><label class="form-label">Expiry Date <span>(Optional)</span></label><input class="form-input" type="date" id="ann-expiry"/></div>'+
        '</div>'+
        '<div style="display:flex;gap:10px;margin-top:6px">'+
          '<button class="btn btn-outline" onclick="hideAddAnnouncementForm()">Cancel</button>'+
          '<button class="btn btn-primary" onclick="saveAnnouncement()">📢 Publish Announcement</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:14px">'+
      announcements.map(a=>'<div class="card">'+
        '<div class="card-header">'+
          '<div class="flex items-center justify-between flex-wrap gap-2">'+
            '<div class="flex items-center gap-2"><span class="badge '+prioBadge(a.priority)+'">'+a.priority+' priority</span>'+
            (a.expiry&&new Date(a.expiry)<new Date()?'<span class="badge badge-gray">Expired</span>':'<span class="badge badge-green">Active</span>')+
            '</div>'+
            '<div style="display:flex;gap:6px">'+
              '<button class="btn btn-sm btn-danger" onclick="deleteRecord(\'announcements\',\''+a.id+'\')">Delete</button>'+
            '</div>'+
          '</div>'+
          '<div style="font-weight:700;margin-top:9px;font-size:1rem">'+a.title+'</div>'+
          '<div class="text-xs text-dim">Published '+fmtDate(a.createdAt)+(a.expiry?' · Expires '+fmtDate(a.expiry):' · No expiry')+'</div>'+
        '</div>'+
        '<div class="card-body"><p class="text-dim text-sm" style="line-height:1.7">'+a.content+'</p></div>'+
      '</div>').join('')+
      (announcements.length?'':'<div class="empty-state"><div class="empty-state-emoji">📢</div><h3>No announcements yet</h3><p>Create your first announcement above.</p></div>')+
    '</div>'+
  '</div>';
}
function showAddAnnouncementForm(){const p=document.getElementById('add-ann-panel');if(p)p.style.display='block'}
function hideAddAnnouncementForm(){const p=document.getElementById('add-ann-panel');if(p)p.style.display='none'}
function saveAnnouncement(){
  const title=(document.getElementById('ann-title')||{value:''}).value.trim();
  const content=(document.getElementById('ann-content')||{value:''}).value.trim();
  if(!title){toast('Please enter a title','','error');return}
  if(!content){toast('Please enter the announcement content','','error');return}
  DB.push('announcements',{id:uid(),title,content,
    priority:(document.getElementById('ann-priority')||{value:'medium'}).value,
    expiry:(document.getElementById('ann-expiry')||{value:''}).value||'',
    createdAt:new Date().toISOString()
  });
  renderAdminSection('announcements');
  toast('Announcement published 📢','It is now visible on the website.','success');
}

/* ── EMAIL NOTIFICATIONS MODULE ─────────────── */
function adminNewsletterHTML(){
  const history=DB.get('emailHistory',[]);
  const members=DB.get('members',[]).filter(m=>m.status==='approved'&&m.email);

  return '<div>'+
    '<h2 class="section-title" style="margin-bottom:20px">📧 Email Notifications</h2>'+
    '<div class="grid-2" style="margin-bottom:24px">'+
      '<div class="card">'+
        '<div class="card-header"><div class="font-bold">✉️ Compose &amp; Send</div></div>'+
        '<div class="card-body">'+
          '<div class="form-group"><label class="form-label">Recipients</label>'+
            '<select class="form-select" id="em-recipients">'+
              '<option value="all">📋 All Members ('+members.length+' with email)</option>'+
              '<option value="approved">✅ Approved Members Only</option>'+
              '<option value="test">🧪 Test (Admin only)</option>'+
            '</select></div>'+
          '<div class="form-group"><label class="form-label">Template</label>'+
            '<select class="form-select" id="em-template" onchange="loadEmailTemplate(this.value)">'+
              '<option value="custom">✍️ Custom Message</option>'+
              '<option value="event">📅 Event Reminder</option>'+
              '<option value="prayer">🙏 Prayer Update</option>'+
              '<option value="bulletin">📰 Weekly Bulletin</option>'+
              '<option value="welcome">👋 Welcome Message</option>'+
            '</select></div>'+
          '<div class="form-group"><label class="form-label">Subject *</label><input class="form-input" id="em-subject" placeholder="Email subject"/></div>'+
          '<div class="form-group"><label class="form-label">Message *</label><textarea class="form-textarea" id="em-body" rows="7" placeholder="Write your message here..."></textarea></div>'+
          '<button class="btn btn-blue btn-full" onclick="sendEmail()">📧 Send Email</button>'+
        '</div>'+
      '</div>'+
      '<div>'+
        '<div class="card" style="margin-bottom:14px">'+
          '<div class="card-header"><div class="font-bold">📊 Email Stats</div></div>'+
          '<div class="card-body" style="display:flex;flex-direction:column;gap:10px">'+
            '<div class="flex items-center justify-between"><span class="text-dim text-sm">Total Sent</span><strong>'+history.length+'</strong></div>'+
            '<div class="flex items-center justify-between"><span class="text-dim text-sm">Members with Email</span><strong>'+members.length+'</strong></div>'+
          '</div>'+
        '</div>'+
        '<div class="card">'+
          '<div class="card-header"><div class="font-bold">📜 Send History</div></div>'+
          '<div style="max-height:280px;overflow-y:auto">'+
            (history.length?history.map(h=>'<div style="padding:11px 16px;border-bottom:1px solid var(--border2)">'+
              '<div class="font-semibold text-sm">'+h.subject+'</div>'+
              '<div class="text-xs text-dim">'+fmtDate(h.sentAt)+' · To: '+h.recipients+' · '+h.count+' recipients</div>'+
            '</div>').join(''):
            '<div style="padding:22px;text-align:center;color:var(--text-muted);font-size:13px">No emails sent yet</div>')+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>';
}
function loadEmailTemplate(tpl){
  const templates={
    event:{subject:'📅 Upcoming ICF Event – Don\'t Miss Out!',body:'Dear Church Family,\n\nWe are excited to announce an upcoming event at ICF Solution Centre.\n\nPlease check our website for full details and join us for a time of fellowship and worship.\n\nGod bless you,\nICF Gambia Team'},
    prayer:{subject:'🙏 Prayer Update from ICF Gambia',body:'Dear Prayer Partner,\n\nThank you for your faithful prayers. We have exciting prayer testimonies to share.\n\nContinue standing in faith as we believe God together.\n\nIn His service,\nICF Prayer Team'},
    bulletin:{subject:'📰 ICF Weekly Bulletin',body:'Dear ICF Family,\n\nHere is your weekly bulletin:\n\n📅 SUNDAY SERVICE: 10:00 AM – 12:00 Noon\n📖 WEDNESDAY DISCIPLESHIP: 6:00 PM – 7:00 PM\n🙏 FRIDAY PRAYER: 6:00 PM – 8:00 PM\n\nMay God bless you richly this week!\n\nICF Solution Centre'},
    welcome:{subject:'👋 Welcome to ICF Gambia!',body:'Dear New Member,\n\nWelcome to the ICF Gambia family! We are so glad you have joined us.\n\nYour registration has been received and is pending approval. We will contact you soon.\n\nService Times:\n• Sunday: 10:00 AM – 12:00 Noon\n• Wednesday: 6:00 PM – 7:00 PM\n• Friday: 6:00 PM – 8:00 PM\n\nGod bless you!\nPastor Mrs. Cecilia Romano'},
    custom:{subject:'',body:''}
  };
  const t=templates[tpl]||templates.custom;
  const s=document.getElementById('em-subject');if(s)s.value=t.subject;
  const b=document.getElementById('em-body');if(b)b.value=t.body;
}
function sendEmail(){
  const subject=(document.getElementById('em-subject')||{value:''}).value.trim();
  const body=(document.getElementById('em-body')||{value:''}).value.trim();
  const recip=(document.getElementById('em-recipients')||{value:'all'}).value;
  if(!subject){toast('Please enter a subject','','error');return}
  if(!body){toast('Please enter a message','','error');return}
  const members=DB.get('members',[]);
  const count=recip==='test'?1:members.filter(m=>m.email&&(recip==='all'||m.status==='approved')).length;
  const history=DB.get('emailHistory',[]);
  history.unshift({id:uid(),subject,body,recipients:recip,count,sentAt:new Date().toISOString()});
  DB.set('emailHistory',history);
  renderAdminSection('newsletter');
  toast('Email queued for '+count+' recipient'+(count!==1?'s':''),'In production, connect an email API (SendGrid / Mailgun).','success');
}

/* ── LIVESTREAM MODULE ──────────────────────── */
function adminLivestreamHTML(){
  const ls=DB.get('livestream',{active:false,title:'',youtubeUrl:'',facebookUrl:'',description:'',scheduledAt:''});

  return '<div>'+
    '<h2 class="section-title" style="margin-bottom:20px">🎥 Livestream Manager</h2>'+
    '<div class="grid-2">'+
      '<div>'+
        '<div class="card" style="margin-bottom:16px;border-color:'+(ls.active?'rgba(22,163,74,0.4)':'var(--border2)')+'">'+
          '<div class="card-header">'+
            '<div class="flex items-center gap-2">'+
              '<div style="width:10px;height:10px;border-radius:50%;background:'+(ls.active?'var(--green)':'var(--text-muted)')+(ls.active?';animation:pulse 1.5s infinite':'')+'"></div>'+
              '<div class="font-bold">'+(ls.active?'🔴 LIVE NOW':'⚫ Stream Offline')+'</div>'+
            '</div>'+
          '</div>'+
          '<div class="card-body">'+
            (ls.active&&ls.youtubeUrl?'<div style="position:relative;padding-bottom:56.25%;height:0;margin-bottom:14px"><iframe src="'+ls.youtubeUrl.replace('watch?v=','embed/')+'" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:8px" allowfullscreen></iframe></div>':'<div style="background:var(--bg2);border-radius:8px;height:160px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;margin-bottom:14px">🎥</div>')+
            (ls.active?'<div class="font-bold" style="margin-bottom:4px">'+ls.title+'</div><div class="text-dim text-sm">'+ls.description+'</div>':'<p class="text-dim text-sm">No active stream. Configure and start a stream below.</p>')+
          '</div>'+
          (ls.active?'<div class="card-header"><button class="btn btn-danger btn-full" onclick="stopLivestream()">⏹ Stop Stream</button></div>':'')+
        '</div>'+
      '</div>'+
      '<div class="card">'+
        '<div class="card-header"><div class="font-bold">⚙️ Configure Stream</div></div>'+
        '<div class="card-body">'+
          '<div class="form-group"><label class="form-label">Stream Title *</label><input class="form-input" id="ls-title" value="'+escH(ls.title||'')+'" placeholder="E.g. Sunday Worship Service – Live"/></div>'+
          '<div class="form-group"><label class="form-label">YouTube URL</label><input class="form-input" id="ls-youtube" value="'+escH(ls.youtubeUrl||'')+'" placeholder="https://youtube.com/watch?v=..."/></div>'+
          '<div class="form-group"><label class="form-label">Facebook URL</label><input class="form-input" id="ls-facebook" value="'+escH(ls.facebookUrl||'')+'" placeholder="https://facebook.com/..."/></div>'+
          '<div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="ls-desc" rows="3" placeholder="What is this stream about?">'+escH(ls.description||'')+'</textarea></div>'+
          '<div class="form-group"><label class="form-label">Scheduled Time <span>(Optional)</span></label><input class="form-input" type="datetime-local" id="ls-schedule" value="'+escH(ls.scheduledAt||'')+'"/></div>'+
          '<div style="display:flex;gap:10px;margin-top:6px">'+
            '<button class="btn btn-outline" onclick="saveLivestreamConfig()">💾 Save Config</button>'+
            '<button class="btn btn-primary" onclick="startLivestream()">🔴 Go Live</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="card" style="margin-top:16px">'+
      '<div class="card-header"><div class="font-bold">📋 Stream Instructions</div></div>'+
      '<div class="card-body text-sm text-dim" style="display:flex;flex-direction:column;gap:7px">'+
        '<div>1. Start your stream on YouTube or Facebook Studio first.</div>'+
        '<div>2. Copy the live stream URL and paste it above.</div>'+
        '<div>3. Click "Go Live" — the stream will appear on the website homepage instantly.</div>'+
        '<div>4. Click "Stop Stream" when the service ends to remove it from the website.</div>'+
      '</div>'+
    '</div>'+
  '</div>';
}
function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function saveLivestreamConfig(){
  const ls=DB.get('livestream',{});
  ls.title=(document.getElementById('ls-title')||{value:''}).value.trim();
  ls.youtubeUrl=(document.getElementById('ls-youtube')||{value:''}).value.trim();
  ls.facebookUrl=(document.getElementById('ls-facebook')||{value:''}).value.trim();
  ls.description=(document.getElementById('ls-desc')||{value:''}).value.trim();
  ls.scheduledAt=(document.getElementById('ls-schedule')||{value:''}).value;
  DB.set('livestream',ls);
  toast('Stream configuration saved','','success');
}
function startLivestream(){
  saveLivestreamConfig();
  const ls=DB.get('livestream',{});
  if(!ls.title){toast('Please enter a stream title','','error');return}
  ls.active=true;ls.startedAt=new Date().toISOString();
  DB.set('livestream',ls);
  renderAdminSection('livestream');
  toast('Stream is now LIVE 🔴','It is visible on the website homepage.','success');
}
function stopLivestream(){
  const ls=DB.get('livestream',{});
  ls.active=false;ls.startedAt='';
  DB.set('livestream',ls);
  renderAdminSection('livestream');
  toast('Stream stopped','Removed from public website.','info');
}

/* ── ANALYTICS MODULE ───────────────────────── */
function adminAnalyticsHTML(){
  const prayers=DB.get('prayers',[]);
  const baptisms=DB.get('baptisms',[]);
  const events=DB.get('events',[]);
  const members=DB.get('members',[]);
  const sermons=DB.get('sermons',[]);
  const media=DB.get('media',[]);
  const announcements=DB.get('announcements',[]);
  const approved=members.filter(m=>m.status==='approved').length;
  const pending=members.filter(m=>m.status==='pending').length;
  const answered=prayers.filter(p=>p.status==='answered').length;
  const pubSermons=sermons.filter(s=>s.published).length;

  // Build simple bar chart using CSS
  const maxVal=Math.max(members.length,prayers.length,baptisms.length,events.length,sermons.length,1);
  function bar(label,val,color){
    const pct=Math.round((val/maxVal)*100);
    return '<div style="margin-bottom:16px">'+
      '<div class="flex items-center justify-between" style="margin-bottom:5px">'+
        '<span class="text-sm font-semibold">'+label+'</span>'+
        '<span class="text-sm font-bold">'+val+'</span>'+
      '</div>'+
      '<div style="background:var(--border2);border-radius:999px;height:10px;overflow:hidden">'+
        '<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:999px;transition:width .6s ease"></div>'+
      '</div>'+
    '</div>';
  }

  // Weekly activity (last 7 days)
  const now=Date.now();
  const weekMs=7*24*60*60*1000;
  const recentPrayers=prayers.filter(p=>now-new Date(p.createdAt).getTime()<weekMs).length;
  const recentMembers=members.filter(m=>now-new Date(m.joinedAt).getTime()<weekMs).length;
  const recentBaptisms=baptisms.filter(b=>now-new Date(b.createdAt).getTime()<weekMs).length;

  return '<div>'+
    '<h2 class="section-title" style="margin-bottom:20px">📊 Analytics &amp; Insights</h2>'+
    '<div class="admin-stats" style="margin-bottom:24px">'+
      '<div class="admin-stat"><div class="admin-stat-value">'+members.length+'</div><div class="admin-stat-label">👥 Total Members</div></div>'+
      '<div class="admin-stat" style="border-color:rgba(22,163,74,0.3)"><div class="admin-stat-value" style="color:var(--green)">'+approved+'</div><div class="admin-stat-label">✅ Active Members</div></div>'+
      '<div class="admin-stat" style="border-color:rgba(217,119,6,0.3)"><div class="admin-stat-value" style="color:var(--amber)">'+pending+'</div><div class="admin-stat-label">⏳ Pending Approval</div></div>'+
      '<div class="admin-stat"><div class="admin-stat-value">'+prayers.length+'</div><div class="admin-stat-label">🙏 Total Prayers</div></div>'+
      '<div class="admin-stat" style="border-color:rgba(22,163,74,0.3)"><div class="admin-stat-value" style="color:var(--green)">'+answered+'</div><div class="admin-stat-label">✅ Answered Prayers</div></div>'+
      '<div class="admin-stat"><div class="admin-stat-value">'+baptisms.length+'</div><div class="admin-stat-label">💧 Baptism Bookings</div></div>'+
      '<div class="admin-stat"><div class="admin-stat-value">'+events.length+'</div><div class="admin-stat-label">📅 Events Created</div></div>'+
      '<div class="admin-stat"><div class="admin-stat-value">'+pubSermons+'</div><div class="admin-stat-label">📖 Published Sermons</div></div>'+
    '</div>'+
    '<div class="grid-2">'+
      '<div class="card">'+
        '<div class="card-header"><div class="font-bold">📈 Ministry Overview</div></div>'+
        '<div class="card-body">'+
          bar('👥 Members',members.length,'var(--blue-g)')+
          bar('🙏 Prayer Requests',prayers.length,'var(--rose)')+
          bar('💧 Baptisms',baptisms.length,'var(--cyan)')+
          bar('📅 Events',events.length,'var(--amber)')+
          bar('📖 Sermons',sermons.length,'var(--purple)')+
          bar('📷 Media Items',media.length,'var(--green)')+
        '</div>'+
      '</div>'+
      '<div>'+
        '<div class="card" style="margin-bottom:14px">'+
          '<div class="card-header"><div class="font-bold">⚡ This Week (Last 7 Days)</div></div>'+
          '<div class="card-body" style="display:flex;flex-direction:column;gap:12px">'+
            '<div class="flex items-center justify-between"><span class="text-dim">New Members</span><span class="badge badge-green">+'+recentMembers+'</span></div>'+
            '<div class="flex items-center justify-between"><span class="text-dim">Prayer Requests</span><span class="badge badge-rose">+'+recentPrayers+'</span></div>'+
            '<div class="flex items-center justify-between"><span class="text-dim">Baptism Bookings</span><span class="badge badge-blue">+'+recentBaptisms+'</span></div>'+
          '</div>'+
        '</div>'+
        '<div class="card">'+
          '<div class="card-header"><div class="font-bold">📋 Content Summary</div></div>'+
          '<div class="card-body" style="display:flex;flex-direction:column;gap:10px">'+
            '<div class="flex items-center justify-between text-sm"><span class="text-dim">Announcements</span><strong>'+announcements.length+'</strong></div>'+
            '<div class="flex items-center justify-between text-sm"><span class="text-dim">Media Gallery Items</span><strong>'+media.length+'</strong></div>'+
            '<div class="flex items-center justify-between text-sm"><span class="text-dim">Total Sermons</span><strong>'+sermons.length+'</strong></div>'+
            '<div class="flex items-center justify-between text-sm"><span class="text-dim">Published Sermons</span><strong>'+pubSermons+'</strong></div>'+
            '<div class="flex items-center justify-between text-sm"><span class="text-dim">Upcoming Events</span><strong>'+events.filter(e=>new Date(e.date)>new Date()).length+'</strong></div>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>';
}

/* ── FULL SETTINGS MODULE ───────────────────── */
function adminSettingsHTMLFull(){
  const settings=DB.get('siteSettings',{
    churchName:'International Christian Fellowship',
    branch:'Solution Centre',
    address:'Mariama Kunda, Kombo North, The Gambia',
    phone:'+220 9526987',
    email:'info@icfgambia.org',
    welcomeMsg:'Welcome and thank you for your visit today. We are delighted to have you visit International Christian Fellowship Solution Centre.',
    themeMode:'light'
  });
  const admins=DB.get('members',[]).filter(m=>m.role==='admin');

  return '<div>'+
    '<h2 class="section-title" style="margin-bottom:22px">⚙️ Settings</h2>'+

    /* Church Info */
    '<div class="card" style="max-width:680px;margin-bottom:18px">'+
      '<div class="card-header"><div class="font-bold">🏛️ Church Information</div></div>'+
      '<div class="card-body">'+
        '<div class="form-row">'+
          '<div class="form-group"><label class="form-label">Church Name</label><input class="form-input" id="cfg-name" value="'+escH(settings.churchName)+'"/></div>'+
          '<div class="form-group"><label class="form-label">Branch Name</label><input class="form-input" id="cfg-branch" value="'+escH(settings.branch)+'"/></div>'+
        '</div>'+
        '<div class="form-group"><label class="form-label">Address</label><input class="form-input" id="cfg-address" value="'+escH(settings.address)+'"/></div>'+
        '<div class="form-row">'+
          '<div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="cfg-phone" value="'+escH(settings.phone)+'"/></div>'+
          '<div class="form-group"><label class="form-label">Email</label><input class="form-input" id="cfg-email" value="'+escH(settings.email)+'"/></div>'+
        '</div>'+
        '<div class="form-group"><label class="form-label">Welcome Message</label><textarea class="form-textarea" id="cfg-welcome" rows="3">'+escH(settings.welcomeMsg)+'</textarea></div>'+
        '<button class="btn btn-primary" onclick="saveChurchSettings()">💾 Save Church Info</button>'+
      '</div>'+
    '</div>'+

    /* Theme Settings */
    '<div class="card" style="max-width:680px;margin-bottom:18px">'+
      '<div class="card-header"><div class="font-bold">🎨 Theme Settings</div></div>'+
      '<div class="card-body">'+
        '<div class="form-group"><label class="form-label">Website Theme</label>'+
          '<div style="display:flex;gap:10px;margin-top:6px">'+
            '<button class="btn '+(document.body.getAttribute('data-theme')==='light'?'btn-primary':'btn-outline')+'" onclick="applyTheme(\'light\')">☀️ Light Mode</button>'+
            '<button class="btn '+(document.body.getAttribute('data-theme')==='dark'?'btn-primary':'btn-outline')+'" onclick="applyTheme(\'dark\')">🌙 Dark Mode</button>'+
          '</div>'+
        '</div>'+
        '<p class="text-dim text-sm">Theme preference is saved and applied immediately across the entire website.</p>'+
      '</div>'+
    '</div>'+

    /* Admin Management */
    '<div class="card" style="max-width:680px;margin-bottom:18px">'+
      '<div class="card-header"><div class="font-bold">👤 Admin Management</div></div>'+
      '<div class="card-body">'+
        '<p class="text-dim text-sm" style="margin-bottom:14px">Current admin accounts:</p>'+
        '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">'+
          admins.map(a=>'<div class="flex items-center justify-between" style="background:var(--bg2);padding:10px 14px;border-radius:8px">'+
            '<div><div class="font-semibold text-sm">'+a.name+'</div><div class="text-xs text-dim">'+a.email+'</div></div>'+
            '<span class="badge badge-gold">Admin</span>'+
          '</div>').join('')+
          (!admins.length?'<p class="text-dim text-sm">No admin accounts found.</p>':'')+
        '</div>'+
        '<div class="sep"></div>'+
        '<p class="text-dim text-sm" style="margin-bottom:10px">Default login credentials:</p>'+
        '<p class="text-sm">Administrator email: the account configured in Supabase.</p>'+
        '<p class="text-sm" style="margin-top:5px">Password: set securely in Supabase Authentication.</p>'+
      '</div>'+
    '</div>'+

    /* Danger Zone */
    '<div class="card" style="max-width:680px;border-color:rgba(220,38,38,0.25)">'+
      '<div class="card-header"><div class="font-bold text-sm" style="color:var(--red)">⚠️ Danger Zone</div></div>'+
      '<div class="card-body">'+
        '<p class="text-dim text-sm" style="margin-bottom:14px">Clear all stored data and reset to defaults. This cannot be undone.</p>'+
        '<button class="btn btn-danger" onclick="clearAllData()">🗑️ Reset All Data</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}
function saveChurchSettings(){
  const s=DB.get('siteSettings',{});
  s.churchName=(document.getElementById('cfg-name')||{value:''}).value.trim()||s.churchName;
  s.branch=(document.getElementById('cfg-branch')||{value:''}).value.trim()||s.branch;
  s.address=(document.getElementById('cfg-address')||{value:''}).value.trim()||s.address;
  s.phone=(document.getElementById('cfg-phone')||{value:''}).value.trim()||s.phone;
  s.email=(document.getElementById('cfg-email')||{value:''}).value.trim()||s.email;
  s.welcomeMsg=(document.getElementById('cfg-welcome')||{value:''}).value.trim()||s.welcomeMsg;
  DB.set('siteSettings',s);
  toast('Church settings saved ✅','Changes reflected across the website.','success');
}
function applyTheme(mode){
  document.body.setAttribute('data-theme',mode);
  _store.setItem('icf_theme',mode);
  const btn=document.getElementById('theme-btn');
  if(btn)btn.textContent=mode==='dark'?'☀️':'🌙';
  renderAdminSection('settings');
  toast('Theme set to '+(mode==='dark'?'Dark':'Light')+' Mode','','success');
}

/* ── PUBLIC PAGES FOR SYNCED DATA ───────────── */
function renderSermons(){
  const sermons=DB.get('sermons',[]).filter(s=>s.published);
  const grid=document.getElementById('sermons-grid');
  if(!grid)return;
  if(!sermons.length){
    grid.innerHTML='<div class="empty-state"><div class="empty-state-emoji">📖</div><h3>No sermons yet</h3><p>Check back soon for uploaded sermons.</p></div>';
    return;
  }
  const catBadge=c=>({sunday:'badge-gold',wednesday:'badge-blue',special:'badge-rose',series:'badge-purple',other:'badge-gray'}[c]||'badge-gray');
  grid.innerHTML=sermons.map(s=>'<div class="card">'+
    '<div class="card-body">'+
      '<div style="display:flex;align-items:flex-start;gap:14px">'+
        '<div style="font-size:2.2rem;flex-shrink:0">📖</div>'+
        '<div style="flex:1">'+
          '<span class="badge '+catBadge(s.category)+'" style="margin-bottom:8px;display:inline-flex">'+s.category+'</span>'+
          '<div class="font-bold" style="font-size:1.02rem;margin-bottom:4px">'+s.title+'</div>'+
          '<div class="text-dim text-sm" style="margin-bottom:6px">🎤 '+s.preacher+' &nbsp;·&nbsp; 📅 '+fmtDate(s.date)+'</div>'+
          (s.description?'<p class="text-dim text-sm" style="line-height:1.6;margin-bottom:10px">'+s.description+'</p>':'')+
          '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
            (s.videoUrl?'<a href="'+s.videoUrl+'" target="_blank" class="btn btn-sm btn-outline-rose">▶ Watch</a>':'')+
            (s.audioUrl?'<a href="'+s.audioUrl+'" target="_blank" class="btn btn-sm btn-outline-gold">🎵 Listen</a>':'')+
            (s.pdfUrl?'<a href="'+s.pdfUrl+'" target="_blank" class="btn btn-sm btn-outline">📄 Notes</a>':'')+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>').join('');
}

let galleryActiveFilter='All';
function renderGalleryFilters(media){
  const bar=document.getElementById('gallery-filters');
  if(!bar)return;
  const cats=['All',...Array.from(new Set(media.map(m=>m.category))).sort()];
  bar.innerHTML=cats.map(c=>{
    const active=c===galleryActiveFilter;
    return '<button class="badge '+(active?'badge-gold':'badge-gray')+'" style="cursor:pointer;border:1px solid;padding:6px 13px;font-size:12px" onclick="setGalleryFilter('+JSON.stringify(c).replace(/"/g,'&quot;')+')">'+c+'</button>';
  }).join('');
}
function setGalleryFilter(c){galleryActiveFilter=c;renderGallery();}
function renderGallery(){
  const media=DB.get('media',[]);
  const grid=document.getElementById('gallery-grid');
  if(!grid)return;
  renderGalleryFilters(media);
  if(!media.length){
    grid.innerHTML='<div class="empty-state"><div class="empty-state-emoji">📷</div><h3>No media yet</h3><p>Check back soon for photos and videos.</p></div>';
    return;
  }
  const filtered=galleryActiveFilter==='All'?media:media.filter(m=>m.category===galleryActiveFilter);
  if(!filtered.length){
    grid.innerHTML='<div class="empty-state"><div class="empty-state-emoji">📷</div><h3>No photos in this category yet</h3></div>';
    return;
  }
  grid.innerHTML=filtered.map(m=>'<div class="card" style="overflow:hidden;cursor:pointer" onclick="openLightbox(\''+m.id+'\')">'+
    '<div style="height:190px;background:var(--bg2);overflow:hidden;display:flex;align-items:center;justify-content:center">'+
      (m.url?'<img src="'+m.url+'" alt="'+(m.alt||m.title||'Gallery photo').replace(/"/g,'&quot;')+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML=\'📷\'" loading="lazy"/>':'<span style="font-size:2.5rem">📷</span>')+
    '</div>'+
    '<div style="padding:10px 14px">'+
      '<div class="font-semibold text-sm">'+m.title+'</div>'+
      '<div class="text-xs text-dim">'+m.category+(m.eventLabel?' · '+m.eventLabel:'')+'</div>'+
    '</div>'+
  '</div>').join('');
}

function openLightbox(id){
  const media=DB.get('media',[]);
  const m=media.find(x=>x.id===id);
  if(!m)return;
  const existing=document.getElementById('lightbox-overlay');
  if(existing)existing.remove();
  const div=document.createElement('div');
  div.id='lightbox-overlay';
  div.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px';
  div.onclick=function(e){if(e.target===div)div.remove()};
  div.innerHTML='<div style="max-width:860px;width:100%;text-align:center">'+
    '<button onclick="document.getElementById(\'lightbox-overlay\').remove()" style="position:fixed;top:20px;right:24px;background:none;border:none;color:#fff;font-size:2rem;cursor:pointer">✕</button>'+
    (m.url?'<img src="'+m.url+'" alt="'+(m.alt||m.title||'Gallery photo').replace(/"/g,'&quot;')+'" style="max-width:100%;max-height:80vh;border-radius:10px;object-fit:contain" onerror="this.style.display=\'none\'"/>':'<div style="font-size:5rem">📷</div>')+
    '<div style="color:#fff;margin-top:14px;font-weight:600">'+m.title+'</div>'+
    (m.eventLabel?'<div style="color:var(--gold);font-size:11.5px;margin-top:4px;font-weight:600">'+m.eventLabel+'</div>':'')+
    (m.description?'<div style="color:rgba(255,255,255,0.65);font-size:13px;margin-top:6px;max-width:640px;margin-left:auto;margin-right:auto">'+m.description+'</div>':'')+
  '</div>';
  document.body.appendChild(div);
}

function renderAnnouncements(){
  const announcements=DB.get('announcements',[]).filter(a=>!a.expiry||new Date(a.expiry)>=new Date()).slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  const grid=document.getElementById('announcements-grid');
  if(!grid)return;
  if(!announcements.length){
    grid.innerHTML='<div class="empty-state"><div class="empty-state-emoji">📢</div><h3>No announcements</h3><p>Check back soon for updates from the church.</p></div>';
    return;
  }
  const prioBadge=p=>({high:'badge-rose',medium:'badge-yellow',low:'badge-green'}[p]||'badge-gray');
  grid.innerHTML=announcements.map(a=>'<div class="card">'+
    '<div class="card-header">'+
      '<div class="flex items-center gap-2" style="margin-bottom:8px"><span class="badge '+prioBadge(a.priority)+'">'+a.priority+'</span></div>'+
      '<div class="font-bold" style="font-size:1rem">'+a.title+'</div>'+
      '<div class="text-xs text-dim">'+fmtDate(a.createdAt)+(a.expiry?' · Expires '+fmtDate(a.expiry):' · No expiry')+'</div>'+
    '</div>'+
    '<div class="card-body"><p class="text-dim text-sm" style="line-height:1.7">'+a.content+'</p></div>'+
  '</div>').join('');
}

function renderLivestreamWidget(){
  const ls=DB.get('livestream',{active:false});
  const widget=document.getElementById('livestream-widget');
  if(!widget)return;
  if(ls.active&&ls.youtubeUrl){
    widget.style.display='block';
    widget.innerHTML='<div class="card" style="margin-bottom:24px;border-color:rgba(239,68,68,0.4)">'+
      '<div class="card-header" style="display:flex;align-items:center;gap:10px">'+
        '<div style="width:10px;height:10px;border-radius:50%;background:#ef4444;animation:pulse 1.5s infinite"></div>'+
        '<div class="font-bold">🔴 LIVE – '+ls.title+'</div>'+
      '</div>'+
      '<div style="position:relative;padding-bottom:56.25%;height:0">'+
        '<iframe src="'+ls.youtubeUrl.replace('watch?v=','embed/')+'" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe>'+
      '</div>'+
      (ls.description?'<div style="padding:12px 16px;color:var(--text-dim);font-size:13px">'+ls.description+'</div>':'')+
    '</div>';
  } else {
    widget.style.display='none';
  }
}


/* ── Fade-in-on-scroll enhancement (additive, safe no-op if no .fade-in-up elements exist) ── */
document.addEventListener('DOMContentLoaded', function(){
  var targets = document.querySelectorAll('.fade-in-up');
  if(!targets.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.12});
  targets.forEach(function(el){ io.observe(el); });
});

/* ══════════════════════════════════════════════════════════
   MEMBERSHIP & WORKER'S MANUAL — in-page PDF viewer helpers
   (previously lived on standalone membership.html/workers.html;
   now part of this single-page app)
   ══════════════════════════════════════════════════════════ */
function openFullscreenPDF(frameId){
  var frame = document.getElementById(frameId);
  if(!frame) return;
  var req = frame.requestFullscreen || frame.webkitRequestFullscreen || frame.msRequestFullscreen;
  var fallbackToNewTab = function(){
    window.open(frame.getAttribute('src'), '_blank', 'noopener');
  };
  if(document.fullscreenEnabled === false || !req){
    // Fullscreen is disabled by the embedding context (e.g. a sandboxed preview
    // iframe without allow="fullscreen") or unsupported by this browser.
    fallbackToNewTab();
    return;
  }
  try{
    var result = req.call(frame);
    if(result && typeof result.catch === 'function'){
      result.catch(fallbackToNewTab); // request was rejected by the browser/embedder — fall back
    }
  }catch(e){
    fallbackToNewTab();
  }
}

function sharePDF(url, title){
  var absoluteUrl = url;
  try{
    absoluteUrl = new URL(url, document.baseURI || window.location.href).href;
  }catch(e){
    // Embedding context has no usable base URL (sandboxed preview iframe, webview, etc.)
    // Fall back to the plain relative path — still shareable/copyable, just not resolved
    // to an absolute address in that context.
    absoluteUrl = url;
  }
  if(navigator.share){
    navigator.share({ title: title, url: absoluteUrl }).catch(function(){ /* user cancelled */ });
    return;
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(absoluteUrl).then(function(){
      showPdfToast('Link copied to clipboard');
    }).catch(function(){ showPdfToast(absoluteUrl); });
  } else {
    showPdfToast(absoluteUrl);
  }
}

function showPdfToast(message){
  var toast = document.getElementById('pdfToast');
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showPdfToast._t);
  showPdfToast._t = setTimeout(function(){ toast.classList.remove('show'); }, 2800);
}

/* Fallback message if a PDF iframe fails to render inline */
function watchPdfFrame(frameId, fallbackId){
  var frame = document.getElementById(frameId);
  var fallback = document.getElementById(fallbackId);
  if(!frame || !fallback) return;
  var loaded = false;
  frame.addEventListener('load', function(){ loaded = true; });
  setTimeout(function(){ if(!loaded) fallback.style.display = 'block'; }, 4000);
}
document.addEventListener('DOMContentLoaded', function(){
  watchPdfFrame('membershipPdfFrame','membershipPdfFallback');
  watchPdfFrame('workersPdfFrame','workersPdfFallback');

  var targets = document.querySelectorAll('.fade-in-up');
  if(targets.length && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, {threshold:0.1});
    targets.forEach(function(el){ io.observe(el); });
  } else {
    targets.forEach(function(el){ el.classList.add('is-visible'); });
  }
});


function icfEscapeHtml(value){
  return String(value == null ? '' : value).replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}
function adminContactMessagesHTML(){
  const messages=DB.get('contactMessages',[]);
  const count=messages.length;
  if(!count){
    return '<div><h2 class="section-title" style="margin-bottom:20px">✉️ Contact Messages (0)</h2>'+
      '<div class="empty-state"><div class="empty-state-emoji">✉️</div><h3>No contact messages yet</h3><p>Messages sent through the public contact form will appear here.</p></div></div>';
  }
  const cards=messages.map(function(m){
    const id=icfEscapeHtml(m.id);
    const status=String(m.status || 'new');
    const isResolved=status==='resolved';
    return '<div class="card" style="margin-bottom:14px"><div class="card-header">'+
      '<div class="flex items-center justify-between flex-wrap gap-2"><div class="font-bold">'+icfEscapeHtml(m.subject || 'Website enquiry')+'</div>'+
      '<span class="badge '+(isResolved?'badge-green':'badge-yellow')+'">'+icfEscapeHtml(status)+'</span></div>'+
      '<div class="text-sm text-dim" style="margin-top:7px">'+icfEscapeHtml(m.name)+' · '+icfEscapeHtml(m.email)+
      (m.phone?' · '+icfEscapeHtml(m.phone):'')+'</div><div class="text-xs text-dim" style="margin-top:4px">'+icfEscapeHtml(m.createdAt || '')+'</div></div>'+
      '<div class="card-body"><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+icfEscapeHtml(m.message)+'</p>'+
      '<div class="flex gap-2" style="margin-top:14px"><button class="btn btn-sm btn-outline" onclick="updateContactMessageStatus(\''+id+'\',\''+(isResolved?'new':'resolved')+'\')">'+(isResolved?'Reopen':'Mark resolved')+'</button></div></div></div>';
  }).join('');
  return '<div><h2 class="section-title" style="margin-bottom:20px">✉️ Contact Messages ('+count+')</h2>'+cards+'</div>';
}
function updateContactMessageStatus(id,status){
  const messages=DB.get('contactMessages',[]);
  const item=messages.find(function(m){return String(m.id)===String(id);});
  if(!item)return;
  item.status=status;
  DB.set('contactMessages',messages);
  renderAdminSection('messages');
  toast(status==='resolved'?'Message marked resolved':'Message reopened','','success');
}
window.adminContactMessagesHTML=adminContactMessagesHTML;
window.updateContactMessageStatus=updateContactMessageStatus;

