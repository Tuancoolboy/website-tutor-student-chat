/**
 * API Client for Frontend
 * Base URL: http://localhost:3000/api or /api in production
 */

import { API_BASE_URL } from '../env';

// Helper to get token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper to make authenticated requests
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log('🌐 [API] Request:', {
    method: options.method || 'GET',
    url,
    body: options.body ? JSON.parse(options.body as string) : undefined
  });

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    // If not JSON, get text and try to parse
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('⚠️ [API] Response is not JSON:', text.substring(0, 200));
      return {
        success: false,
        error: `Server returned invalid response: ${response.status} ${response.statusText}`
      };
    }
  }
  
  console.log('📡 [API] Response:', {
    status: response.status,
    url,
    data
  });

  return data;
}

// ===== AUTHENTICATION =====

export const authAPI = {
  async login(email: string, password: string) {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: 'student' | 'tutor' | 'management';
    [key: string]: any;
  }) {
    return fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async logout() {
    return fetchAPI('/auth/logout', { method: 'POST' });
  },

  async getMe() {
    return fetchAPI('/auth/me');
  },

  async refreshToken(refreshToken: string) {
    return fetchAPI('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
  }
};

// ===== SESSIONS =====

export const sessionsAPI = {
  async list(params?: {
    studentId?: string;
    tutorId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    classId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/sessions${query}`);
  },

  async create(data: {
    tutorId: string;
    subject: string;
    startTime: string;
    endTime: string;
    duration: number;
    isOnline?: boolean;
    meetingLink?: string;
    description?: string;
    notes?: string;
  }) {
    return fetchAPI('/sessions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async get(id: string) {
    return fetchAPI(`/sessions/${id}`);
  },

  async update(id: string, data: any) {
    return fetchAPI(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async cancel(id: string, reason: string) {
    return fetchAPI(`/sessions/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
  },

  async reschedule(id: string, data: {
    startTime: string;
    endTime: string;
    reason?: string;
  }) {
    return fetchAPI(`/sessions/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// ===== TUTORS =====

export const tutorsAPI = {
  async list(params?: {
    subject?: string;
    minRating?: number;
    verified?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/tutors${query}`);
  },

  async get(id: string) {
    return fetchAPI(`/tutors/${id}`);
  },

  async getReviews(id: string, params?: { page?: number; limit?: number }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/tutors/${id}/reviews${query}`);
  }
};

// ===== STUDENTS =====

export const studentsAPI = {
  async get(id: string) {
    return fetchAPI(`/students/${id}`);
  },

  async getSessions(id: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/students/${id}/sessions${query}`);
  }
};

// ===== CALENDAR =====

export const calendarAPI = {
  async get(userId: string, params?: {
    month?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/calendar/${userId}${query}`);
  }
};

// ===== AVAILABILITY =====

export const availabilityAPI = {
  async get(tutorId: string, excludeClasses?: boolean) {
    const query = excludeClasses ? '?excludeClasses=true' : '';
    return fetchAPI(`/availability/${tutorId}${query}`);
  },

  async set(data: {
    timeSlots: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
    exceptions?: Array<{
      date: string;
      reason: string;
    }>;
  }) {
    return fetchAPI('/availability', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async update(id: string, data: any) {
    return fetchAPI(`/availability/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

// ===== NOTIFICATIONS =====

export const notificationsAPI = {
  async list(params?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/notifications${query}`);
  },

  async markAsRead(id: string) {
    return fetchAPI(`/notifications/${id}/read`, { method: 'PUT' });
  },

  async delete(id: string) {
    return fetchAPI(`/notifications/${id}`, { method: 'DELETE' });
  }
};

// ===== PROGRESS =====

export const progressAPI = {
  async list(params?: {
    studentId?: string;
    tutorId?: string;
    subject?: string;
    sessionId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/progress${query}`);
  },

  async create(data: {
    studentId: string;
    sessionId: string;
    subject: string;
    topic: string;
    notes?: string;
    score: number;
    improvements?: string[];
    challenges?: string[];
    nextSteps?: string[];
  }) {
    return fetchAPI('/progress', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async get(id: string) {
    return fetchAPI(`/progress/${id}`);
  }
};

// ===== FORUM =====

export const forumAPI = {
  posts: {
    async list(params?: {
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) {
      const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return fetchAPI(`/forum/posts${query}`);
    },

    async create(data: {
      title: string;
      content: string;
      category: string;
      tags?: string[];
      images?: string[];
    }) {
      return fetchAPI('/forum/posts', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async get(id: string) {
      return fetchAPI(`/forum/posts/${id}`);
    },

    async update(id: string, data: any) {
      return fetchAPI(`/forum/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async delete(id: string) {
      return fetchAPI(`/forum/posts/${id}`, { method: 'DELETE' });
    },

    async like(id: string) {
      return fetchAPI(`/forum/posts/${id}/like`, { method: 'POST' });
    }
  },

  comments: {
    async list(postId: string, params?: { page?: number; limit?: number }) {
      const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return fetchAPI(`/forum/posts/${postId}/comments${query}`);
    },

    async create(postId: string, data: {
      content: string;
      parentCommentId?: string;
    }) {
      return fetchAPI(`/forum/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async delete(id: string) {
      return fetchAPI(`/forum/comments/${id}`, { method: 'DELETE' });
    }
  }
};

// ===== CONVERSATIONS & MESSAGES =====

export const conversationsAPI = {
  async list(params?: {
    page?: number;
    limit?: number;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/conversations${query}`);
  },

  async create(data: {
    participantIds: string[];
  }) {
    return fetchAPI('/conversations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async get(id: string) {
    return fetchAPI(`/conversations/${id}`);
  },

  async delete(id: string) {
    return fetchAPI(`/conversations/${id}`, {
      method: 'DELETE'
    });
  },

  messages: {
    async list(conversationId: string, params?: {
      page?: number;
      limit?: number;
    }) {
      const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return fetchAPI(`/conversations/${conversationId}/messages${query}`);
    },

    async send(conversationId: string, data: {
      content: string;
      type?: 'text' | 'file' | 'image';
      fileUrl?: string;
    }) {
      return fetchAPI(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async markRead(messageId: string) {
      return fetchAPI(`/messages/${messageId}/read`, {
        method: 'PUT'
      });
    }
  },

  /**
   * Send message directly to a user (auto-create conversation if needed)
   * This makes it easier for users to start messaging without manually creating conversations
   */
  async sendToUser(data: {
    receiverId: string;
    content: string;
    type?: 'text' | 'file' | 'image';
    fileUrl?: string;
  }) {
    return fetchAPI('/messages/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// ===== USERS =====

export const usersAPI = {
  async list(params?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
    ids?: string[]; // Batch load users by IDs
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    // If ids is provided, join them with commas
    if (params?.ids && params.ids.length > 0) {
      const queryParams = new URLSearchParams();
      if (params.role) queryParams.set('role', params.role);
      if (params.search) queryParams.set('search', params.search);
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      queryParams.set('ids', params.ids.join(','));
      return fetchAPI(`/users?${queryParams.toString()}`);
    }
    return fetchAPI(`/users${query}`);
  },

  async get(id: string) {
    return fetchAPI(`/users/${id}`);
  },

  // Batch load users by IDs (much faster than multiple get() calls)
  async getByIds(ids: string[]) {
    if (ids.length === 0) {
      return { success: true, data: [] };
    }
    return this.list({ ids });
  },

  async update(id: string, data: any) {
    return fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: string) {
    return fetchAPI(`/users/${id}`, { method: 'DELETE' });
  }
};

// ===== EVALUATIONS =====

export const evaluationsAPI = {
  async list(params?: {
    studentId?: string;
    tutorId?: string;
    sessionId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/evaluations${query}`);
  },

  async create(data: {
    sessionId: string;
    rating: number;
    comment?: string;
    aspects?: {
      communication?: number;
      knowledge?: number;
      helpfulness?: number;
      punctuality?: number;
    };
    improvements?: string[];
    recommend?: boolean;
  }) {
    return fetchAPI('/evaluations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async get(id: string) {
    return fetchAPI(`/evaluations/${id}`);
  },

  async update(id: string, data: any) {
    return fetchAPI(`/evaluations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: string) {
    return fetchAPI(`/evaluations/${id}`, { method: 'DELETE' });
  }
};

// ===== COURSE CONTENTS =====

export const courseContentsAPI = {
  async list(sessionId: string) {
    return fetchAPI(`/sessions/${sessionId}/course-contents`);
  },

  async create(sessionId: string, data: {
    type: string;
    title: string;
    description?: string;
    content?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    url?: string;
  }) {
    return fetchAPI(`/sessions/${sessionId}/course-contents`, {
      method: 'POST',
      body: JSON.stringify({ ...data, sessionId })
    });
  },

  async update(sessionId: string, contentId: string, data: any) {
    return fetchAPI(`/sessions/${sessionId}/course-contents/${contentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(sessionId: string, contentId: string) {
    return fetchAPI(`/sessions/${sessionId}/course-contents/${contentId}`, {
      method: 'DELETE'
    });
  }
};

// ===== QUIZZES =====

export const quizzesAPI = {
  async list(sessionId: string) {
    return fetchAPI(`/sessions/${sessionId}/quizzes`);
  },

  async create(sessionId: string, data: {
    title: string;
    description?: string;
    questions: any[];
    duration?: number;
    dueDate?: string;
  }) {
    return fetchAPI(`/sessions/${sessionId}/quizzes`, {
      method: 'POST',
      body: JSON.stringify({ ...data, sessionId })
    });
  },

  async update(sessionId: string, quizId: string, data: any) {
    return fetchAPI(`/sessions/${sessionId}/quizzes/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(sessionId: string, quizId: string) {
    return fetchAPI(`/sessions/${sessionId}/quizzes/${quizId}`, {
      method: 'DELETE'
    });
  },

  async getSubmissions(sessionId: string, quizId: string) {
    return fetchAPI(`/sessions/${sessionId}/quizzes/${quizId}/submissions`);
  },

  async submit(sessionId: string, quizId: string, answers: {[key: string]: string}) {
    return fetchAPI(`/sessions/${sessionId}/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ quizId, answers })
    });
  }
};

// ===== ASSIGNMENTS =====

export const assignmentsAPI = {
  async list(sessionId: string) {
    return fetchAPI(`/sessions/${sessionId}/assignments`);
  },

  async create(sessionId: string, data: {
    title: string;
    description: string;
    instructions?: string;
    attachments?: any[];
    totalPoints: number;
    dueDate: string;
  }) {
    return fetchAPI(`/sessions/${sessionId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({ ...data, sessionId })
    });
  },

  async update(sessionId: string, assignmentId: string, data: any) {
    return fetchAPI(`/sessions/${sessionId}/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(sessionId: string, assignmentId: string) {
    return fetchAPI(`/sessions/${sessionId}/assignments/${assignmentId}`, {
      method: 'DELETE'
    });
  },

  async submit(sessionId: string, assignmentId: string, data: {
    content?: string;
    attachments?: any[];
  }) {
    return fetchAPI(`/sessions/${sessionId}/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ assignmentId, ...data })
    });
  }
};

// ===== SUBMISSIONS =====

export const submissionsAPI = {
  async list(sessionId: string) {
    return fetchAPI(`/sessions/${sessionId}/submissions`);
  },

  async grade(sessionId: string, submissionId: string, data: {
    score: number;
    feedback?: string;
  }) {
    return fetchAPI(`/sessions/${sessionId}/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};

// ===== GRADES =====

export const gradesAPI = {
  async list(sessionId: string) {
    return fetchAPI(`/sessions/${sessionId}/grades`);
  },

  async getSummary(sessionId: string, studentId?: string) {
    const query = studentId ? `?studentId=${studentId}` : '';
    return fetchAPI(`/sessions/${sessionId}/grades/summary${query}`);
  }
};

// ===== SESSION STUDENTS =====

export const sessionStudentsAPI = {
  async list(sessionId: string) {
    return fetchAPI(`/sessions/${sessionId}/students`);
  },

  async add(sessionId: string, studentId: string) {
    return fetchAPI(`/sessions/${sessionId}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentId })
    });
  },

  async remove(sessionId: string, studentId: string) {
    return fetchAPI(`/sessions/${sessionId}/students/${studentId}`, {
      method: 'DELETE'
    });
  }
};

// ===== CLASSES =====

export const classesAPI = {
  async list(params?: {
    tutorId?: string;
    subject?: string;
    day?: string;
    status?: string;
    availableOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/classes${query}`);
  },

  async create(data: {
    code: string;
    subject: string;
    description?: string;
    day: string;
    startTime: string;
    endTime: string;
    duration: number;
    maxStudents: number;
    semesterStart: string;
    semesterEnd: string;
    isOnline?: boolean;
    location?: string;
  }) {
    return fetchAPI('/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async get(id: string) {
    return fetchAPI(`/classes/${id}`);
  },

  async update(id: string, data: any) {
    return fetchAPI(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: string) {
    return fetchAPI(`/classes/${id}`, {
      method: 'DELETE'
    });
  },

  async generateSessions(id: string) {
    return fetchAPI(`/classes/${id}/generate-sessions`, {
      method: 'POST'
    });
  }
};

// ===== ENROLLMENTS =====

export const enrollmentsAPI = {
  async list(params?: {
    studentId?: string;
    classId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/enrollments${query}`);
  },

  async create(data: {
    classId: string;
  }) {
    return fetchAPI('/enrollments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async get(id: string) {
    return fetchAPI(`/enrollments/${id}`);
  },

  async update(id: string, data: {
    status?: string;
    notes?: string;
  }) {
    return fetchAPI(`/enrollments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: string) {
    return fetchAPI(`/enrollments/${id}`, {
      method: 'DELETE'
    });
  }
};

// ===== UPLOAD =====

export const uploadAPI = {
  async uploadFile(file: File): Promise<{ success: boolean; data?: { url: string; fileName: string; fileSize: number; mimeType: string }; error?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const response = await fetchAPI('/upload', {
            method: 'POST',
            body: JSON.stringify({
              file: base64,
              fileName: file.name
            })
          });
          resolve(response);
        } catch (error: any) {
          resolve({
            success: false,
            error: error.message || 'Upload failed'
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read file'
        });
      };
      
      reader.readAsDataURL(file);
    });
  }
};

// ===== SESSION REQUESTS =====

export const sessionRequestsAPI = {
  async list(params?: {
    status?: string;
    type?: 'cancel' | 'reschedule';
    tutorId?: string;
    studentId?: string;
    classId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/session-requests${query}`);
  },

  async create(data: {
    sessionId: string;
    type: 'cancel' | 'reschedule';
    reason: string;
    preferredStartTime?: string;
    preferredEndTime?: string;
    alternativeSessionId?: string;
  }) {
    return fetchAPI('/session-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async get(id: string) {
    return fetchAPI(`/session-requests/${id}`);
  },

  async getAlternatives(params: {
    sessionId?: string;
    classId?: string;
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/session-requests/alternatives${query}`);
  },

  async approve(id: string, data: {
    responseMessage?: string;
    newStartTime?: string;
    newEndTime?: string;
    alternativeSessionId?: string;
  }) {
    return fetchAPI(`/session-requests/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async reject(id: string, data: {
    responseMessage?: string;
  }) {
    return fetchAPI(`/session-requests/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async withdraw(id: string) {
    return fetchAPI(`/session-requests/${id}`, {
      method: 'DELETE'
    });
  },

  async delete(id: string) {
    return fetchAPI(`/session-requests/${id}`, {
      method: 'DELETE'
    });
  }
};

// ===== EXPORT ALL =====

export const api = {
  auth: authAPI,
  sessions: sessionsAPI,
  tutors: tutorsAPI,
  students: studentsAPI,
  calendar: calendarAPI,
  availability: availabilityAPI,
  notifications: notificationsAPI,
  progress: progressAPI,
  evaluations: evaluationsAPI,
  forum: forumAPI,
  conversations: conversationsAPI,
  users: usersAPI,
  courseContents: courseContentsAPI,
  quizzes: quizzesAPI,
  assignments: assignmentsAPI,
  submissions: submissionsAPI,
  grades: gradesAPI,
  sessionStudents: sessionStudentsAPI,
  classes: classesAPI,
  enrollments: enrollmentsAPI,
  sessionRequests: sessionRequestsAPI
};

export default api;

