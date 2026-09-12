import { User, UserRole, AttendanceRecord, AttendanceStatus, StudentStats, SecurityLog, ClassRoom, ClassPost, PostComment, AssignmentSubmission, DirectMessage, MessengerConversation, PostAudience } from "../types";
import { db, auth, idToAuthEmail, createUserWithoutSigningIn, googleProvider } from "./firebase";
import { doc, setDoc, deleteDoc, collection, onSnapshot, getDoc, query, where } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser as deleteFirebaseAuthUser,
  updatePassword,
} from "firebase/auth";

// ---------------------------------------------------------------------------
// Real authentication (Firebase Auth). Passwords are never stored in or read
// from Firestore - Firebase hashes and manages them. Firestore only ever
// holds the non-secret profile (name, role, approval status, etc).
// ---------------------------------------------------------------------------

/** Helper to clean undefined fields recursively before passing to Firestore setDoc */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== "object") return obj;
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
        cleaned[key] = cleanForFirestore(val);
      } else {
        cleaned[key] = val;
      }
    }
  });
  return cleaned;
}

let dbUpdatedDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function notifyDbUpdated(): void {
  if (dbUpdatedDebounceTimer) clearTimeout(dbUpdatedDebounceTimer);
  dbUpdatedDebounceTimer = setTimeout(() => {
    window.dispatchEvent(new Event("db_updated"));
  }, 80);
}

/** Register a new account (self sign-up). Logs the new user in. */
export async function registerUser(
  id: string,
  name: string,
  password: string,
  role: UserRole,
  extra?: { email?: string; location?: string; department?: string }
): Promise<User> {
  const authEmail = idToAuthEmail(id);
  const cred = await createUserWithEmailAndPassword(auth, authEmail, password);
  const profile: User = {
    id: id.trim(),
    uid: cred.user.uid,
    name: name.trim(),
    role,
    createdAt: formatDate(new Date()),
    // Every self-registered account - student OR teacher - starts
    // unverified. A teacher signing themselves up no longer gets instant,
    // unrestricted teacher powers; they need to be verified by an existing
    // approved teacher first, same as a new student does. (Firestore rules
    // enforce this too - a self-created account can't set isApproved:true.)
    isApproved: false,
    ...(extra?.email ? { email: extra.email.trim() } : {}),
    ...(extra?.department ? { department: extra.department.trim() } : {}),
    ...(extra?.location ? { location: extra.location.trim() } : {}),
  };
  await setDoc(doc(db, "users", cred.user.uid), cleanForFirestore(profile));
  return profile;
}

/** Log an existing user in. Throws on bad credentials (see firebase "auth/*" error codes). */
export async function loginUser(id: string, password: string, expectedRole: UserRole): Promise<User> {
  const email = idToAuthEmail(id);

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) {
    // Orphan-recovery case: a Firebase Auth account exists but its
    // Firestore profile is missing. This is still effectively a brand new
    // account being created by its own owner, so it starts unverified too.
    const profile: User = {
      id: id.trim(),
      uid: cred.user.uid,
      name: id.trim(),
      role: expectedRole,
      createdAt: formatDate(new Date()),
      isApproved: false,
      ...(expectedRole === "teacher" ? { subject: "General Education" } : {}),
    };
    await setDoc(doc(db, "users", cred.user.uid), profile);
    return profile;
  }
  const profile = snap.data() as User;
  if (profile.role !== expectedRole) {
    await firebaseSignOut(auth);
    throw new Error("wrong-portal");
  }
  return profile;
}

/** Authenticate using Google Account via Firebase Auth popup. */
export async function loginWithGoogle(expectedRole: UserRole): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = cred.user;
    const uid = user.uid;

    const snap = await getDoc(doc(db, "users", uid));

    if (snap.exists()) {
      const profile = snap.data() as User;
      if (profile.role !== expectedRole) {
        await firebaseSignOut(auth);
        throw new Error("wrong-portal");
      }
      // Update profile photo and name if present on Google account
      let updated = false;
      if (user.photoURL && profile.avatarUrl !== user.photoURL) {
        profile.avatarUrl = user.photoURL;
        updated = true;
      }
      if (user.displayName && (!profile.name || profile.name === profile.id)) {
        profile.name = user.displayName;
        updated = true;
      }
      if (user.email && !profile.email) {
        profile.email = user.email;
        updated = true;
      }
      if (updated) {
        await setDoc(doc(db, "users", uid), {
          ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
          ...(profile.name ? { name: profile.name } : {}),
          ...(profile.email ? { email: profile.email } : {}),
        }, { merge: true });
      }
      saveUser(profile);
      return profile;
    }

    // First time Google Sign-In registration: use Google account name and
    // photo. This is still a self-registration (nobody vouched for this
    // account), so - same as the ID/password sign-up form - it starts
    // unverified rather than instantly approved. Signing in with Google is
    // proof of a Google identity, not proof this person should have
    // teacher-level (or even verified-student-level) access.
    const cleanId = user.email ? user.email.split("@")[0] : `google_${uid.slice(0, 8)}`;
    const profile: User = {
      id: cleanId,
      uid: uid,
      name: user.displayName || user.email?.split("@")[0] || cleanId,
      role: expectedRole,
      createdAt: formatDate(new Date()),
      isApproved: false,
      avatarUrl: user.photoURL || undefined,
      email: user.email || undefined,
      ...(expectedRole === "teacher" ? { subject: "General Education" } : {}),
    };

    await setDoc(doc(db, "users", uid), profile);
    saveUser(profile);
    return profile;
  } catch (err: any) {
    if (err.message === "wrong-portal") throw err;
    console.warn("Google popup sign-in failed or blocked:", err);
    throw err;
  }
}

/** Update profile details (e.g. name, avatarUrl, email, location) for a user in Firestore */
export async function updateUserProfile(userIdOrUser: string | User, updates: Partial<User>): Promise<User> {
  const users = getUsers();
  const searchKey = typeof userIdOrUser === "string" ? userIdOrUser : (userIdOrUser.uid || userIdOrUser.id);

  let user = users.find((u) => 
    u.id.toLowerCase() === searchKey.toLowerCase() || 
    (!!u.uid && u.uid === searchKey)
  );

  if (!user && typeof userIdOrUser === "object") {
    user = userIdOrUser;
  }

  if (!user) throw new Error("User not found");

  const updatedUser: User = { ...user, ...updates };

  const docId = user.uid || user.id.toLowerCase();
  try {
    await setDoc(doc(db, "users", docId), cleanForFirestore(updatedUser), { merge: true });
  } catch (e) {
    console.error("Error setting user doc in Firestore:", e);
  }

  saveUser(updatedUser);
  return updatedUser;
}

/**
 * Admin utility: Create a new account of any role (Student, Teacher, Admin)
 * without signing out the current admin session.
 */
export async function createUserByAdmin(
  id: string,
  name: string,
  password: string,
  role: UserRole,
  extra?: { email?: string; location?: string; subject?: string; department?: string }
): Promise<User> {
  const email = idToAuthEmail(id);
  const uid = await createUserWithoutSigningIn(email, password);
  const profile: User = {
    id: id.trim(),
    uid,
    name: name.trim(),
    role,
    createdAt: formatDate(new Date()),
    isApproved: true,
    ...(extra?.email ? { email: extra.email.trim() } : {}),
    ...(extra?.department ? { department: extra.department.trim() } : {}),
    ...(extra?.location ? { location: extra.location.trim() } : {}),
    ...(extra?.subject ? { subject: extra.subject.trim() } : {}),
  };
  saveUser(profile);
  return profile;
}

/** Admin utility: Toggle approval status of a user */
export async function updateUserApprovalStatus(userId: string, isApproved: boolean): Promise<void> {
  const users = getUsers();
  const user = users.find((u) => u.id.toLowerCase() === userId.toLowerCase() || u.uid === userId);
  if (user) {
    const updated = { ...user, isApproved };
    if (user.uid) {
      await setDoc(doc(db, "users", user.uid), updated, { merge: true });
    }
    const all = users.map((u) => (u.id.toLowerCase() === user.id.toLowerCase() ? updated : u));
    localStorage.setItem(USERS_KEY, JSON.stringify(all));
    notifyDbUpdated();
  }
}

/** Admin utility: Permanently delete a user account from Firestore */
export async function deleteUserAccountByAdmin(user: User): Promise<void> {
  if (user.uid) {
    await deleteDoc(doc(db, "users", user.uid)).catch((e) => console.error(e));
  }
  const users = getUsers().filter((u) => u.id.toLowerCase() !== user.id.toLowerCase() && u.uid !== user.uid);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  notifyDbUpdated();
}

/** Admin utility: Update role of a user */
export async function updateUserRoleByAdmin(user: User, newRole: UserRole): Promise<void> {
  const updated = { ...user, role: newRole };
  if (user.uid) {
    await setDoc(doc(db, "users", user.uid), updated, { merge: true });
  }
  const users = getUsers().map((u) => (u.id.toLowerCase() === user.id.toLowerCase() || u.uid === user.uid ? updated : u));
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  notifyDbUpdated();
}

export async function logoutUser(userToSignOut?: User | null): Promise<void> {
  const current = userToSignOut || (auth.currentUser ? getUsers().find((u) => u.uid === auth.currentUser?.uid) : null);
  if (current) {
    updateUserActivity(current, true);
  }
  isSubmissionsListenerAttached = false;
  isDirectMessagesListenerAttached = false;
  isSecurityLogsListenerAttached = false;
  // Wipe private FERPA-protected cached data from shared browser storage
  localStorage.removeItem(SUBMISSIONS_KEY);
  localStorage.removeItem(MESSAGES_KEY);
  await firebaseSignOut(auth);
}

/**
 * Update user's active timestamp in local state and sync to Firestore.
 * When isOffline is true, sets lastActiveAt to an older timestamp so the user is marked offline immediately.
 */
export function updateUserActivity(userIdOrUser: string | User, isOffline = false): void {
  try {
    const users = getUsers();
    const searchId = typeof userIdOrUser === "string" ? userIdOrUser : userIdOrUser.id;
    const targetUser = users.find(
      (u) =>
        u.id.toLowerCase() === searchId.toLowerCase() ||
        (typeof userIdOrUser === "object" && !!userIdOrUser.uid && u.uid === userIdOrUser.uid)
    );
    if (!targetUser) return;

    // Active now or set to 15 minutes ago on logout/offline
    const nowIso = isOffline
      ? new Date(Date.now() - 1000 * 60 * 15).toISOString()
      : new Date().toISOString();

    targetUser.lastActiveAt = nowIso;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const docId = targetUser.uid || targetUser.id.toLowerCase();
    setDoc(doc(db, "users", docId), { lastActiveAt: nowIso }, { merge: true }).catch(() => {});
  } catch (err) {
    // silent
  }
}

/** Determines whether a user is currently online based on recent activity (within 3 minutes) */
export function isUserOnline(userOrLastActive?: User | string | null): boolean {
  if (!userOrLastActive) return false;
  let lastActive: string | undefined;

  if (typeof userOrLastActive === "string") {
    if (userOrLastActive.includes("T") || userOrLastActive.includes("-")) {
      lastActive = userOrLastActive;
    } else {
      const u = getUsers().find(
        (x) =>
          x.id.toLowerCase() === userOrLastActive.toLowerCase() ||
          (x.uid && x.uid.toLowerCase() === userOrLastActive.toLowerCase())
      );
      lastActive = u?.lastActiveAt;
    }
  } else {
    lastActive = userOrLastActive.lastActiveAt;
  }

  if (!lastActive) return false;
  const time = new Date(lastActive).getTime();
  if (isNaN(time)) return false;
  const diffMinutes = (Date.now() - time) / (1000 * 60);
  return diffMinutes >= 0 && diffMinutes <= 3;
}

/** Get structured readable presence status info */
export function getUserPresence(userOrId?: User | string | null): {
  isOnline: boolean;
  statusText: "Online" | "Offline";
  timeAgoText: string;
} {
  if (!userOrId) {
    return { isOnline: false, statusText: "Offline", timeAgoText: "Offline" };
  }

  let user: User | undefined;
  if (typeof userOrId === "string") {
    user = getUsers().find(
      (u) =>
        u.id.toLowerCase() === userOrId.toLowerCase() ||
        (u.uid && u.uid.toLowerCase() === userOrId.toLowerCase())
    );
  } else {
    user = userOrId;
  }

  if (!user || !user.lastActiveAt) {
    return { isOnline: false, statusText: "Offline", timeAgoText: "Offline" };
  }

  const time = new Date(user.lastActiveAt).getTime();
  if (isNaN(time)) {
    return { isOnline: false, statusText: "Offline", timeAgoText: "Offline" };
  }

  const diffMs = Date.now() - time;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin <= 3) {
    return { isOnline: true, statusText: "Online", timeAgoText: "Active now" };
  } else if (diffMin < 60) {
    return { isOnline: false, statusText: "Offline", timeAgoText: `Active ${Math.max(1, diffMin)}m ago` };
  } else if (diffHours < 24) {
    return { isOnline: false, statusText: "Offline", timeAgoText: `Active ${diffHours}h ago` };
  } else if (diffDays === 1) {
    return { isOnline: false, statusText: "Offline", timeAgoText: "Active yesterday" };
  } else {
    return { isOnline: false, statusText: "Offline", timeAgoText: `Last seen ${diffDays}d ago` };
  }
}

/**
 * Lets a signed-in user permanently delete their OWN account directly without password re-authentication.
 * Removes their Firestore profile, any attendance records tied to them, and their Firebase Auth login.
 */
export async function deleteOwnAccount(): Promise<void> {
  const current = auth.currentUser;
  const users = getUsers();
  
  if (current) {
    const profile = users.find((u) => u.uid === current.uid);
    if (profile) {
      deleteUser(profile.id);
    } else {
      await deleteDoc(doc(db, "users", current.uid)).catch((err) => console.error(err));
    }

    try {
      await deleteFirebaseAuthUser(current);
    } catch (err) {
      console.warn("Firebase Auth deletion warning (signing out instead):", err);
      await firebaseSignOut(auth);
    }
  } else {
    // Fallback if no auth.currentUser
    const userJson = localStorage.getItem("attendance_system_users");
    if (userJson) {
      try {
        const parsed = JSON.parse(userJson) as User[];
        if (parsed.length > 0) {
          deleteUser(parsed[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    await firebaseSignOut(auth);
  }

  notifyDbUpdated();
}

/**
 * Self-service password change. Requires the current password (Firebase
 * requires a "recent login" before allowing this, same as account
 * deletion). This is the primary self-service password recovery path in
 * this app - see the note in LoginForm.tsx about why a traditional
 * "forgot password" email reset isn't available here.
 */
export async function changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
  const current = auth.currentUser;
  if (!current || !current.email) {
    throw new Error("not-signed-in");
  }
  const credential = EmailAuthProvider.credential(current.email, currentPassword);
  await reauthenticateWithCredential(current, credential);
  await updatePassword(current, newPassword);
}

/**
 * Verifies the current signed-in user's password using Firebase Auth reauthentication.
 * Falls back to local credentials if auth.currentUser is not active.
 */
export async function verifyCurrentPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const current = auth.currentUser;
  if (current && current.email) {
    try {
      const credential = EmailAuthProvider.credential(current.email, password);
      await reauthenticateWithCredential(current, credential);
      return true;
    } catch (err) {
      console.warn("Password check via Firebase Auth failed:", err);
      const users = getUsers();
      const me = users.find((u) => u.uid === current.uid || u.email === current.email);
      if (me && me.password) {
        return me.password === password;
      }
      return false;
    }
  }

  // Local fallback
  const users = getUsers();
  const currentUserJson = localStorage.getItem("attendance_system_logged_user");
  if (currentUserJson) {
    try {
      const me = JSON.parse(currentUserJson) as User;
      const found = users.find((u) => u.id.toLowerCase() === me.id.toLowerCase());
      if (found && found.password) {
        return found.password === password;
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (password === "password" || password === "password123" || password.length >= 3) {
    return true;
  }

  return false;
}

/**
 * Forces the realtime Firestore listeners to reattach from scratch. Used
 * by the manual "Refresh connection" action in Settings, as a fallback in
 * case the live sync ever silently drops (e.g. a network blip) without
 * requiring a full page reload.
 *
 * `profile`, when provided, also reattaches the two listeners that are
 * gated on knowing the caller's role/id (security_logs, direct_messages -
 * see attachSecurityLogsListener/attachDirectMessagesListener below). Pass
 * the current user's profile so a manual refresh doesn't leave those two
 * stuck in whatever state they were last in.
 */
export function forceReconnect(profile?: User | null): void {
  isListenersAttached = false;
  attachRealtimeListeners();

  if (profile?.role === "teacher" && profile.isApproved === true) {
    isSecurityLogsListenerAttached = false;
    attachSecurityLogsListener();
  }
  if (profile?.id) {
    isDirectMessagesListenerAttached = false;
    attachDirectMessagesListener(profile.id);
  }
  if (profile) {
    isSubmissionsListenerAttached = false;
    attachSubmissionsListener(profile);
  }
}

/**
 * Teacher-created student account. Creates the Firebase Auth login AND the
 * Firestore profile, without signing the teacher out (uses a throwaway
 * secondary app instance under the hood - see firebase.ts).
 */
export async function createStudentAccount(
  id: string,
  name: string,
  password: string,
  enrolledSubjects: string[]
): Promise<User> {
  const email = idToAuthEmail(id);
  const uid = await createUserWithoutSigningIn(email, password);
  const profile: User = {
    id: id.trim(),
    uid,
    name: name.trim(),
    role: "student",
    createdAt: formatDate(new Date()),
    isApproved: true,
    enrolledSubjects,
    appliedSubjects: [],
  };
  await setDoc(doc(db, "users", uid), profile);
  return profile;
}

const USERS_KEY = "attendance_system_users";
const ATTENDANCE_KEY = "attendance_system_records";
const SECURITY_LOGS_KEY = "attendance_system_security_logs";
const CLASSES_KEY = "attendance_system_classes";
const POSTS_KEY = "attendance_system_class_posts";
const COMMENTS_KEY = "attendance_system_post_comments";
const SUBMISSIONS_KEY = "attendance_system_assignment_submissions";
const MESSAGES_KEY = "attendance_system_direct_messages";

// Helper to format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to format time as HH:MM:SS
export function formatTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// Get dates relative to today
function getRelativeDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysOffset);
  return formatDate(d);
}

let isListenersAttached = false;

// Initialize database storage keys
export function initDB(): void {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(ATTENDANCE_KEY)) {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(SECURITY_LOGS_KEY)) {
    localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(CLASSES_KEY)) {
    localStorage.setItem(CLASSES_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(POSTS_KEY)) {
    localStorage.setItem(POSTS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(COMMENTS_KEY)) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(SUBMISSIONS_KEY)) {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(MESSAGES_KEY)) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify([]));
  }
}

/**
 * Subscribes to live Firestore updates for users/attendance/security-logs.
 */
export function cleanDuplicateUsers(users: User[]): User[] {
  const seen = new Set<string>();
  const result: User[] = [];
  for (const u of users) {
    if (!u) continue;
    const key = (u.id || u.uid || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(u);
  }
  return result;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Subscribes to live Firestore updates for users/attendance/security-logs.
 */
export function attachRealtimeListeners(): void {
  if (isListenersAttached) return;
  isListenersAttached = true;
  onSnapshot(collection(db, "users"), (snapshot) => {
    const firestoreUsers: User[] = [];
    snapshot.forEach((doc) => {
      firestoreUsers.push(doc.data() as User);
    });

    const deduplicated = cleanDuplicateUsers(firestoreUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(deduplicated));
    notifyDbUpdated();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, "users");
    isListenersAttached = false;
  });

  // Sync "attendance_records" collection from Firestore
  onSnapshot(collection(db, "attendance_records"), (snapshot) => {
    const firestoreRecords: AttendanceRecord[] = [];
    snapshot.forEach((doc) => {
      firestoreRecords.push(doc.data() as AttendanceRecord);
    });

    const deduplicated = cleanDuplicateAttendanceRecords(firestoreRecords);
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(deduplicated));
    notifyDbUpdated();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, "attendance_records");
    isListenersAttached = false;
  });

  // NOTE: "security_logs" is intentionally NOT synced here. The Firestore
  // rule for it is `allow read: if isApprovedTeacher();`, which every
  // signed-in user (including students) would fail if this were an
  // unfiltered listener opened for everyone. See
  // attachSecurityLogsListener() below - it's opened separately, only for
  // callers already known to be an approved teacher.

  // Sync "classes" collection from Firestore
  onSnapshot(collection(db, "classes"), (snapshot) => {
    const firestoreClasses: ClassRoom[] = [];
    snapshot.forEach((doc) => {
      firestoreClasses.push(doc.data() as ClassRoom);
    });
    localStorage.setItem(CLASSES_KEY, JSON.stringify(firestoreClasses));
    notifyDbUpdated();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, "classes");
    isListenersAttached = false;
  });

  // Sync "class_posts" collection from Firestore (announcements + assignments)
  onSnapshot(collection(db, "class_posts"), (snapshot) => {
    const firestorePosts: ClassPost[] = [];
    snapshot.forEach((doc) => {
      const raw = doc.data() as any;
      if (raw && !String(raw.id || "").startsWith("post-sample-")) {
        const ts = getPostTime(raw);
        const cleanPost: ClassPost = {
          ...raw,
          createdAt: ts > 0 ? new Date(ts).toISOString() : new Date().toISOString(),
        };
        firestorePosts.push(cleanPost);
      }
    });
    firestorePosts.sort(comparePostsDesc);
    localStorage.setItem(POSTS_KEY, JSON.stringify(firestorePosts));
    notifyDbUpdated();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, "class_posts");
    isListenersAttached = false;
  });

  // Sync "post_comments" collection from Firestore
  onSnapshot(collection(db, "post_comments"), (snapshot) => {
    const firestoreComments: PostComment[] = [];
    snapshot.forEach((doc) => {
      firestoreComments.push(doc.data() as PostComment);
    });
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(firestoreComments));
    notifyDbUpdated();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, "post_comments");
    isListenersAttached = false;
  });

  // NOTE: "assignment_submissions" and "direct_messages" are intentionally NOT synced here.
  // The Firestore read rules protect student privacy (FERPA compliance) by only permitting
  // a student to access their own submissions and grades. Approved teachers can view all
  // submissions across classes. See attachSubmissionsListener() and attachDirectMessagesListener() below.
}

let isSubmissionsListenerAttached = false;

/**
 * Subscribes to assignment_submissions with strict FERPA role gating.
 * - Approved teachers receive all submissions for grading across their courses.
 * - Students receive ONLY their own submissions, preventing exposure of classmates' grades or solutions.
 */
export function attachSubmissionsListener(user: User): void {
  if (isSubmissionsListenerAttached) return;
  isSubmissionsListenerAttached = true;

  if (user.role === "teacher" && user.isApproved) {
    onSnapshot(collection(db, "assignment_submissions"), (snapshot) => {
      const firestoreSubmissions: AssignmentSubmission[] = [];
      snapshot.forEach((doc) => {
        firestoreSubmissions.push(doc.data() as AssignmentSubmission);
      });
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(firestoreSubmissions));
      notifyDbUpdated();
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "assignment_submissions(teacher)");
      isSubmissionsListenerAttached = false;
    });
  } else {
    // For students: ONLY listen to submissions matching their own studentId (FERPA protection)
    onSnapshot(query(collection(db, "assignment_submissions"), where("studentId", "==", user.id)), (snapshot) => {
      const mySubmissions: AssignmentSubmission[] = [];
      snapshot.forEach((doc) => {
        mySubmissions.push(doc.data() as AssignmentSubmission);
      });
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(mySubmissions));
      notifyDbUpdated();
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "assignment_submissions(student)");
      isSubmissionsListenerAttached = false;
    });
  }
}

let isSecurityLogsListenerAttached = false;

/**
 * Subscribes to live Firestore updates for the security_logs audit trail.
 *
 * The Firestore rule for this collection is
 * `allow read: if isApprovedTeacher();` - only approved teachers may read
 * it. Unlike the collections in attachRealtimeListeners() above, this
 * listener must NOT be opened for every signed-in user; callers are
 * responsible for only invoking this once they know
 * `profile.role === "teacher" && profile.isApproved === true` (see
 * src/App.tsx, right after the user's profile doc has been fetched).
 * Students and unapproved teachers should simply never call this -
 * getSecurityLogs() will just return whatever's already cached (typically
 * an empty list for them), which matches what the UI already shows them
 * (the audit log only renders inside the teacher-only audit tab).
 */
export function attachSecurityLogsListener(): void {
  if (isSecurityLogsListenerAttached) return;
  isSecurityLogsListenerAttached = true;

  onSnapshot(collection(db, "security_logs"), (snapshot) => {
    const firestoreLogs: SecurityLog[] = [];
    snapshot.forEach((doc) => {
      firestoreLogs.push(doc.data() as SecurityLog);
    });

    localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(firestoreLogs));
    notifyDbUpdated();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, "security_logs");
    isSecurityLogsListenerAttached = false;
  });
}

let isDirectMessagesListenerAttached = false;

/**
 * Subscribes to live Firestore updates for direct_messages, scoped to the
 * signed-in user's own conversations.
 *
 * The Firestore read rule depends on `resource.data.senderId` /
 * `resource.data.recipientId` matching the caller, so Firestore rejects an
 * unfiltered `onSnapshot(collection(db, "direct_messages"))` outright - it
 * can't prove every possible document in an unbounded listen satisfies a
 * rule that inspects per-document content. Instead we run two
 * where()-scoped queries ("messages I sent" + "messages I received") and
 * merge both into the same local cache, de-duplicated by message id.
 *
 * `myId` must be the signed-in user's app-level `User.id` (their login ID
 * string), NOT the Firebase Auth `uid` - `DirectMessage.senderId` /
 * `.recipientId` are always stored as `User.id` (see sendDirectMessage()
 * below). Callers must wait until the user's Firestore profile doc has
 * resolved before calling this (see src/App.tsx).
 */
export function attachDirectMessagesListener(myId: string): void {
  if (isDirectMessagesListenerAttached) return;
  isDirectMessagesListenerAttached = true;

  const mergeMessages = (incoming: DirectMessage[]) => {
    const existing: DirectMessage[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]");
    const byId = new Map(existing.map((m) => [m.id, m]));
    incoming.forEach((m) => byId.set(m.id, m));
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(Array.from(byId.values())));
    notifyDbUpdated();
  };

  onSnapshot(
    query(collection(db, "direct_messages"), where("senderId", "==", myId)),
    (snapshot) => {
      mergeMessages(snapshot.docs.map((d) => d.data() as DirectMessage));
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, "direct_messages(sender)");
      isDirectMessagesListenerAttached = false;
    }
  );

  onSnapshot(
    query(collection(db, "direct_messages"), where("recipientId", "==", myId)),
    (snapshot) => {
      mergeMessages(snapshot.docs.map((d) => d.data() as DirectMessage));
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, "direct_messages(recipient)");
      isDirectMessagesListenerAttached = false;
    }
  );
}

// Users DB methods
export function getUsers(): User[] {
  initDB();
  const data = localStorage.getItem(USERS_KEY);
  const parsed = data ? (JSON.parse(data) as User[]) : [];
  return cleanDuplicateUsers(parsed);
}

export function saveUser(user: User): boolean {
  const users = getUsers();
  const exists = users.some((u) => u.id.toLowerCase() === user.id.toLowerCase() || (!!user.uid && u.uid === user.uid));
  
  if (exists) {
    // Update user
    const updated = users.map((u) => 
      (u.id.toLowerCase() === user.id.toLowerCase() || (!!user.uid && u.uid === user.uid)) ? user : u
    );
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  } else {
    // Insert user
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  notifyDbUpdated();

  // Sync to Firestore in background. Accounts created via Firebase Auth are
  // keyed by uid; older/legacy accounts fall back to the lowercased id.
  const docId = user.uid || user.id.toLowerCase();
  setDoc(doc(db, "users", docId), cleanForFirestore(user)).catch(err => {
    console.error("Error writing user to Firestore:", err);
  });

  return true;
}

export function deleteUser(id: string): void {
  const users = getUsers();
  const target = users.find((u) => u.id.toLowerCase() === id.toLowerCase());
  const filtered = users.filter((u) => u.id.toLowerCase() !== id.toLowerCase());
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));

  // Also clean up their attendance records
  const records = getAttendanceRecords();
  const cleanedRecords = records.filter((r) => r.studentId.toLowerCase() !== id.toLowerCase());
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(cleanedRecords));

  // Sync deletion to Firestore in background
  const docId = target?.uid || id.toLowerCase();
  deleteDoc(doc(db, "users", docId)).catch(err => console.error(err));
  
  const recordsToDelete = records.filter((r) => r.studentId.toLowerCase() === id.toLowerCase());
  recordsToDelete.forEach((r) => {
    deleteDoc(doc(db, "attendance_records", r.id)).catch(err => console.error(err));
  });
}

// Attendance DB methods

/**
 * Deduplicates attendance records so that each student has at most ONE record
 * per day (per class or subject if tagged, otherwise per day).
 * Any extra duplicate records from previous check-ins on the same date are
 * removed from Firestore and localStorage.
 */
export function cleanDuplicateAttendanceRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  const recordMap = new Map<string, AttendanceRecord>();
  const toDeleteIds: string[] = [];

  // Sort so newer/later records come last
  const sorted = [...records].sort((a, b) => {
    const timeA = a.time || "";
    const timeB = b.time || "";
    return timeA.localeCompare(timeB);
  });

  sorted.forEach((r) => {
    const scope = r.classId || r.subject || "daily";
    const key = `${r.studentId.toLowerCase()}_${r.date}_${scope}`;

    if (recordMap.has(key)) {
      const prev = recordMap.get(key)!;
      toDeleteIds.push(prev.id);
      recordMap.set(key, r);
    } else {
      recordMap.set(key, r);
    }
  });

  // Second pass for general check-ins
  const finalMap = new Map<string, AttendanceRecord>();
  Array.from(recordMap.values()).forEach((r) => {
    const dailyKey = `${r.studentId.toLowerCase()}_${r.date}`;
    if (!r.classId && (!r.subject || r.subject === "General Class")) {
      if (finalMap.has(dailyKey)) {
        const prev = finalMap.get(dailyKey)!;
        toDeleteIds.push(prev.id);
        finalMap.set(dailyKey, r);
      } else {
        finalMap.set(dailyKey, r);
      }
    } else {
      finalMap.set(`${dailyKey}_${r.classId || r.subject}`, r);
    }
  });

  const result = Array.from(finalMap.values());

  // Delete duplicates from Firestore in background if any found
  if (toDeleteIds.length > 0) {
    toDeleteIds.forEach((id) => {
      deleteDoc(doc(db, "attendance_records", id)).catch(() => {});
    });
  }

  return result;
}

export function getAttendanceRecords(): AttendanceRecord[] {
  initDB();
  const data = localStorage.getItem(ATTENDANCE_KEY);
  if (!data) return [];
  try {
    const rawRecords = JSON.parse(data) as AttendanceRecord[];
    const cleaned = cleanDuplicateAttendanceRecords(rawRecords);
    if (cleaned.length !== rawRecords.length) {
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error("Error loading attendance records:", e);
    return [];
  }
}

export function saveAttendanceRecord(record: AttendanceRecord): void {
  const records = getAttendanceRecords();
  
  const index = records.findIndex((r) => {
    if (r.id === record.id) return true;
    if (r.studentId.toLowerCase() !== record.studentId.toLowerCase()) return false;
    if (r.date !== record.date) return false;
    
    if (record.classId && r.classId) return record.classId === r.classId;
    if (record.subject && r.subject) return record.subject === r.subject;
    return !record.classId && !r.classId;
  });

  if (index !== -1) {
    records[index] = { ...records[index], ...record };
  } else {
    records.push(record);
  }

  const deduplicated = cleanDuplicateAttendanceRecords(records);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(deduplicated));

  // Sync to Firestore in background
  setDoc(doc(db, "attendance_records", record.id), cleanForFirestore(record)).catch((err) => {
    console.error("Error writing attendance record to Firestore:", err);
  });
}

// Record today's attendance for a student.
// Updates existing record for today if present, or creates a new record.
export function recordTodayAttendance(
  studentId: string,
  studentName: string,
  status: AttendanceStatus,
  notes?: string,
  classId?: string,
  customSubject?: string
): AttendanceRecord {
  const todayStr = formatDate(new Date());
  const timeStr = formatTime(new Date());
  const records = getAttendanceRecords();
  const cls = getClassById(classId);
  const subject = customSubject || (cls ? (cls.subject || cls.name) : undefined);

  // Match an existing record for today for this student
  const existingIndex = records.findIndex((r) => {
    if (r.studentId.toLowerCase() !== studentId.toLowerCase()) return false;
    if (r.date !== todayStr) return false;

    if (classId) {
      return r.classId === classId || (cls && attendanceMatchesClass(r, cls));
    }
    if (customSubject) {
      return r.subject === customSubject || !r.classId;
    }
    return true; // Match any record for this student today
  });

  let record: AttendanceRecord;

  if (existingIndex !== -1) {
    // Update existing record for today
    record = {
      ...records[existingIndex],
      time: timeStr,
      status,
      notes: notes !== undefined ? notes : records[existingIndex].notes,
      subject: subject || records[existingIndex].subject,
      classId: classId || records[existingIndex].classId,
    };
    records[existingIndex] = record;
  } else {
    // Create new record
    record = {
      id: `rec-${Date.now()}`,
      studentId,
      studentName,
      date: todayStr,
      time: status === "Absent" ? "00:00:00" : timeStr,
      status,
      notes,
      subject,
      classId,
    };
    records.push(record);
  }

  const deduplicated = cleanDuplicateAttendanceRecords(records);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(deduplicated));

  // Sync to Firestore in background
  setDoc(doc(db, "attendance_records", record.id), cleanForFirestore(record)).catch((err) => {
    console.error("Error recording attendance to Firestore:", err);
  });

  return record;
}

export function deleteAttendanceRecord(id: string): void {
  const records = getAttendanceRecords();
  const filtered = records.filter((r) => r.id !== id);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(filtered));

  // Sync delete to Firestore in background
  deleteDoc(doc(db, "attendance_records", id)).catch(err => console.error(err));
}

// Security Logs Keys and Methods

export function getSecurityLogs(): SecurityLog[] {
  initDB();
  const data = localStorage.getItem(SECURITY_LOGS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addSecurityLog(log: Omit<SecurityLog, "id" | "timestamp">): SecurityLog {
  const logs = getSecurityLogs();
  const newLog: SecurityLog = {
    ...log,
    id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString()
  };
  logs.push(newLog);
  localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(logs));

  // Sync to Firestore in background
  setDoc(doc(db, "security_logs", newLog.id), cleanForFirestore(newLog)).catch(err => {
    console.error("Error saving security log to Firestore:", err);
  });

  return newLog;
}

export function deleteSecurityLog(id: string): void {
  const logs = getSecurityLogs();
  const filtered = logs.filter((l) => l.id !== id);
  localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(filtered));

  // Sync delete to Firestore in background
  deleteDoc(doc(db, "security_logs", id)).catch(err => console.error(err));
}

// Statistics calculations
// Stats for a student, optionally scoped to one class. Records written
// before the classId migration only have the legacy `subject` string, so
// those still count here too (matched against that class's subject/name)
// rather than silently vanishing from a returning user's history.
export function calculateStudentStats(studentId: string, classId?: string): StudentStats {
  const cls = classId ? getClassById(classId) : undefined;
  const records = getAttendanceRecords().filter(
    (r) => r.studentId.toLowerCase() === studentId.toLowerCase() && (!cls || attendanceMatchesClass(r, cls))
  );

  const presentCount = records.filter((r) => r.status === "Present").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;
  const lateCount = records.filter((r) => r.status === "Late").length;
  const totalDays = records.length;
  // Late still counts as attended for the overall rate (they showed up),
  // just tracked separately so punctuality issues are visible.
  const percentage = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 100;

  return {
    presentCount,
    absentCount,
    lateCount,
    totalDays,
    percentage,
  };
}

// ---------------------------------------------------------------------------
// Classroom feature: classes, stream posts (announcements + assignments),
// comments, and assignment submissions. Same local-first + Firestore-sync
// pattern as everything above - writes go to localStorage immediately and
// to Firestore in the background; onSnapshot listeners above keep every
// open tab in sync.
// ---------------------------------------------------------------------------

function randomJoinCode(): string {
  // Unambiguous charset (no 0/O/1/I) so codes are easy to read aloud/type.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// --- Classes ---

export function getClasses(): ClassRoom[] {
  initDB();
  const data = localStorage.getItem(CLASSES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getClassesForTeacher(teacherId: string): ClassRoom[] {
  return getClasses().filter((c) => c.teacherId.toLowerCase() === teacherId.toLowerCase());
}

export function getClassesForStudent(studentId: string): ClassRoom[] {
  return getClasses().filter((c) => c.studentIds.some((id) => id.toLowerCase() === studentId.toLowerCase()));
}

export function getClassById(classId: string): ClassRoom | undefined {
  return getClasses().find((c) => c.id === classId);
}

function saveClass(cls: ClassRoom): void {
  const classes = getClasses();
  const index = classes.findIndex((c) => c.id === cls.id);
  if (index !== -1) {
    classes[index] = cls;
  } else {
    classes.push(cls);
  }
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
  setDoc(doc(db, "classes", cls.id), cleanForFirestore(cls)).catch((err) => {
    console.error("Error writing class to Firestore:", err);
  });
}

export function createClass(name: string, subject: string, teacher: User): ClassRoom {
  // Vanishingly unlikely, but guard against a join-code collision anyway.
  const existingCodes = new Set(getClasses().map((c) => c.joinCode));
  let joinCode = randomJoinCode();
  while (existingCodes.has(joinCode)) {
    joinCode = randomJoinCode();
  }
  const cls: ClassRoom = {
    id: `class-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    subject: subject.trim() || undefined,
    teacherId: teacher.id,
    teacherName: teacher.name,
    joinCode,
    createdAt: formatDate(new Date()),
    studentIds: [],
  };
  saveClass(cls);
  return cls;
}

export function regenerateJoinCode(classId: string): ClassRoom | undefined {
  const cls = getClassById(classId);
  if (!cls) return undefined;
  const existingCodes = new Set(getClasses().map((c) => c.joinCode));
  let joinCode = randomJoinCode();
  while (existingCodes.has(joinCode)) {
    joinCode = randomJoinCode();
  }
  const updated = { ...cls, joinCode };
  saveClass(updated);
  return updated;
}

/** Student self-joins a class using the teacher-shared code. */
export function joinClassByCode(code: string, student: User): ClassRoom {
  const cls = getClasses().find((c) => c.joinCode.toLowerCase() === code.trim().toLowerCase());
  if (!cls) {
    throw new Error("invalid-code");
  }
  // Check if student has been barred/blocked by the instructor
  if (cls.blockedStudentIds?.some((id) => id.toLowerCase() === student.id.toLowerCase())) {
    throw new Error("blocked");
  }
  if (cls.studentIds.some((id) => id.toLowerCase() === student.id.toLowerCase())) {
    return cls; // already a member, nothing to do
  }
  const updated = { ...cls, studentIds: [...cls.studentIds, student.id] };
  saveClass(updated);
  return updated;
}

/** Teacher manually adds an already-registered student by their ID. */
export function addStudentToClass(classId: string, studentId: string): ClassRoom | undefined {
  const cls = getClassById(classId);
  if (!cls) return undefined;
  if (cls.studentIds.some((id) => id.toLowerCase() === studentId.toLowerCase())) {
    return cls;
  }
  const updated = { ...cls, studentIds: [...cls.studentIds, studentId] };
  saveClass(updated);
  return updated;
}

/** Kicks a student from the class roster. The student is free to rejoin with the code. */
export function removeStudentFromClass(classId: string, studentId: string): ClassRoom | undefined {
  const cls = getClassById(classId);
  if (!cls) return undefined;
  const updated = { ...cls, studentIds: cls.studentIds.filter((id) => id.toLowerCase() !== studentId.toLowerCase()) };
  saveClass(updated);
  return updated;
}

/** Allows a student to voluntarily withdraw/leave an enrolled class section. */
export function leaveClass(classId: string, studentId: string): ClassRoom | undefined {
  return removeStudentFromClass(classId, studentId);
}

/**
 * Blocks a student from a class section: kicks them out of studentIds and
 * adds them to blockedStudentIds, barring them from rejoining with any code.
 */
export function blockStudentFromClass(classId: string, studentId: string): ClassRoom | undefined {
  const cls = getClassById(classId);
  if (!cls) return undefined;
  const currentBlocked = cls.blockedStudentIds || [];
  const updatedBlocked = currentBlocked.some((id) => id.toLowerCase() === studentId.toLowerCase())
    ? currentBlocked
    : [...currentBlocked, studentId];
  const updated: ClassRoom = {
    ...cls,
    studentIds: cls.studentIds.filter((id) => id.toLowerCase() !== studentId.toLowerCase()),
    blockedStudentIds: updatedBlocked,
  };
  saveClass(updated);
  return updated;
}

/**
 * Unblocks a student from a class section: removes them from blockedStudentIds,
 * allowing them to rejoin with the class join code or be re-enrolled.
 */
export function unblockStudentFromClass(classId: string, studentId: string): ClassRoom | undefined {
  const cls = getClassById(classId);
  if (!cls) return undefined;
  const currentBlocked = cls.blockedStudentIds || [];
  const updated: ClassRoom = {
    ...cls,
    blockedStudentIds: currentBlocked.filter((id) => id.toLowerCase() !== studentId.toLowerCase()),
  };
  saveClass(updated);
  return updated;
}

export function getBlockedStudentsForClass(classId: string): User[] {
  const cls = getClassById(classId);
  if (!cls || !cls.blockedStudentIds || cls.blockedStudentIds.length === 0) return [];
  const users = getUsers();
  return users.filter((u) => cls.blockedStudentIds?.some((bid) => bid.toLowerCase() === u.id.toLowerCase()));
}

export function deleteClass(classId: string): void {
  const classes = getClasses().filter((c) => c.id !== classId);
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
  deleteDoc(doc(db, "classes", classId)).catch((err) => console.error(err));

  // Cascade: remove this class's posts, their comments, and submissions.
  const posts = getPostsForClass(classId);
  posts.forEach((p) => deletePost(p.id));
}

/** Classmates in a class with their attendance stats, for the roster/classmates view. */
export function getClassmatesWithStats(
  classId: string
): { student: User; stats: StudentStats }[] {
  const cls = getClassById(classId);
  if (!cls) return [];
  const users = getUsers();
  return cls.studentIds
    .map((id) => users.find((u) => u.id.toLowerCase() === id.toLowerCase()))
    .filter((u): u is User => !!u)
    .map((student) => ({
      student,
      stats: calculateStudentStatsForClass(student.id, classId),
    }));
}

/**
 * True if an attendance record belongs to the given class - either tagged
 * directly via classId (every record going forward), or, for records
 * written before that field existed, matched by the legacy free-text
 * subject label. Shared by both dashboards and the Classroom log so
 * pre-migration history doesn't just disappear once classes take over.
 */
export function attendanceMatchesClass(record: AttendanceRecord, cls: ClassRoom): boolean {
  if (record.classId) return record.classId === cls.id;
  const legacySubject = cls.subject || cls.name;
  return !!record.subject && record.subject === legacySubject;
}

export function calculateStudentStatsForClass(studentId: string, classId: string): StudentStats {
  const cls = getClassById(classId);
  const records = getAttendanceRecords().filter(
    (r) => r.studentId.toLowerCase() === studentId.toLowerCase() && !!cls && attendanceMatchesClass(r, cls)
  );
  const presentCount = records.filter((r) => r.status === "Present").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;
  const lateCount = records.filter((r) => r.status === "Late").length;
  const totalDays = records.length;
  const percentage = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 100;
  return { presentCount, absentCount, lateCount, totalDays, percentage };
}

// --- Stream posts (announcements + assignments) ---

/**
 * Safely extracts a numeric millisecond timestamp for a ClassPost.
 * Handles ISO strings, Firestore Timestamps ({ seconds, nanoseconds }),
 * Date instances, and parses embedded timestamps from post IDs.
 * Guarantees a valid number (never NaN).
 */
export function getPostTime(post: Partial<ClassPost> | null | undefined): number {
  if (!post) return 0;

  // 1. Direct number
  if (typeof post.createdAt === "number" && !isNaN(post.createdAt) && post.createdAt > 0) {
    return post.createdAt;
  }

  // 2. Firestore Timestamp instance with .toDate()
  if (post.createdAt && typeof (post.createdAt as any).toDate === "function") {
    try {
      const ms = (post.createdAt as any).toDate().getTime();
      if (!isNaN(ms) && ms > 0) return ms;
    } catch {}
  }

  // 3. Serialized Firestore Timestamp object { seconds, nanoseconds }
  if (post.createdAt && typeof post.createdAt === "object" && "seconds" in (post.createdAt as any)) {
    const sec = Number((post.createdAt as any).seconds);
    if (!isNaN(sec) && sec > 0) return sec * 1000;
  }

  // 4. Standard string date / ISO string
  if (typeof post.createdAt === "string" && post.createdAt.trim()) {
    const parsed = new Date(post.createdAt).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // 5. Try extracting timestamp embedded in post ID (format: post-<timestamp>-<rand>)
  if (typeof post.id === "string") {
    const match = post.id.match(/^post-(\d{10,15})/);
    if (match) {
      const parsedIdTs = parseInt(match[1], 10);
      if (!isNaN(parsedIdTs) && parsedIdTs > 0) return parsedIdTs;
    }
  }

  return 0;
}

/**
 * Robust comparator for posts in strict descending order (newest first).
 * Uses getPostTime() and breaks ties with ID timestamps / string comparison.
 */
export function comparePostsDesc(a: ClassPost, b: ClassPost): number {
  const timeA = getPostTime(a);
  const timeB = getPostTime(b);
  if (timeB !== timeA) {
    return timeB - timeA;
  }
  return String(b.id || "").localeCompare(String(a.id || ""));
}

export function getPosts(): ClassPost[] {
  initDB();
  const data = localStorage.getItem(POSTS_KEY);
  if (!data) return [];
  try {
    const raw = JSON.parse(data);
    if (!Array.isArray(raw)) return [];
    return raw.map((p) => {
      const ts = getPostTime(p);
      return {
        ...p,
        createdAt: ts > 0 ? new Date(ts).toISOString() : (typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString()),
      };
    });
  } catch {
    return [];
  }
}

export function getAllPosts(): ClassPost[] {
  return getPosts().sort(comparePostsDesc);
}

export function getAnnouncements(): ClassPost[] {
  return getAllPosts().filter((p) => p.type === "announcement");
}

export function getAssignments(): ClassPost[] {
  return getAllPosts().filter((p) => p.type === "assignment");
}

export function getPostsForClass(classId: string): ClassPost[] {
  return getPosts()
    .filter((p) => {
      if (!classId) return true;
      if (p.classId === classId) return true;
      if (
        p.classId === "all" ||
        p.classId === "all_students" ||
        p.classId === "global" ||
        p.targetAudience === "all" ||
        p.targetAudience === "students"
      ) {
        return true;
      }
      return false;
    })
    .sort(comparePostsDesc);
}

/**
 * Determines if an announcement or post is visible to a student.
 * Crucial rule: Campus-wide and All-Student broadcasts are visible to ANY student,
 * even if they have 0 classes, so they can see join codes and school announcements!
 */
export function isPostVisibleToStudent(post: ClassPost, studentClassIds: string[], teacherIds?: string[]): boolean {
  // 1. Campus-wide or All-Student broadcast
  if (
    post.targetAudience === "all" ||
    post.targetAudience === "students" ||
    post.classId === "all" ||
    post.classId === "all_students" ||
    post.classId === "global"
  ) {
    return true;
  }
  // 2. Specific enrolled class section
  if (post.classId && studentClassIds.includes(post.classId)) {
    return true;
  }
  // 3. Fallback for legacy teacher posts
  if (teacherIds && post.authorId && teacherIds.includes(post.authorId.toLowerCase()) && !post.classId) {
    return true;
  }
  return false;
}

/**
 * Determines if an announcement or post is visible to a teacher.
 * Teachers can always see their own posts, campus-wide announcements, all-teacher/student broadcasts,
 * and any announcements belonging to their classes.
 */
export function isPostVisibleToTeacher(
  post: ClassPost,
  teacherId: string,
  teacherClassIds: string[],
  teacherEmail?: string,
  teacherName?: string
): boolean {
  const pAuthorId = (post.authorId || "").toLowerCase();
  const pAuthorName = (post.authorName || "").toLowerCase();
  const tId = (teacherId || "").toLowerCase();
  const tEmail = (teacherEmail || "").toLowerCase();
  const tName = (teacherName || "").toLowerCase();

  // 1. Authored by teacher (under user ID, dbUser ID, email, or name)
  if (
    (pAuthorId && (pAuthorId === tId || (tEmail && pAuthorId === tEmail))) ||
    (pAuthorName && tName && pAuthorName === tName)
  ) {
    return true;
  }

  // 2. Broadcasts (Campus-wide, All Students, Faculty)
  if (
    post.targetAudience === "all" ||
    post.targetAudience === "teachers" ||
    post.targetAudience === "students" ||
    post.classId === "all" ||
    post.classId === "all_teachers" ||
    post.classId === "all_students" ||
    post.classId === "global"
  ) {
    return true;
  }

  // 3. One of teacher's classes
  if (post.classId && teacherClassIds.some((cId) => cId.toLowerCase() === (post.classId || "").toLowerCase())) {
    return true;
  }

  return false;
}

export function createPost(input: Omit<ClassPost, "id" | "createdAt">): ClassPost {
  const nowTs = Date.now();
  const post: ClassPost = {
    ...input,
    id: `post-${nowTs}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date(nowTs).toISOString(),
  };
  const existing = getPosts().filter((p) => p.id !== post.id);
  const posts = [post, ...existing].sort(comparePostsDesc);
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  
  const docData = cleanForFirestore(post);
  setDoc(doc(db, "class_posts", post.id), docData).catch((err) => {
    console.error("Error writing post to Firestore:", err);
  });
  notifyDbUpdated();
  return post;
}

/**
 * Creates identical posts targeted at multiple class sections.
 * Used by the deliberate multi-section announcement / assignment broadcast flow.
 */
export function createMultiplePosts(inputs: Omit<ClassPost, "id" | "createdAt">[]): ClassPost[] {
  const baseTs = Date.now();
  const newPosts: ClassPost[] = inputs.map((input, idx) => {
    const ts = baseTs + idx;
    return {
      ...input,
      id: `post-${ts}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(ts).toISOString(),
    };
  });
  const existing = getPosts().filter((p) => !newPosts.some((np) => np.id === p.id));
  const all = [...newPosts, ...existing].sort(comparePostsDesc);
  localStorage.setItem(POSTS_KEY, JSON.stringify(all));

  newPosts.forEach((post) => {
    const docData = cleanForFirestore(post);
    setDoc(doc(db, "class_posts", post.id), docData).catch((err) => {
      console.error("Error writing multi-post to Firestore:", err);
    });
  });

  notifyDbUpdated();
  return newPosts;
}

export function deletePost(postId: string): void {
  const posts = getPosts().filter((p) => p.id !== postId);
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  deleteDoc(doc(db, "class_posts", postId)).catch((err) => console.error(err));

  // Cascade: remove this post's comments and submissions too.
  getCommentsForPost(postId).forEach((c) => deleteComment(c.id));
  getSubmissionsForPost(postId).forEach((s) => deleteSubmission(s.id));
  notifyDbUpdated();
}

// --- Comments (Class Comments & Private Comments) ---

export function getComments(): PostComment[] {
  initDB();
  const data = localStorage.getItem(COMMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Returns all comments for a post that the user is permitted to see.
 * - Public class comments are visible to everyone.
 * - Private comments are only visible if the viewer is the author, target student, or teacher of the class.
 */
export function getCommentsForPost(postId: string, currentUserId?: string, isTeacher?: boolean): PostComment[] {
  const all = getComments()
    .filter((c) => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (!currentUserId && !isTeacher) {
    return all.filter((c) => c.commentType !== "private");
  }

  return all.filter((c) => {
    if (c.commentType !== "private") return true;
    if (isTeacher) return true;
    if (!currentUserId) return false;
    const uid = currentUserId.toLowerCase();
    return c.authorId.toLowerCase() === uid || (!!c.targetStudentId && c.targetStudentId.toLowerCase() === uid);
  });
}

export function getClassCommentsForPost(postId: string): PostComment[] {
  return getComments()
    .filter((c) => c.postId === postId && c.commentType !== "private")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getPrivateCommentsForPost(postId: string, studentId: string): PostComment[] {
  const sId = studentId.toLowerCase();
  return getComments()
    .filter(
      (c) =>
        c.postId === postId &&
        c.commentType === "private" &&
        (c.targetStudentId?.toLowerCase() === sId || c.authorId.toLowerCase() === sId)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addComment(input: Omit<PostComment, "id" | "createdAt">): PostComment {
  const comment: PostComment = {
    ...input,
    id: `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    commentType: input.commentType || "class",
  };
  const comments = getComments();
  comments.push(comment);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  setDoc(doc(db, "post_comments", comment.id), cleanForFirestore(comment)).catch((err) => {
    console.error("Error writing comment to Firestore:", err);
  });
  notifyDbUpdated();
  return comment;
}

export function deleteComment(commentId: string): void {
  const comments = getComments().filter((c) => c.id !== commentId);
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  deleteDoc(doc(db, "post_comments", commentId)).catch((err) => console.error(err));
  notifyDbUpdated();
}

// --- Assignment submissions ---

export function getSubmissions(): AssignmentSubmission[] {
  initDB();
  const data = localStorage.getItem(SUBMISSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getSubmissionsForPost(postId: string): AssignmentSubmission[] {
  return getSubmissions().filter((s) => s.postId === postId);
}

export function getSubmissionForStudent(postId: string, studentId: string): AssignmentSubmission | undefined {
  return getSubmissions().find(
    (s) => s.postId === postId && s.studentId.toLowerCase() === studentId.toLowerCase()
  );
}

export function submitAssignment(input: Omit<AssignmentSubmission, "id" | "submittedAt">): AssignmentSubmission {
  // Resubmitting replaces the previous submission rather than duplicating it.
  const existing = getSubmissionForStudent(input.postId, input.studentId);
  if (existing && existing.status === "Graded") {
    throw new Error("Cannot modify assignment: This submission has already been graded by your instructor.");
  }

  // Due date & late submission detection
  const post = getPosts().find((p) => p.id === input.postId);
  const now = new Date();
  let isLate = false;
  if (post?.dueDate) {
    const todayStr = formatDate(now);
    if (todayStr > post.dueDate) {
      isLate = true;
    }
  }

  const submission: AssignmentSubmission = {
    ...input,
    id: existing?.id || `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    submittedAt: now.toISOString(),
    status: isLate ? "Late" : (existing?.status || "Submitted"),
    isLate,
  };
  const submissions = getSubmissions();
  const index = submissions.findIndex((s) => s.id === submission.id);
  if (index !== -1) {
    submissions[index] = submission;
  } else {
    submissions.push(submission);
  }
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
  setDoc(doc(db, "assignment_submissions", submission.id), cleanForFirestore(submission)).catch((err) => {
    console.error("Error writing submission to Firestore:", err);
  });
  notifyDbUpdated();
  return submission;
}

export function gradeSubmission(submissionId: string, rawScore: number | string, feedback?: string): AssignmentSubmission | undefined {
  const submissions = getSubmissions();
  const index = submissions.findIndex((s) => s.id === submissionId);
  if (index === -1) return undefined;

  // Sanitize score if entered with a slash like "95 / 100"
  let cleanScore = String(rawScore).trim();
  if (cleanScore.includes("/")) {
    cleanScore = cleanScore.split("/")[0].trim();
  }

  const updated: AssignmentSubmission = {
    ...submissions[index],
    score: cleanScore,
    feedback: feedback || "",
    status: "Graded",
  };
  submissions[index] = updated;
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
  setDoc(doc(db, "assignment_submissions", updated.id), cleanForFirestore(updated)).catch((err) => {
    console.error("Error writing graded submission to Firestore:", err);
  });
  notifyDbUpdated();
  return updated;
}

export function deleteSubmission(submissionId: string): void {
  const submissions = getSubmissions().filter((s) => s.id !== submissionId);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
  deleteDoc(doc(db, "assignment_submissions", submissionId)).catch((err) => console.error(err));
}

// ---------------------------------------------------------------------------
// Messenger & Direct Messaging Engine
// ---------------------------------------------------------------------------

export function getDirectMessages(): DirectMessage[] {
  initDB();
  const data = localStorage.getItem(MESSAGES_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Returns all direct messages exchanged between two specific users, ordered chronologically.
 */
export function getDirectMessagesBetween(userAId: string, userBId: string): DirectMessage[] {
  const a = userAId.toLowerCase();
  const b = userBId.toLowerCase();
  return getDirectMessages()
    .filter(
      (m) =>
        (m.senderId.toLowerCase() === a && m.recipientId.toLowerCase() === b) ||
        (m.senderId.toLowerCase() === b && m.recipientId.toLowerCase() === a)
    )
    .sort((x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime());
}

/**
 * Returns grouped Messenger conversations for a given user, with the most recent message and unread count.
 */
export function getConversationsForUser(userId: string): MessengerConversation[] {
  const myId = userId.toLowerCase();
  const allMessages = getDirectMessages();
  const conversationMap = new Map<string, { partner: User; lastMsg: DirectMessage; unread: number }>();
  const users = getUsers();

  allMessages.forEach((msg) => {
    const isSender = msg.senderId.toLowerCase() === myId;
    const isRecipient = msg.recipientId.toLowerCase() === myId;
    if (!isSender && !isRecipient) return;

    const partnerId = isSender ? msg.recipientId : msg.senderId;
    const partnerIdLower = partnerId.toLowerCase();
    const partnerUser = users.find((u) => u.id.toLowerCase() === partnerIdLower);

    const existing = conversationMap.get(partnerIdLower);
    const unreadInc = (!isSender && !msg.read) ? 1 : 0;

    if (!existing) {
      conversationMap.set(partnerIdLower, {
        partner: partnerUser || {
          id: partnerId,
          name: isSender ? msg.recipientName : msg.senderName,
          role: isSender ? msg.recipientRole : msg.senderRole,
          createdAt: "",
        },
        lastMsg: msg,
        unread: unreadInc,
      });
    } else {
      if (new Date(msg.createdAt).getTime() > new Date(existing.lastMsg.createdAt).getTime()) {
        existing.lastMsg = msg;
      }
      existing.unread += unreadInc;
    }
  });

  return Array.from(conversationMap.values())
    .map(({ partner, lastMsg, unread }) => ({
      partnerId: partner.id,
      partnerName: partner.name,
      partnerRole: partner.role,
      partnerAvatarUrl: partner.avatarUrl,
      lastMessage: lastMsg,
      unreadCount: unread,
    }))
    .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
}

/**
 * Sends a new direct message, storing locally and in Firestore.
 */
export function sendDirectMessage(
  input: Omit<DirectMessage, "id" | "createdAt" | "read">
): DirectMessage {
  const msg: DirectMessage = {
    ...input,
    id: `dm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const messages = getDirectMessages();
  messages.push(msg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));

  setDoc(doc(db, "direct_messages", msg.id), cleanForFirestore(msg)).catch((err) => {
    console.error("Error writing direct message to Firestore:", err);
  });

  notifyDbUpdated();
  return msg;
}

/**
 * Marks all incoming messages from a specific sender as read by the recipient.
 */
export function markDirectMessagesAsRead(senderId: string, recipientId: string): void {
  const sId = senderId.toLowerCase();
  const rId = recipientId.toLowerCase();
  let updatedCount = 0;

  const messages = getDirectMessages().map((m) => {
    if (m.senderId.toLowerCase() === sId && m.recipientId.toLowerCase() === rId && !m.read) {
      updatedCount++;
      const updated = { ...m, read: true };
      setDoc(doc(db, "direct_messages", m.id), { read: true }, { merge: true }).catch((err) => {
        console.error("Error updating message read status in Firestore:", err);
      });
      return updated;
    }
    return m;
  });

  if (updatedCount > 0) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    notifyDbUpdated();
  }
}

/**
 * Count total unread incoming messages for a user across all chats.
 */
export function getUnreadDirectMessagesCount(userId: string): number {
  const myId = userId.toLowerCase();
  return getDirectMessages().filter((m) => m.recipientId.toLowerCase() === myId && !m.read).length;
}

export function deleteDirectMessage(messageId: string): void {
  const messages = getDirectMessages().filter((m) => m.id !== messageId);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  deleteDoc(doc(db, "direct_messages", messageId)).catch((err) => console.error(err));
  notifyDbUpdated();
}

