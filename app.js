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
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.trim();
    log('Heard: ' + text);
    handleVoiceCommand(text);
  };
  recognition.onstart = () => {
    isListening = true;
    listenBtn.style.display='none';
    stopBtn.style.display='inline-block';
    log('Listening...');
  };
  recognition.onend = () => {
    isListening = false;
    listenBtn.style.display='inline-block';
    stopBtn.style.display='none';
    log('Stopped listening');
  };
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
  } catch(err) {
    log('Error fetching tasks: '+err.message);
    return [];
  }
}

async function addTask(title,due) {
  try {
    const res = await fetch(`${BACKEND_URL}/tasks`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({title,due})
    });
    const task = await res.json();
    log(`Task added: ${task.title}`);
    speak(`Adding task ${task.title}`);
    fetchTasks();
  } catch(err) { log('Error adding task: '+err.message); }
}

async function completeTask(id) {
  try {
    await fetch(`${BACKEND_URL}/tasks/${id}/complete`,{method:'PUT'});
    log(`Task completed: ${id}`);
    speak('Task completed');
    fetchTasks();
  } catch(err){ log('Error completing task: '+err.message); }
}

async function deleteTask(id) {
  try {
    await fetch(`${BACKEND_URL}/tasks/${id}`,{method:'DELETE'});
    log(`Task deleted: ${id}`);
    speak('Deleted task');
    fetchTasks();
  } catch(err){ log('Error deleting task: '+err.message); }
}

function renderTasks(tasks) {
  tasksList.innerHTML='';
  if(!tasks.length){tasksList.innerHTML='<li>No tasks found.</li>';return
