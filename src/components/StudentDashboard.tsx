import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Settings as SettingsIcon,
  MessageSquare,
  ClipboardList,
  BookOpen,
  Megaphone,
  FileText,
  Upload,
  Paperclip,
  Send,
  Search,
  CheckCircle2,
  Award,
  Key,
  X,
  Eye,
  UserCheck,
  Palette,
  TrendingUp,
  Moon,
  Sun,
  Image as ImageIcon,
  GraduationCap,
  MapPin,
  Mail,
  School,
  Download,
  Users,
  Globe,
  Copy,
  Check,
  Plus
} from "lucide-react";
import { User, AttendanceRecord, AttendanceStatus, StudentStats, ClassPost, PostComment, AssignmentSubmission, ClassRoom } from "../types";
import type { AppTheme, AppThemeMode } from "../App";
import { linkifyText, hasJoinCode } from "../lib/linkify";
import { processFileUpload } from "../lib/fileUtils";
import AnimatedThemeBackground from "./AnimatedThemeBackground";
import SettingsTab from "./SettingsTab";
import UserAvatar from "./UserAvatar";
import StudentProfile from "./StudentProfile";
import TeacherProfile from "./TeacherProfile";
import PostCommentsSection from "./PostCommentsSection";
import DailyCheckinsTab from "./DailyCheckinsTab";
import Classroom from "./Classroom";
import ClassMessenger, { openDirectMessage } from "./ClassMessenger";
import JoinCodePill from "./JoinCodePill";
import {
  getUsers,
  getAttendanceRecords,
  recordTodayAttendance,
  calculateStudentStats,
  formatDate,
  deleteOwnAccount,
  changeOwnPassword,
  forceReconnect,
  getAnnouncements,
  getAssignments,
  getCommentsForPost,
  addComment,
  getSubmissionForStudent,
  submitAssignment,
  getUnreadDirectMessagesCount,
  getClassesForStudent,
  joinClassByCode,
  getClasses,
} from "../lib/db";

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  themeMode?: AppThemeMode;
  onThemeModeChange?: (mode: AppThemeMode) => void;
}

export default function StudentDashboard({
  user,
  onLogout,
  theme,
  onThemeChange,
  themeMode = "night",
  onThemeModeChange,
}: StudentDashboardProps) {
  // DB & State
  const [dbUser, setDbUser] = useState<User>(user);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    totalDays: 0,
    percentage: 100,
  });

  const [activeTab, setActiveTab] = useState<"classes" | "attendance" | "checkins" | "announcements" | "assignments" | "faculty" | "messenger" | "settings">("classes");
  const [unreadMessengerCount, setUnreadMessengerCount] = useState<number>(0);
  const [messengerPartnerId, setMessengerPartnerId] = useState<string | null>(null);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [viewingStudent, setViewingStudent] = useState<User | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<User | null>(null);

  // Teacher Filter & Selector state
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  // Daily attendance state
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>("Present");
  const [notes, setNotes] = useState("");
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Announcements state
  const [announcements, setAnnouncements] = useState<ClassPost[]>([]);
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [enrolledClasses, setEnrolledClasses] = useState<ClassRoom[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [joinSuccessMsg, setJoinSuccessMsg] = useState<string | null>(null);
  const [joinErrorMsg, setJoinErrorMsg] = useState<string | null>(null);

  // Assignments state
  const [assignments, setAssignments] = useState<ClassPost[]>([]);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<"All" | "Pending" | "Submitted" | "Graded">("All");
  const [selectedAssignmentForSubmission, setSelectedAssignmentForSubmission] = useState<ClassPost | null>(null);
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, AssignmentSubmission | undefined>>({});

  // Submission Form State
  const [submissionText, setSubmissionText] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentDataUrl, setAttachmentDataUrl] = useState("");
  const [submissionFileError, setSubmissionFileError] = useState("");
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Profile & Settings modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [editEmailValue, setEditEmailValue] = useState("");
  const [editLocationValue, setEditLocationValue] = useState("");

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);

  const todayStr = formatDate(new Date());

  const loadData = () => {
    const allUsers = getUsers();

    // "Classmates" = students who share at least one class with me. Used to
    // scope the Daily Check-ins tab so a brand-new student can't browse
    // every other student in the entire school right after signing up -
    // only people actually in one of their classes.
    const myClasses = getClassesForStudent(user.id);
    const classmateIds = new Set(
      myClasses.flatMap((c) => c.studentIds.map((id) => id.toLowerCase()))
    );
    classmateIds.add(user.id.toLowerCase());
    setAllStudents(allUsers.filter((u) => u.role === "student" && classmateIds.has(u.id.toLowerCase())));

    const freshUser = allUsers.find((u) => u.id.toLowerCase() === user.id.toLowerCase());
    if (freshUser) {
      setDbUser(freshUser);
    }

    // Attendance
    const allRecords = getAttendanceRecords();
    setAllAttendanceRecords(allRecords.filter((r) => classmateIds.has(r.studentId.toLowerCase())));
    const studentRecords = allRecords
      .filter((r) => r.studentId.toLowerCase() === user.id.toLowerCase())
      .sort((a, b) => b.date.localeCompare(a.date));

    setHistory(studentRecords);

    const logToday = studentRecords.find((r) => r.date === todayStr);
    if (logToday) {
      setTodayRecord(logToday);
      setSelectedStatus(logToday.status);
      setNotes(logToday.notes || "");
    } else {
      setTodayRecord(null);
    }

    const calculatedStats = calculateStudentStats(user.id);
    setStats(calculatedStats);

    // Announcements, Assignments & Faculty directory.
    // Scoped to classes I'm actually enrolled in - not the entire school's
    // announcements/assignments/teacher directory. A post is mine to see if
    // it targets one of my actual classes, or it's a no-class/legacy post
    // from one of my actual teachers.
    // CRITICAL FIX: Campus-wide and All-Students broadcasts are visible to ANY student,
    // including students with 0 classes, so they can see class join codes and announcements!
    setEnrolledClasses(myClasses);
    const myTeacherIds = new Set(myClasses.map((c) => c.teacherId.toLowerCase()));
    const myClassIds = new Set(myClasses.map((c) => c.id));

    const isMyAnnouncement = (p: ClassPost) => {
      // 1. Campus-wide or All-Student broadcasts: any student can see them!
      if (
        p.targetAudience === "all" ||
        p.targetAudience === "students" ||
        p.classId === "all" ||
        p.classId === "all_students" ||
        p.classId === "global"
      ) {
        return true;
      }
      // 2. Class section specific: student must be enrolled
      if (p.classId && myClassIds.has(p.classId)) {
        return true;
      }
      // 3. Fallback for teacher's general announcements
      const authorId = (p.authorId || "").toLowerCase();
      if (myTeacherIds.has(authorId) && (!p.classId || p.classId === "all")) {
        return true;
      }
      return false;
    };

    const isMyAssignment = (p: ClassPost) => {
      if (p.classId && myClassIds.has(p.classId)) return true;
      const authorId = (p.authorId || "").toLowerCase();
      if (myTeacherIds.has(authorId) && !p.classId) return true;
      return false;
    };

    const ann = getAnnouncements().filter(isMyAnnouncement);
    setAnnouncements(ann);

    const ass = getAssignments().filter(isMyAssignment);
    setAssignments(ass);

    // Load Teachers - teachers of my classes PLUS teachers who have published school-wide announcements
    const broadcastTeacherIds = new Set(
      getAnnouncements()
        .filter((p) => p.targetAudience === "all" || p.targetAudience === "students" || p.classId === "all" || p.classId === "all_students")
        .map((p) => (p.authorId || "").toLowerCase())
    );
    const teacherUsers = allUsers.filter(
      (u) => u.role === "teacher" && (myTeacherIds.has(u.id.toLowerCase()) || broadcastTeacherIds.has(u.id.toLowerCase()))
    );
    const teacherMap = new Map<string, User>();
    teacherUsers.forEach((t) => {
      const key = (t.id || t.uid || "").toLowerCase();
      if (key) teacherMap.set(key, t);
    });

    const posts = [...ann, ...ass];
    posts.forEach((p) => {
      const key = (p.authorId || "").toLowerCase();
      if (key && !teacherMap.has(key)) {
        teacherMap.set(key, {
          id: p.authorId,
          name: p.authorName || "Teacher",
          role: "teacher",
          createdAt: p.createdAt,
          subject: p.subject || "General Education",
        });
      }
    });

    setTeachers(Array.from(teacherMap.values()));

    // Map student submissions
    const subMap: Record<string, AssignmentSubmission | undefined> = {};
    ass.forEach((post) => {
      subMap[post.id] = getSubmissionForStudent(post.id, user.id);
    });
    setSubmissionsMap(subMap);

    // Unread direct messages
    setUnreadMessengerCount(getUnreadDirectMessagesCount(user.id));
  };

  useEffect(() => {
    loadData();
    const handleDbUpdate = () => {
      loadData();
    };
    const handleOpenMessenger = (e: any) => {
      const partnerId = e.detail?.partnerId;
      if (partnerId) {
        setMessengerPartnerId(partnerId);
      }
      setViewingStudent(null);
      setViewingTeacher(null);
      setSelectedAssignmentForSubmission(null);
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

  // There is no "All Teachers & Classes" pseudo-view anymore - the Faculty
  // tab always shows one specific teacher you actually have a class with.
  // If nothing is selected yet, or the selection goes stale (e.g. that
  // class ended), fall back to the first teacher on the list.
  useEffect(() => {
    if (teachers.length === 0) {
      if (selectedTeacherId !== "") setSelectedTeacherId("");
      return;
    }
    const stillValid = teachers.some(
      (t) => (t.id || "").toLowerCase() === selectedTeacherId.toLowerCase() || (t.uid || "").toLowerCase() === selectedTeacherId.toLowerCase()
    );
    if (!stillValid) {
      setSelectedTeacherId(teachers[0].id || teachers[0].uid || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachers]);

  // Attendance submit
  const handleRecordAttendance = (e: React.FormEvent) => {
    e.preventDefault();

    const customSubjectTag = selectedTeacher ? selectedTeacher.subject || selectedTeacher.name : undefined;

    const record = recordTodayAttendance(
      user.id,
      user.name,
      selectedStatus,
      notes.trim() || undefined,
      undefined,
      customSubjectTag
    );
    setTodayRecord(record);
    setShowCelebration(true);
    setSuccessMsg(`Attendance logged as ${selectedStatus}${customSubjectTag ? ` (${customSubjectTag})` : ""}!`);
    loadData();

    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  // Handle file attachment upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmissionFileError("");
    try {
      // Same helper Classroom.tsx uses for post/submission attachments:
      // compresses images and enforces an 800KB cap on non-image files.
      // This modal previously did its own raw FileReader read with only a
      // 3MB *pre-encoding* size check - base64 inflates a file by ~33%, so
      // anything over ~750KB was already silently exceeding Firestore's
      // 1MiB per-document limit. The write would fail in the background
      // (only logged to console), while the student's local cache still
      // showed "Assignment submitted successfully!" - so the file (and
      // sometimes the whole submission) never actually reached the
      // teacher. Routing through processFileUpload() fixes that at the
      // source instead of just raising the raw-size ceiling.
      const processed = await processFileUpload(file);
      setAttachmentName(processed.name);
      setAttachmentDataUrl(processed.dataUrl);
    } catch (err: any) {
      setSubmissionFileError(err?.message || "File too large. Try a smaller file.");
      setAttachmentName("");
      setAttachmentDataUrl("");
    } finally {
      e.target.value = "";
    }
  };

  // Open submission modal
  const handleOpenSubmissionModal = (assignment: ClassPost) => {
    setSelectedAssignmentForSubmission(assignment);
    setSubmissionFileError("");
    const existing = submissionsMap[assignment.id];
    if (existing) {
      setSubmissionText(existing.content || "");
      setAttachmentName(existing.attachmentName || "");
      setAttachmentDataUrl(existing.attachmentDataUrl || "");
    } else {
      setSubmissionText("");
      setAttachmentName("");
      setAttachmentDataUrl("");
    }
    setSubmissionSuccess(null);
  };

  // Submit assignment work
  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForSubmission) return;

    setIsSubmittingWork(true);
    setSubmissionFileError(null);

    try {
      submitAssignment({
        postId: selectedAssignmentForSubmission.id,
        studentId: user.id,
        studentName: dbUser.name,
        content: submissionText,
        attachmentName: attachmentName || undefined,
        attachmentDataUrl: attachmentDataUrl || undefined,
      });

      setIsSubmittingWork(false);
      setSubmissionSuccess("Assignment submitted successfully!");
      loadData();

      setTimeout(() => {
        setSubmissionSuccess(null);
        setSelectedAssignmentForSubmission(null);
      }, 1800);
    } catch (err: any) {
      setIsSubmittingWork(false);
      setSubmissionFileError(err?.message || "Failed to submit assignment.");
    }
  };

  // Password update handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);
    setChangePasswordSuccess(null);
    if (!currentPasswordInput || !newPasswordInput) {
      setChangePasswordError("Please fill out both fields.");
      return;
    }
    try {
      await changeOwnPassword(currentPasswordInput, newPasswordInput);
      setChangePasswordSuccess("Password updated successfully.");
      setCurrentPasswordInput("");
      setNewPasswordInput("");
    } catch (err: any) {
      setChangePasswordError("Failed to update password. Please check your current password.");
    }
  };

  // Selected Teacher Object
  const selectedTeacher = teachers.find(
    (t) =>
      (t.id || "").toLowerCase() === selectedTeacherId.toLowerCase() ||
      (t.uid || "").toLowerCase() === selectedTeacherId.toLowerCase()
  );

  const isPostFromSelectedTeacher = (p: ClassPost) => {
    if (!selectedTeacher) return false;
    const authorMatch =
      p.authorId?.toLowerCase() === selectedTeacherId.toLowerCase() ||
      (selectedTeacher.uid && p.authorId?.toLowerCase() === selectedTeacher.uid.toLowerCase()) ||
      p.authorName?.toLowerCase() === selectedTeacher.name.toLowerCase();

    const teacherSubjects = selectedTeacher.subject
      ? selectedTeacher.subject.split(',').map((s) => s.trim().toLowerCase())
      : [];

    const subjectMatch =
      teacherSubjects.length > 0 &&
      p.subject &&
      teacherSubjects.includes(p.subject.toLowerCase());

    return authorMatch || subjectMatch;
  };

  // Filtered lists
  const filteredAnnouncements = announcements.filter((p) => {
    if (!isPostFromSelectedTeacher(p)) return false;
    return (
      p.title?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
      p.content.toLowerCase().includes(announcementSearch.toLowerCase()) ||
      p.subject?.toLowerCase().includes(announcementSearch.toLowerCase())
    );
  });

  const filteredAssignments = assignments.filter((p) => {
    if (!isPostFromSelectedTeacher(p)) return false;
    const matchQuery =
      p.title?.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      p.content.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      p.subject?.toLowerCase().includes(assignmentSearch.toLowerCase());

    if (!matchQuery) return false;

    const sub = submissionsMap[p.id];
    if (assignmentFilter === "Pending") return !sub;
    if (assignmentFilter === "Submitted") return sub && sub.status !== "Graded";
    if (assignmentFilter === "Graded") return sub && sub.status === "Graded";
    return true;
  });

  // Filtered Attendance & Stats for selected teacher
  const displayHistory = history.filter((r) => {
    if (!selectedTeacher) return false;
    const teacherSubjects = selectedTeacher.subject
      ? selectedTeacher.subject.split(',').map((s) => s.trim().toLowerCase())
      : [];
    if (r.subject && teacherSubjects.includes(r.subject.toLowerCase())) return true;
    if (r.subject && r.subject.toLowerCase() === selectedTeacher.name.toLowerCase()) return true;
    return false;
  });

  const presentCount = displayHistory.filter((r) => r.status === "Present").length;
  const absentCount = displayHistory.filter((r) => r.status === "Absent").length;
  const lateCount = displayHistory.filter((r) => r.status === "Late").length;
  const totalDays = displayHistory.length;
  const percentage = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 100;

  const displayStats: StudentStats = selectedTeacher
    ? {
        presentCount,
        absentCount,
        lateCount,
        totalDays,
        percentage,
      }
    : stats;

  const handleQuickJoin = (code: string) => {
    try {
      setJoinErrorMsg(null);
      const joinedCls = joinClassByCode(code, user);
      setJoinSuccessMsg(`Successfully joined ${joinedCls.name}! Your classes and assignments are now updated.`);
      setTimeout(() => setJoinSuccessMsg(null), 5000);
      loadData();
    } catch (err: any) {
      if (err.message === "blocked") {
        setJoinErrorMsg("You are barred from joining this section. Please contact your instructor.");
      } else {
        setJoinErrorMsg("Invalid class join code. Please check the code and try again.");
      }
      setTimeout(() => setJoinErrorMsg(null), 5000);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="relative min-h-screen pb-16 pt-4 sm:pt-6 px-2.5 sm:px-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      <div className="relative z-10 space-y-4 sm:space-y-6 w-full min-w-0">
        {/* Top Navbar Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cream rounded-3xl border border-ink-soft/10 p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 min-w-0 overflow-hidden"
        >
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar name={dbUser.name} avatarUrl={dbUser.avatarUrl} role="student" size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold bg-teal-500/15 text-teal-300 rounded-full border border-teal-500/30 shrink-0">
                  Student Portal
                </span>
                <span className="text-xs font-mono text-ink-soft/70 truncate">ID: {user.id}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight mt-0.5 truncate">
                Hello, {dbUser.name}
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

        {/* Navigation Tabs - Responsive Scrollable Flex Row */}
        <div
          id="student-tabs-nav"
          className="bg-cream/80 backdrop-blur-xl p-1.5 rounded-2xl border border-ink-soft/10 shadow-lg w-full overflow-x-auto scrollbar-hide"
        >
          <div className="flex items-center justify-start gap-1 sm:gap-1.5 min-w-max pr-1 sm:pr-1.5">
            <button
              onClick={() => setActiveTab("classes")}
              className={`relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "classes" ? "text-teal-600 dark:text-teal-300" : "text-ink-soft hover:text-ink"
              }`}
            >
              {activeTab === "classes" && (
                <motion.div
                  layoutId="studentActiveTabPill"
                  className="absolute inset-0 bg-teal-500/15 border border-teal-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <School className="h-4 w-4 relative z-10 shrink-0" />
              <span className="relative z-10">My Classes</span>
            </button>

            <button
              onClick={() => setActiveTab("attendance")}
              className={`relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "attendance" ? "text-teal-600 dark:text-teal-300" : "text-ink-soft hover:text-ink"
              }`}
            >
              {activeTab === "attendance" && (
                <motion.div
                  layoutId="studentActiveTabPill"
                  className="absolute inset-0 bg-teal-500/15 border border-teal-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <ClipboardList className="h-4 w-4 relative z-10 shrink-0" />
              <span className="relative z-10">Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab("checkins")}
              className={`relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "checkins" ? "text-teal-600 dark:text-teal-300" : "text-ink-soft hover:text-ink"
              }`}
            >
              {activeTab === "checkins" && (
                <motion.div
                  layoutId="studentActiveTabPill"
                  className="absolute inset-0 bg-teal-500/15 border border-teal-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <UserCheck className="h-4 w-4 relative z-10 shrink-0" />
              <span className="relative z-10">Attendance Sheet</span>
            </button>

            <button
              onClick={() => setActiveTab("announcements")}
              className={`relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "announcements" ? "text-teal-600 dark:text-teal-300" : "text-ink-soft hover:text-ink"
              }`}
            >
              {activeTab === "announcements" && (
                <motion.div
                  layoutId="studentActiveTabPill"
                  className="absolute inset-0 bg-teal-500/15 border border-teal-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Megaphone className="h-4 w-4 relative z-10 shrink-0" />
              <span className="relative z-10">Announcements</span>
              {filteredAnnouncements.length > 0 && (
                <span className="relative z-10 ml-0.5 px-1.5 py-0.2 text-[10px] font-extrabold bg-teal-500 text-white rounded-full shrink-0">
                  {filteredAnnouncements.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("assignments")}
              className={`relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "assignments" ? "text-teal-600 dark:text-teal-300" : "text-ink-soft hover:text-ink"
              }`}
            >
              {activeTab === "assignments" && (
                <motion.div
                  layoutId="studentActiveTabPill"
                  className="absolute inset-0 bg-teal-500/15 border border-teal-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <FileText className="h-4 w-4 relative z-10 shrink-0" />
              <span className="relative z-10">Assignments</span>
              {filteredAssignments.length > 0 && (
                <span className="relative z-10 ml-0.5 px-1.5 py-0.2 text-[10px] font-extrabold bg-teal-500 text-white rounded-full shrink-0">
                  {filteredAssignments.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("faculty")}
              className={`relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "faculty" ? "text-teal-600 dark:text-teal-300" : "text-ink-soft hover:text-ink"
              }`}
            >
              {activeTab === "faculty" && (
                <motion.div
                  layoutId="studentActiveTabPill"
                  className="absolute inset-0 bg-teal-500/15 border border-teal-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <GraduationCap className="h-4 w-4 relative z-10 shrink-0" />
              <span className="relative z-10">Faculty Directory</span>
            </button>

            <button
              onClick={() => setActiveTab("messenger")}
              className={`relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "messenger" ? "text-violet-600 dark:text-violet-400" : "text-ink-soft hover:text-ink"
              }`}
            >
              {activeTab === "messenger" && (
                <motion.div
                  layoutId="studentActiveTabPill"
                  className="absolute inset-0 bg-violet-500/15 border border-violet-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <MessageSquare className="h-4 w-4 relative z-10 shrink-0" />
              <span className="relative z-10">Class Messenger</span>
              {unreadMessengerCount > 0 && (
                <span className="relative z-10 ml-0.5 px-1.5 py-0.2 text-[10px] font-extrabold bg-violet-500 text-white rounded-full shrink-0 animate-pulse">
                  {unreadMessengerCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "settings" ? "text-teal-600 dark:text-teal-300" : "text-ink-soft hover:text-ink"
              }`}
            >
              {activeTab === "settings" && (
                <motion.div
                  layoutId="studentActiveTabPill"
                  className="absolute inset-0 bg-teal-500/15 border border-teal-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <SettingsIcon className="h-4 w-4 relative z-10 shrink-0" />
              <span className="relative z-10">Settings</span>
            </button>
          </div>
        </div>

        {/* Teacher / Class Selector Bar */}
        {activeTab !== "settings" && activeTab !== "messenger" && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cream/90 backdrop-blur-xl border border-ink-soft/10 rounded-2xl p-3.5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 rounded-xl shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-ink-soft/60 block">
                  Teacher / Class
                </span>
                {teachers.length === 0 ? (
                  <p className="text-xs sm:text-sm font-extrabold text-ink-soft mt-0.5">
                    You're not enrolled in any classes yet — join one with a class code from your teacher.
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm font-extrabold text-ink truncate mt-0.5">
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span>Viewing Feed of: </span>
                      <span className="text-violet-600 dark:text-violet-400 font-black">
                        {selectedTeacher?.name}
                      </span>
                      {selectedTeacher?.subject && (
                        <span className="px-2 py-0.5 text-[10px] bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 rounded-lg border border-violet-200 dark:border-violet-800">
                          {selectedTeacher.subject}
                        </span>
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto shrink-0">
              {teachers.length > 0 && (
                <>
                  <label htmlFor="teacher-select" className="text-xs font-bold text-ink-soft hidden sm:inline shrink-0">
                    Teacher:
                  </label>
                  <select
                    id="teacher-select"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full md:w-auto px-3.5 py-2 text-xs font-bold bg-slate-900 border border-ink-soft/20 rounded-xl text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    {teachers.map((t, idx) => (
                      <option key={`${t.id || t.uid || 'teacher'}-${idx}`} value={t.id || t.uid}>
                        {t.name} {t.subject ? `(${t.subject})` : ""}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {selectedTeacher && (
                <button
                  onClick={() => setViewingTeacher(selectedTeacher)}
                  className="px-3 py-2 text-xs font-bold text-violet-600 dark:text-violet-300 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/80 border border-violet-200 dark:border-violet-800/80 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                  id="view-selected-teacher-profile-btn"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-violet-500" />
                  <span>Teacher Profile</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 0: MY CLASSES & SECTIONS */}
        {activeTab === "classes" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0"
          >
            <Classroom currentUser={user} />
          </motion.div>
        )}

        {/* TAB 1: ATTENDANCE & STATS */}
        {activeTab === "attendance" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Quick Check-In Form */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6 min-w-0">
              <div className="bg-cream border border-ink-soft/10 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5 relative overflow-hidden min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-black text-ink flex items-center gap-2 truncate">
                    <Calendar className="h-5 w-5 text-teal-500 shrink-0" />
                    Daily Check-In
                  </h2>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold bg-teal-500/15 text-teal-300 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-teal-500/30 shrink-0">
                    {todayStr}
                  </span>
                </div>

                {/* Celebratory Banner */}
                <AnimatePresence>
                  {showCelebration && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="p-3 sm:p-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl shadow-lg flex items-center gap-2.5 sm:gap-3"
                    >
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs sm:text-sm">Checked In!</h4>
                        <p className="text-[11px] sm:text-xs opacity-90 truncate">{successMsg}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleRecordAttendance} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-ink-soft block">
                      Select Status for Today:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedStatus("Present")}
                        className={`py-2.5 px-1 sm:py-3 sm:px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          selectedStatus === "Present"
                            ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                            : "border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-slate-600 hover:text-white"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                        <span>Present</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedStatus("Late")}
                        className={`py-2.5 px-1 sm:py-3 sm:px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          selectedStatus === "Late"
                            ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                            : "border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-slate-600 hover:text-white"
                        }`}
                      >
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                        <span>Late</span>
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedStatus("Absent")}
                        className={`py-2.5 px-1 sm:py-3 sm:px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          selectedStatus === "Absent"
                            ? "border-rose-400 bg-rose-500/20 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                            : "border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-slate-600 hover:text-white"
                        }`}
                      >
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-rose-400" />
                        <span>Absent</span>
                      </motion.button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Optional Note:
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Arrived 5 mins late due to traffic"
                      rows={2}
                      className="w-full p-2.5 sm:p-3 text-xs bg-slate-950/80 border border-slate-700/80 rounded-2xl focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] text-white placeholder-slate-400 resize-none transition-all"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="w-full py-3 sm:py-3.5 rounded-2xl text-xs font-extrabold text-white bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{todayRecord ? "Update Today's Status" : "Log Attendance Now"}</span>
                  </motion.button>
                </form>
              </div>

              {/* Stats Overview */}
              <div className="bg-cream border border-ink-soft/10 rounded-3xl p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-4 min-w-0 overflow-hidden">
                <h3 className="text-sm font-black text-ink flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-teal-500 shrink-0" />
                  <span>Attendance Record Summary</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
                  <div className="p-2.5 sm:p-3.5 bg-teal-500/10 rounded-2xl border border-teal-500/20 text-center min-w-0">
                    <span className="text-[10px] font-bold text-teal-300 block uppercase tracking-normal sm:tracking-wider truncate">
                      Present
                    </span>
                    <span className="text-lg sm:text-xl font-black text-teal-400 mt-0.5 block">
                      {displayStats.presentCount}
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-center min-w-0">
                    <span className="text-[10px] font-bold text-amber-300 block uppercase tracking-normal sm:tracking-wider truncate">
                      Late
                    </span>
                    <span className="text-lg sm:text-xl font-black text-amber-400 mt-0.5 block">
                      {displayStats.lateCount}
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3.5 bg-coral-500/10 rounded-2xl border border-coral-500/20 text-center min-w-0">
                    <span className="text-[10px] font-bold text-coral-300 block uppercase tracking-normal sm:tracking-wider truncate">
                      Absent
                    </span>
                    <span className="text-lg sm:text-xl font-black text-coral-400 mt-0.5 block">
                      {displayStats.absentCount}
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3.5 bg-violet-500/10 rounded-2xl border border-violet-500/20 text-center min-w-0">
                    <span className="text-[10px] font-bold text-violet-300 block uppercase tracking-normal sm:tracking-wider truncate">
                      Punctuality Rate
                    </span>
                    <span className="text-lg sm:text-xl font-black text-violet-400 mt-0.5 block">
                      {displayStats.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Attendance History Table */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-700/60 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 min-w-0 overflow-hidden backdrop-blur-xl">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400 shrink-0" />
                <span>Attendance Log History</span>
              </h2>

              {displayHistory.length === 0 ? (
                <div className="p-10 text-center text-slate-400 space-y-2">
                  <ClipboardList className="h-8 w-8 mx-auto text-slate-500" />
                  <p className="text-xs font-semibold">No attendance logged for this view yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="pb-3 px-3 whitespace-nowrap">Date</th>
                        <th className="pb-3 px-3 whitespace-nowrap">Time</th>
                        <th className="pb-3 px-3 whitespace-nowrap">Subject / Class</th>
                        <th className="pb-3 px-3 whitespace-nowrap">Status</th>
                        <th className="pb-3 px-3 whitespace-nowrap">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {displayHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-cyan-500/5 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">{record.date}</td>
                          <td className="py-3 px-3 text-slate-300 font-mono whitespace-nowrap">{record.time}</td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-violet-500/20 text-violet-300 font-extrabold text-[10px] rounded-lg border border-violet-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)] whitespace-nowrap inline-block">
                              {record.subject || "General Class"}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap ${
                                record.status === "Present"
                                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-[0_0_10px_rgba(20,184,166,0.2)]"
                                  : record.status === "Late"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                              }`}
                            >
                              {record.status === "Present" && <CheckCircle className="h-3.5 w-3.5" />}
                              {record.status === "Late" && <Clock className="h-3.5 w-3.5" />}
                              {record.status === "Absent" && <XCircle className="h-3.5 w-3.5" />}
                              {record.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-300 italic max-w-xs truncate font-medium">
                            {record.notes || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: DAILY CHECK-INS */}
        {activeTab === "checkins" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DailyCheckinsTab
              currentUser={dbUser}
              allStudents={allStudents.filter((s) => s.id.toLowerCase() === dbUser.id.toLowerCase())}
              attendanceRecords={allAttendanceRecords.filter((r) => r.studentId.toLowerCase() === dbUser.id.toLowerCase())}
              onSelectStudent={(st) => setViewingStudent(st)}
            />
          </motion.div>
        )}

        {/* TAB 3: ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 0-Class Enrollment Helper Banner */}
            {enrolledClasses.length === 0 && (
              <div className="bg-teal-950/40 border border-teal-500/30 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                    <School className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white">Not yet enrolled in a class section?</h3>
                    <p className="text-xs text-slate-300 max-w-xl">
                      You can view all school-wide broadcasts below. Teachers post their course announcements and class join codes here so you can enroll.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("classes")}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <School className="h-4 w-4" />
                  <span>Join Class in My Classes</span>
                </button>
              </div>
            )}

            {/* Notification messages */}
            {joinSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{joinSuccessMsg}</span>
              </div>
            )}

            {joinErrorMsg && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{joinErrorMsg}</span>
              </div>
            )}

            {/* Search Bar */}
            <div className="bg-cream border border-ink-soft/10 rounded-2xl p-4 shadow-lg flex items-center gap-3">
              <Search className="h-5 w-5 text-teal-500 shrink-0" />
              <input
                type="text"
                value={announcementSearch}
                onChange={(e) => setAnnouncementSearch(e.target.value)}
                placeholder="Search announcements by title, content, or join code..."
                className="w-full text-xs font-semibold bg-transparent !border-none !outline-none focus:!bg-transparent focus:!outline-none focus:!border-none focus:!ring-0 text-ink placeholder-ink-soft/50"
                style={{ border: "none", outline: "none", boxShadow: "none" }}
              />
            </div>

            {filteredAnnouncements.length === 0 ? (
              <div className="bg-cream border border-ink-soft/10 rounded-3xl p-12 text-center text-ink-soft/60 space-y-2">
                <Megaphone className="h-10 w-10 mx-auto text-ink-soft/30" />
                <p className="text-sm font-bold text-ink">No announcements found.</p>
                <p className="text-xs">Check back later for course updates from your teachers.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnnouncements.map((post, idx) => {
                  const isSchoolWide = post.targetAudience === "all" || post.classId === "all";
                  const isAllStudents = post.targetAudience === "students" || post.classId === "all_students";
                  const isEnrolled = post.classId ? enrolledClasses.some((c) => c.id === post.classId) : false;

                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-cream border border-ink-soft/10 rounded-3xl p-6 shadow-xl space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink-soft/10 pb-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isAllStudents ? (
                              <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-950/80 text-emerald-300 rounded-full border border-emerald-500/40 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Broadcast: All Students
                              </span>
                            ) : isSchoolWide ? (
                              <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-violet-950/80 text-violet-300 rounded-full border border-violet-500/40 flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                Campus-Wide Broadcast
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-teal-950/80 text-teal-300 rounded-full border border-teal-500/40">
                                Announcement
                              </span>
                            )}
                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-950/80 text-indigo-300 rounded-full border border-indigo-500/40 flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              Teacher: {post.authorName || teachers.find((t) => t.id === post.authorId)?.name || "Faculty"}
                            </span>
                            {post.subject && (
                              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-violet-950/80 text-violet-300 rounded-full border border-violet-500/40">
                                {post.subject}
                              </span>
                            )}
                          </div>
                          <h2 className="text-lg font-black text-ink tracking-tight mt-1">
                            {post.title || "Course Announcement"}
                          </h2>
                        </div>
                        <span className="text-xs font-mono text-ink-soft/60">
                          {new Date(post.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="text-xs leading-relaxed text-ink/90 whitespace-pre-wrap font-sans">
                        {linkifyText(post.content, {
                          linkClassName:
                            "font-semibold text-indigo-600 hover:text-indigo-700 underline decoration-indigo-400/50 underline-offset-2 break-all",
                          onJoinCode: handleQuickJoin,
                          isEnrolled: () => isEnrolled,
                        })}
                        {post.classCode && !hasJoinCode(post.content, post.classCode) && (
                          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                            <JoinCodePill
                              code={post.classCode}
                              className={post.className}
                              onJoin={handleQuickJoin}
                              isEnrolled={isEnrolled}
                            />
                          </div>
                        )}
                      </div>

                      {/* Attachment preview if any */}
                      {post.attachmentDataUrl && (
                        post.attachmentDataUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(post.attachmentName || "") ? (
                          <div className="mt-3 overflow-hidden rounded-2xl border border-ink-soft/15 bg-slate-950/40 max-w-lg">
                            <img
                              src={post.attachmentDataUrl}
                              alt={post.attachmentName || "Attached photo"}
                              className="max-h-72 w-full object-cover rounded-t-2xl hover:opacity-95 transition-opacity cursor-pointer"
                              onClick={() => window.open(post.attachmentDataUrl, "_blank")}
                            />
                            <div className="p-3 bg-slate-900/90 border-t border-ink-soft/15 flex items-center justify-between text-xs font-bold text-ink">
                              <span className="flex items-center gap-1.5 truncate">
                                <ImageIcon className="h-4 w-4 text-teal-400 shrink-0" />
                                <span className="truncate">{post.attachmentName || "Attached Photo"}</span>
                              </span>
                              <a
                                href={post.attachmentDataUrl}
                                download={post.attachmentName || "photo.png"}
                                className="px-3 py-1.5 text-xs font-bold text-teal-300 bg-teal-500/20 border border-teal-500/40 hover:bg-teal-500/30 rounded-xl transition-all cursor-pointer"
                              >
                                Download Photo
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-950/40 border border-ink-soft/15 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-ink truncate">
                              <Paperclip className="h-4 w-4 text-teal-400 shrink-0" />
                              <span className="truncate">{post.attachmentName || "Attachment"}</span>
                            </div>
                            <a
                              href={post.attachmentDataUrl}
                              download={post.attachmentName || "attachment"}
                              className="px-3.5 py-1.5 text-xs font-bold text-teal-300 bg-teal-500/20 border border-teal-500/40 rounded-xl hover:bg-teal-500/30 transition-all cursor-pointer shrink-0"
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
                        isTeacher={false}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: ASSIGNMENTS */}
        {activeTab === "assignments" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search & Filter Header */}
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl">
              <div className="flex items-center gap-3 flex-1 bg-slate-950/80 px-3.5 py-2.5 rounded-xl border border-slate-700/60 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all">
                <Search className="h-5 w-5 text-cyan-400 shrink-0" />
                <input
                  type="text"
                  value={assignmentSearch}
                  onChange={(e) => setAssignmentSearch(e.target.value)}
                  placeholder="Search assignments by title..."
                  className="w-full text-xs font-semibold bg-transparent !border-none !outline-none focus:!bg-transparent focus:!outline-none focus:!border-none focus:!ring-0 text-white placeholder-slate-400"
                  style={{ border: "none", outline: "none", boxShadow: "none" }}
                />
              </div>

              <div className="flex items-center gap-1.5 self-start md:self-center">
                {(["All", "Pending", "Submitted", "Graded"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setAssignmentFilter(st)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      assignmentFilter === st
                        ? "bg-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                        : "bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredAssignments.length === 0 ? (
              <div className="bg-cream border border-ink-soft/10 rounded-3xl p-12 text-center text-ink-soft/60 space-y-2">
                <FileText className="h-10 w-10 mx-auto text-ink-soft/30" />
                <p className="text-sm font-bold text-ink">No assignments found.</p>
                <p className="text-xs">Your teacher has not posted any assignments in this view yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment, idx) => {
                  const sub = submissionsMap[assignment.id];
                  const isGraded = sub?.status === "Graded";
                  const isSubmitted = !!sub;

                  return (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-cream border border-ink-soft/10 rounded-3xl p-6 shadow-xl space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${
                                isGraded
                                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                                  : isSubmitted
                                  ? "bg-teal-950/80 text-teal-300 border-teal-500/40"
                                  : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {isGraded ? "Graded" : isSubmitted ? "Submitted" : "Pending"}
                            </span>

                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-950/80 text-indigo-300 rounded-full border border-indigo-500/40 flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              Teacher: {assignment.authorName || teachers.find((t) => t.id === assignment.authorId)?.name || "Faculty"}
                            </span>

                            {assignment.subject && (
                              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-violet-950/80 text-violet-300 rounded-full border border-violet-500/40">
                                {assignment.subject}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-0.5">
                            {assignment.dueDate && (
                              <span className="text-[11px] font-mono font-bold text-ink-soft">
                                Due: {assignment.dueDate}
                              </span>
                            )}
                            <span className="text-[11px] font-mono font-bold text-ink-soft/70">
                              Max Points: {assignment.maxPoints || 100}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-base font-black text-ink">{assignment.title}</h3>
                        <p className="text-xs text-ink/90 leading-relaxed font-sans whitespace-pre-wrap">
                          {assignment.content}
                        </p>

                        {/* Teacher's Attachment preview if any */}
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
                                  download={assignment.attachmentName || "assignment-resource.png"}
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
                                <span className="truncate">{assignment.attachmentName || "Reference Document"}</span>
                              </div>
                              <a
                                href={assignment.attachmentDataUrl}
                                download={assignment.attachmentName || "assignment-file"}
                                className="px-2.5 py-1 text-[11px] font-bold text-violet-300 bg-violet-500/20 border border-violet-500/40 rounded-lg hover:bg-violet-500/30 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" /> Download
                              </a>
                            </div>
                          )
                        )}
                      </div>

                      {/* Student's submitted work info preview */}
                      {isSubmitted && sub && (
                        <div className="p-3 bg-teal-950/40 border border-teal-500/30 rounded-2xl text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-teal-300">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" /> Your Submitted Work:
                            </span>
                            <span className="text-[10px] font-mono text-ink-soft">{sub.submittedAt ? sub.submittedAt.slice(0, 10) : ""}</span>
                          </div>
                          {sub.content && (
                            <p className="text-[11px] text-ink-soft line-clamp-2 italic">
                              "{sub.content}"
                            </p>
                          )}
                          {sub.attachmentDataUrl && (
                            <div className="pt-1 flex items-center justify-between text-[11px] border-t border-teal-500/20">
                              <span className="font-semibold text-teal-200 truncate flex items-center gap-1">
                                <Paperclip className="h-3 w-3 text-teal-400" /> {sub.attachmentName || "Attached Work"}
                              </span>
                              <a
                                href={sub.attachmentDataUrl}
                                download={sub.attachmentName || "my-submission"}
                                className="font-extrabold text-teal-300 hover:text-teal-200 underline ml-2 shrink-0"
                              >
                                Download
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Grade feedback display if graded */}
                      {isGraded && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs space-y-1">
                          <div className="flex items-center justify-between font-extrabold text-emerald-800">
                            <span className="flex items-center gap-1">
                              <Award className="h-4 w-4 text-emerald-600" /> Grade Received:
                            </span>
                            <span className="text-sm font-mono">
                              {String(sub.score).includes('/') ? sub.score : `${sub.score} / ${assignment.maxPoints || 100}`}
                            </span>
                          </div>
                          {sub.feedback && (
                            <p className="text-[11px] text-emerald-700/90 italic">
                              "{sub.feedback}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Submit Action Button */}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleOpenSubmissionModal(assignment)}
                        className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isGraded
                            ? "bg-emerald-500/15 text-emerald-700 border border-emerald-300 hover:bg-emerald-500/25"
                            : isSubmitted
                            ? "bg-teal-500/15 text-teal-700 border border-teal-300 hover:bg-teal-500/25"
                            : "bg-teal-500 text-white hover:bg-teal-600 shadow-md shadow-teal-500/20"
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        {isGraded ? "View Submission" : isSubmitted ? "View / Re-submit Work" : "Submit Assignment"}
                      </motion.button>

                      {/* Class & Private Comments Section */}
                      <PostCommentsSection
                        post={assignment}
                        currentUser={dbUser}
                        isTeacher={false}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 5: FACULTY DIRECTORY */}
        {activeTab === "faculty" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-cream border border-ink-soft/10 rounded-3xl p-6 shadow-xl space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-violet-500" />
                <h2 className="text-xl font-black text-ink font-display">Faculty Directory</h2>
              </div>
              <p className="text-xs text-ink-soft">
                Connect with your teachers, check subjects, and view verified profile credentials.
              </p>
            </div>

            {teachers.length === 0 ? (
              <div className="text-center py-12 bg-cream border border-ink-soft/10 rounded-3xl p-6">
                <GraduationCap className="h-10 w-10 text-ink-soft/40 mx-auto mb-2" />
                <p className="text-sm font-bold text-ink">No faculty accounts found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachers.map((t, idx) => (
                  <motion.div
                    key={`${t.id || t.uid || 'teacher'}-${idx}`}
                    whileHover={{ y: -2 }}
                    className="bg-cream border border-ink-soft/10 rounded-3xl p-5 shadow-xl space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={t.name} avatarUrl={t.avatarUrl} role="teacher" size="lg" />
                          <div>
                            <h3 className="font-bold text-sm text-ink">{t.name}</h3>
                            <p className="text-[11px] text-ink-soft font-mono">@{t.id}</p>
                          </div>
                        </div>

                        {t.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                            <CheckCircle2 className="h-3 w-3 text-teal-400" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="h-3 w-3 text-amber-400" /> Pending
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {t.subject && (
                          <div className="flex items-start gap-2 text-ink-soft">
                            <BookOpen className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
                            <div className="flex flex-wrap gap-1">
                              {t.subject.split(',').map((sub, sIdx) => (
                                <span key={sIdx} className="bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 px-2 py-0.5 rounded-md text-[11px] font-bold border border-violet-200 dark:border-violet-700/50">
                                  {sub.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {t.location && (
                          <div className="flex items-center gap-2 text-ink-soft">
                            <MapPin className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                            <span>{t.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-ink-soft/10 flex items-center justify-between gap-2">
                      {t.email ? (
                        <a
                          href={`mailto:${t.email}`}
                          className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3.5 w-3.5" /> Email
                        </a>
                      ) : (
                        <span className="text-[10px] text-ink-soft/50 italic">No email</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            openDirectMessage(t.id);
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-violet-300 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="h-3 w-3" /> DM
                        </button>
                        <button
                          onClick={() => setViewingTeacher(t)}
                          className="px-3 py-1.5 text-xs font-extrabold text-teal-300 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        >
                          <GraduationCap className="h-3.5 w-3.5" /> Profile
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB: CLASS MESSENGER */}
        {activeTab === "messenger" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-cream/90 backdrop-blur-xl border border-ink-soft/10 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink-soft/10 pb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-ink flex items-center gap-2 font-display">
                    <MessageSquare className="h-5 w-5 text-violet-500" />
                    Class Messenger
                  </h2>
                  <p className="text-xs text-ink-soft mt-0.5 font-sans">
                    Real-time direct messaging and private classroom communications with instructors and classmates.
                  </p>
                </div>
              </div>

              <ClassMessenger
                currentUser={dbUser}
                mode="embedded"
                initialPartnerId={messengerPartnerId}
                theme={theme}
                themeMode={themeMode}
              />
            </div>
          </motion.div>
        )}

        {/* TAB: SETTINGS */}
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
              onProfileUpdated={loadData}
            />
          </motion.div>
        )}
        <AnimatePresence>
          {selectedAssignmentForSubmission && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-cream border border-ink-soft/15 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 my-8"
              >
                <div className="flex items-center justify-between border-b border-ink-soft/10 pb-4">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-teal-500/15 text-teal-300 rounded-full border border-teal-500/30">
                      Assignment Submission
                    </span>
                    <h2 className="text-lg font-black text-ink mt-1">
                      {selectedAssignmentForSubmission.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedAssignmentForSubmission(null)}
                    className="p-1.5 text-ink-soft hover:text-ink rounded-full hover:bg-white/10 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-3.5 bg-slate-950/40 border border-ink-soft/15 rounded-2xl text-xs space-y-2">
                  <h4 className="font-bold text-ink">Instructions:</h4>
                  <p className="text-ink-soft/90 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedAssignmentForSubmission.content}
                  </p>

                  {/* Teacher's Reference Resource in Modal */}
                  {selectedAssignmentForSubmission.attachmentDataUrl && (
                    <div className="pt-2 border-t border-ink-soft/10">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-1.5 flex items-center gap-1">
                        <Paperclip className="h-3 w-3" /> Teacher's Reference Material:
                      </p>
                      {selectedAssignmentForSubmission.attachmentDataUrl.startsWith("data:image/") ||
                      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(selectedAssignmentForSubmission.attachmentName || "") ? (
                        <div className="rounded-xl overflow-hidden border border-ink-soft/20 bg-slate-900">
                          <img
                            src={selectedAssignmentForSubmission.attachmentDataUrl}
                            alt="Reference"
                            className="max-h-40 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(selectedAssignmentForSubmission.attachmentDataUrl, "_blank")}
                          />
                          <div className="p-2 flex items-center justify-between text-[11px] font-bold">
                            <span className="truncate text-ink-soft">{selectedAssignmentForSubmission.attachmentName || "Reference Photo"}</span>
                            <a
                              href={selectedAssignmentForSubmission.attachmentDataUrl}
                              download={selectedAssignmentForSubmission.attachmentName || "reference.png"}
                              className="text-teal-400 hover:text-teal-300 underline shrink-0 ml-2 flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" /> Download
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-900 border border-ink-soft/20 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-semibold text-ink truncate flex items-center gap-1.5">
                            <Paperclip className="h-3.5 w-3.5 text-teal-400" />
                            {selectedAssignmentForSubmission.attachmentName || "Reference Attachment"}
                          </span>
                          <a
                            href={selectedAssignmentForSubmission.attachmentDataUrl}
                            download={selectedAssignmentForSubmission.attachmentName || "reference-document"}
                            className="px-2.5 py-1 text-[11px] font-bold text-teal-300 bg-teal-500/20 border border-teal-500/40 rounded-lg hover:bg-teal-500/30 transition-all shrink-0 flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" /> Download
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {submissionSuccess && (
                  <div className="p-3 bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-400" />
                    <span>{submissionSuccess}</span>
                  </div>
                )}

                {(() => {
                  const activeSub = getSubmissionForStudent(selectedAssignmentForSubmission.id, user.id);
                  const isGradedLocked = activeSub?.status === "Graded";

                  return (
                    <>
                      {isGradedLocked && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between font-extrabold text-emerald-400 text-xs">
                            <span className="flex items-center gap-1.5">
                              <Award className="h-4 w-4 text-emerald-400" /> Officially Graded
                            </span>
                            <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                              {String(activeSub.score).includes('/') ? activeSub.score : `${activeSub.score} / ${selectedAssignmentForSubmission.maxPoints || 100}`}
                            </span>
                          </div>
                          {activeSub.feedback && (
                            <div className="text-xs text-slate-300 pt-1 border-t border-emerald-500/20">
                              <span className="font-bold text-slate-400">Teacher Feedback: </span>
                              <span className="italic">"{activeSub.feedback}"</span>
                            </div>
                          )}
                          <p className="text-[11px] text-emerald-400/90 font-semibold">
                            This coursework has been graded by your instructor. Further submissions are locked.
                          </p>
                        </div>
                      )}

                      <form onSubmit={handleSubmitWork} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-ink-soft block">
                            Your Solution / Work Description:
                          </label>
                          <textarea
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            placeholder="Type your response or answers here..."
                            rows={4}
                            required
                            readOnly={isGradedLocked}
                            className={`w-full p-3 text-xs bg-slate-900/90 border border-ink-soft/20 rounded-2xl focus:outline-none text-ink placeholder:text-ink-soft/40 resize-none ${
                              isGradedLocked ? "opacity-75 cursor-not-allowed" : "focus:border-teal-400"
                            }`}
                          />
                        </div>

                        {!isGradedLocked && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-ink-soft block">
                              Attach Your Solution File / Photo:
                            </label>

                            {attachmentDataUrl ? (
                              <div className="p-3 bg-slate-900/90 border border-teal-500/40 rounded-2xl space-y-2">
                                {attachmentDataUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachmentName || "") ? (
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={attachmentDataUrl}
                                      alt="Upload preview"
                                      className="h-16 w-16 object-cover rounded-xl border border-ink-soft/20 cursor-pointer"
                                      onClick={() => window.open(attachmentDataUrl, "_blank")}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-teal-300 truncate">{attachmentName || "Attached Image"}</p>
                                      <p className="text-[10px] text-ink-soft/70">Image uploaded and optimized</p>
                                      <a
                                        href={attachmentDataUrl}
                                        download={attachmentName || "my-submission.jpg"}
                                        className="text-[11px] text-teal-400 hover:text-teal-300 underline font-bold mt-0.5 inline-block"
                                      >
                                        Preview / Download
                                      </a>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAttachmentName("");
                                        setAttachmentDataUrl("");
                                      }}
                                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-xl cursor-pointer"
                                      title="Remove file"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Paperclip className="h-4 w-4 text-teal-400 shrink-0" />
                                      <span className="text-xs font-bold text-teal-300 truncate">{attachmentName || "Attached Document"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <a
                                        href={attachmentDataUrl}
                                        download={attachmentName || "my-submission"}
                                        className="text-[11px] font-bold text-teal-400 hover:text-teal-300 underline"
                                      >
                                        View
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAttachmentName("");
                                          setAttachmentDataUrl("");
                                        }}
                                        className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg cursor-pointer"
                                        title="Remove file"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <div className="pt-1 flex items-center justify-end">
                                  <label className="text-[11px] font-extrabold text-slate-300 hover:text-white cursor-pointer underline">
                                    Replace File
                                    <input
                                      type="file"
                                      onChange={handleFileChange}
                                      className="hidden"
                                      accept="image/*,.pdf,.doc,.docx,.txt"
                                    />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <label className="px-4 py-2.5 text-xs font-extrabold text-teal-300 bg-teal-950/80 border border-teal-500/40 hover:bg-teal-900/80 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm">
                                  <Paperclip className="h-4 w-4" />
                                  Choose File / Image
                                  <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                  />
                                </label>
                                <span className="text-xs font-mono text-ink-soft/70 truncate">
                                  No file selected (optional)
                                </span>
                              </div>
                            )}

                            {submissionFileError && (
                              <p className="text-[11px] font-bold text-rose-400">{submissionFileError}</p>
                            )}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-ink-soft/10">
                          <button
                            type="button"
                            onClick={() => setSelectedAssignmentForSubmission(null)}
                            className="px-4 py-2.5 text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-700 cursor-pointer"
                          >
                            {isGradedLocked ? "Close" : "Cancel"}
                          </button>
                          {!isGradedLocked && (
                            <button
                              type="submit"
                              disabled={isSubmittingWork}
                              className="px-5 py-2.5 text-xs font-extrabold text-white bg-teal-500 rounded-xl hover:bg-teal-600 cursor-pointer shadow-md shadow-teal-500/20 flex items-center gap-2"
                            >
                              <Send className="h-4 w-4" />
                              Submit Assignment
                            </button>
                          )}
                        </div>
                      </form>
                    </>
                  );
                })()}
              </motion.div>
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
        {viewingTeacher && (
          <div className="pt-8 mt-10 border-t border-slate-700/60">
            <TeacherProfile
              teacher={viewingTeacher}
              currentUser={dbUser}
              onClose={() => setViewingTeacher(null)}
              onSelectStudent={(s) => setViewingStudent(s)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
