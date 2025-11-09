import { Session, Subject, Tutor } from '../types/calendar'

export const subjects: Subject[] = [
  { id: 'math', name: 'Mathematics', color: '#3b82f6', description: 'Advanced Mathematics' },
  { id: 'physics', name: 'Physics', color: '#10b981', description: 'Physics and Mechanics' },
  { id: 'chemistry', name: 'Chemistry', color: '#f59e0b', description: 'Organic Chemistry' },
  { id: 'biology', name: 'Biology', color: '#8b5cf6', description: 'Cell Biology' },
  { id: 'english', name: 'English', color: '#ef4444', description: 'English Literature' },
  { id: 'computer', name: 'Computer Science', color: '#06b6d4', description: 'Programming' }
]

export const tutors: Tutor[] = [
  {
    id: 'tutor1',
    name: 'Dr. Sarah Wilson',
    avatar: '/avatars/tutor1.jpg',
    subjects: ['math', 'physics'],
    rating: 4.9,
    experience: '10 years'
  },
  {
    id: 'tutor2',
    name: 'Prof. Mike Chen',
    avatar: '/avatars/tutor2.jpg',
    subjects: ['computer', 'math'],
    rating: 4.8,
    experience: '8 years'
  },
  {
    id: 'tutor3',
    name: 'Dr. Alice Brown',
    avatar: '/avatars/tutor3.jpg',
    subjects: ['chemistry', 'biology'],
    rating: 4.7,
    experience: '12 years'
  },
  {
    id: 'tutor4',
    name: 'Prof. David Lee',
    avatar: '/avatars/tutor4.jpg',
    subjects: ['physics', 'math'],
    rating: 4.6,
    experience: '6 years'
  }
]

export const studentSessions: Session[] = [
  {
    id: 'session1',
    subject: 'Mathematics',
    tutor: {
      id: 'tutor1',
      name: 'Dr. Sarah Wilson',
      avatar: '/avatars/tutor1.jpg'
    },
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '10:30',
    location: {
      type: 'online',
      meetingLink: 'https://meet.google.com/abc-defg-hij'
    },
    status: 'scheduled',
    notes: 'Advanced Calculus - Integration techniques',
    color: '#3b82f6',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'session2',
    subject: 'Physics',
    tutor: {
      id: 'tutor4',
      name: 'Prof. David Lee',
      avatar: '/avatars/tutor4.jpg'
    },
    date: '2024-01-16',
    startTime: '14:00',
    endTime: '15:30',
    location: {
      type: 'offline',
      address: 'Room 201, Building A'
    },
    status: 'scheduled',
    notes: 'Mechanics - Newton\'s laws and applications',
    color: '#10b981',
    createdAt: '2024-01-11T14:00:00Z',
    updatedAt: '2024-01-11T14:00:00Z'
  },
  {
    id: 'session3',
    subject: 'Computer Science',
    tutor: {
      id: 'tutor2',
      name: 'Prof. Mike Chen',
      avatar: '/avatars/tutor2.jpg'
    },
    date: '2024-01-17',
    startTime: '10:00',
    endTime: '11:30',
    location: {
      type: 'online',
      meetingLink: 'https://zoom.us/j/123456789'
    },
    status: 'completed',
    notes: 'Data Structures - Binary Trees and Traversal',
    color: '#06b6d4',
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-17T11:30:00Z'
  },
  {
    id: 'session4',
    subject: 'Chemistry',
    tutor: {
      id: 'tutor3',
      name: 'Dr. Alice Brown',
      avatar: '/avatars/tutor3.jpg'
    },
    date: '2024-01-18',
    startTime: '16:00',
    endTime: '17:30',
    location: {
      type: 'offline',
      address: 'Lab 3, Chemistry Building'
    },
    status: 'scheduled',
    notes: 'Organic Chemistry - Reaction mechanisms',
    color: '#f59e0b',
    createdAt: '2024-01-13T16:00:00Z',
    updatedAt: '2024-01-13T16:00:00Z'
  },
  {
    id: 'session5',
    subject: 'Mathematics',
    tutor: {
      id: 'tutor1',
      name: 'Dr. Sarah Wilson',
      avatar: '/avatars/tutor1.jpg'
    },
    date: '2024-01-19',
    startTime: '08:00',
    endTime: '09:30',
    location: {
      type: 'online',
      meetingLink: 'https://meet.google.com/xyz-1234-abc'
    },
    status: 'scheduled',
    notes: 'Linear Algebra - Matrix operations',
    color: '#3b82f6',
    createdAt: '2024-01-14T08:00:00Z',
    updatedAt: '2024-01-14T08:00:00Z'
  },
  {
    id: 'session6',
    subject: 'Biology',
    tutor: {
      id: 'tutor3',
      name: 'Dr. Alice Brown',
      avatar: '/avatars/tutor3.jpg'
    },
    date: '2024-01-20',
    startTime: '13:00',
    endTime: '14:30',
    location: {
      type: 'offline',
      address: 'Lab 1, Biology Building'
    },
    status: 'cancelled',
    notes: 'Cell Biology - Mitosis and Meiosis',
    color: '#8b5cf6',
    createdAt: '2024-01-15T13:00:00Z',
    updatedAt: '2024-01-19T10:00:00Z'
  }
]

// Helper function to get sessions for a specific week
export const getSessionsForWeek = (startDate: string): Session[] => {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  
  return studentSessions.filter(session => {
    const sessionDate = new Date(session.date)
    return sessionDate >= start && sessionDate <= end
  })
}

// Helper function to get sessions for a specific day
export const getSessionsForDay = (date: string): Session[] => {
  return studentSessions.filter(session => session.date === date)
}

// Helper function to get sessions by status
export const getSessionsByStatus = (status: string): Session[] => {
  return studentSessions.filter(session => session.status === status)
}

// Helper function to get sessions by subject
export const getSessionsBySubject = (subject: string): Session[] => {
  return studentSessions.filter(session => session.subject === subject)
}
