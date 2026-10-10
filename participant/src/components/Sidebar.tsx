import React from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  Ticket, 
  QrCode, 
  Users, 
  Settings, 
  LogOut, 
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenScanner: () => void;
  onOpenNewEvent: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isAdmin,
  onOpenAuthModal,
  onLogout,
  onOpenScanner,
  onOpenNewEvent
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Ticket, action: onOpenNewEvent, badge: 'New' },
    { id: 'scanner', label: 'Gate Scanner', icon: QrCode, action: onOpenScanner, highlight: true },
    { id: 'registrations', label: 'Registrations', icon: Users },
  ];

  const friends = [
    { name: 'Bagas Mahpie', role: 'Gate Lead', initials: 'BM', color: 'bg-purple-600' },
    { name: 'Sir Dandy', role: 'Security Ops', initials: 'SD', color: 'bg-indigo-600' },
    { name: 'Jhon Tosan', role: 'Volunteer', initials: 'JT', color: 'bg-sky-600' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100/80 flex flex-col justify-between p-6 shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
          <div className="w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Sparkles className="w-5 h-5 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">FestGate</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 -mt-0.5">Every Event. One Smart Gate.</p>
          </div>
        </div>

        {/* OVERVIEW Menu */}
        <div className="mb-8">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Overview
          </div>
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      setCurrentTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-brand-50 text-brand-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-700'
                    }`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* FRIENDS / GATE CREW */}
        <div className="mb-6">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3 flex items-center justify-between">
            <span>Gate Crew</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-semibold">3 Active</span>
          </div>
          <div className="space-y-2">
            {friends.map((friend, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group"
              >
                <div className={`w-9 h-9 rounded-full ${friend.color} text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm shrink-0`}>
                  {friend.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-600 transition-colors">
                    {friend.name}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{friend.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SETTINGS & LOGOUT */}
      <div className="pt-4 border-t border-slate-100 space-y-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
          Settings
        </div>
        
        {isAdmin ? (
          <div className="p-3 mb-2 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-emerald-900 leading-tight">Admin Gatekeeper</div>
              <div className="text-[11px] text-emerald-600">Full Access Enabled</div>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Admin Login</span>
          </button>
        )}

        {isAdmin ? (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Admin</span>
          </button>
        ) : (
          <div className="px-3.5 py-2 text-[11px] text-slate-400">
            FestGate v2.4 Live
          </div>
        )}
      </div>
    </aside>
  );
};
