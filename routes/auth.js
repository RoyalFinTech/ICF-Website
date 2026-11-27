'use strict';

const countryData = require('../js/country-data');

function publicSiteUrl() {
  const fallback = 'https://icf-website.onrender.com';
  const candidate = String(process.env.PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || fallback).trim();
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return fallback;
    return parsed.origin;
  } catch (_) { return fallback; }
}
function turnstileConfiguration() {
  const siteKey = String(process.env.TURNSTILE_SITE_KEY || '').trim();
  const secretKey = String(process.env.TURNSTILE_SECRET_KEY || '').trim();
  return { siteKey:siteKey, secretKey:secretKey, enabled:Boolean(siteKey && secretKey), incomplete:Boolean(siteKey) !== Boolean(secretKey) };
}
function emailFeatureConfiguration() {
  return {
    verificationRequired:String(process.env.ICF_EMAIL_VERIFICATION_REQUIRED || '').toLowerCase() === 'true',
    passwordRecoveryEnabled:String(process.env.ICF_PASSWORD_RECOVERY_ENABLED || '').toLowerCase() === 'true'
  };
}
async function verifyTurnstile(token) {
  const config = turnstileConfiguration();
  if (config.incomplete) return { ok:false, configurationError:true };
  if (!config.enabled) return { ok:true, disabled:true };
  const value = String(token || '');
  if (!value || value.length > 2048) return { ok:false };
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret:config.secretKey,response:value}),
      signal:AbortSignal.timeout(8000)
    });
    if (!response.ok) return { ok:false, unavailable:true };
    const result = await response.json();
    const expectedHost = new URL(publicSiteUrl()).hostname.toLowerCase();
    return { ok:Boolean(result.success && result.action === 'icf_member_signup' &&
      String(result.hostname || '').toLowerCase() === expectedHost) };
  } catch (_) { return { ok:false, unavailable:true }; }
}


module.exports = function registerAuthRoutes(app, deps) {
  const { loginLimit, publicLimit, signupLimit, recoveryLimit, resendLimit, requireStorage, authClient, db, fail, insertRecord, crypto } = deps;

  app.get('/api/public/auth-config',function(req,res){
    const captcha = turnstileConfiguration();
    const emailFeatures = emailFeatureConfiguration();
    res.set('Cache-Control','no-store');
    res.json({
      turnstileEnabled:captcha.enabled,
      turnstileSiteKey:captcha.enabled?captcha.siteKey:'',
      captchaConfigurationIncomplete:captcha.incomplete,
      emailVerificationRequired:emailFeatures.verificationRequired,
      passwordRecoveryEnabled:emailFeatures.passwordRecoveryEnabled
    });
  });

  app.post('/api/auth/password-reset-request',recoveryLimit||loginLimit,requireStorage,async function(req,res){
    if (!emailFeatureConfiguration().passwordRecoveryEnabled) return fail(res,503,'Password recovery is not available yet. Please contact the church office for assistance.');
    try {
      const email = String((req.body||{}).email||'').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return fail(res,400,'Enter a valid email address.');
      const result = await authClient().auth.resetPasswordForEmail(email,{redirectTo:publicSiteUrl()});
      if (result.error) throw result.error;
      res.set('Cache-Control','no-store');
      res.json({message:'If an account exists for this address, a password reset link will be sent. Check your inbox and spam folder.'});
    } catch(error) {
      console.error('Password reset request failed:',error.code||error.status||'AUTH_ERROR');
      fail(res,503,'We could not send a reset link right now. Please try again later.');
    }
  });

  app.post('/api/auth/password-reset-complete',recoveryLimit||loginLimit,requireStorage,async function(req,res){
    if (!emailFeatureConfiguration().passwordRecoveryEnabled) return fail(res,503,'Password recovery is not available yet. Please contact the church office for assistance.');
    try {
      const body = req.body||{};
      const accessToken = String(body.accessToken||'').trim();
      const refreshToken = String(body.refreshToken||'').trim();
      const password = String(body.password||'');
      if (accessToken.length < 20 || accessToken.length > 8192 || refreshToken.length < 10 || refreshToken.length > 8192)
        return fail(res,400,'This reset link is invalid or has expired. Request a new password reset link.');
      if (password.length < 12 || password.length > 200)
        return fail(res,400,'Your new password must contain at least 12 characters.');
      const auth = authClient();
      const session = await auth.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
      if (session.error || !session.data || !session.data.session)
        return fail(res,400,'This reset link is invalid or has expired. Request a new password reset link.');
      const updated = await auth.auth.updateUser({password:password});
      if (updated.error) {
        console.warn('Password reset completion rejected:',updated.error.code||updated.error.status||'AUTH_ERROR');
        return fail(res,400,'The new password could not be saved. Check the password requirements and request a new link if needed.');
      }
      res.set('Cache-Control','no-store');
      res.json({message:'Your password has been updated. You can now sign in.'});
    } catch(error) {
      console.error('Password reset completion failed:',error.code||error.status||'AUTH_ERROR');
      fail(res,503,'We could not update your password. Request a new reset link and try again.');
    }
  });

  app.post('/api/auth/resend-confirmation',resendLimit||loginLimit,requireStorage,async function(req,res){
    if (!emailFeatureConfiguration().verificationRequired) return fail(res,503,'Email verification is not enabled yet. Your membership application can still be submitted for church review.');
    try {
      const email = String((req.body||{}).email||'').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return fail(res,400,'Enter a valid email address.');
      const result = await authClient().auth.resend({type:'signup',email:email,options:{emailRedirectTo:publicSiteUrl()}});
      if (result.error) console.warn('Confirmation resend was not completed:',result.error.code||result.error.status||'AUTH_ERROR');
      res.set('Cache-Control','no-store');
      res.json({message:'If this account still needs email confirmation, a new confirmation link will be sent.'});
    } catch(error) {
      console.warn('Confirmation resend failed:',error.code||error.status||'AUTH_ERROR');
      res.json({message:'If this account still needs email confirmation, a new confirmation link will be sent.'});
    }
  });



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
      if (result.error || !result.data || !result.data.session || !result.data.user) {
        if (result.error && /email not confirmed/i.test(String(result.error.message||''))) return fail(res,403,'Please confirm your email address using the link we sent before signing in.');
        return fail(res,401,'Sign-in failed. Check your email and password.');
      }
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
        token_type:'bearer', user:{ id:member.id, name:member.name, email:member.email, role:'member', status:member.status,
          emailVerified:member.emailVerified===true, emailVerificationStatus:member.emailVerificationStatus||'unknown' } });
    } catch (error) {
      console.error('Member login failed:',error.message);
      fail(res,503,'Member sign-in is temporarily unavailable.');
    }
  });
  app.post('/api/public/member-signup', signupLimit||publicLimit, requireStorage, async function (req,res) {
    try {
      const body = req.body || {};
      const websiteTrap = String(body.companyWebsite||'').trim();
      if (websiteTrap) return res.status(201).json({message:'Your application has been received. Follow the next steps sent to your email.'});
      const captchaConfig = turnstileConfiguration();
      if (captchaConfig.incomplete) return fail(res,503,'The registration security check is not fully configured. Please try again later.');
      if (captchaConfig.enabled) {
        const captcha = await verifyTurnstile(body.captchaToken);
        if (captcha.configurationError) return fail(res,503,'The registration security check is not fully configured.');
        if (captcha.unavailable) return fail(res,503,'The security check is temporarily unavailable. Refresh the page and try again.');
        if (!captcha.ok) return fail(res,400,'Please complete the security check and try again.');
      }
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
      const emailFeatures = emailFeatureConfiguration();
      const genericSignupFailure='We could not complete registration. Check your details or contact the church office if you need assistance.';
      let authUser = null;
      let signupSession = null;
      let emailConfirmationRequired = false;
      let emailVerified = false;

      if (emailFeatures.verificationRequired) {
        // Future mode: only enable after the church has configured and tested
        // its transactional email provider and Supabase confirmation templates.
        const signupOptions = {data:{full_name:name,church:'ICF Gambia'},emailRedirectTo:publicSiteUrl()};
        if (captchaConfig.enabled) signupOptions.captchaToken=String(body.captchaToken||'');
        const signup = await authClient().auth.signUp({email:email,password:password,options:signupOptions});
        if (signup.error || !signup.data || !signup.data.user ||
            (Array.isArray(signup.data.user.identities) && signup.data.user.identities.length === 0)) {
          console.warn('Member signup Auth request rejected:',signup.error && (signup.error.code||signup.error.status)||'AUTH_ERROR');
          return fail(res,400,genericSignupFailure);
        }
        authUser = signup.data.user;
        signupSession = signup.data.session || null;
        emailVerified = Boolean(authUser.email_confirmed_at || signupSession);
        emailConfirmationRequired = !emailVerified;
      } else {
        // Email delivery is not configured yet. Create the Auth identity on the
        // server without sending email; the app's own emailVerified flag remains
        // false. Membership approval is still required before member-area access.
        const created = await db().auth.admin.createUser({
          email:email,
          password:password,
          email_confirm:true,
          user_metadata:{full_name:name,church:'ICF Gambia',icf_email_verification_status:'pending'}
        });
        if (created.error || !created.data || !created.data.user) {
          console.warn('Member Auth identity creation rejected:',created.error && (created.error.code||created.error.status)||'AUTH_ERROR');
          return fail(res,400,genericSignupFailure);
        }
        authUser = created.data.user;
      }

      const member = {
        id:crypto.randomUUID(), authUserId:authUser.id, name:name.slice(0,120), email:email.slice(0,254),
        phone:(dialCode + ' ' + phone).trim().slice(0,50), phoneRaw:phone.slice(0,40),
        dialCode:dialCode, address:address.slice(0,500),
        nationality:country.name, nationalityCode:country.code,
        emailVerified:emailVerified,
        emailVerificationStatus:emailVerified?'verified':(emailFeatures.verificationRequired?'pending':'not_verified_email_delivery_pending'),
        role:'member', roles:[], publicProfileConsent:false, directoryVisible:false, bio:'', avatarUrl:'', status:'pending', joinedAt:new Date().toISOString()
      };
      try {
        await insertRecord('members',member);
      } catch (insertError) {
        // Do not leave an Auth identity behind without its matching pending member record.
        try {
          const cleanup = await db().auth.admin.deleteUser(authUser.id);
          if (cleanup.error) console.error('Orphan signup identity cleanup failed:',cleanup.error.message);
        } catch (cleanupError) {
          console.error('Orphan signup identity cleanup failed:',cleanupError.message);
        }
        throw insertError;
      }
      res.set('Cache-Control','no-store');
      res.status(201).json({
        membershipStatus:'pending',
        emailConfirmationRequired:emailConfirmationRequired,
        emailVerificationPending:!emailVerified,
        message:emailFeatures.verificationRequired
          ? (emailConfirmationRequired
            ? 'Your application has been saved as Pending. Please confirm your email using the link we sent. The church administration will review your membership.'
            : 'Your application has been saved as Pending. The church administration must approve your membership before you can sign in.')
          : 'Your application has been saved as Pending. Email verification is not enabled yet because email delivery has not been configured. The church administration will review your application. Keep your password safe; password recovery is coming later. You can sign in after your membership is approved.'
      });
    } catch (error) {
      console.error('Member signup failed:',error.message);
      fail(res,503,'Registration is temporarily unavailable. Please try again later.');
    }
  });
};
