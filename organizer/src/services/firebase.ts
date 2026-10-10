import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, update, child } from 'firebase/database';
import { EventItem, Attendee, Coordinator, GateLog, StatSummary } from '../types';

// Optional Firebase configuration from environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment1234567890",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "festgate-realtime.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://festgate-realtime-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "festgate-realtime",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "festgate-realtime.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcdef123456"
};

let db: ReturnType<typeof getDatabase> | null = null;
let isFirebaseConnected = false;

try {
  if (import.meta.env.VITE_FIREBASE_DATABASE_URL) {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    db = getDatabase(app);
    isFirebaseConnected = true;
  }
} catch (e) {
  console.warn("Firebase initialized with local persistent fallback:", e);
}

// Initial Mock / Seed Data
const initialEvents: EventItem[] = [
  {
    id: 'evt-1',
    title: "National Hackathon 2026: Code & Innovate",
    category: 'TECH',
    categoryColor: '#0284C7',
    date: 'Oct 15, 2026',
    time: '09:00 AM - 09:00 PM',
    venue: 'Innovation Hub Hall A',
    capacity: 250,
    registeredCount: 198,
    checkedInCount: 142,
    description: '36-hour sprint bringing the brightest student developers to build AI and Cloud solutions.',
    coordinator: {
      name: 'Dr. Leonardo Samsul',
      role: 'Fest Lead Mentor',
      initials: 'LS',
      avatarBg: 'bg-indigo-500'
    },
    imageGradient: 'from-amber-700 via-amber-800 to-slate-900',
    imageSrc: '/static/images/event1.jpg',
    bookmarked: false
  },
  {
    id: 'evt-2',
    title: 'UI/UX Design Masterclass & Sprint',
    category: 'DESIGN',
    categoryColor: '#7C3AED',
    date: 'Oct 16, 2026',
    time: '11:00 AM - 04:00 PM',
    venue: 'Design Studio Lab 3',
    capacity: 150,
    registeredCount: 120,
    checkedInCount: 88,
    description: 'Master human-centric interface design, design systems, and rapid interactive prototyping.',
    coordinator: {
      name: 'Bayu Saito',
      role: 'Creative Lead',
      initials: 'BS',
      avatarBg: 'bg-emerald-500'
    },
    imageGradient: 'from-slate-800 via-purple-950 to-slate-900',
    imageSrc: '/static/images/event2.jpg',
    bookmarked: true
  },
  {
    id: 'evt-3',
    title: 'Grand Cultural Gala & Band Fest',
    category: 'CULTURAL',
    categoryColor: '#E11D48',
    date: 'Oct 18, 2026',
    time: '05:00 PM - 11:00 PM',
    venue: 'Main University Amphitheatre',
    capacity: 800,
    registeredCount: 650,
    checkedInCount: 420,
    description: 'Live stage performances, battle of the bands, dance crew championships, and street food fest.',
    coordinator: {
      name: 'Padhang Satrio',
      role: 'Cultural Advisor',
      initials: 'PS',
      avatarBg: 'bg-amber-600'
    },
    imageGradient: 'from-purple-900 via-indigo-900 to-black',
    imageSrc: '/static/images/event3.jpg',
    bookmarked: false
  }
];

const initialAttendees: Attendee[] = [
  {
    id: 'att-1',
    ticketCode: 'FG-8291-TX',
    name: 'Padhang Satrio',
    rollNo: 'CS-2023-049',
    email: 'padhang.satrio@festgate.edu',
    department: 'Computer Science',
    eventId: 'evt-2',
    eventTitle: 'UI/UX Design Masterclass',
    eventCategory: 'DESIGN',
    registeredAt: '2026-10-09 10:14 AM',
    status: 'CHECKED_IN',
    checkedInAt: '2026-10-10 08:30 AM',
    checkedInBy: 'Gate 1 - Alex',
    initials: 'PS',
    avatarBg: 'bg-purple-600'
  },
  {
    id: 'att-2',
    ticketCode: 'FG-4412-NB',
    name: 'Bagas Mahpie',
    rollNo: 'IT-2024-118',
    email: 'bagas.mahpie@festgate.edu',
    department: 'Information Tech',
    eventId: 'evt-1',
    eventTitle: 'National Hackathon 2026',
    eventCategory: 'TECH',
    registeredAt: '2026-10-09 11:45 AM',
    status: 'REGISTERED',
    initials: 'BM',
    avatarBg: 'bg-blue-600'
  },
  {
    id: 'att-3',
    ticketCode: 'FG-9021-CL',
    name: 'Sir Dandy',
    rollNo: 'EC-2023-012',
    email: 'sir.dandy@festgate.edu',
    department: 'Electronics',
    eventId: 'evt-3',
    eventTitle: 'Grand Cultural Gala',
    eventCategory: 'CULTURAL',
    registeredAt: '2026-10-09 01:20 PM',
    status: 'CHECKED_IN',
    checkedInAt: '2026-10-10 09:12 AM',
    checkedInBy: 'Gate 2 - Sarah',
    initials: 'SD',
    avatarBg: 'bg-emerald-600'
  },
  {
    id: 'att-4',
    ticketCode: 'FG-5531-WK',
    name: 'Jhon Tosan',
    rollNo: 'ME-2024-088',
    email: 'jhon.tosan@festgate.edu',
    department: 'Mechanical Engg',
    eventId: 'evt-1',
    eventTitle: 'National Hackathon 2026',
    eventCategory: 'TECH',
    registeredAt: '2026-10-09 03:05 PM',
    status: 'REGISTERED',
    initials: 'JT',
    avatarBg: 'bg-amber-600'
  },
  {
    id: 'att-5',
    ticketCode: 'FG-3319-UX',
    name: 'Ananya Sharma',
    rollNo: 'CS-2023-102',
    email: 'ananya.s@festgate.edu',
    department: 'Computer Science',
    eventId: 'evt-2',
    eventTitle: 'UI/UX Design Masterclass',
    eventCategory: 'DESIGN',
    registeredAt: '2026-10-09 04:30 PM',
    status: 'CHECKED_IN',
    checkedInAt: '2026-10-10 09:25 AM',
    checkedInBy: 'Gate 1 - Alex',
    initials: 'AS',
    avatarBg: 'bg-rose-600'
  }
];

const initialCoordinators: Coordinator[] = [
  {
    id: 'c-1',
    name: 'Padhang Satrio',
    role: 'Gate 1 Supervisor',
    initials: 'PS',
    avatarBg: 'bg-amber-700',
    status: 'At Gate 1',
    isFollowing: true
  },
  {
    id: 'c-2',
    name: 'Zakir Horizontal',
    role: 'Security & Verification',
    initials: 'ZH',
    avatarBg: 'bg-blue-600',
    status: 'Online',
    isFollowing: false
  },
  {
    id: 'c-3',
    name: 'Leonardo Samsul',
    role: 'Tech Coordinator',
    initials: 'LS',
    avatarBg: 'bg-purple-600',
    status: 'At Gate 2',
    isFollowing: true
  }
];

// Persistent Local Storage Helpers
const STORAGE_KEYS = {
  EVENTS: 'festgate_events_v1',
  ATTENDEES: 'festgate_attendees_v1',
  COORDINATORS: 'festgate_coordinators_v1',
  LOGS: 'festgate_gatelogs_v1',
  AUTH: 'festgate_admin_auth'
};

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Local storage error:", err);
  }
}

// Service Methods
export const FestService = {
  isCloudConnected(): boolean {
    return isFirebaseConnected;
  },

  getEvents(): EventItem[] {
    const events = getStorage<EventItem[]>(STORAGE_KEYS.EVENTS, initialEvents);
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      setStorage(STORAGE_KEYS.EVENTS, initialEvents);
    }
    return events;
  },

  addEvent(eventData: Omit<EventItem, 'id' | 'registeredCount' | 'checkedInCount'>): EventItem {
    const events = this.getEvents();
    const newEvent: EventItem = {
      ...eventData,
      id: 'evt-' + Date.now().toString(36),
      registeredCount: 0,
      checkedInCount: 0
    };
    events.unshift(newEvent);
    setStorage(STORAGE_KEYS.EVENTS, events);

    // Sync to Firebase if available
    if (db) {
      set(ref(db, `events/${newEvent.id}`), newEvent).catch(console.error);
    }
    return newEvent;
  },

  getAttendees(): Attendee[] {
    const attendees = getStorage<Attendee[]>(STORAGE_KEYS.ATTENDEES, initialAttendees);
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDEES)) {
      setStorage(STORAGE_KEYS.ATTENDEES, initialAttendees);
    }
    return attendees;
  },

  registerAttendee(data: {
    name: string;
    rollNo: string;
    email: string;
    department: string;
    eventId: string;
  }): Attendee {
    const events = this.getEvents();
    const event = events.find(e => e.id === data.eventId) || events[0];

    // Generate unique Ticket ID e.g. FG-7832-XY
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
    const ticketCode = `FG-${randomHex}-${randomSuffix}`;

    const names = data.name.trim().split(' ');
    const initials = (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
    
    const palette = ['bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-indigo-600'];
    const avatarBg = palette[Math.floor(Math.random() * palette.length)];

    const now = new Date();
    const dateFormatted = now.toISOString().slice(0, 10) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAttendee: Attendee = {
      id: 'att-' + Date.now().toString(36),
      ticketCode,
      name: data.name,
      rollNo: data.rollNo,
      email: data.email,
      department: data.department,
      eventId: event.id,
      eventTitle: event.title,
      eventCategory: event.category,
      registeredAt: dateFormatted,
      status: 'REGISTERED',
      initials,
      avatarBg
    };

    const attendees = this.getAttendees();
    attendees.unshift(newAttendee);
    setStorage(STORAGE_KEYS.ATTENDEES, attendees);

    // Update event registered count
    const updatedEvents = events.map(e => e.id === event.id ? { ...e, registeredCount: e.registeredCount + 1 } : e);
    setStorage(STORAGE_KEYS.EVENTS, updatedEvents);

    if (db) {
      set(ref(db, `attendees/${newAttendee.ticketCode}`), newAttendee).catch(console.error);
      update(ref(db, `events/${event.id}`), { registeredCount: event.registeredCount + 1 }).catch(console.error);
    }

    return newAttendee;
  },

  verifyTicket(ticketCode: string, gateStaff = 'Gate 1 - Lead'): {
    success: boolean;
    reason: 'SUCCESS' | 'DUPLICATE' | 'INVALID';
    message: string;
    attendee?: Attendee;
  } {
    const cleanCode = ticketCode.trim().toUpperCase();
    const attendees = this.getAttendees();
    const attendeeIndex = attendees.findIndex(a => a.ticketCode.toUpperCase() === cleanCode);

    if (attendeeIndex === -1) {
      return {
        success: false,
        reason: 'INVALID',
        message: `Ticket "${cleanCode}" was not found in the FestGate registration registry.`
      };
    }

    const attendee = attendees[attendeeIndex];

    // Duplicate Attendance Prevention
    if (attendee.status === 'CHECKED_IN') {
      return {
        success: false,
        reason: 'DUPLICATE',
        message: `DUPLICATE ATTENDANCE DETECTED! Pass was already scanned at ${attendee.checkedInAt || 'Gate'} by ${attendee.checkedInBy || 'Gate Staff'}. Re-entry denied.`,
        attendee
      };
    }

    // Success Check-In
    const now = new Date();
    const checkInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const checkInDate = now.toISOString().slice(0, 10);
    const fullTimestamp = `${checkInDate} ${checkInTime}`;

    attendee.status = 'CHECKED_IN';
    attendee.checkedInAt = fullTimestamp;
    attendee.checkedInBy = gateStaff;
    attendees[attendeeIndex] = attendee;
    setStorage(STORAGE_KEYS.ATTENDEES, attendees);

    // Update event checked-in count
    const events = this.getEvents();
    const updatedEvents = events.map(e => e.id === attendee.eventId ? { ...e, checkedInCount: e.checkedInCount + 1 } : e);
    setStorage(STORAGE_KEYS.EVENTS, updatedEvents);

    // Log gate entry
    const logs = getStorage<GateLog[]>(STORAGE_KEYS.LOGS, []);
    logs.unshift({
      id: 'log-' + Date.now(),
      ticketCode: attendee.ticketCode,
      attendeeName: attendee.name,
      eventTitle: attendee.eventTitle,
      timestamp: fullTimestamp,
      result: 'SUCCESS',
      message: `Verified and admitted to ${attendee.eventTitle}`,
      gateStaff
    });
    setStorage(STORAGE_KEYS.LOGS, logs);

    if (db) {
      update(ref(db, `attendees/${attendee.ticketCode}`), {
        status: 'CHECKED_IN',
        checkedInAt: fullTimestamp,
        checkedInBy: gateStaff
      }).catch(console.error);
    }

    return {
      success: true,
      reason: 'SUCCESS',
      message: `Access Granted! Welcome ${attendee.name} to ${attendee.eventTitle}.`,
      attendee
    };
  },

  getCoordinators(): Coordinator[] {
    return getStorage<Coordinator[]>(STORAGE_KEYS.COORDINATORS, initialCoordinators);
  },

  toggleCoordinatorFollow(id: string): Coordinator[] {
    const list = this.getCoordinators();
    const updated = list.map(c => c.id === id ? { ...c, isFollowing: !c.isFollowing } : c);
    setStorage(STORAGE_KEYS.COORDINATORS, updated);
    return updated;
  },

  getStats(): StatSummary {
    const attendees = this.getAttendees();
    const events = this.getEvents();
    const totalRegistered = attendees.length;
    const totalCheckedIn = attendees.filter(a => a.status === 'CHECKED_IN').length;
    const verificationRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;
    return {
      totalRegistered,
      totalCheckedIn,
      verificationRate,
      activeEventsCount: events.length
    };
  },

  exportCSV(): void {
    const attendees = this.getAttendees();
    const headers = ['Ticket ID', 'Student Name', 'Roll Number', 'Email', 'Department', 'Event Title', 'Registration Date', 'Gate Status', 'Check-In Timestamp', 'Gate Staff'];
    const rows = attendees.map(a => [
      a.ticketCode,
      `"${a.name}"`,
      `"${a.rollNo}"`,
      `"${a.email}"`,
      `"${a.department}"`,
      `"${a.eventTitle}"`,
      `"${a.registeredAt}"`,
      `"${a.status}"`,
      `"${a.checkedInAt || 'N/A'}"`,
      `"${a.checkedInBy || 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FestGate_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  checkAdminAuth(): boolean {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  },

  setAdminAuth(isAuthenticated: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AUTH, isAuthenticated ? 'true' : 'false');
  }
};
