import { useState, useEffect } from "react";
import { User, UserRole } from "./types";
import {
  initDB,
  logoutUser,
  attachRealtimeListeners,
  attachSecurityLogsListener,
  attachDirectMessagesListener,
  attachSubmissionsListener,
  updateUserActivity
} from "./lib/db";
import { auth, db } from "./lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import RoleSelection from "./components/RoleSelection";
import LoginForm from "./components/LoginForm";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import GoogleOnboardingModal from "./components/GoogleOnboardingModal";
import AnimatedThemeBackground from "./components/AnimatedThemeBackground";
import WebsiteHeader from "./components/WebsiteHeader";
import LandingPage from "./components/LandingPage";
import LogoutConfirmModal from "./components/LogoutConfirmModal";

export type AppTheme = "default" | "sakura" | "spring" | "summer" | "autumn" | "winter";
export type AppThemeMode = "night" | "day";

const THEME_STORAGE_KEY = "attendance_system_theme";
const THEME_MODE_STORAGE_KEY = "attendance_system_theme_mode";
const PARTICLES_STORAGE_KEY = "attendance_particles_enabled";

function getStoredTheme(): AppTheme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (
    stored === "default" ||
    stored === "sakura" ||
    stored === "spring" ||
    stored === "summer" ||
    stored === "autumn" ||
    stored === "winter"
  ) {
    return stored as AppTheme;
  }
  return "default";
}

function getStoredThemeMode(): AppThemeMode {
  const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY);
  if (stored === "night" || stored === "day") {
    return stored as AppThemeMode;
  }
  return "night"; // Default to Night mode
}

function getStoredParticlesEnabled(): boolean {
  const stored = localStorage.getItem(PARTICLES_STORAGE_KEY);
  if (stored === null) {
    const legacyPerf = localStorage.getItem("attendance_perf_mode");
    if (legacyPerf === "true") return false;
    return true; // Particles enabled by default
  }
  return stored === "true";
}

export default function App() {
  const [currentView, setCurrentView] = useState<"landing" | "roles" | "login" | "dashboard">("landing");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [theme, setTheme] = useState<AppTheme>(getStoredTheme);
  const [themeMode, setThemeMode] = useState<AppThemeMode>(getStoredThemeMode);
  const [particlesEnabled, setParticlesEnabled] = useState<boolean>(getStoredParticlesEnabled);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  };

  useEffect(() => {
    document.documentElement.classList.remove(
      "theme-default",
      "theme-darker",
      "theme-sakura",
      "theme-spring",
      "theme-summer",
      "theme-autumn",
      "theme-winter",
      "mode-night",
      "mode-day",
      "dark"
    );
    document.documentElement.classList.add(`theme-${theme}`);
    document.documentElement.classList.add(`mode-${themeMode}`);
    document.documentElement.classList.add("dark");
  }, [theme, themeMode]);

  // Explicit theme pick handler
  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  // Explicit night / day mode toggle handler
  const handleThemeModeChange = (newMode: AppThemeMode) => {
    setThemeMode(newMode);
    localStorage.setItem(THEME_MODE_STORAGE_KEY, newMode);
  };

  const toggleParticles = () => {
    setParticlesEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(PARTICLES_STORAGE_KEY, String(next));
      return next;
    });
  };

  useEffect(() => {
    // Initialize Database
    initDB();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force the ID token to fully resolve before touching Firestore.
          // Opening listeners/reads in the same tick onAuthStateChanged
          // fires can race ahead of the SDK's own credential handshake -
          // Firestore then sees request.auth as still null and denies
          // EVERY collection, even ones gated by a plain signedIn() rule
          // (matches the empty authInfo.providerInfo seen in the console).
          // Once denied, an onSnapshot listener doesn't self-heal, so real
          // data (comments, attachments, rosters...) is left stuck as an
          // empty local cache until a manual "Refresh connection" or full
          // reload. Awaiting this first removes that race.
          await firebaseUser.getIdToken();

          attachRealtimeListeners();

          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            const profile = snap.data() as User;
            setCurrentUser(profile);
            setSelectedRole(profile.role);
            setCurrentView("dashboard");

            // These two listeners are additionally gated on rules that
            // depend on the caller's role/id (security_logs:
            // isApprovedTeacher(); direct_messages: sender/recipient
            // match) - they can only be opened now that the profile above
            // has resolved. See
            // Attendance-Hub-permission-errors-fix-plan.md, fixes 1 & 2.
            if (profile.role === "teacher" && profile.isApproved === true) {
              attachSecurityLogsListener();
            }
            if (profile.id) {
              attachDirectMessagesListener(profile.id);
            }
            attachSubmissionsListener(profile);
          }
        } catch (err) {
          console.error("Error restoring session:", err);
        }
      }
      setCheckingSession(false);
    });

    return () => unsubscribe();
  }, []);

  // Active Presence heartbeat for logged-in user
  useEffect(() => {
    if (!currentUser?.id) return;

    // Immediately mark as active
    updateUserActivity(currentUser.id);

    // Heartbeat every 45 seconds
    const interval = setInterval(() => {
      updateUserActivity(currentUser.id);
    }, 45000);

    // Debounced activity handler for user interaction
    let lastRecorded = Date.now();
    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastRecorded > 30000) {
        lastRecorded = now;
        updateUserActivity(currentUser.id);
      }
    };

    window.addEventListener("click", handleUserInteraction, { passive: true });
    window.addEventListener("keydown", handleUserInteraction, { passive: true });
    window.addEventListener("focus", handleUserInteraction, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      window.removeEventListener("focus", handleUserInteraction);
    };
  }, [currentUser?.id]);

  const handleRequestLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    const userToLogOut = currentUser;
    setCurrentUser(null);
    setSelectedRole(null);
    setCurrentView("landing");
    logoutUser(userToLogOut).catch((err) => console.error("Error signing out:", err));
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentView("login");
  };

  const handleNavigate = (view: "landing" | "roles" | "login" | "dashboard") => {
    setCurrentView(view);
    if (view === "roles") {
      setSelectedRole(null);
    }
  };

  const needsStudentOnboarding =
    currentUser !== null &&
    currentUser.role === "student" &&
    (!currentUser.department ||
      !currentUser.department.trim() ||
      currentUser.id.startsWith("google_"));

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-cyan-400 font-bold font-display animate-pulse">Loading Acadex...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] text-ink selection:bg-cyan-500/30 selection:text-cyan-300 antialiased font-sans flex flex-col justify-between relative overflow-x-hidden" id="app-root">
      <AnimatedThemeBackground theme={theme} mode={themeMode} particlesEnabled={particlesEnabled} />

      {/* Global Modern Website Header */}
      <WebsiteHeader
        currentView={currentView}
        onNavigate={handleNavigate}
        onSelectRole={handleSelectRole}
        currentUser={currentUser}
        onLogout={handleRequestLogout}
        theme={theme}
        themeMode={themeMode}
        particlesEnabled={particlesEnabled}
        onThemeChange={handleThemeChange}
        onThemeModeChange={handleThemeModeChange}
        onToggleParticles={toggleParticles}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      <main className="flex-grow flex flex-col justify-start relative z-10 w-full">
        {/* VIEW 1: LANDING PAGE (Main Website View) */}
        {currentView === "landing" && (
          <LandingPage
            onSelectRole={handleSelectRole}
            theme={theme}
            themeMode={themeMode}
          />
        )}

        {/* VIEW 2: ROLE SELECTION MODAL / PAGE */}
        {currentView === "roles" && (
          <RoleSelection
            onSelectRole={handleSelectRole}
            onBackToHome={() => setCurrentView("landing")}
            theme={theme}
            themeMode={themeMode}
          />
        )}

        {/* VIEW 3: LOGIN / REGISTRATION FORM */}
        {currentView === "login" && selectedRole !== null && currentUser === null && (
          <LoginForm
            role={selectedRole}
            onBack={() => setCurrentView("roles")}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setCurrentView("dashboard");
            }}
            theme={theme}
            themeMode={themeMode}
          />
        )}

        {/* VIEW 4: STUDENT DASHBOARD */}
        {currentView === "dashboard" && currentUser !== null && currentUser.role === "student" && (
          <StudentDashboard
            user={currentUser}
            onLogout={handleRequestLogout}
            theme={theme}
            onThemeChange={handleThemeChange}
            themeMode={themeMode}
            onThemeModeChange={handleThemeModeChange}
          />
        )}

        {/* VIEW 5: TEACHER DASHBOARD */}
        {currentView === "dashboard" && currentUser !== null && currentUser.role === "teacher" && (
          <TeacherDashboard
            user={currentUser}
            onLogout={handleRequestLogout}
            theme={theme}
            onThemeChange={handleThemeChange}
            themeMode={themeMode}
            onThemeModeChange={handleThemeModeChange}
          />
        )}

        {/* Modal requiring students who signed in with Google to enter their Student ID and Department/Course */}
        {needsStudentOnboarding && currentUser && (
          <GoogleOnboardingModal
            user={currentUser}
            onComplete={(updated) => setCurrentUser(updated)}
            onLogout={handleRequestLogout}
          />
        )}

        {/* Global Logout Confirmation Modal */}
        <LogoutConfirmModal
          isOpen={showLogoutModal}
          user={currentUser}
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
          theme={theme}
          themeMode={themeMode}
        />
      </main>

      <footer className="py-6 border-t border-white/[0.08] text-center text-xs text-slate-400 font-medium font-sans relative z-10 backdrop-blur-md bg-slate-950/40 shrink-0 pb-[calc(18px+env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-display">Acadex</span>
            <span className="text-slate-500">&bull;</span>
            <span>Classroom & Attendance Management</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} Acadex &bull; Made by Bryn Monzon
          </div>
        </div>
      </footer>
    </div>
  );
}
