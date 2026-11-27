'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const adminRoutes = fs.readFileSync(path.join(ROOT, 'routes/admin.js'), 'utf8');
const apiBridge = fs.readFileSync(path.join(ROOT, 'js/api-bridge.js'), 'utf8');
if (!/Promise\.all\(COLLECTIONS\.map/.test(adminRoutes)) throw new Error('Admin collections must load concurrently.');
if (/for\s*\(const collection of COLLECTIONS\)\s*data\[collection\]\s*=\s*await/.test(adminRoutes)) throw new Error('Sequential admin collection reads are still present.');
if (!/document\.querySelector\('main \.page\.active'\)/.test(apiBridge)) throw new Error('Public data refresh must target the active page only.');
if (!/var directAdminEntry = window\.location\.hash === '#admin-portal'/.test(apiBridge)) throw new Error('A direct admin deep link must bypass the public-feed wait.');

const pdfLinkUpdater = apiBridge.slice(apiBridge.indexOf('function updateDocumentLinks()'), apiBridge.indexOf('function observeVisualUpdates()'));
if (!pdfLinkUpdater.includes('if (label && link.textContent !== label) link.textContent = label;')) {
  throw new Error('PDF link labels must be updated idempotently to prevent MutationObserver feedback loops.');
}
const siteCss = fs.readFileSync(path.join(ROOT, 'css/site.css'), 'utf8');
if (!siteCss.includes('/* Mobile admin navigation:') || !siteCss.includes('overflow-x:auto')) {
  throw new Error('Mobile admin navigation must be horizontally scrollable.');
}


const homePage = fs.readFileSync(path.join(ROOT, 'views/pages/home.html'), 'utf8');
if (!homePage.includes('Join Us for Worship') || !homePage.includes('Worship Service')) {
  throw new Error('Homepage worship schedule markup is missing.');
}
if (!siteCss.includes('Mobile worship schedule + footer layout repair') ||
    !siteCss.includes('grid-template-columns: 76px minmax(0, 1fr)') ||
    !siteCss.includes('#footer .footer-grid') ||
    !siteCss.includes('grid-template-columns: minmax(0, 1fr) !important')) {
  throw new Error('Mobile worship schedule and single-column footer repairs are missing.');
}


const mobileAdminCss = siteCss.slice(siteCss.indexOf('/* ICF admin tables: preserve readable columns'));
if (!mobileAdminCss.includes('#page-admin-portal .table-wrap > table') ||
    !mobileAdminCss.includes('min-width: 900px !important') ||
    !mobileAdminCss.includes('overflow-x: auto')) {
  throw new Error('Admin tables must remain readable and swipe-scrollable on mobile.');
}

const apiRoutes = {
  admin: fs.readFileSync(path.join(ROOT, 'routes/admin.js'), 'utf8'),
  public: fs.readFileSync(path.join(ROOT, 'routes/public.js'), 'utf8'),
  auth: fs.readFileSync(path.join(ROOT, 'routes/auth.js'), 'utf8'),
  bridge: fs.readFileSync(path.join(ROOT, 'js/api-bridge.js'), 'utf8')
};
for (const route of [
  "app.get('/api/admin/records'",
  "app.put('/api/admin/records/:collection'",
  "app.post('/api/admin/uploads'"
]) if (!apiRoutes.admin.includes(route)) throw new Error('Missing protected admin API route: ' + route);
for (const route of [
  "app.get('/api/public-data'",
  "app.post('/api/public/:collection'"
]) if (!apiRoutes.public.includes(route)) throw new Error('Missing public submission/data API route: ' + route);
for (const route of [
  "app.post('/api/public/member-signup'",
  "app.post('/api/auth/member-login'",
  "app.post('/api/auth/login'"
]) if (!apiRoutes.auth.includes(route)) throw new Error('Missing authentication API route: ' + route);
for (const endpoint of [
  "'/public/prayers'",
  "'/public/baptisms'",
  "'/public/contactMessages'",
  "'/public/member-signup'",
  "'/admin/records'",
  "'/admin/uploads?bucket='"
]) if (!apiRoutes.bridge.includes(endpoint)) throw new Error('Frontend is not connected to API endpoint: ' + endpoint);
if (!apiRoutes.bridge.includes("request('/admin/records/' + encodeURIComponent(collection)") ||
    !apiRoutes.bridge.includes("method:'PUT',body:payload")) {
  throw new Error('Admin changes must persist through the protected records API.');
}


const appSource = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
if (!appSource.includes("<th>Name / Email</th><th>Nationality</th><th>Phone</th><th>Address</th>")) {
  throw new Error('Admin member list must expose the submitted residential address.');
}
if (!appSource.includes("(p.email?'<div class=\"text-xs text-dim\">'+p.email+'</div>':''")) {
  throw new Error('Admin prayer list must expose the submitted contact email.');
}
if (!appSource.includes("(b.email?'<div class=\"text-xs text-dim\">'+b.email+'</div>':''")) {
  throw new Error('Admin baptism list must expose the submitted contact email.');
}

process.stdout.write('Performance checks passed: concurrent admin reads, active-page refresh and direct admin entry.\n');

const siteTemplate = fs.readFileSync(path.join(ROOT, 'views/index.html'), 'utf8');
const uiRepair = fs.readFileSync(path.join(ROOT, 'js/ui-repair.js'), 'utf8');
if (!siteTemplate.includes('site.css?v=20261127-10') ||
    !siteTemplate.includes('app.js?v=20261127-10') ||
    !siteTemplate.includes('ui-repair.js?v=20261127-10')) {
  throw new Error('Asset URLs must be cache-busted after frontend releases.');
}
if (!uiRepair.includes("btn.removeAttribute('onclick')") ||
    !uiRepair.includes("btn.addEventListener('click'") ||
    !uiRepair.includes("btn.dataset.icfMenuBound='1'")) {
  throw new Error('Hamburger navigation must have one directly bound, idempotent click handler.');
}

const adminPortal = fs.readFileSync(path.join(ROOT, 'views/pages/admin-portal.html'), 'utf8');
if (!adminPortal.includes('id="admin-menu-toggle"') ||
    !adminPortal.includes('id="admin-sidebar"') ||
    !adminPortal.includes('id="admin-nav-backdrop"') ||
    !adminPortal.includes('exportChurchRecords()') ||
    !adminPortal.includes('window.print()')) {
  throw new Error('Admin portal must provide its own navigation, export, and print controls.');
}
if (!siteCss.includes('body.icf-admin-active #navbar') ||
    !siteCss.includes('body.icf-admin-menu-open #page-admin-portal .admin-sidebar') ||
    !siteCss.includes('@media print')) {
  throw new Error('Admin shell must isolate its mobile menu and provide print styling.');
}
if (!appSource.includes("_store.getItem('icf_theme')||'dark'") ||
    !fs.readFileSync(path.join(ROOT, 'views/index.html'), 'utf8').includes('<body data-theme="dark">')) {
  throw new Error('The default website theme must be dark while preserving saved preferences.');
}
const uiSource = fs.readFileSync(path.join(ROOT, 'js/ui-repair.js'), 'utf8');
if (!uiSource.includes("adminToggle.addEventListener('click'") ||
    !uiSource.includes("adminBackdrop.addEventListener('click'") ||
    !uiSource.includes("e.key==='Escape'")) {
  throw new Error('The independent admin drawer must support open, backdrop close, and Escape.');
}
const adminModules = fs.readFileSync(path.join(ROOT, 'js/admin-modules.js'), 'utf8');
if (!adminModules.includes('window.exportChurchRecords')) {
  throw new Error('Authenticated church record export is missing.');
}

const adminModuleSource = fs.readFileSync(path.join(ROOT, 'js/admin-modules.js'), 'utf8');
if (!adminModuleSource.includes("status:'draft',savedAt:new Date().toISOString()") ||
    !adminModuleSource.includes('No email was sent. Connect an approved email delivery provider') ||
    !adminModuleSource.includes('Draft History')) {
  throw new Error('Email administration must not claim delivery when no provider is configured.');
}
if (!adminModuleSource.includes("themeMode:'dark'")) {
  throw new Error('The admin settings fallback must use dark mode by default.');
}

const memberScript = fs.readFileSync(path.join(ROOT, 'js/member-directory.js'), 'utf8');
for (const required of ['window.renderMemberProfile','window.saveMyMemberProfile','window.uploadMyMemberAvatar','window.renderPublicDirectory']) if (!memberScript.includes(required)) throw new Error('Member profile functionality missing: '+required);
const adminScript = fs.readFileSync(path.join(ROOT, 'js/admin-modules.js'), 'utf8');
for (const required of ['window.adminMembersHTML','window.icfAddChurchRole','window.icfUpdateMemberRoles']) if (!adminScript.includes(required)) throw new Error('Church role management missing: '+required);

const publicMemberRoutes = fs.readFileSync(path.join(ROOT, 'routes/public.js'), 'utf8');
if (!publicMemberRoutes.includes('publicProfileConsent===true&&m.directoryVisible===true') ||
    !publicMemberRoutes.includes('authClient().auth.getUser(token)') ||
    !publicMemberRoutes.includes('from(PRIVATE_BUCKET).createSignedUrl') ||
    !publicMemberRoutes.includes('member.roles') ||
    publicMemberRoutes.includes('body.roles')) {
  throw new Error('Member profile APIs must authenticate the owner, protect role assignments, and require consent for public listing.');
}
const memberClient = fs.readFileSync(path.join(ROOT, 'js/member-directory.js'), 'utf8');
if (!memberClient.includes('publicProfileConsent:document.getElementById')) {
  throw new Error('Member public-directory consent must be saved as a distinct member-controlled setting.');
}

const worshipStudio = fs.readFileSync(path.join(ROOT, 'js/worship-studio.js'), 'utf8');
for (const required of ['window.adminWorshipStudioHTML','navigator.mediaDevices.getUserMedia','window.LivekitClient','recordingEnabled','/admin/broadcast/sessions']) if (!worshipStudio.includes(required)) throw new Error('Worship Studio feature missing: '+required);
const viewer = fs.readFileSync(path.join(ROOT, 'js/worship-viewer.js'), 'utf8');
if (!viewer.includes('/api/public/live/token') || !viewer.includes('RoomEvent.TrackSubscribed')) throw new Error('Public LiveKit viewer is missing its secure subscribe flow.');
