import React from 'react';
import { Link } from 'react-router-dom';
import { CloudLightning, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface PublicInfoLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  accent: 'blue' | 'emerald' | 'amber' | 'rose';
  icon: React.ReactNode;
  children: React.ReactNode;
}

const accentMap = {
  blue: {
    heroBorderLight: 'border-blue-200/90',
    heroBorderDark: 'border-blue-400/25',
    heroBgLight: 'from-blue-50 via-white to-sky-50',
    heroBgDark: 'from-slate-950/95 via-slate-900/92 to-blue-950/70',
    iconLight: 'border-blue-200 bg-white text-blue-600',
    iconDark: 'border-blue-400/30 bg-blue-500/12 text-blue-300',
    chipLight: 'border-blue-200 bg-white text-slate-700',
    chipDark: 'border-blue-400/25 bg-blue-500/12 text-blue-100',
  },
  emerald: {
    heroBorderLight: 'border-emerald-200/90',
    heroBorderDark: 'border-emerald-400/25',
    heroBgLight: 'from-emerald-50 via-white to-teal-50',
    heroBgDark: 'from-slate-950/95 via-slate-900/92 to-emerald-950/65',
    iconLight: 'border-emerald-200 bg-white text-emerald-600',
    iconDark: 'border-emerald-400/30 bg-emerald-500/12 text-emerald-300',
    chipLight: 'border-emerald-200 bg-white text-slate-700',
    chipDark: 'border-emerald-400/25 bg-emerald-500/12 text-emerald-100',
  },
  amber: {
    heroBorderLight: 'border-amber-200/90',
    heroBorderDark: 'border-amber-400/25',
    heroBgLight: 'from-amber-50 via-white to-orange-50',
    heroBgDark: 'from-slate-950/95 via-slate-900/92 to-amber-950/60',
    iconLight: 'border-amber-200 bg-white text-amber-600',
    iconDark: 'border-amber-400/30 bg-amber-500/12 text-amber-300',
    chipLight: 'border-amber-200 bg-white text-slate-700',
    chipDark: 'border-amber-400/25 bg-amber-500/12 text-amber-100',
  },
  rose: {
    heroBorderLight: 'border-rose-200/90',
    heroBorderDark: 'border-rose-400/25',
    heroBgLight: 'from-rose-50 via-white to-orange-50',
    heroBgDark: 'from-slate-950/95 via-slate-900/92 to-rose-950/60',
    iconLight: 'border-rose-200 bg-white text-rose-600',
    iconDark: 'border-rose-400/30 bg-rose-500/12 text-rose-300',
    chipLight: 'border-rose-200 bg-white text-slate-700',
    chipDark: 'border-rose-400/25 bg-rose-500/12 text-rose-100',
  },
} as const;

const PublicInfoLayout: React.FC<PublicInfoLayoutProps> = ({
  eyebrow,
  title,
  description,
  accent,
  icon,
  children,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const accentStyle = accentMap[accent];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className={`absolute inset-0 ${
          isLight
            ? 'bg-[radial-gradient(circle_at_12%_12%,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(16,185,129,0.08),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#edf4fb_56%,#e7eef9_100%)]'
            : 'bg-[radial-gradient(circle_at_12%_12%,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(16,185,129,0.12),transparent_34%),linear-gradient(180deg,#070d18_0%,#0b1423_58%,#0b1628_100%)]'
        }`}
      />
      <div
        className={`absolute inset-0 [background-image:linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:42px_42px] ${
          isLight ? 'opacity-[0.2]' : 'opacity-[0.1]'
        }`}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header
          className={`flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between ${
            isLight ? 'border-slate-200/90' : 'border-slate-700/70'
          }`}
        >
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/12 text-blue-300">
              <CloudLightning className="h-5 w-5" />
            </span>
            <span>
              <span className={`block text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Nebula Cloud Platform
              </span>
              <span className="block text-[11px] uppercase tracking-[0.16em] text-blue-500">Platform Access</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                isLight
                  ? 'text-slate-600 hover:bg-white hover:text-slate-900'
                  : 'text-slate-300 hover:bg-slate-900/70 hover:text-slate-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/login"
              className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                isLight
                  ? 'text-slate-600 hover:bg-white hover:text-slate-900'
                  : 'text-slate-300 hover:bg-slate-900/70 hover:text-slate-50'
              }`}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isLight
                  ? 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-slate-900'
                  : 'border border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-400/45 hover:text-slate-50'
              }`}
            >
              Create Account
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                isLight
                  ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  : 'border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
              aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
              title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {isLight ? 'Dark' : 'Light'}
            </button>
          </div>
        </header>

        <main className="py-8">
          <section
            className={`overflow-hidden rounded-[30px] border bg-gradient-to-br p-6 sm:p-8 ${
              isLight
                ? `${accentStyle.heroBorderLight} ${accentStyle.heroBgLight}`
                : `${accentStyle.heroBorderDark} ${accentStyle.heroBgDark}`
            }`}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    isLight ? accentStyle.chipLight : accentStyle.chipDark
                  }`}
                >
                  {eyebrow}
                </span>
                <h1 className={`mt-4 text-3xl font-bold leading-tight sm:text-4xl ${isLight ? 'text-slate-900' : 'text-slate-50'}`}>
                  {title}
                </h1>
                <p className={`mt-3 max-w-2xl text-sm leading-relaxed sm:text-base ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {description}
                </p>
              </div>

              <div
                className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl border shadow-[0_24px_60px_-32px_rgba(2,6,23,0.6)] ${
                  isLight ? accentStyle.iconLight : accentStyle.iconDark
                }`}
              >
                {icon}
              </div>
            </div>
          </section>

          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default PublicInfoLayout;
