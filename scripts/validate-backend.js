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
registerPublicRoutes(app, Object.assign({},base,{PUBLIC_COLLECTIONS:[],readCollection:function(){},PUBLIC_SUBMISSIONS:new Set(),publicLimit:middleware,publicRecord:function(){},insertRecord:function(){}}));
registerAdminRoutes(app, Object.assign({},base,{requireAdmin:middleware,COLLECTIONS:[],readCollection:function(){},validCollection:function(){return true;},replaceCollection:function(){},multer:fakeMulter,MAX_UPLOAD_BYTES:15*1024*1024,path:path,crypto:crypto,PUBLIC_BUCKET:'public-test',PRIVATE_BUCKET:'private-test',db:function(){}}));
const required=['POST /api/auth/login','POST /api/auth/member-login','POST /api/public/member-signup','GET /api/public-directory','GET /api/member/profile','PUT /api/member/profile','POST /api/member/avatar','GET /api/public-data','POST /api/public/:collection','GET /api/admin/records','GET /api/admin/records/:collection','PUT /api/admin/records/:collection','POST /api/admin/uploads'];
for (const route of required) if (!seen.includes(route)) throw new Error('Backend route not registered: ' + route);

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
if (!/scriptSrc:\s*\["'self'"\]/.test(serverSource) ||
    !/scriptSrcAttr:\s*\["'unsafe-inline'"\]/.test(serverSource)) {
  throw new Error('CSP must allow legacy inline event attributes without allowing inline script elements.');
}

process.stdout.write('Backend routes registered: ' + required.length + '.\n');
