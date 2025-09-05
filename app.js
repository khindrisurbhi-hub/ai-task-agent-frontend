// app.js

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Load GAPI client
function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    discoveryDocs: [
      "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest",
      "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
      "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
      "https://people.googleapis.com/$discovery/rest?version=v1"
    ]
  });
  gapiInited = true;
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES.join(" "),
    callback: (response) => {
      if (response.error) {
        console.error("Auth error", response);
        return;
      }
      document.getElementById("loginBtn").style.display = "none";
      document.getElementById("logoutBtn").style.display = "inline";
      listTasks();
      listEvents();
      listGmail();
      listContacts();
    }
  });
  gisInited = true;
}

// Sign in
document.getElementById("loginBtn").onclick = () => {
  if (gapiInited && gisInited) {
    tokenClient.requestAccessToken({ prompt: "consent" });
  }
};

// Sign out
document.getElementById("logoutBtn").onclick = () => {
  google.accounts.oauth2.revoke(tokenClient.access_token, () => {
    console.log("Token revoked");
    document.getElementById("loginBtn").style.display = "inline";
    document.getElementById("logoutBtn").style.display = "none";
  });
};

// ========================== TASKS ==========================
async function listTasks() {
  try {
    const res = await gapi.client.tasks.tasks.list({ tasklist: "@default" });
    const tasks = res.result.items || [];
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";
    tasks.forEach(t => {
      const li = document.createElement("li");
      li.textContent = t.title;
      taskList.appendChild(li);
    });
  } catch (err) {
    console.error("Tasks error", err);
  }
}

document.getElementById("addTaskBtn").onclick = async () => {
  const title = document.getElementById("taskInput").value;
  if (!title) return;
  await gapi.client.tasks.tasks.insert({ tasklist: "@default", resource: { title } });
  listTasks();
};

// ========================== CALENDAR ==========================
async function listEvents() {
  try {
    const res = await gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime"
    });
    const events = res.result.items || [];
    const list = document.getElementById("calendarList");
    list.innerHTML = "";
    events.forEach(ev => {
      const li = document.createElement("li");
      li.textContent = `${ev.summary} (${ev.start.dateTime || ev.start.date})`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Calendar error", err);
  }
}

// ========================== GMAIL ==========================
async function listGmail() {
  try {
    const res = await gapi.client.gmail.users.messages.list({ userId: "me", maxResults: 5 });
    const msgs = res.result.messages || [];
    const list = document.getElementById("gmailList");
    list.innerHTML = "";
    for (let m of msgs) {
      const msg = await gapi.client.gmail.users.messages.get({ userId: "me", id: m.id });
      const headers = msg.result.payload.headers;
      const subject = headers.find(h => h.name === "Subject")?.value || "(No subject)";
      const snippet = msg.result.snippet;
      const li = document.createElement("li");
      li.textContent = `${subject} - ${snippet}`;
      list.appendChild(li);
    }
  } catch (err) {
    console.error("Gmail error", err);
  }
}

// ========================== CONTACTS ==========================
async function listContacts() {
  try {
    const res = await gapi.client.people.people.connections.list({
      resourceName: "people/me",
      pageSize: 5,
      personFields: "names,emailAddresses"
    });
    const contacts = res.result.connections || [];
    const list = document.getElementById("contactsList");
    list.innerHTML = "";
    contacts.forEach(c => {
      const name = c.names?.[0]?.displayName || "No Name";
      const email = c.emailAddresses?.[0]?.value || "No Email";
      const li = document.createElement("li");
      li.textContent = `${name} - ${email}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Contacts error", err);
  }
}

// ========================== VOICE ==========================
document.getElementById("voiceBtn").onclick = () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.onstart = () => document.getElementById("voiceStatus").textContent = "Listening...";
  recognition.onresult = async (e) => {
    const command = e.results[0][0].transcript.toLowerCase();
    document.getElementById("voiceStatus").textContent = `Heard: ${command}`;
    if (command.includes("add task")) {
      const task = command.replace("add task", "").trim();
      if (task) {
        await gapi.client.tasks.tasks.insert({ tasklist: "@default", resource: { title: task } });
        listTasks();
      }
    } else if (command.includes("list tasks")) listTasks();
    else if (command.includes("show calendar")) listEvents();
    else if (command.includes("show gmail")) listGmail();
    else if (command.includes("show contacts")) listContacts();
  };
  recognition.start();
};

// Auto init
window.onload = () => {
  gapiLoaded();
  gisLoaded();
};
