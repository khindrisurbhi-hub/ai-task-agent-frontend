// app.js

let accessToken = null;
let tokenClient;

// ---------------- INIT -----------------
window.addEventListener("DOMContentLoaded", () => {
  const signinDiv = document.getElementById("g_id_signin");
  signinDiv.style.display = "block";

  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse,
    ux_mode: "popup"
  });
  google.accounts.id.renderButton(signinDiv, { theme: "outline", size: "large", width: 300 });
  google.accounts.id.prompt();

  document.getElementById("signOutBtn").onclick = signOut;
  document.getElementById("addTaskBtn").onclick = addTask;
  document.getElementById("listBtn").onclick = listTasks;
  document.getElementById("calendarBtn").onclick = listCalendar;
  document.getElementById("gmailBtn").onclick = listGmail;
  document.getElementById("contactsBtn").onclick = listContacts;
});

function handleCredentialResponse(response) {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      gapi.load("client", initGapiClient);
    }
  });
  tokenClient.requestAccessToken();
}

async function initGapiClient() {
  await gapi.client.init({ discoveryDocs: DISCOVERY_DOCS });
  document.getElementById("statusText").innerText = "✅ Signed in with access!";
  document.getElementById("signOutBtn").style.display = "inline-block";
  document.getElementById("g_id_signin").style.display = "none";
}

function signOut() {
  accessToken = null;
  google.accounts.id.disableAutoSelect();
  document.getElementById("statusText").innerText = "🚪 Signed out";
  document.getElementById("signOutBtn").style.display = "none";
  document.getElementById("g_id_signin").style.display = "block";
}

// ---------------- TASKS -----------------
function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch (e) { return iso; }
}

async function addTask() {
  if (!accessToken) return alert("Please sign in first.");
  const title = document.getElementById("taskTitle").value;
  const dueInput = document.getElementById("taskDue").value;
  if (!title) return alert("Task title cannot be empty!");
  const dueDate = dueInput ? new Date(dueInput).toISOString() : undefined;

  const res = await gapi.client.tasks.tasks.insert({
    tasklist: "@default",
    resource: { title, due: dueDate }
  });
  alert("✅ Task added: " + res.result.title);
  listTasks();
}

async function listTasks() {
  if (!accessToken) return alert("Please sign in first.");
  const res = await gapi.client.tasks.tasks.list({ tasklist: "@default" });
  const listEl = document.getElementById("tasksList");
  listEl.innerHTML = "";
  if (!res.result.items || res.result.items.length === 0) {
    listEl.innerHTML = "<li>No tasks found</li>"; return;
  }
  const now = new Date();
  res.result.items.forEach(task => {
    const li = document.createElement("li");
    let text = task.title + (task.due ? ` (Due: ${formatDate(task.due)})` : "");
    li.textContent = text;
    if (task.status === "completed") li.className = "completed";
    else if (task.due && new Date(task.due) < now) li.className = "overdue";
    listEl.appendChild(li);
  });
}

// ---------------- CALENDAR -----------------
async function listCalendar() {
  if (!accessToken) return alert("Please sign in first.");
  const res = await gapi.client.calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 5,
    singleEvents: true,
    orderBy: "startTime"
  });
  const listEl = document.getElementById("calendarList");
  listEl.innerHTML = "";
  if (!res.result.items || res.result.items.length === 0) {
    listEl.innerHTML = "<li>No events found</li>"; return;
  }
  res.result.items.forEach(ev => {
    const start = ev.start.dateTime || ev.start.date;
    const li = document.createElement("li");
    li.textContent = `${ev.summary} (${formatDate(start)})`;
    listEl.appendChild(li);
  });
}

// ---------------- GMAIL -----------------
async function listGmail() {
  if (!accessToken) return alert("Please sign in first.");
  const res = await gapi.client.gmail.users.messages.list({
    userId: "me",
    maxResults: 5
  });
  const listEl = document.getElementById("gmailList");
  listEl.innerHTML = "";
  if (!res.result.messages) {
    listEl.innerHTML = "<li>No emails found</li>"; return;
  }
  for (let msg of res.result.messages) {
    const detail = await gapi.client.gmail.users.messages.get({ userId: "me", id: msg.id });
    const headers = detail.result.payload.headers;
    const subject = headers.find(h => h.name === "Subject")?.value || "(No subject)";
    const snippet = detail.result.snippet;
    const li = document.createElement("li");
    li.textContent = `${subject} — ${snippet}`;
    listEl.appendChild(li);
  }
}

// ---------------- CONTACTS -----------------
async function listContacts() {
  if (!accessToken) return alert("Please sign in first.");
  const res = await gapi.client.people.people.connections.list({
    resourceName: "people/me",
    personFields: "names,emailAddresses",
    pageSize: 5
  });
  const listEl = document.getElementById("contactsList");
  listEl.innerHTML = "";
  if (!res.result.connections) {
    listEl.innerHTML = "<li>No contacts found</li>"; return;
  }
  res.result.connections.forEach(c => {
    const name = c.names ? c.names[0].displayName : "No name";
    const email = c.emailAddresses ? c.emailAddresses[0].value : "No email";
    const li = document.createElement("li");
    li.textContent = `${name} — ${email}`;
    listEl.appendChild(li);
  });
}

// ---------------- VOICE -----------------
let recognition;
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    document.getElementById("statusText").innerText = "🎤 Listening...";
    document.getElementById("listenBtn").style.display = "none";
    document.getElementById("stopBtn").style.display = "inline-block";
  };
  recognition.onend = () => {
    document.getElementById("statusText").innerText = "🛑 Stopped listening";
    document.getElementById("listenBtn").style.display = "inline-block";
    document.getElementById("stopBtn").style.display = "none";
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    document.getElementById("log").innerHTML += `<div>🗣 You said: ${transcript}</div>`;
    if (transcript.startsWith("add task")) {
      document.getElementById("taskTitle").value = transcript.slice(8).trim();
      addTask();
    } else if (transcript.includes("list tasks")) listTasks();
    else if (transcript.includes("show calendar")) listCalendar();
    else if (transcript.includes("show gmail")) listGmail();
    else if (transcript.includes("show contacts")) listContacts();
  };

  document.getElementById("listenBtn").onclick = () => recognition.start();
  document.getElementById("stopBtn").onclick = () => recognition.stop();
}

