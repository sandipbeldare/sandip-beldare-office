const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const today = new Date().toISOString().slice(0, 10);
const state = {complaints:[], expenses:[], meetings:[], todos:[], registers:[], letters:[]};
const save = async () => {
  const res = await fetch('/api/data', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});
  if (!res.ok) throw new Error('Could not save your changes.');
};
const domains = ['Water supply', 'Electricity', 'Roads & drainage', 'Personal assistance', 'Health & sanitation', 'Education', 'Housing', 'Other'];
const colors = ['#e96d16','#218d57','#edb54b','#487fc2','#a56fb7','#e06d85','#6f8b78','#ded9d0'];
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const esc = s => String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const initials = n => n.split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase();

function renderDashboard(){
  const open = state.complaints.filter(c => c.status !== 'Resolved');
  const resolved = state.complaints.filter(c => c.status === 'Resolved');
  const totalExpense = state.expenses.reduce((sum, e) => sum + +e.amount, 0);
  $('#openCount').textContent = open.length; $('#openDelta').textContent = open.length ? `${open.length} need${open.length === 1 ? 's' : ''} attention` : 'All clear';
  $('#resolvedCount').textContent = resolved.length; $('#meetingCount').textContent = state.meetings.length; $('#expenseTotal').textContent = money(totalExpense);
  $('#complaintTotal').textContent = state.complaints.length;
  const counts = domains.map(d => ({domain:d,count:state.complaints.filter(c => c.domain === d).length})).filter(x => x.count);
  const total = state.complaints.length || 1; let current = 0;
  $('#donut').style.background = counts.length ? `conic-gradient(${counts.map((x,i) => { const start = current; current += x.count / total * 100; return `${colors[i]} ${start}% ${current}%`;}).join(',')})` : '#eee';
  $('#domainLegend').innerHTML = counts.length ? counts.map((x,i) => `<div class="legend-item"><span><i style="background:${colors[i]}"></i>${esc(x.domain)}</span><b>${x.count}</b></div>`).join('') : '<small>No complaints yet.</small>';
  $('#priorityList').innerHTML = open.slice(0,4).map(c => `<div class="compact-item"><div class="avatar">${initials(c.name)}</div><div><strong>${esc(c.name)}</strong><small>${esc(c.domain)} · ${esc(c.id)}</small></div><span class="status ${c.status === 'Open' ? 'open':'progress'}">${esc(c.status)}</span></div>`).join('') || '<p class="empty">No pending complaints.</p>';
  $('#todaySchedule').innerHTML = state.meetings.slice(0,4).map(m => `<div class="schedule-item ${m.type === 'Task' ? 'green-border':''}"><div class="time">${esc(m.time)}</div><div><strong>${esc(m.title)}</strong><span>${esc(m.type)} · ${esc(m.date)}</span></div></div>`).join('') || '<p class="empty">No meetings or tasks added.</p>';
}
function renderComplaints(){
  const q = $('#complaintSearch').value.toLowerCase(), status = $('#statusFilter').value, domain = $('#domainFilter').value;
  const items = state.complaints.filter(c => `${c.name} ${c.phone} ${c.description}`.toLowerCase().includes(q) && (status === 'all'||c.status===status) && (domain === 'all'||c.domain===domain));
  $('#complaintRows').innerHTML = items.map(c => `<tr><td><strong>${c.id}</strong></td><td><strong>${esc(c.name)}</strong><small>${esc(c.phone)}${c.email ? ' · '+esc(c.email):''}</small></td><td>${esc(c.domain)}</td><td>${esc(c.date)}</td><td><select class="inline-status" data-id="${c.id}"><option ${c.status==='Open'?'selected':''}>Open</option><option ${c.status==='In progress'?'selected':''}>In progress</option><option ${c.status==='Resolved'?'selected':''}>Resolved</option></select></td><td><input class="reply-input" data-id="${c.id}" value="${esc(c.reply)}" placeholder="Add reply / action" /></td></tr>`).join('') || '<tr><td colspan="6" class="empty">No complaints match these filters.</td></tr>';
  $$('.inline-status').forEach(el => el.addEventListener('change', () => {const c=state.complaints.find(x=>x.id===el.dataset.id);c.status=el.value;save();renderAll();toast('Status updated');}));
  $$('.reply-input').forEach(el => el.addEventListener('change', () => {state.complaints.find(x=>x.id===el.dataset.id).reply=el.value;save();toast('Reply saved');}));
}
function renderExpenses(){
 const byCat = {}; state.expenses.forEach(e => byCat[e.category] = (byCat[e.category] || 0)+ +e.amount); const entries=Object.entries(byCat), max=Math.max(...entries.map(x=>x[1]),1), total=state.expenses.reduce((s,e)=>s + +e.amount,0);
 $('#expenseSummary').textContent = `${money(total)} across ${state.expenses.length} expense${state.expenses.length===1?'':'s'}`;
 $('#expenseChart').innerHTML=entries.map(([k,v])=>`<div class="bar-col"><div class="bar" style="height:${v/max*180}px" title="${esc(k)}: ${money(v)}"></div><small>${esc(k)}</small></div>`).join('') || '<p class="empty">Add an expense to see the chart.</p>';
 $('#expenseCategories').innerHTML=entries.map(([k,v])=>`<div class="category-row"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join('') || '<p class="empty">No categories yet.</p>';
 $('#expenseList').innerHTML=state.expenses.slice().reverse().map(e=>`<div class="entry"><div class="entry-icon">₹</div><div class="entry-info"><strong>${esc(e.title)}</strong><span>${esc(e.category)} · ${esc(e.date)}</span></div><div class="entry-side">${money(e.amount)}</div></div>`).join('') || '<p class="empty">No expenses recorded.</p>';
}
function renderMeetings(){
 $('#meetingList').innerHTML=state.meetings.map(m=>`<div class="schedule-item ${m.type==='Task'?'green-border':''}"><div class="time">${esc(m.time)}</div><div><strong>${esc(m.title)}</strong><span>${esc(m.date)} · ${esc(m.type)}</span></div></div>`).join('')||'<p class="empty">Nothing scheduled.</p>';
 $('#todoList').innerHTML=state.todos.map((t,i)=>`<label class="todo ${t.done?'done':''}"><input type="checkbox" data-todo="${i}" ${t.done?'checked':''}><span>${esc(t.title)}</span></label>`).join('')||'<p class="empty">No to-dos.</p>';
 $$('[data-todo]').forEach(e=>e.addEventListener('change',()=>{state.todos[e.dataset.todo].done=e.checked;save();renderMeetings();}));
}
function renderRegisters(){ $('#registerEntries').innerHTML=state.registers.slice().reverse().map(e=>`<div class="entry"><div class="entry-icon">▤</div><div class="entry-info"><strong>${esc(e.title)}</strong><span>${esc(e.register)} · ${esc(e.date)}${e.note?' · '+esc(e.note):''}</span></div></div>`).join('')||'<p class="empty">No register entries yet.</p>'; }
function renderLetters(){ const count=t=>state.letters.filter(x=>x.type===t).length; $('#incomingCount').textContent=count('Incoming');$('#outgoingCount').textContent=count('Outgoing');$('#statementCount').textContent=count('Statement');$('#letterList').innerHTML=state.letters.slice().reverse().map(l=>`<div class="entry"><div class="entry-icon">${l.type==='Incoming'?'↓':l.type==='Outgoing'?'↑':'≡'}</div><div class="entry-info"><strong>${esc(l.title)}</strong><span>${esc(l.party)} · ${esc(l.date)}</span></div><div class="entry-side">${esc(l.type)}</div></div>`).join('')||'<p class="empty">No letters recorded.</p>'; }
function renderAll(){renderDashboard();renderComplaints();renderExpenses();renderMeetings();renderRegisters();renderLetters();}

const fields={
 complaint:`<div class="form-grid"><div class="field"><label>Full name *</label><input name="name" required></div><div class="field"><label>Mobile number *</label><input name="phone" type="tel" required></div><div class="field full"><label>Email address</label><input name="email" type="email"></div><div class="field"><label>Complaint domain *</label><select name="domain" required>${domains.map(d=>`<option>${d}</option>`).join('')}</select></div><div class="field"><label>Status</label><select name="status"><option>Open</option><option>In progress</option><option>Resolved</option></select></div><div class="field full"><label>Complaint description *</label><textarea name="description" required placeholder="Describe the problem clearly..."></textarea></div><div class="field full"><label>Reply / action taken</label><textarea name="reply" placeholder="Optional; can be added later"></textarea></div></div>`,
 expense:`<div class="form-grid"><div class="field full"><label>Expense title *</label><input name="title" required placeholder="e.g. Ward visit transport"></div><div class="field"><label>Amount (₹) *</label><input name="amount" type="number" min="1" required></div><div class="field"><label>Category *</label><select name="category"><option>Office supplies</option><option>Travel</option><option>Events</option><option>Staff</option><option>Utilities</option><option>Public service</option><option>Other</option></select></div><div class="field full"><label>Date</label><input name="date" type="date" value="${today}"></div></div>`,
 meeting:`<div class="form-grid"><div class="field full"><label>Title *</label><input name="title" required placeholder="What needs attention?"></div><div class="field"><label>Type</label><select name="type"><option>Meeting</option><option>Task</option></select></div><div class="field"><label>Time</label><input name="time" value="10:00 AM"></div><div class="field full"><label>Date</label><input name="date" type="date" value="${today}"></div></div>`,
 register:`<div class="form-grid"><div class="field full"><label>Register type *</label><select name="register"><option>Office Complaint</option><option>Office Register</option><option>Outdoor / Outward Office</option><option>Office Expense / Attendance</option></select></div><div class="field full"><label>Entry title *</label><input name="title" required></div><div class="field"><label>Date</label><input name="date" type="date" value="${today}"></div><div class="field full"><label>Note</label><textarea name="note"></textarea></div></div>`,
 letter:`<div class="form-grid"><div class="field full"><label>Subject / letter title *</label><input name="title" required></div><div class="field"><label>Type</label><select name="type"><option>Incoming</option><option>Outgoing</option><option>Statement</option></select></div><div class="field"><label>From / To</label><input name="party"></div><div class="field full"><label>Date</label><input name="date" type="date" value="${today}"></div></div>`
};
let mode='complaint';
function openModal(type){mode=type; const titles={complaint:'Register complaint',expense:'Add an expense',meeting:'Add meeting or task',register:'Add office register entry',letter:'Add letter record'}; $('#modalTitle').textContent=titles[type];$('#formFields').innerHTML=fields[type];$('#modal').classList.add('open');}
function toast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2300)}
async function submit(e){e.preventDefault();const x=Object.fromEntries(new FormData(e.target)); if(mode==='complaint'){x.id='SR-'+String(Math.max(0,...state.complaints.map(c=>+c.id.split('-')[1]))+1).padStart(3,'0');x.date=today;state.complaints.unshift(x)}else if(mode==='expense'){x.amount=+x.amount;state.expenses.push(x)}else if(mode==='meeting'){state.meetings.push(x);if(x.type==='Task')state.todos.unshift({title:x.title,done:false})}else if(mode==='register')state.registers.push(x);else state.letters.push(x);try{await save();$('#modal').classList.remove('open');e.target.reset();renderAll();toast('Entry saved successfully');}catch(err){toast(err.message)}}
function parseCSV(text){ const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);if(lines.length<2)return[];const split=l=>{let a=[],v='',q=false;for(let i=0;i<l.length;i++){if(l[i]==='"')q=!q;else if(l[i]===','&&!q){a.push(v.trim());v=''}else v+=l[i]}a.push(v.trim());return a.map(x=>x.replace(/^"|"$/g,'').replace(/""/g,'"'))};const h=split(lines[0]).map(x=>x.toLowerCase());return lines.slice(1).map(l=>{const r=split(l),get=(...keys)=>{const i=h.findIndex(x=>keys.some(k=>x.includes(k)));return i>-1?r[i]:''};return {name:get('name'),phone:get('phone','mobile','contact'),email:get('email','mail'),domain:get('domain','category','type')||'Other',description:get('description','complaint','message','details'),date:get('timestamp','date')||today,status:'Open',reply:''}}).filter(x=>x.name||x.description)}

$$('.nav-link').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.view;$$('.nav-link').forEach(x=>x.classList.toggle('active',x===b));$$('.view').forEach(x=>x.classList.toggle('active',x.id===v));$('#pageTitle').textContent=v==='dashboard'?'Good morning, Sandip.':b.textContent.trim();$('#sidebar').classList.remove('show');window.scrollTo(0,0)}));
$$('[data-view-go]').forEach(b=>b.addEventListener('click',()=> $(`.nav-link[data-view="${b.dataset.viewGo}"]`).click()));
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.open)));
$$('.register-card').forEach(b=>b.addEventListener('click',()=>{openModal('register');$('select[name="register"]').value=b.dataset.register}));
$('#closeModal').addEventListener('click',()=>$('#modal').classList.remove('open'));$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')$('#modal').classList.remove('open')});$('#entryForm').addEventListener('submit',submit);$('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('show'));
['complaintSearch','statusFilter','domainFilter'].forEach(id=>$('#'+id).addEventListener('input',renderComplaints));
$('#csvInput').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const items=parseCSV(reader.result); if(!items.length)return toast('No responses were found in that CSV.'); const max=Math.max(0,...state.complaints.map(c=>+c.id.split('-')[1]));items.forEach((x,i)=>x.id='SR-'+String(max+i+1).padStart(3,'0'));state.complaints.unshift(...items);save();renderAll();toast(`${items.length} Google Forms response${items.length===1?'':'s'} imported`)};reader.readAsText(file);e.target.value=''});
async function startApp(){
  const status = await fetch('/api/auth/status').then(r=>r.json());
  const setup = status.setup;
  $('#authTitle').textContent = setup ? 'Create administrator account' : 'Admin sign in';
  $('#authText').textContent = setup ? 'Set a strong password. This protects all office records stored on this laptop.' : 'Enter your password to access the office records.';
  $('#authSubmit').textContent = setup ? 'Create secure account →' : 'Sign in →';
  $('#confirmField').classList.toggle('show', setup);
  if(status.authenticated) return unlock();
  $('#authForm').onsubmit = async e => {e.preventDefault(); const password=$('#authPassword').value, confirm=$('#authConfirm').value; $('#authError').textContent=''; if(setup && password!==confirm){$('#authError').textContent='Passwords do not match.';return;} const endpoint=setup?'/api/auth/setup':'/api/auth/login'; const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})}); const data=await res.json(); if(!res.ok){$('#authError').textContent=data.error||'Unable to sign in.';return;} if(setup){const login=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});if(!login.ok){$('#authError').textContent='Account created. Please refresh and sign in.';return;}} unlock();};
}
async function unlock(){const res=await fetch('/api/data');if(!res.ok)return;const data=await res.json();Object.assign(state,data);$('#loginGate').classList.add('hidden');renderAll();}
startApp().catch(()=>{$('#authError').textContent='The office server is not running. Start the application with the launcher.';});
