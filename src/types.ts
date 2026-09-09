export type UserRole = "student" | "teacher";

export type AttendanceStatus = "Present" | "Absent" | "Late";

export interface SocialAccounts {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
}

export interface User {
  id: string; // This is the username/unique ID
  uid?: string; // Firebase Auth UID (also the Firestore doc id) - present on accounts created via Firebase Auth
  name: string;
  password?: string; // Legacy field only - no longer written for new accounts, kept optional for old seed data
  role: UserRole;
  createdAt: string;
  avatarUrl?: string; // Profile picture URL (e.g. from Google Account or custom selection)
  isApproved?: boolean; // New student accounts start as false, pre-seeded starts as true
  subject?: string; // For teachers, the active subject they teach (e.g. Mathematics, Science)
  appliedSubjects?: string[]; // List of subject names applied for but not yet approved
  enrolledSubjects?: string[]; // List of subject names currently enrolled/approved in
  email?: string; // Contact email (students) so teachers can reach them
  phone?: string; // Contact phone number
  address?: string; // Residential or mailing address
  department?: string; // Student/Faculty Department or Course (e.g. DCPE, DCS, Computer Engineering, Computer Science)
  location?: string; // Legacy location field
  socialAccounts?: SocialAccounts; // Linked social media profiles (Facebook, Twitter, LinkedIn, GitHub, Instagram)
  lastActiveAt?: string; // ISO timestamp of when the user was last active/online
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  status: AttendanceStatus;
  notes?: string;
  subject?: string; // Legacy free-text subject label, kept for old records
  classId?: string; // Which ClassRoom this attendance belongs to (new records)
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  usernameAttempted: string;
  details: string;
  type: "Impersonation Attempt" | "Invalid Registration" | "Unauthorized Access" | "Verification Status Changed" | "Account Deleted";
}

export interface StudentStats {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalDays: number;
  percentage: number;
}

// ---------------------------------------------------------------------------
// Classroom feature: a teacher runs one or more ClassRoom "sections", each
// with its own roster, join code, stream of posts, and attendance records
// (tagged via AttendanceRecord.classId above).
// ---------------------------------------------------------------------------

export interface ClassRoom {
  id: string;
  name: string; // e.g. "Grade 10 - Section A"
  subject?: string; // e.g. "Mathematics"
  teacherId: string; // User.id of the owning teacher
  teacherName: string;
  joinCode: string; // short code students can enter to join
  createdAt: string;
  studentIds: string[]; // User.id of enrolled students
  blockedStudentIds?: string[]; // User.id of blocked students barred from rejoining this section
}

export type ClassPostType = "announcement" | "assignment";

export interface ClassPost {
  id: string;
  classId?: string;
  type: ClassPostType;
  authorId: string;
  authorName: string;
  title?: string; // assignments use this as title
  content: string; // announcement body or assignment instructions
  createdAt: string;
  dueDate?: string; // YYYY-MM-DD
  subject?: string; // optional subject category (e.g. Computer Science, Science)
  maxPoints?: number; // max points (e.g. 100)
  attachmentName?: string;
  attachmentDataUrl?: string; // base64 data URL
}

export interface PostComment {
  id: string;
  postId: string;
  classId?: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  commentType?: "class" | "private"; // "class" = public to whole class, "private" = 1-on-1 between teacher & target student
  targetStudentId?: string; // for private comments on an assignment submission (student ID)
}

export interface AssignmentSubmission {
  id: string;
  postId: string;
  classId?: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content?: string;
  attachmentName?: string;
  attachmentDataUrl?: string;
  score?: number | string; // e.g. 95 or "A"
  feedback?: string; // Teacher feedback note
  status?: "Submitted" | "Graded" | "Late";
  isLate?: boolean;
}

// ---------------------------------------------------------------------------
// Messenger & Direct Messaging System
// ---------------------------------------------------------------------------

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatarUrl?: string;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  recipientAvatarUrl?: string;
  content: string;
  createdAt: string;
  read: boolean;
  attachmentName?: string;
  attachmentDataUrl?: string;
  classId?: string;
}

export interface MessengerConversation {
  partnerId: string;
  partnerName: string;
  partnerRole: UserRole;
  partnerAvatarUrl?: string;
  lastMessage: DirectMessage;
  unreadCount: number;
}

