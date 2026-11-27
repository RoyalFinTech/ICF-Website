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
      for (const collection of COLLECTIONS) data[collection] = await readCollection(collection);
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
};
