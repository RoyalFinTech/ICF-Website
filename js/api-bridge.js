/* ICF Gambia API bridge. The original layout, real church photos, and PDFs are retained. */
(function () {
  'use strict';
  var API = '/api';
  var TOKEN = 'icf_admin_token';
  var USER = 'icf_admin_user';
  var collections = ['members','prayers','baptisms','events','sermons','media','announcements','contactMessages','emailHistory','livestream','siteSettings','enabledLangs'];
  var originalGet = DB.get.bind(DB);
  var originalSet = DB.set.bind(DB);
  var originalPush = DB.push.bind(DB);
  var originalRemove = DB.remove.bind(DB);
  var queues = Object.create(null);

  function getToken() { return localStorage.getItem(TOKEN) || ''; }
  function request(url, options) {
    options = options || {};
    var headers = Object.assign({}, options.headers || {});
    var formData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (options.body && !formData && typeof options.body !== 'string') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    if (getToken() && !headers.Authorization) headers.Authorization = 'Bearer ' + getToken();
    return fetch(API + url,Object.assign({},options,{headers:headers})).then(function (response) {
      return response.text().then(function (raw) {
        var data = {};
        try { data = raw ? JSON.parse(raw) : {}; } catch (e) { data = { error:raw || 'Request failed.' }; }
        if (!response.ok) { var error = new Error(data.error || 'Request failed (' + response.status + ').'); error.status = response.status; throw error; }
        return data;
      });
    });
  }
  function notifyError(error) {
    if (error && error.status === 401) { localStorage.removeItem(TOKEN); localStorage.removeItem(USER); }
    if (typeof window.toast === 'function') window.toast('Could not save',error && error.message ? error.message : 'Please try again.','error');
    else console.error(error);
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
    ['renderHome','renderEvents','renderSermons','renderGallery','renderAnnouncements','renderPrayers','renderBaptisms'].forEach(function (name) {
      if (typeof window[name] === 'function') { try { window[name](); } catch (e) {} }
    });
    if (document.getElementById('page-admin-portal') && document.getElementById('page-admin-portal').classList.contains('active') &&
        typeof window.renderAdminPortal === 'function') window.renderAdminPortal();
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
  function loadPublic() { return request('/public-data').then(hydrate); }
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
    });
  };
  window.adminLogout = function () {
    localStorage.removeItem(TOKEN); localStorage.removeItem(USER);
    localStorage.removeItem('icf_member_token'); localStorage.removeItem('icf_member_user');
    if (typeof navigate === 'function') navigate('home');
    if (typeof toast === 'function') toast('Logged out','You have been signed out.','info');
  };
  window.doMemberLogin = function () {
    var email = (document.getElementById('login-email') || {value:''}).value.trim();
    var password = (document.getElementById('login-pass') || {value:''}).value;
    if (!email || !password) { if (typeof toast === 'function') toast('Missing details','Enter your email and password.','error'); return; }
    request('/auth/member-login',{method:'POST',body:{email:email,password:password}}).then(function (result) {
      localStorage.setItem('icf_member_token',result.access_token);
      localStorage.setItem('icf_member_user',JSON.stringify(result.user || {}));
      if (typeof toast === 'function') toast('Welcome back','','success');
      if (typeof navigate === 'function') navigate('home');
    }).catch(function (error) { if (typeof toast === 'function') toast('Sign-in failed',error.message || 'Please try again.','error'); });
  };
  window.submitSignup = function () {
    var name = (document.getElementById('su-name') || {value:''}).value.trim();
    var phone = (document.getElementById('su-phone') || {value:''}).value.trim();
    var email = (document.getElementById('su-email') || {value:''}).value.trim();
    var address = (document.getElementById('su-address') || {value:''}).value.trim();
    var nationality = (document.getElementById('su-nationality-val') || {value:''}).value;
    var nationalityCode = (document.getElementById('su-nationality-code') || {value:''}).value;
    var password = (document.getElementById('su-pass') || {value:''}).value;
    var confirm = (document.getElementById('su-confirm') || {value:''}).value;
    var agreed = !!(document.getElementById('su-agree') || {checked:false}).checked;
    if (name.length < 2 || phone.length < 6 || address.length < 3 || !nationality ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password !== confirm || !agreed) {
      if (typeof toast === 'function') toast('Check the form','Enter your details, a valid email, matching password of at least 8 characters, and accept the terms.','error');
      return;
    }
    var dialCode = typeof selectedDialCode !== 'undefined' ? selectedDialCode : '';
    request('/public/member-signup',{method:'POST',body:{name:name,phone:phone,email:email,address:address,nationality:nationality,nationalityCode:nationalityCode,dialCode:dialCode,password:password}})
      .then(function (result) {
        ['su-name','su-phone','su-email','su-address','su-pass','su-confirm'].forEach(function (id) { var el=document.getElementById(id); if(el)el.value=''; });
        var agree = document.getElementById('su-agree'); if(agree)agree.checked=false;
        if (typeof toast === 'function') toast('Registration received',result.message || 'Your membership application is pending approval.','success');
        if (typeof navigate === 'function') setTimeout(function () { navigate('home'); },1400);
      }).catch(function (error) { if (typeof toast === 'function') toast('Registration failed',error.message || 'Please try again.','error'); });
  };
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
      .icf-error-card strong { display:block; margin-bottom:3px; }
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
      if (href.indexOf('membership-statement.pdf') !== -1) {
        link.textContent = 'ICF Membership Statement PDF';
        link.setAttribute('aria-label','Open ICF Membership Statement PDF');
      } else if (href.indexOf('workers-manual.pdf') !== -1) {
        link.textContent = 'ICF Workers’ Manual PDF';
        link.setAttribute('aria-label','Open ICF Workers’ Manual PDF');
      }
      if (/\.pdf(?:[?#]|$)/i.test(href)) {
        link.setAttribute('target','_blank');
        link.setAttribute('rel','noopener noreferrer');
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
    var existingToken = getToken();
    if (existingToken && existingToken.split('.').length !== 3) {
      localStorage.removeItem(TOKEN); localStorage.removeItem(USER); existingToken='';
    }
    loadPublic().catch(function (error) { console.warn('Public data is not available yet:',error.message); })
      .then(function () {
        if (existingToken) return loadAdmin().catch(function (error) { console.warn('Admin session could not be restored:',error.message); });
      }).then(function () {
        if (window.location.hash === '#admin-portal' && getToken() && typeof navigate === 'function') navigate('admin-portal');
      });
    var panel = document.getElementById('admin-content');
    if (panel && typeof MutationObserver !== 'undefined') new MutationObserver(watchAdminForms).observe(panel,{childList:true,subtree:true});
    watchAdminForms();
  });
})();
