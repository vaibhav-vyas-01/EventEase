import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  QrCode,
  Award,
  Coffee,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventItem, Attendee, StudentUser, RegistrationResult } from '../../types';
import { FestService } from '../../services/firebase';

interface StudentEventDetailsModalProps {
  isOpen: boolean;
  event: EventItem | null;
  activeStudent: StudentUser | null;
  onClose: () => void;
  onRegistrationSuccess: (attendee: Attendee) => void;
  onViewTicket: (attendee: Attendee) => void;
}

export const StudentEventDetailsModal: React.FC<StudentEventDetailsModalProps> = ({
  isOpen,
  event,
  activeStudent,
  onClose,
  onRegistrationSuccess,
  onViewTicket
}) => {
  if (!isOpen || !event) return null;

  // Form states
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('3rd Year');
  const [agreeTerms, setAgreeTerms] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-fill form with active student if available
  useEffect(() => {
    if (activeStudent) {
      setName(activeStudent.name || '');
      setRollNo(activeStudent.rollNo || '');
      setEmail(activeStudent.email || '');
      setDepartment(activeStudent.department || 'Computer Science');
      setYear(activeStudent.year || '3rd Year');
    } else {
      setName('');
      setRollNo('');
      setEmail('');
      setDepartment('Computer Science');
      setYear('3rd Year');
    }
    setErrorMsg(null);
  }, [activeStudent, event]);

  // Check if current student is already registered
  const existingAttendee = activeStudent ? FestService.isStudentRegisteredForEvent(
    event.id,
    activeStudent.rollNo,
    activeStudent.email
  ) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !rollNo.trim() || !email.trim()) {
      setErrorMsg('Please fill in your name, roll number, and college email.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please accept the event code of conduct to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use duplicate-safe registration
      const result: RegistrationResult = FestService.registerAttendeeSafe({
        name: name.trim(),
        rollNo: rollNo.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        department,
        eventId: event.id
      });

      if (!result.success) {
        setIsSubmitting(false);
        setErrorMsg(result.message);
        return;
      }

      // Celebratory Confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.log("Confetti trigger:", err);
      }

      setIsSubmitting(false);
      onRegistrationSuccess(result.attendee!);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to complete registration.');
    }
  };

  const seatsLeft = Math.max(0, event.capacity - event.registeredCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 relative my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Hero Banner with Event Details */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden">
          {event.imageSrc ? (
            <img
              src={event.imageSrc}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${event.imageGradient}`} />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-brand-500 text-white mb-2 shadow-xs">
              {event.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              {event.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-300 mt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                {event.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                {event.time}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                {event.venue}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* Overview & Coordinator */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              About This Event
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {event.description}
            </p>
          </div>

          {/* Event Perks Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
              <Award className="w-5 h-5 text-amber-500 mb-1" />
              <span className="text-[11px] font-extrabold text-slate-800">Verified Certificate</span>
              <span className="text-[10px] text-slate-400">All attendees</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
              <Coffee className="w-5 h-5 text-emerald-500 mb-1" />
              <span className="text-[11px] font-extrabold text-slate-800">Refreshments</span>
              <span className="text-[10px] text-slate-400">Complimentary</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
              <FileCheck className="w-5 h-5 text-indigo-500 mb-1" />
              <span className="text-[11px] font-extrabold text-slate-800">QR Smart Gate</span>
              <span className="text-[10px] text-slate-400">Contactless entry</span>
            </div>
          </div>

          {/* Coordinator Information */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${event.coordinator.avatarBg} text-white flex items-center justify-center font-black text-xs shadow-xs`}>
                {event.coordinator.initials}
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-900">{event.coordinator.name}</div>
                <div className="text-[11px] font-semibold text-slate-500">{event.coordinator.role} • FestGate Lead</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-extrabold text-brand-600">{seatsLeft} Seats Left</div>
              <div className="text-[11px] text-slate-400">{event.registeredCount} / {event.capacity} Filled</div>
            </div>
          </div>

          {/* REGISTRATION FORM OR ALREADY REGISTERED STATUS */}
          {existingAttendee ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 animate-fadeIn">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-black text-emerald-900">
                    You Are Already Registered For This Event!
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Your unique smart gate pass is active. Ticket Code: <strong className="font-mono text-emerald-900">{existingAttendee.ticketCode}</strong>
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Status: <span className="font-extrabold uppercase">{existingAttendee.status}</span>
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => onViewTicket(existingAttendee)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>View & Download My QR Pass</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span>Student Registration Form</span>
                </h3>
                <span className="text-xs font-bold text-slate-400">Free Campus Admission</span>
              </div>

              {errorMsg && (
                <div className="p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Student Full Name */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Bagas Mahpie"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-xs font-bold text-slate-800 placeholder-slate-400 transition-all outline-hidden"
                    />
                  </div>

                  {/* Student Roll Number */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      University Roll / ID Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                      placeholder="e.g. IT-2024-118"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-xs font-bold font-mono text-slate-800 placeholder-slate-400 transition-all outline-hidden uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* College Email */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      College Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@festgate.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-xs font-bold text-slate-800 placeholder-slate-400 transition-all outline-hidden"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Academic Department *
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-xs font-bold text-slate-800 bg-white transition-all outline-hidden"
                    >
                      <option value="Computer Science">Computer Science & Engg</option>
                      <option value="Information Tech">Information Technology</option>
                      <option value="Electronics">Electronics & Comm.</option>
                      <option value="Mechanical Engg">Mechanical Engineering</option>
                      <option value="Design & Media">Design & Media Arts</option>
                      <option value="Business & Mgmt">Business & Management</option>
                    </select>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-500 font-semibold cursor-pointer">
                    I agree to the FestGate Campus Code of Conduct and authorize gate badge generation.
                  </label>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Generating Encrypted QR Pass...</span>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>Confirm Registration & Generate QR Ticket</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-slate-400 font-medium mt-2">
                    ⚡ Anti-Duplicate Protected: Ticket pass will be bound to your roll number.
                  </p>
                </div>

              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
