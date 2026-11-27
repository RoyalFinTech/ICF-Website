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
for (const asset of ['favicon.png','css/site.css','js/hero-slider.js','js/splash.js','js/app.js','js/admin-modules.js','js/api-bridge.js','js/ui-repair.js','js/member-directory.js','js/worship-studio.js','js/worship-viewer.js','live.html','icf-logo-transparent.png','church-worship-service.jpg','church-mummy-prayer.jpg','church-baptism-group.jpg','membership-statement.pdf','workers-manual.pdf']) {
  if (!fs.existsSync(path.join(ROOT, asset))) throw new Error('Missing homepage asset: ' + asset);
}
if (html.includes('data:image/png;base64,')) throw new Error('A large embedded PNG remains in the homepage HTML.');
if (!html.includes('/css/site.css?v=20261127-11')) throw new Error('External stylesheet is not linked.');
if (!html.includes('worship-studio.js?v=20261127-10')) throw new Error('Worship Studio client script is not linked.');
if (!html.includes('/favicon.png')) throw new Error('External favicon is not linked.');
const studioSource = fs.readFileSync(path.join(ROOT, 'js/worship-studio.js'), 'utf8');
const viewerSource = fs.readFileSync(path.join(ROOT, 'js/worship-viewer.js'), 'utf8');
new Function(studioSource);
new Function(viewerSource);
for (const feature of ['ws-scroll-test','ws-bible-search','ws-camera-2','ws-flyer-file','ws-text-color']) if (!studioSource.includes(feature)) throw new Error('Worship Studio control missing: ' + feature);
if (!viewerSource.includes('presentation_config')) throw new Error('Public viewer presentation configuration is missing.');
if (Buffer.byteLength(html, 'utf8') > 200 * 1024) throw new Error('Generated homepage exceeds the 200 KB HTML budget.');
process.stdout.write('Homepage validated: ' + requiredPages.length + ' pages, ' + Buffer.byteLength(html, 'utf8') + ' HTML bytes.\n');
