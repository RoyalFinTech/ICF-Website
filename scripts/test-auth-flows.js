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
  signInError:null,
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
    return {data:{user:{id:'auth-user-test',identities:[{id:'identity'}]},session:null},error:null};
  },
  signInWithPassword:async function () { return {data:null,error:state.signInError}; },
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
  db:function(){return {auth:{admin:{deleteUser:async function(){return {error:null};}}}};},
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
    site:process.env.TURNSTILE_SITE_KEY,secret:process.env.TURNSTILE_SECRET_KEY,publicUrl:process.env.PUBLIC_SITE_URL
  };
  const originalFetch=global.fetch;
  try {
    delete process.env.TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
    process.env.PUBLIC_SITE_URL='https://icf-website.onrender.com';

    const config=await call('GET','/api/public/auth-config');
    assert.equal(config.body.turnstileEnabled,false,'Turnstile is optional until real keys are configured');

    const botCount=state.signUpCalls.length;
    const bot=await call('POST','/api/public/member-signup',signupBody({companyWebsite:'filled-by-bot'}));
    assert.equal(bot.statusCode,201,'honeypot response stays non-descriptive');
    assert.equal(state.signUpCalls.length,botCount,'honeypot does not create an Auth user');

    const created=await call('POST','/api/public/member-signup',signupBody());
    assert.equal(created.statusCode,201);
    assert.equal(created.body.emailConfirmationRequired,true);
    assert.match(created.body.message,/confirm your email/i);
    const stored=state.members[state.members.length-1].record;
    assert.equal(stored.nationality,'The Gambia');
    assert.equal(stored.nationalityCode,'GM');
    assert.equal(stored.status,'pending');
    assert.equal(state.signUpCalls[state.signUpCalls.length-1].options.emailRedirectTo,'https://icf-website.onrender.com');
    
    const reset=await call('POST','/api/auth/password-reset-request',{email:'unknown@example.com'});
    assert.equal(reset.statusCode,200);
    assert.match(reset.body.message,/If an account exists/i);
    assert.equal(state.resetCalls[0].options.redirectTo,'https://icf-website.onrender.com');

    const resend=await call('POST','/api/auth/resend-confirmation',{email:'unknown@example.com'});
    assert.equal(resend.statusCode,200,'resend deliberately does not reveal whether the address exists');
    assert.match(resend.body.message,/If this account still needs email confirmation/i);

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

    process.env.TURNSTILE_SITE_KEY='test-site-key';
    process.env.TURNSTILE_SECRET_KEY='test-secret-key';
    global.fetch=async function(){
      return {ok:true,json:async function(){return state.turnstileResponse;}};
    };
    const protectedSignup=await call('POST','/api/public/member-signup',signupBody({captchaToken:'test-turnstile-token'}));
    assert.equal(protectedSignup.statusCode,201,'valid Turnstile action and hostname permit signup');
    assert.equal(state.signUpCalls[state.signUpCalls.length-1].options.captchaToken,'test-turnstile-token');

    const beforeInvalid=state.signUpCalls.length;
    state.turnstileResponse={success:true,action:'wrong_action',hostname:'icf-website.onrender.com'};
    const rejected=await call('POST','/api/public/member-signup',signupBody({captchaToken:'invalid-action-token'}));
    assert.equal(rejected.statusCode,400,'Turnstile action mismatch is rejected');
    assert.equal(state.signUpCalls.length,beforeInvalid,'invalid CAPTCHA does not create an Auth user');

    process.stdout.write('Auth flow tests passed: recovery, resend, email-confirmation messaging, honeypot and Turnstile validation.\n');
  } finally {
    if(originalEnv.site===undefined)delete process.env.TURNSTILE_SITE_KEY;else process.env.TURNSTILE_SITE_KEY=originalEnv.site;
    if(originalEnv.secret===undefined)delete process.env.TURNSTILE_SECRET_KEY;else process.env.TURNSTILE_SECRET_KEY=originalEnv.secret;
    if(originalEnv.publicUrl===undefined)delete process.env.PUBLIC_SITE_URL;else process.env.PUBLIC_SITE_URL=originalEnv.publicUrl;
    global.fetch=originalFetch;
  }
})().catch(function(error){
  process.stderr.write((error&&error.stack)||String(error));
  process.exitCode=1;
});
