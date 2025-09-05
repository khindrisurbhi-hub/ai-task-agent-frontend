# AI Task Agent

AI Task Agent is a web-based productivity assistant that connects to your Google Workspace data.  
It uses voice commands or buttons to let you manage tasks and view important information in one place.

## Features
- **Google Tasks**: Add, list, complete, and delete tasks.
- **Google Calendar**: View upcoming events (read-only).
- **Gmail**: View recent messages (read-only).
- **Google Contacts**: View your saved contacts (read-only).
- **Voice commands**: Add/list tasks, list events, list Gmail, list contacts.

## Data access
- The app **only** requests the following Google OAuth scopes:
  - `https://www.googleapis.com/auth/tasks` — manage tasks
  - `https://www.googleapis.com/auth/calendar.readonly` — read calendar events
  - `https://www.googleapis.com/auth/gmail.readonly` — read Gmail message metadata/snippets
  - `https://www.googleapis.com/auth/contacts.readonly` — read contacts
- It does **not** send data to third parties.
- It does **not** modify Gmail, Calendar, or Contacts — those are read-only.

## Live Demo
[https://ai-task-agent-frontend.onrender.com](https://ai-task-agent-frontend.onrender.com)

## Privacy & Terms
- [Privacy Policy](https://ai-task-agent-frontend.onrender.com/privacy)  
- [Terms of Service](https://ai-task-agent-frontend.onrender.com/terms)

## Development
- Frontend: HTML, JS (vanilla), Google Identity Services.
- Backend: Node.js (Render).
- Config: `config.js` contains OAuth client ID and scope definitions.

## License
MIT

