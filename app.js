// Helper to format date
function formatDate(isoString) {
  if (!isoString) return "";
  try { return new Date(isoString).toLocaleString(undefined,{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }
  catch(e){ return isoString; }
}

// Add task
async function addTask() {
  const accessToken = window.getAccessToken();
  if (!accessToken) return alert("Please sign in first.");
  const title = document.getElementById("taskTitle").value;
  const dueInput = document.getElementById("taskDue").value;
  if (!title) return alert("Task title cannot be empty!");
  const dueDate = dueInput ? new Date(dueInput).toISOString() : undefined;

  try {
    const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
      method:"POST",
      headers:{ Authorization:"Bearer "+accessToken,"Content-Type":"application/json" },
      body: JSON.stringify({ title:title, due:dueDate })
    });
    const task = await res.json();
    alert("✅ Task added: "+task.title);
    listTasks();
  } catch(err){ console.error(err); alert("❌ Failed to add task."); }
}

// Fetch tasks helper
async function fetchTasks() {
  const accessToken = window.getAccessToken();
  if (!accessToken) return [];
  const res = await fetch("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks", {
    headers: { Authorization:"Bearer "+accessToken }
  });
  const data = await res.json();
  return data.items || [];
}

// Mark complete / delete by task id
async function markTaskComplete(id) { const accessToken=window.getAccessToken(); if(!accessToken)return; await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${id}`,{method:"PATCH",headers:{Authorization:"Bearer "+accessToken,"Content-Type":"application/json"},body:JSON.stringify({status:"completed"})}); listTasks(); }
async function deleteTask(id) { const accessToken=window.getAccessToken(); if(!accessToken)return; await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${id}`,{method:"DELETE",headers:{Authorization:"Bearer "+accessToken}}); listTasks(); }

// Complete/Delete by task name
async function completeTaskByName(name) { const tasks=await fetchTasks(); const t=tasks.find(t=>t.title.toLowerCase()===name.toLowerCase()); if(t) await markTaskComplete(t.id); else alert(`Task "${name}" not found`); }
async function deleteTaskByName(name) { const tasks=await fetchTasks(); const t=tasks.find(t=>t.title.toLowerCase()===name.toLowerCase()); if(t) await deleteTask(t.id); else alert(`Task "${name}" not found`); }

// List tasks with optional filter
async function listTasks(filter){
  const tasks=await fetchTasks();
  const now=new Date();
  const listEl=document.getElementById("tasksList");
  listEl.innerHTML="";
  const filtered=tasks.filter(task=>{
    if(filter==="completed") return task.status==="completed";
    if(filter==="overdue") return task.due && new Date(task.due)<now && task.status!=="completed";
    return true;
  });
  if(filtered.length===0){ listEl.innerHTML="<li>No tasks found</li>"; return; }
  filtered.forEach(task=>{
    const li=document.createElement("li");
    let taskText=task.title; if(task.due) taskText+=` (Due: ${formatDate(task.due)})`;
    li.textContent=task.status==="completed"?"✔ "+taskText:taskText;
    if(task.status!=="completed"){ const btn=document.createElement("button"); btn.textContent="Mark Complete"; btn.style.marginLeft="10px"; btn.onclick=()=>markTaskComplete(task.id); li.appendChild(btn); }
    const delBtn=document.createElement("button"); delBtn.textContent="Delete"; delBtn.style.marginLeft="10px"; delBtn.onclick=()=>deleteTask(task.id); li.appendChild(delBtn);
    listEl.appendChild(li);
  });
}

// Voice recognition
let recognition;
if("webkitSpeechRecognition" in window||"SpeechRecognition" in window){
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new SpeechRecognition();
  recognition.continuous=false; recognition.lang="en-US";
  recognition.onstart=()=>{document.getElementById("statusText").innerText="🎤 Listening..."; document.getElementById("listenBtn").style.display="none"; document.getElementById("stopBtn").style.display="inline-block";}
  recognition.onend=()=>{document.getElementById("statusText").innerText="🛑 Stopped listening"; document.getElementById("listenBtn").style.display="inline-block"; document.getElementById("stopBtn").style.display="none";}
  recognition.onresult=async (event)=>{
    const t=event.results[0][0].transcript.trim();
    document.getElementById("log").innerHTML+=`<div>🗣 You said: ${t}</div>`;
    const lower=t.toLowerCase();
    if(lower.startsWith("add task")){ const title=t.slice(8).trim(); if(title){ document.getElementById("taskTitle").value=title; await addTask(); } }
    else if(lower.startsWith("complete task")){ const title=t.slice(13).trim(); if(title) await completeTaskByName(title); }
    else if(lower.startsWith("delete task")){ const title=t.slice(11).trim(); if(title) await deleteTaskByName(title); }
    else if(lower.includes("list completed tasks")){ listTasks("completed"); }
    else if(lower.includes("list overdue tasks")){ listTasks("overdue"); }
    else if(lower.includes("list tasks")){ listTasks(); }
  };
  document.getElementById("listenBtn").onclick=()=>recognition.start();
  document.getElementById("stopBtn").onclick=()=>recognition.stop();
}else{ alert("⚠️ Your browser does not support Speech Recognition."); }
