/* ICF Gambia API bridge. The original layout, real church photos, and PDFs are retained. */
(function () {
  'use strict';
  var API = '/api';
  var TOKEN = 'icf_admin_token';
  var USER = 'icf_admin_user';
  var MEMBER_LOGIN_BUSY = false;
  var MEMBER_SIGNUP_BUSY = false;
  var memberCaptchaToken = '';
  var memberCaptchaWidget = null;
  var captchaEnabled = false;
  var captchaConfigReady = false;
  var captchaConfigFailed = false;
  var captchaSiteKey = '';
  var turnstileScriptLoading = false;
  var passwordRecoveryCredentials = null;
  var collections = ['members','prayers','baptisms','events','sermons','media','announcements','contactMessages','emailHistory','livestream','siteSettings','enabledLangs','churchRoles'];
  var originalGet = DB.get.bind(DB);
  var originalSet = DB.set.bind(DB);
  var originalPush = DB.push.bind(DB);
  var originalRemove = DB.remove.bind(DB);
  var queues = Object.create(null);

  function getToken() { return localStorage.getItem(TOKEN) || ''; }
  function request(url, options, timeoutOverrideMs) {
    options = options || {};
    var headers = Object.assign({}, options.headers || {});
    var formData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (options.body && !formData && typeof options.body !== 'string') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    if (getToken() && !headers.Authorization) headers.Authorization = 'Bearer ' + getToken();
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutMs = typeof timeoutOverrideMs === 'number' ? timeoutOverrideMs : 8000;
    var timeoutId = controller ? window.setTimeout(function () { controller.abort(); }, timeoutMs) : null;
    if (controller && !options.signal) options.signal = controller.signal;
    return fetch(API + url,Object.assign({},options,{headers:headers})).then(function (response) {
      return response.text().then(function (raw) {
        var data = {};
        try { data = raw ? JSON.parse(raw) : {}; } catch (e) { data = { error:raw || 'Request failed.' }; }
        if (!response.ok) { var error = new Error(data.error || 'Request failed (' + response.status + ').'); error.status = response.status; throw error; }
        return data;
      });
    }).finally(function () {
      if (timeoutId) window.clearTimeout(timeoutId);
    });
  }
  function showErrorCard(title,message) {
    var host = document.querySelector('main') || document.getElementById('page-admin-portal') || document.body;
    if (!host) { console.error(message); return; }
    var card = document.createElement('div');
    card.className = 'icf-error-card';
    card.setAttribute('role','alert');
    var copy = document.createElement('div');
    var heading = document.createElement('strong');
    heading.textContent = title || 'Something went wrong';
    var detail = document.createElement('span');
    detail.textContent = message || 'Please try again.';
    copy.appendChild(heading); copy.appendChild(detail);
    var close = document.createElement('button');
    close.type = 'button'; close.className = 'icf-error-dismiss';
    close.setAttribute('aria-label','Dismiss error'); close.textContent = '×';
    close.addEventListener('click',function () { card.remove(); });
    card.appendChild(copy); card.appendChild(close);
    host.insertBefore(card,host.firstChild);
  }
  function showPublicDataFailure(error) {
    var waiting = document.querySelectorAll('main .empty-state .spinner, #admin-content > .spinner');
    waiting.forEach(function (spinner) {
      var state = spinner.closest('.empty-state') || spinner.parentElement;
      if (!state) return;
      state.innerHTML = '<div class="empty-state-emoji">📡</div><h3>Live updates are taking a break</h3><p>The rest of the ICF website is available. Please refresh to try loading this section again.</p>';
    });
    if (waiting.length) {
      showErrorCard('Could not load live church updates','The homepage remains available. Refresh the page to retry the live events, sermons, gallery and announcements.');
    }
    if (error) console.warn('Public church data is unavailable:',error.message || error);
  }

  function notifyError(error) {
    if (error && error.status === 401) { localStorage.removeItem(TOKEN); localStorage.removeItem(USER); }
    var message = error && error.message ? error.message : 'Please try again.';
    if (typeof window.toast === 'function') window.toast('Could not save',message,'error');
    else showErrorCard('Could not save',message);
  }
  function sync(collection, records) {
    if (!getToken() || collections.indexOf(collection) < 0) return Promise.resolve();
    var payload = records;
    if (!Array.isArray(payload)) {
      if ((collection === 'siteSettings' || collection === 'livestream') && payload && typeof payload === 'object') {
        payload = [Object.assign({ id: 'singleton' }, payload)];
      } else {
        payload = [];
      }
    }
    queues[collection] = (queues[collection] || Promise.resolve()).then(function () {
      return request('/admin/records/' + encodeURIComponent(collection),{method:'PUT',body:payload});
    }).catch(notifyError);
    return queues[collection];
  }
  DB.set = function (key,value) {
    originalSet(key,value);
    if (collections.indexOf(key) !== -1 && getToken()) sync(key,value);
  };
  DB.push = function (key,item) {
    var result = originalPush(key,item);
    if (getToken() && collections.indexOf(key) !== -1) {
      sync(key, originalGet(key, []));
    } else if (!getToken() && ['prayers','baptisms','contactMessages'].indexOf(key) !== -1) {
      request('/public/' + encodeURIComponent(key),{method:'POST',body:item}).catch(notifyError);
    }
    return result;
  };
  DB.remove = function (key) {
    originalRemove(key);
    if (collections.indexOf(key) !== -1 && getToken()) sync(key,[]);
  };

  function refreshViews() {
    var activePage = document.querySelector('main .page.active');
    if (!activePage) return;
    if (activePage.id === 'page-admin-portal') {
      if (typeof window.renderAdminPortal === 'function') {
        try { window.renderAdminPortal(); }
        catch (error) { console.error('Could not refresh the admin portal:',error); }
      }
      return;
    }
    var renderers = {
      'page-home':'renderHome',
      'page-events':'renderEvents',
      'page-sermons':'renderSermons',
      'page-gallery':'renderGallery',
      'page-announcements':'renderAnnouncements',
      'page-prayers':'renderPrayers',
      'page-baptisms':'renderBaptisms'
    };
    var renderer = renderers[activePage.id];
    if (renderer && typeof window[renderer] === 'function') {
      try { window[renderer](); }
      catch (error) { console.error('Could not refresh ' + activePage.id + ':',error); }
    }
  }
  function hydrate(data) {
    Object.keys(data || {}).forEach(function (key) {
      if (collections.indexOf(key) < 0) return;
      var value = data[key];
      if (key === 'media' && Array.isArray(value) && value.length === 0) return;
      if (key === 'siteSettings' || key === 'livestream') {
        if (Array.isArray(value)) {
          if (!value.length) return;
          value = Object.assign({}, value[0]);
          delete value.id;
        }
      }
      originalSet(key,value);
    });
    refreshViews();
  }
  function loadPublic() {
    return request('/public-data',null,4500).catch(function (firstError) {
      console.warn('Public data request did not complete; retrying once:',firstError.message);
      return new Promise(function (resolve) { window.setTimeout(resolve,400); })
        .then(function () { return request('/public-data',null,4500); });
    }).then(function (data) {
      hydrate(data);
      window.dispatchEvent(new CustomEvent('icf:data-ready',{detail:{ok:true}}));
      return data;
    }).catch(function (error) {
      window.dispatchEvent(new CustomEvent('icf:data-ready',{detail:{ok:false,message:error.message || 'Public data is unavailable.'}}));
      throw error;
    });
  }
  function loadAdmin() {
    if (!getToken()) return Promise.resolve();
    return request('/admin/records').then(hydrate).catch(function (error) {
      if (error.status === 401) { localStorage.removeItem(TOKEN); localStorage.removeItem(USER); }
      throw error;
    });
  }

  window.doAdminLogin = function () {
    var email = (document.getElementById('admin-email-input') || {value:''}).value.trim();
    var password = (document.getElementById('admin-pass-input') || {value:''}).value;
    if (!email || !password) { if (typeof toast === 'function') toast('Missing details','Enter your administrator email and password.','error'); return; }
    request('/auth/login',{method:'POST',body:{email:email,password:password}}).then(function (result) {
      localStorage.setItem(TOKEN,result.access_token);
      localStorage.setItem(USER,JSON.stringify(result.user || {}));
      return loadAdmin().then(function () {
        if (typeof toast === 'function') toast('Welcome to the Admin Portal','','success');
        if (typeof navigate === 'function') navigate('admin-portal');
      });
    }).catch(function (error) {
      if (typeof toast === 'function') toast('Sign-in failed',error.message || 'Check the credentials and Supabase setup.','error');
      else showErrorCard('Sign-in failed',error.message || 'Check the credentials and Supabase setup.');
    });
  };
  window.adminLogout = function () {
    localStorage.removeItem(TOKEN); localStorage.removeItem(USER);
    localStorage.removeItem('icf_member_token'); localStorage.removeItem('icf_member_user');
    if (typeof navigate === 'function') navigate('member-profile');
    if (typeof toast === 'function') toast('Logged out','You have been signed out.','info');
  };
  window.doMemberLogin = function () {
  if (MEMBER_LOGIN_BUSY) return;
  var email = (document.getElementById('login-email') || {value:''}).value.trim().toLowerCase();
  var password = (document.getElementById('login-pass') || {value:''}).value;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    if (typeof toast === 'function') toast('Check your details','Enter a valid email address and your password.','error');
    return;
  }
  MEMBER_LOGIN_BUSY = true;
  var button=document.getElementById('member-login-submit');
  if(button){button.disabled=true;button.dataset.originalText=button.textContent;button.textContent='Signing in…';}
  request('/auth/member-login',{method:'POST',body:{email:email,password:password}}).then(function (result) {
    localStorage.setItem('icf_member_token',result.access_token);
    localStorage.setItem('icf_member_token_expires_at',String(result.expires_at||''));
    localStorage.setItem('icf_member_user',JSON.stringify(result.user || {}));
    var pass=document.getElementById('login-pass');if(pass)pass.value='';
    if (typeof toast === 'function') toast('Welcome back','Your ICF member account is ready.','success');
    if (typeof navigate === 'function') navigate('member-profile');
  }).catch(function (error) {
    if (typeof toast === 'function') toast('Sign-in failed',error.message || 'Please check your details and try again.','error');
  }).finally(function () {
    MEMBER_LOGIN_BUSY=false;
    if(button){button.disabled=false;button.textContent=button.dataset.originalText||'👤 Sign In';}
  });
};
window.doMemberLogout = function () {
  ['icf_member_token','icf_member_token_expires_at','icf_member_user'].forEach(function(key){localStorage.removeItem(key);});
  if(typeof toast==='function')toast('Signed out','You have safely signed out of your member account.','success');
  if(typeof navigate==='function')navigate('login');
};
window.toggleIcfPassword = function (id,button) {
  var input=document.getElementById(id);if(!input)return;
  var showing=input.type==='text';input.type=showing?'password':'text';
  if(button){button.textContent=showing?'Show':'Hide';button.setAttribute('aria-pressed',showing?'false':'true');}
};
window.submitSignup = function () {
  if (MEMBER_SIGNUP_BUSY) return;
  if (!captchaConfigReady) {
    if (typeof toast === 'function') toast('Preparing security check','Please try again in a moment.','warning');
    return;
  }
  if (captchaConfigFailed) {
    if (typeof toast === 'function') toast('Security check unavailable','Refresh the page and try again later.','error');
    return;
  }
  var name = (document.getElementById('su-name') || {value:''}).value.trim();
  var phone = (document.getElementById('su-phone') || {value:''}).value.trim();
  var email = (document.getElementById('su-email') || {value:''}).value.trim().toLowerCase();
  var address = (document.getElementById('su-address') || {value:''}).value.trim();
  var nationalityCode = (document.getElementById('su-nationality-code') || {value:''}).value.trim().toUpperCase();
  var country = window.ICFCountryData && window.ICFCountryData.getCountry(nationalityCode);
  var nationality = country ? country.name : '';
  var password = (document.getElementById('su-pass') || {value:''}).value;
  var confirm = (document.getElementById('su-confirm') || {value:''}).value;
  var agreed = !!(document.getElementById('su-agree') || {checked:false}).checked;
  var websiteTrap = (document.getElementById('su-website') || {value:''}).value.trim();
  if (name.length < 2 || phone.length < 6 || address.length < 3 || !country ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 200 || password !== confirm || !agreed) {
    if (typeof toast === 'function') toast('Check the form','Enter your details, select a nationality, use a valid email, set a matching password of at least 12 characters, and accept the terms.','error');
    return;
  }
  if (captchaEnabled && !memberCaptchaToken) {
    if (typeof toast === 'function') toast('Complete the security check','Please complete the verification challenge before creating your account.','warning');
    return;
  }
  var dialCode = typeof selectedDialCode !== 'undefined' ? selectedDialCode : '';
  if(!/^\+\d{1,4}$/.test(dialCode)){if(typeof toast==='function')toast('Select a phone country','Choose a valid calling code before submitting.','error');return;}
  MEMBER_SIGNUP_BUSY = true;
  var button=document.getElementById('member-signup-submit');
  if(button){button.disabled=true;button.dataset.originalText=button.textContent;button.textContent='Submitting application…';}
  request('/public/member-signup',{method:'POST',body:{
    name:name,phone:phone,email:email,address:address,nationality:nationality,
    nationalityCode:country.code,dialCode:dialCode,password:password,
    companyWebsite:websiteTrap,captchaToken:memberCaptchaToken
  }}).then(function (result) {
    ['su-name','su-phone','su-email','su-address','su-pass','su-confirm','su-website'].forEach(function (id) { var el=document.getElementById(id); if(el)el.value=''; });
    ['su-nationality-val','su-nationality-code'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
    var natDisplay=document.getElementById('nat-display-nationality');if(natDisplay)natDisplay.textContent='🌍 Select your nationality';
    var agree = document.getElementById('su-agree'); if(agree)agree.checked=false;
    var form=document.getElementById('signup-form'),panel=document.getElementById('signup-result');
    var heading=document.getElementById('signup-result-title'),message=document.getElementById('signup-result-message');
    if(form)form.hidden=true;
    if(panel)panel.hidden=false;
    if(heading)heading.textContent=result.emailConfirmationRequired?'Confirm Your Email Address':'Membership Application Received';
    if(message)message.textContent=result.message || 'Your ICF membership application has been received. Membership access requires church approval.';
    var loginEmail=document.getElementById('login-email');if(loginEmail)loginEmail.value=email;
    if (typeof toast === 'function') toast('Application received',result.message || 'Your membership application is awaiting review.','success');
  }).catch(function (error) {
    if (typeof toast === 'function') toast('Registration failed',error.message || 'Please try again.','error');
  }).finally(function () {
    MEMBER_SIGNUP_BUSY=false;
    if(captchaEnabled&&window.turnstile&&memberCaptchaWidget!==null){
      try{window.turnstile.reset(memberCaptchaWidget);}catch(_e){}
      memberCaptchaToken='';
    }
    if(button){button.disabled=false;button.textContent=button.dataset.originalText||'📝 Create Account';}
  });
};

window.openIcfPasswordReset = function (sourceId) {
  var source=document.getElementById(sourceId||'login-email');
  var email=document.getElementById('icf-reset-email');
  if(source&&email)email.value=source.value.trim();
  var status=document.getElementById('password-reset-status');if(status)status.textContent='';
  if(typeof navigate==='function')navigate('password-reset');
};
window.requestIcfPasswordReset = function () {
  var email=(document.getElementById('icf-reset-email')||{value:''}).value.trim().toLowerCase();
  var status=document.getElementById('password-reset-status');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    if(status)status.textContent='Enter a valid email address.';
    return;
  }
  var button=document.getElementById('icf-reset-request-button');
  if(button){button.disabled=true;button.dataset.originalText=button.textContent;button.textContent='Sending…';}
  request('/auth/password-reset-request',{method:'POST',body:{email:email}}).then(function(result){
    if(status)status.textContent=result.message||'If an account exists, a reset link will be sent.';
  }).catch(function(error){
    if(status)status.textContent=error.message||'We could not send a reset link. Please try again later.';
  }).finally(function(){
    if(button){button.disabled=false;button.textContent=button.dataset.originalText||'Send Password Reset Link';}
  });
};
window.completeIcfPasswordReset = function () {
  if(!passwordRecoveryCredentials){
    var status=document.getElementById('password-reset-status');
    if(status)status.textContent='This reset link is invalid or expired. Request a new password reset link.';
    return;
  }
  var password=(document.getElementById('icf-new-password')||{value:''}).value;
  var confirm=(document.getElementById('icf-confirm-password')||{value:''}).value;
  var status=document.getElementById('password-reset-status');
  if(password.length<12||password.length>200||password!==confirm){
    if(status)status.textContent=password!==confirm?'The passwords do not match.':'Use a password containing at least 12 characters.';
    return;
  }
  var button=document.getElementById('icf-reset-complete-button');
  if(button){button.disabled=true;button.dataset.originalText=button.textContent;button.textContent='Updating…';}
  request('/auth/password-reset-complete',{method:'POST',body:{
    accessToken:passwordRecoveryCredentials.accessToken,
    refreshToken:passwordRecoveryCredentials.refreshToken,
    password:password
  }}).then(function(result){
    passwordRecoveryCredentials=null;
    ['icf-new-password','icf-confirm-password'].forEach(function(id){var input=document.getElementById(id);if(input)input.value='';});
    var complete=document.getElementById('password-reset-complete');if(complete)complete.hidden=true;
    var requestForm=document.getElementById('password-reset-request');if(requestForm)requestForm.hidden=true;
    if(status)status.textContent=result.message||'Your password has been updated. You can now sign in.';
  }).catch(function(error){
    if(status)status.textContent=error.message||'The reset link may have expired. Request a new one and try again.';
  }).finally(function(){
    if(button){button.disabled=false;button.textContent=button.dataset.originalText||'Update Password';}
  });
};
window.resendIcfSignupConfirmation = function () {
  var input=document.getElementById('login-email')||document.getElementById('admin-email-input');
  var email=(input||{value:''}).value.trim().toLowerCase();
  var status=document.getElementById('login-email-status');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    if(status)status.textContent='Enter your email address first, then request a new confirmation link.';
    else if(typeof toast==='function')toast('Email required','Enter your account email first.','warning');
    return;
  }
  if(status)status.textContent='Requesting a confirmation email…';
  request('/auth/resend-confirmation',{method:'POST',body:{email:email}}).then(function(result){
    if(status)status.textContent=result.message||'If confirmation is still needed, a new link will be sent.';
  }).catch(function(error){
    if(status)status.textContent=error.message||'We could not resend the email right now.';
  });
};
function mountIcfTurnstile() {
  if(!captchaEnabled||memberCaptchaWidget!==null)return;
  var page=document.getElementById('page-signup');
  if(!page||!page.classList.contains('active'))return;
  var wrapper=document.getElementById('icf-turnstile-wrap');
  var mount=document.getElementById('icf-turnstile');
  if(wrapper)wrapper.hidden=false;
  if(!mount)return;
  function renderWidget(){
    if(!window.turnstile||memberCaptchaWidget!==null)return;
    try{
      memberCaptchaWidget=window.turnstile.render(mount,{
        sitekey:captchaSiteKey,
        action:'icf_member_signup',
        callback:function(token){memberCaptchaToken=token||'';},
        'expired-callback':function(){memberCaptchaToken='';},
        'error-callback':function(){memberCaptchaToken='';}
      });
    }catch(error){
      captchaConfigFailed=true;
      var text=wrapper&&wrapper.querySelector('p');
      if(text)text.textContent='The security check could not be loaded. Refresh the page and try again.';
    }
  }
  if(window.turnstile){renderWidget();return;}
  if(turnstileScriptLoading)return;
  turnstileScriptLoading=true;
  var script=document.createElement('script');
  script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async=true;script.defer=true;
  script.onload=function(){turnstileScriptLoading=false;renderWidget();};
  script.onerror=function(){
    turnstileScriptLoading=false;captchaConfigFailed=true;
    var text=wrapper&&wrapper.querySelector('p');
    if(text)text.textContent='The security check could not be loaded. Check your connection and refresh the page.';
  };
  document.head.appendChild(script);
}
function initIcfAuthEnhancements() {
  var callback=window.ICFAuthCallback||null;
  if(callback){
    if(callback.type==='recovery'){
      if(callback.accessToken&&callback.refreshToken){
        passwordRecoveryCredentials={accessToken:callback.accessToken,refreshToken:callback.refreshToken};
        var requestForm=document.getElementById('password-reset-request');
        var completeForm=document.getElementById('password-reset-complete');
        if(requestForm)requestForm.hidden=true;
        if(completeForm)completeForm.hidden=false;
        var status=document.getElementById('password-reset-status');
        if(status)status.textContent='Your secure reset link is ready. Choose a new password below.';
      }else{
        var errorStatus=document.getElementById('password-reset-status');
        if(errorStatus)errorStatus.textContent=callback.error||'This reset link is invalid or expired. Request a new one.';
      }
    }else if(callback.type==='signup'){
      var verified=document.getElementById('email-confirmed-message');
      if(verified)verified.textContent='Your email address has been confirmed. Your ICF membership application is still pending review and approval by the church administration.';
    }else if(callback.error){
      var failed=document.getElementById('email-confirmed-message');
      if(failed)failed.textContent='This email link could not be verified or has expired. You can request another confirmation or password reset link from the sign-in page.';
    }
    try{delete window.ICFAuthCallback;}catch(_e){window.ICFAuthCallback=null;}
  }
  window.addEventListener('icf:page-changed',function(event){
    if(event&&event.detail&&event.detail.page==='signup')mountIcfTurnstile();
  });
  request('/public/auth-config',{method:'GET'}).then(function(config){
    captchaConfigReady=true;
    captchaEnabled=!!config.turnstileEnabled;
    captchaSiteKey=String(config.turnstileSiteKey||'');
    if(config.captchaConfigurationIncomplete){
      captchaConfigFailed=true;
      var wrap=document.getElementById('icf-turnstile-wrap');if(wrap)wrap.hidden=false;
      var text=wrap&&wrap.querySelector('p');if(text)text.textContent='Registration security verification is not fully configured. Please try again later.';
      return;
    }
    if(captchaEnabled)mountIcfTurnstile();
  }).catch(function(){
    captchaConfigReady=false;
    captchaConfigFailed=true;
    var wrap=document.getElementById('icf-turnstile-wrap');if(wrap)wrap.hidden=false;
    var text=wrap&&wrap.querySelector('p');if(text)text.textContent='The registration security settings could not be checked. Refresh the page before submitting.';
  });
}
window.submitPrayerForm = function () {
    var anonymous = !!(document.getElementById('anon-checkbox') && document.getElementById('anon-checkbox').checked);
    var name = (document.getElementById('pf-name') || {value:''}).value.trim();
    var email = (document.getElementById('pf-email') || {value:''}).value.trim();
    var category = (document.getElementById('pf-category') || {value:'other'}).value;
    var prayer = (document.getElementById('pf-request') || {value:''}).value.trim();
    if ((!anonymous && !name) || !prayer) { if (typeof toast === 'function') toast('Missing details','Enter your name or select anonymous, and provide a prayer request.','error'); return; }
    request('/public/prayers',{method:'POST',body:{requesterName:name,email:email,category:category,request:prayer,anonymous:anonymous}})
      .then(function (item) {
        originalSet('prayers',[item].concat(originalGet('prayers',[])));
        if (typeof closePrayerModal === 'function') closePrayerModal();
        if (typeof renderPrayers === 'function') renderPrayers();
        if (typeof toast === 'function') toast('Prayer request submitted','Our prayer team will review your request.','success');
      }).catch(function (error) { if (typeof toast === 'function') toast('Could not submit request',error.message || 'Please try again.','error'); });
  };
  window.submitBaptismForm = function () {
    var name = (document.getElementById('bf-name') || {value:''}).value.trim();
    var phone = (document.getElementById('bf-phone') || {value:''}).value.trim();
    var date = (document.getElementById('bf-date') || {value:''}).value;
    var email = (document.getElementById('bf-email') || {value:''}).value.trim();
    var testimony = (document.getElementById('bf-testimony') || {value:''}).value.trim();
    if (name.length < 2 || phone.length < 6 || !date) { if (typeof toast === 'function') toast('Missing details','Enter your name, phone number, and preferred date.','error'); return; }
    request('/public/baptisms',{method:'POST',body:{fullName:name,phone:phone,email:email,testimony:testimony,preferredDate:date}})
      .then(function () {
        if (typeof closeBaptismModal === 'function') closeBaptismModal();
        if (typeof renderBaptisms === 'function') renderBaptisms();
        if (typeof toast === 'function') toast('Booking received','The church team will contact you to confirm.','success');
      }).catch(function (error) { if (typeof toast === 'function') toast('Could not submit booking',error.message || 'Please try again.','error'); });
  };
  window.submitContactForm = function () {
    var name = (document.getElementById('contact-name') || {value:''}).value.trim();
    var email = (document.getElementById('contact-email') || {value:''}).value.trim();
    var phone = (document.getElementById('contact-phone') || {value:''}).value.trim();
    var subject = (document.getElementById('contact-subject') || {value:''}).value.trim();
    var message = (document.getElementById('contact-message') || {value:''}).value.trim();
    if (!name || !email || !message) { if (typeof toast === 'function') toast('Missing details','Enter your name, email address, and message.','error'); return; }
    request('/public/contactMessages',{method:'POST',body:{name:name,email:email,phone:phone,subject:subject,message:message}})
      .then(function () {
        ['contact-name','contact-email','contact-phone','contact-subject','contact-message'].forEach(function (id) { var el=document.getElementById(id); if(el)el.value=''; });
        if (typeof toast === 'function') toast('Message sent','We will get back to you soon.','success');
      }).catch(function (error) { if (typeof toast === 'function') toast('Message not sent',error.message || 'Please try again.','error'); });
  };

  function uploadSelected(inputId,fileId,bucket) {
    var fileInput = document.getElementById(fileId);
    var file = fileInput && fileInput.files && fileInput.files[0];
    if (!file) return Promise.resolve();
    var form = new FormData(); form.append('file',file);
    return request('/admin/uploads?bucket=' + encodeURIComponent(bucket || 'church-public'),{method:'POST',body:form}).then(function (result) {
      var input = document.getElementById(inputId); if(input)input.value=result.url;
    });
  }
  function addUploadInput(afterId,fileId,label,accept) {
    var target = document.getElementById(afterId);
    if (!target || document.getElementById(fileId)) return;
    var parent = target.closest('.form-group') || target.parentElement;
    if (!parent || !parent.parentNode) return;
    var group = document.createElement('div'); group.className='form-group';
    var caption = document.createElement('label'); caption.className='form-label'; caption.textContent=label;
    var input = document.createElement('input'); input.className='form-input'; input.type='file'; input.id=fileId; input.accept=accept;
    var note = document.createElement('small'); note.className='text-dim'; note.textContent='Optional upload, maximum 15 MB. You can also paste a URL above.';
    group.appendChild(caption); group.appendChild(input); group.appendChild(note);
    parent.parentNode.insertBefore(group,parent.nextSibling);
  }
  var saveMediaOriginal = window.saveMedia;
  window.saveMedia = function () {
    return uploadSelected('med-url','med-file-upload','church-public').then(function () {
      if (typeof saveMediaOriginal === 'function') saveMediaOriginal();
    }).catch(function (error) { if (typeof toast === 'function') toast('Upload failed',error.message || 'Please try again.','error'); });
  };
  var saveSermonOriginal = window.saveSermon;
  window.saveSermon = function () {
    return Promise.all([
      uploadSelected('serm-video','serm-video-upload','church-public'),
      uploadSelected('serm-audio','serm-audio-upload','church-public'),
      uploadSelected('serm-pdf','serm-pdf-upload','church-public')
    ]).then(function () { if (typeof saveSermonOriginal === 'function') saveSermonOriginal(); })
      .catch(function (error) { if (typeof toast === 'function') toast('Upload failed',error.message || 'Please try again.','error'); });
  };
  function watchAdminForms() {
    addUploadInput('med-url','med-file-upload','Upload a photo or media file','image/*,application/pdf,audio/*,video/*');
    addUploadInput('serm-video','serm-video-upload','Upload video (optional)','video/*');
    addUploadInput('serm-audio','serm-audio-upload','Upload audio (optional)','audio/*');
    addUploadInput('serm-pdf','serm-pdf-upload','Upload PDF (optional)','application/pdf');
  }
  function removeKnownDemoCache() {
    var rules = {
      prayers: function (item) {
        return ['Fatou Jallow','Ebrima Ceesay'].indexOf(item.requesterName) !== -1 ||
          String(item.request || '').indexOf('Pray for unity and peace in my family.') !== -1;
      },
      baptisms: function (item) { return ['Mariama Jobe','Lamin Sanneh'].indexOf(item.fullName) !== -1; },
      events: function (item) {
        return ['Community Crusade – Mariama Kunda','Singles & Married Couples Fellowship','Night Vigil – Last Friday'].indexOf(item.title) !== -1;
      },
      members: function (item) { return item.role === 'admin' && item.email === 'admin@icfgambia.org'; },
      sermons: function (item) {
        return ['Walking in the Power of the Holy Spirit','Faith That Moves Mountains','The Power of Prayer and Fasting'].indexOf(item.title) !== -1;
      },
      announcements: function (item) {
        return ['Sunday Service Time Reminder','Night Vigil – Last Friday of the Month','Baptism Registration Now Open'].indexOf(item.title) !== -1;
      }
    };
    Object.keys(rules).forEach(function (collection) {
      var records = originalGet(collection, []);
      if (Array.isArray(records)) {
        var filtered = records.filter(function (item) { return !rules[collection](item || {}); });
        if (filtered.length !== records.length) originalSet(collection, filtered);
      }
    });
    localStorage.removeItem('icf_seeded');
  }

  function installVisualPolish() {
    if (document.getElementById('icf-premium-polish')) return;
    var style = document.createElement('style');
    style.id = 'icf-premium-polish';
    style.textContent = `
      :root { --icf-gold:#d7a83e; --icf-navy:#07172f; --icf-blue:#0d3c79; }
      html { scroll-behavior:smooth; }
      body { overflow-wrap:anywhere; }
      img, video, iframe { max-width:100%; }
      .card, .event-card, .sermon-card, .media-card, .announcement-card, .stat-card, .admin-card {
        transition:transform .22s ease, box-shadow .22s ease, border-color .22s ease;
      }
      .card:hover, .event-card:hover, .sermon-card:hover, .media-card:hover, .announcement-card:hover {
        transform:translateY(-3px); box-shadow:0 16px 36px rgba(6,25,53,.12);
      }
      .icf-premium-panel { border:1px solid rgba(215,168,62,.26); border-radius:18px;
        background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(246,249,253,.96));
        box-shadow:0 12px 32px rgba(7,23,47,.07); }
      .icf-error-card { display:flex; align-items:flex-start; gap:12px; padding:14px 16px;
        margin:12px 0; border:1px solid #f3c4c4; border-left:4px solid #b42318;
        border-radius:12px; background:#fff7f7; color:#7a271a; overflow-wrap:anywhere; }
      .icf-error-card strong { display:block; margin-bottom:3px; }\n      .icf-error-dismiss { margin-left:auto; border:0; background:transparent; color:inherit; font-size:22px; cursor:pointer; padding:0 4px; }
      input, select, textarea, button, a { scroll-margin-top:90px; }
      input, select, textarea { max-width:100%; }
      button, .btn, a.btn { touch-action:manipulation; }
      @media (max-width:720px) {
        .container, .section-container, .page-container { width:min(100% - 28px,100%); }
        .card, .event-card, .sermon-card, .media-card, .announcement-card { min-width:0; }
        table { display:block; max-width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .modal, .modal-content, .admin-modal { max-width:calc(100vw - 24px); }
        input, select, textarea { font-size:16px; }
      }
      @media (prefers-reduced-motion:reduce) {
        html { scroll-behavior:auto; }
        *, *::before, *::after { animation-duration:.01ms!important; transition-duration:.01ms!important; }
      }`;
    document.head.appendChild(style);
  }
  function updateDocumentLinks() {
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = (link.getAttribute('href') || '').toLowerCase();
      var label = '';
      var accessibleLabel = '';
      if (href.indexOf('membership-statement.pdf') !== -1) {
        label = 'ICF Membership Statement PDF';
        accessibleLabel = 'Open ICF Membership Statement PDF';
      } else if (href.indexOf('workers-manual.pdf') !== -1) {
        label = 'ICF Workers’ Manual PDF';
        accessibleLabel = 'Open ICF Workers’ Manual PDF';
      }
      // Text changes create childList mutations. Only write when the value
      // differs so our MutationObserver cannot trigger itself indefinitely.
      if (label && link.textContent !== label) link.textContent = label;
      if (accessibleLabel && link.getAttribute('aria-label') !== accessibleLabel) {
        link.setAttribute('aria-label',accessibleLabel);
      }
      if (/\.pdf(?:[?#]|$)/i.test(href)) {
        if (link.getAttribute('target') !== '_blank') link.setAttribute('target','_blank');
        if (link.getAttribute('rel') !== 'noopener noreferrer') link.setAttribute('rel','noopener noreferrer');
      }
    });
  }
  function observeVisualUpdates() {
    if (!document.body || typeof MutationObserver === 'undefined') return;
    var observer = new MutationObserver(function () { updateDocumentLinks(); });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  document.addEventListener('DOMContentLoaded',function () {
    installVisualPolish();
    updateDocumentLinks();
    observeVisualUpdates();
    removeKnownDemoCache();
    initIcfAuthEnhancements();
    var existingToken = getToken();
    if (existingToken && existingToken.split('.').length !== 3) {
      localStorage.removeItem(TOKEN); localStorage.removeItem(USER); existingToken='';
    }
    var directAdminEntry = window.location.hash === '#admin-portal' && !!existingToken;
    var initialDataLoad = directAdminEntry
      ? loadAdmin().catch(function (error) {
          console.warn('Admin session could not be restored:',error.message);
          if (error.status === 401 && typeof navigate === 'function') navigate('admin-login');
        })
      : loadPublic().catch(function (error) { showPublicDataFailure(error); })
          .then(function () {
            if (existingToken) return loadAdmin().catch(function (error) {
              console.warn('Admin session could not be restored:',error.message);
            });
          });
    initialDataLoad.then(function () {
      if (window.location.hash === '#admin-portal' && getToken() && typeof navigate === 'function') navigate('admin-portal');
    });
    var panel = document.getElementById('admin-content');
    if (panel && typeof MutationObserver !== 'undefined') new MutationObserver(watchAdminForms).observe(panel,{childList:true,subtree:true});
    watchAdminForms();
  });
})();
