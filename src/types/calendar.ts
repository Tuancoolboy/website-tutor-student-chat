export type EventType = 'session' | 'personal' | 'reminder'

export interface Session {
  id: string
  subject: string
  eventType?: EventType // Optional - to identify event type (session, personal, reminder)
  tutor?: {
    id: string
    name: string
    avatar?: string
  }
  student?: {
    id: string
    name: string
    avatar?: string
  }
  date: string // YYYY-MM-DD format
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  location: {
    type: 'online' | 'offline'
    address?: string
    meetingLink?: string
  }
  status: SessionStatus
  notes?: string
  color: string
  createdAt: string
  updatedAt: string
  classId?: string // Optional - to identify if session is from a class
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'

export interface CalendarFilters {
  subject?: string
  tutor?: string
  student?: string
  status?: SessionStatus
  dateRange?: {
    start: string
    end: string
  }
}

export interface TimeSlot {
  time: string
  displayTime: string
  sessions: Session[]
}

export interface WeekData {
  startDate: string
  endDate: string
  days: {
    date: string
    dayName: string
    timeSlots: TimeSlot[]
  }[]
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Session
}

export interface Subject {
  id: string
  name: string
  color: string
  description?: string
}

export interface Tutor {
  id: string
  name: string
  avatar?: string
  subjects: string[]
  rating: number
  experience: string
}

export interface Student {
  id: string
  name: string
  avatar?: string
  level: string
  subjects: string[]
}
