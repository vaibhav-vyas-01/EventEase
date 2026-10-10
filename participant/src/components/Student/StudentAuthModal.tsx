import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Hash, 
  GraduationCap, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { StudentUser } from '../../types';
import { FestService } from '../../services/firebase';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: StudentUser) => void;
}

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  
  // Custom sign-up fields
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('3rd Year');

  // Quick login identifier
  const [identifier, setIdentifier] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaultStudents = FestService.getDefaultStudents();

  const handleSelectDefaultStudent = (student: StudentUser) => {
    FestService.setStudentAuth(student);
    onSuccess(student);
    onClose();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your Student Roll Number or Email.');
      return;
    }
    const user = FestService.loginStudent(identifier.trim());
    onSuccess(user);
    onClose();
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rollNo.trim() || !email.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }
    const created = FestService.registerNewStudent({
      name: name.trim(),
      rollNo: rollNo.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      department,
      year
    });
    onSuccess(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Sparkles className="w-6 h-6 fill-white/30" />
          </div>
          <h3 className="text-xl font-black tracking-tight">Student Access Gateway</h3>
          <p className="text-xs text-brand-100 mt-1">
            Sign in to access your registrations and encrypted QR tickets
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* Toggle Login vs New Account */}
          <div className="flex p-1 rounded-2xl bg-slate-100 mb-5">
            <button
              onClick={() => { setMode('LOGIN'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                mode === 'LOGIN' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Quick Login
            </button>
            <button
              onClick={() => { setMode('SIGNUP'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                mode === 'SIGNUP' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              New Student ID
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {mode === 'LOGIN' ? (
            <div className="space-y-4">
              {/* Quick Persona Logins */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Select Demo Student Profile:
                </label>
                <div className="space-y-2">
                  {defaultStudents.map((stu) => (
                    <button
                      key={stu.id}
                      onClick={() => handleSelectDefaultStudent(stu)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 flex items-center justify-between text-left transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${stu.avatarBg} text-white flex items-center justify-center font-black text-xs`}>
                          {stu.initials}
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-800 group-hover:text-brand-700">
                            {stu.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {stu.rollNo} • {stu.department}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">Or Enter ID</span>
                <div className="grow border-t border-slate-200"></div>
              </div>

              {/* Manual Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter Roll No (e.g. IT-2024-118) or Email"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold placeholder-slate-400 focus:outline-hidden focus:border-brand-500 uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-white text-xs font-black transition-colors"
                >
                  Continue as Student
                </button>
              </form>
            </div>
          ) : (
            /* Sign Up / New Student Form */
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Roll / Student ID</label>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                  placeholder="e.g. CS-2025-099"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">College Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john.doe@festgate.edu"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="Computer Science">Computer Science & Engg</option>
                  <option value="Information Tech">Information Technology</option>
                  <option value="Electronics">Electronics & Comm.</option>
                  <option value="Mechanical Engg">Mechanical Engineering</option>
                  <option value="Design & Media">Design & Media Arts</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-black shadow-md transition-all"
                >
                  Create Student Profile & Enter
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
