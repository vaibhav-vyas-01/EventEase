import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  QrCode,
  Tag
} from 'lucide-react';
import { EventItem, Attendee } from '../../types';

interface StudentEventCardProps {
  event: EventItem;
  registeredAttendee?: Attendee;
  onRegisterClick: (event: EventItem) => void;
  onViewTicketClick: (attendee: Attendee) => void;
  onOpenDetails: (event: EventItem) => void;
}

export const StudentEventCard: React.FC<StudentEventCardProps> = ({
  event,
  registeredAttendee,
  onRegisterClick,
  onViewTicketClick,
  onOpenDetails
}) => {
  const isRegistered = !!registeredAttendee;
  const isCheckedIn = registeredAttendee?.status === 'CHECKED_IN';

  const categoryColorMap: Record<string, { bg: string; text: string; border: string }> = {
    TECH: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    DESIGN: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    CULTURAL: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    GAMING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    WORKSHOP: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' }
  };

  const badgeStyle = categoryColorMap[event.category] || categoryColorMap.TECH;
  const seatsLeft = Math.max(0, event.capacity - event.registeredCount);
  const percentFilled = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden group">
      
      {/* Event Image Banner with Overlay Category & Registration Tag */}
      <div 
        onClick={() => onOpenDetails(event)}
        className="relative h-48 sm:h-52 w-full overflow-hidden cursor-pointer"
      >
        {event.imageSrc ? (
          <img
            src={event.imageSrc}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // fallback if image not found
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${event.imageGradient}`} />
        )}
        
        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md bg-white/90 ${badgeStyle.text} shadow-xs`}>
            {event.category}
          </span>

          {isRegistered && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black backdrop-blur-md shadow-xs ${
              isCheckedIn 
                ? 'bg-emerald-500 text-white' 
                : 'bg-brand-500 text-white'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isCheckedIn ? 'Checked-In' : 'Registered'}</span>
            </span>
          )}
        </div>

        {/* Bottom Banner Title Overlay */}
        <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
          <div className="flex items-center gap-2 text-[11px] font-bold text-white/80 mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-brand-300" />
              {event.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-300" />
              {event.time}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug line-clamp-1 drop-shadow-sm group-hover:text-brand-200 transition-colors">
            {event.title}
          </h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          
          {/* Venue & Mentor */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>

          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Coordinator Pill */}
          <div className="flex items-center gap-2.5 pt-1">
            <div className={`w-7 h-7 rounded-full ${event.coordinator.avatarBg} text-white flex items-center justify-center text-[10px] font-black shrink-0`}>
              {event.coordinator.initials}
            </div>
            <div className="text-xs font-bold text-slate-700 truncate">
              {event.coordinator.name}
              <span className="text-slate-400 font-normal ml-1.5 text-[11px]">({event.coordinator.role})</span>
            </div>
          </div>

          {/* Capacity Progress Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>{event.registeredCount} / {event.capacity} registered</span>
              </span>
              <span className={seatsLeft <= 20 ? 'text-rose-600 font-extrabold' : 'text-slate-600'}>
                {seatsLeft > 0 ? `${seatsLeft} seats left` : 'Event Full'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  percentFilled > 85 ? 'bg-rose-500' : 'bg-brand-500'
                }`}
                style={{ width: `${percentFilled}%` }}
              />
            </div>
          </div>

        </div>

        {/* Card Footer Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
          
          <button
            onClick={() => onOpenDetails(event)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-extrabold transition-colors text-center"
          >
            Details
          </button>

          {isRegistered ? (
            <button
              onClick={() => onViewTicketClick(registeredAttendee!)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-xs shadow-emerald-500/25 transition-all"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>View Pass</span>
            </button>
          ) : (
            <button
              onClick={() => onRegisterClick(event)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-black shadow-sm shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Register Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

        </div>

      </div>

    </div>
  );
};
