import React from 'react';
import { ArrowUpRight, CheckCircle2, Clock, QrCode } from 'lucide-react';
import { Attendee } from '../types';

interface RegistrationTableProps {
  attendees: Attendee[];
  onSelectAttendee: (attendee: Attendee) => void;
  onViewAll?: () => void;
}

export const RegistrationTable: React.FC<RegistrationTableProps> = ({
  attendees,
  onSelectAttendee,
  onViewAll
}) => {
  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-100/80 shadow-sm space-y-4">
      {/* Table Header matching screenshot */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
          Recent Registrations
        </h2>
        <button 
          onClick={onViewAll}
          className="text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
        >
          See all
        </button>
      </div>

      {/* Table Structure */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3.5 pl-2 font-bold">Attendee</th>
              <th className="pb-3.5 px-4 font-bold">Event Type</th>
              <th className="pb-3.5 px-4 font-bold">Ticket & Details</th>
              <th className="pb-3.5 px-4 font-bold">Gate Status</th>
              <th className="pb-3.5 pr-2 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {attendees.slice(0, 6).map((attendee) => {
              const isCheckedIn = attendee.status === 'CHECKED_IN';
              return (
                <tr 
                  key={attendee.id} 
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => onSelectAttendee(attendee)}
                >
                  {/* Attendee Profile Column */}
                  <td className="py-4 pl-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${attendee.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm`}>
                        {attendee.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-800 group-hover:text-brand-600 transition-colors truncate">
                          {attendee.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {attendee.rollNo} • {attendee.department}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type Column matching screenshot pill badge */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span 
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
                      style={{
                        backgroundColor: attendee.eventCategory === 'TECH' ? '#E0F2FE' : attendee.eventCategory === 'DESIGN' ? '#F3E8FF' : '#FFE4E6',
                        color: attendee.eventCategory === 'TECH' ? '#0369A1' : attendee.eventCategory === 'DESIGN' ? '#7E22CE' : '#BE123C'
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: attendee.eventCategory === 'TECH' ? '#0284C7' : attendee.eventCategory === 'DESIGN' ? '#7C3AED' : '#E11D48' }}></span>
                      {attendee.eventCategory || 'EVENT'}
                    </span>
                  </td>

                  {/* Description / Ticket code column */}
                  <td className="py-4 px-4 min-w-[200px]">
                    <div className="font-semibold text-slate-700 text-xs truncate">
                      {attendee.eventTitle}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                      <QrCode className="w-3 h-3 text-brand-500" />
                      <span>{attendee.ticketCode}</span>
                    </div>
                  </td>

                  {/* Status Column */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {isCheckedIn ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Admitted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Registered</span>
                      </span>
                    )}
                  </td>

                  {/* Action Column with arrow button matching screenshot */}
                  <td className="py-4 pr-2 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAttendee(attendee);
                      }}
                      className="w-8 h-8 rounded-full border border-slate-200 bg-white group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white text-slate-400 inline-flex items-center justify-center transition-all shadow-sm"
                      title="Inspect Ticket Pass"
                    >
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {attendees.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            No registrations found. Use the "Register Student" button to add attendees!
          </div>
        )}
      </div>
    </div>
  );
};
