// app.js

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
  } catch (err) {
    console.error("Error adding task:", err);
    alert("❌ Failed to add task.");
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

    data.items.forEach((task) => {
      const li = document.createElement("li");
      li.textContent = task.title + (task.due ? ` (Due: ${task.due})` : "");
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
