/* ══════════════════════════════════════════════
   ICF GAMBIA – FULL ADMIN MODULES v4.0
   Sermons · Media · Announcements · Email
   Livestream · Analytics · Settings
   All fully functional, localStorage persistent
══════════════════════════════════════════════ */

/* ── SERMONS MODULE ─────────────────────────── */
function adminSermonsHTML(){
  const sermons=DB.get('sermons',[]);
  const rows=sermons.map(s=>'<tr>'+
    '<td><div style="font-weight:700">'+s.title+'</div><div class="text-xs text-dim">'+s.preacher+'</div></td>'+
    '<td class="text-dim text-sm">'+s.category+'</td>'+
    '<td class="text-dim text-sm">'+fmtDate(s.date)+'</td>'+
    '<td><span class="badge '+(s.published?'badge-green':'badge-yellow')+'">'+(s.published?'Published':'Draft')+'</span></td>'+
    '<td style="display:flex;gap:5px;flex-wrap:wrap">'+
      (s.videoUrl?'<a href="'+s.videoUrl+'" target="_blank" class="btn btn-sm btn-outline">▶ Video</a>':'')+
      (s.audioUrl?'<a href="'+s.audioUrl+'" target="_blank" class="btn btn-sm btn-outline">🎵 Audio</a>':'')+
      '<button class="btn btn-sm '+(s.published?'btn-danger':'btn-success')+'" onclick="toggleSermonPublish(\''+s.id+'\')">'+
        (s.published?'Unpublish':'Publish')+'</button>'+
      '<button class="btn btn-sm btn-danger" onclick="deleteRecord(\'sermons\',\''+s.id+'\')">Del</button>'+
    '</td>'+
  '</tr>').join('');

  return '<div>'+
    '<div class="flex items-center justify-between flex-wrap gap-3" style="margin-bottom:20px">'+
      '<h2 class="section-title">📖 Sermons ('+sermons.length+')</h2>'+
      '<button class="btn btn-primary btn-sm" onclick="showAddSermonForm()">+ Add Sermon</button>'+
    '</div>'+
    '<div class="card" id="add-sermon-panel" style="display:none;margin-bottom:22px">'+
      '<div class="card-header"><div class="font-bold">📖 Add New Sermon</div></div>'+
      '<div class="card-body">'+
        '<div class="form-row"><div class="form-group"><label class="form-label">Title *</label><input class="form-input" id="serm-title" placeholder="Sermon title"/></div>'+
        '<div class="form-group"><label class="form-label">Preacher *</label><input class="form-input" id="serm-preacher" placeholder="Speaker name"/></div></div>'+
        '<div class="form-row"><div class="form-group"><label class="form-label">Date *</label><input class="form-input" type="date" id="serm-date"/></div>'+
        '<div class="form-group"><label class="form-label">Category</label><select class="form-select" id="serm-cat"><option value="sunday">Sunday Service</option><option value="wednesday">Wednesday Teaching</option><option value="special">Special Message</option><option value="series">Series</option><option value="other">Other</option></select></div></div>'+
        '<div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="serm-desc" rows="3" placeholder="Sermon description or notes..."></textarea></div>'+
        '<div class="form-row"><div class="form-group"><label class="form-label">Video URL <span>(YouTube / direct)</span></label><input class="form-input" id="serm-video" placeholder="https://youtube.com/watch?v=..."/></div>'+
        '<div class="form-group"><label class="form-label">Audio URL <span>(MP3 link)</span></label><input class="form-input" id="serm-audio" placeholder="https://..."/></div></div>'+
        '<div class="form-group"><label class="form-label">PDF Notes URL <span>(Optional)</span></label><input class="form-input" id="serm-pdf" placeholder="https://..."/></div>'+
        '<div style="display:flex;gap:10px;margin-top:6px">'+
          '<button class="btn btn-outline" onclick="hideAddSermonForm()">Cancel</button>'+
          '<button class="btn btn-outline-gold" onclick="saveSermon(false)">💾 Save as Draft</button>'+
          '<button class="btn btn-primary" onclick="saveSermon(true)">🚀 Save &amp; Publish</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="table-wrap"><table>'+
      '<thead><tr><th>Sermon</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>'+
      '<tbody>'+rows+(sermons.length?'':'<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--text-dim)">No sermons yet. Add your first sermon above.</td></tr>')+
      '</tbody></table></div>'+
  '</div>';
}
function showAddSermonForm(){const p=document.getElementById('add-sermon-panel');if(p)p.style.display='block'}
function hideAddSermonForm(){const p=document.getElementById('add-sermon-panel');if(p)p.style.display='none'}
function saveSermon(publish){
  const title=(document.getElementById('serm-title')||{value:''}).value.trim();
  const preacher=(document.getElementById('serm-preacher')||{value:''}).value.trim();
  const date=(document.getElementById('serm-date')||{value:''}).value;
  if(!title){toast('Please enter a sermon title','','error');return}
  if(!preacher){toast('Please enter the preacher name','','error');return}
  if(!date){toast('Please select a date','','error');return}
  const sermon={
    id:uid(),title,preacher,date,
    category:(document.getElementById('serm-cat')||{value:'other'}).value,
    description:(document.getElementById('serm-desc')||{value:''}).value.trim(),
    videoUrl:(document.getElementById('serm-video')||{value:''}).value.trim(),
    audioUrl:(document.getElementById('serm-audio')||{value:''}).value.trim(),
    pdfUrl:(document.getElementById('serm-pdf')||{value:''}).value.trim(),
    published:publish,
    views:0,
    createdAt:new Date().toISOString()
  };
  DB.push('sermons',sermon);
  renderAdminSection('sermons');
  toast(publish?'Sermon published! 📖':'Sermon saved as draft','','success');
}
function toggleSermonPublish(id){
  const sermons=DB.get('sermons',[]);
  const s=sermons.find(s=>s.id===id);
  if(s){s.published=!s.published;DB.set('sermons',sermons);renderAdminSection('sermons');toast(s.published?'Sermon published':'Sermon unpublished','','success')}
}

/* ── MEDIA GALLERY MODULE ───────────────────── */
function adminMediaHTML(){
  const media=DB.get('media',[]);
  const cats=['All','Worship','Events','Community','Youth','Other'];
  const cards=media.map(m=>'<div class="card" style="overflow:hidden">'+
    '<div style="background:var(--bg2);height:140px;display:flex;align-items:center;justify-content:center;font-size:3rem;position:relative;overflow:hidden">'+
      (m.url?'<img src="'+m.url+'" alt="'+(m.title||'Gallery photo').replace(/"/g,'&quot;')+'" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display=\'none\'"/>':'📷')+
    '</div>'+
    '<div class="card-body" style="padding:12px 14px">'+
      '<div class="font-bold text-sm" style="margin-bottom:4px">'+m.title+'</div>'+
      '<div class="text-xs text-dim" style="margin-bottom:10px">'+m.category+' · '+fmtDate(m.createdAt)+'</div>'+
      '<div style="display:flex;gap:6px">'+
        (m.url?'<a href="'+m.url+'" target="_blank" class="btn btn-sm btn-outline">👁 View</a>':'')+
        '<button class="btn btn-sm btn-danger" onclick="deleteRecord(\'media\',\''+m.id+'\')">Delete</button>'+
      '</div>'+
    '</div>'+
  '</div>').join('');

  return '<div>'+
    '<div class="flex items-center justify-between flex-wrap gap-3" style="margin-bottom:20px">'+
      '<h2 class="section-title">📷 Media Gallery ('+media.length+')</h2>'+
      '<button class="btn btn-primary btn-sm" onclick="showAddMediaForm()">+ Upload Media</button>'+
    '</div>'+
    '<div class="card" id="add-media-panel" style="display:none;margin-bottom:22px">'+
      '<div class="card-header"><div class="font-bold">📷 Add Media Item</div></div>'+
      '<div class="card-body">'+
        '<div class="form-row">'+
          '<div class="form-group"><label class="form-label">Title *</label><input class="form-input" id="med-title" placeholder="Image or video title"/></div>'+
          '<div class="form-group"><label class="form-label">Category</label><select class="form-select" id="med-cat"><option value="Worship">Worship</option><option value="Events">Events</option><option value="Community">Community</option><option value="Youth">Youth</option><option value="Other">Other</option></select></div>'+
        '</div>'+
        '<div class="form-group"><label class="form-label">Media URL *<span> (Image or Video link)</span></label><input class="form-input" id="med-url" placeholder="https://... (direct image URL or YouTube link)"/></div>'+
        '<div class="form-group"><label class="form-label">Type</label><select class="form-select" id="med-type"><option value="image">🖼️ Image</option><option value="video">🎥 Video</option></select></div>'+
        '<div class="form-group"><label class="form-label">Description <span>(Optional)</span></label><textarea class="form-textarea" id="med-desc" rows="2" placeholder="Caption or description..."></textarea></div>'+
        '<div style="display:flex;gap:10px;margin-top:6px">'+
          '<button class="btn btn-outline" onclick="hideAddMediaForm()">Cancel</button>'+
          '<button class="btn btn-primary" onclick="saveMedia()">📷 Add to Gallery</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
    (media.length?
      '<div class="grid-3">'+cards+'</div>':
      '<div class="empty-state"><div class="empty-state-emoji">📷</div><h3>No media yet</h3><p>Upload your first image or video above.</p></div>'
    )+
  '</div>';
}
function showAddMediaForm(){const p=document.getElementById('add-media-panel');if(p)p.style.display='block'}
function hideAddMediaForm(){const p=document.getElementById('add-media-panel');if(p)p.style.display='none'}
function saveMedia(){
  const title=(document.getElementById('med-title')||{value:''}).value.trim();
  const url=(document.getElementById('med-url')||{value:''}).value.trim();
  if(!title){toast('Please enter a title','','error');return}
  if(!url){toast('Please enter a media URL','','error');return}
  DB.push('media',{id:uid(),title,url,
    category:(document.getElementById('med-cat')||{value:'Other'}).value,
    type:(document.getElementById('med-type')||{value:'image'}).value,
    description:(document.getElementById('med-desc')||{value:''}).value.trim(),
    createdAt:new Date().toISOString()
  });
  renderAdminSection('media');
  toast('Media added to gallery 📷','','success');
}

/* ── ANNOUNCEMENTS MODULE ───────────────────── */
function adminAnnouncementsHTML(){
  const announcements=DB.get('announcements',[]);
  const prioBadge=p=>({high:'badge-rose',medium:'badge-yellow',low:'badge-gray'}[p]||'badge-gray');

  return '<div>'+
    '<div class="flex items-center justify-between flex-wrap gap-3" style="margin-bottom:20px">'+
      '<h2 class="section-title">📢 Announcements ('+announcements.length+')</h2>'+
      '<button class="btn btn-primary btn-sm" onclick="showAddAnnouncementForm()">+ New Announcement</button>'+
    '</div>'+
    '<div class="card" id="add-ann-panel" style="display:none;margin-bottom:22px">'+
      '<div class="card-header"><div class="font-bold">📢 Create Announcement</div></div>'+
      '<div class="card-body">'+
        '<div class="form-group"><label class="form-label">Title *</label><input class="form-input" id="ann-title" placeholder="Announcement title"/></div>'+
        '<div class="form-group"><label class="form-label">Content *</label><textarea class="form-textarea" id="ann-content" rows="4" placeholder="Full announcement content..."></textarea></div>'+
        '<div class="form-row">'+
          '<div class="form-group"><label class="form-label">Priority</label><select class="form-select" id="ann-priority"><option value="high">🔴 High</option><option value="medium" selected>🟡 Medium</option><option value="low">🟢 Low</option></select></div>'+
          '<div class="form-group"><label class="form-label">Expiry Date <span>(Optional)</span></label><input class="form-input" type="date" id="ann-expiry"/></div>'+
        '</div>'+
        '<div style="display:flex;gap:10px;margin-top:6px">'+
          '<button class="btn btn-outline" onclick="hideAddAnnouncementForm()">Cancel</button>'+
          '<button class="btn btn-primary" onclick="saveAnnouncement()">📢 Publish Announcement</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;flex-direction:column;gap:14px">'+
      announcements.map(a=>'<div class="card">'+
        '<div class="card-header">'+
          '<div class="flex items-center justify-between flex-wrap gap-2">'+
            '<div class="flex items-center gap-2"><span class="badge '+prioBadge(a.priority)+'">'+a.priority+' priority</span>'+
            (a.expiry&&new Date(a.expiry)<new Date()?'<span class="badge badge-gray">Expired</span>':'<span class="badge badge-green">Active</span>')+
            '</div>'+
            '<div style="display:flex;gap:6px">'+
              '<button class="btn btn-sm btn-danger" onclick="deleteRecord(\'announcements\',\''+a.id+'\')">Delete</button>'+
            '</div>'+
          '</div>'+
          '<div style="font-weight:700;margin-top:9px;font-size:1rem">'+a.title+'</div>'+
          '<div class="text-xs text-dim">Published '+fmtDate(a.createdAt)+(a.expiry?' · Expires '+fmtDate(a.expiry):' · No expiry')+'</div>'+
        '</div>'+
        '<div class="card-body"><p class="text-dim text-sm" style="line-height:1.7">'+a.content+'</p></div>'+
      '</div>').join('')+
      (announcements.length?'':'<div class="empty-state"><div class="empty-state-emoji">📢</div><h3>No announcements yet</h3><p>Create your first announcement above.</p></div>')+
    '</div>'+
  '</div>';
}
function showAddAnnouncementForm(){const p=document.getElementById('add-ann-panel');if(p)p.style.display='block'}
function hideAddAnnouncementForm(){const p=document.getElementById('add-ann-panel');if(p)p.style.display='none'}
function saveAnnouncement(){
  const title=(document.getElementById('ann-title')||{value:''}).value.trim();
  const content=(document.getElementById('ann-content')||{value:''}).value.trim();
  if(!title){toast('Please enter a title','','error');return}
  if(!content){toast('Please enter the announcement content','','error');return}
  DB.push('announcements',{id:uid(),title,content,
    priority:(document.getElementById('ann-priority')||{value:'medium'}).value,
    expiry:(document.getElementById('ann-expiry')||{value:''}).value||'',
    createdAt:new Date().toISOString()
  });
  renderAdminSection('announcements');
  toast('Announcement published 📢','It is now visible on the website.','success');
}

/* ── EMAIL NOTIFICATIONS MODULE ─────────────── */
function adminNewsletterHTML(){
  const history=DB.get('emailHistory',[]);
  const members=DB.get('members',[]).filter(m=>m.status==='approved'&&m.email);

  return '<div>'+
    '<h2 class="section-title" style="margin-bottom:20px">📧 Email Notifications</h2>'+
    '<div class="grid-2" style="margin-bottom:24px">'+
      '<div class="card">'+
        '<div class="card-header"><div class="font-bold">✉️ Compose Email Draft</div></div>'+
        '<div class="card-body">'+
          '<div class="form-group"><label class="form-label">Recipients</label>'+
            '<select class="form-select" id="em-recipients">'+
              '<option value="all">📋 All Members ('+members.length+' with email)</option>'+
              '<option value="approved">✅ Approved Members Only</option>'+
              '<option value="test">🧪 Test (Admin only)</option>'+
            '</select></div>'+
          '<div class="form-group"><label class="form-label">Template</label>'+
            '<select class="form-select" id="em-template" onchange="loadEmailTemplate(this.value)">'+
              '<option value="custom">✍️ Custom Message</option>'+
              '<option value="event">📅 Event Reminder</option>'+
              '<option value="prayer">🙏 Prayer Update</option>'+
              '<option value="bulletin">📰 Weekly Bulletin</option>'+
              '<option value="welcome">👋 Welcome Message</option>'+
            '</select></div>'+
          '<div class="form-group"><label class="form-label">Subject *</label><input class="form-input" id="em-subject" placeholder="Email subject"/></div>'+
          '<div class="form-group"><label class="form-label">Message *</label><textarea class="form-textarea" id="em-body" rows="7" placeholder="Write your message here..."></textarea></div>'+
          '<button class="btn btn-blue btn-full" onclick="sendEmail()">💾 Save Email Draft</button>'+
        '</div>'+
      '</div>'+
      '<div>'+
        '<div class="card" style="margin-bottom:14px">'+
          '<div class="card-header"><div class="font-bold">📊 Email Stats</div></div>'+
          '<div class="card-body" style="display:flex;flex-direction:column;gap:10px">'+
            '<div class="flex items-center justify-between"><span class="text-dim text-sm">Drafts Saved</span><strong>'+history.length+'</strong></div>'+
            '<div class="flex items-center justify-between"><span class="text-dim text-sm">Members with Email</span><strong>'+members.length+'</strong></div>'+
          '</div>'+
        '</div>'+
        '<div class="card">'+
          '<div class="card-header"><div class="font-bold">📜 Draft History</div></div>'+
          '<div style="max-height:280px;overflow-y:auto">'+
            (history.length?history.map(h=>'<div style="padding:11px 16px;border-bottom:1px solid var(--border2)">'+
              '<div class="font-semibold text-sm">'+h.subject+'</div>'+
              '<div class="text-xs text-dim">'+fmtDate(h.savedAt||h.sentAt)+' · Draft · Audience: '+h.recipients+' · '+h.count+' matching members</div>'+
            '</div>').join(''):
            '<div style="padding:22px;text-align:center;color:var(--text-muted);font-size:13px">No email drafts saved yet</div>')+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>';
}
function loadEmailTemplate(tpl){
  const templates={
    event:{subject:'📅 Upcoming ICF Event – Don\'t Miss Out!',body:'Dear Church Family,\n\nWe are excited to announce an upcoming event at ICF Solution Centre.\n\nPlease check our website for full details and join us for a time of fellowship and worship.\n\nGod bless you,\nICF Gambia Team'},
    prayer:{subject:'🙏 Prayer Update from ICF Gambia',body:'Dear Prayer Partner,\n\nThank you for your faithful prayers. We have exciting prayer testimonies to share.\n\nContinue standing in faith as we believe God together.\n\nIn His service,\nICF Prayer Team'},
    bulletin:{subject:'📰 ICF Weekly Bulletin',body:'Dear ICF Family,\n\nHere is your weekly bulletin:\n\n📅 SUNDAY SERVICE: 10:00 AM – 12:00 Noon\n📖 WEDNESDAY DISCIPLESHIP: 6:00 PM – 7:00 PM\n🙏 FRIDAY PRAYER: 6:00 PM – 8:00 PM\n\nMay God bless you richly this week!\n\nICF Solution Centre'},
    welcome:{subject:'👋 Welcome to ICF Gambia!',body:'Dear New Member,\n\nWelcome to the ICF Gambia family! We are so glad you have joined us.\n\nYour registration has been received and is pending approval. We will contact you soon.\n\nService Times:\n• Sunday: 10:00 AM – 12:00 Noon\n• Wednesday: 6:00 PM – 7:00 PM\n• Friday: 6:00 PM – 8:00 PM\n\nGod bless you!\nPastor Mrs. Cecilia Romano'},
    custom:{subject:'',body:''}
  };
  const t=templates[tpl]||templates.custom;
  const s=document.getElementById('em-subject');if(s)s.value=t.subject;
  const b=document.getElementById('em-body');if(b)b.value=t.body;
}
function sendEmail(){
  const subject=(document.getElementById('em-subject')||{value:''}).value.trim();
  const body=(document.getElementById('em-body')||{value:''}).value.trim();
  const recip=(document.getElementById('em-recipients')||{value:'all'}).value;
  if(!subject){toast('Please enter a subject','','error');return}
  if(!body){toast('Please enter a message','','error');return}
  const members=DB.get('members',[]);
  const count=recip==='test'?1:members.filter(m=>m.email&&(recip==='all'||m.status==='approved')).length;
  const history=DB.get('emailHistory',[]);
  history.unshift({id:uid(),subject,body,recipients:recip,count,status:'draft',savedAt:new Date().toISOString()});
  DB.set('emailHistory',history);
  renderAdminSection('newsletter');
  toast('Email draft saved','No email was sent. Connect an approved email delivery provider before sending messages to members.','info');
}

/* ── LIVESTREAM MODULE ──────────────────────── */
function adminLivestreamHTML(){
  const ls=DB.get('livestream',{active:false,title:'',youtubeUrl:'',facebookUrl:'',description:'',scheduledAt:''});

  return '<div>'+
    '<h2 class="section-title" style="margin-bottom:20px">🎥 Livestream Manager</h2>'+
    '<div class="grid-2">'+
      '<div>'+
        '<div class="card" style="margin-bottom:16px;border-color:'+(ls.active?'rgba(22,163,74,0.4)':'var(--border2)')+'">'+
          '<div class="card-header">'+
            '<div class="flex items-center gap-2">'+
              '<div style="width:10px;height:10px;border-radius:50%;background:'+(ls.active?'var(--green)':'var(--text-muted)')+(ls.active?';animation:pulse 1.5s infinite':'')+'"></div>'+
              '<div class="font-bold">'+(ls.active?'🔴 LIVE NOW':'⚫ Stream Offline')+'</div>'+
            '</div>'+
          '</div>'+
          '<div class="card-body">'+
            (ls.active&&ls.youtubeUrl?'<div style="position:relative;padding-bottom:56.25%;height:0;margin-bottom:14px"><iframe src="'+ls.youtubeUrl.replace('watch?v=','embed/')+'" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:8px" allowfullscreen></iframe></div>':'<div style="background:var(--bg2);border-radius:8px;height:160px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;margin-bottom:14px">🎥</div>')+
            (ls.active?'<div class="font-bold" style="margin-bottom:4px">'+ls.title+'</div><div class="text-dim text-sm">'+ls.description+'</div>':'<p class="text-dim text-sm">No active stream. Configure and start a stream below.</p>')+
          '</div>'+
          (ls.active?'<div class="card-header"><button class="btn btn-danger btn-full" onclick="stopLivestream()">⏹ Stop Stream</button></div>':'')+
        '</div>'+
      '</div>'+
      '<div class="card">'+
        '<div class="card-header"><div class="font-bold">⚙️ Configure Stream</div></div>'+
        '<div class="card-body">'+
          '<div class="form-group"><label class="form-label">Stream Title *</label><input class="form-input" id="ls-title" value="'+escH(ls.title||'')+'" placeholder="E.g. Sunday Worship Service – Live"/></div>'+
          '<div class="form-group"><label class="form-label">YouTube URL</label><input class="form-input" id="ls-youtube" value="'+escH(ls.youtubeUrl||'')+'" placeholder="https://youtube.com/watch?v=..."/></div>'+
          '<div class="form-group"><label class="form-label">Facebook URL</label><input class="form-input" id="ls-facebook" value="'+escH(ls.facebookUrl||'')+'" placeholder="https://facebook.com/..."/></div>'+
          '<div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="ls-desc" rows="3" placeholder="What is this stream about?">'+escH(ls.description||'')+'</textarea></div>'+
          '<div class="form-group"><label class="form-label">Scheduled Time <span>(Optional)</span></label><input class="form-input" type="datetime-local" id="ls-schedule" value="'+escH(ls.scheduledAt||'')+'"/></div>'+
          '<div style="display:flex;gap:10px;margin-top:6px">'+
            '<button class="btn btn-outline" onclick="saveLivestreamConfig()">💾 Save Config</button>'+
            '<button class="btn btn-primary" onclick="startLivestream()">🔴 Go Live</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="card" style="margin-top:16px">'+
      '<div class="card-header"><div class="font-bold">📋 Stream Instructions</div></div>'+
      '<div class="card-body text-sm text-dim" style="display:flex;flex-direction:column;gap:7px">'+
        '<div>1. Start your stream on YouTube or Facebook Studio first.</div>'+
        '<div>2. Copy the live stream URL and paste it above.</div>'+
        '<div>3. Click "Go Live" — the stream will appear on the website homepage instantly.</div>'+
        '<div>4. Click "Stop Stream" when the service ends to remove it from the website.</div>'+
      '</div>'+
    '</div>'+
  '</div>';
}
function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function saveLivestreamConfig(){
  const ls=DB.get('livestream',{});
  ls.title=(document.getElementById('ls-title')||{value:''}).value.trim();
  ls.youtubeUrl=(document.getElementById('ls-youtube')||{value:''}).value.trim();
  ls.facebookUrl=(document.getElementById('ls-facebook')||{value:''}).value.trim();
  ls.description=(document.getElementById('ls-desc')||{value:''}).value.trim();
  ls.scheduledAt=(document.getElementById('ls-schedule')||{value:''}).value;
  DB.set('livestream',ls);
  toast('Stream configuration saved','','success');
}
function startLivestream(){
  saveLivestreamConfig();
  const ls=DB.get('livestream',{});
  if(!ls.title){toast('Please enter a stream title','','error');return}
  ls.active=true;ls.startedAt=new Date().toISOString();
  DB.set('livestream',ls);
  renderAdminSection('livestream');
  toast('Stream is now LIVE 🔴','It is visible on the website homepage.','success');
}
function stopLivestream(){
  const ls=DB.get('livestream',{});
  ls.active=false;ls.startedAt='';
  DB.set('livestream',ls);
  renderAdminSection('livestream');
  toast('Stream stopped','Removed from public website.','info');
}

/* ── ANALYTICS MODULE ───────────────────────── */
function adminAnalyticsHTML(){
  const prayers=DB.get('prayers',[]);
  const baptisms=DB.get('baptisms',[]);
  const events=DB.get('events',[]);
  const members=DB.get('members',[]);
  const sermons=DB.get('sermons',[]);
  const media=DB.get('media',[]);
  const announcements=DB.get('announcements',[]);
  const approved=members.filter(m=>m.status==='approved').length;
  const pending=members.filter(m=>m.status==='pending').length;
  const answered=prayers.filter(p=>p.status==='answered').length;
  const pubSermons=sermons.filter(s=>s.published).length;

  // Build simple bar chart using CSS
  const maxVal=Math.max(members.length,prayers.length,baptisms.length,events.length,sermons.length,1);
  function bar(label,val,color){
    const pct=Math.round((val/maxVal)*100);
    return '<div style="margin-bottom:16px">'+
      '<div class="flex items-center justify-between" style="margin-bottom:5px">'+
        '<span class="text-sm font-semibold">'+label+'</span>'+
        '<span class="text-sm font-bold">'+val+'</span>'+
      '</div>'+
      '<div style="background:var(--border2);border-radius:999px;height:10px;overflow:hidden">'+
        '<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:999px;transition:width .6s ease"></div>'+
      '</div>'+
    '</div>';
  }

  // Weekly activity (last 7 days)
  const now=Date.now();
  const weekMs=7*24*60*60*1000;
  const recentPrayers=prayers.filter(p=>now-new Date(p.createdAt).getTime()<weekMs).length;
  const recentMembers=members.filter(m=>now-new Date(m.joinedAt).getTime()<weekMs).length;
  const recentBaptisms=baptisms.filter(b=>now-new Date(b.createdAt).getTime()<weekMs).length;

  return '<div>'+
    '<h2 class="section-title" style="margin-bottom:20px">📊 Analytics &amp; Insights</h2>'+
    '<div class="admin-stats" style="margin-bottom:24px">'+
      '<div class="admin-stat"><div class="admin-stat-value">'+members.length+'</div><div class="admin-stat-label">👥 Total Members</div></div>'+
      '<div class="admin-stat" style="border-color:rgba(22,163,74,0.3)"><div class="admin-stat-value" style="color:var(--green)">'+approved+'</div><div class="admin-stat-label">✅ Active Members</div></div>'+
      '<div class="admin-stat" style="border-color:rgba(217,119,6,0.3)"><div class="admin-stat-value" style="color:var(--amber)">'+pending+'</div><div class="admin-stat-label">⏳ Pending Approval</div></div>'+
      '<div class="admin-stat"><div class="admin-stat-value">'+prayers.length+'</div><div class="admin-stat-label">🙏 Total Prayers</div></div>'+
      '<div class="admin-stat" style="border-color:rgba(22,163,74,0.3)"><div class="admin-stat-value" style="color:var(--green)">'+answered+'</div><div class="admin-stat-label">✅ Answered Prayers</div></div>'+
      '<div class="admin-stat"><div class="admin-stat-value">'+baptisms.length+'</div><div class="admin-stat-label">💧 Baptism Bookings</div></div>'+
      '<div class="admin-stat"><div class="admin-stat-value">'+events.length+'</div><div class="admin-stat-label">📅 Events Created</div></div>'+
      '<div class="admin-stat"><div class="admin-stat-value">'+pubSermons+'</div><div class="admin-stat-label">📖 Published Sermons</div></div>'+
    '</div>'+
    '<div class="grid-2">'+
      '<div class="card">'+
        '<div class="card-header"><div class="font-bold">📈 Ministry Overview</div></div>'+
        '<div class="card-body">'+
          bar('👥 Members',members.length,'var(--blue-g)')+
          bar('🙏 Prayer Requests',prayers.length,'var(--rose)')+
          bar('💧 Baptisms',baptisms.length,'var(--cyan)')+
          bar('📅 Events',events.length,'var(--amber)')+
          bar('📖 Sermons',sermons.length,'var(--purple)')+
          bar('📷 Media Items',media.length,'var(--green)')+
        '</div>'+
      '</div>'+
      '<div>'+
        '<div class="card" style="margin-bottom:14px">'+
          '<div class="card-header"><div class="font-bold">⚡ This Week (Last 7 Days)</div></div>'+
          '<div class="card-body" style="display:flex;flex-direction:column;gap:12px">'+
            '<div class="flex items-center justify-between"><span class="text-dim">New Members</span><span class="badge badge-green">+'+recentMembers+'</span></div>'+
            '<div class="flex items-center justify-between"><span class="text-dim">Prayer Requests</span><span class="badge badge-rose">+'+recentPrayers+'</span></div>'+
            '<div class="flex items-center justify-between"><span class="text-dim">Baptism Bookings</span><span class="badge badge-blue">+'+recentBaptisms+'</span></div>'+
          '</div>'+
        '</div>'+
        '<div class="card">'+
          '<div class="card-header"><div class="font-bold">📋 Content Summary</div></div>'+
          '<div class="card-body" style="display:flex;flex-direction:column;gap:10px">'+
            '<div class="flex items-center justify-between text-sm"><span class="text-dim">Announcements</span><strong>'+announcements.length+'</strong></div>'+
            '<div class="flex items-center justify-between text-sm"><span class="text-dim">Media Gallery Items</span><strong>'+media.length+'</strong></div>'+
            '<div class="flex items-center justify-between text-sm"><span class="text-dim">Total Sermons</span><strong>'+sermons.length+'</strong></div>'+
            '<div class="flex items-center justify-between text-sm"><span class="text-dim">Published Sermons</span><strong>'+pubSermons+'</strong></div>'+
            '<div class="flex items-center justify-between text-sm"><span class="text-dim">Upcoming Events</span><strong>'+events.filter(e=>new Date(e.date)>new Date()).length+'</strong></div>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>';
}

/* ── FULL SETTINGS MODULE ───────────────────── */
function adminSettingsHTMLFull(){
  const settings=DB.get('siteSettings',{
    churchName:'International Christian Fellowship',
    branch:'Solution Centre',
    address:'Mariama Kunda, Kombo North, The Gambia',
    phone:'+220 9526987',
    email:'info@icfgambia.org',
    welcomeMsg:'Welcome and thank you for your visit today. We are delighted to have you visit International Christian Fellowship Solution Centre.',
    themeMode:'dark'
  });
  const admins=DB.get('members',[]).filter(m=>m.role==='admin');

  return '<div>'+
    '<h2 class="section-title" style="margin-bottom:22px">⚙️ Settings</h2>'+

    /* Church Info */
    '<div class="card" style="max-width:680px;margin-bottom:18px">'+
      '<div class="card-header"><div class="font-bold">🏛️ Church Information</div></div>'+
      '<div class="card-body">'+
        '<div class="form-row">'+
          '<div class="form-group"><label class="form-label">Church Name</label><input class="form-input" id="cfg-name" value="'+escH(settings.churchName)+'"/></div>'+
          '<div class="form-group"><label class="form-label">Branch Name</label><input class="form-input" id="cfg-branch" value="'+escH(settings.branch)+'"/></div>'+
        '</div>'+
        '<div class="form-group"><label class="form-label">Address</label><input class="form-input" id="cfg-address" value="'+escH(settings.address)+'"/></div>'+
        '<div class="form-row">'+
          '<div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="cfg-phone" value="'+escH(settings.phone)+'"/></div>'+
          '<div class="form-group"><label class="form-label">Email</label><input class="form-input" id="cfg-email" value="'+escH(settings.email)+'"/></div>'+
        '</div>'+
        '<div class="form-group"><label class="form-label">Welcome Message</label><textarea class="form-textarea" id="cfg-welcome" rows="3">'+escH(settings.welcomeMsg)+'</textarea></div>'+
        '<button class="btn btn-primary" onclick="saveChurchSettings()">💾 Save Church Info</button>'+
      '</div>'+
    '</div>'+

    /* Theme Settings */
    '<div class="card" style="max-width:680px;margin-bottom:18px">'+
      '<div class="card-header"><div class="font-bold">🎨 Theme Settings</div></div>'+
      '<div class="card-body">'+
        '<div class="form-group"><label class="form-label">Website Theme</label>'+
          '<div style="display:flex;gap:10px;margin-top:6px">'+
            '<button class="btn '+(document.body.getAttribute('data-theme')==='light'?'btn-primary':'btn-outline')+'" onclick="applyTheme(\'light\')">☀️ Light Mode</button>'+
            '<button class="btn '+(document.body.getAttribute('data-theme')==='dark'?'btn-primary':'btn-outline')+'" onclick="applyTheme(\'dark\')">🌙 Dark Mode</button>'+
          '</div>'+
        '</div>'+
        '<p class="text-dim text-sm">Theme preference is saved and applied immediately across the entire website.</p>'+
      '</div>'+
    '</div>'+

    /* Admin Management */
    '<div class="card" style="max-width:680px;margin-bottom:18px">'+
      '<div class="card-header"><div class="font-bold">👤 Admin Management</div></div>'+
      '<div class="card-body">'+
        '<p class="text-dim text-sm" style="margin-bottom:14px">Current admin accounts:</p>'+
        '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">'+
          admins.map(a=>'<div class="flex items-center justify-between" style="background:var(--bg2);padding:10px 14px;border-radius:8px">'+
            '<div><div class="font-semibold text-sm">'+a.name+'</div><div class="text-xs text-dim">'+a.email+'</div></div>'+
            '<span class="badge badge-gold">Admin</span>'+
          '</div>').join('')+
          (!admins.length?'<p class="text-dim text-sm">No admin accounts found.</p>':'')+
        '</div>'+
        '<div class="sep"></div>'+
        '<p class="text-dim text-sm" style="margin-bottom:10px">Default login credentials:</p>'+
        '<p class="text-sm">Administrator email: the account configured in Supabase.</p>'+
        '<p class="text-sm" style="margin-top:5px">Password: set securely in Supabase Authentication.</p>'+
      '</div>'+
    '</div>'+

    /* Danger Zone */
    '<div class="card" style="max-width:680px;border-color:rgba(220,38,38,0.25)">'+
      '<div class="card-header"><div class="font-bold text-sm" style="color:var(--red)">⚠️ Danger Zone</div></div>'+
      '<div class="card-body">'+
        '<p class="text-dim text-sm" style="margin-bottom:14px">Clear all stored data and reset to defaults. This cannot be undone.</p>'+
        '<button class="btn btn-danger" onclick="clearAllData()">🗑️ Reset All Data</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}
function saveChurchSettings(){
  const s=DB.get('siteSettings',{});
  s.churchName=(document.getElementById('cfg-name')||{value:''}).value.trim()||s.churchName;
  s.branch=(document.getElementById('cfg-branch')||{value:''}).value.trim()||s.branch;
  s.address=(document.getElementById('cfg-address')||{value:''}).value.trim()||s.address;
  s.phone=(document.getElementById('cfg-phone')||{value:''}).value.trim()||s.phone;
  s.email=(document.getElementById('cfg-email')||{value:''}).value.trim()||s.email;
  s.welcomeMsg=(document.getElementById('cfg-welcome')||{value:''}).value.trim()||s.welcomeMsg;
  DB.set('siteSettings',s);
  toast('Church settings saved ✅','Changes reflected across the website.','success');
}
function applyTheme(mode){
  document.body.setAttribute('data-theme',mode);
  _store.setItem('icf_theme',mode);
  const btn=document.getElementById('theme-btn');
  if(btn)btn.textContent=mode==='dark'?'☀️':'🌙';
  renderAdminSection('settings');
  toast('Theme set to '+(mode==='dark'?'Dark':'Light')+' Mode','','success');
}

/* ── PUBLIC PAGES FOR SYNCED DATA ───────────── */
function renderSermons(){
  const sermons=DB.get('sermons',[]).filter(s=>s.published);
  const grid=document.getElementById('sermons-grid');
  if(!grid)return;
  if(!sermons.length){
    grid.innerHTML='<div class="empty-state"><div class="empty-state-emoji">📖</div><h3>No sermons yet</h3><p>Check back soon for uploaded sermons.</p></div>';
    return;
  }
  const catBadge=c=>({sunday:'badge-gold',wednesday:'badge-blue',special:'badge-rose',series:'badge-purple',other:'badge-gray'}[c]||'badge-gray');
  grid.innerHTML=sermons.map(s=>'<div class="card">'+
    '<div class="card-body">'+
      '<div style="display:flex;align-items:flex-start;gap:14px">'+
        '<div style="font-size:2.2rem;flex-shrink:0">📖</div>'+
        '<div style="flex:1">'+
          '<span class="badge '+catBadge(s.category)+'" style="margin-bottom:8px;display:inline-flex">'+s.category+'</span>'+
          '<div class="font-bold" style="font-size:1.02rem;margin-bottom:4px">'+s.title+'</div>'+
          '<div class="text-dim text-sm" style="margin-bottom:6px">🎤 '+s.preacher+' &nbsp;·&nbsp; 📅 '+fmtDate(s.date)+'</div>'+
          (s.description?'<p class="text-dim text-sm" style="line-height:1.6;margin-bottom:10px">'+s.description+'</p>':'')+
          '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
            (s.videoUrl?'<a href="'+s.videoUrl+'" target="_blank" class="btn btn-sm btn-outline-rose">▶ Watch</a>':'')+
            (s.audioUrl?'<a href="'+s.audioUrl+'" target="_blank" class="btn btn-sm btn-outline-gold">🎵 Listen</a>':'')+
            (s.pdfUrl?'<a href="'+s.pdfUrl+'" target="_blank" class="btn btn-sm btn-outline">📄 Notes</a>':'')+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>').join('');
}

let galleryActiveFilter='All';
function renderGalleryFilters(media){
  const bar=document.getElementById('gallery-filters');
  if(!bar)return;
  const cats=['All',...Array.from(new Set(media.map(m=>m.category))).sort()];
  bar.innerHTML=cats.map(c=>{
    const active=c===galleryActiveFilter;
    return '<button class="badge '+(active?'badge-gold':'badge-gray')+'" style="cursor:pointer;border:1px solid;padding:6px 13px;font-size:12px" onclick="setGalleryFilter('+JSON.stringify(c).replace(/"/g,'&quot;')+')">'+c+'</button>';
  }).join('');
}
function setGalleryFilter(c){galleryActiveFilter=c;renderGallery();}
function renderGallery(){
  const media=DB.get('media',[]);
  const grid=document.getElementById('gallery-grid');
  if(!grid)return;
  renderGalleryFilters(media);
  if(!media.length){
    grid.innerHTML='<div class="empty-state"><div class="empty-state-emoji">📷</div><h3>No media yet</h3><p>Check back soon for photos and videos.</p></div>';
    return;
  }
  const filtered=galleryActiveFilter==='All'?media:media.filter(m=>m.category===galleryActiveFilter);
  if(!filtered.length){
    grid.innerHTML='<div class="empty-state"><div class="empty-state-emoji">📷</div><h3>No photos in this category yet</h3></div>';
    return;
  }
  grid.innerHTML=filtered.map(m=>'<div class="card" style="overflow:hidden;cursor:pointer" onclick="openLightbox(\''+m.id+'\')">'+
    '<div style="height:190px;background:var(--bg2);overflow:hidden;display:flex;align-items:center;justify-content:center">'+
      (m.url?'<img src="'+m.url+'" alt="'+(m.alt||m.title||'Gallery photo').replace(/"/g,'&quot;')+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML=\'📷\'" loading="lazy"/>':'<span style="font-size:2.5rem">📷</span>')+
    '</div>'+
    '<div style="padding:10px 14px">'+
      '<div class="font-semibold text-sm">'+m.title+'</div>'+
      '<div class="text-xs text-dim">'+m.category+(m.eventLabel?' · '+m.eventLabel:'')+'</div>'+
    '</div>'+
  '</div>').join('');
}

function openLightbox(id){
  const media=DB.get('media',[]);
  const m=media.find(x=>x.id===id);
  if(!m)return;
  const existing=document.getElementById('lightbox-overlay');
  if(existing)existing.remove();
  const div=document.createElement('div');
  div.id='lightbox-overlay';
  div.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px';
  div.onclick=function(e){if(e.target===div)div.remove()};
  div.innerHTML='<div style="max-width:860px;width:100%;text-align:center">'+
    '<button onclick="document.getElementById(\'lightbox-overlay\').remove()" style="position:fixed;top:20px;right:24px;background:none;border:none;color:#fff;font-size:2rem;cursor:pointer">✕</button>'+
    (m.url?'<img src="'+m.url+'" alt="'+(m.alt||m.title||'Gallery photo').replace(/"/g,'&quot;')+'" style="max-width:100%;max-height:80vh;border-radius:10px;object-fit:contain" onerror="this.style.display=\'none\'"/>':'<div style="font-size:5rem">📷</div>')+
    '<div style="color:#fff;margin-top:14px;font-weight:600">'+m.title+'</div>'+
    (m.eventLabel?'<div style="color:var(--gold);font-size:11.5px;margin-top:4px;font-weight:600">'+m.eventLabel+'</div>':'')+
    (m.description?'<div style="color:rgba(255,255,255,0.65);font-size:13px;margin-top:6px;max-width:640px;margin-left:auto;margin-right:auto">'+m.description+'</div>':'')+
  '</div>';
  document.body.appendChild(div);
}

function renderAnnouncements(){
  const announcements=DB.get('announcements',[]).filter(a=>!a.expiry||new Date(a.expiry)>=new Date()).slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  const grid=document.getElementById('announcements-grid');
  if(!grid)return;
  if(!announcements.length){
    grid.innerHTML='<div class="empty-state"><div class="empty-state-emoji">📢</div><h3>No announcements</h3><p>Check back soon for updates from the church.</p></div>';
    return;
  }
  const prioBadge=p=>({high:'badge-rose',medium:'badge-yellow',low:'badge-green'}[p]||'badge-gray');
  grid.innerHTML=announcements.map(a=>'<div class="card">'+
    '<div class="card-header">'+
      '<div class="flex items-center gap-2" style="margin-bottom:8px"><span class="badge '+prioBadge(a.priority)+'">'+a.priority+'</span></div>'+
      '<div class="font-bold" style="font-size:1rem">'+a.title+'</div>'+
      '<div class="text-xs text-dim">'+fmtDate(a.createdAt)+(a.expiry?' · Expires '+fmtDate(a.expiry):' · No expiry')+'</div>'+
    '</div>'+
    '<div class="card-body"><p class="text-dim text-sm" style="line-height:1.7">'+a.content+'</p></div>'+
  '</div>').join('');
}

function renderLivestreamWidget(){
  const ls=DB.get('livestream',{active:false});
  const widget=document.getElementById('livestream-widget');
  if(!widget)return;
  if(ls.active&&ls.youtubeUrl){
    widget.style.display='block';
    widget.innerHTML='<div class="card" style="margin-bottom:24px;border-color:rgba(239,68,68,0.4)">'+
      '<div class="card-header" style="display:flex;align-items:center;gap:10px">'+
        '<div style="width:10px;height:10px;border-radius:50%;background:#ef4444;animation:pulse 1.5s infinite"></div>'+
        '<div class="font-bold">🔴 LIVE – '+ls.title+'</div>'+
      '</div>'+
      '<div style="position:relative;padding-bottom:56.25%;height:0">'+
        '<iframe src="'+ls.youtubeUrl.replace('watch?v=','embed/')+'" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe>'+
      '</div>'+
      (ls.description?'<div style="padding:12px 16px;color:var(--text-dim);font-size:13px">'+ls.description+'</div>':'')+
    '</div>';
  } else {
    widget.style.display='none';
  }
}


/* ── Fade-in-on-scroll enhancement (additive, safe no-op if no .fade-in-up elements exist) ── */
document.addEventListener('DOMContentLoaded', function(){
  var targets = document.querySelectorAll('.fade-in-up');
  if(!targets.length || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.12});
  targets.forEach(function(el){ io.observe(el); });
});

/* ══════════════════════════════════════════════════════════
   MEMBERSHIP & WORKER'S MANUAL — in-page PDF viewer helpers
   (previously lived on standalone membership.html/workers.html;
   now part of this single-page app)
   ══════════════════════════════════════════════════════════ */
function openFullscreenPDF(frameId){
  var frame = document.getElementById(frameId);
  if(!frame) return;
  var req = frame.requestFullscreen || frame.webkitRequestFullscreen || frame.msRequestFullscreen;
  var fallbackToNewTab = function(){
    window.open(frame.getAttribute('src'), '_blank', 'noopener');
  };
  if(document.fullscreenEnabled === false || !req){
    // Fullscreen is disabled by the embedding context (e.g. a sandboxed preview
    // iframe without allow="fullscreen") or unsupported by this browser.
    fallbackToNewTab();
    return;
  }
  try{
    var result = req.call(frame);
    if(result && typeof result.catch === 'function'){
      result.catch(fallbackToNewTab); // request was rejected by the browser/embedder — fall back
    }
  }catch(e){
    fallbackToNewTab();
  }
}

function sharePDF(url, title){
  var absoluteUrl = url;
  try{
    absoluteUrl = new URL(url, document.baseURI || window.location.href).href;
  }catch(e){
    // Embedding context has no usable base URL (sandboxed preview iframe, webview, etc.)
    // Fall back to the plain relative path — still shareable/copyable, just not resolved
    // to an absolute address in that context.
    absoluteUrl = url;
  }
  if(navigator.share){
    navigator.share({ title: title, url: absoluteUrl }).catch(function(){ /* user cancelled */ });
    return;
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(absoluteUrl).then(function(){
      showPdfToast('Link copied to clipboard');
    }).catch(function(){ showPdfToast(absoluteUrl); });
  } else {
    showPdfToast(absoluteUrl);
  }
}

function showPdfToast(message){
  var toast = document.getElementById('pdfToast');
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showPdfToast._t);
  showPdfToast._t = setTimeout(function(){ toast.classList.remove('show'); }, 2800);
}

/* Fallback message if a PDF iframe fails to render inline */
function watchPdfFrame(frameId, fallbackId){
  var frame = document.getElementById(frameId);
  var fallback = document.getElementById(fallbackId);
  if(!frame || !fallback) return;
  var loaded = false;
  frame.addEventListener('load', function(){ loaded = true; });
  setTimeout(function(){ if(!loaded) fallback.style.display = 'block'; }, 4000);
}
document.addEventListener('DOMContentLoaded', function(){
  watchPdfFrame('membershipPdfFrame','membershipPdfFallback');
  watchPdfFrame('workersPdfFrame','workersPdfFallback');

  var targets = document.querySelectorAll('.fade-in-up');
  if(targets.length && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, {threshold:0.1});
    targets.forEach(function(el){ io.observe(el); });
  } else {
    targets.forEach(function(el){ el.classList.add('is-visible'); });
  }
});


function icfEscapeHtml(value){
  return String(value == null ? '' : value).replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}
function adminContactMessagesHTML(){
  const messages=DB.get('contactMessages',[]);
  const count=messages.length;
  if(!count){
    return '<div><h2 class="section-title" style="margin-bottom:20px">✉️ Contact Messages (0)</h2>'+
      '<div class="empty-state"><div class="empty-state-emoji">✉️</div><h3>No contact messages yet</h3><p>Messages sent through the public contact form will appear here.</p></div></div>';
  }
  const cards=messages.map(function(m){
    const id=icfEscapeHtml(m.id);
    const status=String(m.status || 'new');
    const isResolved=status==='resolved';
    return '<div class="card" style="margin-bottom:14px"><div class="card-header">'+
      '<div class="flex items-center justify-between flex-wrap gap-2"><div class="font-bold">'+icfEscapeHtml(m.subject || 'Website enquiry')+'</div>'+
      '<span class="badge '+(isResolved?'badge-green':'badge-yellow')+'">'+icfEscapeHtml(status)+'</span></div>'+
      '<div class="text-sm text-dim" style="margin-top:7px">'+icfEscapeHtml(m.name)+' · '+icfEscapeHtml(m.email)+
      (m.phone?' · '+icfEscapeHtml(m.phone):'')+'</div><div class="text-xs text-dim" style="margin-top:4px">'+icfEscapeHtml(m.createdAt || '')+'</div></div>'+
      '<div class="card-body"><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+icfEscapeHtml(m.message)+'</p>'+
      '<div class="flex gap-2" style="margin-top:14px"><button class="btn btn-sm btn-outline" onclick="updateContactMessageStatus(\''+id+'\',\''+(isResolved?'new':'resolved')+'\')">'+(isResolved?'Reopen':'Mark resolved')+'</button></div></div></div>';
  }).join('');
  return '<div><h2 class="section-title" style="margin-bottom:20px">✉️ Contact Messages ('+count+')</h2>'+cards+'</div>';
}
function updateContactMessageStatus(id,status){
  const messages=DB.get('contactMessages',[]);
  const item=messages.find(function(m){return String(m.id)===String(id);});
  if(!item)return;
  item.status=status;
  DB.set('contactMessages',messages);
  renderAdminSection('messages');
  toast(status==='resolved'?'Message marked resolved':'Message reopened','','success');
}
window.adminContactMessagesHTML=adminContactMessagesHTML;
window.updateContactMessageStatus=updateContactMessageStatus;


/* Admin-only export: records are fetched into the authenticated dashboard before export. */
window.exportChurchRecords = function () {
  var names = ['members','prayers','baptisms','contactMessages','events','sermons','media','announcements','emailHistory','livestream','siteSettings','enabledLangs'];
  var rows = [['Collection','Record ID','Created At','Record Data']];
  names.forEach(function (name) {
    var records = DB.get(name, []);
    if (!Array.isArray(records)) records = records == null ? [] : [records];
    records.forEach(function (record) {
      rows.push([name, record && (record.id || record.userId) || '', record && (record.createdAt || record.updatedAt) || '', JSON.stringify(record)]);
    });
  });
  function csv(value) {
    var text = String(value == null ? '' : value);
    return '"' + text.replace(/"/g, '""') + '"';
  }
  var content = '\uFEFF' + rows.map(function (row) { return row.map(csv).join(','); }).join('\r\n');
  var blob = new Blob([content], {type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'icf-church-records-' + new Date().toISOString().slice(0,10) + '.csv';
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  if (typeof toast === 'function') toast('Export prepared','Church records CSV downloaded. Keep this file secure.','success');
};
