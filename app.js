// List tasks with optional filter: "completed", "overdue", or undefined for all
async function listTasks(filter) {
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
      let show = true;
      if (filter === "completed" && task.status !== "completed") show = false;
      if (filter === "overdue" && (!task.due || new Date(task.due) >= now)) show = false;

      if (show) {
        const li = document.createElement("li");
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
      }
    });
  } catch (err) {
    console.error("Error listing tasks:", err);
    alert("❌ Failed to fetch tasks.");
  }
}
