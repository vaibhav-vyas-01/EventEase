import React from 'react';
import { MoreVertical, Plus, UserPlus, Check, Download, TrendingUp, ShieldCheck } from 'lucide-react';
import { Coordinator, StatSummary } from '../types';

interface AnalyticsPanelProps {
  stats: StatSummary;
  coordinators: Coordinator[];
  onToggleFollow: (id: string) => void;
  onExportCSV: () => void;
  isAdmin: boolean;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  stats,
  coordinators,
  onToggleFollow,
  onExportCSV,
  isAdmin
}) => {
  // Bar chart simulated heights based on check-in velocity
  const chartBars = [
    { label: '09-11 AM', height: '40%', active: false },
    { label: '11-01 PM', height: '85%', active: true },
    { label: '01-03 PM', height: '35%', active: false },
    { label: '03-05 PM', height: '60%', active: false },
  ];

  return (
    <aside className="w-80 bg-white border-l border-slate-100/80 p-6 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Header matching screenshot */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Statistic
          </h2>
          <button 
            onClick={() => alert("Gate Stats Summary:\nTotal registered: " + stats.totalRegistered + "\nTotal checked in: " + stats.totalCheckedIn)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Circular Avatar Gauge Section matching screenshot */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            {/* SVG Circular Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-slate-100"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-brand-500"
                strokeWidth="6"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * (stats.verificationRate || 45)) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />
            </svg>

            {/* Percentage Badge matching screenshot top-right of ring */}
            <div className="absolute top-1 right-2 px-1.5 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-extrabold shadow-sm">
              {stats.verificationRate}%
            </div>

            {/* Center Avatar with Initials / Badge */}
            <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center text-xl font-extrabold shadow-md ring-4 ring-white">
              {isAdmin ? 'AD' : 'JR'}
            </div>
          </div>

          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5 justify-center">
            <span>Good Morning {isAdmin ? 'Admin' : 'Jason'}</span>
            <span>🔥</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-[220px]">
            Live gate scanning operating at peak capacity!
          </p>
        </div>

        {/* Bar Chart matching screenshot */}
        <div className="bg-slate-50/60 rounded-[24px] p-5 border border-slate-100 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
              <span>Gate Traffic Flow</span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live Flow
            </span>
          </div>

          <div className="relative pt-2">
            {/* Horizontal guideline levels matching screenshot: 60, 40, 20 */}
            <div className="space-y-4 text-[10px] font-bold text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-5">60</span>
                <div className="flex-1 border-b border-dashed border-slate-200"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5">40</span>
                <div className="flex-1 border-b border-dashed border-slate-200"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5">20</span>
                <div className="flex-1 border-b border-dashed border-slate-200"></div>
              </div>
            </div>

            {/* Vertical Bars matching screenshot */}
            <div className="flex items-end justify-between px-6 pt-3 h-28">
              {chartBars.map((bar, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="w-7 h-20 bg-slate-200/50 rounded-xl flex items-end overflow-hidden p-0.5">
                    <div 
                      className={`w-full rounded-lg transition-all duration-500 ${
                        bar.active ? 'bg-brand-500 shadow-md shadow-brand-500/30' : 'bg-brand-300/80 hover:bg-brand-400'
                      }`}
                      style={{ height: bar.height }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gate Coordinators / Mentors Section matching screenshot */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Gate Coordinators
            </h3>
            <button 
              onClick={() => alert("Add new gate supervisor to team")}
              className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:border-slate-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {coordinators.map((coordinator) => (
              <div 
                key={coordinator.id}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full ${coordinator.avatarBg} text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-sm shrink-0`}>
                    {coordinator.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {coordinator.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{coordinator.role}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onToggleFollow(coordinator.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                    coordinator.isFollowing
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                  }`}
                >
                  {coordinator.isFollowing ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      <span>+ Follow</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Button matching screenshot "See All" pill */}
      <div className="pt-6">
        <button
          onClick={onExportCSV}
          className="w-full py-3.5 px-4 rounded-full bg-brand-50 hover:bg-brand-100/90 text-brand-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"
        >
          <Download className="w-4 h-4 text-brand-600" />
          <span>Export CSV Report</span>
        </button>
      </div>
    </aside>
  );
};
