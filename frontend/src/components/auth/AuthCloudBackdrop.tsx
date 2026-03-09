import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const PROVIDER_LOGOS = [
  {
    src: '/provider-logos/aws.svg',
    alt: 'AWS logo',
    className: 'left-[9%] top-[18%] w-36 sm:w-40 lg:w-44',
    duration: 14,
    delay: 0,
  },
  {
    src: '/provider-logos/azure.svg',
    alt: 'Azure logo',
    className: 'right-[10%] top-[22%] w-36 sm:w-40 lg:w-44',
    duration: 16,
    delay: 0.35,
  },
  {
    src: '/provider-logos/gcp.svg',
    alt: 'Google Cloud logo',
    className: 'left-[20%] bottom-[14%] w-36 sm:w-40 lg:w-44',
    duration: 18,
    delay: 0.7,
  },
];

const AuthCloudBackdrop: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={`absolute inset-0 ${
          isLight
            ? 'bg-[radial-gradient(circle_at_12%_12%,rgba(59,130,246,0.15),transparent_38%),radial-gradient(circle_at_90%_10%,rgba(37,99,235,0.11),transparent_34%),linear-gradient(145deg,#f8fbff_0%,#eff4fc_52%,#e9f1fb_100%)]'
            : 'bg-[radial-gradient(circle_at_12%_12%,rgba(59,130,246,0.23),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(30,64,175,0.2),transparent_34%),linear-gradient(145deg,#050c18_0%,#0a1528_52%,#091322_100%)]'
        }`}
      />

      <div
        className={`absolute inset-0 [background-image:linear-gradient(to_right,rgba(148,163,184,0.32)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.32)_1px,transparent_1px)] [background-size:48px_48px] ${
          isLight ? 'opacity-[0.14]' : 'opacity-[0.15]'
        }`}
      />

      <div
        className={`absolute left-1/2 top-[8%] h-72 w-72 -translate-x-1/2 rounded-full blur-3xl ${
          isLight ? 'bg-blue-500/10' : 'bg-blue-400/12'
        }`}
      />
      <div
        className={`absolute -left-20 top-[26%] h-72 w-72 rounded-full blur-3xl ${
          isLight ? 'bg-blue-500/12' : 'bg-blue-500/18'
        }`}
      />
      <div
        className={`absolute -right-20 bottom-[18%] h-80 w-80 rounded-full blur-3xl ${
          isLight ? 'bg-indigo-500/10' : 'bg-indigo-500/18'
        }`}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 hidden h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 lg:block"
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      >
        <div className={`absolute inset-0 rounded-full ${isLight ? 'border border-blue-500/12' : 'border border-blue-200/12'}`} />
        <div
          className={`absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed ${
            isLight ? 'border-indigo-500/18' : 'border-indigo-200/14'
          }`}
        />
        <div
          className={`absolute left-1/2 top-1/2 h-[128px] w-[128px] -translate-x-1/2 -translate-y-1/2 rounded-full backdrop-blur-sm ${
            isLight ? 'border border-blue-600/15 bg-white/65' : 'border border-white/15 bg-slate-950/55'
          }`}
        />
        <div
          className={`absolute left-1/2 top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full ${
            isLight
              ? 'bg-blue-500 shadow-[0_0_24px_rgba(37,99,235,0.55)]'
              : 'bg-blue-300 shadow-[0_0_26px_rgba(147,197,253,0.72)]'
          }`}
        />
      </motion.div>

      {PROVIDER_LOGOS.map((logo) => (
        <motion.img
          key={`${logo.src}-${logo.className}`}
          src={logo.src}
          alt={logo.alt}
          className={`absolute rounded-2xl p-2 backdrop-blur-sm ${logo.className} ${
            isLight
              ? 'border border-slate-200/90 bg-white/84 shadow-xl shadow-slate-900/8'
              : 'border border-slate-300/10 bg-slate-950/42 shadow-2xl shadow-black/30'
          }`}
          initial={{ y: 0, opacity: isLight ? 0.76 : 0.82 }}
          animate={{ y: [0, -8, 0, 6, 0], opacity: [0.66, 0.9, 0.72, 0.86, 0.66] }}
          transition={{ duration: logo.duration, repeat: Infinity, ease: 'easeInOut', delay: logo.delay }}
        />
      ))}
    </div>
  );
};

export default AuthCloudBackdrop;
