import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  Search,
  X,
  ChevronDown,
  User as UserIcon,
  Check,
  CheckCheck,
  Trash2,
  Minimize2,
  Maximize2,
  Users,
  GraduationCap,
  Smile,
  FileText,
  Clock,
  ArrowLeft,
  School,
  Circle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, DirectMessage, MessengerConversation, UserRole } from "../types";
import { linkifyText } from "../lib/linkify";
import type { AppTheme, AppThemeMode } from "../App";
import {
  getUsers,
  getDirectMessagesBetween,
  getConversationsForUser,
  sendDirectMessage,
  markDirectMessagesAsRead,
  getUnreadDirectMessagesCount,
  deleteDirectMessage,
  formatTime,
  getUserPresence,
  isUserOnline,
} from "../lib/db";
import UserAvatar from "./UserAvatar";

import { processFileUpload } from "../lib/fileUtils";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Theme styling preset map for Class Messenger */
function getMessengerThemeStyles(theme: AppTheme = "default", mode: AppThemeMode = "night") {
  const isDay = mode === "day";

  switch (theme) {
    case "sakura":
      return {
        accentGradient: isDay
          ? "from-pink-300 via-pink-400 to-rose-300"
          : "from-pink-400 via-rose-400 to-pink-500",
        badgeColor: "bg-pink-400/20 text-pink-200 border-pink-300/30",
        myBubbleGradient: "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-slate-950 font-medium",
        myBubbleAttachment: "bg-pink-900/60 text-pink-100 hover:bg-pink-950",
        myBubbleMeta: "text-slate-900 font-semibold",
        primaryButton: "bg-gradient-to-r from-pink-200 via-pink-300 to-rose-300 hover:from-white hover:to-pink-200 text-slate-950 shadow-pink-400/25 font-bold",
        filterActive: "bg-pink-400 text-slate-950 font-bold",
        activeChatBorder: "border-pink-300 bg-pink-950/40",
        activeBadgeBg: "bg-pink-400/20 text-pink-200 border-pink-300/30",
        focusRing: "focus:border-pink-300",
        iconColor: "text-pink-300",
        contactsBtn: "bg-pink-400/20 hover:bg-pink-400/30 border-pink-300/30 text-pink-200",
        unreadBadge: "bg-pink-400 text-slate-950 font-bold",
      };
    case "spring":
      return {
        accentGradient: isDay
          ? "from-pink-500 to-rose-500"
          : "from-pink-600 to-rose-600",
        badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
        myBubbleGradient: "bg-gradient-to-r from-pink-600 to-rose-600 text-white",
        myBubbleAttachment: "bg-pink-900/60 text-pink-100 hover:bg-pink-950",
        myBubbleMeta: "text-pink-200",
        primaryButton: "bg-pink-600 hover:bg-pink-500 text-white shadow-pink-500/20",
        filterActive: "bg-pink-600 text-white",
        activeChatBorder: "border-pink-400 bg-pink-950/40",
        activeBadgeBg: "bg-pink-500/20 text-pink-300 border-pink-500/30",
        focusRing: "focus:border-pink-500",
        iconColor: "text-pink-400",
        contactsBtn: "bg-pink-500/20 hover:bg-pink-500/30 border-pink-500/30 text-pink-300",
        unreadBadge: "bg-pink-500 text-white",
      };
    case "summer":
      return {
        accentGradient: isDay
          ? "from-amber-500 to-orange-500"
          : "from-amber-600 to-orange-600",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        myBubbleGradient: "bg-gradient-to-r from-amber-600 to-orange-600 text-white",
        myBubbleAttachment: "bg-amber-900/60 text-amber-100 hover:bg-amber-950",
        myBubbleMeta: "text-amber-200",
        primaryButton: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20",
        filterActive: "bg-amber-600 text-white",
        activeChatBorder: "border-amber-400 bg-amber-950/40",
        activeBadgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        focusRing: "focus:border-amber-500",
        iconColor: "text-amber-400",
        contactsBtn: "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-300",
        unreadBadge: "bg-amber-500 text-white",
      };
    case "autumn":
      return {
        accentGradient: isDay
          ? "from-orange-500 to-red-600"
          : "from-orange-600 to-red-700",
        badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        myBubbleGradient: "bg-gradient-to-r from-orange-600 to-red-600 text-white",
        myBubbleAttachment: "bg-orange-900/60 text-orange-100 hover:bg-orange-950",
        myBubbleMeta: "text-orange-200",
        primaryButton: "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20",
        filterActive: "bg-orange-600 text-white",
        activeChatBorder: "border-orange-400 bg-orange-950/40",
        activeBadgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        focusRing: "focus:border-orange-500",
        iconColor: "text-orange-400",
        contactsBtn: "bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/30 text-orange-300",
        unreadBadge: "bg-orange-500 text-white",
      };
    case "winter":
      return {
        accentGradient: isDay
          ? "from-sky-500 to-blue-600"
          : "from-sky-600 to-indigo-700",
        badgeColor: "bg-sky-500/20 text-sky-200 border-sky-500/30",
        myBubbleGradient: "bg-gradient-to-r from-sky-600 to-blue-600 text-white",
        myBubbleAttachment: "bg-sky-900/60 text-sky-100 hover:bg-sky-950",
        myBubbleMeta: "text-sky-200",
        primaryButton: "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/20",
        filterActive: "bg-sky-600 text-white",
        activeChatBorder: "border-sky-300 bg-sky-950/40",
        activeBadgeBg: "bg-sky-500/20 text-sky-200 border-sky-500/30",
        focusRing: "focus:border-sky-400",
        iconColor: "text-sky-300",
        contactsBtn: "bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/30 text-sky-200",
        unreadBadge: "bg-sky-500 text-white",
      };
    case "default":
    default:
      return {
        accentGradient: "from-cyan-500 via-violet-600 to-fuchsia-600",
        badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        myBubbleGradient: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white",
        myBubbleAttachment: "bg-violet-900/60 text-violet-100 hover:bg-violet-950",
        myBubbleMeta: "text-violet-200",
        primaryButton: "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20",
        filterActive: "bg-violet-600 text-white",
        activeChatBorder: "border-cyan-400 bg-violet-950/40",
        activeBadgeBg: "bg-violet-500/20 text-violet-300 border-violet-500/30",
        focusRing: "focus:border-cyan-400",
        iconColor: "text-cyan-400",
        contactsBtn: "bg-violet-500/20 hover:bg-violet-500/30 border-violet-500/30 text-violet-300",
        unreadBadge: "bg-fuchsia-500 text-white",
      };
  }
}

interface ClassMessengerProps {
  currentUser: User;
  mode?: "floating" | "embedded";
  initialPartnerId?: string | null;
  onClose?: () => void;
  theme?: AppTheme;
  themeMode?: AppThemeMode;
}

export default function ClassMessenger({
  currentUser,
  mode = "floating",
  initialPartnerId = null,
  onClose,
  theme = "default",
  themeMode = "night",
}: ClassMessengerProps) {
  const [isOpen, setIsOpen] = useState(mode === "embedded" || !!initialPartnerId);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialPartnerId);
  const [conversations, setConversations] = useState<MessengerConversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "teacher" | "student">("all");
  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const [fileError, setFileError] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const styles = getMessengerThemeStyles(theme, themeMode);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isTeacher = currentUser.role === "teacher";

  // Reload conversations & unread count
  const refreshData = () => {
    const users = getUsers();
    setAllUsers(users);
    setConversations(getConversationsForUser(currentUser.id));
    setUnreadTotal(getUnreadDirectMessagesCount(currentUser.id));

    if (activePartnerId) {
      const activeMsgs = getDirectMessagesBetween(currentUser.id, activePartnerId);
      setMessages(activeMsgs);
      markDirectMessagesAsRead(activePartnerId, currentUser.id);
    }
  };

  useEffect(() => {
    refreshData();
    const handleDbUpdate = () => refreshData();
    window.addEventListener("db_updated", handleDbUpdate);

    // Global event listener to open a specific chat from any button in the app
    const handleOpenMessenger = (e: any) => {
      const partnerId = e.detail?.partnerId;
      if (partnerId && partnerId.toLowerCase() !== currentUser.id.toLowerCase()) {
        setActivePartnerId(partnerId);
        setIsOpen(true);
        setIsMinimized(false);
        setShowUserPicker(false);
        markDirectMessagesAsRead(partnerId, currentUser.id);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          inputRef.current?.focus();
        }, 100);
      }
    };

    window.addEventListener("open_messenger", handleOpenMessenger);

    return () => {
      window.removeEventListener("db_updated", handleDbUpdate);
      window.removeEventListener("open_messenger", handleOpenMessenger);
    };
  }, [currentUser.id, activePartnerId]);

  // Periodic tick to automatically refresh online/offline status every 30s
  const [, setPresenceTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setPresenceTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // When active partner changes, load messages & mark read
  useEffect(() => {
    if (activePartnerId) {
      const activeMsgs = getDirectMessagesBetween(currentUser.id, activePartnerId);
      setMessages(activeMsgs);
      markDirectMessagesAsRead(activePartnerId, currentUser.id);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [activePartnerId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activePartnerId && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const activePartner = activePartnerId
    ? allUsers.find((u) => u.id.toLowerCase() === activePartnerId.toLowerCase()) || {
        id: activePartnerId,
        name: conversations.find((c) => c.partnerId.toLowerCase() === activePartnerId.toLowerCase())?.partnerName || activePartnerId,
        role: conversations.find((c) => c.partnerId.toLowerCase() === activePartnerId.toLowerCase())?.partnerRole || "student",
        createdAt: "",
      }
    : null;

  const handleSend = () => {
    if ((!inputText.trim() && !attachment) || !activePartner) return;

    sendDirectMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatarUrl: currentUser.avatarUrl,
      recipientId: activePartner.id,
      recipientName: activePartner.name,
      recipientRole: activePartner.role,
      recipientAvatarUrl: activePartner.avatarUrl,
      content: inputText.trim(),
      attachmentName: attachment?.name,
      attachmentDataUrl: attachment?.dataUrl,
    });

    setInputText("");
    setAttachment(null);
    setFileError("");
    refreshData();
  };

  const handleFileChange = async (file: File | undefined) => {
    setFileError("");
    if (!file) return;
    try {
      const processed = await processFileUpload(file);
      setAttachment(processed);
    } catch (err: any) {
      setFileError(err?.message || "Could not process file. Try a smaller file.");
    }
  };

  const handleQuickEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // Filter available contacts for new conversation search
  const filteredUsers = allUsers
    .filter((u) => u.id.toLowerCase() !== currentUser.id.toLowerCase())
    .filter((u) => {
      if (roleFilter === "teacher") return u.role === "teacher";
      if (roleFilter === "student") return u.role === "student";
      return true;
    })
    .filter((u) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        (u.subject && u.subject.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q))
      );
    });

  // ---------------------------------------------------------------------------
  // Floating Messenger Button (Minimized or Closed State)
  // ---------------------------------------------------------------------------
  if (mode === "floating" && !isOpen) {
    return (
      <div id="floating-messenger-launcher" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] pointer-events-auto">
        <div className="relative group flex items-center justify-end">
          {/* Hover Tooltip (Shown on cursor hover) */}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/95 border border-slate-700/80 text-white text-xs font-bold whitespace-nowrap shadow-2xl shadow-black/80 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover:translate-x-0 backdrop-blur-md">
            <span>Class Messenger</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Compact Circular FAB Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              refreshData();
            }}
            aria-label="Open Class Messenger"
            title="Class Messenger"
            className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr ${styles.accentGradient} text-white shadow-2xl flex items-center justify-center border border-white/25 cursor-pointer backdrop-blur-md transition-shadow hover:shadow-lg`}
          >
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-6 transition-transform" />
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full shadow-sm" />

            {unreadTotal > 0 && (
              <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full ${styles.unreadBadge} text-[10px] font-black animate-pulse shadow-lg border border-slate-900 min-w-[18px] text-center leading-none`}>
                {unreadTotal}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Messenger Main Window Container
  // ---------------------------------------------------------------------------
  const containerClasses =
    mode === "floating"
      ? `fixed bottom-3 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 z-[100] w-auto sm:w-[420px] md:sm:w-[760px] sm:max-w-[760px] bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 backdrop-blur-2xl overflow-hidden flex flex-col transition-all duration-200 ${
          isMinimized ? "h-14" : "h-[540px] sm:h-[580px] max-h-[85vh]"
        }`
      : "w-full h-[640px] bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col";

  return (
    <div id="class-messenger-window" className={containerClasses}>
      {/* Top Header Bar */}
      <div className="px-4 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${styles.accentGradient} flex items-center justify-center text-white shrink-0 shadow-md`}>
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
                <span>Class Messenger</span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Live
                </span>
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {activePartner ? `Direct chat with ${activePartner.name}` : "Connect with teachers & classmates"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {mode === "floating" && (
            <button
              onClick={() => setIsMinimized((v) => !v)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </button>
          )}

          {mode === "floating" ? (
            <button
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Close Messenger"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )
          )}
        </div>
      </div>

      {/* Body Area (Collapsed when minimized) */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col sm:flex-row min-h-0 overflow-hidden">
          {/* Left Sidebar / Conversation Directory */}
          <div
            className={`w-full sm:w-72 bg-slate-950/60 border-r border-slate-800/80 flex flex-col shrink-0 ${
              activePartnerId ? "hidden sm:flex" : "flex"
            }`}
          >
            {/* Search & New Chat Controls */}
            <div className="p-3 border-b border-slate-800/80 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search teachers or classmates..."
                  className={`w-full pl-8 pr-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none ${styles.focusRing}`}
                />
              </div>

              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
                  {(["all", "teacher", "student"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-2 py-0.5 rounded-md capitalize transition-colors ${
                        roleFilter === r ? styles.filterActive : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {r === "all" ? "All" : r === "teacher" ? "Teachers" : "Classmates"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowUserPicker((v) => !v)}
                  className={`px-2 py-1 rounded-lg ${styles.contactsBtn} font-bold text-[10px] flex items-center gap-1 cursor-pointer`}
                >
                  <Users className="h-3 w-3" />
                  <span>{showUserPicker ? "Chats" : "Contacts"}</span>
                </button>
              </div>
            </div>

            {/* Conversation List OR Directory Contacts */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
              {showUserPicker || searchQuery.trim() ? (
                // Contacts Mode
                <div className="p-2 space-y-1">
                  <p className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    {searchQuery ? "Search Results" : "School Directory"}
                  </p>
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">No contacts found</div>
                  ) : (
                    filteredUsers.map((u) => {
                      const presence = getUserPresence(u);
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            setActivePartnerId(u.id);
                            setShowUserPicker(false);
                            setSearchQuery("");
                          }}
                          className="w-full p-2 rounded-xl hover:bg-slate-900 text-left flex items-center gap-2.5 transition-colors group cursor-pointer"
                        >
                          <div className="relative shrink-0">
                            <UserAvatar name={u.name} avatarUrl={u.avatarUrl} role={u.role} size="sm" />
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-slate-950 transition-colors ${
                                presence.isOnline
                                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                  : "bg-slate-500"
                              }`}
                              title={presence.isOnline ? "Online" : "Offline"}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold text-white group-hover:${styles.iconColor} truncate`}>
                                {u.name}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                                  u.role === "teacher"
                                    ? styles.badgeColor
                                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                }`}
                              >
                                {u.role}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                              <span>{u.subject || u.department || `ID: ${u.id}`}</span>
                              <span className="text-slate-600">&bull;</span>
                              <span
                                className={
                                  presence.isOnline
                                    ? "text-emerald-400 font-bold"
                                    : "text-slate-500"
                                }
                              >
                                {presence.isOnline ? "Online" : presence.timeAgoText}
                              </span>
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                // Active Conversations Mode
                <div>
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <MessageSquare className="h-6 w-6 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-400">No active direct messages</p>
                      <p className="text-[11px] text-slate-500">
                        Click "Contacts" above to start a conversation with a teacher or classmate.
                      </p>
                      <button
                        onClick={() => setShowUserPicker(true)}
                        className={`mt-2 px-3 py-1.5 rounded-xl ${styles.primaryButton} font-extrabold text-[11px] inline-flex items-center gap-1 cursor-pointer`}
                      >
                        <Users className="h-3 w-3" /> Find Someone
                      </button>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const isActive = activePartnerId?.toLowerCase() === conv.partnerId.toLowerCase();
                      const partnerUser = allUsers.find(
                        (u) =>
                          u.id.toLowerCase() === conv.partnerId.toLowerCase() ||
                          (u.uid && u.uid.toLowerCase() === conv.partnerId.toLowerCase())
                      );
                      const partnerPresence = getUserPresence(partnerUser || conv.partnerId);

                      return (
                        <button
                          key={conv.partnerId}
                          onClick={() => {
                            setActivePartnerId(conv.partnerId);
                            markDirectMessagesAsRead(conv.partnerId, currentUser.id);
                          }}
                          className={`w-full p-3 text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                            isActive
                              ? `${styles.activeChatBorder} border-l-2`
                              : "hover:bg-slate-900/80"
                          }`}
                        >
                          <div className="relative shrink-0">
                            <div className={`w-9 h-9 rounded-full ${styles.activeBadgeBg} font-black text-xs flex items-center justify-center`}>
                              {conv.partnerName.charAt(0)}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-slate-950 transition-colors ${
                                partnerPresence.isOnline
                                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                  : "bg-slate-500"
                              }`}
                              title={partnerPresence.isOnline ? "Online" : "Offline"}
                            />
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white truncate">{conv.partnerName}</span>
                              <span className="text-[9px] text-slate-500 shrink-0">
                                {timeAgo(conv.lastMessage.createdAt)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-1">
                              <p className="text-[11px] text-slate-400 truncate">
                                {conv.lastMessage.senderId.toLowerCase() === currentUser.id.toLowerCase() && (
                                  <span className="text-slate-500 font-semibold">You: </span>
                                )}
                                {conv.lastMessage.content || (conv.lastMessage.attachmentName ? "📎 Attachment" : "")}
                              </p>
                              {conv.unreadCount > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full ${styles.unreadBadge} text-[9px] font-black shrink-0`}>
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Pane / Active Chat Conversation */}
          <div className="flex-1 flex flex-col bg-slate-900/50 min-w-0">
            {activePartner ? (() => {
              const activePresence = getUserPresence(activePartner);
              return (
              <>
                {/* Active Partner Top Bar */}
                <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => setActivePartnerId(null)}
                      className="sm:hidden p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="relative shrink-0">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${styles.accentGradient} text-white font-black text-xs flex items-center justify-center`}>
                        {activePartner.name.charAt(0)}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-slate-950 transition-colors ${
                          activePresence.isOnline
                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                            : "bg-slate-500"
                        }`}
                        title={activePresence.isOnline ? "Online" : "Offline"}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{activePartner.name}</h4>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                            activePartner.role === "teacher"
                              ? styles.badgeColor
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          }`}
                        >
                          {activePartner.role}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] font-semibold flex items-center gap-1.5 ${
                          activePresence.isOnline ? "text-emerald-400" : "text-slate-400"
                        }`}
                      >
                        <Circle
                          className={`h-1.5 w-1.5 ${
                            activePresence.isOnline
                              ? "fill-emerald-400 text-emerald-400"
                              : "fill-slate-500 text-slate-500"
                          }`}
                        />
                        <span>{activePresence.isOnline ? "Active now" : activePresence.timeAgoText}</span>
                        <span className="text-slate-600">&bull;</span>
                        <span className="text-slate-500">ID: {activePartner.id}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    {activePartner.subject && (
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {activePartner.subject}
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="py-12 text-center space-y-2 max-w-xs mx-auto">
                      <div className={`w-12 h-12 rounded-full ${styles.activeBadgeBg} flex items-center justify-center mx-auto`}>
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <h4 className="text-xs font-bold text-white">Start the conversation</h4>
                      <p className="text-[11px] text-slate-400">
                        Send a message to {activePartner.name} ({activePartner.role}). {activePresence.isOnline ? "They are currently online." : `They are currently offline (${activePresence.timeAgoText.toLowerCase()}).`}
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId.toLowerCase() === currentUser.id.toLowerCase();
                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe && (
                            <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0 mb-1">
                              {m.senderName.charAt(0)}
                            </div>
                          )}

                          <div
                            className={`max-w-[78%] rounded-2xl p-3 text-xs shadow-md space-y-1.5 ${
                              isMe
                                ? `${styles.myBubbleGradient} rounded-br-none`
                                : "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none"
                            }`}
                          >
                            {m.content && (
                              <div className="leading-relaxed whitespace-pre-wrap">
                                {linkifyText(m.content, { inheritColor: isMe })}
                              </div>
                            )}

                            {m.attachmentDataUrl && (
                              <div className="pt-1">
                                <a
                                  href={m.attachmentDataUrl}
                                  download={m.attachmentName || "file"}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                                    isMe
                                      ? styles.myBubbleAttachment
                                      : "bg-slate-900 text-cyan-300 hover:bg-slate-950"
                                  }`}
                                >
                                  <Paperclip className="h-3 w-3" />
                                  <span>Download {m.attachmentName || "Attachment"}</span>
                                </a>
                              </div>
                            )}

                            <div
                              className={`flex items-center justify-end gap-1 text-[9px] ${
                                isMe ? styles.myBubbleMeta : "text-slate-400"
                              }`}
                            >
                              <span>{timeAgo(m.createdAt)}</span>
                              {isMe && (
                                <span className="inline-flex items-center">
                                  {m.read ? (
                                    <span title="Seen">
                                      <CheckCheck className="h-3 w-3 text-cyan-300" />
                                    </span>
                                  ) : (
                                    <span title="Delivered">
                                      <Check className="h-3 w-3 text-white/80" />
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Emoji Bar */}
                <div className="px-3 py-1 bg-slate-950/40 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
                  {["👍", "❤️", "🙌", "👏", "💡", "🔥", "📚", "✅"].map((em) => (
                    <button
                      key={em}
                      onClick={() => handleQuickEmoji(em)}
                      className="hover:scale-125 transition-transform p-0.5 rounded cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>

                {/* Composer Input Area */}
                <div className="p-3 bg-slate-950/90 border-t border-slate-800 space-y-2 shrink-0">
                  {attachment && (
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <span className="text-cyan-300 font-bold flex items-center gap-1 truncate">
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                        {attachment.name}
                      </span>
                      <button
                        onClick={() => setAttachment(null)}
                        className="text-rose-400 hover:text-rose-300 font-bold"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {fileError && <p className="text-[11px] text-rose-400 font-bold">{fileError}</p>}

                  <div className="flex items-center gap-2">
                    <label className={`p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:${styles.iconColor} border border-slate-800 cursor-pointer transition-colors shrink-0`}>
                      <Paperclip className="h-4 w-4" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0])}
                      />
                    </label>

                    <input
                      ref={inputRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={`Message ${activePartner.name}...`}
                      className={`flex-1 px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none ${styles.focusRing}`}
                    />

                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim() && !attachment}
                      className={`px-4 py-2 rounded-xl ${styles.primaryButton} disabled:opacity-40 font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0`}
                    >
                      <span>Send</span>
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </>
              );
            })() : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className={`w-14 h-14 rounded-3xl bg-slate-950 border border-slate-800 ${styles.iconColor} flex items-center justify-center shadow-inner`}>
                  <MessageSquare className="h-7 w-7" />
                </div>
                <div className="max-w-xs space-y-1">
                  <h4 className="text-sm font-extrabold text-white">Select a Conversation</h4>
                  <p className="text-xs text-slate-400">
                    Choose a conversation on the left, or search for teachers & classmates to start direct messaging.
                  </p>
                </div>
                <button
                  onClick={() => setShowUserPicker(true)}
                  className={`px-4 py-2 rounded-xl ${styles.primaryButton} font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md`}
                >
                  <Users className="h-3.5 w-3.5" /> Browse Contacts Directory
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Global helper function to trigger opening a chat with any user from any component */
export function openDirectMessage(partnerId: string) {
  window.dispatchEvent(new CustomEvent("open_messenger", { detail: { partnerId } }));
}
