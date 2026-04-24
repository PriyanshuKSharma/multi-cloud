import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

type PageHeroTone = 'blue' | 'purple' | 'cyan' | 'emerald' | 'orange' | 'indigo' | 'pink' | 'slate';
type PageHeroChipTone = 'default' | 'blue' | 'purple' | 'cyan' | 'emerald' | 'orange' | 'indigo' | 'pink';

interface PageHeroChip {
  label: string;
  tone?: PageHeroChipTone;
}

interface PageHeroGuide {
  title: string;
  purpose: string;
  actions: string[];
}

interface PageHeroProps {
  id?: string;
  tone?: PageHeroTone;
  eyebrow?: string;
  eyebrowIcon?: React.ReactNode;
  title: string;
  titleIcon?: React.ReactNode;
  description?: string;
  chips?: PageHeroChip[];
  guide?: PageHeroGuide;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

interface PageHeroToneStyle {
  border: string;
  background: string;
  glowA: string;
  glowB: string;
  collapsedBg: string;
  title: string;
  description: string;
  eyebrow: string;
  collapseButton: string;
  actionButton: string;
}

const toneMapDark: Record<PageHeroTone, PageHeroToneStyle> = {
  blue: {
    border: 'border-blue-400/28',
    background: 'from-[#101a2d] via-[#0f1727] to-[#111e33]',
    glowA: 'bg-blue-500/15',
    glowB: 'bg-indigo-500/12',
    collapsedBg: 'bg-[#101827]',
    title: 'text-white',
    description: 'text-slate-300/90',
    eyebrow: 'border-blue-300/35 bg-blue-500/12 text-blue-100',
    collapseButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
    actionButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
  },
  purple: {
    border: 'border-blue-400/26',
    background: 'from-[#111b2e] via-[#0f1727] to-[#132036]',
    glowA: 'bg-blue-500/14',
    glowB: 'bg-violet-500/10',
    collapsedBg: 'bg-[#101827]',
    title: 'text-white',
    description: 'text-slate-300/90',
    eyebrow: 'border-blue-300/30 bg-blue-500/10 text-blue-100',
    collapseButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
    actionButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
  },
  cyan: {
    border: 'border-cyan-400/26',
    background: 'from-[#0f1d2b] via-[#0f1727] to-[#112133]',
    glowA: 'bg-cyan-500/13',
    glowB: 'bg-blue-500/11',
    collapsedBg: 'bg-[#101827]',
    title: 'text-white',
    description: 'text-slate-300/90',
    eyebrow: 'border-cyan-300/30 bg-cyan-500/10 text-cyan-100',
    collapseButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
    actionButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
  },
  emerald: {
    border: 'border-emerald-400/26',
    background: 'from-[#10231f] via-[#101a1e] to-[#112922]',
    glowA: 'bg-emerald-500/14',
    glowB: 'bg-teal-500/10',
    collapsedBg: 'bg-[#111b1a]',
    title: 'text-white',
    description: 'text-slate-300/90',
    eyebrow: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100',
    collapseButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
    actionButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
  },
  orange: {
    border: 'border-amber-400/28',
    background: 'from-[#2a1b14] via-[#1a1719] to-[#291f16]',
    glowA: 'bg-amber-500/15',
    glowB: 'bg-orange-500/11',
    collapsedBg: 'bg-[#1b1815]',
    title: 'text-white',
    description: 'text-slate-300/90',
    eyebrow: 'border-amber-300/30 bg-amber-500/10 text-amber-100',
    collapseButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
    actionButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
  },
  indigo: {
    border: 'border-indigo-400/28',
    background: 'from-[#111d33] via-[#101726] to-[#12203a]',
    glowA: 'bg-indigo-500/15',
    glowB: 'bg-blue-500/12',
    collapsedBg: 'bg-[#101827]',
    title: 'text-white',
    description: 'text-slate-300/90',
    eyebrow: 'border-indigo-300/30 bg-indigo-500/10 text-indigo-100',
    collapseButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
    actionButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
  },
  pink: {
    border: 'border-blue-400/26',
    background: 'from-[#111d30] via-[#101726] to-[#152137]',
    glowA: 'bg-blue-500/14',
    glowB: 'bg-slate-500/10',
    collapsedBg: 'bg-[#101827]',
    title: 'text-white',
    description: 'text-slate-300/90',
    eyebrow: 'border-blue-300/30 bg-blue-500/10 text-blue-100',
    collapseButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
    actionButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
  },
  slate: {
    border: 'border-slate-500/55',
    background: 'from-[#172132] via-[#111b2a] to-[#152236]',
    glowA: 'bg-slate-500/12',
    glowB: 'bg-blue-500/8',
    collapsedBg: 'bg-[#101827]',
    title: 'text-white',
    description: 'text-slate-300/90',
    eyebrow: 'border-slate-400/45 bg-slate-700/20 text-slate-100',
    collapseButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
    actionButton: 'border-slate-600/70 bg-slate-900/75 text-slate-100 hover:bg-slate-800/85',
  },
};

const toneMapLight: Record<PageHeroTone, PageHeroToneStyle> = {
  blue: {
    border: 'border-blue-200',
    background: 'from-[#edf4ff] via-[#f8fbff] to-[#edf5ff]',
    glowA: 'bg-blue-300/24',
    glowB: 'bg-indigo-300/16',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-blue-200 bg-white/85 text-slate-700',
    collapseButton: 'border-blue-200 bg-white text-slate-700 hover:bg-blue-50',
    actionButton: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  },
  purple: {
    border: 'border-indigo-200',
    background: 'from-[#eef3ff] via-[#f8fbff] to-[#f0f4ff]',
    glowA: 'bg-indigo-300/20',
    glowB: 'bg-blue-300/12',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-indigo-200 bg-white/80 text-slate-700',
    collapseButton: 'border-indigo-200 bg-white text-slate-700 hover:bg-indigo-50',
    actionButton: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  },
  cyan: {
    border: 'border-cyan-200',
    background: 'from-[#ecf7ff] via-[#f8fbff] to-[#eff7ff]',
    glowA: 'bg-cyan-300/18',
    glowB: 'bg-blue-300/12',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-cyan-200 bg-white/80 text-slate-700',
    collapseButton: 'border-cyan-200 bg-white text-slate-700 hover:bg-cyan-50',
    actionButton: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  },
  emerald: {
    border: 'border-emerald-200',
    background: 'from-[#edf9f3] via-[#f9fdfb] to-[#f0faf5]',
    glowA: 'bg-emerald-300/22',
    glowB: 'bg-teal-300/13',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-emerald-200 bg-white/80 text-slate-700',
    collapseButton: 'border-emerald-200 bg-white text-slate-700 hover:bg-emerald-50',
    actionButton: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  },
  orange: {
    border: 'border-amber-200',
    background: 'from-[#fff4e8] via-[#fffaf5] to-[#fff6ee]',
    glowA: 'bg-amber-300/23',
    glowB: 'bg-orange-300/14',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-amber-200 bg-white/80 text-slate-700',
    collapseButton: 'border-amber-200 bg-white text-slate-700 hover:bg-amber-50',
    actionButton: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  },
  indigo: {
    border: 'border-indigo-200',
    background: 'from-[#edf2ff] via-[#f8fbff] to-[#eef3ff]',
    glowA: 'bg-indigo-300/23',
    glowB: 'bg-blue-300/14',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-indigo-200 bg-white/80 text-slate-700',
    collapseButton: 'border-indigo-200 bg-white text-slate-700 hover:bg-indigo-50',
    actionButton: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  },
  pink: {
    border: 'border-blue-200',
    background: 'from-[#eef4ff] via-[#f9fbff] to-[#eff4ff]',
    glowA: 'bg-blue-300/23',
    glowB: 'bg-slate-300/14',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-blue-200 bg-white/80 text-slate-700',
    collapseButton: 'border-blue-200 bg-white text-slate-700 hover:bg-blue-50',
    actionButton: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  },
  slate: {
    border: 'border-slate-200',
    background: 'from-[#f6f8fb] via-[#fbfcfe] to-[#f4f8fd]',
    glowA: 'bg-slate-300/20',
    glowB: 'bg-gray-300/14',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-slate-200 bg-white/80 text-slate-700',
    collapseButton: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    actionButton: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  },
};

const chipToneMapDark: Record<PageHeroChipTone, string> = {
  default: 'border-slate-500/55 bg-slate-900/45 text-slate-200',
  blue: 'border-blue-400/35 bg-blue-500/10 text-blue-100',
  purple: 'border-indigo-400/35 bg-indigo-500/10 text-indigo-100',
  cyan: 'border-cyan-400/35 bg-cyan-500/10 text-cyan-100',
  emerald: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100',
  orange: 'border-amber-400/35 bg-amber-500/10 text-amber-100',
  indigo: 'border-indigo-400/35 bg-indigo-500/10 text-indigo-100',
  pink: 'border-blue-400/35 bg-blue-500/10 text-blue-100',
};

const chipToneMapLight: Record<PageHeroChipTone, string> = {
  default: 'border-slate-200 bg-white/85 text-slate-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  purple: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  orange: 'border-amber-200 bg-amber-50 text-amber-700',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  pink: 'border-blue-200 bg-blue-50 text-blue-700',
};

const toKey = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const PageHero: React.FC<PageHeroProps> = ({
  id,
  tone = 'blue',
  eyebrow,
  eyebrowIcon,
  title,
  titleIcon,
  description,
  chips = [],
  guide,
  actions,
  children,
  collapsible = true,
  defaultCollapsed = true,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const toneStyle = isLight ? toneMapLight[tone] : toneMapDark[tone];
  const chipToneMap = isLight ? chipToneMapLight : chipToneMapDark;
  const collapseStorageKey = React.useMemo(
    () => `page-hero-collapsed:${id || toKey(title)}`,
    [id, title]
  );
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    if (!collapsible) return false;
    if (typeof window === 'undefined') return defaultCollapsed;
    const persisted = window.localStorage.getItem(collapseStorageKey);
    if (persisted === null) return defaultCollapsed;
    return persisted === '1';
  });

  React.useEffect(() => {
    if (!collapsible) return;
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(collapseStorageKey, collapsed ? '1' : '0');
  }, [collapsible, collapseStorageKey, collapsed]);

  const toggleCollapsed = () => setCollapsed((previous) => !previous);

  if (collapsible && collapsed) {
    return (
      <div className={`rounded-2xl border p-4 sm:p-5 ${toneStyle.border} ${toneStyle.collapsedBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {titleIcon ? <div className="shrink-0">{titleIcon}</div> : null}
            <div className="min-w-0">
              <h1 className={`truncate text-lg font-semibold ${toneStyle.title}`}>{title}</h1>
              {description ? <p className={`truncate text-xs ${toneStyle.description}`}>{description}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={toggleCollapsed}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${toneStyle.collapseButton}`}
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Expand
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 sm:p-8 ${toneStyle.border} ${toneStyle.background}`}>
      <div className={`pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full blur-3xl ${toneStyle.glowA}`} />
      <div className={`pointer-events-none absolute -bottom-20 -left-14 h-60 w-60 rounded-full blur-3xl ${toneStyle.glowB}`} />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${toneStyle.eyebrow}`}>
              {eyebrowIcon}
              <span className="truncate">{eyebrow}</span>
            </div>
          ) : null}

          <h1 className={`mt-3 flex items-center gap-3 text-3xl font-bold ${toneStyle.title}`}>
            {titleIcon}
            <span className="truncate">{title}</span>
          </h1>

          {description ? <p className={`mt-2 ${toneStyle.description}`}>{description}</p> : null}

          {(chips.length > 0 || guide || children) && (
            <div className="mt-4 space-y-3">
              {chips.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {chips.map((chip) => (
                    <span
                      key={chip.label}
                      className={`rounded-md border px-2 py-1 font-medium ${chipToneMap[chip.tone || 'default']}`}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              ) : null}
              {guide ? (
                <div
                  className={`pt-4 border-t ${
                    isLight
                      ? 'border-slate-200/70'
                      : 'border-white/10'
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${toneStyle.description}`}>{guide.title}</p>
                  <p className={`mt-2 text-sm leading-relaxed ${toneStyle.description}`}>{guide.purpose}</p>
                  <p className={`mt-2 text-sm leading-relaxed ${toneStyle.description}`}>
                    <span className={`font-semibold ${toneStyle.title}`}>You can:</span> {guide.actions.join(' • ')}
                  </p>
                </div>
              ) : null}
              {children}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {actions}
          {collapsible ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${toneStyle.actionButton}`}
            >
              <ChevronUp className="h-3.5 w-3.5" />
              Collapse
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PageHero;
