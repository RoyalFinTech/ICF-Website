'use strict';

module.exports = function registerAdminRoutes(app, deps) {
  const {
    requireStorage, requireAdmin, fail, COLLECTIONS, readCollection, validCollection,
    replaceCollection, multer, MAX_UPLOAD_BYTES, path, crypto, PUBLIC_BUCKET,
    PRIVATE_BUCKET, db
  } = deps;

  app.get('/api/admin/records', requireStorage, requireAdmin, async function (req,res) {
    try {
      const data = {};
      const entries = await Promise.all(COLLECTIONS.map(async function (collection) {
        return [collection, await readCollection(collection)];
      }));
      entries.forEach(function (entry) { data[entry[0]] = entry[1]; });
      res.json(data);
    } catch (error) {
      console.error('Admin data read failed:',error.message);
      fail(res,503,'Could not load administration records.');
    }
  });
  app.get('/api/admin/records/:collection', requireStorage, requireAdmin, async function (req,res) {
    if (!validCollection(req.params.collection)) return fail(res,404,'Unknown record collection.');
    try { res.json(await readCollection(req.params.collection)); }
    catch (error) { console.error('Collection read failed:',error.message); fail(res,503,'Could not load records.'); }
  });
  app.put('/api/admin/records/:collection', requireStorage, requireAdmin, async function (req,res) {
    const collection = req.params.collection;
    if (!validCollection(collection)) return fail(res,404,'Unknown record collection.');
    try { const saved = await replaceCollection(collection,req.body); res.json({ saved:saved.length }); }
    catch (error) {
      if (/array|Too many records|JSON object/.test(error.message || '')) return fail(res,400,error.message);
      console.error('Collection save failed:',error.message);
      fail(res,503,'Could not save records. Please retry.');
    }
  });
  
  function hasValidFileSignature(buffer,mime) {
    if (!Buffer.isBuffer(buffer)) return false;
    const starts = function (bytes) { return buffer.length >= bytes.length && bytes.every(function (byte,index) { return buffer[index] === byte; }); };
    const ascii = function (start,length) { return buffer.toString('ascii',start,start+length); };
    if (mime === 'image/jpeg') return starts([0xff,0xd8,0xff]);
    if (mime === 'image/png') return starts([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
    if (mime === 'image/gif') return ascii(0,6) === 'GIF87a' || ascii(0,6) === 'GIF89a';
    if (mime === 'image/webp') return ascii(0,4) === 'RIFF' && ascii(8,4) === 'WEBP';
    if (mime === 'application/pdf') return ascii(0,5) === '%PDF-';
    if (mime === 'audio/mpeg') return ascii(0,3) === 'ID3' || (buffer.length > 1 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    if (mime === 'audio/wav') return ascii(0,4) === 'RIFF' && ascii(8,4) === 'WAVE';
    if (mime === 'audio/ogg') return ascii(0,4) === 'OggS';
    if (mime === 'audio/webm' || mime === 'video/webm') return starts([0x1a,0x45,0xdf,0xa3]);
    if (mime === 'audio/mp4' || mime === 'video/mp4') return ascii(4,4) === 'ftyp';
    if (mime === 'video/quicktime') return ascii(4,4) === 'ftyp' && ascii(8,4).startsWith('qt');
    return false;
  }
  const upload = multer({
    storage:multer.memoryStorage(), limits:{ fileSize:MAX_UPLOAD_BYTES, files:1 },
    fileFilter:function (req,file,callback) {
      const allowed = /^(image\/(jpeg|png|webp|gif)|application\/pdf|audio\/(mpeg|mp4|wav|ogg|webm)|video\/(mp4|webm|quicktime))$/i;
      if (!allowed.test(file.mimetype)) return callback(new Error('This file type is not allowed.'));
      callback(null,true);
    }
  });
  app.post('/api/admin/uploads', requireStorage, requireAdmin, upload.single('file'), async function (req,res) {
    try {
      if (!req.file) return fail(res,400,'Choose a file to upload.');
      if (!hasValidFileSignature(req.file.buffer,req.file.mimetype)) {
        return fail(res,400,'The file content does not match its declared file type. Please choose a valid image, document, audio, or video file.');
      }
      const bucket = String(req.query.bucket || PUBLIC_BUCKET);
      if (bucket !== PUBLIC_BUCKET && bucket !== PRIVATE_BUCKET) return fail(res,400,'Invalid storage bucket.');
      const ext = path.extname(req.file.originalname || '').toLowerCase().replace(/[^.a-z0-9]/g,'').slice(0,12);
      const objectPath = 'uploads/' + new Date().toISOString().slice(0,10) + '/' + crypto.randomUUID() + ext;
      const storage = db().storage.from(bucket);
      const result = await storage.upload(objectPath,req.file.buffer,{ contentType:req.file.mimetype, upsert:false, cacheControl:'3600' });
      if (result.error) throw result.error;
      if (bucket === PUBLIC_BUCKET) return res.status(201).json({
        bucket:bucket, path:objectPath, url:storage.getPublicUrl(objectPath).data.publicUrl,
        name:req.file.originalname, contentType:req.file.mimetype, size:req.file.size
      });
      const signed = await storage.createSignedUrl(objectPath,3600);
      if (signed.error) throw signed.error;
      res.status(201).json({ bucket:bucket, path:objectPath, url:signed.data.signedUrl, name:req.file.originalname, contentType:req.file.mimetype, size:req.file.size, expiresIn:3600 });
    } catch (error) {
      console.error('Upload failed:',error.message);
      fail(res,503,'Upload failed. Check that the Supabase Storage buckets exist and try again.');
    }
  });

  function createBroadcastToken(room, identity, canPublish) {
    const key=process.env.LIVEKIT_API_KEY||'', secret=process.env.LIVEKIT_API_SECRET||'', serverUrl=process.env.LIVEKIT_URL||'';
    if(!key||!secret||!serverUrl) throw new Error('LIVEKIT_NOT_CONFIGURED');
    const now=Math.floor(Date.now()/1000), enc=function(v){return Buffer.from(JSON.stringify(v)).toString('base64url');};
    const body=enc({alg:'HS256',typ:'JWT'})+'.'+enc({iss:key,sub:identity,name:identity,nbf:now-5,iat:now,exp:now+3600,video:{roomJoin:true,room:room,canPublish:!!canPublish,canSubscribe:true}});
    return {serverUrl:serverUrl,token:body+'.'+crypto.createHmac('sha256',secret).update(body).digest('base64url')};
  }
  app.get('/api/admin/broadcast/config',requireStorage,requireAdmin,function(req,res){
    res.json({provider:'LiveKit',configured:Boolean(process.env.LIVEKIT_URL&&process.env.LIVEKIT_API_KEY&&process.env.LIVEKIT_API_SECRET)});
  });
  app.get('/api/admin/broadcast/sessions',requireStorage,requireAdmin,async function(req,res){
    try{const r=await db().from('broadcast_sessions').select('*').order('created_at',{ascending:false}).limit(50);if(r.error)throw r.error;res.json({sessions:r.data||[]});}
    catch(e){console.error('Broadcast history read failed:',e.message);fail(res,503,'Could not load broadcast history.');}
  });
  app.post('/api/admin/broadcast/sessions',requireStorage,requireAdmin,async function(req,res){
    try{
      const b=req.body||{},title=String(b.title||'').trim();if(title.length<3||title.length>180)return fail(res,400,'Enter a broadcast title between 3 and 180 characters.');
      const slug=crypto.randomBytes(9).toString('hex'),id=crypto.randomUUID();
      const row={id:id,slug:slug,title:title,description:String(b.description||'').slice(0,1200),room_name:'icf-'+slug,status:'draft',
        is_public:b.isPublic!==false,recording_enabled:b.recordingEnabled===true,recording_status:b.recordingEnabled===true?'pending':'not_requested',
        logo_url:String(b.logoUrl||'').slice(0,1000)||null,logo_position:['top-left','top-right','bottom-left','bottom-right'].includes(b.logoPosition)?b.logoPosition:'top-left',
        overlay_text:String(b.overlayText||'').slice(0,500),scripture_reference:String(b.scriptureReference||'').slice(0,120),scripture_text:String(b.scriptureText||'').slice(0,1200),
        scheduled_at:b.scheduledAt||null,created_by:req.identity.user.id};
      const saved=await db().from('broadcast_sessions').insert(row).select('*').single();if(saved.error)throw saved.error;
      res.status(201).json({session:saved.data,shareUrl:'/live.html?slug='+encodeURIComponent(slug)});
    }catch(e){console.error('Broadcast draft save failed:',e.message);fail(res,503,'Could not save broadcast setup.');}
  });
  app.post('/api/admin/broadcast/sessions/:id/token',requireStorage,requireAdmin,async function(req,res){
    try{const r=await db().from('broadcast_sessions').select('room_name').eq('id',req.params.id).maybeSingle();if(r.error)throw r.error;if(!r.data)return fail(res,404,'Broadcast session not found.');res.json(createBroadcastToken(r.data.room_name,'icf-admin-'+req.identity.user.id,true));}
    catch(e){if(e.message==='LIVEKIT_NOT_CONFIGURED')return fail(res,503,'Live broadcasting is not connected yet. Configure LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Render.');console.error('Broadcast token failed:',e.message);fail(res,503,'Could not prepare secure broadcast credentials.');}
  });
  app.post('/api/admin/broadcast/sessions/:id/start',requireStorage,requireAdmin,async function(req,res){
    try{if(!process.env.LIVEKIT_URL||!process.env.LIVEKIT_API_KEY||!process.env.LIVEKIT_API_SECRET)return fail(res,503,'LiveKit credentials are not configured.');const r=await db().from('broadcast_sessions').update({status:'live',started_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',req.params.id).select('*').single();if(r.error)throw r.error;res.json({session:r.data});}
    catch(e){console.error('Broadcast publish update failed:',e.message);fail(res,503,'Could not publish the broadcast status.');}
  });
  app.patch('/api/admin/broadcast/sessions/:id/overlay',requireStorage,requireAdmin,async function(req,res){
    try{const b=req.body||{},r=await db().from('broadcast_sessions').update({overlay_text:String(b.overlayText||'').slice(0,500),scripture_reference:String(b.scriptureReference||'').slice(0,120),scripture_text:String(b.scriptureText||'').slice(0,1200),updated_at:new Date().toISOString()}).eq('id',req.params.id).eq('status','live').select('id').maybeSingle();if(r.error)throw r.error;if(!r.data)return fail(res,404,'Live broadcast not found.');res.json({updated:true});}
    catch(e){console.error('Broadcast overlay update failed:',e.message);fail(res,503,'Could not update the live presentation.');}
  });
  app.patch('/api/admin/broadcast/sessions/:id/recording',requireStorage,requireAdmin,async function(req,res){
    try{const status=['local_recording','downloaded','failed','not_requested'].includes((req.body||{}).status)?req.body.status:'failed';const r=await db().from('broadcast_sessions').update({recording_status:status,updated_at:new Date().toISOString()}).eq('id',req.params.id).select('id').maybeSingle();if(r.error)throw r.error;if(!r.data)return fail(res,404,'Broadcast session not found.');res.json({updated:true,recordingStatus:status});}
    catch(e){console.error('Recording status update failed:',e.message);fail(res,503,'Could not update recording status.');}
  });
  app.post('/api/admin/broadcast/sessions/:id/end',requireStorage,requireAdmin,async function(req,res){
    try{const r=await db().from('broadcast_sessions').update({status:'ended',ended_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',req.params.id).in('status',['live','preparing','draft']).select('*').maybeSingle();if(r.error)throw r.error;if(!r.data)return fail(res,404,'Broadcast session is already closed.');res.json({session:r.data});}
    catch(e){console.error('Broadcast end failed:',e.message);fail(res,503,'Could not end the broadcast.');}
  });
};
