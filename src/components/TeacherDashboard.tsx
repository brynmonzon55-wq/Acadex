import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LogOut,
  Users,
  CheckCircle,
  XCircle,
  Search,
  UserPlus,
  UserMinus,
  Trash2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Edit,
  Plus,
  UserCheck,
  TrendingUp,
  Filter,
  ShieldAlert,
  Settings as SettingsIcon,
  Clock,
  Eye,
  X,
  Megaphone,
  FileText,
  Paperclip,
  Send,
  Award,
  Upload,
  Moon,
  Sun,
  Palette,
  MessageSquare,
  Image as ImageIcon,
  GraduationCap,
  CheckCircle2,
  Mail,
  MapPin,
  Building2,
  BookOpen,
  RefreshCw,
  School,
  Copy,
  Download,
  Video,
  Ban,
  ShieldOff,
  Layers,
  Check,
  ChevronRight,
  AlertTriangle,
  Info,
  Globe
} from "lucide-react";
import { generateGoogleMeetLink } from "../lib/googleMeet";
import {
  User,
  AttendanceRecord,
  AttendanceStatus,
  StudentStats,
  SecurityLog,
  ClassPost,
  PostComment,
  AssignmentSubmission,
  ClassRoom,
  PostAudience
} from "../types";
import type { AppTheme, AppThemeMode } from "../App";
import { linkifyText, hasJoinCode } from "../lib/linkify";
import { processFileUpload } from "../lib/fileUtils";
import StudentProfile from "./StudentProfile";
import TeacherProfile from "./TeacherProfile";
import PostCommentsSection from "./PostCommentsSection";
import AnimatedThemeBackground from "./AnimatedThemeBackground";
import SettingsTab from "./SettingsTab";
import UserAvatar from "./UserAvatar";
import DailyCheckinsTab from "./DailyCheckinsTab";
import Classroom from "./Classroom";
import ClassMessenger, { openDirectMessage } from "./ClassMessenger";
import JoinCodePill from "./JoinCodePill";
import {
  getUsers,
  saveUser,
  getAttendanceRecords,
  saveAttendanceRecord,
  deleteAttendanceRecord,
  calculateStudentStats,
  formatDate,
  formatTime,
  getSecurityLogs,
  deleteSecurityLog,
  getAnnouncements,
  getAssignments,
  isPostVisibleToTeacher,
  createPost,
  createMultiplePosts,
  deletePost,
  comparePostsDesc,
  getPostTime,
  getCommentsForPost,
  addComment,
  getSubmissionsForPost,
  gradeSubmission,
  createUserByAdmin,
  updateUserApprovalStatus,
  changeOwnPassword,
  verifyCurrentPassword,
  addSecurityLog,
  getClassesForTeacher,
  createClass,
  addStudentToClass,
  removeStudentFromClass,
  blockStudentFromClass,
  unblockStudentFromClass,
  getBlockedStudentsForClass,
  getUnreadDirectMessagesCount,
} from "../lib/db";

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  themeMode?: AppThemeMode;
  onThemeModeChange?: (mode: AppThemeMode) => void;
}

export default function TeacherDashboard({
  user,
  onLogout,
  theme,
  onThemeChange,
  themeMode = "night",
  onThemeModeChange,
}: TeacherDashboardProps) {
  // DB States
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dbUser, setDbUser] = useState<User>(user);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  // Class Sections State
  const [teacherClasses, setTeacherClasses] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionSubject, setNewSectionSubject] = useState("");
  const [createSectionError, setCreateSectionError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"roster" | "teachers" | "checkins" | "announcements" | "assignments" | "reports" | "messenger" | "settings">("roster");
  const [unreadMessengerCount, setUnreadMessengerCount] = useState<number>(0);
  const [viewingStudent, setViewingStudent] = useState<User | null>(null);
  const [viewingTeacherProfile, setViewingTeacherProfile] = useState<User | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Teacher Tab States
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<"All" | "Verified" | "Pending">("All");

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherId, setNewTeacherId] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [newTeacherSubject, setNewTeacherSubject] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [addTeacherError, setAddTeacherError] = useState<string | null>(null);

  const [teacherToEdit, setTeacherToEdit] = useState<User | null>(null);
  const [editTeacherName, setEditTeacherName] = useState("");
  const [editTeacherSubject, setEditTeacherSubject] = useState("");
  const [editTeacherEmail, setEditTeacherEmail] = useState("");

  // Pending Verification / Revocation Password Action State
  const [pendingTeacherAction, setPendingTeacherAction] = useState<{
    teacher: User;
    action: "verify" | "revoke";
  } | null>(null);
  const [actionPassword, setActionPassword] = useState("");
  const [actionPasswordError, setActionPasswordError] = useState<string | null>(null);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // Attendance Sheet State
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [statusFilter, setStatusFilter] = useState<"All" | "Present" | "Late" | "Absent">("All");

  // Edit / Add Student Modal State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [addStudentClassId, setAddStudentClassId] = useState<string>("none");
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);

  const [studentToEdit, setStudentToEdit] = useState<User | null>(null);
  const [editStudentName, setEditStudentName] = useState("");
  const [editStudentEmail, setEditStudentEmail] = useState("");

  const [studentToRemove, setStudentToRemove] = useState<{ id: string; name: string } | null>(null);
  const [studentToBlock, setStudentToBlock] = useState<{ id: string; name: string } | null>(null);

  // Announcements Form State
  const [announcements, setAnnouncements] = useState<ClassPost[]>([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annSubject, setAnnSubject] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annClassId, setAnnClassId] = useState<string>("");
  const [annAttachmentName, setAnnAttachmentName] = useState("");
  const [annAttachmentDataUrl, setAnnAttachmentDataUrl] = useState("");
  const [showCreateAnnModal, setShowCreateAnnModal] = useState(false);
  const [annGeneratingMeet, setAnnGeneratingMeet] = useState(false);
  const [annMeetError, setAnnMeetError] = useState("");
  const [announcementSectionFilter, setAnnouncementSectionFilter] = useState<string>("all_my_classes");

  // Multi-section announcement broadcast safety state
  const [showBroadcastAnnModal, setShowBroadcastAnnModal] = useState(false);
  const [broadcastAnnStep, setBroadcastAnnStep] = useState<"select" | "confirm">("select");
  const [broadcastAudience, setBroadcastAudience] = useState<PostAudience>("sections");
  const [broadcastAttachCodeClassId, setBroadcastAttachCodeClassId] = useState<string>("");
  const [broadcastAnnSelectedIds, setBroadcastAnnSelectedIds] = useState<string[]>([]);
  const [broadcastAnnPosting, setBroadcastAnnPosting] = useState(false);
  const [broadcastAnnSuccess, setBroadcastAnnSuccess] = useState<string | null>(null);

  // Assignments & Grading State
  const [assignments, setAssignments] = useState<ClassPost[]>([]);
  const [assTitle, setAssTitle] = useState("");
  const [assSubject, setAssSubject] = useState("");
  const [assContent, setAssContent] = useState("");
  const [assClassId, setAssClassId] = useState<string>("");
  const [assDueDate, setAssDueDate] = useState("");
  const [assMaxPoints, setAssMaxPoints] = useState(100);
  const [assAttachmentName, setAssAttachmentName] = useState("");
  const [assAttachmentDataUrl, setAssAttachmentDataUrl] = useState("");
  const [showCreateAssModal, setShowCreateAssModal] = useState(false);

  // Grading Modal State
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState<ClassPost | null>(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeInputScore, setGradeInputScore] = useState<string | number>("");
  const [gradeInputFeedback, setGradeInputFeedback] = useState("");

  const loadDatabase = () => {
    const allUsers = getUsers();
    const freshUser = allUsers.find((u) => u.id.toLowerCase() === user.id.toLowerCase());
    if (freshUser) setDbUser(freshUser);

    const studentList = allUsers.filter((u) => u.role === "student");
    setStudents(studentList);

    const teacherList = allUsers.filter((u) => u.role === "teacher");
    setTeachers(teacherList);

    const records = getAttendanceRecords();
    setAttendanceRecords(records);

    const logs = getSecurityLogs();
    setSecurityLogs(logs);

    setAnnouncements(getAnnouncements());
    setAssignments(getAssignments());

    setTeacherClasses(getClassesForTeacher(user.id));
    setUnreadMessengerCount(getUnreadDirectMessagesCount(user.id));
  };

  // There is no "All Class Sections" pseudo-view anymore - a teacher is
  // always looking at one specific, real class they own. If their selected
  // class ever goes stale (e.g. it was just deleted) or they haven't picked
  // one yet, fall back to their first class automatically.
  useEffect(() => {
    if (teacherClasses.length === 0) {
      if (selectedClassId !== "") setSelectedClassId("");
      return;
    }
    if (!teacherClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(teacherClasses[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherClasses]);

  const selectedClass = teacherClasses.find((c) => c.id === selectedClassId);

  // Everything below only ever shows data for the ONE selected class, and
  // only classes teacherClasses (this teacher's own classes) - never a
  // combined view of everything, and never another teacher's students,
  // attendance, or posts.
  const sectionStudents = !selectedClass
    ? []
    : students.filter((s) => selectedClass.studentIds.includes(s.id));

  const blockedStudents = !selectedClass
    ? []
    : getBlockedStudentsForClass(selectedClass.id);

  const filteredAttendanceRecords = !selectedClass
    ? []
    : attendanceRecords.filter((r) =>
        r.classId === selectedClass.id || sectionStudents.some((s) => s.id.toLowerCase() === r.studentId.toLowerCase())
      );

  const teacherClassIds = teacherClasses.map((c) => c.id);

  // Helper to check if a post was authored by this teacher under any credential/ID format
  const isPostAuthoredByMe = (post: ClassPost) => {
    const pAuthorId = (post.authorId || "").toLowerCase();
    const pAuthorName = (post.authorName || "").toLowerCase();
    const uId = (user.id || "").toLowerCase();
    const dbId = (dbUser?.id || "").toLowerCase();
    const uEmail = (user.email || "").toLowerCase();
    const dbEmail = (dbUser?.email || "").toLowerCase();
    const dbName = (dbUser?.name || "").toLowerCase();

    return (
      (pAuthorId && (pAuthorId === uId || pAuthorId === dbId || (uEmail && pAuthorId === uEmail) || (dbEmail && pAuthorId === dbEmail))) ||
      (pAuthorName && dbName && pAuthorName === dbName)
    );
  };

  const isPostBroadcast = (post: ClassPost) => {
    return (
      post.targetAudience === "all" ||
      post.targetAudience === "teachers" ||
      post.targetAudience === "students" ||
      post.classId === "all" ||
      post.classId === "all_teachers" ||
      post.classId === "all_students" ||
      post.classId === "global"
    );
  };

  // Base list of all announcements visible to this teacher
  const teacherAllAnnouncements = announcements
    .filter((a) => {
      return (
        isPostVisibleToTeacher(a, user.id, teacherClassIds, user.email, dbUser.name) ||
        isPostAuthoredByMe(a) ||
        (a.classId && teacherClassIds.includes(a.classId))
      );
    })
    .sort(comparePostsDesc);

  // Announcements filtered according to the active section filter in Course Announcements tab
  const filteredAnnouncements = teacherAllAnnouncements.filter((a) => {
    if (announcementSectionFilter === "all_my_classes" || !announcementSectionFilter) {
      return true;
    }
    if (announcementSectionFilter === "broadcasts") {
      return isPostBroadcast(a);
    }
    // Filtered by a specific class section
    if (a.classId === announcementSectionFilter) return true;
    // Broadcasts apply school/campus-wide so show them too
    if (isPostBroadcast(a)) return true;
    return false;
  });

  const filteredAssignments = assignments
    .filter((a) => {
      const isForMyClass = Boolean(a.classId && teacherClassIds.includes(a.classId));
      const isAuthoredByMe = isPostAuthoredByMe(a);
      if (!isForMyClass && !isAuthoredByMe) return false;

      if (!selectedClass) return true;
      return a.classId === selectedClass.id || !a.classId || a.classId === "all";
    })
    .sort(comparePostsDesc);

  const handleCreateSection = () => {
    if (!newSectionName.trim()) {
      setCreateSectionError("Class section name is required.");
      return;
    }
    const newCls = createClass(newSectionName.trim(), newSectionSubject.trim(), dbUser);
    loadDatabase();
    setSelectedClassId(newCls.id);
    setNewSectionName("");
    setNewSectionSubject("");
    setShowCreateSectionModal(false);
    setCreateSectionError(null);
  };

  useEffect(() => {
    loadDatabase();
    const handleDbUpdate = () => loadDatabase();
    const handleOpenMessenger = () => {
      setActiveTab("messenger");
    };

    window.addEventListener("db_updated", handleDbUpdate);
    window.addEventListener("open_messenger", handleOpenMessenger);

    return () => {
      window.removeEventListener("db_updated", handleDbUpdate);
      window.removeEventListener("open_messenger", handleOpenMessenger);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // Confirm teacher verification / revocation after password confirmation
  const handleConfirmTeacherAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTeacherAction) return;
    setActionPasswordError(null);
    if (!actionPassword) {
      setActionPasswordError("Please enter your account password.");
      return;
    }
    setIsVerifyingPassword(true);

    try {
      const isValid = await verifyCurrentPassword(actionPassword);
      if (!isValid) {
        setActionPasswordError("Incorrect password. Please enter your valid account password.");
        setIsVerifyingPassword(false);
        return;
      }

      const { teacher, action } = pendingTeacherAction;
      await updateUserApprovalStatus(teacher.id, action === "verify");
      addSecurityLog({
        usernameAttempted: dbUser.id,
        type: "Verification Status Changed",
        details: `Teacher ${dbUser.name} (${dbUser.id}) ${action === "verify" ? "verified" : "revoked verification for"} teacher ${teacher.name} (${teacher.id}).`
      });

      setPendingTeacherAction(null);
      setActionPassword("");
      loadDatabase();
    } catch (err: any) {
      setActionPasswordError(err?.message || "Password verification failed. Please try again.");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  // Add new teacher account
  const handleAddTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddTeacherError(null);
    if (!newTeacherId.trim() || !newTeacherName.trim() || !newTeacherPassword.trim()) {
      setAddTeacherError("Please complete Teacher ID, Full Name, and Password.");
      return;
    }
    try {
      await createUserByAdmin(newTeacherId, newTeacherName, newTeacherPassword, "teacher", {
        subject: newTeacherSubject.trim() || "General Education",
        email: newTeacherEmail.trim() || undefined,
      });
      setNewTeacherId("");
      setNewTeacherName("");
      setNewTeacherPassword("");
      setNewTeacherSubject("");
      setNewTeacherEmail("");
      setShowAddTeacherModal(false);
      loadDatabase();
    } catch (err: any) {
      setAddTeacherError("Error creating teacher account. ID may already exist.");
    }
  };

  // Edit Teacher
  const handleSaveTeacherEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherToEdit) return;
    saveUser({
      ...teacherToEdit,
      name: editTeacherName.trim(),
      subject: editTeacherSubject.trim() || undefined,
      email: editTeacherEmail.trim() || undefined,
    });
    setTeacherToEdit(null);
    loadDatabase();
  };

  // Handle Approve / Verify student
  const handleToggleApproval = async (student: User) => {
    await updateUserApprovalStatus(student.id, !student.isApproved);
    loadDatabase();
  };

  // Add new student account
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError(null);
    const cleanId = newStudentId.trim();
    const cleanName = newStudentName.trim();
    const cleanPass = newStudentPassword.trim();

    if (!cleanId || !cleanName || !cleanPass) {
      setAddStudentError("Please complete all required fields.");
      return;
    }

    if (cleanPass.length < 6) {
      setAddStudentError("Password must be at least 6 characters long.");
      return;
    }

    setIsCreatingStudent(true);
    try {
      const newStudent = await createUserByAdmin(cleanId, cleanName, cleanPass, "student");
      
      if (addStudentClassId && addStudentClassId !== "none") {
        addStudentToClass(addStudentClassId, newStudent.id);
      }

      setNewStudentId("");
      setNewStudentName("");
      setNewStudentPassword("");
      setAddStudentClassId("none");
      setShowAddStudentModal(false);
      loadDatabase();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "";
      if (msg.includes("already-in-use") || msg.includes("already exist")) {
        setAddStudentError("A student with this ID or username already exists.");
      } else if (msg.includes("weak-password")) {
        setAddStudentError("Password is too weak. Please use at least 6 characters.");
      } else {
        setAddStudentError(msg || "Error creating student account. Please try again.");
      }
    } finally {
      setIsCreatingStudent(false);
    }
  };

  // Edit Student
  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToEdit) return;
    saveUser({
      ...studentToEdit,
      name: editStudentName.trim(),
      email: editStudentEmail.trim() || undefined,
    });
    setStudentToEdit(null);
    loadDatabase();
  };

  // Remove Student from class section
  const handleConfirmRemoveStudent = () => {
    if (!studentToRemove) return;
    if (selectedClass) {
      removeStudentFromClass(selectedClass.id, studentToRemove.id);
    } else {
      teacherClasses.forEach((cls) => {
        removeStudentFromClass(cls.id, studentToRemove.id);
      });
    }
    setStudentToRemove(null);
    loadDatabase();
  };

  // Block Student from class section (removes student AND bars from rejoining)
  const handleConfirmBlockStudent = () => {
    if (!studentToBlock || !selectedClass) return;
    blockStudentFromClass(selectedClass.id, studentToBlock.id);
    setStudentToBlock(null);
    loadDatabase();
  };

  // Unblock student from class section
  const handleUnblockStudent = (studentId: string) => {
    if (!selectedClass) return;
    unblockStudentFromClass(selectedClass.id, studentId);
    loadDatabase();
  };

  // Multi-section announcement broadcast handlers
  const handleOpenBroadcastAnn = () => {
    // Safety constraint: ALL UNCHECKED by default, no pre-selection
    setBroadcastAudience("sections");
    setBroadcastAttachCodeClassId(selectedClass?.id || (teacherClasses[0]?.id ?? ""));
    setBroadcastAnnSelectedIds([]);
    setBroadcastAnnStep("select");
    setShowBroadcastAnnModal(true);
  };

  const handleToggleBroadcastAnnSection = (classId: string) => {
    setBroadcastAnnSelectedIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSelectAllBroadcastAnn = () => {
    setBroadcastAnnSelectedIds(teacherClasses.map((c) => c.id));
  };

  const handleClearAllBroadcastAnn = () => {
    setBroadcastAnnSelectedIds([]);
  };

  const handleConfirmBroadcastAnn = () => {
    if (broadcastAnnPosting || !annContent.trim()) return;
    if (broadcastAudience === "sections" && broadcastAnnSelectedIds.length === 0) return;
    setBroadcastAnnPosting(true);

    if (broadcastAudience === "all" || broadcastAudience === "students" || broadcastAudience === "teachers") {
      const audienceClassId =
        broadcastAudience === "students" ? "all_students" : broadcastAudience === "teachers" ? "all_teachers" : "all";
      const attachedClass = teacherClasses.find((c) => c.id === broadcastAttachCodeClassId);

      createPost({
        type: "announcement" as const,
        authorId: user.id,
        authorName: dbUser.name,
        title: annTitle.trim() || "Announcement",
        subject: annSubject.trim() || (broadcastAudience === "students" ? "School-Wide" : "Campus-Wide"),
        content: annContent.trim(),
        classId: audienceClassId,
        attachmentName: annAttachmentName || undefined,
        attachmentDataUrl: annAttachmentDataUrl || undefined,
        targetAudience: broadcastAudience,
        classCode: attachedClass?.joinCode,
        className: attachedClass?.name,
      });

      setBroadcastAnnSuccess(
        broadcastAudience === "students"
          ? attachedClass
            ? `Broadcast posted to ALL students school-wide with join code ${attachedClass.joinCode}!`
            : "Broadcast posted to ALL students school-wide!"
          : broadcastAudience === "teachers"
          ? "Broadcast posted to ALL faculty & teachers!"
          : "Campus-Wide broadcast posted to everyone!"
      );
    } else {
      const postsToCreate = broadcastAnnSelectedIds.map((targetClassId) => {
        const targetClass = teacherClasses.find((c) => c.id === targetClassId);
        return {
          type: "announcement" as const,
          authorId: user.id,
          authorName: dbUser.name,
          title: annTitle.trim() || "Announcement",
          subject: annSubject.trim() || targetClass?.subject || "General",
          content: annContent.trim(),
          classId: targetClassId,
          attachmentName: annAttachmentName || undefined,
          attachmentDataUrl: annAttachmentDataUrl || undefined,
          targetAudience: "sections" as const,
        };
      });

      createMultiplePosts(postsToCreate);
      setBroadcastAnnSuccess(`Broadcast posted to ${broadcastAnnSelectedIds.length} class sections.`);
    }

    setBroadcastAnnPosting(false);
    setShowBroadcastAnnModal(false);
    setTimeout(() => setBroadcastAnnSuccess(null), 5000);

    setAnnTitle("");
    setAnnSubject("");
    setAnnContent("");
    setAnnAttachmentName("");
    setAnnAttachmentDataUrl("");
    loadDatabase();
  };

  // Log attendance for a student on selected date
  const handleSetStudentAttendance = (student: User, status: AttendanceStatus) => {
    const existing = attendanceRecords.find(
      (r) => r.studentId.toLowerCase() === student.id.toLowerCase() && r.date === selectedDate
    );

    const record: AttendanceRecord = {
      id: existing?.id || `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: student.id,
      studentName: student.name,
      date: selectedDate,
      time: formatTime(new Date()),
      status,
      classId: selectedClass?.id,
    };

    saveAttendanceRecord(record);
    loadDatabase();
  };

  const handleAnnFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processFileUpload(file);
      setAnnAttachmentName(processed.name);
      setAnnAttachmentDataUrl(processed.dataUrl);
    } catch (err: any) {
      alert(err?.message || "Could not attach file.");
      setAnnAttachmentName("");
      setAnnAttachmentDataUrl("");
    } finally {
      e.target.value = "";
    }
  };

  const handleAssFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processFileUpload(file);
      setAssAttachmentName(processed.name);
      setAssAttachmentDataUrl(processed.dataUrl);
    } catch (err: any) {
      alert(err?.message || "Could not attach file.");
      setAssAttachmentName("");
      setAssAttachmentDataUrl("");
    } finally {
      e.target.value = "";
    }
  };

  // Generate a real Google Meet link (via a Calendar event) and drop it
  // straight into the announcement details textarea.
  const handleGenerateMeetLink = async () => {
    setAnnMeetError("");
    setAnnGeneratingMeet(true);
    try {
      const link = await generateGoogleMeetLink(annTitle);
      setAnnContent((prev) => (prev.trim() ? `${prev.trim()}\n\nJoin the meeting: ${link}` : `Join the meeting: ${link}`));
    } catch (err) {
      setAnnMeetError(err instanceof Error ? err.message : "Couldn't generate a Meet link. Try again.");
    } finally {
      setAnnGeneratingMeet(false);
    }
  };

  // Post Announcement
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveClassId =
      annClassId ||
      (announcementSectionFilter && announcementSectionFilter !== "all_my_classes" && announcementSectionFilter !== "broadcasts"
        ? announcementSectionFilter
        : null) ||
      selectedClassId ||
      teacherClasses[0]?.id;

    if (!annContent.trim() || !effectiveClassId) return;

    if (effectiveClassId === "all_my_sections") {
      const inputs = teacherClasses.map((cls) => ({
        type: "announcement" as const,
        authorId: user.id,
        authorName: dbUser.name,
        title: annTitle.trim() || "Announcement",
        subject: annSubject.trim() || cls.subject || "General",
        content: annContent.trim(),
        classId: cls.id,
        attachmentName: annAttachmentName || undefined,
        attachmentDataUrl: annAttachmentDataUrl || undefined,
      }));
      createMultiplePosts(inputs);
    } else {
      const targetClass = teacherClasses.find((c) => c.id === effectiveClassId);
      createPost({
        type: "announcement",
        authorId: user.id,
        authorName: dbUser.name,
        title: annTitle.trim() || "Announcement",
        subject: annSubject.trim() || targetClass?.subject || selectedClass?.subject || "General",
        content: annContent.trim(),
        classId: effectiveClassId,
        attachmentName: annAttachmentName || undefined,
        attachmentDataUrl: annAttachmentDataUrl || undefined,
      });
    }

    setAnnTitle("");
    setAnnSubject("");
    setAnnContent("");
    setAnnMeetError("");
    setAnnAttachmentName("");
    setAnnAttachmentDataUrl("");
    setShowCreateAnnModal(false);
    loadDatabase();
  };

  // Post Assignment
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assTitle.trim() || !assContent.trim() || !assClassId) return;

    const targetClass = teacherClasses.find((c) => c.id === assClassId);

    createPost({
      type: "assignment",
      authorId: user.id,
      authorName: dbUser.name,
      title: assTitle.trim(),
      subject: assSubject.trim() || targetClass?.subject || selectedClass?.subject || "General",
      content: assContent.trim(),
      dueDate: assDueDate || formatDate(new Date(Date.now() + 86400000 * 7)),
      maxPoints: Number(assMaxPoints) || 100,
      classId: assClassId,
      attachmentName: assAttachmentName || undefined,
      attachmentDataUrl: assAttachmentDataUrl || undefined,
    });

    setAssTitle("");
    setAssSubject("");
    setAssContent("");
    setAssDueDate("");
    setAssMaxPoints(100);
    setAssAttachmentName("");
    setAssAttachmentDataUrl("");
    setShowCreateAssModal(false);
    loadDatabase();
  };

  // Open Submissions List for an Assignment
  const handleOpenGradingModal = (assignment: ClassPost) => {
    setSelectedAssignmentForGrading(assignment);
    const subs = getSubmissionsForPost(assignment.id);
    setAssignmentSubmissions(subs);
  };

  // Open Grade Submission Modal
  const handleStartGrade = (sub: AssignmentSubmission) => {
    setGradingSubmission(sub);
    setGradeInputScore(sub.score || "");
    setGradeInputFeedback(sub.feedback || "");
  };

  // Save Grade
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    let cleanScore = String(gradeInputScore).trim();
    if (cleanScore.includes("/")) {
      cleanScore = cleanScore.split("/")[0].trim();
    }

    gradeSubmission(gradingSubmission.id, cleanScore, gradeInputFeedback);
    setGradingSubmission(null);
    if (selectedAssignmentForGrading) {
      setAssignmentSubmissions(getSubmissionsForPost(selectedAssignmentForGrading.id));
    }
    loadDatabase();
  };

  // Attachment upload handler
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setName: (n: string) => void,
    setUrl: (u: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("File exceeds 3MB limit.");
      return;
    }
    setName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => setUrl(evt.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Filtered Students
  const filteredStudents = sectionStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen pb-16 pt-4 sm:pt-6 px-2.5 sm:px-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      <div className="relative z-10 space-y-4 sm:space-y-6 w-full min-w-0">
        {/* Header Bar */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cream rounded-3xl border border-ink-soft/10 p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 min-w-0 overflow-hidden"
        >
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar name={dbUser.name} avatarUrl={dbUser.avatarUrl} role="teacher" size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold bg-violet-500/15 text-violet-300 rounded-full border border-violet-500/30 shrink-0">
                  Teacher Portal
                </span>
                <span className="text-xs font-mono text-ink-soft/70 truncate">ID: {user.id}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight mt-0.5 truncate">
                Welcome, {dbUser.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
            {/* Theme Cycle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const themes: AppTheme[] = ["default", "sakura", "spring", "summer", "autumn", "winter"];
                const next = themes[(themes.indexOf(theme) + 1) % themes.length];
                onThemeChange(next);
              }}
              className="p-2 sm:p-2.5 rounded-xl border border-white/20 bg-slate-900/90 hover:bg-slate-800 text-white flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-lg"
              title="Click to cycle themes"
            >
              <Palette className="h-4 w-4 text-cyan-400 shrink-0" />
              <span className="capitalize font-mono font-bold text-xs">{theme === "default" ? "Cyberpunk" : theme}</span>
            </motion.button>

            {/* Quick Night / Day Mode Toggle */}
            {onThemeModeChange && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onThemeModeChange(themeMode === "night" ? "day" : "night")}
                className="p-2 sm:p-2.5 rounded-xl border border-white/20 bg-slate-900/90 hover:bg-slate-800 text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-lg"
                title={`Switch to ${themeMode === "night" ? "Day" : "Night"} Mode`}
              >
                {themeMode === "night" ? (
                  <Moon className="h-4 w-4 text-cyan-400 shrink-0" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-400 shrink-0" />
                )}
                <span className="capitalize font-mono font-bold text-xs">
                  {themeMode === "night" ? "Night" : "Day"}
                </span>
              </motion.button>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-bold text-coral-600 bg-coral-50 border border-coral-200 rounded-xl hover:bg-coral-100 transition-all cursor-pointer shadow-sm shrink-0"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>

        {/* Persistent "pending verification" notice - shown on every tab, not
            just the Teachers tab, since an unapproved teacher has limited
            (mostly read-only) access everywhere until a colleague verifies
            them: they can't create classes, add/approve accounts, post
            announcements or assignments, take attendance, or grade. */}
        {!dbUser.isApproved && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-950/80 border border-amber-500/40 p-4 rounded-2xl flex items-center gap-3 text-amber-200 text-xs font-semibold shadow-lg"
          >
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-extrabold text-amber-300 block text-sm">Account Pending Verification</span>
              Your teacher account is waiting for approval by fellow faculty members. Until then you have read-only
              access - creating classes, adding or approving accounts, posting to a class, taking attendance, and
              grading are all disabled.
            </div>
          </motion.div>
        )}

        {/* Switch Class Section Selector Bar */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cream/90 backdrop-blur-xl border border-ink-soft/10 rounded-2xl p-3.5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 rounded-xl shrink-0">
              <School className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink-soft/60 block">
                Class Section
              </span>
              {teacherClasses.length === 0 ? (
                <p className="text-xs sm:text-sm font-extrabold text-ink-soft mt-0.5">
                  You don't have any class sections yet — create one to get started.
                </p>
              ) : (
                <p className="text-xs sm:text-sm font-extrabold text-ink truncate mt-0.5">
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span>Viewing Section: </span>
                    <span className="text-violet-600 dark:text-violet-400 font-black">
                      {selectedClass?.name}
                    </span>
                    {selectedClass?.subject && (
                      <span className="px-2 py-0.5 text-[10px] bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 rounded-lg border border-violet-200 dark:border-violet-800">
                        {selectedClass.subject}
                      </span>
                    )}
                    {selectedClass?.joinCode && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedClass.joinCode);
                          setCopiedCode(selectedClass.joinCode);
                          setTimeout(() => setCopiedCode(null), 2000);
                        }}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 rounded-lg border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-200 transition-all cursor-pointer flex items-center gap-1"
                        title="Click to copy join code"
                      >
                        <Copy className="h-3 w-3 text-cyan-400" />
                        <span>{copiedCode === selectedClass.joinCode ? "Copied!" : `Code: ${selectedClass.joinCode}`}</span>
                      </button>
                    )}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto shrink-0">
            {teacherClasses.length > 0 && (
              <>
                <label htmlFor="teacher-class-select" className="text-xs font-bold text-ink-soft hidden sm:inline shrink-0">
                  Section:
                </label>
                <select
                  id="teacher-class-select"
                  value={selectedClassId}
                  onChange={(e) => {
                    if (e.target.value === "__create__") {
                      if (dbUser.isApproved) setShowCreateSectionModal(true);
                    } else {
                      setSelectedClassId(e.target.value);
                    }
                  }}
                  className="w-full md:w-auto px-3.5 py-2 text-xs font-bold bg-slate-900 border border-ink-soft/20 rounded-xl text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  {teacherClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.subject ? `(${c.subject})` : ""} — {c.studentIds.length} Students
                    </option>
                  ))}
                  {dbUser.isApproved && <option value="__create__">+ Create New Class Section...</option>}
                </select>
              </>
            )}

            {dbUser.isApproved && (
              <>
                {teacherClasses.length > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab("announcements");
                      handleOpenBroadcastAnn();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-violet-950/80 border border-violet-500/40 hover:bg-violet-900/80 text-violet-300 hover:text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 transition-all"
                    title="Broadcast an announcement to all or multiple class sections at once"
                  >
                    <Layers className="h-4 w-4 text-violet-400" />
                    <span>Broadcast to All Sections</span>
                  </button>
                )}
                <button
                  onClick={() => setShowCreateSectionModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>{teacherClasses.length === 0 ? "Create Your First Section" : "New Section"}</span>
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Navigation Tabs - Responsive Scrollable Flex Row */}
        <div
          id="teacher-tabs-nav"
          className="bg-cream/80 backdrop-blur-xl p-1.5 rounded-2xl border border-ink-soft/10 shadow-lg w-full overflow-x-auto scrollbar-hide"
        >
          <div className="flex items-center justify-start gap-1 sm:gap-1.5 min-w-max pr-1 sm:pr-1.5">
            {[
              { id: "roster", label: "Student Roster", icon: Users, count: sectionStudents.length },
              {
                id: "teachers",
                label: "Teachers",
                icon: GraduationCap,
                count: teachers.filter((t) => !t.isApproved).length,
                badgeColor: "bg-amber-500",
              },
              { id: "checkins", label: "Attendance Sheet", icon: UserCheck },
              { id: "announcements", label: "Announcements", icon: Megaphone, count: filteredAnnouncements.length },
              { id: "assignments", label: "Assignments & Grading", icon: FileText, count: filteredAssignments.length },
              { id: "reports", label: "Reports & Logs", icon: FileSpreadsheet },
              {
                id: "messenger",
                label: "Class Messenger",
                icon: MessageSquare,
                count: unreadMessengerCount > 0 ? unreadMessengerCount : undefined,
                badgeColor: "bg-violet-500",
              },
              { id: "settings", label: "Settings", icon: SettingsIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                    isActive ? "text-violet-600 dark:text-violet-300" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="teacherActiveTabPill"
                      className="absolute inset-0 bg-violet-500/15 border border-violet-500/30 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10 shrink-0" />
                  <span className="relative z-10">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`relative z-10 px-1.5 py-0.2 text-[10px] font-extrabold ${tab.badgeColor || "bg-violet-500"} text-white rounded-full shrink-0`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: STUDENT ROSTER */}
        {activeTab === "roster" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6 min-w-0"
          >
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 min-w-0 overflow-hidden backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0 bg-slate-950/80 px-3.5 py-2.5 rounded-2xl border border-slate-700/60 focus-within:border-fuchsia-400 focus-within:shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all">
                  <Search className="h-5 w-5 text-fuchsia-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students by name or ID..."
                    className="w-full text-xs font-semibold bg-transparent !border-none !outline-none focus:!bg-transparent focus:!outline-none focus:!border-none focus:!ring-0 text-white placeholder-slate-400"
                    style={{ border: "none", outline: "none", boxShadow: "none" }}
                  />
                </div>

                {dbUser.isApproved ? (
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="px-4 py-2.5 text-xs font-extrabold text-white bg-fuchsia-500 hover:bg-fuchsia-400 rounded-xl cursor-pointer shadow-md shadow-fuchsia-500/20 flex items-center justify-center gap-2 shrink-0 transition-all"
                  >
                    <UserPlus className="h-4 w-4" /> <span>Add Student</span>
                  </button>
                ) : (
                  <span
                    className="px-4 py-2.5 text-xs font-bold text-slate-400 bg-slate-800/80 rounded-xl flex items-center justify-center gap-2 shrink-0 border border-slate-700/60"
                    title="Your account needs to be verified by an existing faculty member before you can add student accounts."
                  >
                    <ShieldAlert className="h-4 w-4" /> <span>Verification required</span>
                  </span>
                )}
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-8 sm:p-12 text-center text-slate-400 space-y-2">
                  <Users className="h-10 w-10 mx-auto text-slate-500" />
                  <p className="text-sm font-bold text-white">No students registered.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">
                  {filteredStudents.map((st, idx) => {
                    const stStats = calculateStudentStats(st.id);
                    return (
                      <motion.div
                        key={st.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="bg-slate-950/70 border border-slate-700/60 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between space-y-3 min-w-0 hover:border-fuchsia-500/40 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 truncate">
                              ID: {st.id}
                            </span>
                            <button
                              onClick={() => dbUser.isApproved && handleToggleApproval(st)}
                              disabled={!dbUser.isApproved}
                              title={!dbUser.isApproved ? "Your account needs to be verified before you can approve students." : undefined}
                              className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border shrink-0 ${
                                dbUser.isApproved ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                              } ${
                                st.isApproved
                                  ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                              }`}
                            >
                              {st.isApproved ? "Verified" : "Approve Pending"}
                            </button>
                          </div>
                          <h3 className="text-base font-black text-ink mt-1 truncate">{st.name}</h3>
                        </div>

                        <div className="p-2.5 bg-cream rounded-xl text-xs flex justify-between font-mono gap-1">
                          <span>Punctuality: <strong>{stStats.percentage}%</strong></span>
                          <span>Attended: <strong>{stStats.presentCount}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 border-t border-ink-soft/10">
                          <button
                            onClick={() => setViewingStudent(st)}
                            className="flex-1 py-1.5 text-xs font-bold text-violet-300 bg-violet-500/20 border border-violet-500/40 rounded-lg hover:bg-violet-500/30 cursor-pointer flex items-center justify-center gap-1 transition-all"
                          >
                            <Eye className="h-3.5 w-3.5" /> Profile
                          </button>
                          <button
                            onClick={() => openDirectMessage(st.id)}
                            className="px-2.5 py-1.5 text-xs font-bold text-violet-300 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/40 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                            title={`Direct message ${st.name}`}
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
                            <span>DM</span>
                          </button>
                          <button
                            onClick={() => {
                              setStudentToEdit(st);
                              setEditStudentName(st.name);
                              setEditStudentEmail(st.email || "");
                            }}
                            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700 cursor-pointer transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setStudentToRemove({ id: st.id, name: st.name })}
                            className="p-1.5 text-amber-300 hover:text-amber-200 bg-amber-500/20 rounded-lg border border-amber-500/30 cursor-pointer transition-colors"
                            title={`Remove ${st.name} from ${selectedClass?.name || "class section"}`}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </button>
                          {selectedClass && (
                            <button
                              onClick={() => setStudentToBlock({ id: st.id, name: st.name })}
                              className="p-1.5 text-rose-300 hover:text-rose-200 bg-rose-500/20 rounded-lg border border-rose-500/30 cursor-pointer transition-colors"
                              title={`Block ${st.name} from ${selectedClass.name} (barred from rejoining)`}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Blocked Students Section */}
              {selectedClass && blockedStudents.length > 0 && (
                <div className="mt-8 pt-6 border-t border-rose-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <h3 className="font-extrabold text-sm text-white">
                      Blocked Students ({blockedStudents.length})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    These students have been removed and barred from rejoining <strong className="text-white">{selectedClass.name}</strong> with the join code. Unblock them to allow them to re-enter.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {blockedStudents.map((st) => (
                      <div
                        key={st.id}
                        className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{st.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {st.id}</p>
                        </div>
                        <button
                          onClick={() => handleUnblockStudent(st.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                          <span>Unblock</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: TEACHERS & VERIFICATION */}
        {activeTab === "teachers" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Metric Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div
                onClick={() => setTeacherStatusFilter("All")}
                className="bg-slate-900/80 border border-slate-700/60 p-4 rounded-2xl backdrop-blur-xl cursor-pointer hover:border-violet-500/60 transition-all"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Teachers</span>
                  <GraduationCap className="h-4 w-4 text-violet-400" />
                </div>
                <p className="text-2xl font-black text-white font-display">{teachers.length}</p>
              </div>

              <div
                onClick={() => setTeacherStatusFilter("Verified")}
                className="bg-slate-900/80 border border-teal-500/30 p-4 rounded-2xl backdrop-blur-xl cursor-pointer hover:border-teal-500/60 transition-all"
              >
                <div className="flex items-center justify-between text-teal-300 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Verified Teachers</span>
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                </div>
                <p className="text-2xl font-black text-teal-400 font-display">
                  {teachers.filter((t) => t.isApproved).length}
                </p>
              </div>

              <div
                onClick={() => setTeacherStatusFilter("Pending")}
                className="bg-slate-900/80 border border-amber-500/30 p-4 rounded-2xl backdrop-blur-xl cursor-pointer hover:border-amber-500/60 transition-all"
              >
                <div className="flex items-center justify-between text-amber-300 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pending Verification</span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-400 font-display">
                  {teachers.filter((t) => !t.isApproved).length}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-700/60 p-4 rounded-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Your Status</span>
                  <UserCheck className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      dbUser.isApproved
                        ? "bg-teal-950/80 text-teal-300 border border-teal-500/40"
                        : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {dbUser.isApproved ? "Verified Teacher" : "Pending Approval"}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls Header: Search, Status Filter, Add Teacher Button */}
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="flex items-center gap-3 flex-1 bg-slate-950/80 px-3.5 py-2.5 rounded-2xl border border-slate-700/60 focus-within:border-violet-400 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all">
                  <Search className="h-5 w-5 text-violet-400 shrink-0" />
                  <input
                    type="text"
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    placeholder="Search teachers by name, ID, or subject..."
                    className="w-full text-xs font-semibold bg-transparent !border-none !outline-none focus:!bg-transparent focus:!outline-none focus:!border-none focus:!ring-0 text-white placeholder-slate-400"
                  />
                  {teacherSearchQuery && (
                    <button onClick={() => setTeacherSearchQuery("")}>
                      <X className="h-4 w-4 text-slate-400 hover:text-white" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                  {(["All", "Pending", "Verified"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setTeacherStatusFilter(st)}
                      className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all shrink-0 cursor-pointer ${
                        teacherStatusFilter === st
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {st === "All" ? "All Faculty" : st === "Pending" ? "Pending Approval" : "Verified Only"}
                    </button>
                  ))}
                </div>

                {/* Add Teacher Button - only an already-verified teacher can
                    vouch for a new account (matches the Firestore rules). */}
                {dbUser.isApproved ? (
                  <button
                    onClick={() => setShowAddTeacherModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Teacher Account</span>
                  </button>
                ) : (
                  <span
                    className="px-4 py-2.5 bg-slate-800/80 text-slate-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shrink-0 border border-slate-700/60"
                    title="Your account needs to be verified by an existing faculty member before you can add other accounts."
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Verification required to add accounts</span>
                  </span>
                )}
              </div>

              {/* Teacher Cards Grid */}
              {(() => {
                const filteredTeachers = teachers.filter((t) => {
                  const q = teacherSearchQuery.trim().toLowerCase();
                  const matchesQuery =
                    !q ||
                    t.name.toLowerCase().includes(q) ||
                    t.id.toLowerCase().includes(q) ||
                    (t.subject && t.subject.toLowerCase().includes(q)) ||
                    (t.email && t.email.toLowerCase().includes(q));
                  if (teacherStatusFilter === "Verified") return matchesQuery && t.isApproved;
                  if (teacherStatusFilter === "Pending") return matchesQuery && !t.isApproved;
                  return matchesQuery;
                });

                if (filteredTeachers.length === 0) {
                  return (
                    <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-slate-800/80">
                      <GraduationCap className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-300">No teacher accounts found</p>
                      <p className="text-xs text-slate-500 mt-1">Try resetting your search query or status filter.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {filteredTeachers.map((t, idx) => {
                      const isMe = t.id.toLowerCase() === dbUser.id.toLowerCase();
                      return (
                        <div
                          key={`${t.id || t.uid || 'teacher'}-${idx}`}
                          className={`bg-slate-950/70 border rounded-2xl p-4 space-y-3.5 transition-all relative ${
                            !t.isApproved
                              ? "border-amber-500/40 bg-amber-950/10"
                              : "border-slate-800 hover:border-violet-500/40"
                          }`}
                        >
                          {/* Header: Avatar, Info, Status Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar name={t.name} avatarUrl={t.avatarUrl} size="md" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-extrabold text-sm text-white">{t.name}</h4>
                                  {isMe && (
                                    <span className="px-2 py-0.2 text-[9px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded-full">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-mono font-semibold text-slate-400">ID: {t.id}</p>
                              </div>
                            </div>

                            {/* Verification Status Badge */}
                            <div>
                              {t.isApproved ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-teal-950/80 text-teal-300 border border-teal-500/40">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" /> Verified Teacher
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse">
                                  <Clock className="h-3.5 w-3.5 text-amber-400" /> Pending Approval
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Details Pills / Meta */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {t.subject && (
                              <div className="flex items-start gap-2 text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 sm:col-span-2">
                                <BookOpen className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                                <div className="flex flex-wrap gap-1 min-w-0">
                                  {t.subject.split(',').map((sub, sIdx) => (
                                    <span key={sIdx} className="bg-violet-950/80 text-violet-300 px-2 py-0.5 rounded text-[11px] font-semibold border border-violet-800/40">
                                      {sub.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {t.email && (
                              <div className="flex items-center gap-2 text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 sm:col-span-2">
                                <Mail className="h-3.5 w-3.5 text-fuchsia-400 shrink-0" />
                                <a href={`mailto:${t.email}`} className="hover:underline text-fuchsia-300 truncate">
                                  {t.email}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Action Toolbar */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <div className="text-[10px] text-slate-500 font-mono">
                              Joined: {t.createdAt || "N/A"}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* DM Faculty Button */}
                              {t.id.toLowerCase() !== dbUser.id.toLowerCase() && (
                                <button
                                  onClick={() => openDirectMessage(t.id)}
                                  className="px-2.5 py-1.5 text-xs font-extrabold text-violet-300 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                  title={`Direct message ${t.name}`}
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
                                  <span>DM</span>
                                </button>
                              )}

                              {/* View Profile Button */}
                              <button
                                onClick={() => setViewingTeacherProfile(t)}
                                className="px-3 py-1.5 text-xs font-extrabold text-violet-300 bg-violet-950/80 hover:bg-violet-900 border border-violet-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                                id={`view-teacher-profile-${t.id}`}
                              >
                                <GraduationCap className="h-3.5 w-3.5 text-violet-400" />
                                <span>View Profile</span>
                              </button>

                              {/* Quick Approve / Verify Button if pending.
                                  A teacher can never verify themselves, and
                                  only an already-approved teacher may vouch
                                  for a colleague. */}
                              {!t.isApproved && !isMe && dbUser.isApproved && (
                                <button
                                  onClick={() => {
                                    setPendingTeacherAction({
                                      teacher: t,
                                      action: "verify",
                                    });
                                    setActionPassword("");
                                    setActionPasswordError(null);
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-extrabold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/30 transition-all flex items-center gap-1 cursor-pointer"
                                  title="Verify Teacher"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                                </button>
                              )}

                              {/* Edit Details - only ever your own profile.
                                  Fellow teachers are peers, not accounts you
                                  can administer: edit your own info from
                                  here or from Settings, but a colleague's
                                  name/subject/contact info is theirs alone
                                  to change. */}
                              {isMe && (
                                <button
                                  onClick={() => {
                                    setTeacherToEdit(t);
                                    setEditTeacherName(t.name);
                                    setEditTeacherSubject(t.subject || "");
                                    setEditTeacherEmail(t.email || "");
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-all cursor-pointer"
                                  title="Edit My Details"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}

                              {/* Note: deleting a teacher account has been
                                  intentionally removed from this list. One
                                  teacher should never be able to delete a
                                  colleague's account - that capability
                                  doesn't exist anywhere in this app anymore.
                                  Teachers can remove their own account from
                                  Settings. */}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
        {activeTab === "checkins" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DailyCheckinsTab
              currentUser={dbUser}
              allStudents={sectionStudents}
              attendanceRecords={filteredAttendanceRecords}
              onSelectStudent={(st) => setViewingStudent(st)}
            />
          </motion.div>
        )}

        {/* TAB 4: ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-ink flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-violet-500" />
                  Course Announcements
                </h2>
                <p className="text-xs text-ink-soft mt-0.5">
                  View and manage announcements across your class sections and campus broadcasts.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {dbUser.isApproved && teacherClasses.length > 0 && (
                  <button
                    onClick={() => {
                      if (selectedClassId) setAnnClassId(selectedClassId);
                      if (selectedClass?.subject) setAnnSubject(selectedClass.subject);
                      handleOpenBroadcastAnn();
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-violet-300 bg-violet-950/80 border border-violet-500/40 hover:bg-violet-900/80 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                    title="Broadcast announcement to multiple or all sections with safety confirmation"
                  >
                    <Layers className="h-4 w-4 text-violet-400" />
                    <span>Broadcast to All Sections...</span>
                  </button>
                )}
                {dbUser.isApproved && teacherClasses.length > 0 ? (
                  <button
                    onClick={() => {
                      const initialClassId =
                        announcementSectionFilter &&
                        announcementSectionFilter !== "all_my_classes" &&
                        announcementSectionFilter !== "broadcasts"
                          ? announcementSectionFilter
                          : (selectedClassId || teacherClasses[0]?.id || "");
                      setAnnClassId(initialClassId);
                      const targetClass = teacherClasses.find((c) => c.id === initialClassId);
                      if (targetClass?.subject) setAnnSubject(targetClass.subject);
                      setShowCreateAnnModal(true);
                    }}
                    className="px-4 py-2 text-xs font-extrabold text-white bg-violet-500 hover:bg-violet-600 rounded-xl cursor-pointer shadow-md shadow-violet-500/20 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Post Announcement
                  </button>
                ) : (
                  <span
                    className="px-4 py-2 text-xs font-bold text-ink-soft/60 bg-ink-soft/10 rounded-xl flex items-center gap-2"
                    title={!dbUser.isApproved ? "Your account needs to be verified before you can post." : "Create a class section first."}
                  >
                    <Plus className="h-4 w-4" /> Post Announcement
                  </span>
                )}
              </div>
            </div>

            {/* Section Filter Pills */}
            {teacherClasses.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 border-b border-ink-soft/10 pb-3">
                <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Filter className="h-3 w-3 text-violet-400" /> Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setAnnouncementSectionFilter("all_my_classes")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                    announcementSectionFilter === "all_my_classes"
                      ? "bg-violet-500 text-white shadow-sm shadow-violet-500/30"
                      : "bg-cream border border-ink-soft/15 text-ink-soft hover:text-ink hover:bg-ink-soft/5"
                  }`}
                >
                  All Sections ({teacherAllAnnouncements.length})
                </button>
                {teacherClasses.map((c) => {
                  const countForClass = teacherAllAnnouncements.filter(
                    (a) => a.classId === c.id || isPostBroadcast(a)
                  ).length;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAnnouncementSectionFilter(c.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                        announcementSectionFilter === c.id
                          ? "bg-violet-500 text-white shadow-sm shadow-violet-500/30"
                          : "bg-cream border border-ink-soft/15 text-ink-soft hover:text-ink hover:bg-ink-soft/5"
                      }`}
                    >
                      📚 {c.name} ({countForClass})
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setAnnouncementSectionFilter("broadcasts")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                    announcementSectionFilter === "broadcasts"
                      ? "bg-violet-500 text-white shadow-sm shadow-violet-500/30"
                      : "bg-cream border border-ink-soft/15 text-ink-soft hover:text-ink hover:bg-ink-soft/5"
                  }`}
                >
                  🌐 Broadcasts Only ({teacherAllAnnouncements.filter((a) => isPostBroadcast(a)).length})
                </button>
              </div>
            )}

            {broadcastAnnSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{broadcastAnnSuccess}</span>
              </div>
            )}

            {filteredAnnouncements.length === 0 ? (
              <div className="bg-cream border border-ink-soft/10 rounded-3xl p-12 text-center text-ink-soft/60 space-y-3">
                <Megaphone className="h-10 w-10 mx-auto text-ink-soft/30" />
                <p className="text-sm font-bold text-ink">
                  {announcementSectionFilter === "all_my_classes"
                    ? "No announcements found for any of your class sections yet."
                    : announcementSectionFilter === "broadcasts"
                    ? "No campus or school-wide broadcasts found."
                    : `No announcements posted for ${teacherClasses.find((c) => c.id === announcementSectionFilter)?.name || "this section"} yet.`}
                </p>
                <p className="text-xs text-ink-soft max-w-md mx-auto">
                  Post an announcement to notify students about exams, schedules, classroom updates, or lecture materials.
                </p>
                {dbUser.isApproved && teacherClasses.length > 0 && (
                  <button
                    onClick={() => {
                      const initialClassId =
                        announcementSectionFilter &&
                        announcementSectionFilter !== "all_my_classes" &&
                        announcementSectionFilter !== "broadcasts"
                          ? announcementSectionFilter
                          : (selectedClassId || teacherClasses[0]?.id || "");
                      setAnnClassId(initialClassId);
                      setShowCreateAnnModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-violet-500 hover:bg-violet-600 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Create First Announcement
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnnouncements.map((post) => (
                  <div
                    key={post.id}
                    className="bg-cream border border-ink-soft/10 rounded-3xl p-6 shadow-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.targetAudience === "students" || post.classId === "all_students" ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/40">
                            👥 All Students (School-Wide)
                          </span>
                        ) : post.targetAudience === "all" || post.classId === "all" ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/40">
                            🌐 Campus-Wide (Everyone)
                          </span>
                        ) : post.targetAudience === "teachers" || post.classId === "all_teachers" ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/40">
                            🏫 Faculty & Staff
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/40">
                            📚 {teacherClasses.find((c) => c.id === post.classId)?.name || "Section"}
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                          {post.subject || "General"}
                        </span>
                        <h3 className="text-base font-black text-ink">{post.title}</h3>
                      </div>
                      <button
                        onClick={() => {
                          deletePost(post.id);
                          loadDatabase();
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-xs text-ink/90 font-sans leading-relaxed whitespace-pre-wrap">
                      {linkifyText(post.content, {
                        linkClassName:
                          "font-semibold text-indigo-600 hover:text-indigo-700 underline decoration-indigo-400/50 underline-offset-2 break-all",
                      })}
                      {post.classCode && !hasJoinCode(post.content, post.classCode) && (
                        <div className="mt-2.5">
                          <JoinCodePill code={post.classCode} className={post.className} />
                        </div>
                      )}
                    </div>

                    {post.attachmentDataUrl && (
                      post.attachmentDataUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(post.attachmentName || "") ? (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/40 max-w-lg">
                          <img
                            src={post.attachmentDataUrl}
                            alt={post.attachmentName || "Attached photo"}
                            className="max-h-72 w-full object-cover rounded-t-2xl hover:opacity-95 transition-opacity cursor-pointer"
                            onClick={() => window.open(post.attachmentDataUrl, "_blank")}
                          />
                          <div className="p-2.5 bg-slate-900/90 flex items-center justify-between text-xs font-bold text-slate-200">
                            <span className="flex items-center gap-1.5 truncate">
                              <ImageIcon className="h-4 w-4 text-violet-400 shrink-0" />
                              <span className="truncate">{post.attachmentName || "Attached Photo"}</span>
                            </span>
                            <a
                              href={post.attachmentDataUrl}
                              download={post.attachmentName || "photo.png"}
                              className="px-3 py-1 text-[11px] font-extrabold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shadow-sm transition-all"
                            >
                              Download Photo
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs font-bold text-slate-200">
                          <span className="flex items-center gap-1.5 truncate">
                            <Paperclip className="h-4 w-4 text-violet-400 shrink-0" />
                            <span className="truncate">{post.attachmentName || "Attachment"}</span>
                          </span>
                          <a
                            href={post.attachmentDataUrl}
                            download={post.attachmentName || "attachment"}
                            className="px-3 py-1 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shrink-0 shadow-sm transition-all"
                          >
                            Download
                          </a>
                        </div>
                      )
                    )}

                    {/* Class & Private Comments Section */}
                    <PostCommentsSection
                      post={post}
                      currentUser={dbUser}
                      isTeacher={true}
                      studentsList={
                        post.classId && post.classId !== "all"
                          ? students.filter((s) => {
                              const cls = teacherClasses.find((c) => c.id === post.classId);
                              return cls ? cls.studentIds.includes(s.id) : true;
                            })
                          : sectionStudents.length > 0
                          ? sectionStudents
                          : students
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: ASSIGNMENTS & GRADING */}
        {activeTab === "assignments" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-ink flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-400" />
                Assignments & Student Submissions
              </h2>
              {dbUser.isApproved && selectedClass ? (
                <button
                  onClick={() => {
                    setAssClassId(selectedClassId);
                    if (selectedClass?.subject) setAssSubject(selectedClass.subject);
                    setShowCreateAssModal(true);
                  }}
                  className="px-4 py-2 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-500 rounded-xl cursor-pointer shadow-md shadow-violet-600/30 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Create Assignment
                </button>
              ) : (
                <span
                  className="px-4 py-2 text-xs font-bold text-ink-soft/60 bg-ink-soft/10 rounded-xl flex items-center gap-2"
                  title={!dbUser.isApproved ? "Your account needs to be verified before you can post." : "Create a class section first."}
                >
                  <Plus className="h-4 w-4" /> Create Assignment
                </span>
              )}
            </div>

            {filteredAssignments.length === 0 ? (
              <div className="bg-cream border border-ink-soft/10 rounded-3xl p-12 text-center text-ink-soft/60 space-y-2">
                <FileText className="h-10 w-10 mx-auto text-ink-soft/30" />
                <p className="text-sm font-bold text-ink">No assignments created for this section yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAssignments.map((assignment) => {
                  const subs = getSubmissionsForPost(assignment.id);
                  const gradedCount = subs.filter((s) => s.status === "Graded").length;

                  return (
                    <div
                      key={assignment.id}
                      className="bg-cream border border-ink-soft/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/40">
                              {!assignment.classId || assignment.classId === "all"
                                ? "🌐 All Sections"
                                : `📚 ${teacherClasses.find((c) => c.id === assignment.classId)?.name || "Section"}`}
                            </span>
                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                              Due: {assignment.dueDate || "N/A"}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            Max Points: {assignment.maxPoints || 100}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-ink">{assignment.title}</h3>
                        <p className="text-xs text-ink/80 font-sans line-clamp-3">
                          {assignment.content}
                        </p>

                        {/* Attachment preview if any */}
                        {assignment.attachmentDataUrl && (
                          assignment.attachmentDataUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(assignment.attachmentName || "") ? (
                            <div className="mt-2 overflow-hidden rounded-2xl border border-ink-soft/15 bg-slate-950/40">
                              <img
                                src={assignment.attachmentDataUrl}
                                alt={assignment.attachmentName || "Attached photo"}
                                className="max-h-48 w-full object-cover rounded-t-2xl hover:opacity-95 transition-opacity cursor-pointer"
                                onClick={() => window.open(assignment.attachmentDataUrl, "_blank")}
                              />
                              <div className="p-2.5 bg-slate-900/90 border-t border-ink-soft/15 flex items-center justify-between text-xs font-bold text-ink">
                                <span className="flex items-center gap-1.5 truncate">
                                  <ImageIcon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                                  <span className="truncate">{assignment.attachmentName || "Reference Photo"}</span>
                                </span>
                                <a
                                  href={assignment.attachmentDataUrl}
                                  download={assignment.attachmentName || "photo.png"}
                                  className="px-2.5 py-1 text-[11px] font-bold text-violet-300 bg-violet-500/20 border border-violet-500/40 hover:bg-violet-500/30 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Download className="h-3 w-3" /> Download
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-slate-950/40 border border-ink-soft/15 rounded-2xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-ink truncate">
                                <Paperclip className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                                <span className="truncate">{assignment.attachmentName || "Attachment"}</span>
                              </div>
                              <a
                                href={assignment.attachmentDataUrl}
                                download={assignment.attachmentName || "attachment"}
                                className="px-2.5 py-1 text-[11px] font-bold text-violet-300 bg-violet-500/20 border border-violet-500/40 rounded-lg hover:bg-violet-500/30 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" /> Download
                              </a>
                            </div>
                          )
                        )}
                      </div>

                      <div className="p-3 bg-slate-900/80 border border-slate-700/70 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-200">
                        <span>
                          Submissions: <strong className="text-white">{subs.length}</strong> ({gradedCount} graded)
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenGradingModal(assignment)}
                            className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-md shadow-violet-600/30 cursor-pointer transition-all flex items-center gap-1"
                          >
                            Review & Grade
                          </button>
                          <button
                            onClick={() => {
                              deletePost(assignment.id);
                              loadDatabase();
                            }}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Class & Private Comments Section */}
                      <PostCommentsSection
                        post={assignment}
                        currentUser={dbUser}
                        isTeacher={true}
                        studentsList={sectionStudents}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 5: REPORTS & SECURITY LOGS */}
        {activeTab === "reports" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-xl">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-fuchsia-400" />
                Security & Audit Event Logs
              </h2>

              {securityLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No security alerts logged.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="pb-3 px-3 whitespace-nowrap">Time</th>
                        <th className="pb-3 px-3 whitespace-nowrap">Event Type</th>
                        <th className="pb-3 px-3 whitespace-nowrap">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {securityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-fuchsia-500/5 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">{log.timestamp}</td>
                          <td className="py-3 px-3 font-bold text-fuchsia-400 whitespace-nowrap">{log.type}</td>
                          <td className="py-3 px-3 text-slate-200">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 6: CLASS MESSENGER */}
        {activeTab === "messenger" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 font-display">
                    <MessageSquare className="h-5 w-5 text-violet-400" />
                    Class Messenger & Direct Messages
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    Real-time 1-on-1 direct messaging and classroom communications with students and faculty.
                  </p>
                </div>
              </div>

              <ClassMessenger
                currentUser={dbUser}
                mode="embedded"
                theme={theme}
                themeMode={themeMode}
              />
            </div>
          </motion.div>
        )}

        {/* TAB 7: SETTINGS */}
        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SettingsTab
              currentUser={dbUser}
              onLogout={onLogout}
              theme={theme}
              onThemeChange={onThemeChange}
              onProfileUpdated={loadDatabase}
            />
          </motion.div>
        )}

        {/* CREATE ANNOUNCEMENT MODAL */}
        <AnimatePresence>
          {showCreateAnnModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <div className="bg-cream border border-ink-soft/15 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-ink-soft/10 pb-3">
                  <h3 className="font-black text-base text-ink">New Course Announcement</h3>
                  <button onClick={() => setShowCreateAnnModal(false)}>
                    <X className="h-5 w-5 text-ink-soft" />
                  </button>
                </div>

                <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-ink-soft dark:text-slate-300">
                        Target Class Section
                      </label>
                      {teacherClasses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateAnnModal(false);
                            handleOpenBroadcastAnn();
                          }}
                          className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Layers className="h-3 w-3" />
                          <span>Broadcast to multiple sections</span>
                        </button>
                      )}
                    </div>
                    <select
                      value={annClassId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnnClassId(val);
                        const cls = teacherClasses.find((c) => c.id === val);
                        if (cls?.subject) setAnnSubject(cls.subject);
                      }}
                      className="w-full p-2.5 text-xs font-semibold bg-slate-900 border border-ink-soft/20 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                      {teacherClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          📚 Section: {c.name} {c.subject ? `(${c.subject})` : ""}
                        </option>
                      ))}
                      {teacherClasses.length > 1 && (
                        <option value="all_my_sections">
                          📢 All My Sections ({teacherClasses.length} sections)
                        </option>
                      )}
                    </select>
                  </div>

                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Announcement Title..."
                    required
                    className="w-full p-3 text-xs font-medium bg-slate-900 border border-ink-soft/20 rounded-xl text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <input
                    type="text"
                    value={annSubject}
                    onChange={(e) => setAnnSubject(e.target.value)}
                    placeholder="Subject Category (e.g. Computer Science)..."
                    className="w-full p-3 text-xs font-medium bg-slate-900 border border-ink-soft/20 rounded-xl text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <textarea
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Announcement details..."
                    rows={4}
                    required
                    className="w-full p-3 text-xs font-medium bg-slate-900 border border-ink-soft/20 rounded-xl text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                  />

                  {/* File / Photo Resource Attachment */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[11px] font-bold text-ink-soft">
                      Classroom Resource / Photo Attachment
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-violet-300 bg-violet-950/80 border border-violet-500/40 rounded-xl hover:bg-violet-900/80 cursor-pointer transition-colors">
                        <Paperclip className="h-4 w-4" />
                        <span>{annAttachmentName ? "Change Attachment" : "Attach File or Photo"}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                          onChange={handleAnnFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateMeetLink}
                        disabled={annGeneratingMeet}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 rounded-xl hover:bg-emerald-900/80 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait"
                      >
                        {annGeneratingMeet ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
                        <span>{annGeneratingMeet ? "Generating..." : "Generate Google Meet Link"}</span>
                      </button>
                      {annAttachmentName && (
                        <button
                          type="button"
                          onClick={() => {
                            setAnnAttachmentName("");
                            setAnnAttachmentDataUrl("");
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          title="Remove attachment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {annMeetError && (
                      <div className="mt-1.5 p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-start gap-1.5 text-xs font-semibold text-rose-300">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{annMeetError}</span>
                      </div>
                    )}
                    {annAttachmentName && (
                      <div className="mt-1.5 p-2.5 bg-violet-500/15 border border-violet-500/30 rounded-xl flex items-center justify-between text-xs font-bold text-violet-300">
                        <span className="truncate">📎 {annAttachmentName}</span>
                      </div>
                    )}
                    {annAttachmentDataUrl?.startsWith("data:image/") && (
                      <div className="mt-2 relative max-w-xs rounded-xl overflow-hidden border border-violet-500/30 shadow-md">
                        <img
                          src={annAttachmentDataUrl}
                          alt="Resource Preview"
                          className="max-h-36 w-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateAnnModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-extrabold text-white bg-violet-500 rounded-xl hover:bg-violet-600"
                    >
                      Publish Announcement
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CREATE ASSIGNMENT MODAL */}
        <AnimatePresence>
          {showCreateAssModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <div className="bg-cream border border-ink-soft/15 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-ink-soft/10 pb-3">
                  <h3 className="font-black text-base text-ink">New Assignment</h3>
                  <button onClick={() => setShowCreateAssModal(false)}>
                    <X className="h-5 w-5 text-ink-soft" />
                  </button>
                </div>

                <form onSubmit={handleCreateAssignment} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-ink-soft dark:text-slate-300 mb-1">
                      Target Class Section
                    </label>
                    <select
                      value={assClassId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAssClassId(val);
                        const cls = teacherClasses.find((c) => c.id === val);
                        if (cls?.subject) setAssSubject(cls.subject);
                      }}
                      className="w-full p-2.5 text-xs font-semibold bg-slate-900 border border-ink-soft/20 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                      {teacherClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          📚 Section: {c.name} {c.subject ? `(${c.subject})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-soft block mb-1">Assignment Title</label>
                    <input
                      type="text"
                      value={assTitle}
                      onChange={(e) => setAssTitle(e.target.value)}
                      placeholder="e.g. Chapter 4 Calculus Homework"
                      required
                      className="w-full p-3 text-xs font-semibold bg-slate-900 border border-ink-soft/20 rounded-xl text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-ink-soft block mb-1">Subject Tag</label>
                      <input
                        type="text"
                        value={assSubject}
                        onChange={(e) => setAssSubject(e.target.value)}
                        placeholder="e.g. Mathematics"
                        className="w-full p-2.5 text-xs bg-slate-900 border border-ink-soft/20 rounded-xl text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-soft block mb-1">Due Date</label>
                      <input
                        type="date"
                        value={assDueDate}
                        onChange={(e) => setAssDueDate(e.target.value)}
                        className="w-full p-2.5 text-xs bg-slate-900 border border-ink-soft/20 rounded-xl text-ink font-mono [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-soft block mb-1">Max Points</label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={assMaxPoints}
                        onChange={(e) => setAssMaxPoints(Number(e.target.value))}
                        className="w-full p-2.5 text-xs bg-slate-900 border border-ink-soft/20 rounded-xl text-ink font-mono font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-ink-soft block mb-1">Instructions & Guidelines</label>
                    <textarea
                      value={assContent}
                      onChange={(e) => setAssContent(e.target.value)}
                      placeholder="Detailed instructions for students..."
                      rows={4}
                      required
                      className="w-full p-3 text-xs bg-slate-900 border border-ink-soft/20 rounded-xl text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-soft block">Attach File / Reference Document (Optional)</label>
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-2 text-xs font-bold text-violet-300 bg-violet-950/80 border border-violet-500/40 rounded-xl hover:bg-violet-900/80 cursor-pointer flex items-center gap-1.5 transition-all">
                        <Paperclip className="h-4 w-4" />
                        <span>{assAttachmentName ? "Change File" : "Choose File"}</span>
                        <input type="file" onChange={handleAssFileChange} className="hidden" />
                      </label>
                      {assAttachmentName && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                          <Paperclip className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{assAttachmentName}</span>
                          <button
                            type="button"
                            onClick={() => { setAssAttachmentName(""); setAssAttachmentDataUrl(""); }}
                            className="text-emerald-300 hover:text-rose-400 ml-1 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-ink-soft/10">
                    <button
                      type="button"
                      onClick={() => setShowCreateAssModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-extrabold text-white bg-violet-500 rounded-xl hover:bg-violet-600 shadow-md shadow-violet-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" /> Publish Assignment
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GRADING SUBMISSIONS MODAL */}
        <AnimatePresence>
          {selectedAssignmentForGrading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-cream border border-ink-soft/15 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl my-8">
                <div className="flex justify-between items-center border-b border-ink-soft/10 pb-3">
                  <div>
                    <h3 className="font-black text-base text-ink">
                      Submissions: {selectedAssignmentForGrading.title}
                    </h3>
                  </div>
                  <button onClick={() => setSelectedAssignmentForGrading(null)}>
                    <X className="h-5 w-5 text-ink-soft" />
                  </button>
                </div>

                {assignmentSubmissions.length === 0 ? (
                  <p className="text-xs text-ink-soft/60 italic p-6 text-center">
                    No student submissions received yet for this assignment.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {assignmentSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 bg-slate-950/40 border border-ink-soft/15 rounded-2xl space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-ink">
                          <span>{sub.studentName}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded-full border ${
                              sub.status === "Graded"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {sub.status === "Graded" ? `Graded (${sub.score})` : "Pending Grade"}
                          </span>
                        </div>

                        <p className="text-ink-soft bg-slate-900/80 border border-ink-soft/10 p-3 rounded-xl whitespace-pre-wrap font-sans">
                          {sub.content
                            ? linkifyText(sub.content, {
                                linkClassName:
                                  "font-semibold text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/50 underline-offset-2 break-all",
                              })
                            : "No text provided"}
                        </p>

                        {sub.attachmentDataUrl && (
                          sub.attachmentDataUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(sub.attachmentName || "") ? (
                            <div className="mt-2 rounded-xl overflow-hidden border border-ink-soft/20 bg-slate-900">
                              <img
                                src={sub.attachmentDataUrl}
                                alt={sub.attachmentName || "Student submission photo"}
                                className="max-h-48 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(sub.attachmentDataUrl, "_blank")}
                              />
                              <div className="p-2 flex items-center justify-between text-[11px] font-bold">
                                <span className="truncate text-ink-soft flex items-center gap-1">
                                  <ImageIcon className="h-3.5 w-3.5 text-violet-400" />
                                  {sub.attachmentName || "Student Attached Photo"}
                                </span>
                                <a
                                  href={sub.attachmentDataUrl}
                                  download={sub.attachmentName || "submission.png"}
                                  className="text-violet-400 hover:text-violet-300 underline shrink-0 ml-2 flex items-center gap-1"
                                >
                                  <Download className="h-3 w-3" /> Download
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-slate-900 border border-ink-soft/20 rounded-xl flex items-center justify-between">
                              <span className="text-xs font-semibold text-ink truncate flex items-center gap-1.5">
                                <Paperclip className="h-3.5 w-3.5 text-violet-400" />
                                {sub.attachmentName || "Student Attached File"}
                              </span>
                              <a
                                href={sub.attachmentDataUrl}
                                download={sub.attachmentName || "student-file"}
                                className="px-2.5 py-1 text-[11px] font-bold text-violet-300 bg-violet-500/20 border border-violet-500/40 rounded-lg hover:bg-violet-500/30 transition-all shrink-0 flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" /> Download
                              </a>
                            </div>
                          )
                        )}

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => handleStartGrade(sub)}
                            className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-violet-500 hover:bg-violet-600 rounded-xl cursor-pointer"
                          >
                            {sub.status === "Graded" ? "Update Grade" : "Grade Submission"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GRADE INPUT SUB-MODAL */}
        <AnimatePresence>
          {gradingSubmission && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            >
              <div className="bg-cream border border-ink-soft/15 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-ink-soft/10 pb-3">
                  <h3 className="font-black text-sm text-ink">
                    Grade {gradingSubmission.studentName}
                  </h3>
                  <button onClick={() => setGradingSubmission(null)}>
                    <X className="h-5 w-5 text-ink-soft" />
                  </button>
                </div>

                <form onSubmit={handleSaveGrade} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-ink-soft block mb-1">
                      Score (out of {selectedAssignmentForGrading?.maxPoints || 100}):
                    </label>
                    <input
                      type="text"
                      value={gradeInputScore}
                      onChange={(e) => setGradeInputScore(e.target.value)}
                      placeholder="e.g. 95"
                      required
                      className="w-full p-2.5 text-xs bg-slate-900 border border-ink-soft/20 rounded-xl text-ink font-mono font-bold focus:outline-none focus:border-violet-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink-soft block mb-1">
                      Teacher Feedback Note:
                    </label>
                    <textarea
                      value={gradeInputFeedback}
                      onChange={(e) => setGradeInputFeedback(e.target.value)}
                      placeholder="Great job! Excellent problem analysis..."
                      rows={3}
                      className="w-full p-2.5 text-xs bg-slate-900 border border-ink-soft/20 rounded-xl text-ink resize-none focus:outline-none focus:border-violet-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setGradingSubmission(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
                    >
                      Save Grade
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ADD TEACHER MODAL */}
        <AnimatePresence>
          {showAddTeacherModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-violet-400" />
                    <h3 className="font-extrabold text-base text-white">Add New Teacher Account</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddTeacherModal(false);
                      setAddTeacherError(null);
                    }}
                  >
                    <X className="h-5 w-5 text-slate-400 hover:text-white" />
                  </button>
                </div>

                {addTeacherError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{addTeacherError}</span>
                  </div>
                )}

                <form onSubmit={handleAddTeacherSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Teacher ID / Username <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTeacherId}
                      onChange={(e) => setNewTeacherId(e.target.value)}
                      placeholder="e.g. teacher4 or prof_smith"
                      required
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-violet-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      placeholder="e.g. Dr. Eleanor Vance"
                      required
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-violet-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                      placeholder="e.g. teacher123"
                      required
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-violet-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Subject(s) / Specialization(s)</label>
                    <input
                      type="text"
                      value={newTeacherSubject}
                      onChange={(e) => setNewTeacherSubject(e.target.value)}
                      placeholder="e.g. Mathematics, Computer Science, Physics"
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-violet-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">For multiple subjects, separate with commas (e.g. DCPE, DCS, Computer Engineering).</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      placeholder="e.g. eleanor.vance@school.edu"
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-violet-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTeacherModal(false);
                        setAddTeacherError(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-600/30 cursor-pointer"
                    >
                      Create Teacher Account
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EDIT TEACHER MODAL */}
        <AnimatePresence>
          {teacherToEdit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Edit className="h-5 w-5 text-violet-400" />
                    <h3 className="font-extrabold text-base text-white">Edit Faculty Details</h3>
                  </div>
                  <button onClick={() => setTeacherToEdit(null)}>
                    <X className="h-5 w-5 text-slate-400 hover:text-white" />
                  </button>
                </div>

                <form onSubmit={handleSaveTeacherEdit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editTeacherName}
                      onChange={(e) => setEditTeacherName(e.target.value)}
                      required
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-violet-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Subject(s) / Specialization(s)</label>
                    <input
                      type="text"
                      value={editTeacherSubject}
                      onChange={(e) => setEditTeacherSubject(e.target.value)}
                      placeholder="e.g. Mathematics, Computer Science, Physics"
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-violet-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Separate multiple subjects with commas.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editTeacherEmail}
                      onChange={(e) => setEditTeacherEmail(e.target.value)}
                      placeholder="teacher@school.edu"
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-violet-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTeacherToEdit(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-600/30 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deleting a teacher account from here has been removed - see the
            note by the Teachers list above for why. Teachers remove their
            own account from Settings instead. */}

        {/* CONFIRM TEACHER VERIFY / REVOKE ACTION WITH PASSWORD MODAL */}
        <AnimatePresence>
          {pendingTeacherAction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert
                      className={`h-5 w-5 ${
                        pendingTeacherAction.action === "verify" ? "text-teal-400" : "text-amber-400"
                      }`}
                    />
                    <h3 className="font-extrabold text-base text-white">
                      {pendingTeacherAction.action === "verify" ? "Verify Teacher Account" : "Revoke Teacher Verification"}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setPendingTeacherAction(null);
                      setActionPassword("");
                      setActionPasswordError(null);
                    }}
                  >
                    <X className="h-5 w-5 text-slate-400 hover:text-white" />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Are you sure you want to{" "}
                    <strong
                      className={
                        pendingTeacherAction.action === "verify"
                          ? "text-teal-300 font-extrabold"
                          : "text-amber-300 font-extrabold"
                      }
                    >
                      {pendingTeacherAction.action === "verify"
                        ? "verify and grant official status to"
                        : "revoke verification for"}
                    </strong>{" "}
                    <span className="text-white font-extrabold">{pendingTeacherAction.teacher.name}</span> (ID:{" "}
                    <span className="font-mono text-slate-300">{pendingTeacherAction.teacher.id}</span>)?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    For security verification, please enter your password to authorize this action.
                  </p>
                </div>

                {actionPasswordError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{actionPasswordError}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmTeacherAction} className="space-y-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Your Account Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={actionPassword}
                      onChange={(e) => {
                        setActionPassword(e.target.value);
                        setActionPasswordError(null);
                      }}
                      placeholder="Enter your password..."
                      required
                      autoFocus
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-violet-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingTeacherAction(null);
                        setActionPassword("");
                        setActionPasswordError(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifyingPassword}
                      className={`px-5 py-2 text-xs font-extrabold text-white rounded-xl shadow-lg cursor-pointer flex items-center gap-2 ${
                        pendingTeacherAction.action === "verify"
                          ? "bg-teal-600 hover:bg-teal-500 shadow-teal-600/30"
                          : "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                      }`}
                    >
                      {isVerifyingPassword ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verifying...
                        </>
                      ) : pendingTeacherAction.action === "verify" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Confirm & Verify Teacher
                        </>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5" /> Confirm & Revoke Verification
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* CREATE CLASS SECTION MODAL */}
          {showCreateSectionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <School className="h-5 w-5 text-violet-400" />
                    <h3 className="font-extrabold text-base text-white">Create New Class Section</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateSectionModal(false);
                      setCreateSectionError(null);
                    }}
                  >
                    <X className="h-5 w-5 text-slate-400 hover:text-white" />
                  </button>
                </div>

                <div className="space-y-4">
                  {createSectionError && (
                    <div className="p-3 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{createSectionError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Section Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Grade 10 - Section Alpha"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Course / Subject Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Algebra & Geometry (Optional)"
                      value={newSectionSubject}
                      onChange={(e) => setNewSectionSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Once created, a unique 6-character Join Code will automatically be generated for this section so your students can enroll directly!
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateSectionModal(false);
                      setCreateSectionError(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSection}
                    className="px-5 py-2 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Section</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ADD STUDENT MODAL */}
        <AnimatePresence>
          {showAddStudentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-fuchsia-400" />
                    <h3 className="font-extrabold text-base text-white">Add New Student Account</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddStudentModal(false);
                      setAddStudentError(null);
                    }}
                  >
                    <X className="h-5 w-5 text-slate-400 hover:text-white" />
                  </button>
                </div>

                {addStudentError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{addStudentError}</span>
                  </div>
                )}

                <form onSubmit={handleAddStudentSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Student ID / Username <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      placeholder="e.g. student101 or alex_r"
                      required
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-fuchsia-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      required
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-fuchsia-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                      placeholder="At least 6 characters (e.g. pass123)"
                      required
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-fuchsia-400 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Firebase Auth requires passwords to be at least 6 characters long.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Assign to Course Section (Optional)
                    </label>
                    <select
                      value={addStudentClassId}
                      onChange={(e) => setAddStudentClassId(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-fuchsia-400 focus:outline-none"
                    >
                      <option value="none">None (Unassigned / General Roster)</option>
                      {teacherClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} {cls.subject ? `(${cls.subject})` : ""} - Code: {cls.joinCode}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddStudentModal(false);
                        setAddStudentError(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingStudent}
                      className="px-5 py-2 text-xs font-extrabold text-white bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl shadow-lg shadow-fuchsia-600/30 cursor-pointer flex items-center gap-1.5"
                    >
                      {isCreatingStudent ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Creating Account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" /> Create Student Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EDIT STUDENT MODAL */}
        <AnimatePresence>
          {studentToEdit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Edit className="h-5 w-5 text-fuchsia-400" />
                    <h3 className="font-extrabold text-base text-white">Edit Student Details</h3>
                  </div>
                  <button onClick={() => setStudentToEdit(null)}>
                    <X className="h-5 w-5 text-slate-400 hover:text-white" />
                  </button>
                </div>

                <form onSubmit={handleSaveStudentEdit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editStudentName}
                      onChange={(e) => setEditStudentName(e.target.value)}
                      required
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-fuchsia-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editStudentEmail}
                      onChange={(e) => setEditStudentEmail(e.target.value)}
                      placeholder="student@school.edu"
                      className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-fuchsia-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStudentToEdit(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-extrabold text-white bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl shadow-lg shadow-fuchsia-600/30 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REMOVE STUDENT FROM CLASS MODAL */}
        <AnimatePresence>
          {studentToRemove && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <UserMinus className="h-5 w-5" />
                    <h3 className="font-extrabold text-base">Remove Student from Class</h3>
                  </div>
                  <button onClick={() => setStudentToRemove(null)} className="cursor-pointer">
                    <X className="h-5 w-5 text-slate-400 hover:text-white" />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-200 leading-relaxed">
                    Are you sure you want to remove{" "}
                    <strong className="text-white">{studentToRemove.name}</strong> ({studentToRemove.id}) from{" "}
                    <strong className="text-amber-300">{selectedClass?.name || "this class"}</strong>?
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    The student&apos;s account will remain active in the system. They will simply be removed from this class section and will not lose their other enrolled classes or profile data.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStudentToRemove(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRemoveStudent}
                    className="px-5 py-2 text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-600/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <UserMinus className="h-4 w-4" />
                    <span>Remove from Class</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BLOCK STUDENT FROM CLASS MODAL */}
        <AnimatePresence>
          {studentToBlock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Ban className="h-5 w-5" />
                    <h3 className="font-extrabold text-base">Block Student from Section</h3>
                  </div>
                  <button onClick={() => setStudentToBlock(null)} className="cursor-pointer">
                    <X className="h-5 w-5 text-slate-400 hover:text-white" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-slate-200 leading-relaxed">
                    Are you sure you want to block{" "}
                    <strong className="text-white">{studentToBlock.name}</strong> ({studentToBlock.id}) from{" "}
                    <strong className="text-rose-300">{selectedClass?.name || "this class"}</strong>?
                  </p>
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                      Rejoining Barred
                    </p>
                    <p className="text-[11px] text-rose-300/90 leading-relaxed">
                      This kicks the student from this section and adds them to this class&apos;s block list. Even if they have the join code ({selectedClass?.joinCode}), they will be barred from re-entering until you explicitly unblock them.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStudentToBlock(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBlockStudent}
                    className="px-5 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <Ban className="h-4 w-4" />
                    <span>Confirm & Block Student</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MULTI-SECTION ANNOUNCEMENT BROADCAST MODAL (SAFETY-FIRST TWO-STEP FLOW) */}
        <AnimatePresence>
          {showBroadcastAnnModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-slate-900 border border-violet-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-white my-8">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-violet-400">
                    <Layers className="h-5 w-5" />
                    <h3 className="font-extrabold text-base text-white">Broadcast Announcement to Sections</h3>
                  </div>
                  <button
                    onClick={() => setShowBroadcastAnnModal(false)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Safety Step 1: Explicit Section or Target Audience Selection */}
                {broadcastAnnStep === "select" && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Announcement Title
                      </label>
                      <input
                        type="text"
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="Announcement Title..."
                        className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-violet-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Subject Tag
                      </label>
                      <input
                        type="text"
                        value={annSubject}
                        onChange={(e) => setAnnSubject(e.target.value)}
                        placeholder="e.g. School-wide / Mathematics..."
                        className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-violet-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Announcement Content <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        value={annContent}
                        onChange={(e) => setAnnContent(e.target.value)}
                        placeholder="Write your announcement details here..."
                        rows={4}
                        className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-violet-400 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Audience Scope Selector */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="text-xs font-bold text-slate-200">
                        Choose Broadcast Audience:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBroadcastAudience("sections")}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            broadcastAudience === "sections"
                              ? "bg-violet-950/80 border-violet-500 text-white shadow-md shadow-violet-950/50"
                              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-violet-400" />
                            <span className="text-xs font-bold text-white">Specific Sections</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Pick from your classes</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBroadcastAudience("students")}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            broadcastAudience === "students"
                              ? "bg-emerald-950/80 border-emerald-500 text-white shadow-md shadow-emerald-950/50"
                              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-xs font-bold text-white">All Students</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Even students with 0 classes</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBroadcastAudience("all")}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            broadcastAudience === "all"
                              ? "bg-cyan-950/80 border-cyan-500 text-white shadow-md shadow-cyan-950/50"
                              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="text-xs font-bold text-white">Campus-Wide</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Students + Teachers</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBroadcastAudience("teachers")}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            broadcastAudience === "teachers"
                              ? "bg-amber-950/80 border-amber-500 text-white shadow-md shadow-amber-950/50"
                              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <School className="h-3.5 w-3.5 text-amber-400" />
                            <span className="text-xs font-bold text-white">Faculty Only</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">All faculty & teachers</p>
                        </button>
                      </div>
                    </div>

                    {/* If Audience is Sections, show deliberate checkboxes */}
                    {broadcastAudience === "sections" ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200">
                            Select Target Sections ({broadcastAnnSelectedIds.length} of {teacherClasses.length} selected)
                          </label>
                          <div className="flex items-center gap-2 text-[11px]">
                            <button
                              type="button"
                              onClick={handleSelectAllBroadcastAnn}
                              className="text-violet-400 hover:text-violet-300 underline font-semibold cursor-pointer"
                            >
                              Select All
                            </button>
                            <span className="text-slate-600">&bull;</span>
                            <button
                              type="button"
                              onClick={handleClearAllBroadcastAnn}
                              className="text-slate-400 hover:text-white underline font-semibold cursor-pointer"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {teacherClasses.map((cls) => {
                            const isChecked = broadcastAnnSelectedIds.includes(cls.id);
                            return (
                              <label
                                key={cls.id}
                                onClick={() => handleToggleBroadcastAnnSection(cls.id)}
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                  isChecked
                                    ? "bg-violet-950/60 border-violet-500/50 text-white"
                                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                      isChecked
                                        ? "bg-violet-600 border-violet-500 text-white"
                                        : "border-slate-600 bg-slate-900"
                                    }`}
                                  >
                                    {isChecked && <Check className="h-3 w-3" />}
                                  </div>
                                  <div className="truncate">
                                    <p className="font-bold text-xs truncate">{cls.name}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {cls.subject || "General"} &bull; {cls.studentIds.length} students &bull; Code: {cls.joinCode}
                                    </p>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                          <Info className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                          <span>Select one or more sections. You will review the target list before publishing.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="text-slate-300 text-xs leading-relaxed">
                            {broadcastAudience === "students" && (
                              <p>
                                <strong className="text-white">School-Wide Student Broadcast:</strong> Every student will see this announcement, including those who do not belong to any class yet. Perfect for sharing join codes and general notices!
                              </p>
                            )}
                            {broadcastAudience === "all" && (
                              <p>
                                <strong className="text-white">Campus-Wide Broadcast:</strong> Published to every student and teacher across all departments and years.
                              </p>
                            )}
                            {broadcastAudience === "teachers" && (
                              <p>
                                <strong className="text-white">Faculty-Only Notice:</strong> Sent directly to teachers and staff in the Faculty Directory.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Attach Class Join Code Dropdown */}
                        {teacherClasses.length > 0 && broadcastAudience !== "teachers" && (
                          <div>
                            <label className="text-[11px] font-bold text-slate-300 block mb-1">
                              Attach Class Join Code for Instant Enrollment (Optional):
                            </label>
                            <select
                              value={broadcastAttachCodeClassId}
                              onChange={(e) => setBroadcastAttachCodeClassId(e.target.value)}
                              className="w-full p-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-teal-400 focus:outline-none"
                            >
                              <option value="">Do not attach a join code</option>
                              {teacherClasses.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.name} (Code: {cls.joinCode} - {cls.subject || "General"})
                                </option>
                              ))}
                            </select>
                            {broadcastAttachCodeClassId && (
                              <p className="text-[10px] text-teal-300 mt-1">
                                Students will see an instant "Join Class" button directly on this announcement.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowBroadcastAnnModal(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={
                          !annContent.trim() ||
                          (broadcastAudience === "sections" && broadcastAnnSelectedIds.length === 0)
                        }
                        onClick={() => setBroadcastAnnStep("confirm")}
                        className="px-5 py-2 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-violet-600/30 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Next: Review & Confirm</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Safety Step 2: Confirmation Summary Step */}
                {broadcastAnnStep === "confirm" && (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-violet-400 font-extrabold text-sm">
                          <Layers className="h-4 w-4 shrink-0" />
                          <span>Confirm Target Audience</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                          {broadcastAudience === "sections"
                            ? `${broadcastAnnSelectedIds.length} sections`
                            : broadcastAudience === "students"
                            ? "All Students"
                            : broadcastAudience === "teachers"
                            ? "Faculty Only"
                            : "Campus-Wide"}
                        </span>
                      </div>

                      {broadcastAudience === "sections" ? (
                        <>
                          <p className="text-slate-300 text-xs">
                            Your announcement will be broadcasted to these class feeds:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                            {broadcastAnnSelectedIds.map((id) => {
                              const cls = teacherClasses.find((c) => c.id === id);
                              return (
                                <div key={id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-bold text-white text-xs truncate">{cls?.name || id}</p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                      {cls?.subject || "General"} &bull; {cls?.studentIds.length || 0} students
                                    </p>
                                  </div>
                                  <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                          <p className="text-white font-bold text-xs">
                            {broadcastAudience === "students" && "📢 Reaching ALL students across the institution (including those with 0 classes)"}
                            {broadcastAudience === "all" && "🌐 Campus-wide announcement reaching all students and faculty"}
                            {broadcastAudience === "teachers" && "🏫 Reaching all registered teachers and faculty members"}
                          </p>
                          {broadcastAttachCodeClassId && (
                            <div className="pt-1 flex items-center gap-2 flex-wrap">
                              <span className="text-slate-300 text-xs font-semibold">Attached Join Code:</span>
                              <JoinCodePill
                                code={teacherClasses.find((c) => c.id === broadcastAttachCodeClassId)?.joinCode || ""}
                                className={teacherClasses.find((c) => c.id === broadcastAttachCodeClassId)?.name}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <p className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Announcement Preview</p>
                      <p className="font-bold text-white text-xs">{annTitle.trim() || "Announcement"}</p>
                      <div className="text-slate-300 text-xs leading-relaxed">
                        {linkifyText(annContent)}
                        {broadcastAttachCodeClassId && !hasJoinCode(annContent, teacherClasses.find((c) => c.id === broadcastAttachCodeClassId)?.joinCode) && (
                          <div className="mt-2">
                            <JoinCodePill
                              code={teacherClasses.find((c) => c.id === broadcastAttachCodeClassId)?.joinCode || ""}
                              className={teacherClasses.find((c) => c.id === broadcastAttachCodeClassId)?.name}
                            />
                          </div>
                        )}
                      </div>
                      {annAttachmentName && (
                        <p className="text-[11px] text-cyan-300 font-semibold pt-1">
                          📎 Attached: {annAttachmentName}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setBroadcastAnnStep("select")}
                        className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
                      >
                        Back to Edit
                      </button>
                      <button
                        type="button"
                        disabled={broadcastAnnPosting}
                        onClick={handleConfirmBroadcastAnn}
                        className="px-5 py-2 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-60 rounded-xl shadow-lg shadow-violet-600/30 cursor-pointer flex items-center gap-1.5"
                      >
                        {broadcastAnnPosting ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Broadcasting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>
                              {broadcastAudience === "sections"
                                ? `Confirm & Send to ${broadcastAnnSelectedIds.length} Sections`
                                : broadcastAudience === "students"
                                ? "Confirm & Send to All Students"
                                : broadcastAudience === "teachers"
                                ? "Confirm & Send to All Faculty"
                                : "Confirm & Send Campus-Wide"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VIEW STUDENT PROFILE SECTION */}
        {viewingStudent && (
          <div className="pt-8 mt-10 border-t border-slate-700/60">
            <StudentProfile student={viewingStudent} onClose={() => setViewingStudent(null)} />
          </div>
        )}

        {/* VIEW TEACHER PROFILE SECTION */}
        {viewingTeacherProfile && (
          <div className="pt-8 mt-10 border-t border-slate-700/60">
            <TeacherProfile
              teacher={viewingTeacherProfile}
              currentUser={dbUser}
              onClose={() => setViewingTeacherProfile(null)}
              onVerifyToggle={(t) => {
                setPendingTeacherAction({
                  teacher: t,
                  action: t.isApproved ? "revoke" : "verify",
                });
                setActionPassword("");
                setActionPasswordError(null);
              }}
              onEdit={(t) => {
                setTeacherToEdit(t);
                setEditTeacherName(t.name);
                setEditTeacherSubject(t.subject || "");
                setEditTeacherEmail(t.email || "");
              }}
              onSelectStudent={(s) => setViewingStudent(s)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
