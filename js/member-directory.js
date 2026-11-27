(function(){
'use strict';
function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function api(path,options){options=options||{};options.headers=Object.assign({},options.headers||{},{Authorization:'Bearer '+(localStorage.getItem('icf_member_token')||'')});return fetch('/api'+path,options).then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'Request failed');return d;});});}
window.renderMemberProfile=function(){
 var host=document.getElementById('member-profile-content');if(!host)return;
 host.innerHTML='<div class="card"><div class="card-body">Loading your profile…</div></div>';
 api('/member/profile').then(function(data){var m=data.member||{},roles=m.roles||[],country=window.ICFCountryData&&window.ICFCountryData.getCountry(m.nationalityCode),nationalityLabel=country?country.flag+' '+country.name:(m.nationality||'Not provided');
 host.innerHTML='<div class="card"><div class="card-body"><div class="flex items-center gap-3"><img class="member-profile-photo" src="'+esc(m.avatarUrl||'/icf-logo-transparent.png')+'" alt="Profile photo"/><div><h2>'+esc(m.name)+'</h2><p>'+esc(m.email)+'</p><span class="badge badge-green">'+esc(m.status)+'</span></div></div>'+
 '<div class="member-profile-nationality"><strong>Nationality</strong><span>'+esc(nationalityLabel)+'</span></div><div class="form-group" style="margin-top:18px"><label class="form-label">Profile photo</label><input class="form-input" type="file" id="member-avatar-file" accept="image/jpeg,image/png,image/webp"/><small>Image up to 5 MB.</small><button class="btn btn-outline btn-sm" onclick="uploadMyMemberAvatar()">Upload photo</button></div>'+
 '<div class="form-row"><div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="member-profile-phone" value="'+esc(m.phone)+'"/></div><div class="form-group"><label class="form-label">Address</label><input class="form-input" id="member-profile-address" value="'+esc(m.address)+'"/></div></div>'+
 '<div class="form-group"><label class="form-label">Short biography</label><textarea class="form-textarea" id="member-profile-bio" maxlength="500">'+esc(m.bio)+'</textarea></div>'+
 '<label><input type="checkbox" id="member-public-profile" '+(m.publicProfileConsent?'checked':'')+'/> I consent to publish my name, photo, biography and assigned church roles in the ICF public directory.</label><p><button class="btn btn-primary" onclick="saveMyMemberProfile()">Save profile</button></p></div></div>'+
 '<div class="card" style="margin-top:14px"><div class="card-header"><strong>My Church Roles & Ministry Teams</strong></div><div class="card-body">'+roles.map(function(r){return '<span class="member-profile-role">'+esc(r.name)+'</span>';}).join('')+'<p class="text-xs text-dim">Your church roles are assigned by an ICF administrator.</p></div></div>';
 }).catch(function(e){host.innerHTML='<div class="icf-error-card"><strong>Profile unavailable</strong>'+esc(e.message)+'</div>';});
};
window.saveMyMemberProfile=function(){
 var data={phone:document.getElementById('member-profile-phone').value.trim(),address:document.getElementById('member-profile-address').value.trim(),bio:document.getElementById('member-profile-bio').value.trim(),publicProfileConsent:document.getElementById('member-public-profile').checked};
 api('/member/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(){if(window.toast)toast('Profile saved','','success');window.renderMemberProfile();}).catch(function(e){if(window.toast)toast('Save failed',e.message,'error');});
};
window.uploadMyMemberAvatar=function(){
 var input=document.getElementById('member-avatar-file'),file=input&&input.files&&input.files[0];if(!file){if(window.toast)toast('Choose a photo first','','error');return;}
 if(file.size>5*1024*1024){if(window.toast)toast('Photo too large','Maximum size is 5 MB.','error');return;}
 var form=new FormData();form.append('file',file);
 api('/member/avatar',{method:'POST',body:form}).then(function(){if(window.toast)toast('Photo updated','','success');window.renderMemberProfile();}).catch(function(e){if(window.toast)toast('Upload failed',e.message,'error');});
};
window.renderPublicDirectory=function(){
 var host=document.getElementById('icf-public-directory-grid');if(!host)return;
 fetch('/api/public-directory').then(function(r){if(!r.ok)throw new Error('Unavailable');return r.json();}).then(function(data){
 var people=data.members||[];if(!people.length){host.innerHTML='<div class="empty-state"><p>Our directory will appear here as members approve their profiles and choose to be listed.</p></div>';return;}
 host.innerHTML=people.map(function(m){return '<article class="public-person-card">'+(m.avatarUrl?'<img src="'+esc(m.avatarUrl)+'" alt="'+esc(m.name)+'"/>':'<div class="public-person-avatar">👤</div>')+'<h3>'+esc(m.name)+'</h3>'+(m.bio?'<p>'+esc(m.bio)+'</p>':'')+'<div>'+(m.roles||[]).map(function(r){return '<span class="public-person-role">'+esc(r.name)+'</span>';}).join('')+'</div></article>';}).join('');
 }).catch(function(){host.innerHTML='<div class="empty-state"><p>Our directory is temporarily unavailable.</p></div>';});
};
})();