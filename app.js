// Helper: format date nicely
function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    console.error("Date parse error:", e);
    return isoString;
  }
}

// Add a new task
async function addTask() {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }

  const title = document.getElementById("taskTitle").value.trim();
  const dueInput = document.getElementById("taskDue").value.trim();
  if (!title) { alert("Task title cannot be empty!"); return; }

  const dueDate = dueInput ? new Date(dueInput).toISOString() : undefined;

  try {
    const response = await fetch(
      "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
      {
        method: "POST",
        headers: { 
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, due: dueDate })
      }
    );
    const task = await response.json();
    alert("✅ Task added: " + task.title);
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDue").value = "";
    listTasks();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to add task.");
  }
}

// List tasks
async function listTasks() {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }

  try {
    const response = await fetch(
      "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
      { headers: { Authorization: "Bearer " + accessToken } }
    );
    const data = await response.json();
    const listEl = document.getElementById("tasksList");
    listEl.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      listEl.innerHTML = "<li>No tasks found</li>";
      return;
    }

    const now = new Date();

    data.items.forEach(task => {
      const li = document.createElement("li");
      let taskText = task.title;
      if (task.due) taskText += ` (Due: ${formatDate(task.due)})`;

      // Color for completed / overdue
      if (task.status === "completed") {
        li.style.color = "green";
        li.textContent = "✔ " + taskText;
      } else if (task.due && new Date(task.due) < now) {
        li.style.color = "red";
        li.textContent = taskText;
      } else {
        li.textContent = taskText;
      }

      // Complete button
      if (task.status !== "completed") {
        const completeBtn = document.createElement("button");
        completeBtn.textContent = "Mark Complete";
        completeBtn.style.marginLeft = "10px";
        completeBtn.onclick = () => markTaskComplete(task.id);
        li.appendChild(completeBtn);
      }

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style.marginLeft = "10px";
      deleteBtn.onclick = () => deleteTask(task.id);
      li.appendChild(deleteBtn);

      listEl.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("❌ Failed to fetch tasks.");
  }
}

// Mark complete
async function markTaskComplete(taskId) {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }

  try {
    await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "completed" })
      }
    );
    listTasks();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to complete task.");
  }
}

// Delete task
async function deleteTask(taskId) {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }

  try {
    await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`,
      { method: "DELETE", headers: { Authorization: "Bearer " + accessToken } }
    );
    listTasks();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to delete task.");
  }
}

// Voice recognition
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
      const title = transcript.slice(8).trim();
      if (title) { document.getElementById("taskTitle").value = title; addTask(); }
    } else if (transcript.includes("list tasks")) {
      listTasks();
    } else if (transcript.startsWith("complete task")) {
      const title = transcript.slice(13).trim();
      completeTaskByName(title);
    } else if (transcript.startsWith("delete task")) {
      const title = transcript.slice(11).trim();
      deleteTaskByName(title);
    } else if (transcript.includes("list overdue tasks")) {
      listOverdueTasks();
    } else if (transcript.includes("list completed tasks")) {
      listCompletedTasks();
    }
  };

  document.getElementById("listenBtn").onclick = () => recognition.start();
  document.getElementById("stopBtn").onclick = () => recognition.stop();
} else {
  alert("⚠️ Your browser does not support Speech Recognition.");
}

// Additional helper functions for voice commands
async function completeTaskByName(name) {
  const tasks = await fetchTasks();
  const task = tasks.find(t => t.title.toLowerCase() === name.toLowerCase());
  if (task) markTaskComplete(task.id);
  else alert("Task not found: " + name);
}

async function deleteTaskByName(name) {
  const tasks = await fetchTasks();
  const task = tasks.find(t => t.title.toLowerCase() === name.toLowerCase());
  if (task) deleteTask(task.id);
  else alert("Task not found: " + name);
}

async function listOverdueTasks() {
  const tasks = await fetchTasks();
  const now = new Date();
  const overdue = tasks.filter(t => t.due && new Date(t.due) < now && t.status !== "completed");
  alert(overdue.length ? overdue.map(t => t.title).join("\n") : "No overdue tasks.");
}

async function listCompletedTasks() {
  const tasks = await fetchTasks();
  const completed = tasks.filter(t => t.status === "completed");
  alert(completed.length ? completed.map(t => t.title).join("\n") : "No completed tasks.");
}

async function fetchTasks() {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return []; }
  try {
    const response = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", { headers: { Authorization: "Bearer " + accessToken } });
    const data = await response.json();
    return data.items || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}
