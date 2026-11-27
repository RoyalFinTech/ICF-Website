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

process.stdout.write('Performance checks passed: concurrent admin reads, active-page refresh and direct admin entry.\n');

const siteTemplate = fs.readFileSync(path.join(ROOT, 'views/index.html'), 'utf8');
const uiRepair = fs.readFileSync(path.join(ROOT, 'js/ui-repair.js'), 'utf8');
if (!siteTemplate.includes('site.css?v=20261127-4') ||
    !siteTemplate.includes('app.js?v=20261127-4') ||
    !siteTemplate.includes('ui-repair.js?v=20261127-4')) {
  throw new Error('Asset URLs must be cache-busted after frontend releases.');
}
if (!uiRepair.includes("btn.removeAttribute('onclick')") ||
    !uiRepair.includes("btn.addEventListener('click'") ||
    !uiRepair.includes("btn.dataset.icfMenuBound='1'")) {
  throw new Error('Hamburger navigation must have one directly bound, idempotent click handler.');
}
