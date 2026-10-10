import React, { useEffect, useRef, useState } from 'react';
import { 
  QrCode, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Calendar, 
  MapPin, 
  User, 
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import QRCode from 'qrcode';
import { Attendee, StudentUser } from '../../types';

interface StudentQRTicketsProps {
  attendees: Attendee[];
  activeStudent: StudentUser | null;
  onSimulateCheckIn: (ticketCode: string) => void;
  onExploreEvents: () => void;
}

// Individual QR Pass Ticket Card with Canvas Rendering
const QRPassCard: React.FC<{
  attendee: Attendee;
  onSimulateCheckIn: (ticketCode: string) => void;
}> = ({ attendee, onSimulateCheckIn }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        attendee.ticketCode,
        {
          width: 170,
          margin: 1,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF'
          }
        },
        (error) => {
          if (error) console.error("QR Code canvas generation failed:", error);
        }
      );
    }
  }, [attendee.ticketCode]);

  const isCheckedIn = attendee.status === 'CHECKED_IN';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(attendee.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-[28px] border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col md:flex-row max-w-2xl mx-auto">
      
      {/* Left / Top Section: Event Details & Student Info */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between border-b md:border-b-0 md:border-r border-dashed border-slate-200 relative bg-linear-to-b from-white to-slate-50/50">
        <div>
          {/* Top Pass Tag */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-pulse"></span>
              <span className="text-[11px] font-black uppercase tracking-wider text-brand-600">
                Official Gate Pass
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-400">
              {attendee.eventCategory}
            </span>
          </div>

          {/* Event Title */}
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
            {attendee.eventTitle}
          </h3>

          {/* Student Info Box */}
          <div className="mt-4 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
              <span>{attendee.name}</span>
              <span className="font-mono text-brand-600">{attendee.rollNo}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-400">
              {attendee.department}
            </div>
          </div>

          {/* Timestamp Info */}
          <div className="text-[11px] text-slate-500 font-medium mt-3 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Issued: {attendee.registeredAt}</span>
          </div>
        </div>

        {/* Admittance Status Banner */}
        <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between">
          {isCheckedIn ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Admitted ({attendee.checkedInAt})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-black">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Ready for Gate Scan</span>
            </div>
          )}

          {/* Quick Print Button */}
          <button
            onClick={handlePrint}
            title="Print or Save PDF"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        {/* Cutout Notch circles on top & bottom for authentic ticket aesthetic */}
        <div className="hidden md:block absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#F4F5F9] border-b border-l border-slate-200/50"></div>
        <div className="hidden md:block absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-[#F4F5F9] border-t border-l border-slate-200/50"></div>
      </div>

      {/* Right / Bottom Section: Dedicated High-Res QR Code */}
      <div className="p-6 bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 w-full md:w-64 text-center">
        
        {/* Crisp QR Code Container */}
        <div className="p-2.5 bg-white rounded-2xl shadow-lg mb-3">
          <canvas ref={canvasRef} className="rounded-xl" />
        </div>

        {/* Ticket Code with Copy */}
        <div className="flex items-center gap-1.5 font-mono text-xs font-black tracking-wider text-slate-200">
          <span>{attendee.ticketCode}</span>
          <button
            onClick={handleCopyCode}
            title="Copy Ticket ID"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        {copied && (
          <span className="text-[10px] text-emerald-400 font-bold mt-0.5">
            Copied to clipboard!
          </span>
        )}

        <div className="text-[10px] text-slate-400 font-medium mt-1">
          Present at FestGate Terminal
        </div>

        {/* Direct Test Gate Check-in Simulator Button */}
        {!isCheckedIn && (
          <button
            onClick={() => onSimulateCheckIn(attendee.ticketCode)}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-black shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate Gate Check-in</span>
          </button>
        )}
      </div>

    </div>
  );
};

export const StudentQRTickets: React.FC<StudentQRTicketsProps> = ({
  attendees,
  activeStudent,
  onSimulateCheckIn,
  onExploreEvents
}) => {
  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <QrCode className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-purple-600">
              Smart Wallet
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My QR Tickets
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Official cryptographic QR admission passes issued to <span className="font-bold text-slate-800">{activeStudent?.name}</span> ({activeStudent?.rollNo}).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-extrabold font-mono">
            {attendees.length} Active {attendees.length === 1 ? 'Pass' : 'Passes'}
          </span>
        </div>
      </div>

      {/* Tickets List */}
      {attendees.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <QrCode className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">No QR Tickets Available</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              You haven't registered for any events yet. Once you register, your high-resolution QR admission pass will appear right here!
            </p>
          </div>
          <button
            onClick={onExploreEvents}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all"
          >
            <span>Explore Events & Get Ticket</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {attendees.map((attendee) => (
            <QRPassCard
              key={attendee.id}
              attendee={attendee}
              onSimulateCheckIn={onSimulateCheckIn}
            />
          ))}
        </div>
      )}

      {/* Security notice footer */}
      <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/60 text-slate-600 text-xs font-medium flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
        <div>
          <strong className="font-bold text-slate-800">FestGate Anti-Fraud Verification:</strong> Passes are cryptographically verified upon scanning. Re-entry after gate check-in is strictly blocked.
        </div>
      </div>

    </div>
  );
};
