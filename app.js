// app.js

/********* Small utilities *********/
function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return iso;
  }
}

function byId(id) {
  return document.getElementById(id);
}

/********* Google Identity Services *********/
let accessToken = null;
let tokenClient = null;
let tokenExpiry = 0; // epoch ms

async function ensureToken() {
  // Refresh silently if token is missing/expired (GIS will do iframe flow)
  const safetyMarginMs = 60 * 1000; // 1 min
  if (!accessToken || Date.now() > tokenExpiry - safetyMarginMs) {
    return new Promise((resolve, reject) => {
      tokenClient.callback = (resp) => {
        if (resp && resp.access_token) {
          accessToken = resp.access_token;
          // expires_in is seconds
          tokenExpiry = Date.now() + (resp.expires_in || 1800) * 1000;
          resolve(accessToken);
        } else {
          reject(new Error("No access token returned"));
        }
      };
      // Try silent first; if it fails, GIS will still handle popup if needed
      tokenClient.requestAccessToken({ prompt: "" });
    });
  }
  return accessToken;
}

window.getAccessToken = () => accessToken;

/********* Sign-in button wiring (called from index.html on DOMContentLoaded) *********/
window._initSignIn = function _initSignIn() {
  const signinDiv = byId("g_id_signin");

  // Render One Tap / Button
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse,
    ux_mode: "popup",
  });
  google.accounts.id.renderButton(signinDiv, {
    theme: "outline",
    size: "large",
    width: 300,
  });
  google.accounts.id.prompt();

  // Set up token client (OAuth 2 token for APIs)
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp) => {
      if (resp && resp.access_token) {
        accessToken = resp.access_token;
        tokenExpiry = Date.now() + (resp.expires_in || 1800) * 1000;
        byId("statusText").innerText = "✅ Signed in";
        byId("signOutBtn").style.display = "inline-block";
        byId("g_id_signin").style.display = "none";
        // Optional: auto-load something for the reviewer
        listTasks();
      } else {
        alert("Failed to obtain access token.");
      }
    },
  });

  // Sign out
  byId("signOutBtn").onclick = () => {
    accessToken = null;
    tokenExpiry = 0;
    google.accounts.id.disableAutoSelect();
    byId("statusText").innerText = "🚪 Signed out";
    byId("signOutBtn").style.display = "none";
    signinDiv.style.display = "block";
  };

  // Buttons
  byId("addTaskBtn").onclick = addTask;
  byId("listTasksBtn").onclick = listTasks;
  byId("listEventsBtn").onclick = listCalendarEvents;
  byId("listGmailBtn").onclick = listGmailMessages;
  byId("listContactsBtn").onclick = listContacts;

  // Voice controls (if supported)
  setupVoiceRecognition();
};

// Called by the Sign-In button flow (ID token step). We immediately request OAuth token.
function handleCredentialResponse() {
  tokenClient.requestAccessToken({ prompt: "consent" });
}

/********* Google Tasks *********/
async function addTask() {
  const token = await ensureToken().catch(err => (alert(err.message), null));
  if (!token) return;

  const title = byId("taskTitle").value.trim();
  const dueInput = byId("taskDue").value.trim();
  if (!title) {
    alert("Task title cannot be empty!");
    return;
  }
  const dueDate = dueInput ? new Date(dueInput).toISOString() : undefined;

  try {
    const res = await fetch(`${TASKS_API}/lists/@default/tasks`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ title, due: dueDate }),
    });
    if (!res.ok) throw new Error(await res.text());
    const task = await res.json();
    alert("✅ Task added: " + (task.title || title));
    await listTasks();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to add task.");
  }
}

async function listTasks() {
  const token = await ensureToken().catch(err => (alert(err.message), null));
  if (!token) return;
  try {
    const res = await fetch(`${TASKS_API}/lists/@default/tasks`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const listEl = byId("tasksList");
    listEl.innerHTML = "";
    const items = data.items || [];
    if (!items.length) {
      listEl.innerHTML = "<li>No tasks found</li>";
      return;
    }
    const now = new Date();
    items.forEach((task) => {
      const li = document.createElement("li");
      let taskText = task.title + (task.due ? ` (Due: ${formatDate(task.due)})` : "");
      li.textContent = taskText;

      if (task.status === "completed") li.className = "completed";
      else if (task.due && new Date(task.due) < now) li.className = "overdue";

      const btns = document.createElement("span");
      btns.style.marginLeft = "8px";

      if (task.status !== "completed") {
        const completeBtn = document.createElement("button");
        completeBtn.textContent = "Complete";
        completeBtn.onclick = () => markTaskComplete(task.id);
        btns.appendChild(completeBtn);
      }
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = () => deleteTask(task.id);
      btns.appendChild(deleteBtn);

      li.appendChild(btns);
      listEl.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("❌ Failed to fetch tasks.");
  }
}

async function markTaskComplete(taskId) {
  const token = await ensureToken().catch(err => (alert(err.message), null));
  if (!token) return;
  await fetch(`${TASKS_API}/lists/@default/tasks/${taskId}`, {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "completed" }),
  }).catch(console.error);
  listTasks();
}

async function deleteTask(taskId) {
  const token = await ensureToken().catch(err => (alert(err.message), null));
  if (!token) return;
  await fetch(`${TASKS_API}/lists/@default/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  }).catch(console.error);
  listTasks();
}

/********* Google Calendar (read-only) *********/
async function listCalendarEvents() {
  const token = await ensureToken().catch(err => (alert(err.message), null));
  if (!token) return;
  const out = byId("eventsList");
  out.innerHTML = "<li>Loading…</li>";

  // From now to next 7 days
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  try {
    const res = await fetch(
      `${CAL_API}/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
        timeMin
      )}&timeMax=${encodeURIComponent(timeMax)}&maxResults=20`,
      { headers: { Authorization: "Bearer " + token } }
    );
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    out.innerHTML = "";
    const items = data.items || [];
    if (!items.length) {
      out.innerHTML = "<li>No upcoming events</li>";
      return;
    }
    items.forEach((ev) => {
      const when = ev.start?.dateTime || ev.start?.date;
      const li = document.createElement("li");
      li.textContent = `${formatDate(when)} — ${ev.summary || "(no title)"}`;
      out.appendChild(li);
    });
  } catch (e) {
    console.error(e);
    out.innerHTML = "<li>Failed to load events</li>";
  }
}

/********* Gmail (read-only) *********/
async function listGmailMessages() {
  const token = await ensureToken().catch(err => (alert(err.message), null));
  if (!token) return;
  const out = byId("gmailList");
  out.innerHTML = "<li>Loading…</li>";
  try {
    const res = await fetch(`${GMAIL_API}/users/me/messages?maxResults=10`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const ids = (data.messages || []).map((m) => m.id);
    if (!ids.length) {
      out.innerHTML = "<li>No recent emails</li>";
      return;
    }
    // Fetch details for each message to get Subject + snippet
    const details = await Promise.all(
      ids.map((id) =>
        fetch(`${GMAIL_API}/users/me/messages/${id}?format=metadata&metadataHeaders=Subject`, {
          headers: { Authorization: "Bearer " + token },
        }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
      )
    );
    out.innerHTML = "";
    details.filter(Boolean).forEach((msg) => {
      const subject =
        (msg.payload?.headers || []).find((h) => h.name === "Subject")?.value ||
        "(no subject)";
      const snippet = msg.snippet || "";
      const li = document.createElement("li");
      li.textContent = `${subject} — ${snippet}`;
      out.appendChild(li);
    });
  } catch (e) {
    console.error(e);
    out.innerHTML = "<li>Failed to load emails</li>";
  }
}

/********* Contacts (People API read-only) *********/
async function listContacts() {
  const token = await ensureToken().catch(err => (alert(err.message), null));
  if (!token) return;
  const out = byId("contactsList");
  out.innerHTML = "<li>Loading…</li>";
  try {
    const res = await fetch(
      `${PEOPLE_API}/people/me/connections?personFields=names,emailAddresses&sortOrder=FIRST_NAME_ASCENDING&pageSize=25`,
      { headers: { Authorization: "Bearer " + token } }
    );
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    out.innerHTML = "";
    const conns = data.connections || [];
    if (!conns.length) {
      out.innerHTML = "<li>No contacts</li>";
      return;
    }
    conns.forEach((p) => {
      const name = p.names?.[0]?.displayName || "(no name)";
      const email = p.emailAddresses?.[0]?.value || "(no email)";
      const li = document.createElement("li");
      li.textContent = `${name} — ${email}`;
      out.appendChild(li);
    });
  } catch (e) {
    console.error(e);
    out.innerHTML = "<li>Failed to load contacts</li>";
  }
}

/********* Voice Recognition (unchanged from your flow, but hooked up) *********/
function setupVoiceRecognition() {
  let recognition;
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    byId("log").innerHTML += "<div>⚠️ Speech Recognition not supported.</div>";
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    byId("statusText").innerText = "🎤 Listening...";
    byId("listenBtn").style.display = "none";
    byId("stopBtn").style.display = "inline-block";
  };
  recognition.onend = () => {
    byId("statusText").innerText = "🛑 Stopped listening";
    byId("listenBtn").style.display = "inline-block";
    byId("stopBtn").style.display = "none";
  };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    byId("log").innerHTML += `<div>🗣 You said: ${transcript}</div>`;

    if (transcript.startsWith("add task")) {
      const title = transcript.slice(8).trim();
      if (title) {
        byId("taskTitle").value = title;
        addTask();
      }
    } else if (transcript.includes("list tasks")) {
      listTasks();
    } else if (transcript.includes("list events")) {
      listCalendarEvents();
    } else if (transcript.includes("list emails") || transcript.includes("list gmail")) {
      listGmailMessages();
    } else if (transcript.includes("list contacts")) {
      listContacts();
    }
  };

  byId("listenBtn").onclick = () => recognition.start();
  byId("stopBtn").onclick = () => recognition.stop();
}

