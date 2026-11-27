'use strict';

module.exports = function registerPublicRoutes(app, deps) {
  const { requireStorage, fail, PUBLIC_COLLECTIONS, readCollection, PUBLIC_SUBMISSIONS, publicLimit, publicRecord, insertRecord, authClient, db, multer, crypto, PRIVATE_BUCKET } = deps;
  function getBearer(req) {
    const header = req.headers.authorization || '';
    return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  }
  async function memberIdentity(req) {
    const token = getBearer(req);
    if (!token) return { error:'Please sign in to manage your profile.', status:401 };
    const checked = await authClient().auth.getUser(token);
    if (checked.error || !checked.data || !checked.data.user) return { error:'Your member session has expired. Please sign in again.', status:401 };
    const result = await db().from('app_records').select('record_id,data').eq('collection','members');
    if (result.error) throw result.error;
    const row = (result.data || []).find(function(entry){return entry.data && entry.data.authUserId===checked.data.user.id;});
    if (!row) return { error:'No membership profile is linked to this account.', status:404 };
    if (row.data.status==='pending') return { error:'Your membership is awaiting approval.', status:403 };
    if (row.data.status==='suspended') return { error:'Your membership is suspended. Contact the church office.', status:403 };
    return { user:checked.data.user, member:row.data };
  }
  async function saveMember(member) {
    const result = await db().from('app_records').upsert({collection:'members',record_id:member.id,data:member,updated_at:new Date().toISOString()},{onConflict:'collection,record_id'});
    if (result.error) throw result.error;
    return member;
  }
  async function signedAvatarUrl(member) {
    if (!member.avatarPath) return member.avatarUrl || '';
    const result = await db().storage.from(PRIVATE_BUCKET).createSignedUrl(member.avatarPath, 3600);
    if (result.error) { console.error('Member avatar signing failed:',result.error.message); return ''; }
    return result.data.signedUrl;
  }
  async function profileView(member) {
    return {id:member.id,name:member.name,email:member.email,phone:member.phone,address:member.address,
      nationality:member.nationality,bio:member.bio||'',avatarUrl:await signedAvatarUrl(member),
      publicProfileConsent:member.publicProfileConsent===true,status:member.status,roles:Array.isArray(member.roles)?member.roles:[],joinedAt:member.joinedAt};
  }
  function imageSignature(buffer,mime) {
    if (!Buffer.isBuffer(buffer)) return false;
    if (mime==='image/jpeg') return buffer.length>3&&buffer[0]===255&&buffer[1]===216&&buffer[2]===255;
    if (mime==='image/png') return buffer.length>8&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    if (mime==='image/webp') return buffer.length>12&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP';
    if (mime==='image/gif') return buffer.toString('ascii',0,6)==='GIF87a'||buffer.toString('ascii',0,6)==='GIF89a';
    return false;
  }
  const avatarUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1},fileFilter:function(req,file,cb){
    if(!/^image\/(jpeg|png|webp)$/i.test(file.mimetype))return cb(new Error('Profile photos must be JPG, PNG, or WEBP images.'));
    cb(null,true);
  }});

  app.get('/api/public-data', requireStorage, async function (req,res) {
    try {
      const data = {};
      // These collections are independent. Read them concurrently so one slow
      // collection does not make the entire public homepage wait in series.
      const entries = await Promise.all(PUBLIC_COLLECTIONS.map(async function (collection) {
        let records = await readCollection(collection);
        if (collection === 'sermons') records = records.filter(function (item) { return item.published !== false; });
        if (collection === 'announcements') records = records.filter(function (item) { return !item.expiry || new Date(item.expiry) >= new Date(); });
        if (collection === 'prayers') records = records.filter(function (item) { return item.status === 'praying' || item.status === 'answered'; }).map(function (item) {
          return { id:item.id, requesterName:item.anonymous ? 'Anonymous' : String(item.requesterName || 'Church member'),
            category:item.category, request:item.request, status:item.status,
            adminNote:item.status === 'answered' ? item.adminNote : '', anonymous:Boolean(item.anonymous), createdAt:item.createdAt };
        });
        if (collection === 'baptisms') records = records.filter(function (item) { return item.status === 'approved'; }).map(function (item) {
          return { id:item.id, fullName:item.fullName, preferredDate:item.preferredDate, status:item.status, createdAt:item.createdAt };
        });
        return [collection, records];
      }));
      entries.forEach(function (entry) { data[entry[0]] = entry[1]; });
      res.json(data);
    } catch (error) {
      console.error('Public data read failed:',error.message);
      fail(res,503,'Could not load church information from Supabase.');
    }
  });

  app.get('/api/public-directory',requireStorage,async function(req,res){
    try {
      const members=await readCollection('members');
      const people=await Promise.all(members.filter(function(m){return m&&m.status==='approved'&&m.publicProfileConsent===true&&m.directoryVisible===true;}).map(async function(m){
        return {id:m.id,name:String(m.name||'ICF Member').slice(0,120),avatarUrl:await signedAvatarUrl(m),bio:String(m.bio||'').slice(0,500),
          roles:Array.isArray(m.roles)?m.roles.filter(function(r){return r&&r.name;}).map(function(r){return {id:String(r.id||''),name:String(r.name).slice(0,100),type:r.type==='office'?'office':'ministry'};}):[]};
      })).then(function(list){return list.filter(function(m){return m.roles.length>0;});});
      res.json({members:people});
    } catch(error){console.error('Public directory read failed:',error.message);fail(res,503,'The church directory is temporarily unavailable.');}
  });
  app.get('/api/member/profile',requireStorage,async function(req,res){
    try{const identity=await memberIdentity(req);if(identity.error)return fail(res,identity.status,identity.error);res.json({member:await profileView(identity.member)});}
    catch(error){console.error('Member profile read failed:',error.message);fail(res,503,'Could not load your member profile.');}
  });
  app.put('/api/member/profile',requireStorage,async function(req,res){
    try{
      const identity=await memberIdentity(req);if(identity.error)return fail(res,identity.status,identity.error);
      const body=req.body||{},member=Object.assign({},identity.member);
      if(body.phone!==undefined){const value=String(body.phone||'').trim();if(value.length<6||value.length>50)return fail(res,400,'Enter a valid phone number.');member.phone=value;}
      if(body.address!==undefined){const value=String(body.address||'').trim();if(value.length<3||value.length>500)return fail(res,400,'Enter a valid address.');member.address=value;}
      if(body.bio!==undefined)member.bio=String(body.bio||'').trim().slice(0,500);
      if(body.publicProfileConsent!==undefined)member.publicProfileConsent=body.publicProfileConsent===true;
      // Membership status, roles, approval and Auth identity are admin-controlled.
      await saveMember(member);res.json({member:await profileView(member)});
    }catch(error){console.error('Member profile update failed:',error.message);fail(res,503,'Could not save your member profile.');}
  });
  app.post('/api/member/avatar',requireStorage,avatarUpload.single('file'),async function(req,res){
    try{
      const identity=await memberIdentity(req);if(identity.error)return fail(res,identity.status,identity.error);
      if(!req.file)return fail(res,400,'Choose a profile photo first.');
      if(!imageSignature(req.file.buffer,req.file.mimetype))return fail(res,400,'The selected file is not a valid image.');
      const ext={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'}[req.file.mimetype];
      const objectPath='member-avatars/'+identity.user.id+'/'+crypto.randomUUID()+ext;
      const storage=db().storage.from(PRIVATE_BUCKET);
      const uploaded=await storage.upload(objectPath,req.file.buffer,{contentType:req.file.mimetype,upsert:false,cacheControl:'3600'});
      if(uploaded.error)throw uploaded.error;
      const member=Object.assign({},identity.member,{avatarPath:objectPath});
      if(identity.member.avatarPath && identity.member.avatarPath!==objectPath) await storage.remove([identity.member.avatarPath]);
      await saveMember(member);res.status(201).json({member:await profileView(member)});
    }catch(error){console.error('Member avatar upload failed:',error.message);fail(res,503,'Profile photo upload failed. Please try again.');}
  });

  app.post('/api/public/:collection', publicLimit, requireStorage, async function (req,res) {
    const collection = req.params.collection;
    if (!PUBLIC_SUBMISSIONS.has(collection)) return fail(res,404,'This submission type is not available.');
    try {
      const record = publicRecord(collection,req.body || {});
      res.status(201).json(await insertRecord(collection,record));
    } catch (error) {
      if (/Please provide|not allowed|JSON object/.test(error.message || '')) return fail(res,400,error.message);
      console.error('Public submission failed:',error.message);
      fail(res,503,'Your submission could not be saved. Please try again later.');
    }
  });

  const kjvBookCache = new Map();
  const kjvBookCodes = new Set(["Gen","Exod","Lev","Num","Deut","Josh","Judg","Ruth","1Sam","2Sam","1Kgs","2Kgs","1Chr","2Chr","Ezra","Neh","Esth","Job","Ps","Prov","Eccl","Song","Isa","Jer","Lam","Ezek","Dan","Hos","Joel","Amos","Obad","Jonah","Mic","Nah","Hab","Zeph","Hag","Zech","Mal","Matt","Mark","Luke","John","Acts","Rom","1Cor","2Cor","Gal","Eph","Phil","Col","1Thess","2Thess","1Tim","2Tim","Titus","Phlm","Heb","Jas","1Pet","2Pet","1John","2John","3John","Jude","Rev"]);
  app.get('/api/public/bible/kjv/:book', async function(req,res){
    const book=String(req.params.book||'');if(!kjvBookCodes.has(book))return fail(res,404,'Unknown KJV Bible book.');
    try{let data=kjvBookCache.get(book);if(!data){const upstream=await fetch('https://raw.githubusercontent.com/midvash/bible-data/main/versions/en/kjv/books/'+book+'.json',{signal:AbortSignal.timeout(15000)});if(!upstream.ok)throw new Error('KJV source returned '+upstream.status);data=await upstream.json();if(data.book!==book||!Array.isArray(data.chapters))throw new Error('KJV source data failed validation');kjvBookCache.set(book,data);}res.set('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');res.json(data);}
    catch(e){console.error('KJV Bible fetch failed for '+book+':',e.message);fail(res,503,'The KJV book could not be loaded right now. Please retry.');}
  });
  app.get('/api/public/live',requireStorage,async function(req,res){
    res.set('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');res.set('Pragma','no-cache');
    try{
      // Resolve the most recently STARTED public service first, regardless of
      // status. Filtering to status='live' before ordering resurrects an older
      // abandoned test session after the newer service has ended.
      let q=db().from('broadcast_sessions')
        .select('id,slug,title,description,logo_url,logo_position,overlay_text,scripture_reference,scripture_text,presentation_config,started_at,status,ended_at')
        .eq('is_public',true).not('started_at','is',null);
      const slug=String(req.query.slug||'').slice(0,40);
      if(slug)q=q.eq('slug',slug);
      const r=await q.order('started_at',{ascending:false}).limit(1).maybeSingle();
      if(r.error)throw r.error;
      if(!r.data||r.data.status!=='live'||r.data.ended_at)return res.status(404).json({live:false});
      res.json({live:true,session:r.data});
    }catch(e){
      console.error('Public live lookup failed:',e.message);
      fail(res,503,'Live broadcast information is temporarily unavailable.');
    }
  });
  app.post('/api/public/live/token',publicLimit,requireStorage,async function(req,res){
    res.set('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');
    try{const slug=String((req.body||{}).slug||'').slice(0,40);if(!slug)return fail(res,400,'A broadcast link is required.');
      const r=await db().from('broadcast_sessions').select('room_name').eq('slug',slug).eq('status','live').eq('is_public',true).maybeSingle();if(r.error)throw r.error;if(!r.data)return fail(res,404,'This ICF broadcast is not live.');
      const key=process.env.LIVEKIT_API_KEY||'',secret=process.env.LIVEKIT_API_SECRET||'';let serverUrl=String(process.env.LIVEKIT_URL||'').trim();if(!serverUrl)return fail(res,503,'The live viewing service is not connected.');if(!/^https?:\/\//i.test(serverUrl)&&!/^wss?:\/\//i.test(serverUrl))serverUrl='wss://'+serverUrl;try{const u=new URL(serverUrl);if(u.protocol==='https:')u.protocol='wss:';else if(u.protocol==='http:')u.protocol='ws:';if(!['wss:','ws:'].includes(u.protocol)||!u.hostname)throw new Error('invalid');u.pathname='';u.search='';u.hash='';serverUrl=u.toString().replace(/\/$/,'');}catch(_){return fail(res,503,'The configured LiveKit server URL is invalid.');}if(!key||!secret||!serverUrl)return fail(res,503,'The live viewing service is not connected.');
      const now=Math.floor(Date.now()/1000),enc=function(v){return Buffer.from(JSON.stringify(v)).toString('base64url');};
      const body=enc({alg:'HS256',typ:'JWT'})+'.'+enc({iss:key,sub:'viewer-'+crypto.randomBytes(8).toString('hex'),name:'ICF Viewer',nbf:now-5,iat:now,exp:now+1800,video:{roomJoin:true,room:r.data.room_name,canPublish:false,canSubscribe:true}});
      res.json({serverUrl:serverUrl,token:body+'.'+crypto.createHmac('sha256',secret).update(body).digest('base64url')});
    }catch(e){console.error('Public viewer token failed:',e.message);fail(res,503,'Could not connect to the live broadcast.');}
  });
};
