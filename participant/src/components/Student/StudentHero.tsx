import React from 'react';
import { 
  Sparkles, 
  Search, 
  Ticket, 
  QrCode, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Calendar,
  Users
} from 'lucide-react';

interface StudentHeroProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onExploreClick: () => void;
  onViewTicketsClick: () => void;
  activeTicketCount: number;
}

export const StudentHero: React.FC<StudentHeroProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onExploreClick,
  onViewTicketsClick,
  activeTicketCount
}) => {
  const categories = [
    { id: 'ALL', label: 'All Events' },
    { id: 'TECH', label: 'Tech & Hackathons' },
    { id: 'DESIGN', label: 'UI/UX & Design' },
    { id: 'CULTURAL', label: 'Cultural & Music' },
    { id: 'GAMING', label: 'E-Sports' },
    { id: 'WORKSHOP', label: 'Workshops' }
  ];

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-[#1E1B4B] to-slate-900 text-white shadow-2xl p-6 sm:p-10 lg:p-12 mb-10 border border-slate-800/80">
      
      {/* Decorative Background Lighting Gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 -mb-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none"></div>
      
      {/* Subtle Pattern Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl">
        
        {/* FestGate Branding Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-extrabold uppercase tracking-widest text-brand-300 mb-5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-400 fill-brand-400" />
          <span>Every Event. One Smart Gate.</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-5">
          Campus Events, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-indigo-200 to-purple-400">
            One Smart QR Pass Away.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl font-medium leading-relaxed mb-8">
          Register for the biggest college hackathons, design sprints, cultural galas, and e-sports tournaments in seconds. 
          Generate instant cryptographic QR gate tickets for fast-track entry.
        </p>

        {/* Action Buttons & Quick Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8">
          <button
            onClick={onExploreClick}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Explore Events</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onViewTicketsClick}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-extrabold text-sm transition-all"
          >
            <QrCode className="w-4 h-4 text-brand-300" />
            <span>My QR Tickets</span>
            {activeTicketCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-brand-400 text-slate-950">
                {activeTicketCount}
              </span>
            )}
          </button>
        </div>

        {/* Interactive Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, venue, category, or mentor..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white text-slate-900 focus:text-slate-900 placeholder-slate-400 text-sm font-semibold border border-white/20 focus:border-brand-500 focus:outline-hidden backdrop-blur-md transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white bg-white/10 px-2 py-1 rounded-md"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-white text-slate-950 shadow-md font-black scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Feature Pillar Highlights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5 text-brand-300" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white">Instant QR Passes</div>
            <div className="text-[11px] text-slate-400">Zero wait, immediate digital ticket</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white">1-Sec Contactless Gate Scan</div>
            <div className="text-[11px] text-slate-400">Rapid gate entry with live verification</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white">Duplicate & Anti-Fraud Lock</div>
            <div className="text-[11px] text-slate-400">One student, one registration guaranteed</div>
          </div>
        </div>
      </div>

    </div>
  );
};
