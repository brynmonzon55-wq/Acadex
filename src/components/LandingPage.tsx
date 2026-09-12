import { useState } from "react";
import {
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowRight,
  BarChart3,
  Bell,
  Shield,
  ShieldCheck,
  MessageSquare,
  Play,
  RotateCcw,
  School,
  BookOpen,
  FileText,
  Megaphone,
  Users,
  Paperclip,
  FolderDown,
  Layers,
  Award,
  Hash,
} from "lucide-react";
import { UserRole } from "../types";
import type { AppTheme, AppThemeMode } from "../App";

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
  onQuickDemoLogin?: (role: UserRole) => void;
  theme: AppTheme;
  themeMode: AppThemeMode;
}

function getLandingThemeStyles(theme: AppTheme = "default") {
  switch (theme) {
    case "sakura":
      return {
        eyebrow: "bg-pink-300/15 border-pink-300/30 text-pink-200",
        eyebrowDot: "bg-pink-300",
        heroGradient: "from-white via-pink-200 to-rose-200",
        studentBtn: "bg-gradient-to-r from-pink-100 via-pink-200 to-rose-300 hover:from-white hover:to-pink-100 text-slate-950 shadow-[0_0_25px_rgba(253,164,175,0.45)] hover:shadow-[0_0_35px_rgba(253,164,175,0.65)]",
        teacherBtn: "bg-gradient-to-r from-rose-200 via-pink-200 to-pink-100 hover:from-white hover:to-rose-100 text-slate-950 shadow-[0_0_25px_rgba(251,113,133,0.45)] hover:shadow-[0_0_35px_rgba(251,113,133,0.65)]",
        simulatorHalo: "from-pink-300/30 via-rose-300/25 to-pink-400/30",
        simulatorBorder: "border-pink-300/30",
        simulatorAccent: "text-pink-200",
        gaugeStroke: "#f472b6",
        gaugeText: "text-pink-100",
        metric1: "text-pink-200",
        metric2: "text-rose-200",
        metric3: "text-pink-300",
        sectionTag: "text-pink-200",
        cardHoverStudent: "hover:border-pink-300 hover:shadow-[0_0_35px_rgba(253,164,175,0.35)]",
        cardHoverTeacher: "hover:border-rose-300 hover:shadow-[0_0_35px_rgba(251,113,133,0.35)]",
        studentIconBox: "bg-pink-400/20 border-pink-300/40 text-pink-200 shadow-[0_0_15px_rgba(253,164,175,0.3)]",
        teacherIconBox: "bg-rose-400/20 border-rose-300/40 text-rose-200 shadow-[0_0_15px_rgba(251,113,133,0.3)]",
      };

    case "spring":
      return {
        eyebrow: "bg-pink-500/15 border-pink-400/30 text-pink-300",
        eyebrowDot: "bg-pink-400",
        heroGradient: "from-pink-400 via-rose-300 to-emerald-300",
        studentBtn: "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 hover:from-pink-300 hover:to-rose-300 text-slate-950 shadow-[0_0_25px_rgba(244,114,182,0.4)] hover:shadow-[0_0_35px_rgba(244,114,182,0.6)]",
        teacherBtn: "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:shadow-[0_0_35px_rgba(52,211,153,0.6)]",
        simulatorHalo: "from-pink-500/40 via-rose-500/30 to-emerald-500/40",
        simulatorBorder: "border-pink-500/30",
        simulatorAccent: "text-pink-400",
        gaugeStroke: "#f472b6",
        gaugeText: "text-pink-300",
        metric1: "text-pink-400",
        metric2: "text-emerald-400",
        metric3: "text-rose-400",
        sectionTag: "text-pink-400",
        cardHoverStudent: "hover:border-pink-400 hover:shadow-[0_0_35px_rgba(244,114,182,0.3)]",
        cardHoverTeacher: "hover:border-emerald-400 hover:shadow-[0_0_35px_rgba(52,211,153,0.3)]",
        studentIconBox: "bg-pink-500/20 border-pink-400/40 text-pink-400 shadow-[0_0_15px_rgba(244,114,182,0.3)]",
        teacherIconBox: "bg-emerald-500/20 border-emerald-400/40 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]",
      };

    case "summer":
      return {
        eyebrow: "bg-amber-500/15 border-amber-400/30 text-amber-300",
        eyebrowDot: "bg-amber-400",
        heroGradient: "from-amber-400 via-orange-300 to-sky-300",
        studentBtn: "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.4)] hover:shadow-[0_0_35px_rgba(251,191,36,0.6)]",
        teacherBtn: "bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 hover:from-sky-300 hover:to-cyan-300 text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.4)] hover:shadow-[0_0_35px_rgba(56,189,248,0.6)]",
        simulatorHalo: "from-amber-500/40 via-orange-500/30 to-sky-500/40",
        simulatorBorder: "border-amber-500/30",
        simulatorAccent: "text-amber-400",
        gaugeStroke: "#fbbf24",
        gaugeText: "text-amber-300",
        metric1: "text-amber-400",
        metric2: "text-sky-400",
        metric3: "text-orange-400",
        sectionTag: "text-amber-400",
        cardHoverStudent: "hover:border-amber-400 hover:shadow-[0_0_35px_rgba(251,191,36,0.3)]",
        cardHoverTeacher: "hover:border-sky-400 hover:shadow-[0_0_35px_rgba(56,189,248,0.3)]",
        studentIconBox: "bg-amber-500/20 border-amber-400/40 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]",
        teacherIconBox: "bg-sky-500/20 border-sky-400/40 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]",
      };

    case "autumn":
      return {
        eyebrow: "bg-orange-500/15 border-orange-400/30 text-orange-300",
        eyebrowDot: "bg-orange-400",
        heroGradient: "from-orange-400 via-red-400 to-amber-300",
        studentBtn: "bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 hover:from-orange-300 hover:to-amber-300 text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6)]",
        teacherBtn: "bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 hover:from-red-400 hover:to-orange-400 text-slate-950 shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:shadow-[0_0_35px_rgba(239,68,68,0.6)]",
        simulatorHalo: "from-red-500/40 via-orange-500/30 to-amber-500/40",
        simulatorBorder: "border-orange-500/30",
        simulatorAccent: "text-orange-400",
        gaugeStroke: "#f97316",
        gaugeText: "text-orange-300",
        metric1: "text-orange-400",
        metric2: "text-amber-400",
        metric3: "text-red-400",
        sectionTag: "text-orange-400",
        cardHoverStudent: "hover:border-orange-400 hover:shadow-[0_0_35px_rgba(249,115,22,0.3)]",
        cardHoverTeacher: "hover:border-red-400 hover:shadow-[0_0_35px_rgba(239,68,68,0.3)]",
        studentIconBox: "bg-orange-500/20 border-orange-400/40 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]",
        teacherIconBox: "bg-red-500/20 border-red-400/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
      };

    case "winter":
      return {
        eyebrow: "bg-sky-500/15 border-sky-400/30 text-sky-200",
        eyebrowDot: "bg-sky-400",
        heroGradient: "from-sky-300 via-cyan-200 to-indigo-300",
        studentBtn: "bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-400 hover:from-sky-200 hover:to-cyan-200 text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.4)] hover:shadow-[0_0_35px_rgba(56,189,248,0.6)]",
        teacherBtn: "bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-400 hover:from-indigo-300 hover:to-sky-300 text-slate-950 shadow-[0_0_25px_rgba(129,140,248,0.4)] hover:shadow-[0_0_35px_rgba(129,140,248,0.6)]",
        simulatorHalo: "from-sky-500/40 via-cyan-500/30 to-indigo-500/40",
        simulatorBorder: "border-sky-500/30",
        simulatorAccent: "text-sky-300",
        gaugeStroke: "#38bdf8",
        gaugeText: "text-sky-200",
        metric1: "text-sky-300",
        metric2: "text-cyan-300",
        metric3: "text-indigo-300",
        sectionTag: "text-sky-300",
        cardHoverStudent: "hover:border-sky-300 hover:shadow-[0_0_35px_rgba(56,189,248,0.3)]",
        cardHoverTeacher: "hover:border-indigo-400 hover:shadow-[0_0_35px_rgba(129,140,248,0.3)]",
        studentIconBox: "bg-sky-500/20 border-sky-400/40 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]",
        teacherIconBox: "bg-indigo-500/20 border-indigo-400/40 text-indigo-300 shadow-[0_0_15px_rgba(129,140,248,0.3)]",
      };

    case "default":
    default:
      return {
        eyebrow: "bg-cyan-500/15 border-cyan-400/30 text-cyan-300",
        eyebrowDot: "bg-cyan-400",
        heroGradient: "from-cyan-400 via-sky-300 to-indigo-300",
        studentBtn: "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.4)] hover:shadow-[0_0_35px_rgba(251,191,36,0.6)]",
        teacherBtn: "bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)]",
        simulatorHalo: "from-cyan-500/40 via-violet-500/30 to-pink-500/40",
        simulatorBorder: "border-cyan-500/30",
        simulatorAccent: "text-cyan-400",
        gaugeStroke: "#00f0ff",
        gaugeText: "text-cyan-300",
        metric1: "text-cyan-400",
        metric2: "text-emerald-400",
        metric3: "text-fuchsia-400",
        sectionTag: "text-cyan-400",
        cardHoverStudent: "hover:border-amber-400 hover:shadow-[0_0_35px_rgba(251,191,36,0.3)]",
        cardHoverTeacher: "hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(0,240,255,0.3)]",
        studentIconBox: "bg-amber-500/20 border-amber-400/40 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]",
        teacherIconBox: "bg-cyan-500/20 border-cyan-400/40 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]",
      };
  }
}

interface SimulatedStudent {
  id: string;
  name: string;
  code: string;
  time: string;
  status: "Present" | "Late" | "Absent";
  rate: number;
  initials: string;
  avatarColor: string;
}

const INITIAL_SIMULATED_STUDENTS: SimulatedStudent[] = [
  {
    id: "1",
    name: "Jane Cruz",
    code: "STU-2026-014",
    time: "08:02 AM",
    status: "Present",
    rate: 96,
    initials: "JC",
    avatarColor: "from-cyan-400 to-indigo-500",
  },
  {
    id: "2",
    name: "Miguel Reyes",
    code: "STU-2026-027",
    time: "08:19 AM",
    status: "Late",
    rate: 81,
    initials: "MR",
    avatarColor: "from-purple-400 to-pink-500",
  },
  {
    id: "3",
    name: "Anna Lim",
    code: "STU-2026-033",
    time: "07:58 AM",
    status: "Present",
    rate: 94,
    initials: "AL",
    avatarColor: "from-pink-400 to-rose-500",
  },
  {
    id: "4",
    name: "Leo Park",
    code: "STU-2026-041",
    time: "08:00 AM",
    status: "Present",
    rate: 88,
    initials: "LP",
    avatarColor: "from-emerald-400 to-cyan-500",
  },
];

const NEW_CHECKIN_CANDIDATES: SimulatedStudent[] = [
  {
    id: "5",
    name: "Samantha Diaz",
    code: "STU-2026-052",
    time: "08:04 AM",
    status: "Present",
    rate: 92,
    initials: "SD",
    avatarColor: "from-amber-400 to-orange-500",
  },
  {
    id: "6",
    name: "Kenneth Santos",
    code: "STU-2026-068",
    time: "08:05 AM",
    status: "Present",
    rate: 95,
    initials: "KS",
    avatarColor: "from-teal-400 to-blue-500",
  },
  {
    id: "7",
    name: "Maria Gonzales",
    code: "STU-2026-077",
    time: "08:22 AM",
    status: "Late",
    rate: 84,
    initials: "MG",
    avatarColor: "from-fuchsia-400 to-violet-500",
  },
];

export default function LandingPage({
  onSelectRole,
  theme = "default",
  themeMode,
}: LandingPageProps) {
  const [simulatedStudents, setSimulatedStudents] = useState<SimulatedStudent[]>(INITIAL_SIMULATED_STUDENTS);
  const [activeRate, setActiveRate] = useState(92);
  const [recentFlash, setRecentFlash] = useState<string | null>(null);
  const [activeClassroomTab, setActiveClassroomTab] = useState<"stream" | "classwork" | "materials" | "people" | "attendance">("stream");

  const isNight = themeMode === "night";
  const tStyles = getLandingThemeStyles(theme);

  const simulateNewCheckIn = () => {
    const candidate = NEW_CHECKIN_CANDIDATES[Math.floor(Math.random() * NEW_CHECKIN_CANDIDATES.length)];
    const newStudent = {
      ...candidate,
      id: String(Date.now()),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    setSimulatedStudents((prev) => [newStudent, ...prev.slice(0, 4)]);
    setRecentFlash(newStudent.id);
    setActiveRate((prev) => Math.min(99, prev + 1));

    setTimeout(() => {
      setRecentFlash(null);
    }, 2000);
  };

  const resetSimulation = () => {
    setSimulatedStudents(INITIAL_SIMULATED_STUDENTS);
    setActiveRate(92);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Headline, Description & CTAs */}
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          {/* Eyebrow Pill */}
          <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-semibold backdrop-blur-md ${tStyles.eyebrow}`}>
            <School className="w-4 h-4" />
            <span>Virtual Classroom & Smart Attendance Suite</span>
          </div>

          {/* Display Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display text-white leading-[1.08]">
            Your complete<br className="hidden sm:inline" />
            classroom &<br />
            <span className={`bg-gradient-to-r ${tStyles.heroGradient} bg-clip-text text-transparent`}>
              attendance hub.
            </span>
          </h1>

          {/* Subtitle / Lead */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            Inspired by Google Classroom with integrated live attendance. Manage course streams, assign homework with file attachments, share study materials, and take 1-tap roll calls across all your classes.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
            <button
              onClick={() => onSelectRole("student")}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-extrabold text-sm sm:text-base hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${tStyles.studentBtn}`}
            >
              <GraduationCap className="w-5 h-5" />
              <span>Student Portal</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelectRole("teacher")}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-extrabold text-sm sm:text-base hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${tStyles.teacherBtn}`}
            >
              <Briefcase className="w-5 h-5" />
              <span>Teacher Portal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Interactive Simulator Card with Radiant Glowing Halo */}
        <div className="lg:col-span-5 w-full relative" id="live-simulator">
          {/* Luminous Background Halo */}
          <div className={`absolute -inset-1 bg-gradient-to-r ${tStyles.simulatorHalo} rounded-3xl blur-xl opacity-60 pointer-events-none`} />

          <div className={`relative rounded-2xl sm:rounded-3xl bg-slate-900/80 border ${tStyles.simulatorBorder} backdrop-blur-xl shadow-2xl overflow-hidden`}>
            {/* Window Header */}
            <div className="px-4 py-3 bg-white/[0.05] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className={`text-[11px] font-mono font-bold tracking-wider ${tStyles.simulatorAccent}`}>
                  CS-201 · LIVE
                </span>
              </div>
            </div>

            {/* Simulation Content */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Radial Gauge + Top Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-white/[0.04] p-4 rounded-2xl border border-white/[0.08]">
                <div className="sm:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative w-22 h-22 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-white/10"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        stroke={tStyles.gaugeStroke}
                        strokeDasharray={`${activeRate}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-500 filter drop-shadow-[0_0_6px_currentColor]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold font-display text-white">{activeRate}%</span>
                      <span className={`text-[9px] uppercase font-bold ${tStyles.gaugeText}`}>Rate</span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-7 space-y-1 text-left">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Class</span>
                  <h4 className="text-base font-bold text-white">CS-201 · Data Structures</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 34 Present
                    </span>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" /> 2 Late
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Student Check-in Feed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                  <span>Recent Check-ins</span>
                  <span className={`text-[10px] font-mono font-bold ${tStyles.simulatorAccent}`}>Live</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {simulatedStudents.map((st) => (
                    <div
                      key={st.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        recentFlash === st.id
                          ? "bg-cyan-500/25 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-[1.01]"
                          : "bg-white/[0.04] border-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${st.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-sm`}
                        >
                          {st.initials}
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-semibold text-white block leading-tight">{st.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{st.code}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-mono text-slate-300">{st.time}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            st.status === "Present"
                              ? "bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                              : "bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                          }`}
                        >
                          {st.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulation Control Bar */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={simulateNewCheckIn}
                  className={`flex-1 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 ${tStyles.simulatorBorder} ${tStyles.simulatorAccent}`}
                >
                  <Play className="w-3.5 h-3.5" /> Simulate Student Check-in
                </button>
                <button
                  onClick={resetSimulation}
                  title="Reset Simulator"
                  className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CHOOSE YOUR PORTAL SECTION */}
      {/* ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10" id="portals">
        <div className="text-center space-y-3 mb-12">
          <span className={`text-xs font-semibold font-mono uppercase tracking-widest ${tStyles.sectionTag}`}>
            Choose Your Portal
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
            Pick how you're using VARDES today.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Student Portal Card */}
          <div
            onClick={() => onSelectRole("student")}
            className={`group relative rounded-3xl bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 ${tStyles.cardHoverStudent} p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-xl shadow-xl hover:shadow-2xl`}
          >
            <div className="space-y-5 text-left">
              <div className={`w-14 h-14 rounded-2xl ${tStyles.studentIconBox} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                <GraduationCap className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-2xl font-bold font-display text-white group-hover:text-amber-300 transition-colors">
                  I'm a Student
                </h3>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                  Check in to classes and view your attendance history.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>One-tap check-in with your student account</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>View your attendance history & records</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Track enrolled subjects and class status</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Enter Student Portal <ArrowRight className="w-4 h-4" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRole("student");
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all ${tStyles.studentBtn}`}
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Teacher Portal Card */}
          <div
            onClick={() => onSelectRole("teacher")}
            className={`group relative rounded-3xl bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 ${tStyles.cardHoverTeacher} p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer backdrop-blur-xl shadow-xl hover:shadow-2xl`}
          >
            <div className="space-y-5 text-left">
              <div className={`w-14 h-14 rounded-2xl ${tStyles.teacherIconBox} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                <Briefcase className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-2xl font-bold font-display text-white group-hover:text-cyan-300 transition-colors">
                  I'm a Teacher
                </h3>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                  Manage classrooms, monitor check-ins, export reports.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Real-time live check-in monitoring</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Manage classrooms and student rosters</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Export attendance reports anytime (CSV)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Enter Teacher Portal <ArrowRight className="w-4 h-4" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRole("teacher");
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all ${tStyles.teacherBtn}`}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. GOOGLE CLASSROOM-STYLE VIRTUAL WORKSPACE SHOWCASE */}
      {/* ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10" id="classroom-hub">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md ${tStyles.eyebrow}`}>
            <School className="w-3.5 h-3.5" />
            <span>Google Classroom-Style Workspace</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Classrooms built for modern teaching & learning
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Everything your class needs in one intuitive interface: real-time announcement streams, assignment submission portals, downloadable syllabus materials, and 1-tap live roll call.
          </p>

          {/* Interactive Tab Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { id: "stream", label: "Class Stream", icon: Megaphone },
              { id: "classwork", label: "Classwork & Tasks", icon: FileText },
              { id: "materials", label: "Study Materials", icon: BookOpen },
              { id: "people", label: "People & Rosters", icon: Users },
              { id: "attendance", label: "1-Tap Roll Call", icon: CheckCircle2 },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeClassroomTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveClassroomTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                      : "bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Classroom Preview Frame */}
        <div className="relative rounded-3xl bg-slate-950/80 border border-white/15 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl overflow-hidden max-w-5xl mx-auto">
          {/* Classroom Header Banner */}
          <div className="relative rounded-2xl bg-gradient-to-r from-cyan-600/40 via-blue-600/30 to-indigo-900/50 border border-cyan-500/30 p-5 sm:p-6 mb-6 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
              <School className="w-32 h-32 text-cyan-300" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-cyan-500/30 text-cyan-300 border border-cyan-400/40">
                    Computer Science
                  </span>
                  <span className="text-xs text-slate-300">Period 2 • Room 402</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                  CS 101: Data Structures & Algorithms
                </h3>
                <p className="text-xs sm:text-sm text-cyan-200/80">Instructor: Dr. Sarah Vance</p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-center">
                <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/20 text-left shadow-lg">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Class Join Code</div>
                  <div className="text-sm font-mono font-extrabold text-cyan-300 tracking-wider">CS-882X</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="min-h-[280px]">
            {/* 1. STREAM VIEW */}
            {activeClassroomTab === "stream" && (
              <div className="space-y-4 text-left">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-xs">
                      SV
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Dr. Sarah Vance</div>
                      <div className="text-[11px] text-slate-400">Announcement • 2 hours ago</div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Hello everyone! Today we introduced binary search trees. Please review the slides below and complete the practice problem set due this Friday at 11:59 PM.
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-cyan-300 font-medium">
                      <Paperclip className="w-4 h-4 text-cyan-400" />
                      <span>Lecture_04_BST_Traversal.pdf (2.4 MB)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">PDF</span>
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-cyan-400" /> 4 Class Comments
                    </span>
                    <span className="text-[11px] text-cyan-400 font-medium">Add comment...</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CLASSWORK VIEW */}
            {activeClassroomTab === "classwork" && (
              <div className="space-y-3 text-left">
                {[
                  {
                    title: "Project 1: Binary Search Tree Implementation",
                    due: "Due Friday, 11:59 PM",
                    pts: "100 points",
                    status: "Assigned",
                    statusColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                  },
                  {
                    title: "Homework 3: Graph Traversal Algorithms",
                    due: "Due Tomorrow, 5:00 PM",
                    pts: "50 points",
                    status: "Turned In",
                    statusColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                  },
                  {
                    title: "Quiz 2: Big-O Complexity Analysis",
                    due: "Completed",
                    pts: "96 / 100 points",
                    status: "Graded",
                    statusColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-400/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{item.due}</span>
                          <span>•</span>
                          <span className="text-slate-300">{item.pts}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border self-start sm:self-center ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 3. MATERIALS VIEW */}
            {activeClassroomTab === "materials" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {[
                  { title: "Course Syllabus & Grading Policy 2026", type: "Syllabus", size: "480 KB" },
                  { title: "Week 4: BST & AVL Tree Cheatsheet", type: "Reference", size: "1.8 MB" },
                  { title: "Standard Algorithm Complexity Guide", type: "Guide", size: "950 KB" },
                  { title: "Online Interactive Algorithm Visualizer", type: "Web Link", size: "URL" },
                ].map((mat, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2 hover:border-violet-400/30 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {mat.type}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{mat.size}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{mat.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold pt-1">
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>Download Resource</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. PEOPLE VIEW */}
            {activeClassroomTab === "people" && (
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold uppercase text-cyan-400 tracking-wider">Teachers</div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                        SV
                      </div>
                      <span className="text-sm font-bold text-white">Dr. Sarah Vance (Lead Instructor)</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Teacher</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Classmates (28 Enrolled)</div>
                    <span className="text-[11px] text-cyan-400">Class Roster Active</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { name: "Alex Mercer", code: "STU-2026-001", rate: "98% Attendance" },
                      { name: "Chloe Zhao", code: "STU-2026-014", rate: "100% Attendance" },
                      { name: "Marcus Rivera", code: "STU-2026-042", rate: "94% Attendance" },
                      { name: "Elena Rostova", code: "STU-2026-088", rate: "96% Attendance" },
                    ].map((stu, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center">
                            {stu.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{stu.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{stu.code}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {stu.rate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. ATTENDANCE VIEW */}
            {activeClassroomTab === "attendance" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="text-xs text-slate-400 font-mono">Today's Class Session</div>
                    <h4 className="text-base font-bold text-white">Period 2 • Live Check-In Active</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
                      PIN: 482910
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Sync
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">26</div>
                    <div className="text-[11px] text-slate-300 font-medium">Present</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">2</div>
                    <div className="text-[11px] text-slate-300 font-medium">Late</div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="text-xl sm:text-2xl font-extrabold text-rose-400 font-mono">0</div>
                    <div className="text-[11px] text-slate-300 font-medium">Absent</div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
                  <span>Attendance rate for this course:</span>
                  <span className="font-bold text-cyan-300 font-mono">96.8% (Target: &gt;90%)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. COMPREHENSIVE 6-PILLAR FEATURES MATRIX — VARDES */}
      {/* ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10" id="features">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className={`text-xs font-semibold font-mono uppercase tracking-widest ${tStyles.sectionTag}`}>
            The Architecture of VARDES
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
            Six pillars built for trusted modern education
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            Every feature in VARDES is purpose-built to empower educators, verify students, and streamline classroom operations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pillar V: Verified */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/[0.08] hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all text-left space-y-3 backdrop-blur-md relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black font-display text-cyan-400/40 group-hover:text-cyan-400 transition-colors">V</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Pillar V</div>
              <h3 className="text-base font-bold text-white">Verified Accounts</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Unverified accounts remain locked until an approved teacher signs off. Hardened security rules protect classes, rosters, and grades from unauthorized access.
            </p>
          </div>

          {/* Pillar A: Attendance */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/[0.08] hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)] transition-all text-left space-y-3 backdrop-blur-md relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.25)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black font-display text-emerald-400/40 group-hover:text-emerald-400 transition-colors">A</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Pillar A</div>
              <h3 className="text-base font-bold text-white">Attendance Tracking</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              1-Tap roll call with instant Present, Late, and Absent markers, optional session PIN protection, and automated real-time tardy calculations.
            </p>
          </div>

          {/* Pillar R: Records */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/[0.08] hover:border-sky-400/40 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-all text-left space-y-3 backdrop-blur-md relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.25)]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black font-display text-sky-400/40 group-hover:text-sky-400 transition-colors">R</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-sky-400 font-bold uppercase tracking-wider">Pillar R</div>
              <h3 className="text-base font-bold text-white">Records & Analytics</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Permanent attendance logs, historical student trends, at-risk percentage alerts, and one-click exportable CSV reports for administration.
            </p>
          </div>

          {/* Pillar D: Directory */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/[0.08] hover:border-amber-400/40 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all text-left space-y-3 backdrop-blur-md relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.25)]">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black font-display text-amber-400/40 group-hover:text-amber-400 transition-colors">D</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">Pillar D</div>
              <h3 className="text-base font-bold text-white">Faculty Directory</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Comprehensive directory of teachers and faculty profiles tied to enrolled classes, allowing quick access to departments, bios, and office hours.
            </p>
          </div>

          {/* Pillar E: Engagement */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/[0.08] hover:border-pink-400/40 hover:shadow-[0_0_20px_rgba(244,114,182,0.2)] transition-all text-left space-y-3 backdrop-blur-md relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.25)]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black font-display text-pink-400/40 group-hover:text-pink-400 transition-colors">E</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-pink-400 font-bold uppercase tracking-wider">Pillar E</div>
              <h3 className="text-base font-bold text-white">Engagement & Messenger</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time 1-on-1 Class Messenger, announcements, unread notifications, file sharing, and threaded post discussions between educators and students.
            </p>
          </div>

          {/* Pillar S: Stream */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/[0.08] hover:border-violet-400/40 hover:shadow-[0_0_20px_rgba(167,139,250,0.2)] transition-all text-left space-y-3 backdrop-blur-md relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.25)]">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black font-display text-violet-400/40 group-hover:text-violet-400 transition-colors">S</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-violet-400 font-bold uppercase tracking-wider">Pillar S</div>
              <h3 className="text-base font-bold text-white">Class Stream & Tasks</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Google Classroom-style stream for assignments, lecture slide attachments, turn-in workflows with submissions, and teacher feedback with grades.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CALL TO ACTION FOOTER BANNER */}
      {/* ========================================================================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-3xl bg-slate-900/60 border border-white/10 p-8 sm:p-12 text-center overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
              Ready to experience your new classroom?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Enter your student or teacher portal to join class streams, manage coursework, and take roll call.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => onSelectRole("student")}
                className={`px-6 py-3 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 cursor-pointer ${tStyles.studentBtn}`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student Portal</span>
              </button>

              <button
                onClick={() => onSelectRole("teacher")}
                className={`px-6 py-3 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 cursor-pointer ${tStyles.teacherBtn}`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Teacher Portal</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
