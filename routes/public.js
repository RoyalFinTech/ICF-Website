'use strict';

module.exports = function registerPublicRoutes(app, deps) {
  const { requireStorage, fail, PUBLIC_COLLECTIONS, readCollection, PUBLIC_SUBMISSIONS, publicLimit, publicRecord, insertRecord } = deps;

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
