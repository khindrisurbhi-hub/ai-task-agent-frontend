// app.js

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
  } catch (e) { return isoString; }
}

// Add a new task
async function addTask(titleInput) {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }
  const title = titleInput || document.getElementById("taskTitle").value;
  const dueInput = document.getElementById("taskDue").value;
  if (!title) { alert("Task title cannot be empty!"); return; }
  const dueDate = dueInput ? new Date(dueInput).toISOString() : undefined;
  try {
    const response = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
      method:"POST",
      headers:{ Authorization:"Bearer "+accessToken,"Content-Type":"application/json" },
      body: JSON.stringify({ title:title, due:dueDate })
    });
    const task = await response.json();
    alert("✅ Task added: "+task.title);
    listTasks();
  } catch (err) { alert("❌ Failed to add task."); console.error(err); }
}

// List tasks
async function listTasks(filter) {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }
  try {
    const response = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", { headers:{ Authorization:"Bearer "+accessToken }});
    const data = await response.json();
    const listEl = document.getElementById("tasksList");
    listEl.innerHTML = "";
    if(!data.items || data.items.length===0){ listEl.innerHTML="<li>No tasks found</li>"; return; }
    const now = new Date();
    let tasks = data.items;
    if(filter === "overdue") tasks = tasks.filter(t => t.due && new Date(t.due)<now && t.status!=="completed");
    if(filter === "completed") tasks = tasks.filter(t => t.status==="completed");

    tasks.forEach((task)=>{
      const li=document.createElement("li");
      let taskText = task.title;
      if(task.due) taskText += ` (Due: ${formatDate(task.due)})`;
      li.textContent = task.status==="completed" ? "✔ "+taskText : taskText;
      if(task.status!=="completed"){ 
        const completeBtn=document.createElement("button"); 
        completeBtn.textContent="Mark Complete"; 
        completeBtn.onclick=()=>markTaskComplete(task.id); 
        li.appendChild(completeBtn); 
      }
      const deleteBtn=document.createElement("button"); 
      deleteBtn.textContent="Delete"; 
      deleteBtn.onclick=()=>deleteTask(task.id); 
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });
  } catch(err){ console.error(err); alert("❌ Failed to fetch tasks."); }
}

// Mark Complete
async function markTaskComplete(taskId){
  const accessToken=window.getAccessToken(); if(!accessToken){ alert("Please sign in first."); return; }
  await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, { method:"PATCH", headers:{ Authorization:"Bearer "+accessToken,"Content-Type":"application/json"}, body:JSON.stringify({status:"completed"}) });
  listTasks();
}

// Delete Task
async function deleteTask(taskId){
  const accessToken=window.getAccessToken(); if(!accessToken){ alert("Please sign in first."); return; }
  await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, { method:"DELETE", headers:{ Authorization:"Bearer "+accessToken }});
  listTasks();
}

// Voice recognition
let recognition;
if("webkitSpeechRecognition" in window || "SpeechRecognition" in window){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous=false;
  recognition.lang="en-US";

  recognition.onstart = () => {
    document.getElementById("statusText").innerText="🎤 Listening...";
    document.getElementById("listenBtn").style.display="none";
    document.getElementById("stopBtn").style.display="inline-block";
  };
  recognition.onend = () => {
    document.getElementById("statusText").innerText="🛑 Stopped listening";
    document.getElementById("listenBtn").style.display="inline-block";
    document.getElementById("stopBtn").style.display="none";
  };
  recognition.onresult = async (event)=>{
    const transcript=event.results[0][0].transcript.trim();
    document.getElementById("log").innerHTML += `<div>🗣 You said: ${transcript}</div>`;

    const lower = transcript.toLowerCase();
    if(lower.startsWith("add task")){
      const title=transcript.slice(8).trim();
      if(title) addTask(title);
    } else if(lower.startsWith("complete task")){
      const taskName = transcript.slice(13).trim();
      await completeTaskByName(taskName);
    } else if(lower.startsWith("delete task")){
      const taskName = transcript.slice(11).trim();
      await deleteTaskByName(taskName);
    } else if(lower.includes("list tasks")){
      listTasks();
    } else if(lower.includes("list overdue tasks")){
      listTasks("overdue");
    } else if(lower.includes("list completed tasks")){
      listTasks("completed");
    }
  };

  document.getElementById("listenBtn").onclick = () => recognition.start();
  document.getElementById("stopBtn").onclick = () => recognition.stop();
} else {
  alert("⚠️ Your browser does not support Speech Recognition.");
}

// Helper functions for voice command actions
async function completeTaskByName(name){
  const accessToken = window.getAccessToken();
  if(!accessToken) { alert("Please sign in first."); return; }
  const response = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", { headers:{ Authorization:"Bearer "+accessToken }});
  const data = await response.json();
  const task = data.items.find(t=>t.title.toLowerCase()===name.toLowerCase());
  if(task) markTaskComplete(task.id);
  else alert(`❌ Task not found: ${name}`);
}

async function deleteTaskByName(name){
  const accessToken = window.getAccessToken();
  if(!accessToken) { alert("Please sign in first."); return; }
  const response = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", { headers:{ Authorization:"Bearer "+accessToken }});
  const data = await response.json();
  const task = data.items.find(t=>t.title.toLowerCase()===name.toLowerCase());
  if(task) deleteTask(task.id);
  else alert(`❌ Task not found: ${name}`);
}
