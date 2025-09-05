// config.js
const CLIENT_ID = "943220084061-ujlua6j24n7amv6tuufhtuaueh5rbf00.apps.googleusercontent.com";

const SCOPES = [
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/contacts.readonly"
].join(" ");

const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest",
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
  "https://www.googleapis.com/discovery/v1/apis/people/v1/rest"
];
