import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { HeroBanner } from './components/HeroBanner';
import { StatCards } from './components/StatCards';
import { UpcomingEvents } from './components/UpcomingEvents';
import { RegistrationTable } from './components/RegistrationTable';
import { AnalyticsPanel } from './components/AnalyticsPanel';

import { EventModal } from './components/Modals/EventModal';
import { RegisterModal } from './components/Modals/RegisterModal';
import { TicketModal } from './components/Modals/TicketModal';
import { ScannerModal } from './components/Modals/ScannerModal';
import { AdminAuthModal } from './components/Modals/AdminAuthModal';

import { StudentPortal } from './components/Student/StudentPortal';

import { FestService } from './services/firebase';
import { EventItem, Attendee, Coordinator, StatSummary, PortalMode } from './types';
import { Sparkles, Compass, Shield } from 'lucide-react';

export function App() {
  // Mode switcher: Default to STUDENT as requested, with instant toggle to ADMIN
  const [portalMode, setPortalMode] = useState<PortalMode>(() => {
    return window.location.hash === '#admin' ? 'ADMIN' : 'STUDENT';
  });

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(FestService.checkAdminAuth());

  // Data states
  const [events, setEvents] = useState<EventItem[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [stats, setStats] = useState<StatSummary>({
    totalRegistered: 0,
    totalCheckedIn: 0,
    verificationRate: 0,
    activeEventsCount: 0
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [preselectedEventId, setPreselectedEventId] = useState<string | undefined>();
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialCode, setScannerInitialCode] = useState('');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Load initial data
  const refreshData = () => {
    const loadedEvents = FestService.getEvents();
    const loadedAttendees = FestService.getAttendees();
    const loadedCoordinators = FestService.getCoordinators();
    const loadedStats = FestService.getStats();

    setEvents(loadedEvents);
    setAttendees(loadedAttendees);
    setCoordinators(loadedCoordinators);
    setStats(loadedStats);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setPortalMode('ADMIN');
      } else if (window.location.hash === '#student') {
        setPortalMode('STUDENT');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Filtered lists for Admin Dashboard
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(e => 
      e.title.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.coordinator.name.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  const filteredAttendees = useMemo(() => {
    return attendees.filter(a => {
      const matchesSearch = !searchQuery.trim() || (
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.eventTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const matchesStatus = statusFilter === 'ALL' || (
        statusFilter === 'CHECKED_IN' ? a.status === 'CHECKED_IN' : a.status === 'REGISTERED'
      );

      return matchesSearch && matchesStatus;
    });
  }, [attendees, searchQuery, statusFilter]);

  // Handlers
  const handleSaveEvent = (newEventData: any) => {
    const created = FestService.addEvent(newEventData);
    refreshData();
    alert(`Event "${created.title}" successfully created!`);
  };

  const handleRegistered = (newAttendee: Attendee) => {
    const saved = FestService.registerAttendee({
      name: newAttendee.name,
      rollNo: newAttendee.rollNo,
      email: newAttendee.email,
      department: newAttendee.department,
      eventId: newAttendee.eventId
    });
    refreshData();
    // Open the generated ticket pass immediately
    setSelectedAttendee(saved);
  };

  const handleSimulateScan = (ticketCode: string) => {
    setScannerInitialCode(ticketCode);
    setIsScannerOpen(true);
  };

  const handleToggleFollow = (id: string) => {
    const updated = FestService.toggleCoordinatorFollow(id);
    setCoordinators(updated);
  };

  const handleExportCSV = () => {
    FestService.exportCSV();
  };

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    FestService.setAdminAuth(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    FestService.setAdminAuth(false);
  };

  // If in Student mode, render StudentPortal
  if (portalMode === 'STUDENT') {
    return (
      <>
        <StudentPortal
          onSwitchToAdmin={() => {
            setPortalMode('ADMIN');
            window.location.hash = '#admin';
          }}
          onSimulateAdminScan={(ticketCode) => {
            setPortalMode('ADMIN');
            window.location.hash = '#admin';
            handleSimulateScan(ticketCode);
          }}
        />

        {/* Global Scanner Modal can be triggered from Student Portal too */}
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => {
            setIsScannerOpen(false);
            setScannerInitialCode('');
          }}
          initialCode={scannerInitialCode}
          onScanSuccess={refreshData}
        />
      </>
    );
  }

  // Otherwise, render full Admin Dashboard (100% preserved)
  return (
    <div className="min-h-screen bg-[#F4F5F9] flex flex-col antialiased">
      
      {/* Top Banner indicating Admin Dashboard Mode with quick switch to Student Portal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-bold border-b border-indigo-900/40 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span>FestGate Admin & Gatekeeper Terminal v2.4</span>
          <span className="hidden sm:inline text-slate-400">• Every Event. One Smart Gate.</span>
        </div>
        <button
          onClick={() => {
            setPortalMode('STUDENT');
            window.location.hash = '#student';
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-xs shadow-xs transition-all hover:scale-[1.02]"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Switch to Student Portal 🎓</span>
        </button>
      </div>

      {/* Outer Dashboard Container matching screenshot layout */}
      <div className="flex flex-1 w-full max-w-[1720px] mx-auto overflow-hidden">
        
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isAdmin={isAdmin}
          onOpenAuthModal={() => setIsAdminAuthModalOpen(true)}
          onLogout={handleLogout}
          onOpenScanner={() => {
            setScannerInitialCode('');
            setIsScannerOpen(true);
          }}
          onOpenNewEvent={() => {
            if (!isAdmin) {
              setIsAdminAuthModalOpen(true);
            } else {
              setIsEventModalOpen(true);
            }
          }}
        />

        {/* Center Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Navbar */}
          <TopNavbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isAdmin={isAdmin}
            onOpenNewEvent={() => {
              if (!isAdmin) {
                setIsAdminAuthModalOpen(true);
              } else {
                setIsEventModalOpen(true);
              }
            }}
            onOpenScanner={() => {
              setScannerInitialCode('');
              setIsScannerOpen(true);
            }}
            onOpenRegister={() => {
              setPreselectedEventId(events[0]?.id);
              setIsRegisterModalOpen(true);
            }}
            onOpenAuthModal={() => setIsAdminAuthModalOpen(true)}
            onSwitchToStudentPortal={() => {
              setPortalMode('STUDENT');
              window.location.hash = '#student';
            }}
          />

          {/* Main Dashboard Content */}
          <main className="p-6 lg:p-8 space-y-7 max-w-5xl mx-auto w-full">
            {/* Purple Hero Banner */}
            <HeroBanner
              isAdmin={isAdmin}
              onOpenRegister={() => {
                setPreselectedEventId(events[0]?.id);
                setIsRegisterModalOpen(true);
              }}
              onOpenScanner={() => {
                setScannerInitialCode('');
                setIsScannerOpen(true);
              }}
              onOpenNewEvent={() => {
                if (!isAdmin) {
                  setIsAdminAuthModalOpen(true);
                } else {
                  setIsEventModalOpen(true);
                }
              }}
            />

            {/* Three Statistic Cards */}
            <StatCards
              stats={stats}
              onFilterStatus={(filter) => setStatusFilter(filter)}
            />

            {/* Upcoming Events Carousel */}
            <UpcomingEvents
              events={filteredEvents}
              onSelectEvent={(evt) => {
                setPreselectedEventId(evt.id);
                setIsRegisterModalOpen(true);
              }}
              onQuickRegister={(evt) => {
                setPreselectedEventId(evt.id);
                setIsRegisterModalOpen(true);
              }}
            />

            {/* Registration Table */}
            <RegistrationTable
              attendees={filteredAttendees}
              onSelectAttendee={(att) => setSelectedAttendee(att)}
              onViewAll={() => setStatusFilter('ALL')}
            />
          </main>
        </div>

        {/* Right-Side Analytics Panel */}
        <AnalyticsPanel
          stats={stats}
          coordinators={coordinators}
          onToggleFollow={handleToggleFollow}
          onExportCSV={handleExportCSV}
          isAdmin={isAdmin}
        />
      </div>

      {/* Interactive Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        events={events}
        preselectedEventId={preselectedEventId}
        onRegistered={handleRegistered}
      />

      <TicketModal
        attendee={selectedAttendee}
        onClose={() => setSelectedAttendee(null)}
        onSimulateScan={handleSimulateScan}
      />

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setScannerInitialCode('');
        }}
        initialCode={scannerInitialCode}
        onScanSuccess={refreshData}
      />

      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
