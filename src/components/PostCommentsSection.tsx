import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Lock,
  Send,
  Trash2,
  GraduationCap,
  ChevronDown,
  MessageSquare
} from "lucide-react";
import { PostComment, ClassPost, User } from "../types";
import {
  getComments,
  addComment,
  deleteComment,
  getUsers
} from "../lib/db";
import { linkifyText } from "../lib/linkify";
import { openDirectMessage } from "./ClassMessenger";

interface PostCommentsSectionProps {
  post: ClassPost;
  currentUser: User;
  isTeacher?: boolean;
  studentsList?: User[];
}

export default function PostCommentsSection({
  post,
  currentUser,
  isTeacher = false,
  studentsList = [],
}: PostCommentsSectionProps) {
  const [allPostComments, setAllPostComments] = useState<PostComment[]>([]);
  
  // Toggles for opening comments (starts collapsed with clickable buttons)
  const [showClassComments, setShowClassComments] = useState(false);
  const [showPrivateComments, setShowPrivateComments] = useState(false);
  
  // Input states
  const [classCommentInput, setClassCommentInput] = useState("");
  const [privateCommentInput, setPrivateCommentInput] = useState("");
  
  // For teachers: which student thread they are currently viewing/replying to
  const [selectedTargetStudentId, setSelectedTargetStudentId] = useState<string>("");

  // Load all comments for this post
  const loadComments = () => {
    const all = getComments()
      .filter((c) => c.postId === post.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    setAllPostComments(all);
  };

  useEffect(() => {
    loadComments();

    const handleDbUpdated = () => {
      loadComments();
    };

    window.addEventListener("db_updated", handleDbUpdated);
    return () => window.removeEventListener("db_updated", handleDbUpdated);
  }, [post.id]);

  // Determine full roster of students for teacher dropdown
  const availableStudents = useMemo(() => {
    if (studentsList && studentsList.length > 0) return studentsList;
    const allUsers = getUsers();
    return allUsers.filter((u) => u.role === "student");
  }, [studentsList]);

  // Set default target student for teacher if not set
  useEffect(() => {
    if (isTeacher && !selectedTargetStudentId && availableStudents.length > 0) {
      const studentWithComments = availableStudents.find((s) =>
        allPostComments.some(
          (c) =>
            c.commentType === "private" &&
            (c.targetStudentId?.toLowerCase() === s.id.toLowerCase() ||
              c.authorId.toLowerCase() === s.id.toLowerCase())
        )
      );
      if (studentWithComments) {
        setSelectedTargetStudentId(studentWithComments.id);
      } else {
        setSelectedTargetStudentId(availableStudents[0].id);
      }
    }
  }, [isTeacher, availableStudents, allPostComments, selectedTargetStudentId]);

  // Split into Class Comments vs Private Comments
  const classComments = useMemo(() => {
    return allPostComments.filter((c) => c.commentType !== "private");
  }, [allPostComments]);

  const privateComments = useMemo(() => {
    const rawPrivate = allPostComments.filter((c) => c.commentType === "private");

    if (!isTeacher) {
      // Student only sees private comments where they are the author or target
      const myId = currentUser.id.toLowerCase();
      return rawPrivate.filter(
        (c) =>
          c.authorId.toLowerCase() === myId ||
          (c.targetStudentId && c.targetStudentId.toLowerCase() === myId)
      );
    }

    // Teacher view: filter by selectedTargetStudentId if chosen, else show all
    if (!selectedTargetStudentId || selectedTargetStudentId === "all") {
      return rawPrivate;
    }

    const targetId = selectedTargetStudentId.toLowerCase();
    return rawPrivate.filter(
      (c) =>
        c.targetStudentId?.toLowerCase() === targetId ||
        c.authorId.toLowerCase() === targetId
    );
  }, [allPostComments, isTeacher, currentUser.id, selectedTargetStudentId]);

  // Total private comments count visible to current user
  const totalPrivateCount = useMemo(() => {
    if (isTeacher) {
      return allPostComments.filter((c) => c.commentType === "private").length;
    }
    const myId = currentUser.id.toLowerCase();
    return allPostComments.filter(
      (c) =>
        c.commentType === "private" &&
        (c.authorId.toLowerCase() === myId ||
          (c.targetStudentId && c.targetStudentId.toLowerCase() === myId))
    ).length;
  }, [allPostComments, isTeacher, currentUser.id]);

  // Submit Class Comment
  const handleSendClassComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!classCommentInput.trim()) return;

    addComment({
      postId: post.id,
      classId: post.classId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: classCommentInput.trim(),
      commentType: "class",
    });

    setClassCommentInput("");
    loadComments();
    setShowClassComments(true);
  };

  // Submit Private Comment
  const handleSendPrivateComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!privateCommentInput.trim()) return;

    let targetStudentId = "";
    if (isTeacher) {
      if (!selectedTargetStudentId || selectedTargetStudentId === "all") {
        if (availableStudents.length > 0) {
          targetStudentId = availableStudents[0].id;
        }
      } else {
        targetStudentId = selectedTargetStudentId;
      }
    } else {
      // For student, target is themselves
      targetStudentId = currentUser.id;
    }

    addComment({
      postId: post.id,
      classId: post.classId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: privateCommentInput.trim(),
      commentType: "private",
      targetStudentId: targetStudentId || undefined,
    });

    setPrivateCommentInput("");
    loadComments();
    setShowPrivateComments(true);
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId);
    loadComments();
  };

  // Format readable time
  const formatCommentDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (isToday) return `Today, ${timeStr}`;
      return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
    } catch {
      return isoStr;
    }
  };

  const selectedStudentObj = availableStudents.find(
    (s) => s.id.toLowerCase() === selectedTargetStudentId.toLowerCase()
  );

  const isBothOpen = showClassComments && showPrivateComments;

  return (
    <div className="w-full pt-2.5 border-t border-ink-soft/10 mt-2 space-y-3">
      {/* ========================================================================= */}
      {/* THE CLICKABLE BAR IN THE BEGINNING: Left = Class, Far Right = Private     */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* LEFT: Click to toggle Class Comments */}
        <button
          type="button"
          onClick={() => setShowClassComments((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${
            showClassComments
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
              : "bg-slate-900/80 text-ink-soft hover:text-ink hover:bg-slate-800 border border-slate-800/80"
          }`}
        >
          <Globe className="h-3.5 w-3.5 text-teal-400" />
          <span>
            {classComments.length > 0
              ? `${classComments.length} class ${classComments.length === 1 ? "comment" : "comments"}`
              : "Add class comment..."}
          </span>
          <ChevronDown
            className={`h-3 w-3 text-ink-soft transition-transform duration-200 ${
              showClassComments ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* FAR RIGHT: Click to toggle Private Comments */}
        <button
          type="button"
          onClick={() => setShowPrivateComments((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all ml-auto ${
            showPrivateComments
              ? "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm"
              : "bg-slate-900/80 text-fuchsia-400/90 hover:text-fuchsia-300 hover:bg-slate-800 border border-fuchsia-900/30"
          }`}
        >
          <Lock className="h-3.5 w-3.5 text-fuchsia-400" />
          <span>
            {totalPrivateCount > 0
              ? `${totalPrivateCount} private ${totalPrivateCount === 1 ? "comment" : "comments"}`
              : "Private comments"}
          </span>
          <ChevronDown
            className={`h-3 w-3 text-fuchsia-400/70 transition-transform duration-200 ${
              showPrivateComments ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* EXPANDED CONTENT (Appears when clicked)                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {(showClassComments || showPrivateComments) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pt-1"
          >
            <div
              className={`w-full gap-3 items-start ${
                isBothOpen
                  ? "grid grid-cols-1 md:grid-cols-2"
                  : "flex flex-col"
              }`}
            >
              {/* LEFT COLUMN / SECTION: CLASS COMMENTS */}
              {showClassComments && (
                <div className="w-full p-3 bg-slate-950/50 border border-teal-500/25 rounded-2xl flex flex-col space-y-2.5">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-teal-500/20">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-teal-500/15 text-teal-400">
                          <Globe className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-ink">Class comments</span>
                          <span className="text-[10px] text-teal-400/80 ml-2">Public</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-teal-300 bg-teal-950/80 border border-teal-500/30 rounded-full font-mono">
                          {classComments.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowClassComments(false)}
                          className="text-[10px] text-ink-soft hover:text-ink cursor-pointer p-0.5"
                          title="Close"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    {classComments.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {classComments.map((c) => {
                          const isAuthor = c.authorId.toLowerCase() === currentUser.id.toLowerCase();
                          const canDelete = isAuthor || isTeacher;

                          return (
                            <div
                              key={c.id}
                              className="p-2 bg-slate-900/90 border border-slate-800/80 rounded-xl text-xs space-y-0.5 hover:border-teal-500/30 transition-all group"
                            >
                              <div className="flex items-center justify-between gap-1 text-[11px]">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-bold text-teal-300 truncate">
                                    {c.authorName}
                                  </span>
                                  {c.authorId.toLowerCase().includes("teacher") || c.authorId === "111111" ? (
                                    <span className="px-1 py-0.2 text-[8px] font-extrabold bg-violet-500/25 text-violet-300 rounded border border-violet-500/40">
                                      Teacher
                                    </span>
                                  ) : null}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[9px] font-mono text-ink-soft/70">
                                    {formatCommentDate(c.createdAt)}
                                  </span>
                                  {!isAuthor && (
                                    <button
                                      type="button"
                                      onClick={() => openDirectMessage(c.authorId)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-violet-400 hover:text-violet-300 rounded cursor-pointer transition-all"
                                      title={`Direct Message ${c.authorName}`}
                                    >
                                      <MessageSquare className="h-3 w-3" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(c.id)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-rose-400 hover:text-rose-300 rounded cursor-pointer transition-all"
                                      title="Delete comment"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="text-ink text-[11px] leading-relaxed break-words font-sans">
                                {linkifyText(c.content, {
                                  linkClassName:
                                    "font-semibold text-teal-400 hover:text-teal-300 underline underline-offset-2 break-all",
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-ink-soft/50 italic py-1 px-1">
                        No class comments yet. Type below to start the discussion!
                      </p>
                    )}
                  </div>

                  {/* Composer */}
                  <form onSubmit={handleSendClassComment} className="pt-1.5 border-t border-slate-800/60 flex gap-1.5">
                    <input
                      type="text"
                      value={classCommentInput}
                      onChange={(e) => setClassCommentInput(e.target.value)}
                      placeholder="Add a class comment..."
                      className="flex-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/70 rounded-xl focus:outline-none focus:border-teal-400 text-ink placeholder:text-ink-soft/40 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!classCommentInput.trim()}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 rounded-xl cursor-pointer transition-all shrink-0 flex items-center justify-center shadow-sm"
                      title="Post class comment"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* FAR RIGHT COLUMN / SECTION: PRIVATE COMMENTS */}
              {showPrivateComments && (
                <div className="w-full p-3 bg-slate-950/50 border border-fuchsia-500/25 rounded-2xl flex flex-col space-y-2.5">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-fuchsia-500/20">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-fuchsia-500/15 text-fuchsia-400">
                          <Lock className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-ink">Private comments</span>
                          <span className="text-[10px] text-fuchsia-400/80 ml-2">
                            {isTeacher ? "Teacher & Student only" : "Private with Teacher"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-fuchsia-300 bg-fuchsia-950/80 border border-fuchsia-500/30 rounded-full font-mono">
                          {privateComments.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPrivateComments(false)}
                          className="text-[10px] text-ink-soft hover:text-ink cursor-pointer p-0.5"
                          title="Close"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Teacher Student Selector */}
                    {isTeacher && availableStudents.length > 0 && (
                      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-fuchsia-500/20 rounded-xl text-xs">
                        <GraduationCap className="h-3 w-3 text-fuchsia-400 shrink-0 ml-1" />
                        <select
                          value={selectedTargetStudentId}
                          onChange={(e) => setSelectedTargetStudentId(e.target.value)}
                          className="flex-1 bg-slate-950 text-ink text-[11px] font-bold py-1 px-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-fuchsia-400 truncate"
                        >
                          <option value="all">All Student Threads ({totalPrivateCount})</option>
                          {availableStudents.map((s) => {
                            const count = allPostComments.filter(
                              (c) =>
                                c.commentType === "private" &&
                                (c.targetStudentId?.toLowerCase() === s.id.toLowerCase() ||
                                  c.authorId.toLowerCase() === s.id.toLowerCase())
                            ).length;
                            return (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.id}) {count > 0 ? `• [${count}]` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    {/* Private Comments List */}
                    {privateComments.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {privateComments.map((c) => {
                          const isAuthor = c.authorId.toLowerCase() === currentUser.id.toLowerCase();
                          const canDelete = isAuthor || isTeacher;

                          return (
                            <div
                              key={c.id}
                              className="p-2 bg-fuchsia-950/20 border border-fuchsia-900/30 rounded-xl text-xs space-y-0.5 hover:border-fuchsia-500/40 transition-all group"
                            >
                              <div className="flex items-center justify-between gap-1 text-[11px]">
                                <div className="flex items-center gap-1.5 truncate">
                                  <Lock className="h-2.5 w-2.5 text-fuchsia-400 shrink-0" />
                                  <span className="font-bold text-fuchsia-300 truncate">
                                    {c.authorName}
                                  </span>
                                  {isTeacher && c.targetStudentId && (
                                    <span className="text-[9px] font-mono text-ink-soft/60 truncate">
                                      (Re: {availableStudents.find((s) => s.id.toLowerCase() === c.targetStudentId?.toLowerCase())?.name || c.targetStudentId})
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[9px] font-mono text-ink-soft/70">
                                    {formatCommentDate(c.createdAt)}
                                  </span>
                                  {!isAuthor && (
                                    <button
                                      type="button"
                                      onClick={() => openDirectMessage(c.authorId)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-fuchsia-400 hover:text-fuchsia-300 rounded cursor-pointer transition-all"
                                      title={`Direct Message ${c.authorName}`}
                                    >
                                      <MessageSquare className="h-3 w-3" />
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(c.id)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-rose-400 hover:text-rose-300 rounded cursor-pointer transition-all"
                                      title="Delete comment"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="text-ink text-[11px] leading-relaxed break-words font-sans">
                                {linkifyText(c.content, {
                                  linkClassName:
                                    "font-semibold text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-2 break-all",
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-ink-soft/50 italic py-1 px-1">
                        {isTeacher
                          ? selectedStudentObj
                            ? `No private comments with ${selectedStudentObj.name}.`
                            : "No private comments."
                          : "No private comments with teacher."}
                      </p>
                    )}
                  </div>

                  {/* Composer */}
                  <form onSubmit={handleSendPrivateComment} className="pt-1.5 border-t border-slate-800/60 flex gap-1.5">
                    <input
                      type="text"
                      value={privateCommentInput}
                      onChange={(e) => setPrivateCommentInput(e.target.value)}
                      placeholder={
                        isTeacher
                          ? selectedStudentObj
                            ? `Private comment to ${selectedStudentObj.name}...`
                            : "Add private comment..."
                          : "Add private comment to teacher..."
                      }
                      className="flex-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/70 rounded-xl focus:outline-none focus:border-fuchsia-400 text-ink placeholder:text-ink-soft/40 font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!privateCommentInput.trim()}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 disabled:hover:bg-fuchsia-600 rounded-xl cursor-pointer transition-all shrink-0 flex items-center justify-center shadow-sm"
                      title="Send private comment"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

