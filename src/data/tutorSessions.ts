import { Session, Student } from '../types/calendar'

export const students: Student[] = [
  {
    id: 'student1',
    name: 'John Smith',
    avatar: '/avatars/student1.jpg',
    level: 'Advanced',
    subjects: ['math', 'physics']
  },
  {
    id: 'student2',
    name: 'Emily Johnson',
    avatar: '/avatars/student2.jpg',
    level: 'Intermediate',
    subjects: ['chemistry', 'biology']
  },
  {
    id: 'student3',
    name: 'Michael Brown',
    avatar: '/avatars/student3.jpg',
    level: 'Beginner',
    subjects: ['computer', 'math']
  },
  {
    id: 'student4',
    name: 'Sarah Davis',
    avatar: '/avatars/student4.jpg',
    level: 'Advanced',
    subjects: ['physics', 'chemistry']
  },
  {
    id: 'student5',
    name: 'David Wilson',
    avatar: '/avatars/student5.jpg',
    level: 'Intermediate',
    subjects: ['english', 'computer']
  }
]

export const tutorSessions: Session[] = [
  {
    id: 'tutor-session1',
    subject: 'Mathematics',
    student: {
      id: 'student1',
      name: 'John Smith',
      avatar: '/avatars/student1.jpg'
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
    id: 'tutor-session2',
    subject: 'Physics',
    student: {
      id: 'student4',
      name: 'Sarah Davis',
      avatar: '/avatars/student4.jpg'
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
    id: 'tutor-session3',
    subject: 'Computer Science',
    student: {
      id: 'student3',
      name: 'Michael Brown',
      avatar: '/avatars/student3.jpg'
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
    id: 'tutor-session4',
    subject: 'Chemistry',
    student: {
      id: 'student2',
      name: 'Emily Johnson',
      avatar: '/avatars/student2.jpg'
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
    id: 'tutor-session5',
    subject: 'Mathematics',
    student: {
      id: 'student1',
      name: 'John Smith',
      avatar: '/avatars/student1.jpg'
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
    id: 'tutor-session6',
    subject: 'Biology',
    student: {
      id: 'student2',
      name: 'Emily Johnson',
      avatar: '/avatars/student2.jpg'
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
  },
  {
    id: 'tutor-session7',
    subject: 'English',
    student: {
      id: 'student5',
      name: 'David Wilson',
      avatar: '/avatars/student5.jpg'
    },
    date: '2024-01-21',
    startTime: '11:00',
    endTime: '12:30',
    location: {
      type: 'online',
      meetingLink: 'https://teams.microsoft.com/l/meetup-join/123456'
    },
    status: 'scheduled',
    notes: 'Literature Analysis - Shakespeare\'s Sonnets',
    color: '#ef4444',
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-16T11:00:00Z'
  },
  {
    id: 'tutor-session8',
    subject: 'Physics',
    student: {
      id: 'student4',
      name: 'Sarah Davis',
      avatar: '/avatars/student4.jpg'
    },
    date: '2024-01-22',
    startTime: '15:00',
    endTime: '16:30',
    location: {
      type: 'offline',
      address: 'Physics Lab, Room 105'
    },
    status: 'scheduled',
    notes: 'Electromagnetism - Maxwell\'s Equations',
    color: '#10b981',
    createdAt: '2024-01-17T15:00:00Z',
    updatedAt: '2024-01-17T15:00:00Z'
  }
]

// Helper function to get sessions for a specific week
export const getTutorSessionsForWeek = (startDate: string): Session[] => {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  
  return tutorSessions.filter(session => {
    const sessionDate = new Date(session.date)
    return sessionDate >= start && sessionDate <= end
  })
}

// Helper function to get sessions for a specific day
export const getTutorSessionsForDay = (date: string): Session[] => {
  return tutorSessions.filter(session => session.date === date)
}

// Helper function to get sessions by status
export const getTutorSessionsByStatus = (status: string): Session[] => {
  return tutorSessions.filter(session => session.status === status)
}

// Helper function to get sessions by subject
export const getTutorSessionsBySubject = (subject: string): Session[] => {
  return tutorSessions.filter(session => session.subject === subject)
}

// Helper function to get sessions by student
export const getTutorSessionsByStudent = (studentId: string): Session[] => {
  return tutorSessions.filter(session => session.student?.id === studentId)
}
