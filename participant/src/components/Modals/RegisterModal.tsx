import React, { useState } from 'react';
import { X, Sparkles, User, Mail, GraduationCap, Building } from 'lucide-react';
import { EventItem, Attendee } from '../../types';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  preselectedEventId?: string;
  onRegistered: (attendee: Attendee) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  events,
  preselectedEventId,
  onRegistered
}) => {
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [eventId, setEventId] = useState(preselectedEventId || (events[0]?.id || ''));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rollNo || !email) return;

    const selectedEvt = events.find(e => e.id === eventId) || events[0];

    const names = name.trim().split(' ');
    const initials = (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
    const ticketCode = `FG-${randomHex}-${randomSuffix}`;
    const now = new Date();
    const dateFormatted = now.toISOString().slice(0, 10) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAttendee: Attendee = {
      id: 'att-' + Date.now().toString(36),
      ticketCode,
      name,
      rollNo,
      email,
      department,
      eventId: selectedEvt.id,
      eventTitle: selectedEvt.title,
      eventCategory: selectedEvt.category,
      registeredAt: dateFormatted,
      status: 'REGISTERED',
      initials,
      avatarBg: 'bg-brand-600'
    };

    onRegistered(newAttendee);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[28px] w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25">
            <Sparkles className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Student Event Registration</h2>
            <p className="text-xs text-slate-400">Generate an instant verified FestGate Pass with smart QR code</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Select Event</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  [{evt.category}] {evt.title} ({evt.registeredCount}/{evt.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Student Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jason Ranti"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Roll / Student ID</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="CS-2024-042"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Department</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="p-3 bg-brand-50/70 rounded-2xl border border-brand-100 text-xs text-brand-900 leading-relaxed">
            ✨ Once confirmed, your unique FestGate Pass will be generated instantly with a tamper-resistant QR code for gate admission.
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold shadow-lg shadow-brand-500/25 transition-all"
            >
              Generate Ticket Pass
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
