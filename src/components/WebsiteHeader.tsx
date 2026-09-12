import { useState } from "react";
import {
  Palette,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  GraduationCap,
  Briefcase,
  Menu,
  X,
  Layers,
  CalendarCheck2,
} from "lucide-react";
import { User, UserRole } from "../types";
import type { AppTheme, AppThemeMode } from "../App";
import ThemeSelector from "./ThemeSelector";

interface WebsiteHeaderProps {
  currentView: "landing" | "roles" | "login" | "dashboard";
  onNavigate: (view: "landing" | "roles" | "login" | "dashboard") => void;
  onSelectRole?: (role: UserRole) => void;
  currentUser: User | null;
  onLogout: () => void;
  theme: AppTheme;
  themeMode: AppThemeMode;
  particlesEnabled?: boolean;
  performanceMode?: boolean;
  onThemeChange: (theme: AppTheme) => void;
  onThemeModeChange: (mode: AppThemeMode) => void;
  onToggleParticles?: () => void;
  onTogglePerformanceMode?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

function getHeaderThemeButton(theme: AppTheme = "default") {
  switch (theme) {
    case "sakura":
      return "bg-gradient-to-r from-pink-100 via-pink-200 to-rose-300 hover:from-white hover:to-pink-100 text-slate-950 font-bold shadow-[0_0_16px_rgba(253,164,175,0.45)]";
    case "spring":
      return "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 hover:from-pink-300 hover:to-rose-300 text-slate-950 shadow-[0_0_16px_rgba(244,114,182,0.4)]";
    case "summer":
      return "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.4)]";
    case "autumn":
      return "bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 hover:from-orange-300 hover:to-amber-300 text-slate-950 shadow-[0_0_16px_rgba(249,115,22,0.4)]";
    case "winter":
      return "bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-400 hover:from-sky-200 hover:to-cyan-200 text-slate-950 shadow-[0_0_16px_rgba(56,189,248,0.4)]";
    case "default":
    default:
      return "bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-[0_0_16px_rgba(0,240,255,0.4)]";
  }
}

export default function WebsiteHeader({
  currentView,
  onNavigate,
  onSelectRole,
  currentUser,
  onLogout,
  theme,
  themeMode,
  particlesEnabled = true,
  performanceMode = false,
  onThemeChange,
  onThemeModeChange,
  onToggleParticles,
  onTogglePerformanceMode,
  isFullscreen,
  onToggleFullscreen,
}: WebsiteHeaderProps) {
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerBtnStyle = getHeaderThemeButton(theme);

  // If particlesEnabled is passed, use it directly; otherwise fall back to inverted performanceMode
  const isParticlesOn = particlesEnabled !== undefined ? particlesEnabled : !performanceMode;

  const handleToggleParticles = () => {
    if (onToggleParticles) {
      onToggleParticles();
    } else if (onTogglePerformanceMode) {
      onTogglePerformanceMode();
    }
  };

  const toggleThemeMode = () => {
    onThemeModeChange(themeMode === "night" ? "day" : "night");
  };

  const handlePortalClick = (role: UserRole) => {
    if (onSelectRole) {
      onSelectRole(role);
    }
    onNavigate("login");
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/40 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => onNavigate("landing")}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-violet-500/30 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:scale-105 group-hover:border-cyan-400/60 transition-all">
            <CalendarCheck2 className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg font-display tracking-tight text-white group-hover:text-cyan-200 transition-colors">
              VARDES
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden md:block tracking-wide">
              Verified • Attendance • Records • Directory • Engagement • Stream
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            onClick={() => onNavigate("landing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === "landing"
                ? "text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            Overview
          </button>
          <a
            href="#classroom-hub"
            onClick={(e) => {
              if (currentView !== "landing") {
                e.preventDefault();
                onNavigate("landing");
                setTimeout(() => {
                  document.getElementById("classroom-hub")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Classrooms
          </a>
          <a
            href="#live-simulator"
            onClick={(e) => {
              if (currentView !== "landing") {
                e.preventDefault();
                onNavigate("landing");
                setTimeout(() => {
                  document.getElementById("live-simulator")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Live Demo
          </a>
          <a
            href="#portals"
            onClick={(e) => {
              if (currentView !== "landing") {
                e.preventDefault();
                onNavigate("landing");
                setTimeout(() => {
                  document.getElementById("portals")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Portals
          </a>
          <a
            href="#features"
            onClick={(e) => {
              if (currentView !== "landing") {
                e.preventDefault();
                onNavigate("landing");
                setTimeout(() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Features
          </a>
        </nav>

        {/* Right Controls: Theme + Mode + Fullscreen + Auth Action */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Theme Switcher Popover (Desktop / Tablet) */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              title="Switch Seasonal Theme"
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 transition-all backdrop-blur-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Palette className="w-4 h-4 text-cyan-400 transition-transform group-hover:rotate-12" />
              <span className="hidden xl:inline text-xs font-bold capitalize">{theme}</span>
            </button>

            {showThemePicker && (
              <div className="absolute top-12 right-0 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-slate-900/95 border border-white/15 rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[11px] font-bold uppercase text-cyan-400 font-display flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> Seasonal Theme & Atmosphere
                  </span>
                  <button
                    onClick={() => setShowThemePicker(false)}
                    className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded-lg hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
                <ThemeSelector
                  currentTheme={theme}
                  themeMode={themeMode}
                  onSelectTheme={(newTheme) => {
                    onThemeChange(newTheme);
                    setShowThemePicker(false);
                  }}
                  onThemeModeChange={onThemeModeChange}
                  variant="compact"
                />
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" /> Background Particles
                    </span>
                    <span className="text-[9px] text-slate-400">Turn floating particles on or off</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleParticles}
                    title={isParticlesOn ? "Turn off particles" : "Turn on particles"}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isParticlesOn
                        ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                        : "bg-slate-800 text-slate-400 border border-white/10 hover:text-white"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isParticlesOn ? "bg-slate-950 animate-pulse" : "bg-slate-500"}`} />
                    <span>{isParticlesOn ? "ON" : "OFF"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Night / Day Mode Toggle (Desktop / Tablet) */}
          <button
            onClick={toggleThemeMode}
            title={`Switch to ${themeMode === "night" ? "Day" : "Night"} mode`}
            className="hidden sm:flex p-2 sm:px-2.5 sm:py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 transition-all backdrop-blur-md active:scale-95 items-center gap-1.5 cursor-pointer"
          >
            {themeMode === "night" ? (
              <Moon className="w-4 h-4 text-cyan-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
            <span className="hidden md:inline text-xs font-bold capitalize">
              {themeMode === "night" ? "Night" : "Day"}
            </span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            className="hidden md:flex p-2 sm:px-2.5 sm:py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-300 transition-all backdrop-blur-md active:scale-95 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Primary Action Button based on Auth State */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => onNavigate("dashboard")}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {currentUser.role === "teacher" ? <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="truncate">My Portal</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => onNavigate("roles")}
                className="hidden md:inline-flex px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/[0.05] border border-white/10 hover:border-cyan-400/40 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer backdrop-blur-md"
              >
                Choose Role
              </button>
              <button
                onClick={() => onNavigate("roles")}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer ${headerBtnStyle}`}
              >
                <span>Get Started</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-5 border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl space-y-3">
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => {
                onNavigate("landing");
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-bold text-slate-200 text-left"
            >
              Overview
            </button>
            <button
              onClick={() => {
                onNavigate("roles");
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300 text-left"
            >
              Select Portal
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePortalClick("student")}
              className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4" /> Student Sign In
            </button>
            <button
              onClick={() => handlePortalClick("teacher")}
              className="px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300 flex items-center gap-1.5"
            >
              <Briefcase className="w-4 h-4" /> Teacher Portal
            </button>
          </div>

          {/* Mobile Theme & Mode Controls */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" /> Theme Mode
              </span>
              <button
                onClick={toggleThemeMode}
                className="px-3 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5"
              >
                {themeMode === "night" ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Night</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Day</span>
                  </>
                )}
              </button>
            </div>

            <ThemeSelector
              currentTheme={theme}
              themeMode={themeMode}
              onSelectTheme={(newTheme) => {
                onThemeChange(newTheme);
              }}
              onThemeModeChange={onThemeModeChange}
              variant="compact"
            />
          </div>
        </div>
      )}
    </header>
  );
}
