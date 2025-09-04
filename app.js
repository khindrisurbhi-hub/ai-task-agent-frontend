// Helper to format date nicely
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
  } catch (e) { return isoString; }
}

// Add a new task
async function addTask(titleInput, dueInput) {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }

  const title = titleInput || document.getElementById("taskTitle").value;
  const dueStr = dueInput || document.getElementById("taskDue").value;

  if (!title) { alert("Task title cannot be empty!"); return; }

  const dueDate = dueStr ? new Date(dueStr).toISOString() : undefined;

  try {
    const response = await fetch(
      "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, due: dueDate }),
      }
    );
    const task = await response.json();
    alert("✅ Task added: " + task.title);
    listTasks();
  } catch (err) {
    console.error(err);
    alert("❌ Failed to add task.");
  }
}

// Mark task as complete by ID
async function markTaskComplete(taskId) {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }

  await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "completed" }),
    }
  );
  listTasks();
}

// Delete a task by ID
async function deleteTask(taskId) {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }

  await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`,
    {
      method: "DELETE",
      headers: { Authorization: "Bearer " + accessToken },
    }
  );
  listTasks();
}

// List tasks, optionally filtered
async function listTasks(filter = "all") {
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
    data.items.forEach((task) => {
      if (
        filter === "completed" && task.status !== "completed" ||
        filter === "overdue" && (!task.due || task.status === "completed" || new Date(task.due) >= now)
      ) return;

      const li = document.createElement("li");
      let taskText = task.title;
      if (task.due) taskText += ` (Due: ${formatDate(task.due)})`;

      if (task.status === "completed") li.textContent = "✔ " + taskText;
      else if (task.due && new Date(task.due) < now) li.style.color = "red";
      else li.textContent = taskText;

      if (task.status !== "completed") {
        const completeBtn = document.createElement("button");
        completeBtn.textContent = "Mark Complete";
        completeBtn.style.marginLeft = "10px";
        completeBtn.onclick = () => markTaskComplete(task.id);
        li.appendChild(completeBtn);
      }

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

// Voice recognition setup
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
      if (title) addTask(title);
    } else if (transcript.startsWith("complete task")) {
      const title = transcript.slice(13).trim();
      handleVoiceComplete(title);
    } else if (transcript.startsWith("delete task")) {
      const title = transcript.slice(11).trim();
      handleVoiceDelete(title);
    } else if (transcript.includes("list overdue tasks")) {
      listTasks("overdue");
    } else if (transcript.includes("list completed tasks")) {
      listTasks("completed");
    } else if (transcript.includes("list tasks")) {
      listTasks();
    }
  };

  document.getElementById("listenBtn").onclick = () => recognition.start();
  document.getElementById("stopBtn").onclick = () => recognition.stop();
} else {
  alert("⚠️ Your browser does not support Speech Recognition.");
}

// Voice command helpers
async function handleVoiceComplete(title) {
  const accessToken = window.getAccessToken();
  if (!accessToken) return alert("Please sign in first.");

  const response = await fetch(
    "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
    { headers: { Authorization: "Bearer " + accessToken } }
  );
  const data = await response.json();
  const task = data.items.find(t => t.title.toLowerCase() === title.toLowerCase());
  if (task) markTaskComplete(task.id);
  else alert("Task not found: " + title);
}

async function handleVoiceDelete(title) {
  const accessToken = window.getAccessToken();
  if (!accessToken) return alert("Please sign in first.");

  const response = await fetch(
    "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
    { headers: { Authorization: "Bearer " + accessToken } }
  );
  const data = await response.json();
  const task = data.items.find(t => t.title.toLowerCase() === title.toLowerCase());
  if (task) deleteTask(task.id);
  else alert("Task not found: " + title);
}

