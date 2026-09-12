import type { ReactNode } from 'react';
import { Video } from 'lucide-react';
import { JoinCodePill } from '../components/JoinCodePill';

// Matches http(s) URLs or Join Codes / Join Class mentions (e.g. 🔑 Join Code: RLLKXL (bnfjhnfjh) or Join Class: RLLKXL)
const COMBINED_PATTERN =
  /(https?:\/\/[^\s<]+)|((?:🔑\s*)?join\s*(?:code|class|section)\s*:\s*([A-Za-z0-9_-]{4,12})(?:\s*\(([^)\n\r]+)\))?)/gi;

/**
 * Checks if a string already contains a join code mention or specific code.
 */
export function hasJoinCode(text: string | undefined | null, code?: string): boolean {
  if (!text) return false;
  if (code) {
    return text.toUpperCase().includes(code.toUpperCase());
  }
  return /join\s*(?:code|class|section)\s*:/i.test(text);
}

/**
 * Strips common trailing punctuation (periods, commas, closing parens, etc.)
 * off a matched URL so "check meet.google.com/abc-defg-hij." doesn't turn the
 * trailing period into part of the link. Keeps a closing paren if it balances
 * an opening paren that's actually part of the URL.
 */
function trimTrailingPunctuation(url: string): { clean: string; trailing: string } {
  const match = url.match(/[)\].,!?;:'"]+$/);
  if (!match) return { clean: url, trailing: '' };

  let trailing = match[0];
  let clean = url.slice(0, url.length - trailing.length);

  while (
    trailing.startsWith(')') &&
    (clean.split('(').length - 1) > (clean.split(')').length - 1)
  ) {
    clean += ')';
    trailing = trailing.slice(1);
  }

  return { clean, trailing };
}

export interface LinkifyOptions {
  /** Tailwind classes applied to a regular (non-Meet) link. */
  linkClassName?: string;
  /**
   * When true, regular links skip the default color classes and just inherit
   * whatever text color surrounds them (with an underline). Useful inside
   * colored chat bubbles where a hardcoded link color might not read well.
   */
  inheritColor?: boolean;
  /** Optional callback when a user clicks to join a class via code pill */
  onJoinCode?: (code: string) => void;
  /** Optional check if user is already enrolled */
  isEnrolled?: (code: string) => boolean;
}

const DEFAULT_LINK_CLASS =
  'font-semibold text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40 underline-offset-2 break-all';
const INHERIT_LINK_CLASS =
  'underline decoration-2 underline-offset-2 font-bold hover:opacity-80 break-all';

/**
 * Scans plain text for http(s) links and class join codes, turning them into
 * clean interactive pills or clickable <a> tags.
 *
 * - Google Meet links (meet.google.com/...) are rendered as clean "Join Google Meet" pills.
 * - Join Codes (e.g. "🔑 Join Code: RLLKXL (bnfjhnfjh)" or "Join Code: RLLKXL") are rendered
 *   as clean, clickable Google-Meet-styled green pills with 1-click copy & join.
 * - Other URLs are converted to standard clickable links.
 */
export function linkifyText(text: string | undefined | null, options: LinkifyOptions = {}): ReactNode {
  if (!text) return text;

  // Quick check before regex matching
  if (!text.includes('http://') && !text.includes('https://') && !/join\s*(?:code|class|section)/i.test(text)) {
    return text;
  }

  const linkClassName =
    options.linkClassName ?? (options.inheritColor ? INHERIT_LINK_CLASS : DEFAULT_LINK_CLASS);

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  COMBINED_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = COMBINED_PATTERN.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex));
    }

    const [rawMatch, urlMatch, , joinCode, joinClassName] = match;

    if (urlMatch) {
      const { clean: url, trailing } = trimTrailingPunctuation(urlMatch);
      const isMeetLink = /^https?:\/\/meet\.google\.com\//i.test(url);

      if (isMeetLink) {
        nodes.push(
          <a
            key={`meet-${key++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 mx-0.5 px-2.5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-extrabold shadow-sm transition-colors align-middle"
          >
            <Video className="h-3 w-3 shrink-0" />
            Join Google Meet
          </a>
        );
      } else {
        nodes.push(
          <a
            key={`link-${key++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={linkClassName}
          >
            {url}
          </a>
        );
      }

      if (trailing) {
        nodes.push(trailing);
      }
    } else if (joinCode) {
      const isEnrolled = options.isEnrolled ? options.isEnrolled(joinCode) : false;
      nodes.push(
        <JoinCodePill
          key={`join-${key++}`}
          code={joinCode}
          className={joinClassName?.trim()}
          onJoin={options.onJoinCode}
          isEnrolled={isEnrolled}
        />
      );
    }

    lastIndex = matchIndex + rawMatch.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length === 0 ? text : nodes;
}
