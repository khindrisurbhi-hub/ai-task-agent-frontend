// ✅ Replace with your real OAuth 2.0 Client ID from Google Cloud Console
const CLIENT_ID = "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com";

const SCOPES = `
  https://www.googleapis.com/auth/tasks
  https://www.googleapis.com/auth/calendar.readonly
  https://www.googleapis.com/auth/gmail.readonly
  https://www.googleapis.com/auth/contacts.readonly
`;

export { CLIENT_ID, SCOPES };
