'use strict';
require('dotenv').config();
const crypto = require('node:crypto');
const path = require('node:path');
const buildHomepage = require('./scripts/build-homepage');
const registerAuthRoutes = require('./routes/auth');
const registerPublicRoutes = require('./routes/public');
const registerAdminRoutes = require('./routes/admin');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const sanitizeHtml = require('sanitize-html');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = Number(process.env.PORT || 10000);
const ROOT = __dirname;
const URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PUBLIC_BUCKET = process.env.SUPABASE_PUBLIC_BUCKET || 'church-public';
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || 'church-private';
const configured = Boolean(URL && ANON_KEY && SERVICE_KEY);
const COLLECTIONS = ['members','prayers','baptisms','events','sermons','media','announcements','contactMessages','emailHistory','livestream','siteSettings','enabledLangs','churchRoles'];
const PUBLIC_COLLECTIONS = ['events','sermons','media','announcements','prayers','baptisms','livestream','siteSettings'];
const PUBLIC_SUBMISSIONS = new Set(['prayers','baptisms','contactMessages']);
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
let serviceClient = null;

function db() {
  if (!configured) throw new Error('Supabase environment variables are missing.');
  if (!serviceClient) serviceClient = createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return serviceClient;
}
function authClient() {
  if (!configured) throw new Error('Supabase environment variables are missing.');
  return createClient(URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
function fail(res, status, error) { return res.status(status).json({ error: error }); }
app.get('/healthz', function (req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'icf-website',
    environment: process.env.NODE_ENV || 'development',
    supabaseConfigured: configured,
    timestamp: new Date().toISOString()
  });
});
app.get('/api/health', function (req, res) {
  res.status(200).json({
    status: 'ok',
    supabaseConfigured: Boolean(URL && ANON_KEY && SERVICE_KEY),
    publicBucketNameConfigured: Boolean(PUBLIC_BUCKET),
    privateBucketNameConfigured: Boolean(PRIVATE_BUCKET),
    timestamp: new Date().toISOString()
  });
});
function requireStorage(req, res, next) {
  if (!configured) return fail(res, 503, 'Supabase is not configured. Add the Supabase environment variables in Render.');
  next();
}
function clean(value, depth) {
  if (depth > 8) return null;
  if (typeof value === 'string') return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).slice(0, 20000);
  if (Array.isArray(value)) return value.slice(0, 2000).map(function (v) { return clean(v, depth + 1); });
  if (value && typeof value === 'object') {
    const result = {};
    Object.keys(value).slice(0, 100).forEach(function (key) { if (key.length <= 100) result[key] = clean(value[key], depth + 1); });
    return result;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  return null;
}
function validCollection(name) { return COLLECTIONS.indexOf(name) !== -1; }
function normalizeRecord(value) {
  const record = clean(value, 0);
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Each record must be a JSON object.');
  if (!record.id || typeof record.id !== 'string') record.id = crypto.randomUUID();
  record.id = String(record.id).slice(0, 150);
  return record;
}
async function readCollection(collection) {
  const rows = [];
  let offset = 0;
  while (true) {
    const result = await db().from('app_records').select('record_id,data,created_at,updated_at')
      .eq('collection', collection).order('created_at', { ascending: false }).range(offset, offset + 999);
    if (result.error) throw result.error;
    rows.push.apply(rows, result.data || []);
    if (!result.data || result.data.length < 1000) break;
    offset += 1000;
  }
  return rows.map(function (row) { return row.data; });
}
async function replaceCollection(collection, input) {
  if (!Array.isArray(input)) throw new Error('Request body must be an array of records.');
  if (input.length > 2000) throw new Error('Too many records in one request.');
  const recordsById = new Map();
  input.map(normalizeRecord).forEach(function (record) { recordsById.set(record.id, record); });
  const records = Array.from(recordsById.values());
  const client = db();
  const old = await client.from('app_records').select('record_id').eq('collection', collection);
  if (old.error) throw old.error;
  const keep = new Set(records.map(function (record) { return record.id; }));
  const stale = (old.data || []).map(function (row) { return row.record_id; }).filter(function (id) { return !keep.has(id); });
  if (stale.length) {
    const removed = await client.from('app_records').delete().eq('collection', collection).in('record_id', stale);
    if (removed.error) throw removed.error;
  }
  if (records.length) {
    const now = new Date().toISOString();
    const saved = await client.from('app_records').upsert(records.map(function (record) {
      return { collection: collection, record_id: record.id, data: record, updated_at: now };
    }), { onConflict: 'collection,record_id' });
    if (saved.error) throw saved.error;
  }
  return records;
}
async function insertRecord(collection, value) {
  const record = normalizeRecord(value);
  const result = await db().from('app_records').insert({ collection: collection, record_id: record.id, data: record }).select('data').single();
  if (result.error) throw result.error;
  return result.data.data;
}
async function ensureConfiguredAdmin() {
  const email = String(process.env.ICF_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ICF_ADMIN_PASSWORD || '');
  if (!email || !password || !configured) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 200) {
    throw new Error('ICF_ADMIN_EMAIL or ICF_ADMIN_PASSWORD is invalid; use a valid email and a password of at least 12 characters.');
  }
  const client = db();
  const listed = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listed.error) throw listed.error;
  let user = (listed.data.users || []).find(function (entry) { return String(entry.email || '').toLowerCase() === email; });
  if (user) {
    // Avoid silently resetting the administrator password on every restart or deploy.
    // Set ICF_ADMIN_SYNC_PASSWORD=true only when an intentional password sync is required.
    if (String(process.env.ICF_ADMIN_SYNC_PASSWORD || '').toLowerCase() === 'true') {
      const updated = await client.auth.admin.updateUserById(user.id, { password: password, email_confirm: true });
      if (updated.error) throw updated.error;
      user = updated.data.user;
    }
  } else {
    const created = await client.auth.admin.createUser({ email: email, password: password, email_confirm: true, user_metadata: { full_name: 'ICF Administrator', church: 'ICF Gambia' } });
    if (created.error) throw created.error;
    user = created.data.user;
  }
  const granted = await client.from('admin_users').upsert({ user_id: user.id, display_name: 'ICF Administrator', role: 'super_admin' }, { onConflict: 'user_id' });
  if (granted.error) throw granted.error;
  console.log('Configured ICF administrator account is ready.');
}
function getBearer(req) {
  const header = req.headers.authorization || '';
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}
async function adminIdentity(token) {
  if (!token) return { error: 'Please sign in again.', status: 401 };
  const auth = authClient();
  const checked = await auth.auth.getUser(token);
  if (checked.error || !checked.data || !checked.data.user) return { error: 'Your session has expired. Please sign in again.', status: 401 };
  const role = await db().from('admin_users').select('role,display_name').eq('user_id', checked.data.user.id).maybeSingle();
  if (role.error) throw role.error;
  if (!role.data) return { error: 'This account has not been granted administrator access.', status: 403 };
  return { user: checked.data.user, admin: role.data };
}
async function requireAdmin(req, res, next) {
  try {
    const identity = await adminIdentity(getBearer(req));
    if (identity.error) return fail(res, identity.status, identity.error);
    req.identity = identity;
    next();
  } catch (error) {
    console.error('Admin verification failed:', error.message);
    fail(res, 503, 'Could not verify administrator access. Check the Supabase configuration and schema.');
  }
}
function publicRecord(collection, body) {
  const source = normalizeRecord(body || {});
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  if (collection === 'prayers') {
    const request = String(source.request || '').trim();
    const anonymous = Boolean(source.anonymous);
    const name = String(source.requesterName || '').trim();
    if (!request || request.length > 3000) throw new Error('Please provide a prayer request of 1–3000 characters.');
    if (!anonymous && !name) throw new Error('Please provide your name or choose anonymous submission.');
    return { id:id, requesterName:anonymous ? 'Anonymous' : name.slice(0,120), email:String(source.email || '').slice(0,254),
      category:String(source.category || 'other').slice(0,80), request:request, status:'pending', adminNote:'',
      anonymous:anonymous, createdAt:createdAt };
  }
  if (collection === 'baptisms') {
    const name = String(source.fullName || '').trim();
    const phone = String(source.phone || '').trim();
    const date = String(source.preferredDate || '').trim();
    if (name.length < 2 || phone.length < 6 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Please provide your name, phone number, and a valid preferred baptism date.');
    return { id:id, fullName:name.slice(0,120), phone:phone.slice(0,40), email:String(source.email || '').slice(0,254),
      testimony:String(source.testimony || '').slice(0,3000), preferredDate:date, status:'pending', adminNote:'', createdAt:createdAt };
  }
  if (collection === 'contactMessages') {
    const name = String(source.name || '').trim();
    const email = String(source.email || '').trim();
    const message = String(source.message || '').trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 3 || message.length > 5000) {
      throw new Error('Please provide your name, a valid email address, and a message.');
    }
    return { id:id, name:name.slice(0,120), email:email.slice(0,254), phone:String(source.phone || '').slice(0,40),
      subject:String(source.subject || '').slice(0,180), message:message, status:'new', createdAt:createdAt };
  }
  throw new Error('This public submission type is not allowed.');
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc:["'self'"], scriptSrc:["'self'"], scriptSrcAttr:["'unsafe-inline'"], styleSrc:["'self'","'unsafe-inline'",'https:'],
  imgSrc:["'self'",'data:','blob:','https:'], fontSrc:["'self'",'data:','https:'],
  connectSrc:["'self'",URL,'https://nominatim.openstreetmap.org'].filter(Boolean),
  frameSrc:["'self'",'https://www.youtube.com','https://www.youtube-nocookie.com','https://www.facebook.com'],
  objectSrc:["'self'"], baseUri:["'self'"], frameAncestors:["'self'"]
} } }));
function normalizeOrigin(value) {
  let normalized = String(value || '').trim();
  while (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  return normalized;
}
const origins = Array.from(new Set([process.env.CORS_ORIGINS || '', process.env.CORS_ORIGIN || '']
  .join(',').split(',').map(normalizeOrigin).filter(Boolean)));
app.use(cors({ origin:function (origin, callback) {
  if (!origin || origins.indexOf(normalizeOrigin(origin)) !== -1) return callback(null, true);
  return callback(null, false);
}, methods:['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders:['Content-Type','Authorization'] }));
app.use(express.json({ limit:'1mb' }));
app.use(express.urlencoded({ extended:false, limit:'1mb' }));
app.use('/api/', rateLimit({ windowMs:15*60*1000, limit:300, standardHeaders:'draft-7', legacyHeaders:false }));
app.use('/api/', function (req,res,next) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Pragma','no-cache');
  next();
});
const loginLimit = rateLimit({ windowMs:15*60*1000, limit:10, standardHeaders:'draft-7', legacyHeaders:false });
const publicLimit = rateLimit({ windowMs:15*60*1000, limit:30, standardHeaders:'draft-7', legacyHeaders:false });

app.get('/health', function (req,res) { res.json({ status:'ok', service:'icf-gambia', storageConfigured:configured, timestamp:new Date().toISOString() }); });

registerAuthRoutes(app, { loginLimit, publicLimit, requireStorage, authClient, db, fail, insertRecord, crypto });
registerPublicRoutes(app, { requireStorage, fail, PUBLIC_COLLECTIONS, readCollection, PUBLIC_SUBMISSIONS, publicLimit, publicRecord, insertRecord, authClient, db, multer, crypto, PUBLIC_BUCKET });
registerAdminRoutes(app, { requireStorage, requireAdmin, fail, COLLECTIONS, readCollection, validCollection, replaceCollection, multer, MAX_UPLOAD_BYTES, path, crypto, PUBLIC_BUCKET, PRIVATE_BUCKET, db });
let homepageHtml = null;
app.get('/',function (req,res) {
  try {
    if (homepageHtml === null) homepageHtml = buildHomepage();
    res.status(200).type('html')
      .set('Cache-Control','public, max-age=0, must-revalidate')
      .send(homepageHtml);
  } catch (error) {
    console.error('Homepage assembly failed:',error.message);
    fail(res,500,'The church homepage could not be assembled.');
  }
});
app.get('/index.html',function (req,res) { res.redirect(302,'/'); });
app.get(['/server.js','/package.json','/package-lock.json','/README.md','/RENDER_DEPLOYMENT.md','/PROJECT_REPAIR_REPORT.md'],function (req,res) { res.sendStatus(404); });
// Keep implementation and deployment-only files out of the public static surface.
app.use(['/supabase','/scripts','/.github','/.git','/views','/routes'], function (req,res) { res.sendStatus(404); });
app.use(express.static(ROOT,{ index:false, dotfiles:'ignore', maxAge:process.env.NODE_ENV === 'production' ? '1h' : 0 }));
app.use(function (error,req,res,next) {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) return fail(res,400,error.code === 'LIMIT_FILE_SIZE' ? 'Files must be 15 MB or smaller.' : 'Upload was rejected.');
  if (error.message === 'This file type is not allowed.') return fail(res,400,error.message);
  console.error('Unhandled request error:',error.message);
  fail(res,500,'An unexpected server error occurred.');
});
app.listen(PORT,function () {
  console.log('ICF Gambia listening on port ' + PORT + '. Supabase configured: ' + configured);
  ensureConfiguredAdmin().catch(function (error) {
    console.error('ICF administrator bootstrap failed:', error.message);
  });
});
