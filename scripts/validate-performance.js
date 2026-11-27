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
if (!/link\\.textContent !== label/.test(pdfLinkUpdater)) {
  throw new Error('PDF link labels must be updated idempotently to prevent MutationObserver feedback loops.');
}
const siteCss = fs.readFileSync(path.join(ROOT, 'css/site.css'), 'utf8');
if (!/Mobile admin navigation:[\\s\\S]*?overflow-x:\\s*auto/.test(siteCss)) {
  throw new Error('Mobile admin navigation must be horizontally scrollable.');
}

process.stdout.write('Performance checks passed: concurrent admin reads, active-page refresh and direct admin entry.\n');
