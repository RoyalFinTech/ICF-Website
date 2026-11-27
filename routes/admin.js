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

function normalizedLiveKitUrl(){var raw=String(process.env.LIVEKIT_URL||'').trim();if(!raw)throw new Error('LIVEKIT_NOT_CONFIGURED');if(!/^https?:\/\//i.test(raw)&&!/^wss?:\/\//i.test(raw))raw='wss://'+raw;var u=new URL(raw);if(u.protocol==='https:')u.protocol='wss:';else if(u.protocol==='http:')u.protocol='ws:';if(!['wss:','ws:'].includes(u.protocol)||!u.hostname)throw new Error('LIVEKIT_URL_INVALID');u.pathname='';u.search='';u.hash='';return u.toString().replace(/\/$/,'');}
  function createBroadcastToken(room, identity, canPublish) {
    const key=process.env.LIVEKIT_API_KEY||'', secret=process.env.LIVEKIT_API_SECRET||'', serverUrl=normalizedLiveKitUrl();
    if(!key||!secret||!serverUrl) throw new Error('LIVEKIT_NOT_CONFIGURED');
    const now=Math.floor(Date.now()/1000), enc=function(v){return Buffer.from(JSON.stringify(v)).toString('base64url');};
    const body=enc({alg:'HS256',typ:'JWT'})+'.'+enc({iss:key,sub:identity,name:identity,nbf:now-5,iat:now,exp:now+3600,video:{roomJoin:true,room:room,canPublish:!!canPublish,canSubscribe:true}});
    return {serverUrl:serverUrl,token:body+'.'+crypto.createHmac('sha256',secret).update(body).digest('base64url')};
  }
  async function terminateLiveKitRoom(roomName) {
    if (!roomName) return false;
    const key=process.env.LIVEKIT_API_KEY||'',secret=process.env.LIVEKIT_API_SECRET||'';
    if (!key || !secret) return false;
    const wsUrl=normalizedLiveKitUrl(),apiUrl=wsUrl.replace(/^wss:/,'https:').replace(/^ws:/,'http:');
    const now=Math.floor(Date.now()/1000),enc=function(v){return Buffer.from(JSON.stringify(v)).toString('base64url');};
    const unsigned=enc({alg:'HS256',typ:'JWT'})+'.'+enc({iss:key,sub:'icf-room-ender-'+crypto.randomBytes(6).toString('hex'),nbf:now-5,iat:now,exp:now+60,video:{roomAdmin:true,room:roomName}});
    const token=unsigned+'.'+crypto.createHmac('sha256',secret).update(unsigned).digest('base64url');
    const response=await fetch(apiUrl+'/twirp/livekit.RoomService/DeleteRoom',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({room:roomName}),signal:AbortSignal.timeout(8000)});
    if(response.status===404)return true;
    if(!response.ok)throw new Error('LiveKit DeleteRoom returned HTTP '+response.status);
    return true;
  }
  app.get('/api/admin/broadcast/config',requireStorage,requireAdmin,function(req,res){
    const configured=Boolean(process.env.LIVEKIT_URL&&process.env.LIVEKIT_API_KEY&&process.env.LIVEKIT_API_SECRET);let endpoint=null,urlValid=false,urlError=null;try{endpoint=normalizedLiveKitUrl();urlValid=true;}catch(e){urlError=e.message==='LIVEKIT_URL_INVALID'?'LIVEKIT_URL is not a valid URL.':null;}let host=null,protocol=null;if(endpoint){const u=new URL(endpoint);host=u.host;protocol=u.protocol;}res.json({provider:'LiveKit',configured:configured,urlValid:urlValid,host:host,protocol:protocol,error:urlError});
  });
  app.post('/api/admin/broadcast/connection-test',requireStorage,requireAdmin,async function(req,res){
    try{
      const key=process.env.LIVEKIT_API_KEY||'',secret=process.env.LIVEKIT_API_SECRET||'';
      if(!key||!secret)throw new Error('LIVEKIT_NOT_CONFIGURED');
      const wsUrl=normalizedLiveKitUrl(),apiUrl=wsUrl.replace(/^wss:/,'https:').replace(/^ws:/,'http:');
      const now=Math.floor(Date.now()/1000),enc=function(v){return Buffer.from(JSON.stringify(v)).toString('base64url');};
      const unsigned=enc({alg:'HS256',typ:'JWT'})+'.'+enc({iss:key,sub:'icf-health-'+crypto.randomBytes(6).toString('hex'),nbf:now-5,iat:now,exp:now+60,video:{roomList:true}});
      const apiToken=unsigned+'.'+crypto.createHmac('sha256',secret).update(unsigned).digest('base64url');
      let health;
      try{
        health=await fetch(apiUrl+'/twirp/livekit.RoomService/ListRooms',{method:'POST',headers:{'Authorization':'Bearer '+apiToken,'Content-Type':'application/json'},body:JSON.stringify({names:[]}),signal:AbortSignal.timeout(8000)});
      }catch(networkError){const e=new Error('LIVEKIT_API_UNREACHABLE');e.cause=networkError;throw e;}
      if(health.status===401||health.status===403)throw new Error('LIVEKIT_CREDENTIALS_REJECTED');
      if(health.status===404)throw new Error('LIVEKIT_ENDPOINT_NOT_FOUND');
      if(!health.ok)throw new Error('LIVEKIT_API_HTTP_'+health.status);
      const identity='icf-signal-check-'+crypto.randomBytes(6).toString('hex');
      res.json(Object.assign(createBroadcastToken('icf-signal-check',identity,false),{providerApi:'passed',endpoint:new URL(wsUrl).host}));
    }catch(e){
      if(e.message==='LIVEKIT_NOT_CONFIGURED')return fail(res,503,'LiveKit credentials are missing. Check LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Render.');
      if(e.message==='LIVEKIT_URL_INVALID')return fail(res,503,'LIVEKIT_URL must be a valid wss:// LiveKit Cloud endpoint.');
      if(e.message==='LIVEKIT_CREDENTIALS_REJECTED')return fail(res,503,'LiveKit rejected the API credentials. Confirm LIVEKIT_API_KEY and LIVEKIT_API_SECRET belong to the same LiveKit project as LIVEKIT_URL.');
      if(e.message==='LIVEKIT_ENDPOINT_NOT_FOUND')return fail(res,503,'The LiveKit host was reached, but its RoomService API was not found. Check LIVEKIT_URL in Render.');
      if(e.message==='LIVEKIT_API_UNREACHABLE')return fail(res,503,'Render could not reach the LiveKit API. Check the LiveKit project endpoint and network availability.');
      if(e.message.indexOf('LIVEKIT_API_HTTP_')===0)return fail(res,503,'LiveKit RoomService returned '+e.message.replace('LIVEKIT_API_HTTP_','HTTP ')+'. Check the LiveKit project status.');
      console.error('LiveKit connection-test failed:',e.message);fail(res,503,'Could not prepare the LiveKit signal test.');
    }
  });
  app.get('/api/admin/broadcast/hymns',requireStorage,requireAdmin,async function(req,res){
    try{const r=await db().from('worship_hymns').select('id,title,hymn_number,lyrics,created_at').order('created_at',{ascending:false}).limit(300);if(r.error)throw r.error;res.json({hymns:r.data||[]});}
    catch(e){console.error('Hymn library read failed:',e.message);fail(res,503,'Could not load the ICF hymnary.');}
  });
  app.post('/api/admin/broadcast/hymns',requireStorage,requireAdmin,async function(req,res){
    try{const b=req.body||{},title=String(b.title||'').trim(),lyrics=String(b.lyrics||'').trim();if(title.length<2||title.length>180||!lyrics||lyrics.length>12000)return fail(res,400,'Enter a hymn title and lyrics (up to 12,000 characters).');
      const r=await db().from('worship_hymns').insert({title:title,hymn_number:String(b.hymnNumber||'').slice(0,80),lyrics:lyrics,created_by:req.identity.user.id}).select('id,title,hymn_number,lyrics,created_at').single();if(r.error)throw r.error;res.status(201).json({hymn:r.data});}
    catch(e){console.error('Hymn save failed:',e.message);fail(res,503,'Could not save this hymn.');}
  });
  app.delete('/api/admin/broadcast/hymns/:id',requireStorage,requireAdmin,async function(req,res){
    try{const r=await db().from('worship_hymns').delete().eq('id',req.params.id).select('id').maybeSingle();if(r.error)throw r.error;if(!r.data)return fail(res,404,'Hymn not found.');res.json({deleted:true});}
    catch(e){console.error('Hymn delete failed:',e.message);fail(res,503,'Could not delete this hymn.');}
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
    catch(e){if(e.message==='LIVEKIT_NOT_CONFIGURED')return fail(res,503,'Live broadcasting is not connected yet. Configure LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Render.');if(e.message==='LIVEKIT_URL_INVALID')return fail(res,503,'LIVEKIT_URL is invalid. Set it to your LiveKit Cloud server URL, for example wss://your-project.livekit.cloud.');console.error('Broadcast token failed:',e.message);fail(res,503,'Could not prepare secure broadcast credentials.');}
  });
  app.post('/api/admin/broadcast/sessions/:id/camera-token',requireStorage,requireAdmin,async function(req,res){
    try{const r=await db().from('broadcast_sessions').select('room_name,status').eq('id',req.params.id).maybeSingle();if(r.error)throw r.error;if(!r.data)return fail(res,404,'Broadcast session not found.');if(!['preparing','live'].includes(r.data.status))return fail(res,409,'Start the broadcast before connecting a remote camera.');const identity='icf-phone-'+crypto.randomBytes(8).toString('hex');res.json(createBroadcastToken(r.data.room_name,identity,true));}
    catch(e){if(e.message==='LIVEKIT_NOT_CONFIGURED')return fail(res,503,'LiveKit is not configured.');if(e.message==='LIVEKIT_URL_INVALID')return fail(res,503,'LIVEKIT_URL must be a valid LiveKit WebSocket URL.');console.error('Remote camera token failed:',e.message);fail(res,503,'Could not connect the phone camera.');}
  });
  app.post('/api/admin/broadcast/sessions/:id/start',requireStorage,requireAdmin,async function(req,res){
    try{if(!process.env.LIVEKIT_URL||!process.env.LIVEKIT_API_KEY||!process.env.LIVEKIT_API_SECRET)return fail(res,503,'LiveKit credentials are not configured.');const r=await db().from('broadcast_sessions').update({status:'live',started_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',req.params.id).select('*').single();if(r.error)throw r.error;res.json({session:r.data});}
    catch(e){console.error('Broadcast publish update failed:',e.message);fail(res,503,'Could not publish the broadcast status.');}
  });
  app.patch('/api/admin/broadcast/sessions/:id/overlay',requireStorage,requireAdmin,async function(req,res){
    try{
      const b=req.body||{},raw=b.presentationConfig||{},mode=['camera','overlay','slide','flyer','split','ticker'].includes(raw.mode)?raw.mode:'camera';
      const config={mode:mode,quality:['480p','720p','1080p'].includes(raw.quality)?raw.quality:'720p',orientation:raw.orientation==='portrait'?'portrait':'landscape',cameraLayout:['single','pip','split'].includes(raw.cameraLayout)?raw.cameraLayout:'single',activeCamera:raw.activeCamera==='camera2'?'camera2':'camera1',background:/^#[0-9a-f]{6}$/i.test(String(raw.background||''))?raw.background:'#071329',
        textColor:/^#[0-9a-f]{6}$/i.test(String(raw.textColor||''))?raw.textColor:'#ffffff',
        fontSize:Math.max(18,Math.min(64,Number(raw.fontSize)||34)),textAlign:['left','center','right'].includes(raw.textAlign)?raw.textAlign:'center',
        scroll:raw.scroll===true,flyerUrl:String(raw.flyerUrl||'').slice(0,1200),slideTitle:String(raw.slideTitle||'').slice(0,180),
        slideBody:String(raw.slideBody||'').slice(0,3000),slideReference:String(raw.slideReference||'').slice(0,180),
        slides:Array.isArray(raw.slides)?raw.slides.slice(0,60).map(function(s){return {type:['camera','overlay','slide','flyer','split','ticker'].includes(s.type)?s.type:'slide',
          title:String(s.title||'').slice(0,180),body:String(s.body||'').slice(0,3000),reference:String(s.reference||'').slice(0,180),
          background:/^#[0-9a-f]{6}$/i.test(String(s.background||''))?s.background:'#071329',textColor:/^#[0-9a-f]{6}$/i.test(String(s.textColor||''))?s.textColor:'#ffffff',
          fontSize:Math.max(18,Math.min(64,Number(s.fontSize)||34)),textAlign:['left','center','right'].includes(s.textAlign)?s.textAlign:'center',
          scroll:s.scroll===true,flyerUrl:String(s.flyerUrl||'').slice(0,1200)};}):[],slideIndex:Math.max(0,Math.min(59,Number(raw.slideIndex)||0))};
      const r=await db().from('broadcast_sessions').update({overlay_text:String(b.overlayText||'').slice(0,500),
        scripture_reference:String(b.scriptureReference||'').slice(0,180),scripture_text:String(b.scriptureText||'').slice(0,3000),
        presentation_config:config,updated_at:new Date().toISOString()}).eq('id',req.params.id).in('status',['draft','preparing','live']).select('id').maybeSingle();
      if(r.error)throw r.error;if(!r.data)return fail(res,404,'Broadcast session not found.');res.json({updated:true,presentationConfig:config});
    }catch(e){console.error('Broadcast presentation update failed:',e.message);fail(res,503,'Could not update the broadcast presentation.');}
  });
  app.patch('/api/admin/broadcast/sessions/:id/recording',requireStorage,requireAdmin,async function(req,res){
    try{const status=['local_recording','downloaded','failed','not_requested'].includes((req.body||{}).status)?req.body.status:'failed';const r=await db().from('broadcast_sessions').update({recording_status:status,updated_at:new Date().toISOString()}).eq('id',req.params.id).select('id').maybeSingle();if(r.error)throw r.error;if(!r.data)return fail(res,404,'Broadcast session not found.');res.json({updated:true,recordingStatus:status});}
    catch(e){console.error('Recording status update failed:',e.message);fail(res,503,'Could not update recording status.');}
  });
  app.post('/api/admin/broadcast/sessions/:id/end',requireStorage,requireAdmin,async function(req,res){
    try{
      const existing=await db().from('broadcast_sessions').select('id,room_name,status,ended_at').eq('id',req.params.id).maybeSingle();
      if(existing.error)throw existing.error;
      if(!existing.data)return fail(res,404,'Broadcast session not found.');
      const endedAt=existing.data.ended_at||new Date().toISOString();
      const saved=await db().from('broadcast_sessions').update({status:'ended',ended_at:endedAt,updated_at:new Date().toISOString()}).eq('id',req.params.id).select('*').single();
      if(saved.error)throw saved.error;
      res.set('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');
      let roomTerminated=false,roomTerminationError=null;
      try{roomTerminated=await terminateLiveKitRoom(existing.data.room_name);}
      catch(roomError){roomTerminationError=roomError.message;console.error('LiveKit room termination failed after broadcast status closed:',roomError.message);}
      res.json({session:saved.data,ended:true,roomTerminated:roomTerminated,roomTerminationError:roomTerminationError});
    }catch(e){console.error('Broadcast end failed:',e.message);fail(res,503,'Could not confirm that the broadcast ended. Please retry End Service.');}
  });
};
