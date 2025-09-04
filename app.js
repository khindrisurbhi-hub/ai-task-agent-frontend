// app.js

// Format date nicely
function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
  } catch(e){ return iso; }
}

// Add task
async function addTask() {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }
  const title = document.getElementById("taskTitle").value;
  const dueInput = document.getElementById("taskDue").value;
  if (!title) { alert("Task title cannot be empty!"); return; }
  const dueDate = dueInput ? new Date(dueInput).toISOString() : undefined;

  try {
    const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
      method:"POST",
      headers:{ Authorization:"Bearer "+accessToken,"Content-Type":"application/json" },
      body: JSON.stringify({ title, due: dueDate })
    });
    const task = await res.json();
    alert("✅ Task added: " + task.title);
    listTasks();
  } catch(err){ console.error(err); alert("❌ Failed to add task."); }
}

// List tasks
async function listTasks() {
  const accessToken = window.getAccessToken();
  if (!accessToken) { alert("Please sign in first."); return; }
  try {
    const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", { headers:{ Authorization:"Bearer "+accessToken }});
    const data = await res.json();
    const listEl = document.getElementById("tasksList");
    listEl.innerHTML = "";
    if(!data.items || data.items.length===0){ listEl.innerHTML="<li>No tasks found</li>"; return; }

    const now = new Date();
    data.items.forEach(task=>{
      const li = document.createElement("li");
      let taskText = task.title + (task.due ? ` (Due: ${formatDate(task.due)})` : "");
      li.textContent = taskText;

      if(task.status==="completed") li.className="completed";
      else if(task.due && new Date(task.due)<now) li.className="overdue";

      if(task.status!=="completed") {
        const completeBtn = document.createElement("button");
        completeBtn.textContent="Complete";
        completeBtn.onclick=()=>markTaskComplete(task.id);
        li.appendChild(completeBtn);
      }
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent="Delete";
      deleteBtn.onclick=()=>deleteTask(task.id);
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });
  } catch(err){ console.error(err); alert("❌ Failed to fetch tasks."); }
}

// Mark complete
async function markTaskComplete(taskId) {
  const accessToken = window.getAccessToken();
  if(!accessToken){ alert("Please sign in first."); return; }
  await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method:"PATCH",
    headers:{ Authorization:"Bearer "+accessToken,"Content-Type":"application/json"},
    body:JSON.stringify({status:"completed"})
  });
  listTasks();
}

// Delete task
async function deleteTask(taskId) {
  const accessToken = window.getAccessToken();
  if(!accessToken){ alert("Please sign in first."); return; }
  await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
    method:"DELETE",
    headers:{ Authorization:"Bearer "+accessToken }
  });
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
  recognition.onresult = (event)=>{
    const transcript=event.results[0][0].transcript.toLowerCase();
    document.getElementById("log").innerHTML += `<div>🗣 You said: ${transcript}</div>`;

    if(transcript.startsWith("add task")) {
      const title=transcript.slice(8).trim();
      if(title){ document.getElementById("taskTitle").value=title; addTask(); }
    } else if(transcript.includes("list tasks")) listTasks();
    else if(transcript.includes("complete task")) {
      // simple match by title
      const title=transcript.replace("complete task","").trim();
      completeTaskByTitle(title);
    } else if(transcript.includes("delete task")) {
      const title=transcript.replace("delete task","").trim();
      deleteTaskByTitle(title);
    } else if(transcript.includes("list overdue tasks")) listTasksFiltered("overdue");
    else if(transcript.includes("list completed tasks")) listTasksFiltered("completed");
  };

  document.getElementById("listenBtn").onclick = ()=>recognition.start();
  document.getElementById("stopBtn").onclick = ()=>recognition.stop();
} else {
  alert("⚠️ Your browser does not support Speech Recognition.");
}

// Helper: complete task by title
async function completeTaskByTitle(title){
  const accessToken=window.getAccessToken(); if(!accessToken){ alert("Sign in first"); return; }
  const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",{ headers:{ Authorization:"Bearer "+accessToken }});
  const data=await res.json();
  const task = data.items.find(t=>t.title.toLowerCase()===title.toLowerCase());
  if(task) await markTaskComplete(task.id);
}

// Helper: delete task by title
async function deleteTaskByTitle(title){
  const accessToken=window.getAccessToken(); if(!accessToken){ alert("Sign in first"); return; }
  const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",{ headers:{ Authorization:"Bearer "+accessToken }});
  const data=await res.json();
  const task = data.items.find(t=>t.title.toLowerCase()===title.toLowerCase());
  if(task) await deleteTask(task.id);
}

// Filtered list
async function listTasksFiltered(type){
  const accessToken = window.getAccessToken(); if(!accessToken){ alert("Sign in first"); return; }
  const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",{ headers:{ Authorization:"Bearer "+accessToken }});
  const data = await res.json();
  const listEl = document.getElementById("tasksList"); listEl.innerHTML="";
  if(!data.items || data.items.length===0){ listEl.innerHTML="<li>No tasks</li>"; return; }
  const now = new Date();
  data.items.forEach(task=>{
    let show=false;
    if(type==="completed" && task.status==="completed") show=true;
    else if(type==="overdue" && task.status!=="completed" && task.due && new Date(task.due)<now) show=true;
    if(show){
      const li=document.createElement("li");
      li.textContent = task.title + (task.due ? ` (Due: ${formatDate(task.due)})` : "");
      listEl.appendChild(li);
    }
  });
}
