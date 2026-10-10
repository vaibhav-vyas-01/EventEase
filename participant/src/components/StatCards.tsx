import React from 'react';
import { MoreVertical, Ticket, CheckCircle, ShieldAlert, Award } from 'lucide-react';
import { StatSummary } from '../types';

interface StatCardsProps {
  stats: StatSummary;
  onFilterStatus?: (status: string) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, onFilterStatus }) => {
  const cards = [
    {
      id: 'registered',
      icon: Ticket,
      iconBg: 'bg-purple-100/70 text-brand-600',
      countText: `${stats.totalRegistered} Registered`,
      labelText: 'Total Registrations',
      badge: 'Active Events',
      filter: 'ALL'
    },
    {
      id: 'checkedIn',
      icon: CheckCircle,
      iconBg: 'bg-rose-100/70 text-rose-600',
      countText: `${stats.totalCheckedIn} Checked In`,
      labelText: 'Gate Attendance',
      badge: 'Live Admitted',
      filter: 'CHECKED_IN'
    },
    {
      id: 'verified',
      icon: Award,
      iconBg: 'bg-sky-100/70 text-sky-600',
      countText: `${stats.verificationRate}% Verified`,
      labelText: 'Check-In Rate',
      badge: 'Zero Fraud',
      filter: 'REGISTERED'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onFilterStatus && onFilterStatus(card.filter)}
            className="bg-white rounded-[22px] p-5 border border-slate-100/80 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              {/* Rounded icon box matching reference screenshot */}
              <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>

              <div>
                <div className="text-xs font-bold text-slate-400 mb-0.5">
                  {card.countText}
                </div>
                <div className="text-base font-extrabold text-slate-800 tracking-tight group-hover:text-brand-600 transition-colors">
                  {card.labelText}
                </div>
              </div>
            </div>

            {/* Three Dots Menu */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                alert(`${card.labelText}: ${card.countText}`);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
