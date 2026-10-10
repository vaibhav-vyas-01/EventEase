import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Hash, 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  QrCode, 
  LogOut, 
  Users, 
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { StudentUser, Attendee } from '../../types';
import { FestService } from '../../services/firebase';

interface StudentProfileViewProps {
  activeStudent: StudentUser | null;
  attendees: Attendee[];
  onSelectStudent: (student: StudentUser) => void;
  onOpenNewStudentModal: () => void;
  onLogoutStudent: () => void;
  onViewTickets: () => void;
  onViewRegistrations: () => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  activeStudent,
  attendees,
  onSelectStudent,
  onOpenNewStudentModal,
  onLogoutStudent,
  onViewTickets,
  onViewRegistrations
}) => {
  const defaultStudents = FestService.getDefaultStudents();

  const totalRegistered = attendees.length;
  const attendedCount = attendees.filter(a => a.status === 'CHECKED_IN').length;
  const attendanceRate = totalRegistered > 0 ? Math.round((attendedCount / totalRegistered) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        
        {/* Background accent banner */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600"></div>

        <div className="relative pt-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className={`w-20 h-20 rounded-3xl ${activeStudent?.avatarBg || 'bg-brand-600'} text-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-black shrink-0`}>
              {activeStudent?.initials || activeStudent?.name.slice(0, 2).toUpperCase() || 'ST'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {activeStudent?.name || 'Guest Student'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Student
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">
                {activeStudent?.rollNo} • {activeStudent?.department}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={onLogoutStudent}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-extrabold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch / Logout</span>
            </button>
          </div>

        </div>

        {/* Student Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>College Email</span>
            </div>
            <div className="text-xs font-extrabold text-slate-800 truncate">
              {activeStudent?.email || 'N/A'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Academic Department</span>
            </div>
            <div className="text-xs font-extrabold text-slate-800 truncate">
              {activeStudent?.department || 'Engineering'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Year / Batch</span>
            </div>
            <div className="text-xs font-extrabold text-slate-800">
              {activeStudent?.year || '3rd Year'}
            </div>
          </div>

        </div>

      </div>

      {/* Student Activity Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div 
          onClick={onViewRegistrations}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md cursor-pointer transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Enrolled Events
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalRegistered}</div>
          <div className="text-xs text-brand-600 font-bold mt-1 flex items-center gap-1">
            <span>View Registrations</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        <div 
          onClick={onViewTickets}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md cursor-pointer transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Valid QR Tickets
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalRegistered}</div>
          <div className="text-xs text-purple-600 font-bold mt-1 flex items-center gap-1">
            <span>Open Ticket Passes</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Check-In Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{attendanceRate}%</div>
          <div className="text-xs text-slate-400 font-medium mt-1">
            {attendedCount} of {totalRegistered} events checked-in
          </div>
        </div>

      </div>

      {/* QUICK STUDENT SWITCHER (DEMO TESTING & DATA ISOLATION DEMONSTRATION) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              <h3 className="text-lg font-black text-slate-900">
                Switch Student Account (Test Data Isolation)
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Click any profile below to verify that registrations and QR tickets are strictly isolated per student.
            </p>
          </div>

          <button
            onClick={onOpenNewStudentModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-extrabold text-xs transition-colors self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Add New Student</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {defaultStudents.map((stu) => {
            const isCurrent = activeStudent?.rollNo === stu.rollNo;
            return (
              <div
                key={stu.id}
                onClick={() => onSelectStudent(stu)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-50/50 shadow-xs ring-2 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stu.avatarBg} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs`}>
                    {stu.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                      <span>{stu.name}</span>
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-brand-600 truncate">
                      {stu.rollNo}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {stu.department}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
