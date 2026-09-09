import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  UserCheck,
  User,
  Mail,
  MapPin,
  Calendar as CalendarIcon,
  Eye,
  X,
  Award,
  BookOpen,
  Filter,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  GraduationCap
} from "lucide-react";
import { User as UserType, AttendanceRecord, AttendanceStatus } from "../types";
import { formatDate, calculateStudentStats, getAttendanceRecords } from "../lib/db";
import UserAvatar from "./UserAvatar";

interface DailyCheckinsTabProps {
  currentUser: UserType;
  allStudents: UserType[];
  attendanceRecords: AttendanceRecord[];
  onSelectStudent?: (student: UserType) => void;
}

export default function DailyCheckinsTab({
  currentUser,
  allStudents,
  attendanceRecords,
  onSelectStudent,
}: DailyCheckinsTabProps) {
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Checked In" | "Present" | "Late" | "Absent" | "Not Checked In">("All");
  const [infoModalStudent, setInfoModalStudent] = useState<UserType | null>(null);

  const isToday = selectedDate === formatDate(new Date());

  // Filter records for the selected date
  const recordsForDate = useMemo(() => {
    return attendanceRecords.filter((r) => r.date === selectedDate);
  }, [attendanceRecords, selectedDate]);

  // FERPA / Student Privacy Protection:
  // If the logged-in user is a student, scope visible students strictly to their own account.
  // Classmates and school-wide directory rosters remain private.
  const targetStudents = useMemo(() => {
    if (currentUser.role === "student") {
      return allStudents.filter((s) => s.id.toLowerCase() === currentUser.id.toLowerCase());
    }
    return allStudents;
  }, [allStudents, currentUser]);

  // Create a map of studentId -> AttendanceRecord for quick lookup
  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    recordsForDate.forEach((r) => {
      map.set(r.studentId.toLowerCase(), r);
    });
    return map;
  }, [recordsForDate]);

  // Combined student list with check-in status
  const studentCheckins = useMemo(() => {
    return targetStudents.map((student) => {
      const record = recordMap.get(student.id.toLowerCase());
      return {
        student,
        record: record || null,
        isCheckedIn: !!record,
        status: record ? record.status : ("Not Checked In" as const),
      };
    });
  }, [targetStudents, recordMap]);

  // Filtered list based on search query and status filter
  const filteredStudents = useMemo(() => {
    return studentCheckins.filter(({ student, record, status }) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.id.toLowerCase().includes(q) ||
        (student.email && student.email.toLowerCase().includes(q)) ||
        (student.department && student.department.toLowerCase().includes(q)) ||
        (record?.notes && record.notes.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // Status filter
      if (statusFilter === "Checked In") return !!record;
      if (statusFilter === "Not Checked In") return !record;
      if (statusFilter === "Present") return status === "Present";
      if (statusFilter === "Late") return status === "Late";
      if (statusFilter === "Absent") return status === "Absent";

      return true;
    });
  }, [studentCheckins, searchQuery, statusFilter]);

  // Summary Metrics
  const totalStudents = targetStudents.length;
  const totalCheckedIn = recordsForDate.length;
  const presentCount = recordsForDate.filter((r) => r.status === "Present").length;
  const lateCount = recordsForDate.filter((r) => r.status === "Late").length;
  const absentCount = recordsForDate.filter((r) => r.status === "Absent").length;
  const notCheckedInCount = totalStudents - totalCheckedIn;

  // Compute selected modal student info
  const modalStudentRecord = infoModalStudent ? recordMap.get(infoModalStudent.id.toLowerCase()) : null;
  const modalStudentStats = infoModalStudent ? calculateStudentStats(infoModalStudent.id) : null;
  const modalStudentHistory = infoModalStudent
    ? attendanceRecords.filter((r) => r.studentId.toLowerCase() === infoModalStudent.id.toLowerCase())
    : [];

  const isStudentView = currentUser.role === "student";

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-cream rounded-3xl border border-ink-soft/10 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white shadow-md shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-ink font-display">
                {isStudentView ? "My Daily Attendance Status" : "Daily Attendance Sheet"}
              </h2>
              {isToday && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" /> Live Today
                </span>
              )}
            </div>
            <p className="text-xs text-ink-soft/70">
              {isStudentView
                ? "View your personal check-in records and verified attendance history."
                : "View real-time student check-ins and complete student profiles."}
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-900/90 p-2 rounded-2xl border border-slate-700/80 shadow-md">
          <CalendarIcon className="h-4 w-4 text-violet-400 ml-1 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-mono font-bold text-slate-100 bg-transparent focus:outline-none cursor-pointer pr-1 [color-scheme:dark]"
          />
          {selectedDate !== formatDate(new Date()) && (
            <button
              onClick={() => setSelectedDate(formatDate(new Date()))}
              className="px-2.5 py-1 text-[11px] font-bold text-violet-300 bg-violet-900/50 hover:bg-violet-800/60 border border-violet-600/40 rounded-xl transition-colors cursor-pointer"
            >
              Today
            </button>
          )}
        </div>
      </motion.div>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter("All")}
          className={`bg-cream border rounded-2xl p-4 shadow-xl cursor-pointer transition-all hover:-translate-y-0.5 ${
            statusFilter === "All" ? "border-violet-500 ring-2 ring-violet-500/20" : "border-ink-soft/10"
          }`}
        >
          <p className="text-[10px] font-bold text-ink-soft/60 uppercase tracking-wide">Total Roster</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-ink font-display">{totalStudents}</span>
            <span className="text-xs font-bold text-violet-600">Students</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("Checked In")}
          className={`bg-cream border rounded-2xl p-4 shadow-xl cursor-pointer transition-all hover:-translate-y-0.5 ${
            statusFilter === "Checked In" ? "border-cyan-500 ring-2 ring-cyan-500/20" : "border-ink-soft/10"
          }`}
        >
          <p className="text-[10px] font-bold text-ink-soft/60 uppercase tracking-wide">Checked In</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-cyan-600 font-display">{totalCheckedIn}</span>
            <span className="text-[10px] font-bold text-cyan-600/80">
              {totalStudents > 0 ? Math.round((totalCheckedIn / totalStudents) * 100) : 0}%
            </span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("Present")}
          className={`bg-cream border rounded-2xl p-4 shadow-xl cursor-pointer transition-all hover:-translate-y-0.5 ${
            statusFilter === "Present" ? "border-teal-500 ring-2 ring-teal-500/20" : "border-ink-soft/10"
          }`}
        >
          <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wide">Present</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-teal-400 font-display">{presentCount}</span>
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("Late")}
          className={`bg-cream border rounded-2xl p-4 shadow-xl cursor-pointer transition-all hover:-translate-y-0.5 ${
            statusFilter === "Late" ? "border-coral-500 ring-2 ring-coral-500/20" : "border-ink-soft/10"
          }`}
        >
          <p className="text-[10px] font-bold text-coral-300 uppercase tracking-wide">Late</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-coral-400 font-display">{lateCount}</span>
            <Clock className="h-4 w-4 text-coral-400" />
          </div>
        </div>

        <div
          onClick={() => setStatusFilter("Not Checked In")}
          className={`bg-cream border rounded-2xl p-4 shadow-xl cursor-pointer transition-all hover:-translate-y-0.5 col-span-2 sm:col-span-1 ${
            statusFilter === "Not Checked In" ? "border-slate-500 ring-2 ring-slate-500/20" : "border-ink-soft/10"
          }`}
        >
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Not Checked In</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-200 font-display">{notCheckedInCount}</span>
            <XCircle className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-cream border border-ink-soft/10 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-ink-soft/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student by name, ID, email, department, course..."
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold text-ink bg-cream-dim/60 border border-ink-soft/15 rounded-xl focus:outline-none focus:border-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft/50 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          {(["All", "Checked In", "Present", "Late", "Absent", "Not Checked In"] as const).map((sf) => (
            <button
              key={sf}
              onClick={() => setStatusFilter(sf)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                statusFilter === sf
                  ? "bg-violet-600 text-white shadow-md"
                  : "bg-cream-dim/80 text-ink-soft hover:text-ink hover:bg-cream-dim"
              }`}
            >
              {sf}
            </button>
          ))}
        </div>
      </div>

      {/* Student Cards List */}
      {filteredStudents.length === 0 ? (
        <div className="bg-cream border border-ink-soft/10 rounded-3xl p-12 text-center shadow-xl">
          <UserCheck className="h-12 w-12 text-ink-soft/30 mx-auto mb-3" />
          <h3 className="text-base font-bold text-ink">No student check-ins found</h3>
          <p className="text-xs text-ink-soft/60 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "All"
              ? "Try adjusting your search query or filter selection."
              : `No students recorded for ${selectedDate}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(({ student, record, isCheckedIn, status }) => {
            return (
              <motion.div
                key={student.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setInfoModalStudent(student)}
                className="bg-cream border border-ink-soft/10 hover:border-violet-400 rounded-3xl p-4 sm:p-5 shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Avatar + Name + Status Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        name={student.name}
                        avatarUrl={student.avatarUrl}
                        role={student.role}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-ink group-hover:text-violet-600 transition-colors truncate">
                          {student.name}
                        </h4>
                        <p className="text-[11px] font-mono text-ink-soft/60 truncate">
                          #{student.id}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0">
                      {status === "Present" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-teal-950/80 text-teal-300 border border-teal-500/40">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" /> Present
                        </span>
                      )}
                      {status === "Late" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-coral-950/80 text-coral-300 border border-coral-500/40">
                          <Clock className="h-3.5 w-3.5 text-coral-400" /> Late
                        </span>
                      )}
                      {status === "Absent" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-950/80 text-rose-300 border border-rose-500/40">
                          <XCircle className="h-3.5 w-3.5 text-rose-400" /> Absent
                        </span>
                      )}
                      {status === "Not Checked In" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-800 text-slate-200 border border-slate-700">
                          <Clock className="h-3.5 w-3.5 text-slate-400" /> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Check-in Details */}
                  <div className="mt-3 pt-3 border-t border-ink-soft/10 space-y-1.5 text-xs">
                    {record ? (
                      <>
                        <div className="flex items-center justify-between text-ink-soft/70">
                          <span className="text-[11px] font-bold">Check-in Time:</span>
                          <span className="font-mono font-bold text-ink bg-cream-dim px-2 py-0.5 rounded-lg">
                            {record.time}
                          </span>
                        </div>
                        {record.notes && (
                          <div className="bg-cream-dim/60 p-2 rounded-xl text-[11px] text-ink-soft italic">
                            "{record.notes}"
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Has not submitted check-in for {selectedDate}.
                      </p>
                    )}

                    {/* Email / Contact info */}
                    {student.email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-ink-soft/70 pt-1">
                        <Mail className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-4 pt-3 border-t border-ink-soft/10 flex items-center justify-between text-xs font-bold text-violet-600">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> View Profile & Info
                  </span>
                  <span className="text-[10px] text-ink-soft/50 group-hover:translate-x-0.5 transition-transform">
                    &rarr;
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* STUDENT DETAIL INFO MODAL */}
      <AnimatePresence>
        {infoModalStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-cream border border-ink-soft/15 rounded-3xl p-5 sm:p-6 shadow-2xl max-w-lg w-full relative my-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setInfoModalStudent(null)}
                className="absolute right-4 top-4 p-2 rounded-full text-ink-soft/60 hover:text-ink hover:bg-cream-dim transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-4 border-b border-ink-soft/10 pb-5">
                <UserAvatar
                  name={infoModalStudent.name}
                  avatarUrl={infoModalStudent.avatarUrl}
                  role={infoModalStudent.role}
                  size="xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-ink font-display truncate">
                      {infoModalStudent.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        infoModalStudent.isApproved
                          ? "bg-teal-950/80 text-teal-300 border border-teal-500/40"
                          : "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {infoModalStudent.isApproved ? "Verified Account" : "Pending Approval"}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-ink-soft/70 mt-0.5">
                    Student ID: #{infoModalStudent.id}
                  </p>
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="py-4 space-y-3.5 text-xs">
                <p className="font-bold uppercase tracking-wider text-[10px] text-ink-soft/60">
                  Account Details
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div className="bg-cream-dim/60 p-3 rounded-2xl border border-ink-soft/10">
                    <span className="text-[10px] font-bold text-ink-soft/60 block mb-0.5">
                      Email Address
                    </span>
                    <span className="font-semibold text-ink break-all">
                      {infoModalStudent.email || "Not provided"}
                    </span>
                  </div>

                  {/* Registered Date */}
                  <div className="bg-cream-dim/60 p-3 rounded-2xl border border-ink-soft/10">
                    <span className="text-[10px] font-bold text-ink-soft/60 block mb-0.5">
                      Date Joined
                    </span>
                    <span className="font-semibold text-ink">
                      {infoModalStudent.createdAt || "N/A"}
                    </span>
                  </div>

                  {/* Department / Course */}
                  {infoModalStudent.department && (
                    <div className="bg-cream-dim/60 p-3 rounded-2xl border border-ink-soft/10 col-span-1 sm:col-span-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-cyan-500 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-ink-soft/60 block">Department / Course</span>
                        <span className="font-semibold text-ink">{infoModalStudent.department}</span>
                      </div>
                    </div>
                  )}

                  {/* Enrolled Courses */}
                  {infoModalStudent.enrolledSubjects && infoModalStudent.enrolledSubjects.length > 0 && (
                    <div className="bg-cream-dim/60 p-3 rounded-2xl border border-ink-soft/10 col-span-1 sm:col-span-2">
                      <span className="text-[10px] font-bold text-ink-soft/60 block mb-1">
                        Enrolled Courses
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {infoModalStudent.enrolledSubjects.map((sb, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[11px] font-bold bg-violet-950/80 text-violet-300 border border-violet-500/40 rounded-lg"
                          >
                            {sb}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Today's Check-in Status Box */}
                <div className="pt-2">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-ink-soft/60 mb-2">
                    Check-in Status for {selectedDate}
                  </p>
                  <div className="bg-slate-900/90 border border-violet-500/30 p-4 rounded-2xl space-y-2 shadow-inner">
                    {modalStudentRecord ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100">Status:</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              modalStudentRecord.status === "Present"
                                ? "bg-teal-500 text-white"
                                : modalStudentRecord.status === "Late"
                                ? "bg-coral-500 text-white"
                                : "bg-rose-500 text-white"
                            }`}
                          >
                            {modalStudentRecord.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Check-in Time:</span>
                          <span className="font-mono font-bold text-white">{modalStudentRecord.time}</span>
                        </div>
                        {modalStudentRecord.notes && (
                          <div className="pt-1 text-[11px] text-slate-300 italic">
                            Notes: "{modalStudentRecord.notes}"
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                        <AlertCircle className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                        <span className="text-slate-200 text-sm font-semibold">No check-in record submitted yet for this date.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overall Attendance Statistics */}
                {modalStudentStats && (
                  <div className="pt-2">
                    <p className="font-bold uppercase tracking-wider text-[10px] text-ink-soft/60 mb-2">
                      Overall Attendance Statistics
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-teal-950/60 border border-teal-500/30 p-2.5 rounded-2xl">
                        <span className="text-[10px] font-bold text-teal-300 block">Attendance</span>
                        <span className="text-base font-black text-teal-400">
                          {modalStudentStats.percentage}%
                        </span>
                      </div>
                      <div className="bg-cyan-950/60 border border-cyan-500/30 p-2.5 rounded-2xl">
                        <span className="text-[10px] font-bold text-cyan-300 block">Total Days</span>
                        <span className="text-base font-black text-cyan-400">
                          {modalStudentStats.totalDays}
                        </span>
                      </div>
                      <div className="bg-violet-950/60 border border-violet-500/30 p-2.5 rounded-2xl">
                        <span className="text-[10px] font-bold text-violet-300 block">Present</span>
                        <span className="text-base font-black text-violet-400">
                          {modalStudentStats.presentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="mt-4 pt-3 border-t border-ink-soft/10 flex flex-col sm:flex-row gap-2">
                {infoModalStudent.email && (
                  <a
                    href={`mailto:${infoModalStudent.email}`}
                    className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold text-violet-300 bg-violet-950/80 hover:bg-violet-900/80 border border-violet-500/40 flex items-center justify-center gap-2 transition-all"
                  >
                    <Mail className="h-4 w-4" /> Email Student
                  </a>
                )}
                {onSelectStudent && (
                  <button
                    onClick={() => {
                      const st = infoModalStudent;
                      setInfoModalStudent(null);
                      onSelectStudent(st);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <User className="h-4 w-4" /> Full Calendar Profile
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
