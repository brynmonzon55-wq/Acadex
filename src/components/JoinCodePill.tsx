import React, { useState } from 'react';
import { School, Key, Check } from 'lucide-react';

export interface JoinCodePillProps {
  code: string;
  className?: string;
  onJoin?: (code: string) => void;
  isEnrolled?: boolean;
}

function safeCopy(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string) {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  } catch (err) {
    console.error("Could not copy code", err);
  }
}

export const JoinCodePill: React.FC<JoinCodePillProps> = ({
  code,
  className: classTitle,
  onJoin,
  isEnrolled,
}) => {
  const [copied, setCopied] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    safeCopy(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (onJoin && !isEnrolled) {
      onJoin(code);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={
        isEnrolled
          ? `Enrolled in ${classTitle || code} (Click to copy code: ${code})`
          : onJoin
          ? `Click to join class ${classTitle ? `(${classTitle})` : ''} and copy code: ${code}`
          : `Click to copy class join code: ${code}`
      }
      className="inline-flex items-center gap-1.5 align-middle mx-0.5 my-0.5 px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white text-[11px] font-extrabold shadow-sm transition-all cursor-pointer select-none"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 shrink-0 text-emerald-100" />
          <span>{onJoin && !isEnrolled ? `Joining & Copied ${code}!` : `Copied ${code}!`}</span>
        </>
      ) : isEnrolled ? (
        <>
          <Check className="h-3 w-3 shrink-0 text-emerald-100" />
          <span>
            Enrolled: {classTitle ? `${classTitle} (${code})` : code}
          </span>
        </>
      ) : (
        <>
          <School className="h-3 w-3 shrink-0" />
          <span>
            Join Class: {code}
            {classTitle ? ` (${classTitle})` : ''}
          </span>
        </>
      )}
    </button>
  );
};

export default JoinCodePill;

