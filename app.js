// app.js

// ✅ Helper: format date nicely
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

// ✅ Add a new task
async function addTask() {
  const accessToken = window.getAccessToken();
  if (!accessToken) {
    alert("Please sign in first.");
    return;
  }

  const title = document.getElementById("taskTitle").value;
  const dueInput = document.getElementById("taskDue").value;

  if (!title) {
    alert("Task title cannot be empty!");
    return;
  }

  const dueDate = dueInput ? new Date(dueInput).toISOString() : undefined;

  try {
    const response = await fetch(
      "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          due: dueDate,
        }),
      }
    );

    const task = await response.json();
    console.log("Task created:", task);
    alert("✅ Task added: " + task.title);
    listTasks(); // refresh
  } catch (err) {
    console.error("Error adding task:", err);
    alert("❌ Failed to add task.");
  }
}

// ✅ Mark a task as completed
async function markTaskComplete(taskId) {
  const accessToken = window.getAccessToken();
  if (!accessToken) {
    alert("Please sign in first.");
    return;
  }

  try {
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
  } catch (err) {
    console.error("Error completing task:", err);
    alert("❌ Failed to complete task.");
  }
}

// ✅ Delete a task
async function deleteTask(taskId) {
  const accessToken = window.getAccessToken();
  if (!accessToken) {
    alert("Please sign in first.");
    return;
  }

  try {
    await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`,
      {
        method: "DELETE",
        headers: { Authorization: "Bearer " + accessToken },
      }
    );
    listTasks(); // refresh
  } catch (err) {
    console.error("Error deleting task:", err);
    alert("❌ Failed to delete task.");
  }
}

// ✅ List tasks
async function listTasks() {
  const accessToken = window.getAccessToken();
  if (!accessToken) {
    alert("Please sign in first.");
    return;
  }

  try {
    const response = await fetch(
      "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
      {
        headers: { Authorization: "Bearer " + accessToken },
      }
    );

    const data = await response.json();
    console.log("Tasks:", data);

    const listEl = document.getElementById("tasksList");
    listEl.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      listEl.innerHTML = "<li>No tasks found</li>";
      return;
    }

    const now = new Date();

    data.items.forEach((task) => {
      const li = document.createElement("li");

      let taskText = task.title;
      if (task.due) {
        taskText += ` (Due: ${formatDate(task.due)})`;
      }

      // ✅ Completed tasks
      if (task.status === "completed") {
        li.style.color = "green";
        li.textContent = "✔ " + taskText;
      } 
      // 🔴 Overdue tasks
      else if (task.due && new Date(task.due) < now) {
        li.style.color = "red";
        li.textContent = taskText;
      } 
      // 🟢 Active tasks
      else {
        li.textContent = taskText;
      }

      // Add "Mark Complete" button if not already completed
      if (task.status !== "completed") {
        const completeBtn = document.createElement("button");
        completeBtn.textContent = "Mark Complete";
        completeBtn.style.marginLeft = "10px";
        completeBtn.onclick = () => markTaskComplete(task.id);
        li.appendChild(completeBtn);
      }

      // Add "Delete" button for all tasks
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style.marginLeft = "10px";
      deleteBtn.onclick = () => deleteTask(task.id);
      li.appendChild(deleteBtn);

      listEl.appendChild(li);
    });
  } catch (err) {
    console.error("Error listing tasks:", err);
    alert("❌ Failed to fetch tasks.");
  }
}

// ✅ Hook buttons
window.onload = () => {
  document.getElementById("addTaskBtn").onclick = addTask;
  document.getElementById("listBtn").onclick = listTasks;
};
