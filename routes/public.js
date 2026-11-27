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
      publicProfile:member.publicProfile===true,status:member.status,roles:Array.isArray(member.roles)?member.roles:[],joinedAt:member.joinedAt};
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
      const people=await Promise.all(members.filter(function(m){return m&&m.status==='approved'&&m.publicProfile===true;}).map(async function(m){
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
      if(body.publicProfile!==undefined)member.publicProfile=body.publicProfile===true;
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
};
