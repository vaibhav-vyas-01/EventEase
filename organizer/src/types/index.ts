export interface EventItem {
  id: string;
  title: string;
  category: 'TECH' | 'DESIGN' | 'CULTURAL' | 'GAMING' | 'WORKSHOP';
  categoryColor: string;
  date: string;
  time: string;
  venue: string;
  capacity: number;
  registeredCount: number;
  checkedInCount: number;
  description: string;
  coordinator: {
    name: string;
    role: string;
    initials: string;
    avatarBg: string;
  };
  imageGradient: string;
  imageSrc?: string;
  bookmarked?: boolean;
}

export interface Attendee {
  id: string;
  ticketCode: string;
  name: string;
  rollNo: string;
  email: string;
  department: string;
  eventId: string;
  eventTitle: string;
  eventCategory: string;
  registeredAt: string;
  status: 'REGISTERED' | 'CHECKED_IN' | 'CANCELLED';
  checkedInAt?: string;
  checkedInBy?: string;
  initials: string;
  avatarBg: string;
}

export interface Coordinator {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarBg: string;
  status: 'Online' | 'At Gate 1' | 'At Gate 2' | 'Offline';
  isFollowing?: boolean;
}

export interface GateLog {
  id: string;
  ticketCode: string;
  attendeeName: string;
  eventTitle: string;
  timestamp: string;
  result: 'SUCCESS' | 'DUPLICATE' | 'INVALID';
  message: string;
  gateStaff: string;
}

export interface StatSummary {
  totalRegistered: number;
  totalCheckedIn: number;
  verificationRate: number;
  activeEventsCount: number;
}
