// Helper to format date nicely
function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, { 
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch (e) {
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
    const response = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, due: dueDate })
    });
    const task = await response.json();
    alert("✅ Task added: " + task.title);
    listTasks();
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDue").value = "";
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
    const response = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
      headers: { Authorization: "Bearer " + accessToken }
    });
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
      li.style.display = "flex";
      li.style.flexWrap = "wrap";
      li.style.alignItems = "center";
      li.style.justifyContent = "space-between";
      li.style.padding = "5px 0";

      let taskText = task.title;
      if (task.due) taskText += ` (Due: ${formatDate(task.due)})`;

      if (task.status === "completed") {
        li.style.color = "green";
        li.textContent = "✔ " + taskText;
      } else if (task.due && new Date(task.due) < now) {
        li.style.color = "red";
        li.textContent = taskText;
      } else {
        li.textContent = taskText;
      }

      // Buttons container
      const btnContainer = document.createElement("div");
      btnContainer.style.display = "flex";
      btnContainer.style.gap = "5px";
      btnContainer.style.flexWrap = "wrap";

      if (task.status !== "completed") {
        const completeBtn = document.createElement("button");
        completeBtn.textContent = "Complete";
        completeBtn.onclick = () => markTaskComplete(task.id);
        btnContainer.appendChild(completeBtn);
      }

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = () => deleteTask(task.id);
      btnContainer.appendChild(deleteBtn);

      li.appendChild(btnContainer);
      listEl.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("❌ Failed to fetch tasks.");
  }
}

// Mark task complete
async function markTaskComplete(taskId) {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }
  try {
    await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" })
    });
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
    await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + accessToken }
    });
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
    } else if (transcript.includes("list tasks")) { listTasks(); }
    else if (transcript.includes("list overdue tasks")) { listTasks(); } // optional: filter overdue
    else if (transcript.includes("list completed tasks")) { listTasks(); } // optional: filter completed
    else if (transcript.startsWith("complete task")) {
      const title = transcript.replace("complete task", "").trim();
      // optional: find task by title and mark complete
    } else if (transcript.startsWith("delete task")) {
      const title = transcript.replace("delete task", "").trim();
      // optional: find task by title and delete
    }
  };

  document.getElementById("listenBtn").onclick = () => recognition.start();
  document.getElementById("stopBtn").onclick = () => recognition.stop();
} else {
  alert("⚠️ Your browser does not support Speech Recognition.");
}
