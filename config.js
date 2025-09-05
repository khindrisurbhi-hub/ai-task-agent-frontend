// config.js
// ✅ Update only CLIENT_ID if it ever changes in Google Cloud.
const CLIENT_ID =
  "943220084061-ujlua6j24n7amv6tuufhtuaueh5rbf00.apps.googleusercontent.com";

// Request exactly the scopes you need for your demo & verification:
const SCOPES = [
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/contacts.readonly",
].join(" ");

// API base URLs
const TASKS_API = "https://tasks.googleapis.com/tasks/v1";
const CAL_API = "https://www.googleapis.com/calendar/v3";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";
const PEOPLE_API = "https://people.googleapis.com/v1";

// (Optional) Your backend if you use one for anything else later
const BACKEND_URL = "https://ai-task-agent-backend.onrender.com";
