// app.js
let accessToken = null;
let tokenClient;
let recognition;

// Initialize when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    auto_select: false,
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("g_id_signin"),
    { theme: "outline", size: "large", width: 300 }
  );

  document.getElementById("signOutBtn").onclick = signOut;

  document.getElementById("addTaskBtn").onclick = addTask;
  document.getElementById("listBtn").onclick = listTasks;
  document.getElementById("calendarBtn").onclick = listCalendar;
  document.getElementById("gmailBtn").onclick = listGmail;
  document.getElementById("contactsBtn").onclick = listContacts;

  // Voice buttons
  document.getElementById("listenBtn").onclick = startListening;
  document.getElementById("stopBtn").onclick = stopListening;
});

// Handle login
function handleCredentialResponse() {
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
  document.getElementById("statusText").innerText = "✅ Signed in";
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

// ---------------------- TASKS ----------------------
async function addTask(titleInput) {
  if (!accessToken) return alert("Sign in first");
  const title = titleInput || document.getElementById("taskTitle").value;
  if (!title) return alert("Enter task title");

  const dueInput = document.getElementById("taskDue").value;
  let dueDate = null;
  if (dueInput) {
    const parsed = chrono.parseDate(dueInput);
    if (parsed) dueDate = parsed.toISOString();
  }

  await gapi.client.tasks.tasks.insert({
    tasklist: "@default",
    resource: { title, due: dueDate }
  });

  log("Task added: " + title);
}

async function listTasks() {
  if (!accessToken) return alert("Sign in first");

  const res = await gapi.client.tasks.tasks.list({ tasklist: "@default" });
  const tasks = res.result.items || [];
  const ul = document.getElementById("tasksList");
  ul.innerHTML = "";
  tasks.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t.title;
    if (t.status === "completed") li.classList.add("completed");
    if (t.due && new Date(t.due) < new Date()) li.classList.add("overdue");
    ul.appendChild(li);
  });
  log("📋 Listed " + tasks.length + " tasks");
}

// ---------------------- CALENDAR ----------------------
async function listCalendar() {
  if (!accessToken) return alert("Sign in first");
  const res = await gapi.client.calendar.events.list({
    calendarId: "primary",
    maxResults: 5,
    singleEvents: true,
    orderBy: "startTime",
    timeMin: new Date().toISOString()
  });
  const events = res.result.items || [];
  log("📅 Upcoming events:");
  events.forEach(e => log(e.summary + " @ " + (e.start.dateTime || e.start.date)));
}

// ---------------------- GMAIL ----------------------
async function listGmail() {
  if (!accessToken) return alert("Sign in first");
  const res = await gapi.client.gmail.users.messages.list({
    userId: "me",
    maxResults: 5
  });
  const messages = res.result.messages || [];
  for (let m of messages) {
    const detail = await gapi.client.gmail.users.messages.get({ userId: "me", id: m.id });
    const snippet = detail.result.snippet;
    const subjectHeader = detail.result.payload.headers.find(h => h.name === "Subject");
    log("📧 " + (subjectHeader ? subjectHeader.value : "No subject") + " - " + snippet);
  }
}

// ---------------------- CONTACTS ----------------------
async function listContacts() {
  if (!accessToken) return alert("Sign in first");
  const res = await gapi.client.people.people.connections.list({
    resourceName: "people/me",
    pageSize: 5,
    personFields: "names,emailAddresses"
  });
  const connections = res.result.connections || [];
  log("👥 Contacts:");
  connections.forEach(c => {
    const name = c.names ? c.names[0].displayName : "No name";
    const email = c.emailAddresses ? c.emailAddresses[0].value : "No email";
    log(name + " - " + email);
  });
}

// ---------------------- VOICE COMMANDS ----------------------
function startListening() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition not supported in this browser.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    log("🎤 Heard: " + transcript);

    if (/^add task (.+)/i.test(transcript)) {
      const taskName = transcript.match(/^add task (.+)/i)[1];
      addTask(taskName);
    } else if (/list tasks/i.test(transcript)) {
      listTasks();
    } else if (/show calendar/i.test(transcript)) {
      listCalendar();
    } else if (/show gmail/i.test(transcript)) {
      listGmail();
    } else if (/show contacts/i.test(transcript)) {
      listContacts();
    } else {
      log("❓ Unknown command");
    }
  };

  recognition.start();
  document.getElementById("listenBtn").style.display = "none";
  document.getElementById("stopBtn").style.display = "inline-block";
  log("🎙️ Listening...");
}

function stopListening() {
  if (recognition) recognition.stop();
  document.getElementById("listenBtn").style.display = "inline-block";
  document.getElementById("stopBtn").style.display = "none";
  log("🛑 Stopped listening");
}

// ---------------------- LOG HELPER ----------------------
function log(msg) {
  const logDiv = document.getElementById("log");
  logDiv.innerHTML += msg + "<br>";
  logDiv.scrollTop = logDiv.scrollHeight;
}
