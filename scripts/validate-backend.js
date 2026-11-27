'use strict';
const registerAuthRoutes = require('../routes/auth');
const registerPublicRoutes = require('../routes/public');
const registerAdminRoutes = require('../routes/admin');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const seen = [];
const app = {};
['get','post','put','patch','delete'].forEach(function (method) {
  app[method] = function (route) { seen.push(method.toUpperCase() + ' ' + route); };
});
function middleware(_req, _res, next) { if (next) next(); }
function fakeMulter() { return { single: function () { return middleware; } }; }
fakeMulter.memoryStorage = function () { return {}; };
const base = { fail:function(){}, requireStorage:middleware };
registerAuthRoutes(app, Object.assign({},base,{loginLimit:middleware,publicLimit:middleware,authClient:function(){},db:function(){},insertRecord:function(){},crypto:crypto}));
registerPublicRoutes(app, Object.assign({},base,{PUBLIC_COLLECTIONS:[],readCollection:function(){},PUBLIC_SUBMISSIONS:new Set(),publicLimit:middleware,publicRecord:function(){},insertRecord:function(){},authClient:function(){},db:function(){},multer:fakeMulter,crypto:crypto,PUBLIC_BUCKET:'public-test'}));
registerAdminRoutes(app, Object.assign({},base,{requireAdmin:middleware,COLLECTIONS:[],readCollection:function(){},validCollection:function(){return true;},replaceCollection:function(){},multer:fakeMulter,MAX_UPLOAD_BYTES:15*1024*1024,path:path,crypto:crypto,PUBLIC_BUCKET:'public-test',PRIVATE_BUCKET:'private-test',db:function(){}}));
const required=['POST /api/auth/login','POST /api/auth/member-login','POST /api/public/member-signup','GET /api/public-directory','GET /api/member/profile','PUT /api/member/profile','POST /api/member/avatar','GET /api/public-directory','GET /api/member/profile','PUT /api/member/profile','POST /api/member/avatar','GET /api/public-data','POST /api/public/:collection','GET /api/admin/records','GET /api/admin/records/:collection','PUT /api/admin/records/:collection','POST /api/admin/uploads','GET /api/admin/broadcast/config','GET /api/admin/broadcast/hymns','POST /api/admin/broadcast/hymns','DELETE /api/admin/broadcast/hymns/:id','GET /api/admin/broadcast/sessions','POST /api/admin/broadcast/sessions','POST /api/admin/broadcast/sessions/:id/token','POST /api/admin/broadcast/sessions/:id/start','PATCH /api/admin/broadcast/sessions/:id/overlay','POST /api/admin/broadcast/sessions/:id/end','PATCH /api/admin/broadcast/sessions/:id/recording','GET /api/public/live','POST /api/public/live/token'];
for (const route of required) if (!seen.includes(route)) throw new Error('Backend route not registered: ' + route);

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
if (!/scriptSrc:\s*\["'self'",'https:\/\/cdn\.jsdelivr\.net'\]/.test(serverSource) ||
    !/scriptSrcAttr:\s*\["'unsafe-inline'"\]/.test(serverSource)) {
  throw new Error('CSP must allow legacy inline event attributes without allowing inline script elements.');
}

if (serverSource.includes('const URL =') ||
    !serverSource.includes('const SUPABASE_URL =') ||
    !serverSource.includes('const endpoint = new URL(value)') ||
    !serverSource.includes('...liveKitConnectSrc')) {
  throw new Error('LiveKit CSP must use the native URL constructor and include the configured LiveKit host allowlist.');
}

process.stdout.write('Backend routes registered: ' + required.length + '.\n');

const broadcastRoutes = fs.readFileSync(path.join(__dirname, '..', 'routes/admin.js'), 'utf8');
if (!/presentation_config:config/.test(broadcastRoutes)) throw new Error('Broadcast presentation settings must be persisted.');

const hymnRoutes = fs.readFileSync(path.join(__dirname, '..', 'routes/admin.js'), 'utf8');
if (!hymnRoutes.includes("from('worship_hymns')")) throw new Error('Protected ICF hymn library routes are missing.');
