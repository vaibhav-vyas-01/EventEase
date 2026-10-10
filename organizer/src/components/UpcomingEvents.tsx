import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Bookmark, MapPin, Users, Calendar } from 'lucide-react';
import { EventItem } from '../types';

interface UpcomingEventsProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onQuickRegister: (event: EventItem) => void;
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events,
  onSelectEvent,
  onQuickRegister
}) => {
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({
    'evt-2': true
  });

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {/* Header with Navigation Arrows matching screenshot */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
          Upcoming Events
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => alert("Previous events")}
            className="w-8 h-8 rounded-full border border-slate-200/80 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => alert("Next events")}
            className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {events.map((event) => {
          const isBookmarked = bookmarkedIds[event.id];
          return (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className="bg-white rounded-[24px] border border-slate-100/80 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                {/* Media Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  {event.imageSrc ? (
                    <img 
                      src={event.imageSrc} 
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-tr ${event.imageGradient} flex items-center justify-center`}>
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest">{event.category}</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                  {/* Bookmark Button matching screenshot top right */}
                  <button
                    onClick={(e) => toggleBookmark(event.id, e)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-colors"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
                  </button>

                  {/* Venue Pill overlay */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold">
                    <MapPin className="w-3 h-3 text-brand-300" />
                    <span className="truncate max-w-[170px]">{event.venue}</span>
                  </div>
                </div>

                {/* Content details */}
                <div className="p-5 space-y-3">
                  {/* Category Pill matching screenshot */}
                  <div>
                    <span 
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase"
                      style={{ 
                        backgroundColor: event.category === 'TECH' ? '#E0F2FE' : event.category === 'DESIGN' ? '#F3E8FF' : '#FFE4E6',
                        color: event.category === 'TECH' ? '#0369A1' : event.category === 'DESIGN' ? '#7E22CE' : '#BE123C'
                      }}
                    >
                      {event.category}
                    </span>
                  </div>

                  {/* Event Title */}
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
                    {event.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Coordinator row matching screenshot bottom */}
              <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-full ${event.coordinator.avatarBg} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                    {event.coordinator.initials}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {event.coordinator.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium truncate">
                      {event.coordinator.role}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickRegister(event);
                  }}
                  className="px-3 py-1.5 rounded-full bg-brand-50 hover:bg-brand-500 hover:text-white text-brand-600 text-[11px] font-bold transition-all shrink-0"
                >
                  Register
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
