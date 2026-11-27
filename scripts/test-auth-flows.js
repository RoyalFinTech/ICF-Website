'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const registerAuthRoutes = require('../routes/auth');

const routes = Object.create(null);
const app = {};
['get','post'].forEach(function (method) {
  app[method] = function (path) {
    const handlers = Array.prototype.slice.call(arguments,1);
    routes[method.toUpperCase()+' '+path] = handlers[handlers.length-1];
  };
});
const passthrough = function (_req,_res,next) { if (next) next(); };
const state = {
  signUpCalls:[],
  signupOverride:null,
  createUserCalls:[],
  createUserOverride:null,
  signInError:null,
  signInResult:null,
  resetCalls:[],
  resendCalls:[],
  sessions:[],
  updates:[],
  members:[],
  turnstileResponse:{success:true,action:'icf_member_signup',hostname:'icf-website.onrender.com'}
};
const auth = { auth:{
  signUp:async function (input) {
    state.signUpCalls.push(input);
    if(state.signupOverride)return state.signupOverride;
    return {data:{user:{id:'auth-user-test',identities:[{id:'identity'}]},session:null},error:null};
  },
  signInWithPassword:async function () { return state.signInResult || {data:null,error:state.signInError}; },
  resetPasswordForEmail:async function (email,options) {
    state.resetCalls.push({email:email,options:options});
    return {data:{},error:null};
  },
  resend:async function (input) {
    state.resendCalls.push(input);
    return {data:{},error:{code:'user_not_found'}};
  },
  setSession:async function (session) {
    state.sessions.push(session);
    return {data:{session:{user:{id:'reset-user'}}},error:null};
  },
  updateUser:async function (input) {
    state.updates.push(input);
    return {data:{user:{id:'reset-user'}},error:null};
  }
}};
registerAuthRoutes(app,{
  loginLimit:passthrough,publicLimit:passthrough,signupLimit:passthrough,
  recoveryLimit:passthrough,resendLimit:passthrough,requireStorage:passthrough,
  authClient:function(){return auth;},
  db:function(){return {
    auth:{admin:{
      createUser:async function(input){
        state.createUserCalls.push(input);
        if(state.createUserOverride)return state.createUserOverride;
        return {data:{user:{id:'auth-admin-created-'+state.createUserCalls.length,email:input.email}},error:null};
      },
      deleteUser:async function(){return {error:null};}
    }},
    from:function(){
      let authUserId='';
      const query={
        select:function(){return this;},
        eq:function(){return this;},
        contains:function(_column,filter){authUserId=filter.authUserId;return this;},
        maybeSingle:async function(){
          const match=state.members.find(function(entry){return entry.record.authUserId===authUserId;});
          return {data:match?{data:match.record}:null,error:null};
        },
        upsert:async function(payload){
          const match=state.members.find(function(entry){return entry.record.id===payload.record_id;});
          if(match)match.record=payload.data;
          return {error:null};
        }
      };
      return query;
    }
  };},
  fail:function(res,status,error){return res.status(status).json({error:error});},
  insertRecord:async function(collection,record){state.members.push({collection:collection,record:record});},
  crypto:crypto
});

function response() {
  return {
    statusCode:200,body:null,headers:{},
    status:function(code){this.statusCode=code;return this;},
    set:function(key,value){this.headers[key]=value;return this;},
    json:function(value){this.body=value;return this;}
  };
}
async function call(method,path,body) {
  const handler=routes[method+' '+path];
  assert.equal(typeof handler,'function','route registered: '+method+' '+path);
  const res=response();
  await handler({body:body||{},ip:'203.0.113.10'},res);
  return res;
}
function signupBody(overrides) {
  return Object.assign({
    name:'ICF Test Member',email:'icf-test-member@example.com',password:'A-long-test-password-2026',
    phone:'9551234',address:'Mariama Kunda, The Gambia',nationalityCode:'GM',dialCode:'+220',
    companyWebsite:'',captchaToken:''
  },overrides||{});
}

(async function main(){
  const originalEnv={
    site:process.env.TURNSTILE_SITE_KEY,secret:process.env.TURNSTILE_SECRET_KEY,publicUrl:process.env.PUBLIC_SITE_URL,
    emailVerification:process.env.ICF_EMAIL_VERIFICATION_REQUIRED,passwordRecovery:process.env.ICF_PASSWORD_RECOVERY_ENABLED
  };
  const originalFetch=global.fetch;
  try {
    delete process.env.TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.ICF_EMAIL_VERIFICATION_REQUIRED;
    delete process.env.ICF_PASSWORD_RECOVERY_ENABLED;
    process.env.PUBLIC_SITE_URL='https://icf-website.onrender.com';

    const config=await call('GET','/api/public/auth-config');
    assert.equal(config.body.turnstileEnabled,false,'Turnstile is optional until real keys are configured');
    assert.equal(config.body.emailVerificationRequired,false,'email verification stays deferred until delivery is configured');
    assert.equal(config.body.passwordRecoveryEnabled,false,'password recovery stays disabled until delivery is configured');

    const botCount=state.createUserCalls.length;
    const bot=await call('POST','/api/public/member-signup',signupBody({companyWebsite:'filled-by-bot'}));
    assert.equal(bot.statusCode,201,'honeypot response stays non-descriptive');
    assert.equal(state.createUserCalls.length,botCount,'honeypot does not create an Auth user');

    const created=await call('POST','/api/public/member-signup',signupBody());
    assert.equal(created.statusCode,201);
    assert.equal(created.body.emailConfirmationRequired,false);
    assert.equal(created.body.emailVerificationPending,true);
    assert.equal(created.body.membershipStatus,'pending');
    assert.match(created.body.message,/saved as Pending/i);
    assert.match(created.body.message,/Email verification is not enabled yet/i);
    const stored=state.members[state.members.length-1].record;
    assert.equal(stored.nationality,'The Gambia');
    assert.equal(stored.nationalityCode,'GM');
    assert.equal(stored.status,'pending');
    assert.equal(stored.emailVerified,false);
    assert.equal(stored.emailVerificationStatus,'not_verified_email_delivery_pending');
    assert.equal(state.createUserCalls[state.createUserCalls.length-1].email_confirm,true);
    assert.equal(state.createUserCalls[state.createUserCalls.length-1].user_metadata.icf_email_verification_status,'pending');
    assert.equal(state.signUpCalls.length,0,'email-independent signup must not invoke the email-sending signup endpoint');

    // An application must reach the administrator as Pending and remain blocked at login.
    state.signInResult={data:{user:{id:stored.authUserId,email:stored.email,email_confirmed_at:null},session:{access_token:'member-test-token',expires_at:2000000000}},error:null};
    const pendingLogin=await call('POST','/api/auth/member-login',{email:stored.email,password:'A-long-test-password-2026'});
    assert.equal(pendingLogin.statusCode,403);
    assert.match(pendingLogin.body.error,/awaiting church approval/i);
    stored.status='approved';
    const approvedLogin=await call('POST','/api/auth/member-login',{email:stored.email,password:'A-long-test-password-2026'});
    assert.equal(approvedLogin.statusCode,200);
    assert.equal(approvedLogin.body.user.role,'member');
    assert.equal(approvedLogin.body.user.emailVerified,false);
    stored.status='suspended';
    const suspendedLogin=await call('POST','/api/auth/member-login',{email:stored.email,password:'A-long-test-password-2026'});
    assert.equal(suspendedLogin.statusCode,403);
    assert.match(suspendedLogin.body.error,/suspended/i);
    stored.status='pending';
    state.signInResult=null;

    state.createUserOverride={data:null,error:{code:'email_exists',message:'User already registered'}};
    const duplicate=await call('POST','/api/public/member-signup',signupBody());
    assert.equal(duplicate.statusCode,400);
    assert.match(duplicate.body.error,/check your details or contact the church office/i);
    assert.doesNotMatch(duplicate.body.error,/already registered|email exists|account exists/i);
    state.createUserOverride=null;

    const disabledReset=await call('POST','/api/auth/password-reset-request',{email:'unknown@example.com'});
    assert.equal(disabledReset.statusCode,503,'password recovery stays unavailable while email delivery is not configured');
    assert.equal(state.resetCalls.length,0,'disabled recovery does not contact Supabase');

    const disabledResend=await call('POST','/api/auth/resend-confirmation',{email:'unknown@example.com'});
    assert.equal(disabledResend.statusCode,503,'email confirmation resend stays unavailable until enabled');
    assert.equal(state.resendCalls.length,0,'disabled confirmation does not contact Supabase');

    process.env.ICF_PASSWORD_RECOVERY_ENABLED='true';
    const reset=await call('POST','/api/auth/password-reset-request',{email:'unknown@example.com'});
    assert.equal(reset.statusCode,200);
    assert.match(reset.body.message,/If an account exists/i);
    assert.equal(state.resetCalls[0].options.redirectTo,'https://icf-website.onrender.com');

    process.env.ICF_EMAIL_VERIFICATION_REQUIRED='true';
    const resend=await call('POST','/api/auth/resend-confirmation',{email:'unknown@example.com'});
    assert.equal(resend.statusCode,200,'resend remains generic when future email verification is enabled');
    assert.match(resend.body.message,/If this account still needs email confirmation/i);

    const futureEmailSignup=await call('POST','/api/public/member-signup',signupBody({email:'future-email@example.com'}));
    assert.equal(futureEmailSignup.statusCode,201);
    assert.equal(futureEmailSignup.body.emailConfirmationRequired,true,'future mode requests confirmation after delivery is configured');
    assert.equal(futureEmailSignup.body.emailVerificationPending,true);
    assert.equal(state.signUpCalls.length,1,'future mode uses Supabase signup email flow');
    const futureMember=state.members[state.members.length-1].record;
    assert.equal(futureMember.status,'pending');

    // When verification is enabled later, a confirmed Auth identity updates the member's email state.
    state.signInResult={data:{user:{id:futureMember.authUserId,email:futureMember.email,email_confirmed_at:'2026-11-27T00:00:00Z'},session:{access_token:'future-member-token',expires_at:2000000000}},error:null};
    const verifiedPending=await call('POST','/api/auth/member-login',{email:futureMember.email,password:'A-long-test-password-2026'});
    assert.equal(verifiedPending.statusCode,403,'email verification does not bypass the church approval gate');
    assert.equal(futureMember.emailVerified,true);
    assert.equal(futureMember.emailVerificationStatus,'verified');
    futureMember.status='approved';
    const verifiedApproved=await call('POST','/api/auth/member-login',{email:futureMember.email,password:'A-long-test-password-2026'});
    assert.equal(verifiedApproved.statusCode,200);
    assert.equal(verifiedApproved.body.user.emailVerified,true);
    state.signInResult=null;

    const completed=await call('POST','/api/auth/password-reset-complete',{
      accessToken:'a'.repeat(40),refreshToken:'r'.repeat(40),password:'Another-long-password-2026'
    });
    assert.equal(completed.statusCode,200);
    assert.equal(state.sessions.length,1);
    assert.equal(state.updates[0].password,'Another-long-password-2026');

    const invalidComplete=await call('POST','/api/auth/password-reset-complete',{accessToken:'short',refreshToken:'short',password:'too-short'});
    assert.equal(invalidComplete.statusCode,400);

    state.signInError={message:'Email not confirmed'};
    const unconfirmed=await call('POST','/api/auth/member-login',{email:'icf-test-member@example.com',password:'test-password'});
    assert.equal(unconfirmed.statusCode,403);
    assert.match(unconfirmed.body.error,/confirm your email/i);

    delete process.env.ICF_EMAIL_VERIFICATION_REQUIRED;
    process.env.TURNSTILE_SITE_KEY='test-site-key';
    process.env.TURNSTILE_SECRET_KEY='test-secret-key';
    global.fetch=async function(){
      return {ok:true,json:async function(){return state.turnstileResponse;}};
    };
    const beforeProtected=state.createUserCalls.length;
    const protectedSignup=await call('POST','/api/public/member-signup',signupBody({captchaToken:'test-turnstile-token'}));
    assert.equal(protectedSignup.statusCode,201,'valid Turnstile action and hostname permit signup');
    assert.equal(state.createUserCalls.length,beforeProtected+1,'valid CAPTCHA permits the server-side Auth creation path');

    const beforeInvalid=state.createUserCalls.length;
    state.turnstileResponse={success:true,action:'wrong_action',hostname:'icf-website.onrender.com'};
    const rejected=await call('POST','/api/public/member-signup',signupBody({captchaToken:'invalid-action-token'}));
    assert.equal(rejected.statusCode,400,'Turnstile action mismatch is rejected');
    assert.equal(state.createUserCalls.length,beforeInvalid,'invalid CAPTCHA does not create an Auth user');

    process.stdout.write('Auth flow tests passed: email-independent applications, deferred email verification, pending approval, feature-gated recovery and Turnstile validation.\\n');
  } finally {
    if(originalEnv.site===undefined)delete process.env.TURNSTILE_SITE_KEY;else process.env.TURNSTILE_SITE_KEY=originalEnv.site;
    if(originalEnv.secret===undefined)delete process.env.TURNSTILE_SECRET_KEY;else process.env.TURNSTILE_SECRET_KEY=originalEnv.secret;
    if(originalEnv.publicUrl===undefined)delete process.env.PUBLIC_SITE_URL;else process.env.PUBLIC_SITE_URL=originalEnv.publicUrl;
    if(originalEnv.emailVerification===undefined)delete process.env.ICF_EMAIL_VERIFICATION_REQUIRED;else process.env.ICF_EMAIL_VERIFICATION_REQUIRED=originalEnv.emailVerification;
    if(originalEnv.passwordRecovery===undefined)delete process.env.ICF_PASSWORD_RECOVERY_ENABLED;else process.env.ICF_PASSWORD_RECOVERY_ENABLED=originalEnv.passwordRecovery;
    global.fetch=originalFetch;
  }
})().catch(function(error){
  process.stderr.write((error&&error.stack)||String(error));
  process.exitCode=1;
});
