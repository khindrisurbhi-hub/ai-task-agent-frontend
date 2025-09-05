# AI Task Agent  

AI Task Agent is a web app that integrates with Google services to help manage daily life.  

✅ Features:  
- Google **Tasks** (create, list, delete, complete)  
- Google **Calendar** (view upcoming events)  
- Google **Gmail** (read latest 5 emails)  
- Google **Contacts** (view saved contacts)  
- **Voice commands** for hands-free control  

---

## Tech Stack  
- Frontend: HTML, CSS, JS  
- APIs: Google Tasks, Calendar, Gmail, People (Contacts)  
- Auth: Google Identity Services (OAuth2)  

---

## Setup  

1. Clone repo  
2. Put your OAuth Client ID in `config.js` (already done in this version)  
3. Deploy frontend (e.g., Render)  
4. In Google Cloud Console:  
   - Enable **Tasks, Calendar, Gmail, People APIs**  
   - Add these scopes to OAuth Consent Screen:  
     - `https://www.googleapis.com/auth/tasks`  
     - `https://www.googleapis.com/auth/calendar.readonly`  
     - `https://www.googleapis.com/auth/gmail.readonly`  
     - `https://www.googleapis.com/auth/contacts.readonly`  

---

## Privacy & Data Access  

- Only requests read-only for Gmail, Calendar, Contacts.  
- Does not share data outside Google APIs.  
- No third-party storage.  

---

## License  
MIT License
