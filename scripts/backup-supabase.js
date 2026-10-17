'use strict';
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { gzipSync } = require('node:zlib');

const required = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','S3_ENDPOINT','S3_BUCKET','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY'];
const missing = required.filter(function (key) { return !process.env[key]; });
if (missing.length) { console.error('Missing backup configuration: ' + missing.join(', ')); process.exit(1); }
const supabase = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const s3 = new S3Client({
  endpoint:process.env.S3_ENDPOINT, region:process.env.S3_REGION || 'auto',
  forcePathStyle:String(process.env.S3_FORCE_PATH_STYLE || 'true') === 'true',
  credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}
});
const bucket = process.env.S3_BUCKET;
const runId = new Date().toISOString().replace(/[:.]/g,'-');
async function put(key,body,type,encoding) {
  const params = {Bucket:bucket,Key:key,Body:body,ContentType:type || 'application/octet-stream'};
  if (encoding) params.ContentEncoding = encoding;
  await s3.send(new PutObjectCommand(params));
}
async function backupRecords() {
  const rows = []; let offset = 0;
  while (true) {
    const result = await supabase.from('app_records').select('*').order('collection').range(offset,offset+999);
    if (result.error) throw result.error;
    rows.push.apply(rows,result.data || []);
    if (!result.data || result.data.length < 1000) break;
    offset += 1000;
  }
  const compressed = gzipSync(Buffer.from(JSON.stringify({backupVersion:1,createdAt:new Date().toISOString(),records:rows}),'utf8'));
  await put('icf-gambia/' + runId + '/database-records.json.gz',compressed,'application/gzip','gzip');
  console.log('Exported ' + rows.length + ' database records.');
}
async function backupFolder(storageBucket,prefix) {
  let offset = 0;
  while (true) {
    const listed = await supabase.storage.from(storageBucket).list(prefix,{limit:100,offset:offset,sortBy:{column:'name',order:'asc'}});
    if (listed.error) throw listed.error;
    const items = listed.data || [];
    for (const item of items) {
      const full = prefix ? prefix + '/' + item.name : item.name;
      if (!item.id && !item.metadata) await backupFolder(storageBucket,full);
      else {
        const download = await supabase.storage.from(storageBucket).download(full);
        if (download.error) throw download.error;
        const bytes = Buffer.from(await download.data.arrayBuffer());
        await put('icf-gambia/' + runId + '/storage/' + storageBucket + '/' + full,bytes,item.metadata && item.metadata.mimetype || 'application/octet-stream');
      }
    }
    if (items.length < 100) break;
    offset += items.length;
  }
}
async function main() {
  await backupRecords();
  for (const name of ['church-public','church-private']) await backupFolder(name,'');
  await put('icf-gambia/' + runId + '/backup-manifest.json',Buffer.from(JSON.stringify({
    createdAt:new Date().toISOString(),buckets:['church-public','church-private'],includes:['app_records','Supabase Storage objects']
  },null,2)),'application/json');
  console.log('Backup finished: icf-gambia/' + runId + '/');
}
main().catch(function (error) { console.error('Backup failed:',error.message); process.exit(1); });
