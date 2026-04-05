import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const ambientContours = [
  'M124 238C188 164 284 140 380 154C466 166 542 214 556 292C564 344 520 374 450 376C388 378 350 344 304 334C228 318 122 312 124 238Z',
  'M656 188C714 154 804 150 886 170C962 188 1024 230 1036 292C1046 344 1010 388 940 394C874 402 820 378 770 356C710 330 628 280 628 230C628 212 638 198 656 188Z',
  'M1006 492C1048 458 1114 452 1172 470C1228 486 1278 522 1288 566C1298 606 1274 644 1228 652C1170 662 1118 638 1080 612C1032 582 978 526 1006 492Z',
];

const ambientTransfers = [
  { d: 'M748 318C668 274 542 248 380 246', duration: 12 },
  { d: 'M748 318C778 282 844 246 960 242', duration: 10.5 },
  { d: 'M748 318C820 344 900 402 1038 540', duration: 13.5 },
];

const AuthCloudBackdrop: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className={`absolute inset-0 ${
          isLight
            ? 'bg-[radial-gradient(circle_at_10%_12%,rgba(56,189,248,0.22),transparent_34%),radial-gradient(circle_at_88%_14%,rgba(59,130,246,0.16),transparent_28%),radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.48),transparent_34%),linear-gradient(145deg,#f7fbff_0%,#eef5ff_46%,#e6effb_100%)]'
            : 'bg-[radial-gradient(circle_at_10%_12%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.16),transparent_30%),linear-gradient(145deg,#04111f_0%,#08172a_54%,#091220_100%)]'
        }`}
      />

      <div
        className={`absolute inset-0 [background-image:linear-gradient(to_right,rgba(148,163,184,0.24)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.24)_1px,transparent_1px)] [background-size:56px_56px] ${
          isLight ? 'opacity-[0.22]' : 'opacity-[0.14]'
        }`}
      />

      <div
        className={`absolute inset-x-0 top-0 h-44 ${
          isLight
            ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.66)_0%,rgba(255,255,255,0)_100%)]'
            : 'bg-transparent'
        }`}
      />

      <div className={`absolute left-[52%] top-[34%] h-[22rem] w-[22rem] rounded-full blur-3xl ${isLight ? 'bg-cyan-400/16' : 'bg-cyan-400/14'}`} />
      <div className={`absolute right-[-6rem] top-[14%] h-[24rem] w-[24rem] rounded-full blur-3xl ${isLight ? 'bg-blue-500/10' : 'bg-blue-500/12'}`} />
      <div className={`absolute left-[-8rem] bottom-[10%] h-[22rem] w-[22rem] rounded-full blur-3xl ${isLight ? 'bg-sky-500/10' : 'bg-sky-500/12'}`} />

      <svg
        viewBox="0 0 1440 900"
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        {ambientContours.map((contour) => (
          <path
            key={contour}
            d={contour}
            fill={isLight ? 'rgba(255,255,255,0.22)' : 'rgba(51,65,85,0.16)'}
            stroke={isLight ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.08)'}
            strokeWidth="2"
          />
        ))}

        {ambientTransfers.map((transfer) => (
          <React.Fragment key={transfer.d}>
            <path
              d={transfer.d}
              stroke={isLight ? 'rgba(56,189,248,0.14)' : 'rgba(34,211,238,0.12)'}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <motion.path
              d={transfer.d}
              stroke={isLight ? 'rgba(14,165,233,0.5)' : 'rgba(103,232,249,0.36)'}
              strokeWidth="4"
              strokeDasharray="16 22"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -320 }}
              transition={{ duration: transfer.duration, repeat: Infinity, ease: 'linear' }}
            />
          </React.Fragment>
        ))}

        <motion.circle
          cx="748"
          cy="318"
          r="16"
          fill={isLight ? 'rgba(2,132,199,0.82)' : 'rgba(103,232,249,0.82)'}
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.64, 1, 0.64] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="748"
          cy="318"
          r="38"
          fill="none"
          stroke={isLight ? 'rgba(14,165,233,0.18)' : 'rgba(103,232,249,0.18)'}
          strokeWidth="2.5"
          animate={{ scale: [0.92, 1.24, 0.92], opacity: [0.18, 0.42, 0.18] }}
          transition={{ duration: 4.1, repeat: Infinity, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
};

export default AuthCloudBackdrop;
