import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Clock,
  User,
  RefreshCw
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { FestService } from '../../services/firebase';
import { Attendee } from '../../types';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: () => void;
  initialCode?: string;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  initialCode = ''
}) => {
  const [ticketInput, setTicketInput] = useState(initialCode);
  const [gateStaff, setGateStaff] = useState('Gate 1 - Lead');
  const [scanResult, setScanResult] = useState<{
    status: 'IDLE' | 'SUCCESS' | 'DUPLICATE' | 'INVALID';
    message: string;
    attendee?: Attendee;
  }>({ status: 'IDLE', message: '' });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (initialCode) {
      setTicketInput(initialCode);
      handleVerify(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanResult({ status: 'IDLE', message: '' });
      setTicketInput('');
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;
      setIsCameraActive(true);

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleVerify(decodedText);
          stopCamera();
        },
        (errorMessage) => {
          // ignore scan frame errors
        }
      );
    } catch (err: any) {
      console.warn("Camera start failed, switching to manual mode:", err);
      setCameraError("Camera access unavailable. Use manual ticket input or upload.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current?.clear();
        setIsCameraActive(false);
      }).catch(console.error);
    } else {
      setIsCameraActive(false);
    }
  };

  const handleVerify = (codeToVerify?: string) => {
    const code = (codeToVerify || ticketInput).trim();
    if (!code) return;

    const result = FestService.verifyTicket(code, gateStaff);

    if (result.reason === 'SUCCESS') {
      setScanResult({
        status: 'SUCCESS',
        message: result.message,
        attendee: result.attendee
      });
      // Fire celebration confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
      onScanSuccess();
    } else if (result.reason === 'DUPLICATE') {
      setScanResult({
        status: 'DUPLICATE',
        message: result.message,
        attendee: result.attendee
      });
    } else {
      setScanResult({
        status: 'INVALID',
        message: result.message
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25">
            <QrCode className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">FestGate QR Verifier</h2>
              <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-extrabold">LIVE GATE</span>
            </div>
            <p className="text-xs text-slate-400">Scan digital pass or enter ticket code with duplicate prevention</p>
          </div>
        </div>

        {/* Gate Staff Selector */}
        <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
          <span className="font-bold text-slate-600 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-brand-500" />
            <span>Gate Staff On Duty:</span>
          </span>
          <select
            value={gateStaff}
            onChange={(e) => setGateStaff(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-800 text-xs focus:outline-none"
          >
            <option value="Gate 1 - Lead">Gate 1 - Lead</option>
            <option value="Gate 2 - East Wing">Gate 2 - East Wing</option>
            <option value="VIP Gate - Auditorium">VIP Gate - Auditorium</option>
          </select>
        </div>

        {/* Verification Result Banner (Duplicate / Success / Invalid) */}
        {scanResult.status !== 'IDLE' && (
          <div className={`p-4 rounded-2xl mb-6 border animate-fadeIn transition-all ${
            scanResult.status === 'SUCCESS'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : scanResult.status === 'DUPLICATE'
              ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-400/30'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-start gap-3">
              {scanResult.status === 'SUCCESS' && (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {scanResult.status === 'DUPLICATE' && (
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
              )}
              {scanResult.status === 'INVALID' && (
                <XCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              )}

              <div className="flex-1">
                <div className="font-extrabold text-sm flex items-center justify-between">
                  <span>
                    {scanResult.status === 'SUCCESS' && 'ACCESS GRANTED • ADMITTED'}
                    {scanResult.status === 'DUPLICATE' && '⚠️ DUPLICATE ATTENDANCE DETECTED'}
                    {scanResult.status === 'INVALID' && 'INVALID TICKET CODE'}
                  </span>
                  <span className="text-[10px] font-mono opacity-70">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs mt-1 leading-relaxed font-medium">
                  {scanResult.message}
                </p>

                {scanResult.attendee && (
                  <div className="mt-3 pt-3 border-t border-black/10 text-xs grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold opacity-70">Student:</span>{' '}
                      <strong>{scanResult.attendee.name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold opacity-70">Roll No:</span>{' '}
                      <strong>{scanResult.attendee.rollNo}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold opacity-70">Event:</span>{' '}
                      <strong>{scanResult.attendee.eventTitle}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold opacity-70">Ticket ID:</span>{' '}
                      <span className="font-mono">{scanResult.attendee.ticketCode}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Camera Scanner View Area */}
        <div className="space-y-4">
          <div className="relative rounded-2xl bg-slate-900 min-h-[220px] flex flex-col items-center justify-center overflow-hidden border border-slate-800 text-white p-4">
            <div id="reader" className="w-full max-w-[280px]" />

            {!isCameraActive && (
              <div className="text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto text-brand-400">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Live Camera Scanner</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-0.5">
                    Activate webcam to scan physical prints or smartphone screen QR passes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-5 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/30 transition-all"
                >
                  Start Camera Scanner
                </button>
              </div>
            )}

            {isCameraActive && (
              <button
                type="button"
                onClick={stopCamera}
                className="mt-3 px-4 py-1.5 rounded-full bg-red-600/80 hover:bg-red-700 text-white font-bold text-xs transition-colors"
              >
                Stop Camera
              </button>
            )}

            {cameraError && (
              <div className="text-[11px] text-amber-300 mt-2 bg-amber-950/40 px-3 py-1 rounded-full">
                {cameraError}
              </div>
            )}
          </div>

          {/* Manual Code Input Form */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
              Instant Ticket Code Verification
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
                placeholder="e.g. FG-8291-TX"
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => handleVerify()}
                className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/25 transition-all"
              >
                <span>Verify Gate Pass</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Test Codes to Demo Verification & Duplicate Prevention */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Instant Test Passes (Click to test verification):
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => handleVerify('FG-4412-NB')}
                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-mono font-bold transition-colors"
                title="Fresh ticket: Will admit student"
              >
                🟢 FG-4412-NB (New Attendee)
              </button>
              <button
                onClick={() => handleVerify('FG-8291-TX')}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-mono font-bold transition-colors"
                title="Already scanned: Will trigger DUPLICATE warning"
              >
                🔴 FG-8291-TX (Trigger Duplicate)
              </button>
              <button
                onClick={() => handleVerify('FG-9999-FAKE')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-mono font-bold transition-colors"
                title="Fake code: Will trigger Invalid Ticket"
              >
                ⚪ FG-9999-FAKE (Invalid)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
