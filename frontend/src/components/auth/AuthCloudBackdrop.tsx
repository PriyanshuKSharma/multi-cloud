import React from 'react';
import { motion } from 'framer-motion';

const PROVIDER_LOGOS = [
  {
    src: '/provider-logos/aws.svg',
    alt: 'AWS logo',
    className: 'left-[8%] top-[14%] w-40 sm:w-44 lg:w-52',
    duration: 14,
    delay: 0,
  },
  {
    src: '/provider-logos/azure.svg',
    alt: 'Azure logo',
    className: 'right-[9%] top-[20%] w-40 sm:w-44 lg:w-52',
    duration: 16,
    delay: 0.5,
  },
  {
    src: '/provider-logos/gcp.svg',
    alt: 'Google Cloud logo',
    className: 'left-[20%] bottom-[14%] w-40 sm:w-44 lg:w-52',
    duration: 18,
    delay: 0.9,
  },
  {
    src: '/provider-logos/aws.svg',
    alt: 'AWS logo',
    className: 'right-[16%] bottom-[12%] w-36 sm:w-40 lg:w-44',
    duration: 15,
    delay: 0.3,
  },
];

const ORBIT_NODES = [
  { src: '/provider-logos/aws.svg', alt: 'AWS orbit logo', angle: 0 },
  { src: '/provider-logos/azure.svg', alt: 'Azure orbit logo', angle: 120 },
  { src: '/provider-logos/gcp.svg', alt: 'Google Cloud orbit logo', angle: 240 },
];

const AuthCloudBackdrop: React.FC = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_90%_15%,rgba(34,197,94,0.22),transparent_32%),radial-gradient(circle_at_50%_85%,rgba(14,165,233,0.18),transparent_40%),linear-gradient(140deg,#050911_0%,#091426_46%,#08111f_100%)]" />
      <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute left-1/2 top-0 h-[45vh] w-[45vh] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute -left-16 top-[24%] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -right-20 bottom-[18%] h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

      <motion.div
        className="absolute left-1/2 top-1/2 hidden h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 lg:block"
        animate={{ rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full border border-cyan-200/10" />
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-200/10" />
        <div className="absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-slate-950/50 backdrop-blur-sm" />
        <div className="absolute left-1/2 top-1/2 h-[8px] w-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.75)]" />

        {ORBIT_NODES.map((node) => (
          <img
            key={node.alt}
            src={node.src}
            alt={node.alt}
            className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-300/10 bg-slate-950/60 p-1.5 shadow-lg shadow-black/40"
            style={{
              transform: `translate(-50%, -50%) rotate(${node.angle}deg) translateY(-210px) rotate(-${node.angle}deg)`,
            }}
          />
        ))}
      </motion.div>

      {PROVIDER_LOGOS.map((logo) => (
        <motion.img
          key={`${logo.src}-${logo.className}`}
          src={logo.src}
          alt={logo.alt}
          className={`absolute rounded-2xl border border-slate-300/10 bg-slate-950/35 p-2 shadow-2xl shadow-black/30 backdrop-blur-sm ${logo.className}`}
          initial={{ y: 0, opacity: 0.85 }}
          animate={{ y: [0, -10, 0, 8, 0], opacity: [0.75, 0.95, 0.8, 0.9, 0.75] }}
          transition={{ duration: logo.duration, repeat: Infinity, ease: 'easeInOut', delay: logo.delay }}
        />
      ))}
    </div>
  );
};

export default AuthCloudBackdrop;
