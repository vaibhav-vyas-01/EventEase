import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, update, child } from 'firebase/database';
import { EventItem, Attendee, Coordinator, GateLog, StatSummary, StudentUser, RegistrationResult } from '../types';

// Optional Firebase configuration from environment
const firebaseConfig = {
  apiKey: "AIzaSyD2jMuX-HkqmIuqE_ADADvAfEMpOUIcpqw",
  authDomain: "festgate-a1f30.firebaseapp.com",
  databaseURL: "https://festgate-a1f30-default-rtdb.firebaseio.com",
  projectId: "festgate-a1f30",
  storageBucket: "festgate-a1f30.firebasestorage.app",
  messagingSenderId: "591752808264",
  appId: "1:591752808264:web:ef376be74ee2a652d7d57d"
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
  },
  {
    id: 'evt-4',
    title: 'Autonomous Robotics & Drone Arena',
    category: 'TECH',
    categoryColor: '#059669',
    date: 'Oct 20, 2026',
    time: '10:00 AM - 05:30 PM',
    venue: 'Robotics Center Arena B',
    capacity: 200,
    registeredCount: 145,
    checkedInCount: 95,
    description: 'Autonomous obstacle course race, line-following drones, and computer vision robotic arm showdown.',
    coordinator: {
      name: 'Prof. Alex Turner',
      role: 'Robotics Lead',
      initials: 'AT',
      avatarBg: 'bg-emerald-600'
    },
    imageGradient: 'from-teal-800 via-emerald-950 to-slate-950',
    imageSrc: '/static/images/event1.jpg',
    bookmarked: false
  },
  {
    id: 'evt-5',
    title: 'Inter-College Valorant & BGMI Arena',
    category: 'GAMING',
    categoryColor: '#D97706',
    date: 'Oct 21, 2026',
    time: '01:00 PM - 09:00 PM',
    venue: 'Campus E-Sports Lounge & Big Screen',
    capacity: 320,
    registeredCount: 290,
    checkedInCount: 160,
    description: 'High-octane collegiate gaming tournament with live caster streaming, RGB battle stations, and huge prize pool.',
    coordinator: {
      name: 'Zakir Horizontal',
      role: 'E-Sports Coordinator',
      initials: 'ZH',
      avatarBg: 'bg-blue-600'
    },
    imageGradient: 'from-amber-700 via-rose-950 to-slate-900',
    imageSrc: '/static/images/event2.jpg',
    bookmarked: false
  },
  {
    id: 'evt-6',
    title: 'Generative AI & Agentic Coding Hands-On',
    category: 'WORKSHOP',
    categoryColor: '#8B5CF6',
    date: 'Oct 22, 2026',
    time: '02:00 PM - 06:00 PM',
    venue: 'Tech Auditorium 2',
    capacity: 180,
    registeredCount: 160,
    checkedInCount: 110,
    description: 'Build production-ready LLM pipelines, autonomous reasoning agents, and full-stack AI web systems.',
    coordinator: {
      name: 'Dr. Leonardo Samsul',
      role: 'AI Researcher',
      initials: 'LS',
      avatarBg: 'bg-indigo-600'
    },
    imageGradient: 'from-purple-800 via-indigo-950 to-slate-900',
    imageSrc: '/static/images/event3.jpg',
    bookmarked: true
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
    eventTitle: 'UI/UX Design Masterclass & Sprint',
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
    eventTitle: 'National Hackathon 2026: Code & Innovate',
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
    eventTitle: 'Grand Cultural Gala & Band Fest',
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
    eventTitle: 'National Hackathon 2026: Code & Innovate',
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
    eventTitle: 'UI/UX Design Masterclass & Sprint',
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

// Pre-configured demo students
const DEFAULT_STUDENTS: StudentUser[] = [
  {
    id: 'stu-1',
    name: 'Bagas Mahpie',
    rollNo: 'IT-2024-118',
    email: 'bagas.mahpie@festgate.edu',
    department: 'Information Tech',
    year: '3rd Year',
    avatarBg: 'bg-blue-600',
    initials: 'BM'
  },
  {
    id: 'stu-2',
    name: 'Padhang Satrio',
    rollNo: 'CS-2023-049',
    email: 'padhang.satrio@festgate.edu',
    department: 'Computer Science',
    year: '4th Year',
    avatarBg: 'bg-purple-600',
    initials: 'PS'
  },
  {
    id: 'stu-3',
    name: 'Ananya Sharma',
    rollNo: 'CS-2023-102',
    email: 'ananya.s@festgate.edu',
    department: 'Computer Science',
    year: '3rd Year',
    avatarBg: 'bg-rose-600',
    initials: 'AS'
  }
];

// Persistent Local Storage Helpers
const STORAGE_KEYS = {
  EVENTS: 'festgate_events_v1',
  ATTENDEES: 'festgate_attendees_v1',
  COORDINATORS: 'festgate_coordinators_v1',
  LOGS: 'festgate_gatelogs_v1',
  AUTH: 'festgate_admin_auth',
  STUDENT_AUTH: 'festgate_student_user_v1',
  STUDENT_ROSTER: 'festgate_students_roster_v1'
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

  // Student Authentication & Profile Management
  getDefaultStudents(): StudentUser[] {
    return getStorage<StudentUser[]>(STORAGE_KEYS.STUDENT_ROSTER, DEFAULT_STUDENTS);
  },

  getStudentAuth(): StudentUser | null {
    const current = getStorage<StudentUser | null>(STORAGE_KEYS.STUDENT_AUTH, null);
    if (!current) {
      // Default to Bagas Mahpie for instant seamless preview
      const defaultUser = DEFAULT_STUDENTS[0];
      setStorage(STORAGE_KEYS.STUDENT_AUTH, defaultUser);
      return defaultUser;
    }
    return current;
  },

  setStudentAuth(student: StudentUser | null): void {
    if (student) {
      setStorage(STORAGE_KEYS.STUDENT_AUTH, student);
    } else {
      localStorage.removeItem(STORAGE_KEYS.STUDENT_AUTH);
    }
  },

  loginStudent(identifier: string): StudentUser {
    const cleanId = identifier.trim().toLowerCase();
    const roster = this.getDefaultStudents();
    const found = roster.find(s => 
      s.rollNo.toLowerCase() === cleanId || 
      s.email.toLowerCase() === cleanId || 
      s.name.toLowerCase() === cleanId
    );

    if (found) {
      this.setStudentAuth(found);
      return found;
    }

    // If not found in roster, create quick student session
    const names = identifier.split(' ');
    const initials = (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
    const newStudent: StudentUser = {
      id: 'stu-' + Date.now().toString(36),
      name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      rollNo: identifier.toUpperCase(),
      email: identifier.includes('@') ? identifier : `${identifier.toLowerCase()}@festgate.edu`,
      department: 'Computer Science',
      year: '3rd Year',
      avatarBg: 'bg-indigo-600',
      initials
    };
    roster.push(newStudent);
    setStorage(STORAGE_KEYS.STUDENT_ROSTER, roster);
    this.setStudentAuth(newStudent);
    return newStudent;
  },

  registerNewStudent(studentData: {
    name: string;
    rollNo: string;
    email: string;
    department: string;
    year?: string;
  }): StudentUser {
    const names = studentData.name.trim().split(' ');
    const initials = (names[0][0] + (names.length > 1 ? names[names.length - 1][0] : '')).toUpperCase();
    const palette = ['bg-indigo-600', 'bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600'];
    const avatarBg = palette[Math.floor(Math.random() * palette.length)];

    const newStudent: StudentUser = {
      id: 'stu-' + Date.now().toString(36),
      name: studentData.name.trim(),
      rollNo: studentData.rollNo.trim().toUpperCase(),
      email: studentData.email.trim().toLowerCase(),
      department: studentData.department.trim(),
      year: studentData.year || '3rd Year',
      avatarBg,
      initials
    };

    const roster = this.getDefaultStudents();
    const existingIndex = roster.findIndex(s => 
      s.rollNo.toLowerCase() === newStudent.rollNo.toLowerCase() || 
      s.email.toLowerCase() === newStudent.email.toLowerCase()
    );
    if (existingIndex >= 0) {
      roster[existingIndex] = newStudent;
    } else {
      roster.push(newStudent);
    }
    setStorage(STORAGE_KEYS.STUDENT_ROSTER, roster);
    this.setStudentAuth(newStudent);
    return newStudent;
  },

  // Student Data Isolation Queries
  getStudentRegistrations(rollNoOrEmail?: string): Attendee[] {
    const all = this.getAttendees();
    if (!rollNoOrEmail) {
      const activeUser = this.getStudentAuth();
      if (!activeUser) return [];
      rollNoOrEmail = activeUser.rollNo;
    }
    const cleanQuery = rollNoOrEmail.trim().toLowerCase();
    return all.filter(a => 
      a.rollNo.toLowerCase() === cleanQuery || 
      a.email.toLowerCase() === cleanQuery
    );
  },

  getStudentTickets(rollNoOrEmail?: string): Attendee[] {
    return this.getStudentRegistrations(rollNoOrEmail);
  },

  isStudentRegisteredForEvent(eventId: string, rollNo?: string, email?: string): Attendee | undefined {
    const all = this.getAttendees();
    const rLower = (rollNo || '').trim().toLowerCase();
    const eLower = (email || '').trim().toLowerCase();
    return all.find(a => 
      a.eventId === eventId && 
      ((rLower && a.rollNo.toLowerCase() === rLower) || (eLower && a.email.toLowerCase() === eLower))
    );
  },

  // Duplicate-preventing Registration
  registerAttendeeSafe(data: {
    name: string;
    rollNo: string;
    email: string;
    department: string;
    eventId: string;
  }): RegistrationResult {
    const cleanRollNo = data.rollNo.trim().toUpperCase();
    const cleanEmail = data.email.trim().toLowerCase();

    // Check duplicate
    const existing = this.isStudentRegisteredForEvent(data.eventId, cleanRollNo, cleanEmail);
    if (existing) {
      return {
        success: false,
        reason: 'DUPLICATE',
        message: `You are already registered for this event with Pass Code "${existing.ticketCode}". Duplicate registrations are prevented.`,
        attendee: existing
      };
    }

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
      name: data.name.trim(),
      rollNo: cleanRollNo,
      email: cleanEmail,
      department: data.department.trim(),
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

    return {
      success: true,
      reason: 'SUCCESS',
      message: `Registration successful! Your digital QR Ticket Pass is ready.`,
      attendee: newAttendee
    };
  },

  registerAttendee(data: {
    name: string;
    rollNo: string;
    email: string;
    department: string;
    eventId: string;
  }): Attendee {
    const res = this.registerAttendeeSafe(data);
    if (!res.success && res.attendee) {
      return res.attendee;
    }
    return res.attendee!;
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
