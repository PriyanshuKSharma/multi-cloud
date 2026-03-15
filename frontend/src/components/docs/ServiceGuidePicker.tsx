import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Search, Sparkles, X } from 'lucide-react';
import type { ServiceGuide } from '../../data/docsServiceGuides';

type ServiceGuidePickerProps = {
  value: string;
  guides: ServiceGuide[];
  onChange: (nextId: string) => void;
  hotkeyEnabled?: boolean;
  disabled?: boolean;
};

const RECENT_KEY = 'docs:user-guide:recent';

const isTextFieldTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tagName = el.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || el.isContentEditable;
};

const deriveCategory = (guide: ServiceGuide): string => {
  if (guide.category) return guide.category;

  const route = guide.route ?? '';
  if (route.startsWith('/resources')) return 'Resources';

  if (guide.id === 'dashboard' || route === '/') return 'Workspace';
  if (route.startsWith('/projects')) return 'Workspace';

  if (route.startsWith('/deployments') || route.startsWith('/billing') || route.startsWith('/blueprints') || route.startsWith('/console')) {
    return 'Operations';
  }

  if (route.startsWith('/settings') || route.startsWith('/profile') || route.startsWith('/subscriptions') || route.startsWith('/accounts')) {
    return 'Account & Security';
  }

  if (route.startsWith('/docs') || route.startsWith('/help')) return 'Help & Docs';

  return 'Other';
};

const CATEGORY_ORDER = ['Recent', 'Workspace', 'Resources', 'Operations', 'Account & Security', 'Help & Docs', 'Other'];

const readRecentIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
  } catch {
    return [];
  }
};

const writeRecentIds = (ids: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    // ignore write errors (private mode, quota, etc.)
  }
};

const isMac = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
};

const ServiceGuidePicker: React.FC<ServiceGuidePickerProps> = ({
  value,
  guides,
  onChange,
  hotkeyEnabled = false,
  disabled = false,
}) => {
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [recentIds, setRecentIds] = React.useState<string[]>(() => readRecentIds());

  const selectedGuide = React.useMemo(
    () => guides.find((guide) => guide.id === value) ?? guides[0],
    [guides, value]
  );

  const hotkeyHint = React.useMemo(() => (isMac() ? 'Cmd K' : 'Ctrl K'), []);

  const filteredGuides = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return guides;

    const matches = (guide: ServiceGuide) => {
      const haystack = [
        guide.name,
        guide.description,
        guide.summary,
        guide.route,
        guide.createRoute,
        guide.category,
        deriveCategory(guide),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    };

    return guides.filter(matches);
  }, [guides, query]);

  const sections = React.useMemo(() => {
    const normalizedIds = new Map(guides.map((guide) => [guide.id, guide]));
    const filteredSet = new Set(filteredGuides.map((guide) => guide.id));

    const recentGuides = recentIds
      .map((id) => normalizedIds.get(id))
      .filter((guide): guide is ServiceGuide => Boolean(guide))
      .filter((guide) => filteredSet.has(guide.id));

    const recentSet = new Set(recentGuides.map((guide) => guide.id));
    const remaining = filteredGuides.filter((guide) => !recentSet.has(guide.id));

    const categoryMap = new Map<string, ServiceGuide[]>();
    for (const guide of remaining) {
      const category = deriveCategory(guide);
      const next = categoryMap.get(category) ?? [];
      next.push(guide);
      categoryMap.set(category, next);
    }

    const orderedCategories = Array.from(categoryMap.keys()).sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a);
      const bIndex = CATEGORY_ORDER.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    const result: Array<{ title: string; items: ServiceGuide[] }> = [];
    if (recentGuides.length > 0) {
      result.push({ title: 'Recent', items: recentGuides });
    }
    for (const category of orderedCategories) {
      const items = categoryMap.get(category) ?? [];
      if (items.length > 0) result.push({ title: category, items });
    }
    return result;
  }, [filteredGuides, guides, recentIds]);

  const selectableGuides = React.useMemo(
    () => sections.flatMap((section) => section.items),
    [sections]
  );

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const openPicker = React.useCallback(() => {
    if (disabled) return;
    setOpen(true);
  }, [disabled]);

  const pickGuide = React.useCallback(
    (guide: ServiceGuide) => {
      onChange(guide.id);
      setRecentIds((prev) => {
        const next = [guide.id, ...prev.filter((id) => id !== guide.id)].slice(0, 6);
        writeRecentIds(next);
        return next;
      });
      close();
    },
    [close, onChange]
  );

  React.useEffect(() => {
    if (!open) return;
    const nextActive = selectableGuides.findIndex((guide) => guide.id === value);
    setActiveIndex(nextActive >= 0 ? nextActive : 0);
  }, [open, selectableGuides, value]);

  React.useEffect(() => {
    if (!open) return;
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [open]);

  React.useEffect(() => {
    if (!hotkeyEnabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isTextFieldTarget(event.target)) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      openPicker();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hotkeyEnabled, openPicker]);

  const activeGuide = selectableGuides[activeIndex] ?? selectableGuides[0] ?? null;

  const onQueryKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(selectableGuides.length - 1, 0)));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      if (!activeGuide) return;
      event.preventDefault();
      pickGuide(activeGuide);
    }
  };

  if (!selectedGuide) return null;

  const SelectedIcon = selectedGuide.icon;

  return (
    <div className="w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className="group w-full rounded-2xl border border-gray-800/80 bg-gray-900/60 px-4 py-3 text-left text-gray-100 shadow-[0_0_0_1px_rgba(59,130,246,0.0)] transition-all hover:border-gray-700 hover:bg-gray-900/70 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-200">
              <SelectedIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{selectedGuide.name}</p>
              <p className="mt-0.5 truncate text-xs text-gray-400">{selectedGuide.description}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hotkeyEnabled ? (
              <span className="hidden rounded-lg border border-gray-800 bg-black/25 px-2 py-1 text-[11px] font-semibold text-gray-400 sm:inline-flex">
                {hotkeyHint}
              </span>
            ) : null}
            <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-hover:text-gray-200" />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="service-guide-picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <motion.button
              type="button"
              aria-label="Close service picker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
              onClick={close}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="relative mx-auto mt-20 w-[min(760px,92vw)] overflow-hidden rounded-[28px] border border-gray-800/70 bg-[#0f0f11] shadow-2xl shadow-black/50"
            >
              <div className="border-b border-gray-800/70 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/90">
                      <Sparkles className="h-3.5 w-3.5" />
                      Service Launcher
                    </p>
                    <p className="mt-2 text-sm text-gray-300">
                      Search a service, hit Enter to select, then run the checklist.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex items-center gap-2 rounded-2xl border border-gray-800 bg-gray-900/40 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:bg-gray-800/70"
                  >
                    <X className="h-4 w-4" />
                    Close
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-800/80 bg-black/25 px-4 py-3">
                  <Search className="h-4 w-4 text-gray-500" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={onQueryKeyDown}
                    placeholder='Search services (example: "VM", "billing", "deployments")'
                    className="w-full bg-transparent text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="max-h-[420px] overflow-y-auto p-2">
                {selectableGuides.length === 0 ? (
                  <div className="p-6 text-sm text-gray-400">
                    No matching services. Try a different search term.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <div key={section.title}>
                        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                          {section.title}
                        </p>
                        <div className="space-y-1">
                          {section.items.map((guide) => {
                            const Icon = guide.icon;
                            const isActive = activeGuide?.id === guide.id;
                            const canOpen = Boolean(guide.route);
                            const canRun = Boolean(guide.createRoute);

                            return (
                              <button
                                key={guide.id}
                                type="button"
                                onMouseMove={() => {
                                  const index = selectableGuides.findIndex((item) => item.id === guide.id);
                                  if (index >= 0) setActiveIndex(index);
                                }}
                                onClick={() => pickGuide(guide)}
                                className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-colors ${
                                  isActive
                                    ? 'border-blue-500/35 bg-blue-500/10'
                                    : 'border-transparent bg-transparent hover:border-gray-800 hover:bg-gray-900/45'
                                }`}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span
                                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                                      isActive
                                        ? 'border-blue-500/25 bg-blue-500/10 text-blue-200'
                                        : 'border-gray-800/80 bg-black/20 text-gray-300'
                                    }`}
                                  >
                                    <Icon className="h-4.5 w-4.5" />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">{guide.name}</p>
                                    <p className="mt-0.5 truncate text-xs text-gray-400">{guide.description}</p>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  {canRun ? (
                                    <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-100">
                                      Run
                                    </span>
                                  ) : null}
                                  {canOpen ? (
                                    <span className="rounded-full border border-gray-800 bg-gray-900/30 px-3 py-1 text-[11px] font-semibold text-gray-300">
                                      Open
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-800/70 bg-black/20 px-5 py-3 text-[11px] text-gray-400">
                <span>Enter selects. Arrow keys navigate. Esc closes.</span>
                {hotkeyEnabled ? <span>{hotkeyHint} opens the launcher.</span> : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default ServiceGuidePicker;
