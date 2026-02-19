import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

type PageHeroTone = 'blue' | 'purple' | 'cyan' | 'emerald' | 'orange' | 'indigo' | 'pink' | 'slate';
type PageHeroChipTone = 'default' | 'blue' | 'purple' | 'cyan' | 'emerald' | 'orange' | 'indigo' | 'pink';

interface PageHeroChip {
  label: string;
  tone?: PageHeroChipTone;
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
    border: 'border-blue-500/20',
    background: 'from-[#141a26] via-[#0f1115] to-[#0f141d]',
    glowA: 'bg-blue-500/10',
    glowB: 'bg-cyan-500/10',
    collapsedBg: 'bg-[#0f0f11]',
    title: 'text-white',
    description: 'text-gray-300/90',
    eyebrow: 'border-white/15 bg-white/5 text-gray-200',
    collapseButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
    actionButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
  },
  purple: {
    border: 'border-purple-500/20',
    background: 'from-[#141422] via-[#0f0f11] to-[#0f1119]',
    glowA: 'bg-purple-500/10',
    glowB: 'bg-cyan-500/10',
    collapsedBg: 'bg-[#0f0f11]',
    title: 'text-white',
    description: 'text-gray-300/90',
    eyebrow: 'border-white/15 bg-white/5 text-gray-200',
    collapseButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
    actionButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
  },
  cyan: {
    border: 'border-cyan-500/20',
    background: 'from-[#0f1a1d] via-[#0f1113] to-[#0c1417]',
    glowA: 'bg-cyan-500/10',
    glowB: 'bg-blue-500/10',
    collapsedBg: 'bg-[#0f0f11]',
    title: 'text-white',
    description: 'text-gray-300/90',
    eyebrow: 'border-white/15 bg-white/5 text-gray-200',
    collapseButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
    actionButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
  },
  emerald: {
    border: 'border-emerald-500/20',
    background: 'from-[#102015] via-[#0f1110] to-[#0f1712]',
    glowA: 'bg-emerald-500/10',
    glowB: 'bg-lime-500/10',
    collapsedBg: 'bg-[#0f0f11]',
    title: 'text-white',
    description: 'text-gray-300/90',
    eyebrow: 'border-white/15 bg-white/5 text-gray-200',
    collapseButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
    actionButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
  },
  orange: {
    border: 'border-orange-500/20',
    background: 'from-[#21160f] via-[#11100f] to-[#18110f]',
    glowA: 'bg-orange-500/10',
    glowB: 'bg-amber-500/10',
    collapsedBg: 'bg-[#0f0f11]',
    title: 'text-white',
    description: 'text-gray-300/90',
    eyebrow: 'border-white/15 bg-white/5 text-gray-200',
    collapseButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
    actionButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
  },
  indigo: {
    border: 'border-indigo-500/20',
    background: 'from-[#15162a] via-[#0f0f13] to-[#111427]',
    glowA: 'bg-indigo-500/10',
    glowB: 'bg-blue-500/10',
    collapsedBg: 'bg-[#0f0f11]',
    title: 'text-white',
    description: 'text-gray-300/90',
    eyebrow: 'border-white/15 bg-white/5 text-gray-200',
    collapseButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
    actionButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
  },
  pink: {
    border: 'border-pink-500/20',
    background: 'from-[#211121] via-[#100f11] to-[#181019]',
    glowA: 'bg-pink-500/10',
    glowB: 'bg-fuchsia-500/10',
    collapsedBg: 'bg-[#0f0f11]',
    title: 'text-white',
    description: 'text-gray-300/90',
    eyebrow: 'border-white/15 bg-white/5 text-gray-200',
    collapseButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
    actionButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
  },
  slate: {
    border: 'border-gray-700/50',
    background: 'from-[#151617] via-[#101113] to-[#0e0f11]',
    glowA: 'bg-gray-500/10',
    glowB: 'bg-slate-500/10',
    collapsedBg: 'bg-[#0f0f11]',
    title: 'text-white',
    description: 'text-gray-300/90',
    eyebrow: 'border-white/15 bg-white/5 text-gray-200',
    collapseButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
    actionButton: 'border-gray-700/60 bg-gray-800/60 text-gray-200 hover:bg-gray-800',
  },
};

const toneMapLight: Record<PageHeroTone, PageHeroToneStyle> = {
  blue: {
    border: 'border-blue-200',
    background: 'from-[#edf5ff] via-[#f8fbff] to-[#eef6ff]',
    glowA: 'bg-blue-400/20',
    glowB: 'bg-cyan-400/15',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-blue-200 bg-white/70 text-slate-700',
    collapseButton: 'border-blue-200 bg-white/80 text-slate-700 hover:bg-blue-50',
    actionButton: 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50',
  },
  purple: {
    border: 'border-violet-200',
    background: 'from-[#f3eeff] via-[#faf8ff] to-[#f7f2ff]',
    glowA: 'bg-violet-400/18',
    glowB: 'bg-fuchsia-400/12',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-violet-200 bg-white/70 text-slate-700',
    collapseButton: 'border-violet-200 bg-white/80 text-slate-700 hover:bg-violet-50',
    actionButton: 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50',
  },
  cyan: {
    border: 'border-cyan-200',
    background: 'from-[#e7f9ff] via-[#f6fcff] to-[#edf9ff]',
    glowA: 'bg-cyan-400/20',
    glowB: 'bg-blue-400/12',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-cyan-200 bg-white/70 text-slate-700',
    collapseButton: 'border-cyan-200 bg-white/80 text-slate-700 hover:bg-cyan-50',
    actionButton: 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50',
  },
  emerald: {
    border: 'border-emerald-200',
    background: 'from-[#eafbf2] via-[#f8fdfb] to-[#effcf4]',
    glowA: 'bg-emerald-400/20',
    glowB: 'bg-lime-400/12',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-emerald-200 bg-white/70 text-slate-700',
    collapseButton: 'border-emerald-200 bg-white/80 text-slate-700 hover:bg-emerald-50',
    actionButton: 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50',
  },
  orange: {
    border: 'border-amber-200',
    background: 'from-[#fff4e7] via-[#fffaf5] to-[#fff6ec]',
    glowA: 'bg-orange-400/20',
    glowB: 'bg-amber-400/14',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-amber-200 bg-white/70 text-slate-700',
    collapseButton: 'border-amber-200 bg-white/80 text-slate-700 hover:bg-amber-50',
    actionButton: 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50',
  },
  indigo: {
    border: 'border-indigo-200',
    background: 'from-[#ecefff] via-[#f8f9ff] to-[#eef2ff]',
    glowA: 'bg-indigo-400/20',
    glowB: 'bg-blue-400/12',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-indigo-200 bg-white/70 text-slate-700',
    collapseButton: 'border-indigo-200 bg-white/80 text-slate-700 hover:bg-indigo-50',
    actionButton: 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50',
  },
  pink: {
    border: 'border-pink-200',
    background: 'from-[#ffedf5] via-[#fff8fb] to-[#fff0f7]',
    glowA: 'bg-pink-400/20',
    glowB: 'bg-fuchsia-400/12',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-pink-200 bg-white/70 text-slate-700',
    collapseButton: 'border-pink-200 bg-white/80 text-slate-700 hover:bg-pink-50',
    actionButton: 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50',
  },
  slate: {
    border: 'border-slate-200',
    background: 'from-[#f6f8fb] via-[#fbfcfe] to-[#f3f7fc]',
    glowA: 'bg-slate-400/12',
    glowB: 'bg-gray-400/12',
    collapsedBg: 'bg-white',
    title: 'text-slate-900',
    description: 'text-slate-600',
    eyebrow: 'border-slate-200 bg-white/70 text-slate-700',
    collapseButton: 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50',
    actionButton: 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50',
  },
};

const chipToneMapDark: Record<PageHeroChipTone, string> = {
  default: 'border-gray-700/60 bg-gray-800/50 text-gray-200',
  blue: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
  purple: 'border-purple-500/30 bg-purple-500/10 text-purple-200',
  cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  orange: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  indigo: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200',
  pink: 'border-pink-500/30 bg-pink-500/10 text-pink-200',
};

const chipToneMapLight: Record<PageHeroChipTone, string> = {
  default: 'border-slate-200 bg-white/80 text-slate-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  purple: 'border-purple-200 bg-purple-50 text-purple-700',
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  orange: 'border-orange-200 bg-orange-50 text-orange-700',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  pink: 'border-pink-200 bg-pink-50 text-pink-700',
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
  actions,
  children,
  collapsible = false,
  defaultCollapsed = false,
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
            {titleIcon && <div className="shrink-0">{titleIcon}</div>}
            <div className="min-w-0">
              <h1 className={`truncate text-lg font-semibold ${toneStyle.title}`}>{title}</h1>
              {description && <p className={`truncate text-xs ${toneStyle.description}`}>{description}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={toggleCollapsed}
              className={`cursor-pointer inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${toneStyle.collapseButton}`}
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
      <div className={`pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl ${toneStyle.glowA}`} />
      <div className={`pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full blur-3xl ${toneStyle.glowB}`} />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${toneStyle.eyebrow}`}>
              {eyebrowIcon}
              <span className="truncate">{eyebrow}</span>
            </div>
          )}
          <h1 className={`mt-3 flex items-center gap-3 text-3xl font-bold ${toneStyle.title}`}>
            {titleIcon}
            <span className="truncate">{title}</span>
          </h1>
          {description && <p className={`mt-2 ${toneStyle.description}`}>{description}</p>}
          {(chips.length > 0 || children) && (
            <div className="mt-4 space-y-3">
              {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {chips.map((chip) => (
                    <span
                      key={chip.label}
                      className={`rounded-md border px-2 py-1 ${chipToneMap[chip.tone || 'default']}`}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}
              {children}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {actions}
          {collapsible && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className={`cursor-pointer inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs transition-colors ${toneStyle.actionButton}`}
            >
              <ChevronUp className="h-3.5 w-3.5" />
              Collapse
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHero;
