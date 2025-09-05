# AI Task Agent

AI Task Agent is a web-based productivity assistant that connects with your Google Workspace.  
It helps you manage tasks and stay organized using **Google Tasks, Calendar, Gmail, and Contacts** — all in one place.  
You can interact through **buttons** or **voice commands**.

---

## ✨ Features
- **Google Tasks**
  - Add new tasks
  - List tasks
  - Complete tasks
  - Delete tasks
- **Google Calendar**
  - View upcoming calendar events (read-only)
- **Gmail**
  - View your recent emails (read-only)
- **Google Contacts**
  - View saved contacts (read-only)
- **Voice Commands**
  - Add tasks by saying: *"Add task buy groceries"*
  - List tasks by saying: *"List tasks"*
  - Complete/delete tasks by voice
  - Show calendar, Gmail, or contacts with commands

---

## 🔐 Data Access & Privacy
- The app **only** requests these Google OAuth scopes:
  - `https://www.googleapis.com/auth/tasks` → Create, edit, and delete tasks
  - `https://www.googleapis.com/auth/calendar.readonly` → Read calendar events
  - `https://www.googleapis.com/auth/gmail.readonly` → Read Gmail snippets/metadata
  - `https://www.googleapis.com/auth/contacts.readonly` → Read contacts
- **No data is shared with third parties.**
- **No sensitive Gmail/Calendar/Contacts modifications** are made — they are **read-only**.
- The app does **not** access Google Keep, Reminders, or other third-party apps.

---

## 🚀 Live Demo
👉 [AI Task Agent](https://ai-task-agent-frontend.onrender.com)

---

## 📄 Policies
- [Privacy Policy](https://ai-task-agent-frontend.onrender.com/privacy)  
- [Terms of Service](https://ai-task-agent-frontend.onrender.com/terms)

---

## ⚙️ Development
- **Frontend:** HTML + Vanilla JS + Google Identity Services
- **Backend:** Node.js + Express (hosted on Render)
- **Speech Recognition:** Web Speech API
- **Config:** `config.js` stores OAuth Client ID and scope settings

---

## 🧑‍💻 Setup
1. Clone this repo
2. Update `config.js` with your Google OAuth **Client ID**
3. Deploy backend & frontend to HTTPS domains
4. Add your authorized domains in Google Cloud Console
5. Run on `https://ai-task-agent-frontend.onrender.com`

---

## 📜 License
MIT License

---

