// Generates a REAL, working Google Meet link by creating a short Google
// Calendar event on the signed-in teacher's own calendar and letting Google
// attach a Meet conference to it. This is intentionally separate from the
// app's Firebase `auth` / `googleProvider` (used for login) - we only ever
// ask Google for a short-lived Calendar access token here, so an already
// logged-in teacher's session is never touched or replaced.
//
// Setup required (one-time, in Google Cloud Console for this Firebase
// project):
//   1. APIs & Services -> Library -> enable "Google Calendar API".
//   2. APIs & Services -> Credentials -> create an OAuth 2.0 Client ID of
//      type "Web application". Add your dev URL (e.g. http://localhost:5173)
//      and your deployed GitHub Pages URL under "Authorized JavaScript
//      origins".
//   3. Put that client ID in your `.env` as VITE_GOOGLE_OAUTH_CLIENT_ID.
//   4. While the OAuth consent screen is in "Testing" mode, add every
//      teacher Google account that should be able to generate links under
//      "Test users" (Calendar access is a sensitive scope, so Google
//      restricts it to test users until the app is verified).

const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined;
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

let gisScriptPromise: Promise<void> | null = null;

// Loads Google Identity Services on first use so we don't have to add a
// hard <script> dependency to index.html (and so nothing breaks if the
// network request is blocked - it just fails when the button is clicked).
function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });

  return gisScriptPromise;
}

// One-off, in-memory only. We deliberately do NOT persist this anywhere
// (no localStorage/Firestore) - it just avoids re-prompting for consent
// more than once per browser tab session.
let cachedAccessToken: string | null = null;

async function getCalendarAccessToken(): Promise<string> {
  if (!CLIENT_ID) {
    throw new Error(
      "Google Calendar isn't configured yet - ask whoever manages the project to set VITE_GOOGLE_OAUTH_CLIENT_ID."
    );
  }
  if (cachedAccessToken) return cachedAccessToken;

  await loadGoogleIdentityServices();

  return new Promise<string>((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error("Google Identity Services didn't load. Check your connection and try again."));
      return;
    }
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: CALENDAR_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || "Google didn't grant Calendar access."));
          return;
        }
        cachedAccessToken = resp.access_token;
        resolve(resp.access_token);
      },
      error_callback: (err) => {
        reject(new Error(err.message || "Google sign-in for Calendar access was cancelled."));
      },
    });
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

/**
 * Creates a real Google Calendar event (starting now, 1 hour long) with a
 * Google Meet conference attached, and returns the meet.google.com link.
 * Retries once with a fresh consent prompt if the cached token has expired.
 */
export async function generateGoogleMeetLink(title: string): Promise<string> {
  const attempt = async (forceFreshToken: boolean): Promise<string> => {
    if (forceFreshToken) cachedAccessToken = null;
    const accessToken = await getCalendarAccessToken();

    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: title?.trim() || "Class Meeting",
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          conferenceData: {
            createRequest: {
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }),
      }
    );

    if (res.status === 401 && !forceFreshToken) {
      // Cached token expired - clear it and prompt for consent again.
      return attempt(true);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error?.message || `Google Calendar API error (${res.status})`);
    }

    const event = await res.json();
    const meetLink: string | undefined =
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find((e: { entryPointType?: string }) => e.entryPointType === "video")?.uri;

    if (!meetLink) throw new Error("Google created the event but didn't return a Meet link.");
    return meetLink;
  };

  return attempt(false);
}
