'use strict';

const countryData = require('../js/country-data');

module.exports = function registerAuthRoutes(app, deps) {
  const { loginLimit, publicLimit, requireStorage, authClient, db, fail, insertRecord, crypto } = deps;

  app.post('/api/auth/login', loginLimit, requireStorage, async function (req,res) {
    try {
      const email = String((req.body || {}).email || '').trim().toLowerCase();
      const password = String((req.body || {}).password || '');
      if (!email || !password || password.length > 200) return fail(res,400,'Enter your administrator email and password.');
      const result = await authClient().auth.signInWithPassword({ email:email, password:password });
      if (result.error || !result.data || !result.data.session || !result.data.user) return fail(res,401,'Sign-in failed. Check your email and password.');
      const role = await db().from('admin_users').select('role,display_name').eq('user_id',result.data.user.id).maybeSingle();
      if (role.error) throw role.error;
      if (!role.data) return fail(res,403,'This account has not been granted administrator access.');
      res.json({ access_token:result.data.session.access_token, expires_at:result.data.session.expires_at,
        user:{ id:result.data.user.id, email:result.data.user.email, name:role.data.display_name || result.data.user.email, role:role.data.role } });
    } catch (error) {
      console.error('Admin login failed:',error.message);
      fail(res,503,'Sign-in is unavailable. Check the Supabase setup and try again.');
    }
  });
  app.post('/api/auth/member-login', loginLimit, requireStorage, async function (req,res) {
    try {
      const email = String((req.body || {}).email || '').trim().toLowerCase();
      const password = String((req.body || {}).password || '');
      if (!email || !password) return fail(res,400,'Enter your email and password.');
      const result = await authClient().auth.signInWithPassword({ email:email, password:password });
      if (result.error || !result.data || !result.data.session || !result.data.user) return fail(res,401,'Sign-in failed. Check your email and password.');
      const memberResult = await db().from('app_records').select('data')
        .eq('collection','members').contains('data',{authUserId:result.data.user.id}).maybeSingle();
      if (memberResult.error) throw memberResult.error;
      const member = memberResult.data && memberResult.data.data;
      if (!member) return fail(res,403,'No membership application is linked to this account.');
      if (member.status === 'pending') return fail(res,403,'Your membership application is awaiting church approval.');
      if (member.status === 'suspended') return fail(res,403,'This account is suspended. Please contact the church office.');
      if (member.status !== 'approved') return fail(res,403,'Your membership is not yet approved. Please contact the church office if you need help.');
      res.set('Cache-Control','no-store');
      res.json({ access_token:result.data.session.access_token, expires_at:result.data.session.expires_at,
        token_type:'bearer', user:{ id:member.id, name:member.name, email:member.email, role:'member', status:member.status } });
    } catch (error) {
      console.error('Member login failed:',error.message);
      fail(res,503,'Member sign-in is temporarily unavailable.');
    }
  });
  app.post('/api/public/member-signup', publicLimit, requireStorage, async function (req,res) {
    try {
      const body = req.body || {};
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const phone = String(body.phone || '').trim();
      const address = String(body.address || '').trim();
      const nationalityCode = String(body.nationalityCode || '').trim().toUpperCase();
      const country = countryData.getCountry(nationalityCode);
      const dialCode = String(body.dialCode || '').trim();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 200 || phone.length < 6 || address.length < 3) {
        return fail(res,400,'Provide your name, a valid email, phone number, address, and a password of at least 12 characters.');
      }
      if (!country) return fail(res,400,'Select a valid nationality from the country list.');
      if (!/^\+\d{1,4}$/.test(dialCode)) return fail(res,400,'Select a valid phone country code.');
      const auth = authClient();
      const signup = await auth.auth.signUp({ email:email, password:password, options:{ data:{ full_name:name, church:'ICF Gambia' } } });
      if (signup.error || !signup.data || !signup.data.user) return fail(res,400,signup.error ? signup.error.message : 'Could not create your account.');
      if (Array.isArray(signup.data.user.identities) && signup.data.user.identities.length === 0) return fail(res,409,'An account with this email may already exist.');
      const member = {
        id:crypto.randomUUID(), authUserId:signup.data.user.id, name:name.slice(0,120), email:email.slice(0,254),
        phone:(dialCode + ' ' + phone).trim().slice(0,50), phoneRaw:phone.slice(0,40),
        dialCode:dialCode, address:address.slice(0,500),
        nationality:country.name, nationalityCode:country.code,
        role:'member', roles:[], publicProfileConsent:false, directoryVisible:false, bio:'', avatarUrl:'', status:'pending', joinedAt:new Date().toISOString()
      };
      try {
        await insertRecord('members',member);
      } catch (insertError) {
        // Do not leave an Auth identity behind without its matching pending member record.
        try {
          const cleanup = await db().auth.admin.deleteUser(signup.data.user.id);
          if (cleanup.error) console.error('Orphan signup identity cleanup failed:',cleanup.error.message);
        } catch (cleanupError) {
          console.error('Orphan signup identity cleanup failed:',cleanupError.message);
        }
        throw insertError;
      }
      res.status(201).json({ message:signup.data.session ? 'Registration received. Your membership is pending approval.' : 'Registration received. Check your email if confirmation is enabled. Your membership is pending approval.' });
    } catch (error) {
      console.error('Member signup failed:',error.message);
      fail(res,503,'Registration is temporarily unavailable. Please try again later.');
    }
  });
};
