import React, { useEffect, useRef } from 'react';
import { X, Sparkles, Printer, CheckCircle2, QrCode, ShieldCheck, MapPin, Calendar } from 'lucide-react';
import QRCode from 'qrcode';
import { Attendee } from '../../types';

interface TicketModalProps {
  attendee: Attendee | null;
  onClose: () => void;
  onSimulateScan: (ticketCode: string) => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  attendee,
  onClose,
  onSimulateScan
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (attendee && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        attendee.ticketCode,
        {
          width: 180,
          margin: 1,
          color: {
            dark: '#1E1B4B',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error("QR Code generation error:", error);
        }
      );
    }
  }, [attendee]);

  if (!attendee) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCheckedIn = attendee.status === 'CHECKED_IN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center shadow-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ticket Header Banner */}
        <div className="bg-gradient-to-r from-brand-600 to-indigo-600 text-white p-6 relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <span className="text-xs font-extrabold tracking-wider uppercase text-white/90">FestGate Official Pass</span>
          </div>

          <h3 className="text-lg font-extrabold tracking-tight leading-snug">
            {attendee.eventTitle}
          </h3>
          <div className="text-xs text-brand-100 mt-1 flex items-center gap-2">
            <span>{attendee.eventCategory}</span>
            <span>•</span>
            <span>{attendee.registeredAt}</span>
          </div>

          {/* Cutout notch decorations for authentic ticket look */}
          <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-white"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-white"></div>
        </div>

        {/* Ticket Middle: QR Code & Status */}
        <div className="p-6 bg-slate-50/50 border-b border-dashed border-slate-200 text-center flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3">
            <canvas ref={canvasRef} className="rounded-lg" />
          </div>

          <div className="font-mono text-base font-extrabold text-slate-800 tracking-wider">
            {attendee.ticketCode}
          </div>

          <div className="mt-2">
            {isCheckedIn ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>ADMITTED AT GATE ({attendee.checkedInAt})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-extrabold">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>VALID TICKET • READY FOR GATE SCAN</span>
              </span>
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="p-6 space-y-3 text-xs bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Attendee Name</div>
              <div className="font-extrabold text-slate-800 text-sm">{attendee.name}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Roll / Student ID</div>
              <div className="font-bold text-slate-800">{attendee.rollNo}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Department</div>
              <div className="font-semibold text-slate-700">{attendee.department}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Email</div>
              <div className="font-medium text-slate-600 truncate">{attendee.email}</div>
            </div>
          </div>

          {attendee.checkedInBy && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
              Verified by: <strong className="text-slate-700">{attendee.checkedInBy}</strong>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass</span>
          </button>

          <button
            onClick={() => {
              onSimulateScan(attendee.ticketCode);
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-500/25"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Test Gate Scan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
