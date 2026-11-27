'use strict';
const fs = require('node:fs');
const path = require('node:path');
const buildHomepage = require('./build-homepage');
const ROOT = path.resolve(__dirname, '..');
const html = buildHomepage();
const checkedIn = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (html !== checkedIn) throw new Error('index.html is stale. Run npm run build:site and commit the generated file.');
const requiredPages = ['home','about','services','events','prayers','baptisms','contact','login','signup','admin-login','admin-portal','sermons','gallery','announcements','membership','workers','member-profile'];
for (const page of requiredPages) if (!html.includes('id="page-' + page + '"')) throw new Error('Missing page: ' + page);
for (const asset of ['favicon.png','css/site.css','js/hero-slider.js','js/splash.js','js/app.js','js/admin-modules.js','js/api-bridge.js','js/ui-repair.js','js/member-directory.js','js/worship-studio.js','js/worship-viewer.js','live.html','camera.html','js/camera-join.js','js/live-status.js','icf-logo-transparent.png','church-worship-service.jpg','church-mummy-prayer.jpg','church-baptism-group.jpg','membership-statement.pdf','workers-manual.pdf']) {
  if (!fs.existsSync(path.join(ROOT, asset))) throw new Error('Missing homepage asset: ' + asset);
}
if (html.includes('data:image/png;base64,')) throw new Error('A large embedded PNG remains in the homepage HTML.');
if (!html.includes('/css/site.css?v=20261127-15')) throw new Error('External stylesheet is not linked or cache-busted.');
if (!/worship-studio\.js\?v=\d{8}-\d+/.test(html)) throw new Error('Worship Studio client script is not linked or cache-busted.');
if (!html.includes('/favicon.png')) throw new Error('External favicon is not linked.');
const studioSource = fs.readFileSync(path.join(ROOT, 'js/worship-studio.js'), 'utf8');
const viewerSource = fs.readFileSync(path.join(ROOT, 'js/worship-viewer.js'), 'utf8');
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
if (!adminSource.includes('terminateLiveKitRoom') || !adminSource.includes('livekit.RoomService/DeleteRoom') || !adminSource.includes('ended:true')) throw new Error('Server broadcast shutdown must terminate the LiveKit room and confirm offline status.');
if (!viewerSource.includes('function goOffline') || !viewerSource.includes("cache:'no-store'") || !viewerSource.includes("ICF broadcast ended")) throw new Error('Public viewer must clear video and bypass cache when a service ends.');

if (!viewerSource.includes('function fitTextSize') || !viewerSource.includes('welcomeMode') || !viewerSource.includes('welcomeDuration')) throw new Error('Public viewer responsive text or welcome display settings are missing.');
const liveHtml = fs.readFileSync(path.join(ROOT, 'live.html'), 'utf8');
const publicRoutes = fs.readFileSync(path.join(ROOT, 'routes/public.js'), 'utf8');
const adminSource = fs.readFileSync(path.join(ROOT, 'routes/admin.js'), 'utf8');
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
