// app.js

// ----------- Helpers -----------
function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) { return iso; }
}

// Global
let recognition;
let accessToken = null;
let tokenClient;

// ----------- Google Sign-In -----------
window.addEventListener("DOMContentLoaded", () => {
  const signinDiv = document.getElementById("g_id_signin");

  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse,
    ux_mode: 'popup'
  });

  google.accounts.id.renderButton(signinDiv, { theme: "outline", size: "large", width: 300 });
  google.accounts.id.prompt();

  document.getElementById("signOutBtn").onclick = () => {
    accessToken = null;
    google.accounts.id.disableAutoSelect();
    document.getElementById("statusText").innerText = "🚪 Signed out";
    document.getElementById("signOutBtn").style.display = "none";
    signinDiv.style.display = "block";
  };

  // Buttons
  document.getElementById("addTaskBtn").onclick = addTask;
  document.getElementById("listBtn").onclick = listTasks;
  document.getElementById("calendarBtn").onclick = listCalendarEvents;
  document.getElementById("gmailBtn").onclick = listEmails;
  document.getElementById("contactsBtn").onclick = listContacts;
});

function handleCredentialResponse() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      document.getElementById("statusText").innerText = "✅ Signed in with access!";
      document.getElementById("signOutBtn").style.display = "inline-block";
      document.getElementById("g_id_signin").style.display = "none";
    }
  });
  tokenClient.requestAccessToken();
}

window.getAccessToken = () => accessToken;

// ----------- TASKS -----------
async function addTask() {
  if (!accessToken) return alert("Please sign in first.");
  const title = document.getElementById("taskTitle").value;
  const dueInput = document.getElementById("taskDue").value;
  if (!title) return alert("Task title cannot be empty!");

  const dueDate = dueInput ? new Date(dueInput).toISOString() : undefined;

  try {
    const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({ title, due: dueDate })
    });
    const task = await res.json();
    alert("✅ Task added: " + task.title);
    listTasks();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to add task.");
  }
}

async function listTasks() {
  if (!accessToken) return alert("Please sign in first.");
  try {
    const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
      headers: { Authorization: "Bearer " + accessToken }
    });
    const data = await res.json();
    const listEl = document.getElementById("tasksList");
    listEl.innerHTML = "";
    if (!data.items || data.items.length === 0) {
      listEl.innerHTML = "<li>No tasks found</li>";
      return;
    }

    const now = new Date();
    data.items.forEach(task => {
      const li = document.createElement("li");
      li.textContent = task.title + (task.due ? ` (Due: ${formatDate(task.due)})` : "");
      if (task.status === "completed") li.className = "completed";
      else if (task.due && new Date(task.due) < now) li.className = "overdue";
      listEl.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("❌ Failed to fetch tasks.");
  }
}

// ----------- CALENDAR -----------
async function listCalendarEvents() {
  if (!accessToken) return alert("Please sign in first.");
  try {
    const now = new Date().toISOString();
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=5&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: "Bearer " + accessToken } }
    );
    const data = await res.json();
    const listEl = document.getElementById("calendarList");
    listEl.innerHTML = "";
    if (!data.items || data.items.length === 0) {
      listEl.innerHTML = "<li>No upcoming events</li>";
      return;
    }
    data.items.forEach(event => {
      const li = document.createElement("li");
      const start = event.start.dateTime || event.start.date;
      li.textContent = `${event.summary} (Start: ${formatDate(start)})`;
      listEl.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("❌ Failed to fetch calendar events.");
  }
}

// ----------- GMAIL -----------
async function listEmails() {
  if (!accessToken) return alert("Please sign in first.");
  try {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5", {
      headers: { Authorization: "Bearer " + accessToken }
    });
    const data = await res.json();
    const listEl = document.getElementById("gmailList");
    listEl.innerHTML = "";
    if (!data.messages || data.messages.length === 0) {
      listEl.innerHTML = "<li>No emails found</li>";
      return;
    }
    for (let msg of data.messages) {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: "Bearer " + accessToken }
      });
      const fullMsg = await msgRes.json();
      const snippet = fullMsg.snippet;
      const subjectHeader = fullMsg.payload.headers.find(h => h.name === "Subject");
      const li = document.createElement("li");
      li.textContent = `${subjectHeader ? subjectHeader.value : "(No subject)"} - ${snippet}`;
      listEl.appendChild(li);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Failed to fetch emails.");
  }
}

// ----------- CONTACTS -----------
async function listContacts() {
  if (!accessToken) return alert("Please sign in first.");
  try {
    const res = await fetch("https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=5", {
      headers: { Authorization: "Bearer " + accessToken }
    });
    const data = await res.json();
    const listEl = document.getElementById("contactsList");
    listEl.innerHTML = "";
    if (!data.connections || data.connections.length === 0) {
      listEl.innerHTML = "<li>No contacts found</li>";
      return;
    }
    data.connections.forEach(c => {
      const name = c.names ? c.names[0].displayName : "(No name)";
      const email = c.emailAddresses ? c.emailAddresses[0].value : "(No email)";
      const li = document.createElement("li");
      li.textContent = `${name} - ${email}`;
      listEl.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("❌ Failed to fetch contacts.");
  }
}

// ----------- VOICE RECOGNITION -----------
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
      const title = transcript.slice(8).trim();
      if (title) { document.getElementById("taskTitle").value = title; addTask(); }
    } else if (transcript.includes("list tasks")) listTasks();
    else if (transcript.includes("show calendar")) listCalendarEvents();
    else if (transcript.includes("show gmail")) listEmails();
    else if (transcript.includes("show contacts")) listContacts();
  };

  document.getElementById("listenBtn").onclick = () => recognition.start();
  document.getElementById("stopBtn").onclick = () => recognition.stop();
} else {
  alert("⚠️ Your browser does not support Speech Recognition.");
}
