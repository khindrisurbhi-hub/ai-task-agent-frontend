let isListening = false;
let recognition;
const statusText = document.getElementById('statusText');
const listenBtn = document.getElementById('listenBtn');
const stopBtn = document.getElementById('stopBtn');
const listBtn = document.getElementById('listBtn');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskTitleInput = document.getElementById('taskTitle');
const taskDueInput = document.getElementById('taskDue');
const tasksList = document.getElementById('tasksList');
const logEl = document.getElementById('log');

// ✅ Fixed backend URL
const BACKEND_URL = "https://ai-task-agent-backend.onrender.com";

function log(msg) {
  const p = document.createElement('div');
  p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.prepend(p);
  console.debug(msg);
}
async function init() {
  setupSpeechRecognition();
  requestNotificationPermissions();
  statusText.textContent = 'Connected to Backend';
  fetchTasks();
}
listenBtn.onclick = startListening;
stopBtn.onclick = stopListening;
listBtn.onclick = fetchTasks;
addTaskBtn.onclick = async () => {
  const title = taskTitleInput.value.trim();
  const dueText = taskDueInput.value.trim();
  if (!title) { alert('Please enter a title'); return; }
  const due = parseDateTime(dueText);
  await addTask(title, due);
  taskTitleInput.value = '';
  taskDueInput.value = '';
};
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { log('Web Speech API not supported'); listenBtn.disabled = true; return; }
  recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.lang = 'en-IN';
  recognition.onresult = (event) => { const text = event.results[0][0].transcript.trim(); log('Heard: ' + text); handleVoiceCommand(text); };
  recognition.onstart = () => { isListening = true; listenBtn.style.display='none'; stopBtn.style.display='inline-block'; log('Listening...'); };
  recognition.onend = () => { isListening = false; listenBtn.style.display='inline-block'; stopBtn.style.display='none'; log('Stopped listening'); };
  recognition.onerror = (e) => { log('Speech recognition error: '+e.error); };
}
function startListening() { if (!recognition) return; try { recognition.start(); } catch(e){ log('Recognition start error: '+e.message); } }
function stopListening() { if (!recognition) return; recognition.stop(); }
async function fetchTasks() {
  try {
    const res = await fetch(`${BACKEND_URL}/tasks`);
    const tasks = await res.json();
    renderTasks(tasks);
    speak('Fetched tasks from backend');
    return tasks;
  } catch(err) { log('Error fetching tasks: '+err.message); return []; }
}
async function addTask(title,due) {
  try {
    const res = await fetch(`${BACKEND_URL}/tasks`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,due})});
    const task = await res.json();
    log(`Task added: ${task.title}`);
    speak(`Adding task ${task.title}`);
    fetchTasks();
  } catch(err) { log('Error adding task: '+err.message); }
}
async function completeTask(id) { try { await fetch(`${BACKEND_URL}/tasks/${id}/complete`,{method:'PUT'}); log(`Task completed: ${id}`); speak('Task completed'); fetchTasks(); } catch(err){ log('Error completing task: '+err.message); } }
async function deleteTask(id) { try { await fetch(`${BACKEND_URL}/tasks/${id}`,{method:'DELETE'}); log(`Task deleted: ${id}`); speak('Deleted task'); fetchTasks(); } catch(err){ log('Error deleting task: '+err.message); } }
function renderTasks(tasks) {
  tasksList.innerHTML='';
  if(!tasks.length){tasksList.innerHTML='<li>No tasks found.</li>';return;}
  tasks.forEach((t,idx)=>{
    const li=document.createElement('li');
    li.innerHTML=`<strong>#${idx+1}</strong> ${t.title} <em>${t.status}</em> <br/><small>Due: ${t.due?new Date(t.due).toLocaleString():'-'}</small>`;
    const completeBtn=document.createElement('button');
    completeBtn.textContent='Complete'; completeBtn.onclick=()=>completeTask(t.id);
    const delBtn=document.createElement('button');
    delBtn.textContent='Delete'; delBtn.onclick=()=>deleteTask(t.id);
    li.appendChild(document.createElement('br')); li.appendChild(completeBtn); li.appendChild(delBtn);
    tasksList.appendChild(li);
  });
}
function speak(text){if(!('speechSynthesis' in window)) return; const u=new SpeechSynthesisUtterance(text); u.lang='en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);}
async function requestNotificationPermissions(){if(!('Notification' in window)) return; if(Notification.permission==='default') await Notification.requestPermission();}
function parseDateTime(text){if(!text) return null; try{return chrono.parseDate(text)||null;}catch(e){return null;}}
function handleVoiceCommand(text){
  const lower=text.toLowerCase();
  if(lower.startsWith('add task')||lower.startsWith('add a task')){
    const phrase=text.replace(/^(add task|add a task)\s*/i,'');
    const dt=chrono.parseDate(phrase);
    let title=phrase;
    if(dt){const parsed=chrono.parse(phrase); if(parsed && parsed.length) title=phrase.replace(parsed[0].text,'').trim();}
    if(!title) title='Untitled task'; addTask(title,dt); return;
  }
  if(lower.startsWith('list tasks')||lower==='list'||lower==='show tasks'){fetchTasks(); speak('Here are your tasks'); return;}
  if(lower.startsWith('complete task')){const n=parseInt(text.replace(/^(complete task)/i,'').trim()); if(!isNaN(n)){fetchTasks().then(tasks=>{if(tasks[n-1]) completeTask(tasks[n-1].id);});} return;}
  if(lower.startsWith('delete task')){const n=parseInt(text.replace(/^(delete task)/i,'').trim()); if(!isNaN(n)){fetchTasks().then(tasks=>{if(tasks[n-1]) deleteTask(tasks[n-1].id);});} return;}
  speak('Sorry, I did not understand: '+text); log('Unrecognized command: '+text);
}
init();
