// app.js

// Format date nicely
function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
  } catch (e) { return isoString; }
}

// Add a new task
async function addTask() {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }

  const title = document.getElementById("taskTitle").value.trim();
  const dueInput = document.getElementById("taskDue").value;
  if (!title) { alert("Task title cannot be empty!"); return; }

  const dueDate = dueInput ? new Date(dueInput).toISOString() : undefined;

  try {
    const response = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({ title, due: dueDate })
    });

    const task = await response.json();
    alert("✅ Task added: " + task.title);
    listTasks();
  } catch (err) { console.error(err); alert("❌ Failed to add task."); }
}

// Mark task complete
async function markTaskComplete(taskId){
  const accessToken = window.getAccessToken();
  if(!accessToken){ alert("Please sign in first."); return; }
  await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method: "PATCH",
    headers: { Authorization: "Bearer "+accessToken, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "completed" })
  });
  listTasks();
}

// Delete task
async function deleteTask(taskId){
  const accessToken = window.getAccessToken();
  if(!accessToken){ alert("Please sign in first."); return; }
  await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + accessToken }
  });
  listTasks();
}

// List tasks
// Optional flags: overdueOnly = true, completedOnly = true
async function listTasks(overdueOnly=false, completedOnly=false){
  const accessToken = window.getAccessToken();
  if(!accessToken){ alert("Please sign in first."); return; }

  try {
    const response = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
      headers: { Authorization: "Bearer "+accessToken }
    });
    const data = await response.json();
    const listEl = document.getElementById("tasksList");
    listEl.innerHTML = "";

    if(!data.items || data.items.length===0){ listEl.innerHTML="<li>No tasks found</li>"; return; }

    const now = new Date();
    data.items.forEach(task => {
      let show = true;
      if(overdueOnly && (!task.due || new Date(task.due) >= now)) show = false;
      if(completedOnly && task.status !== "completed") show = false;
      if(!overdueOnly && !completedOnly && task.status === "completed") show = false; // skip completed in normal list

      if(show){
        const li = document.createElement("li");
        let taskText = task.title + (task.due ? ` (Due: ${formatDate(task.due)})` : "");
        if(task.status==="completed") li.textContent = "✔ " + taskText;
        else if(task.due && new Date(task.due)<now) li.style.color="red";

        else li.textContent = taskText;

        if(task.status!=="completed"){
          const completeBtn = document.createElement("button");
          completeBtn.textContent="Mark Complete";
          completeBtn.style.marginLeft="10px";
          completeBtn.onclick = ()=> markTaskComplete(task.id);
          li.appendChild(completeBtn);
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent="Delete";
        deleteBtn.style.marginLeft="10px";
        deleteBtn.onclick = ()=> deleteTask(task.id);
        li.appendChild(deleteBtn);

        listEl.appendChild(li);
      }
    });

    if(listEl.innerHTML === "") listEl.innerHTML="<li>No tasks found</li>";
  } catch(err){ console.error(err); alert("❌ Failed to fetch tasks."); }
}

// Optional: helper for voice commands
async function completeTaskByName(name){
  const accessToken = window.getAccessToken();
  if(!accessToken){ alert("Please sign in first."); return; }
  const response = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", { headers:{ Authorization:"Bearer "+accessToken }});
  const data = await response.json();
  if(data.items){
    const task = data.items.find(t=>t.title.toLowerCase()===name.toLowerCase());
    if(task) markTaskComplete(task.id);
    else alert("Task not found: " + name);
  }
}

async function deleteTaskByName(name){
  const accessToken = window.getAccessToken();
  if(!accessToken){ alert("Please sign in first."); return; }
  const response = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", { headers:{ Authorization:"Bearer "+accessToken }});
  const data = await response.json();
  if(data.items){
    const task = data.items.find(t=>t.title.toLowerCase()===name.toLowerCase());
    if(task) deleteTask(task.id);
    else alert("Task not found: " + name);
  }
}

// Optional: hook "overdue" and "completed" buttons if you want
// Example: <button id="listOverdueBtn">List Overdue</button>
// document.getElementById("listOverdueBtn").onclick = () => listTasks(true);
// Example: <button id="listCompletedBtn">List Completed</button>
// document.getElementById("listCompletedBtn").onclick = () => listTasks(false, true);
