import React from 'react';
import { Search, Mail, Bell, Plus, QrCode, Sparkles } from 'lucide-react';

interface TopNavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isAdmin: boolean;
  onOpenNewEvent: () => void;
  onOpenScanner: () => void;
  onOpenRegister: () => void;
  onOpenAuthModal: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  searchQuery,
  setSearchQuery,
  isAdmin,
  onOpenNewEvent,
  onOpenScanner,
  onOpenRegister,
  onOpenAuthModal
}) => {
  return (
    <header className="flex items-center justify-between gap-4 py-4 px-8 bg-white/70 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100/60">
      {/* Search Input matching screenshot pill styling */}
      <div className="relative flex-1 max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your event, student, roll no, or ticket code..."
          className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-50/90 border border-slate-200/60 text-slate-700 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Action Buttons & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Scan & Register Buttons */}
        <button
          onClick={onOpenScanner}
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold transition-all"
          title="Open Gate QR Scanner"
        >
          <QrCode className="w-3.5 h-3.5 text-brand-600" />
          <span>Scan Gate Pass</span>
        </button>

        <button
          onClick={onOpenRegister}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-all border border-brand-200/50"
          title="Register Student for Event"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Register Student</span>
        </button>

        {isAdmin && (
          <button
            onClick={onOpenNewEvent}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/25"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Event</span>
          </button>
        )}

        {/* Circular Mail Icon Button matching screenshot */}
        <button 
          onClick={() => alert("FestGate Announcements:\n- Gate 1 scanner calibrated.\n- Cultural Gala registration closing at 6 PM.")}
          className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-sm relative"
          title="Gate Communications"
        >
          <Mail className="w-4 h-4" />
        </button>

        {/* Circular Bell Icon Button matching screenshot */}
        <button 
          onClick={() => alert("Recent Gate Notifications:\n• 142 students checked in at Main Gate\n• 0 duplicate violations detected")}
          className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-sm relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white"></span>
        </button>

        {/* User / Admin Profile pill matching screenshot */}
        <div 
          onClick={onOpenAuthModal}
          className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full bg-slate-50/80 hover:bg-slate-100 border border-slate-200/50 cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-sm">
            {isAdmin ? 'AD' : 'JR'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {isAdmin ? 'Admin Gate' : 'Jason Ranti'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {isAdmin ? 'Superadmin' : 'Fest Officer'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
