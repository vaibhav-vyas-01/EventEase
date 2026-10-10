import React from 'react';
import { ArrowRight, Sparkles, QrCode } from 'lucide-react';

interface HeroBannerProps {
  onOpenRegister: () => void;
  onOpenScanner: () => void;
  onOpenNewEvent: () => void;
  isAdmin: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenRegister,
  onOpenScanner,
  onOpenNewEvent,
  isAdmin
}) => {
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#6246EA] via-[#6C5CE7] to-[#7B61FF] text-white p-8 sm:p-10 shadow-lg shadow-brand-500/20 select-none">
      {/* Decorative SVG Sparkles / Stars matching reference screenshot */}
      <div className="absolute right-12 top-6 pointer-events-none opacity-40">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
          <path d="M50 0L53 45L98 50L53 55L50 100L47 55L2 50L47 45L50 0Z" fill="white" fillOpacity="0.3" />
        </svg>
      </div>
      <div className="absolute right-48 bottom-4 pointer-events-none opacity-30">
        <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
          <path d="M50 0L53 45L98 50L53 55L50 100L47 55L2 50L47 45L50 0Z" fill="white" fillOpacity="0.4" />
        </svg>
      </div>
      <div className="absolute right-32 top-32 pointer-events-none opacity-20">
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
          <path d="M50 0L53 45L98 50L53 55L50 100L47 55L2 50L47 45L50 0Z" fill="white" fillOpacity="0.5" />
        </svg>
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-xl">
        {/* Category Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase mb-4 text-white/90">
          <Sparkles className="w-3 h-3" />
          <span>Smart Event Gateway</span>
        </div>

        {/* Headline matching screenshot layout */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-3">
          Every Event. One Smart Gate.
        </h1>

        {/* Subtitle */}
        <p className="text-white/80 text-sm sm:text-base font-normal mb-7 max-w-lg leading-relaxed">
          Streamline university festivals with instant QR pass issuance, fraud-proof gate verification, and real-time attendance analytics.
        </p>

        {/* Action Button matching screenshot "Join Now >" style */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenScanner}
            className="group inline-flex items-center gap-3.5 pl-6 pr-2 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-sm font-bold shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <span>Scan Pass Now</span>
            <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center transition-transform group-hover:translate-x-1">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </button>

          <button
            onClick={onOpenRegister}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-sm font-semibold transition-all border border-white/20"
          >
            <QrCode className="w-4 h-4" />
            <span>Register Attendee</span>
          </button>

          {isAdmin && (
            <button
              onClick={onOpenNewEvent}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-brand-700 hover:bg-slate-100 text-sm font-bold transition-all shadow-md"
            >
              <span>+ Create Fest Event</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
