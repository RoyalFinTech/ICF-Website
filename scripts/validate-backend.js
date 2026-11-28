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
const required=['GET /api/public/auth-config','POST /api/auth/password-reset-request','POST /api/auth/password-reset-complete','POST /api/auth/resend-confirmation','POST /api/auth/login','POST /api/auth/member-login','POST /api/public/member-signup','GET /api/public-directory','GET /api/member/profile','PUT /api/member/profile','POST /api/member/avatar','GET /api/public-directory','GET /api/member/profile','PUT /api/member/profile','POST /api/member/avatar','GET /api/public-data','POST /api/public/:collection','GET /api/admin/records','GET /api/admin/records/:collection','PUT /api/admin/records/:collection','POST /api/admin/uploads','GET /api/admin/broadcast/config','GET /api/admin/broadcast/hymns','POST /api/admin/broadcast/hymns','DELETE /api/admin/broadcast/hymns/:id','GET /api/admin/broadcast/sessions','POST /api/admin/broadcast/sessions','GET /api/admin/broadcast/sessions/:id/phone-presentation','POST /api/admin/broadcast/sessions/:id/token','POST /api/admin/broadcast/sessions/:id/start','PATCH /api/admin/broadcast/sessions/:id/overlay','POST /api/admin/broadcast/sessions/:id/end','PATCH /api/admin/broadcast/sessions/:id/recording','GET /api/public/live','POST /api/public/live/token'];
for (const route of required) if (!seen.includes(route)) throw new Error('Backend route not registered: ' + route);

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

const authRouteSource = fs.readFileSync(path.join(__dirname, '..', 'routes/auth.js'), 'utf8');
if (!authRouteSource.includes("auth.resetPasswordForEmail(email,{redirectTo:publicSiteUrl()})") ||
    !authRouteSource.includes("auth.auth.setSession({access_token:accessToken,refresh_token:refreshToken})") ||
    !authRouteSource.includes("auth.auth.updateUser({password:password})")) throw new Error('Password reset email and completion endpoints are incomplete.');
if (!authRouteSource.includes("auth.resend({type:'signup'") || !authRouteSource.includes('emailRedirectTo:publicSiteUrl()')) throw new Error('Signup confirmation resend flow is missing.');
if (!authRouteSource.includes('verifyTurnstile(body.captchaToken)') || !authRouteSource.includes("result.action === 'icf_member_signup'")) throw new Error('Server-side Turnstile token validation is missing.');
if (!authRouteSource.includes("body.companyWebsite") || !authRouteSource.includes("signupLimit||publicLimit")) throw new Error('Signup honeypot or dedicated rate limit is missing.');
if (!serverSource.includes('https://challenges.cloudflare.com')) throw new Error('CSP must allow the Turnstile widget and Siteverify.');

if (!serverSource.includes("scriptSrc:[\"'self'\",'https://cdn.jsdelivr.net','https://challenges.cloudflare.com']") ||
    !serverSource.includes("scriptSrcAttr:[\"'unsafe-inline'\"]") ||
    !serverSource.includes("connectSrc:[\"'self'\",SUPABASE_URL,'https://nominatim.openstreetmap.org','https://bible-api.com','https://challenges.cloudflare.com'") ||
    !serverSource.includes("frameSrc:[\"'self'\",'https://challenges.cloudflare.com'")) {
  throw new Error('CSP must explicitly allow the original CDN plus Turnstile script, connect and frame origins without broadening inline scripts.');
}

if (serverSource.includes('const URL =') ||
    !serverSource.includes('const SUPABASE_URL =') ||
    !serverSource.includes('const endpoint = new URL(value)') ||
    !serverSource.includes('...liveKitConnectSrc')) {
  throw new Error('LiveKit CSP must use the native URL constructor and include the configured LiveKit host allowlist.');
}

const countryData = require('../js/country-data');
if (countryData.count() !== 249 || !countryData.getCountry('GM') || !countryData.getCountry('NG')) throw new Error('Country data module must include the full ISO country list and flags.');
const signupAuthSource = fs.readFileSync(path.join(__dirname, '..', 'routes/auth.js'), 'utf8');
if (!signupAuthSource.includes("countryData.getCountry(nationalityCode)") || !signupAuthSource.includes("nationality:country.name")) throw new Error('Server-side nationality validation and canonical persistence are missing.');
if (!signupAuthSource.includes("member.status !== 'approved'")) throw new Error('Member login is missing the approval gate.');
if (!signupAuthSource.includes('emailFeatureConfiguration().verificationRequired && member.emailVerified !== true')) throw new Error('Future email verification must block approved members until their email is verified.');
const publicAuthSource = fs.readFileSync(path.join(__dirname, '..', 'routes/public.js'), 'utf8');
const adminBroadcastSource = fs.readFileSync(path.join(__dirname, '..', 'routes/admin.js'), 'utf8');
if (!publicAuthSource.includes("Membership status, roles, approval and Auth identity are admin-controlled.")) throw new Error('Member self-service profile must not be able to change approval or church roles.');
if (!publicAuthSource.includes("m.status==='approved'&&m.publicProfileConsent===true&&m.directoryVisible===true")) throw new Error('Public leadership directory must require approval, profile consent, and admin visibility.');
if (!adminBroadcastSource.includes("app.get('/api/admin/broadcast/sessions/:id/phone-presentation',requireStorage,requireAdmin") ||
    !adminBroadcastSource.includes("app.post('/api/admin/broadcast/sessions/:id/token',requireStorage,requireAdmin") ||
    !adminBroadcastSource.includes("app.get('/api/admin/broadcast/config',requireStorage,requireAdmin")) throw new Error('Broadcast publishing credentials and configuration must remain admin-protected.');
if (!publicAuthSource.includes("canPublish:false,canSubscribe:true")) throw new Error('Public LiveKit viewer token must be read-only.');

process.stdout.write('Backend routes registered: ' + required.length + '.\n');

const broadcastRoutes = fs.readFileSync(path.join(__dirname, '..', 'routes/admin.js'), 'utf8');
if (!/presentation_config:config/.test(broadcastRoutes)) throw new Error('Broadcast presentation settings must be persisted.');

const hymnRoutes = fs.readFileSync(path.join(__dirname, '..', 'routes/admin.js'), 'utf8');
if (!hymnRoutes.includes("from('worship_hymns')")) throw new Error('Protected ICF hymn library routes are missing.');
