import React, { useState } from 'react';
import { 
  Sparkles, 
  Home, 
  Compass, 
  ClipboardList, 
  QrCode, 
  User, 
  Shield, 
  LogOut, 
  Menu, 
  X, 
  Search,
  Bell,
  Ticket
} from 'lucide-react';
import { StudentUser, StudentNavTab } from '../../types';

interface StudentNavbarProps {
  currentTab: StudentNavTab;
  setCurrentTab: (tab: StudentNavTab) => void;
  activeStudent: StudentUser | null;
  registrationCount: number;
  ticketCount: number;
  onOpenAuthModal: () => void;
  onSwitchToAdmin: () => void;
  onLogoutStudent: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const StudentNavbar: React.FC<StudentNavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeStudent,
  registrationCount,
  ticketCount,
  onOpenAuthModal,
  onSwitchToAdmin,
  onLogoutStudent,
  searchQuery,
  setSearchQuery
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const navItems = [
    { id: 'HOME' as StudentNavTab, label: 'Home', icon: Home },
    { id: 'EXPLORE' as StudentNavTab, label: 'Explore Events', icon: Compass },
    { 
      id: 'REGISTRATIONS' as StudentNavTab, 
      label: 'My Registrations', 
      icon: ClipboardList, 
      badge: registrationCount 
    },
    { 
      id: 'TICKETS' as StudentNavTab, 
      label: 'My QR Tickets', 
      icon: QrCode, 
      badge: ticketCount 
    },
    { id: 'PROFILE' as StudentNavTab, label: 'Profile', icon: User }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentTab('HOME')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-5 h-5 fill-white/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                    Fest<span className="text-brand-600">Gate</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-brand-50 text-brand-700 border border-brand-200/60">
                    Student Portal
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 hidden sm:block tracking-normal">
                  Every Event. One Smart Gate.
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`ml-0.5 px-1.5 py-0.2 text-[11px] font-extrabold rounded-full ${
                      isActive ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Switch to Admin + Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Switch to Admin Dashboard */}
            <button
              onClick={onSwitchToAdmin}
              title="Switch to Admin Dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Admin</span>
              <span className="hidden md:inline">Dashboard</span>
            </button>

            {/* Student User Profile Dropdown */}
            {activeStudent ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-200/60"
                >
                  <div className="text-right hidden lg:block">
                    <div className="text-xs font-extrabold text-slate-800 leading-tight">
                      {activeStudent.name}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 font-mono">
                      {activeStudent.rollNo}
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-xl ${activeStudent.avatarBg || 'bg-brand-600'} text-white flex items-center justify-center text-xs font-black shadow-xs`}>
                    {activeStudent.initials || activeStudent.name.slice(0, 2).toUpperCase()}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fadeIn">
                    <div className="p-3 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logged in as</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">{activeStudent.name}</div>
                      <div className="text-xs font-medium text-slate-500 font-mono">{activeStudent.rollNo}</div>
                      <div className="text-xs text-brand-600 mt-1">{activeStudent.department}</div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCurrentTab('REGISTRATIONS');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                          My Registrations
                        </span>
                        <span className="px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-md text-[10px]">
                          {registrationCount}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('TICKETS');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <QrCode className="w-3.5 h-3.5 text-slate-400" />
                          My QR Tickets
                        </span>
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px]">
                          {ticketCount}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('PROFILE');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Manage Profile & Switch
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onLogoutStudent();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Switch / Logout Student
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-sm shadow-brand-500/25 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Student Login</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-fadeIn shadow-lg">
          <div className="px-2 py-1 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-brand-600 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="border-t border-slate-100 pt-3">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onSwitchToAdmin();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-900 text-white shadow-xs"
            >
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Switch to Admin Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
