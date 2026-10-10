import React, { useState, useEffect, useMemo } from 'react';
import { 
  StudentNavTab, 
  StudentUser, 
  EventItem, 
  Attendee 
} from '../../types';
import { FestService } from '../../services/firebase';
import { StudentNavbar } from './StudentNavbar';
import { StudentHero } from './StudentHero';
import { StudentEventCard } from './StudentEventCard';
import { StudentEventDetailsModal } from './StudentEventDetailsModal';
import { StudentRegistrations } from './StudentRegistrations';
import { StudentQRTickets } from './StudentQRTickets';
import { StudentProfileView } from './StudentProfileView';
import { StudentAuthModal } from './StudentAuthModal';
import { TicketModal } from '../Modals/TicketModal';
import { 
  Sparkles, 
  Calendar, 
  Compass, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';

interface StudentPortalProps {
  onSwitchToAdmin: () => void;
  onSimulateAdminScan: (ticketCode: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  onSwitchToAdmin,
  onSimulateAdminScan
}) => {
  // Navigation
  const [currentTab, setCurrentTab] = useState<StudentNavTab>('HOME');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Active student identity
  const [activeStudent, setActiveStudent] = useState<StudentUser | null>(null);

  // Data states
  const [events, setEvents] = useState<EventItem[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Attendee[]>([]);

  // Modals
  const [selectedEventForModal, setSelectedEventForModal] = useState<EventItem | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [selectedTicketForModal, setSelectedTicketForModal] = useState<Attendee | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load initial student session and events
  const refreshData = () => {
    const student = FestService.getStudentAuth();
    setActiveStudent(student);

    const loadedEvents = FestService.getEvents();
    setEvents(loadedEvents);

    if (student) {
      const studentRegs = FestService.getStudentRegistrations(student.rollNo);
      setMyRegistrations(studentRegs);
    } else {
      setMyRegistrations([]);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // When active student changes, reload registrations
  const handleStudentChanged = (student: StudentUser) => {
    setActiveStudent(student);
    const regs = FestService.getStudentRegistrations(student.rollNo);
    setMyRegistrations(regs);
  };

  const handleLogoutStudent = () => {
    setIsAuthModalOpen(true);
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || (
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.coordinator.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchesCategory && matchesSearch;
    });
  }, [events, selectedCategory, searchQuery]);

  // Map of student's registered events by eventId for instant lookup
  const registeredEventsMap = useMemo(() => {
    const map = new Map<string, Attendee>();
    myRegistrations.forEach((r) => {
      map.set(r.eventId, r);
    });
    return map;
  }, [myRegistrations]);

  // Actions
  const handleOpenEventDetails = (event: EventItem) => {
    setSelectedEventForModal(event);
    setIsEventDetailsOpen(true);
  };

  const handleRegistrationSuccess = (newAttendee: Attendee) => {
    setIsEventDetailsOpen(false);
    refreshData();
    // Prompt to view the generated ticket
    setSelectedTicketForModal(newAttendee);
  };

  const handleViewTicket = (attendee: Attendee) => {
    setSelectedTicketForModal(attendee);
  };

  const handleSimulateCheckInFromTicket = (ticketCode: string) => {
    // Call the Admin Scanner or verify directly
    const res = FestService.verifyTicket(ticketCode, 'Gate 1 - Lead');
    alert(res.message);
    refreshData();
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-slate-800 flex flex-col font-sans">
      
      {/* Top Student Navigation Bar */}
      <StudentNavbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeStudent={activeStudent}
        registrationCount={myRegistrations.length}
        ticketCount={myRegistrations.length}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSwitchToAdmin={onSwitchToAdmin}
        onLogoutStudent={handleLogoutStudent}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Body Content based on active tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* ==================== TAB: HOME ==================== */}
        {currentTab === 'HOME' && (
          <div className="space-y-10 animate-fadeIn">
            
            {/* Hero Section */}
            <StudentHero
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onExploreClick={() => setCurrentTab('EXPLORE')}
              onViewTicketsClick={() => setCurrentTab('TICKETS')}
              activeTicketCount={myRegistrations.length}
            />

            {/* Quick Banner if Student has active ticket pass */}
            {myRegistrations.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      You have {myRegistrations.length} active campus event {myRegistrations.length === 1 ? 'pass' : 'passes'}!
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Latest: <strong className="text-slate-800">{myRegistrations[0].eventTitle}</strong> ({myRegistrations[0].ticketCode})
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleViewTicket(myRegistrations[0])}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-extrabold text-xs shadow-xs transition-colors self-start sm:self-auto"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Open Latest QR Pass</span>
                </button>
              </div>
            )}

            {/* Upcoming College Events Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-brand-600 fill-brand-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                      College Events Hub
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Upcoming Campus Events
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTab('EXPLORE')}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    <span>View All ({events.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Event Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.slice(0, 6).map((event) => (
                  <StudentEventCard
                    key={event.id}
                    event={event}
                    registeredAttendee={registeredEventsMap.get(event.id)}
                    onRegisterClick={handleOpenEventDetails}
                    onViewTicketClick={handleViewTicket}
                    onOpenDetails={handleOpenEventDetails}
                  />
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB: EXPLORE ==================== */}
        {currentTab === 'EXPLORE' && (
          <div className="space-y-7 animate-fadeIn">
            
            {/* Explore Header & Filter Controls */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Compass className="w-5 h-5 text-brand-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                    Discover Campus Life
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Explore All Events
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Browse {events.length} active college events, hackathons, and symposiums.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter events..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold placeholder-slate-400 focus:outline-hidden focus:border-brand-500"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {['ALL', 'TECH', 'DESIGN', 'CULTURAL', 'GAMING', 'WORKSHOP'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    selectedCategory === cat
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Events' : cat}
                </button>
              ))}
            </div>

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
                <p className="text-slate-500 font-bold text-sm">No events match your search criteria.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                  className="mt-3 text-xs font-black text-brand-600 hover:underline"
                >
                  Reset search filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <StudentEventCard
                    key={event.id}
                    event={event}
                    registeredAttendee={registeredEventsMap.get(event.id)}
                    onRegisterClick={handleOpenEventDetails}
                    onViewTicketClick={handleViewTicket}
                    onOpenDetails={handleOpenEventDetails}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* ==================== TAB: REGISTRATIONS ==================== */}
        {currentTab === 'REGISTRATIONS' && (
          <StudentRegistrations
            attendees={myRegistrations}
            activeStudent={activeStudent}
            onViewTicket={handleViewTicket}
            onExploreEvents={() => setCurrentTab('EXPLORE')}
          />
        )}

        {/* ==================== TAB: TICKETS ==================== */}
        {currentTab === 'TICKETS' && (
          <StudentQRTickets
            attendees={myRegistrations}
            activeStudent={activeStudent}
            onSimulateCheckIn={handleSimulateCheckInFromTicket}
            onExploreEvents={() => setCurrentTab('EXPLORE')}
          />
        )}

        {/* ==================== TAB: PROFILE ==================== */}
        {currentTab === 'PROFILE' && (
          <StudentProfileView
            activeStudent={activeStudent}
            attendees={myRegistrations}
            onSelectStudent={handleStudentChanged}
            onOpenNewStudentModal={() => setIsAuthModalOpen(true)}
            onLogoutStudent={handleLogoutStudent}
            onViewTickets={() => setCurrentTab('TICKETS')}
            onViewRegistrations={() => setCurrentTab('REGISTRATIONS')}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">FestGate Campus Portal</span>
            <span>•</span>
            <span className="font-medium text-slate-400">Every Event. One Smart Gate.</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Real-Time Gate Verification System v2.4
          </div>
        </div>
      </footer>

      {/* Modals */}
      <StudentEventDetailsModal
        isOpen={isEventDetailsOpen}
        event={selectedEventForModal}
        activeStudent={activeStudent}
        onClose={() => setIsEventDetailsOpen(false)}
        onRegistrationSuccess={handleRegistrationSuccess}
        onViewTicket={handleViewTicket}
      />

      <TicketModal
        attendee={selectedTicketForModal}
        onClose={() => setSelectedTicketForModal(null)}
        onSimulateScan={(code) => {
          setSelectedTicketForModal(null);
          onSimulateAdminScan(code);
        }}
      />

      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleStudentChanged}
      />

    </div>
  );
};
