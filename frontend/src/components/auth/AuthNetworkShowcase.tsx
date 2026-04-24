import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe2, ShieldCheck, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

type AuthNetworkShowcaseProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  stats: Array<{
    label: string;
    value: string;
  }>;
  compact?: boolean;
};

const providerNodes = [
  {
    id: 'aws',
    name: 'AWS',
    region: 'Virginia lane',
    src: '/provider-logos/aws.svg',
    className: 'left-[4%] top-[18%]',
  },
  {
    id: 'azure',
    name: 'Azure',
    region: 'Europe lane',
    src: '/provider-logos/azure.svg',
    className: 'left-[38%] top-[12%]',
  },
  {
    id: 'gcp',
    name: 'GCP',
    region: 'APAC lane',
    src: '/provider-logos/gcp.svg',
    className: 'right-[3%] top-[54%]',
  },
];

// These contours are intentionally stylized for UI visualization rather than cartographic precision.
const mapContours = [
  'M82 104C102 74 146 60 186 70C214 76 230 92 238 114C244 132 234 154 212 162C194 168 178 180 172 194C164 212 134 218 114 204C90 190 62 172 56 146C50 130 62 114 82 104Z',
  'M194 212C210 208 224 220 230 238C236 256 232 280 220 296C210 310 204 332 188 338C174 342 162 326 164 308C168 286 180 272 176 250C174 232 178 216 194 212Z',
  'M330 98C340 84 360 80 378 84C396 88 410 98 412 114C414 128 400 138 384 142C368 146 350 144 338 136C326 128 322 110 330 98Z',
  'M344 150C362 144 382 150 396 164C410 178 414 198 408 218C402 238 390 258 374 278C362 292 344 294 334 280C324 266 330 246 324 226C318 202 322 176 344 150Z',
  'M396 96C426 62 488 50 552 60C604 70 656 90 694 120C726 146 734 188 712 210C688 234 648 228 614 226C592 224 574 236 558 250C534 270 498 270 470 256C444 244 426 224 416 198C406 174 380 122 396 96Z',
  'M610 262C628 254 654 258 672 272C688 286 692 308 678 318C660 332 632 334 612 320C594 308 592 274 610 262Z',
];

const transferPaths = [
  {
    id: 'aws',
    d: 'M510 188C470 154 378 126 166 114',
    duration: 7.4,
    delay: 0,
  },
  {
    id: 'azure',
    d: 'M510 188C494 158 456 122 392 114',
    duration: 5.8,
    delay: 0.9,
  },
  {
    id: 'gcp',
    d: 'M510 188C560 188 612 198 648 226',
    duration: 6.6,
    delay: 1.3,
  },
];

const signalBlips = [
  { cx: 220, cy: 142, delay: 0.2 },
  { cx: 356, cy: 164, delay: 0.8 },
  { cx: 600, cy: 150, delay: 1.1 },
  { cx: 650, cy: 286, delay: 1.5 },
];

const highlightIcons = [ShieldCheck, Activity, Globe2, Sparkles];

const AuthNetworkShowcase: React.FC<AuthNetworkShowcaseProps> = ({
  eyebrow,
  title,
  description,
  highlights,
  stats,
  compact = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const textStrongClass = isLight ? 'text-slate-950' : 'text-slate-50';
  const textMutedClass = isLight ? 'text-slate-700' : 'text-slate-300';
  const labelMutedClass = isLight ? 'text-slate-600' : 'text-slate-400';
  const chipClass = isLight
    ? 'border border-cyan-200/90 bg-white/78 text-cyan-700 shadow-[0_16px_34px_-24px_rgba(14,165,233,0.38)]'
    : 'border border-cyan-400/25 bg-cyan-500/10 text-cyan-200';
  const nodeGlowClass = isLight
    ? 'shadow-[0_0_0_8px_rgba(255,255,255,0.46),0_0_40px_rgba(56,189,248,0.24)]'
    : 'shadow-[0_0_0_8px_rgba(2,6,23,0.24),0_0_42px_rgba(34,211,238,0.2)]';
  const nodeOrbClass = isLight
    ? 'border border-slate-200/90 bg-white/95'
    : 'border border-slate-200/10 bg-slate-950/75';
  const dividerClass = isLight ? 'border-slate-300/85' : 'border-cyan-400/14';
  const glowFillClass = isLight ? 'bg-cyan-400/22' : 'bg-cyan-400/16';
  const trailClass = isLight ? 'rgba(14,165,233,0.24)' : 'rgba(103,232,249,0.18)';
  const contourStroke = isLight ? 'rgba(148,163,184,0.28)' : 'rgba(148,163,184,0.12)';
  const contourFillStart = isLight ? 'rgba(191,219,254,0.48)' : 'rgba(148,163,184,0.14)';
  const contourFillEnd = isLight ? 'rgba(248,250,252,0.72)' : 'rgba(51,65,85,0.28)';
  const sectionWashClass = isLight
    ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.05)_54%,rgba(239,246,255,0.16)_100%)]'
    : '';
  const mapWashClass = isLight
    ? 'bg-[radial-gradient(circle_at_50%_34%,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(59,130,246,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.42)_0%,rgba(239,246,255,0.12)_100%)]'
    : 'bg-[radial-gradient(circle_at_50%_34%,rgba(34,211,238,0.08),transparent_34%),linear-gradient(180deg,rgba(8,15,28,0.06)_0%,rgba(2,6,23,0.02)_100%)]';
  const hubOrbClass = isLight
    ? 'border-cyan-300/70 bg-white/58 shadow-[0_0_0_10px_rgba(255,255,255,0.38),0_0_40px_rgba(56,189,248,0.18)]'
    : 'border-cyan-400/28 bg-cyan-500/10';
  const featureTextClass = isLight ? 'text-slate-700' : 'text-slate-300';
  const statsGridClass = compact ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 md:grid-cols-3';
  const statsDividerClass = compact
    ? `border-t pt-4 first:border-t-0 first:pt-0 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4 sm:first:border-l-0 sm:first:pl-0 ${dividerClass}`
    : `border-t pt-4 first:border-t-0 first:pt-0 md:border-t-0 md:pt-0 md:border-l md:pl-4 md:first:border-l-0 md:first:pl-0 ${dividerClass}`;

  return (
    <section className={`relative overflow-hidden ${compact ? 'px-1 pb-2 pt-4' : 'px-1 py-5'}`}>
      <div className={`absolute inset-0 ${sectionWashClass}`} />
      <div className={`absolute left-[3%] top-[10%] h-32 w-32 rounded-full blur-3xl ${isLight ? 'bg-white/70' : 'bg-cyan-400/0'}`} />
      <div className={`absolute right-[8%] top-[22%] h-36 w-36 rounded-full blur-3xl ${isLight ? 'bg-sky-200/50' : 'bg-cyan-400/0'}`} />

      <div className="relative z-10">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${chipClass}`}>
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </div>

        <div className="mt-4 max-w-3xl space-y-3">
          <h1 className={`${compact ? 'text-2xl sm:text-[2rem]' : 'text-4xl'} font-bold leading-tight ${textStrongClass}`}>
            {title}
          </h1>
          <p className={`max-w-2xl text-sm leading-relaxed ${textMutedClass}`}>{description}</p>
        </div>

        <div className={`mt-6 grid gap-4 ${statsGridClass}`}>
          {stats.map((stat) => (
            <div key={stat.label} className={statsDividerClass}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-500">{stat.label}</p>
              <p className={`mt-1 text-base font-semibold ${textStrongClass}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`relative mt-7 ${compact ? 'h-[320px] sm:h-[360px]' : 'h-[360px] xl:h-[430px]'}`}>
        <div className={`absolute inset-0 rounded-[2rem] ${mapWashClass}`} />
        <div
          className={`absolute inset-x-[4%] top-[6%] h-[72%] rounded-full blur-3xl ${glowFillClass}`}
        />
        <div
          className={`absolute inset-x-[6%] top-[14%] h-[48%] rounded-[2rem] ${
            isLight ? 'border border-white/55' : 'border border-white/0'
          }`}
        />
        <div
          className={`absolute left-[12%] top-[10%] h-px w-36 bg-gradient-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0 ${
            isLight ? 'opacity-70' : 'opacity-90'
          }`}
        />
        <div
          className={`absolute right-[10%] bottom-[18%] h-px w-44 bg-gradient-to-r from-cyan-400/0 via-blue-400/40 to-blue-400/0 ${
            isLight ? 'opacity-50' : 'opacity-70'
          }`}
        />

        <svg
          viewBox="0 0 780 360"
          className="absolute inset-0 h-full w-full"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="transferTrack" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isLight ? 'rgba(56,189,248,0.08)' : 'rgba(103,232,249,0.12)'} />
              <stop offset="50%" stopColor={isLight ? 'rgba(14,165,233,0.78)' : 'rgba(34,211,238,0.82)'} />
              <stop offset="100%" stopColor={isLight ? 'rgba(37,99,235,0.1)' : 'rgba(59,130,246,0.2)'} />
            </linearGradient>
            <linearGradient id="continentFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={contourFillStart} />
              <stop offset="100%" stopColor={contourFillEnd} />
            </linearGradient>
          </defs>

          {mapContours.map((contour) => (
            <path
              key={contour}
              d={contour}
              fill="url(#continentFill)"
              stroke={contourStroke}
              strokeWidth="1.2"
            />
          ))}

          {signalBlips.map((blip) => (
            <motion.circle
              key={`${blip.cx}-${blip.cy}`}
              cx={blip.cx}
              cy={blip.cy}
              r="3.2"
              fill={isLight ? '#0891b2' : '#67e8f9'}
              animate={{ opacity: [0.18, 0.92, 0.18], scale: [0.82, 1.28, 0.82] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: blip.delay }}
            />
          ))}

          {transferPaths.map((path) => (
            <React.Fragment key={path.id}>
              <path
                d={path.d}
                stroke={trailClass}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <motion.path
                d={path.d}
                stroke="url(#transferTrack)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeDasharray="12 18"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -180 }}
                transition={{ duration: path.duration, repeat: Infinity, ease: 'linear', delay: path.delay }}
              />
            </React.Fragment>
          ))}

          <motion.circle
            cx="510"
            cy="188"
            r="13"
            fill={isLight ? '#0284c7' : '#67e8f9'}
            animate={{ scale: [0.96, 1.14, 0.96], opacity: [0.74, 1, 0.74] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="510"
            cy="188"
            r="28"
            fill="none"
            stroke={isLight ? 'rgba(14,165,233,0.22)' : 'rgba(103,232,249,0.22)'}
            strokeWidth="2"
            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.18, 0.62, 0.18] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeOut' }}
          />
        </svg>

        {providerNodes.map((provider, index) => (
          <motion.div
            key={provider.id}
            className={`absolute z-20 flex items-center gap-3 ${provider.className}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            transition={{
              opacity: { duration: 0.35, delay: 0.15 + index * 0.12 },
              y: { duration: 5.4 + index, repeat: Infinity, ease: 'easeInOut', delay: index * 0.4 },
            }}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${nodeOrbClass} ${nodeGlowClass}`}>
              <img src={provider.src} alt={provider.name} className="h-6 w-auto object-contain" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${textStrongClass}`}>{provider.name}</p>
              <p className={`text-[11px] uppercase tracking-[0.14em] ${labelMutedClass}`}>{provider.region}</p>
            </div>
          </motion.div>
        ))}

        <motion.div
          className="absolute left-[52%] top-[44%] z-20 flex items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: [0, -4, 0] }}
          transition={{
            opacity: { duration: 0.4, delay: 0.3 },
            y: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <div className={`h-16 w-16 rounded-full border ${hubOrbClass}`} />
          <div className={`border-l pl-3 ${dividerClass}`}>
            <p className={`text-sm font-semibold ${textStrongClass}`}>India operations hub</p>
            <p className={`mt-1 text-[11px] uppercase tracking-[0.14em] ${labelMutedClass}`}>Active transfer telemetry</p>
          </div>
        </motion.div>

        <div className={`absolute bottom-0 left-0 right-0 grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          {highlights.map((item, index) => {
            const Icon = highlightIcons[index % highlightIcons.length];
            return (
              <div key={item} className={`flex items-start gap-3 border-l pl-4 ${dividerClass}`}>
                <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${chipClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className={`text-sm leading-relaxed ${featureTextClass}`}>{item}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AuthNetworkShowcase;
