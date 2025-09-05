import { CLIENT_ID, SCOPES } from "./config.js";

let tokenClient;
let accessToken = null;

// ✅ Initialize Google Identity Services
window.onload = () => {
  gapi.load("client", initClient);

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      document.getElementById("signout-button").style.display = "block";
      console.log("✅ Logged in, accessToken:", accessToken);
    }
  });

  document.getElementById("signout-button").onclick = () => {
    google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
      alert("Signed out.");
      document.getElementById("signout-button").style.display = "none";
    });
  };

  document.getElementById("add-task").onclick = addTask;
  document.getElementById("list-tasks").onclick = listTasks;
  document.getElementById("show-calendar").onclick = listCalendar;
  document.getElementById("show-gmail").onclick = listGmail;
  document.getElementById("show-contacts").onclick = listContacts;
  document.getElementById("start-voice").onclick = startVoice;
};

// ✅ Load Google APIs
function initClient() {
  gapi.client.init({});
}

// ----------------- TASKS -----------------
async function addTask() {
  if (!accessToken) return alert("Please sign in first");

  const taskTitle = document.getElementById("task-input").value;
  const dueDate = document.getElementById("task-date").value;

  const task = { title: taskTitle };
  if (dueDate) {
    task.due = new Date(dueDate).toISOString();
  }

  const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (res.ok) {
    alert("Task added!");
  } else {
    console.error("❌ Task add error", await res.json());
  }
}

async function listTasks() {
  if (!accessToken) return alert("Please sign in first");

  const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  const list = document.getElementById("tasks-list");
  list.innerHTML = "";
  (data.items || []).forEach(task => {
    const li = document.createElement("li");
    li.textContent = task.title;
    list.appendChild(li);
  });
}

// ----------------- CALENDAR -----------------
async function listCalendar() {
  if (!accessToken) return alert("Please sign in first");

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&orderBy=startTime&singleEvents=true", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  const list = document.getElementById("calendar-list");
  list.innerHTML = "";
  (data.items || []).forEach(event => {
    const li = document.createElement("li");
    li.textContent = event.summary + " - " + (event.start.dateTime || event.start.date);
    list.appendChild(li);
  });
}

// ----------------- GMAIL -----------------
async function listGmail() {
  if (!accessToken) return alert("Please sign in first");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  const list = document.getElementById("gmail-list");
  list.innerHTML = "";

  for (const msg of data.messages || []) {
    const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const msgData = await msgRes.json();
    const snippet = msgData.snippet || "";
    const li = document.createElement("li");
    li.textContent = snippet;
    list.appendChild(li);
  }
}

// ----------------- CONTACTS -----------------
async function listContacts() {
  if (!accessToken) return alert("Please sign in first");

  const res = await fetch("https://people.googleapis.com/v1/people/me/connections?pageSize=5&personFields=names,emailAddresses", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  const list = document.getElementById("contacts-list");
  list.innerHTML = "";
  (data.connections || []).forEach(person => {
    const name = person.names?.[0]?.displayName || "No Name";
    const email = person.emailAddresses?.[0]?.value || "No Email";
    const li = document.createElement("li");
    li.textContent = `${name} - ${email}`;
    list.appendChild(li);
  });
}

// ----------------- VOICE -----------------
function startVoice() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onstart = () => {
    document.getElementById("voice-status").textContent = "🎤 Listening...";
  };

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    document.getElementById("voice-status").textContent = "Heard: " + command;

    if (command.includes("add task")) {
      document.getElementById("task-input").value = command.replace("add task", "").trim();
      addTask();
    } else if (command.includes("list tasks")) {
      listTasks();
    } else if (command.includes("show calendar")) {
      listCalendar();
    } else if (command.includes("show gmail")) {
      listGmail();
    } else if (command.includes("show contacts")) {
      listContacts();
    }
  };

  recognition.onerror = (err) => {
    console.error("Voice error:", err);
    document.getElementById("voice-status").textContent = "Error: " + err.error;
  };
}

