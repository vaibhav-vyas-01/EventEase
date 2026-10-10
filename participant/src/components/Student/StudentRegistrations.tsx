import React, { useState } from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  MapPin, 
  QrCode, 
  ExternalLink, 
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Attendee, StudentUser } from '../../types';

interface StudentRegistrationsProps {
  attendees: Attendee[];
  activeStudent: StudentUser | null;
  onViewTicket: (attendee: Attendee) => void;
  onExploreEvents: () => void;
}

export const StudentRegistrations: React.FC<StudentRegistrationsProps> = ({
  attendees,
  activeStudent,
  onViewTicket,
  onExploreEvents
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REGISTERED' | 'CHECKED_IN'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  const filtered = attendees.filter((a) => {
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesSearch = !searchFilter.trim() || (
      a.eventTitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.ticketCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.eventCategory.toLowerCase().includes(searchFilter.toLowerCase())
    );
    return matchesStatus && matchesSearch;
  });

  const totalRegistered = attendees.length;
  const checkedInCount = attendees.filter(a => a.status === 'CHECKED_IN').length;
  const upcomingCount = totalRegistered - checkedInCount;

  return (
    <div className="space-y-7 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <ClipboardList className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-brand-600">
              Student Records
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Event Registrations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Verified registrations and gate status for <span className="font-bold text-slate-800">{activeStudent?.name}</span> ({activeStudent?.rollNo}).
          </p>
        </div>

        {/* Quick Stats Pill Strip */}
        <div className="flex items-center gap-3">
          <div className="p-3.5 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <div className="text-xl font-black text-slate-900">{totalRegistered}</div>
            <div className="text-[11px] font-bold text-slate-400">Total Enrolled</div>
          </div>
          <div className="p-3.5 px-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
            <div className="text-xl font-black text-emerald-700">{checkedInCount}</div>
            <div className="text-[11px] font-bold text-emerald-600">Checked-In</div>
          </div>
          <div className="p-3.5 px-5 rounded-2xl bg-brand-50 border border-brand-100 text-center">
            <div className="text-xl font-black text-brand-700">{upcomingCount}</div>
            <div className="text-[11px] font-bold text-brand-600">Upcoming</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/60 w-fit">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({totalRegistered})
          </button>
          <button
            onClick={() => setStatusFilter('REGISTERED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              statusFilter === 'REGISTERED'
                ? 'bg-white text-brand-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setStatusFilter('CHECKED_IN')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              statusFilter === 'CHECKED_IN'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admitted ({checkedInCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by event or ticket..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold placeholder-slate-400 focus:outline-hidden focus:border-brand-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Registrations List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">No Registrations Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchFilter
                ? 'No events match your search query.'
                : 'You have not registered for any events yet. Explore upcoming campus events and secure your instant QR pass!'}
            </p>
          </div>
          <button
            onClick={onExploreEvents}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all"
          >
            <span>Explore Campus Events</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((attendee) => {
            const isCheckedIn = attendee.status === 'CHECKED_IN';
            return (
              <div
                key={attendee.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Card Header Status & Pass Code */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 tracking-wider">
                      {attendee.ticketCode}
                    </span>

                    {isCheckedIn ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Admitted ({attendee.checkedInAt?.slice(11, 16) || 'Gate'})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                        <span>Ready For Gate Scan</span>
                      </span>
                    )}
                  </div>

                  {/* Event Title & Category */}
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {attendee.eventTitle}
                  </h3>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {attendee.eventCategory}
                  </div>

                  {/* Registered Timestamp */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Registered on {attendee.registeredAt}</span>
                  </div>

                  {/* Department & Roll */}
                  <div className="text-[11px] font-medium text-slate-400 mt-1">
                    Student ID: {attendee.rollNo} • {attendee.department}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-400">
                    {isCheckedIn ? 'Gate Verified' : 'Scan Required at Entry'}
                  </div>

                  <button
                    onClick={() => onViewTicket(attendee)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-extrabold text-xs shadow-xs transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View QR Ticket Pass</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
