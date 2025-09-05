# AI Task Agent  

AI Task Agent is a web application that integrates with Google services to help you manage your daily life. It allows you to:  
- ✅ Create, list, complete, and delete **Google Tasks**  
- ✅ View your upcoming **Google Calendar events**  
- ✅ See your latest **Gmail emails** (subject + snippet only)  
- ✅ Access your saved **Google Contacts**  
- ✅ Use **voice commands** to interact hands-free  

---

## Features  

### Google Tasks  
- Add new tasks with optional due dates  
- View all tasks (overdue, completed, upcoming)  
- Mark tasks as completed or delete them  

### Google Calendar  
- View up to 5 upcoming events from your primary calendar  

### Gmail  
- View the 5 most recent email subjects and snippets  

### Google Contacts  
- View up to 5 saved contacts (name + email)  

### Voice Commands  
Say commands like:  
- `"Add task [task name]"`  
- `"List tasks"`  
- `"Show calendar"`  
- `"Show Gmail"`  
- `"Show contacts"`  

---

## Tech Stack  
- **Frontend:** HTML, CSS, JavaScript  
- **APIs:** Google Tasks API, Google Calendar API, Gmail API, People API (Contacts)  
- **Authentication:** Google Identity Services (OAuth2)  

---

## Setup  

1. Clone the repo  
2. Add your Google **OAuth 2.0 Client ID** in `config.js`  
3. Deploy frontend (we use [Render](https://render.com))  
4. Set up your OAuth consent screen in Google Cloud Console  
5. Add authorized domain:  
   https://ai-task-agent-frontend.onrender.com  

---

## Privacy & Data Access  

- This app only requests the following **Google OAuth Scopes**:  
  - `https://www.googleapis.com/auth/tasks`  
  - `https://www.googleapis.com/auth/calendar.readonly`  
  - `https://www.googleapis.com/auth/gmail.readonly`  
  - `https://www.googleapis.com/auth/contacts.readonly`  

- It does **not** send or share your data anywhere outside Google’s APIs.  
- It does **not** access Google Keep, Reminders, or third-party apps.  
- It does **not** store any data on external servers.  

---

## License  
MIT License.  

