'use strict';
const fs = require('node:fs');
const path = require('node:path');
const buildHomepage = require('./build-homepage');
const ROOT = path.resolve(__dirname, '..');
const html = buildHomepage();
const checkedIn = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (html !== checkedIn) throw new Error('index.html is stale. Run npm run build:site and commit the generated file.');
const requiredPages = ['home','about','services','events','prayers','baptisms','contact','login','signup','admin-login','admin-portal','sermons','gallery','announcements','membership','workers','member-profile','password-reset','email-confirmed'];
for (const page of requiredPages) if (!html.includes('id="page-' + page + '"')) throw new Error('Missing page: ' + page);
for (const asset of ['favicon.png','css/site.css','js/hero-slider.js','js/splash.js','js/app.js','js/admin-modules.js','js/api-bridge.js','js/ui-repair.js','js/country-data.js','js/nationality-picker.js','js/member-directory.js','js/worship-studio.js','js/worship-viewer.js','live.html','camera.html','js/camera-join.js','js/live-status.js','icf-logo-transparent.png','church-worship-service.jpg','church-mummy-prayer.jpg','church-baptism-group.jpg','membership-statement.pdf','workers-manual.pdf']) {
  if (!fs.existsSync(path.join(ROOT, asset))) throw new Error('Missing homepage asset: ' + asset);
}

const cameraClientSource = fs.readFileSync(path.join(ROOT, 'js/camera-join.js'), 'utf8');
const worshipStudioSource = fs.readFileSync(path.join(ROOT, 'js/worship-studio.js'), 'utf8');
const worshipViewerSource = fs.readFileSync(path.join(ROOT, 'js/worship-viewer.js'), 'utf8');
const broadcastRoutesSource = fs.readFileSync(path.join(ROOT, 'routes/admin.js'), 'utf8');
for (const [name, source] of [['phone camera client',cameraClientSource],['worship studio client',worshipStudioSource],['public worship viewer',worshipViewerSource],['broadcast admin routes',broadcastRoutesSource]]) {
  try { new Function(source); } catch (error) { throw new Error(name + ' contains a JavaScript syntax error: ' + error.message); }
}
const cameraPage = fs.readFileSync(path.join(ROOT, 'camera.html'), 'utf8');
const livePage = fs.readFileSync(path.join(ROOT, 'live.html'), 'utf8');
if (!cameraPage.includes('id="phone-preview"') || !cameraPage.includes('id="camera-drawer"') || !cameraPage.includes('id="login-phone"') || !cameraPage.includes('viewport-fit=cover')) throw new Error('The full-screen phone camera interface or sign-in drawer is incomplete.');
if (!cameraClientSource.includes("window.addEventListener('storage'") || !cameraClientSource.includes("window.open(loginUrl") || !cameraClientSource.includes("credentials.trackName")) throw new Error('Phone QR sign-in and automatic remote camera pairing are incomplete.');
if (!worshipStudioSource.includes('ws-phone-qr-image') || !worshipStudioSource.includes('refreshRemoteRoster') || !worshipStudioSource.includes('addRemoteCamera') || !worshipStudioSource.includes("value='remote:'")) throw new Error('Studio QR pairing and remote camera roster are incomplete.');
if (!worshipViewerSource.includes('live-remote-cameras') || !worshipViewerSource.includes('addRemoteCamera')) throw new Error('Public live viewer cannot display multiple remote phone cameras.');
if (!livePage.includes('id="live-remote-cameras"')) throw new Error('Public live page is missing the multi-camera stage container.');
if (!broadcastRoutesSource.includes("trackName:'icf-camera-'+cameraId+'::'") || !broadcastRoutesSource.includes("canSubscribe:canSubscribe!==false")) throw new Error('Server camera identities or scoped publish-only permissions are incomplete.');
const stylesSource = fs.readFileSync(path.join(ROOT, 'css/site.css'), 'utf8');
const livePlayerSource = livePage;
const phoneOrientationFeatures = ['screen.orientation','orientationchange','captureStream(30)','currentAngle','deviceorientation','videoEncoding:{maxBitrate:1800000'];
if (phoneOrientationFeatures.some(function (feature) { return !cameraClientSource.includes(feature); })) throw new Error('Phone camera landscape compositor or HD publish settings are incomplete.');
if (!worshipStudioSource.includes('additional.push') || !worshipStudioSource.includes('Full programme recording')) throw new Error('Programme recorder is missing multi-camera composition.');
if (!worshipStudioSource.includes('logoUrl:p.logoUrl') || !broadcastRoutesSource.includes('logo_url:logoUrl')) throw new Error('Live presentation updates do not persist ICF logo branding.');
if (!stylesSource.includes('#ws-stage .worship-overlay-logo{z-index:20!important}') || !livePlayerSource.includes('.logo{position:absolute;z-index:20;') || !livePlayerSource.includes('.overlay{position:absolute;z-index:19;')) throw new Error('ICF logo and presentation text must render above remote video layers.');
if (!worshipStudioSource.includes("if(secondary&&secondStream)additional.push({video:secondary,name:'Local camera 2'})")) throw new Error('Programme recording must retain the local secondary camera in every multi-camera layout.');
const serverSource = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
if (!serverSource.includes("app.use(['/live.html','/camera.html']") || !serverSource.includes("Cache-Control','no-store, no-cache, must-revalidate")) throw new Error('Remote camera and live player HTML must not be served from a stale browser cache.');
if (!cameraPage.includes('id="phone-brand-logo"') || !cameraPage.includes('id="phone-brand-welcome"') || !cameraPage.includes('id="phone-brand-scripture"')) throw new Error('Paired phone camera must preview the current ICF logo, welcome text and scripture.');
if (!cameraPage.includes('id="zoom-in"') || !cameraPage.includes('id="phone-brightness"') || !cameraPage.includes('id="phone-contrast"')) throw new Error('Phone camera zoom, brightness and contrast controls are incomplete.');
if (!cameraPage.includes('id="frame-up"') || !cameraPage.includes('id="frame-left"') || !cameraPage.includes('id="frame-reset"') || !cameraClientSource.includes('function moveFrame(')) throw new Error('Phone camera framing-position controls are incomplete.');
if (!cameraClientSource.includes("window.addEventListener('deviceorientation'") || !cameraClientSource.includes('sensorLandscape') || !cameraClientSource.includes('phone-presentation')) throw new Error('Phone camera motion-sensor rotation or live branding sync is incomplete.');
if (!cameraClientSource.includes('maxBitrate:1800000') || !cameraClientSource.includes('outputCanvas.width=1280') || !cameraClientSource.includes('captureStream(30)')) throw new Error('Phone camera transport profile has not been tuned for smooth 720p streaming.');
if (!broadcastRoutesSource.includes('/phone-presentation')) throw new Error('Paired phones cannot retrieve the live ICF presentation layer.');
if (!broadcastRoutesSource.includes("welcomeMode:['static','scroll','fade']") || !broadcastRoutesSource.includes('welcomeRepeat:') || !broadcastRoutesSource.includes('scrollRepeat:') || !broadcastRoutesSource.includes('bibleAlign:')) throw new Error('Broadcast API is not persisting the complete presentation animation and Bible alignment settings.');
if (!worshipStudioSource.includes('ws-welcome-repeat') || !worshipStudioSource.includes('ws-scroll-duration') || !worshipStudioSource.includes('icf-studio-slide-scroll')) throw new Error('Worship Studio scrolling controls and preview animation are incomplete.');
if (!worshipViewerSource.includes('welcomeRepeat') || !worshipViewerSource.includes('slide-scroll-repeat') || !livePage.includes('.overlay[data-behavior=scroll] span') || !livePage.includes('.live-slide-text.scroll span')) throw new Error('Public live output is not applying configured scrolling animation.');
if (!worshipStudioSource.includes("stream:'icf-program-av'")) throw new Error('Studio microphone and camera tracks must share a LiveKit stream for synchronization.');
if (!worshipStudioSource.includes('ws-hymn-end') || !worshipStudioSource.includes("c.slideKind==='hymn'") || !worshipStudioSource.includes('ws-hymn-layout')) throw new Error('Worship Studio hymn publishing, layout, or end-display controls are incomplete.');
if (!worshipViewerSource.includes('live-hymn-heading') || !worshipViewerSource.includes('hymn-layout') || !worshipViewerSource.includes('hasSecondary') || !livePage.includes('.live-slide-text.hymn-layout')) throw new Error('Public live hymn layout or empty picture-in-picture suppression is incomplete.');
if (!broadcastRoutesSource.includes("slideKind:['hymn','slide'].includes(raw.slideKind)?raw.slideKind:'slide'")) throw new Error('Broadcast API must persist the selected slide kind so public viewers render hymn formatting correctly.');
if (!worshipStudioSource.includes("name:'icf-camera-main',stream:'icf-program-av'") || !worshipStudioSource.includes("name:'icf-microphone',stream:'icf-program-av'")) throw new Error('Studio camera and microphone must share a LiveKit stream to preserve audio/video synchronization.');
if (!stylesSource.includes('#page-admin-portal .worship-live-actions') || !stylesSource.includes('grid-template-columns:repeat(2,minmax(0,1fr))')) throw new Error('Worship Studio mobile touch controls are not responsive.');
if (!worshipStudioSource.includes('function queueStudioReconnect()') || !worshipStudioSource.includes('function reconnectStudioRoom()') || !worshipStudioSource.includes('RoomEvent.Reconnecting') || !worshipStudioSource.includes('RoomEvent.Reconnected')) throw new Error('Worship Studio automatic live-room recovery is incomplete.');
if (!cameraClientSource.includes('function scheduleReconnect(reason)') || !cameraClientSource.includes('RoomEvent.Reconnecting') || !cameraClientSource.includes('RoomEvent.Reconnected') || !cameraClientSource.includes("window.addEventListener('online'")) throw new Error('Phone camera automatic reconnection and network recovery are incomplete.');
if (!worshipViewerSource.includes('var room=null,slug=') || !worshipViewerSource.includes('RoomEvent.Reconnecting') || !worshipViewerSource.includes('RoomEvent.Reconnected') || !worshipViewerSource.includes('connecting=false')) throw new Error('Public live viewer reconnect handling is incomplete.');



if (html.includes('data:image/png;base64,')) throw new Error('A large embedded PNG remains in the homepage HTML.');
if (!/\/css\/site\.css\?v=\d{8}-\d+/.test(html)) throw new Error('External stylesheet is not linked or cache-busted.');
if (!/worship-studio\.js\?v=\d{8}-\d+/.test(html)) throw new Error('Worship Studio client script is not linked or cache-busted.');
if (!html.includes('/favicon.png')) throw new Error('External favicon is not linked.');
if (!html.includes('class="nav-shortcuts"') || !html.includes('class="nav-auth-login"') || !html.includes('class="nav-auth-signup"')) throw new Error('Responsive quick navigation or visible login/signup actions are missing.');
const pickerSource = fs.readFileSync(path.join(ROOT, 'js/nationality-picker.js'), 'utf8');
new Function(pickerSource);
if (!pickerSource.includes('getAll()') || !pickerSource.includes('getPhoneCountries()') || !pickerSource.includes('nationality-search-status') || !pickerSource.includes('selectedDialCode') || !pickerSource.includes('event.stopPropagation()') || !pickerSource.includes('data-name=') || !pickerSource.includes('data-dial=')) throw new Error('Dedicated nationality picker must isolate the legacy search listener and retain searchable result attributes.');
const countryData = require('../js/country-data');
const countries = countryData.getAll();
if (countries.length !== 249 || countries.some(function (country) { return !country.code || !country.name || !country.flag || !country.region; })) throw new Error('The full country and flag catalogue is incomplete.');
const phoneCountries = countryData.getPhoneCountries();
if (phoneCountries.length < 240 || !countryData.getCountry('GM').dialCode || countryData.getCountry('NG').dialCode !== '+234' || countryData.getCountry('US').dialCode !== '+1') throw new Error('International calling-code coverage is incomplete or required country mappings are wrong.');
if (!countryData.getCountry('GM') || countryData.getCountry('GM').name !== 'The Gambia' || !countryData.getCountry('NG') || !countryData.getCountry('US')) throw new Error('Required nationality country records are missing.');

const signupHtml = fs.readFileSync(path.join(ROOT, 'views/pages/signup.html'), 'utf8');
const loginHtml = fs.readFileSync(path.join(ROOT, 'views/pages/login.html'), 'utf8');
const authActionsHtml = fs.readFileSync(path.join(ROOT, 'views/pages/auth-actions.html'), 'utf8');
const authBridgeSource = fs.readFileSync(path.join(ROOT, 'js/api-bridge.js'), 'utf8');
const appRouterSource = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
if (!authActionsHtml.includes('id="page-password-reset"') || !authActionsHtml.includes('id="page-email-confirmed"')) throw new Error('Password recovery or email confirmation page is missing.');
if (!loginHtml.includes('openIcfPasswordReset') || !loginHtml.includes('resendIcfSignupConfirmation')) throw new Error('Member login must expose password recovery and confirmation resend.');
if (!authBridgeSource.includes('password-reset-complete') || !authBridgeSource.includes('password-reset-request') || !authBridgeSource.includes('resend-confirmation')) throw new Error('Browser password recovery and confirmation resend flows are not connected.');
if (!appRouterSource.includes("callbackType==='recovery'?'password-reset'") || !appRouterSource.includes('history.replaceState')) throw new Error('Auth callback routing must safely consume and clear recovery tokens.');
if (!signupHtml.includes('id="su-website"') || !signupHtml.includes('id="icf-turnstile"')) throw new Error('Signup honeypot or Turnstile widget mount is missing.');
const signupAuthSource = fs.readFileSync(path.join(ROOT, 'routes/auth.js'), 'utf8');
const countryAppSource = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const signupBridgeSource = fs.readFileSync(path.join(ROOT, 'js/api-bridge.js'), 'utf8');
if (!signupHtml.includes('id="su-nationality-code"') || !signupHtml.includes('id="dd-nationality-search"') || !signupHtml.includes('id="list-nationality"') || !signupHtml.includes('id="nat-display-nationality"')) throw new Error('Signup Android-safe searchable nationality list controls are missing.');
if (!loginHtml.includes('type="email"') || !loginHtml.includes('id="login-email"')) throw new Error('Member login must collect an email address.');
if (!signupAuthSource.includes("countryData.getCountry(nationalityCode)") || !signupAuthSource.includes("nationality:country.name, nationalityCode:country.code")) throw new Error('Signup API must validate and persist the canonical nationality and ISO code.');
if (!signupAuthSource.includes("member.status !== 'approved'")) throw new Error('Member login must enforce administrator approval.');
if (!countryAppSource.includes('window.ICFCountryData.getAll()') || !countryAppSource.includes("renderCountryList(nationalityList, 'nationality', 'nationality')") || !countryAppSource.includes("filterCountries(id,q,id === 'phone' ? 'phone' : 'nationality')") || !signupBridgeSource.includes('MEMBER_SIGNUP_BUSY')) throw new Error('Android-safe searchable nationality list or signup submit protection is missing.');
const studioSource = fs.readFileSync(path.join(ROOT, 'js/worship-studio.js'), 'utf8');
const viewerSource = fs.readFileSync(path.join(ROOT, 'js/worship-viewer.js'), 'utf8');
const adminSource = fs.readFileSync(path.join(ROOT, 'routes/admin.js'), 'utf8');
new Function(studioSource);
new Function(viewerSource);
new Function(fs.readFileSync(path.join(ROOT, 'js/camera-join.js'), 'utf8'));
const studioElementIds = new Set(Array.from(studioSource.matchAll(/id="([^"]+)"/g), function (match) { return match[1]; }));
for (const feature of ["ws-phone-copy","ws-onair-camera","ws-scroll-test","ws-bible-query","ws-bible-book","ws-bible-chapter","ws-bible-verse","ws-bible-prev","ws-bible-next","ws-bible-publish","ws-camera-2","ws-flyer-file","ws-color","ws-quality","ws-frame","ws-hymn-title","ws-hymn-lyrics","ws-hymn-prev","ws-hymn-next","ws-hymn-add","ws-hymn-publish","ws-go-live","ws-end-live"]) if (!studioElementIds.has(feature)) throw new Error('Worship Studio element missing: ' + feature);
if (!studioSource.includes('/admin/broadcast/connection-test')) throw new Error('LiveKit browser signal diagnostic is missing.');
for (const feature of ["ws-welcome-mode","ws-welcome-duration","ws-bible-theme","ws-bible-clear"]) if (!studioElementIds.has(feature)) throw new Error("Presentation control missing: " + feature);
if (!studioSource.includes("function fitPresentationText") || !studioSource.includes("activeScreenBackground")) throw new Error("Studio adaptive typography or theme background support is missing.");
for (const feature of ["ws-hymn-query","ws-hymn-results","ws-hymn-library","ws-hymn-save"]) if (!studioElementIds.has(feature)) throw new Error('Searchable hymn library control missing: ' + feature);
if (!studioSource.includes("var BUILTIN_HYMNS") || !studioSource.includes("function renderHymnResults") || !studioSource.includes("function publishHymn")) throw new Error('Offline searchable hymn catalogue or stanza publishing is missing.');
if (!studioSource.includes("All other ground is sinking sand") || !studioSource.includes("Rock of Ages")) throw new Error('Required classic hymn search text is missing.');

if (!viewerSource.includes('presentation_config')) throw new Error('Public viewer presentation configuration is missing.');
if (!studioSource.includes("Closing the public broadcast") || !studioSource.includes("result.ended") || studioSource.indexOf("'/admin/broadcast/sessions/'+ending.id+'/end'") > studioSource.indexOf("if(room){try{await room.disconnect();}")) throw new Error('Studio must confirm server-side end before local LiveKit disconnect.');
if (!adminSource.includes('terminateLiveKitRoom') || !adminSource.includes('livekit.RoomService/DeleteRoom') && adminSource.includes('video:{roomCreate:true}') || !adminSource.includes('ended:true')) throw new Error('Server broadcast shutdown must terminate the LiveKit room and confirm offline status.');
if (!viewerSource.includes('function goOffline') || !viewerSource.includes("cache:'no-store'") || !viewerSource.includes("ICF broadcast ended")) throw new Error('Public viewer must clear video and bypass cache when a service ends.');

if (!viewerSource.includes('function fitTextSize') || !viewerSource.includes('welcomeMode') || !viewerSource.includes('welcomeDuration')) throw new Error('Public viewer responsive text or welcome display settings are missing.');
const liveHtml = fs.readFileSync(path.join(ROOT, 'live.html'), 'utf8');
const publicRoutes = fs.readFileSync(path.join(ROOT, 'routes/public.js'), 'utf8');
if (!publicRoutes.includes(".not('started_at','is',null)") || !publicRoutes.includes("r.data.status!=='live'||r.data.ended_at")) throw new Error('Public broadcast status must be based on the latest started service, including ended sessions.');
if (!adminSource.includes("const previous=await db().from('broadcast_sessions')") || !adminSource.includes("Previous broadcast room cleanup failed")) throw new Error('Starting a new broadcast must close abandoned older live sessions.');

const memberDirectorySource = fs.readFileSync(path.join(ROOT, 'js/member-directory.js'), 'utf8');
const appSource = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
if (!publicRoutes.includes("app.get('/api/public-directory'") || !memberDirectorySource.includes('renderPublicDirectory')) throw new Error('Public leadership directory route or renderer is missing.');
if (!appSource.includes('function saveMemberChurchRoles') || !appSource.includes('member.directoryVisible=Boolean')) throw new Error('Admin church-role assignment and public visibility controls are missing.');

if (!publicRoutes.includes('/api/public/bible/kjv/:book')) throw new Error('Complete KJV Bible endpoint is missing.');
if (!studioSource.includes('kjvBooks=') || !studioSource.includes('function stepKJV')) throw new Error('Complete KJV book and verse navigation is missing.');
if (!studioSource.includes("putScreen('',item.text,ref,mode") || !studioSource.includes("function publishKJV")) throw new Error('Live Bible verse navigation must update the published slide automatically.');
const cameraHtml = fs.readFileSync(path.join(ROOT, 'camera.html'), 'utf8');
const cameraSource = fs.readFileSync(path.join(ROOT, 'js/camera-join.js'), 'utf8');
new Function(cameraSource);
if (!cameraHtml.includes('id=\"connect-phone\"') || !cameraHtml.includes('id=\"disconnect-phone\"')) throw new Error('Phone camera page controls are missing.');
for (const id of ['live-slide','live-slide-reference','live-flyer','live-video-secondary']) if (!liveHtml.includes('id=\"' + id + '\"')) throw new Error('Public live viewer element missing: ' + id);
if (Buffer.byteLength(html, 'utf8') > 200 * 1024) throw new Error('Generated homepage exceeds the 200 KB HTML budget.');
process.stdout.write('Homepage validated: ' + requiredPages.length + ' pages, ' + Buffer.byteLength(html, 'utf8') + ' HTML bytes.\n');
