/**
 * API Usage Examples
 * Demo cách sử dụng API trong React components
 */

import { useState, useEffect } from 'react';
import api from '../lib/api';

// ===== EXAMPLE 1: Login =====

export function LoginExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await api.auth.login(email, password);
      
      if (result.success) {
        // Save token & user
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        alert('Đăng nhập thành công!');
        console.log('User:', result.data.user);
        
        // Redirect based on role
        window.location.href = `/${result.data.user.role}/dashboard`;
      } else {
        alert('Lỗi: ' + result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Có lỗi xảy ra khi đăng nhập');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Đăng nhập</button>
    </form>
  );
}

// ===== EXAMPLE 2: List Tutors =====

export function TutorsListExample() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTutors();
  }, []);

  const loadTutors = async () => {
    try {
      const result = await api.tutors.list({
        subject: 'Toán cao cấp',
        minRating: 4,
        limit: 10
      });

      if (result.success) {
        setTutors(result.data);
      }
    } catch (error) {
      console.error('Error loading tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Danh sách gia sư</h2>
      {tutors.map((tutor) => (
        <div key={tutor.id}>
          <h3>{tutor.name}</h3>
          <p>Rating: {tutor.rating} ⭐</p>
          <p>Subjects: {tutor.subjects.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}

// ===== EXAMPLE 3: Book Session =====

export function BookSessionExample() {
  const [tutorId, setTutorId] = useState('');
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate end time (2 hours later)
      const start = new Date(startTime);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

      const result = await api.sessions.create({
        tutorId,
        subject,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        duration: 120,
        isOnline: true
      });

      if (result.success) {
        alert('Đặt buổi học thành công!');
        console.log('Session:', result.data);
      } else {
        alert('Lỗi: ' + result.error);
      }
    } catch (error) {
      console.error('Book session error:', error);
      alert('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleBook}>
      <input
        value={tutorId}
        onChange={(e) => setTutorId(e.target.value)}
        placeholder="Tutor ID"
      />
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Môn học"
      />
      <input
        type="datetime-local"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Đang đặt...' : 'Đặt buổi học'}
      </button>
    </form>
  );
}

// ===== EXAMPLE 4: Calendar View =====

export function CalendarExample() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [month] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    loadCalendar();
  }, []);

  const loadCalendar = async () => {
    try {
      // Get current user
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);

      const result = await api.calendar.get(user.id, { month, year });

      if (result.success) {
        setSessions(result.data.sessions);
        console.log('Calendar:', result.data.calendar);
        console.log('Stats:', result.data.stats);
      }
    } catch (error) {
      console.error('Error loading calendar:', error);
    }
  };

  return (
    <div>
      <h2>Lịch của tôi - Tháng {month}/{year}</h2>
      {sessions.map((session) => (
        <div key={session.id}>
          <p>{new Date(session.startTime).toLocaleString('vi-VN')}</p>
          <p>{session.subject}</p>
          <p>Status: {session.status}</p>
        </div>
      ))}
    </div>
  );
}

// ===== EXAMPLE 5: Notifications =====

export function NotificationsExample() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await api.notifications.list({ limit: 20 });

      if (result.success) {
        setNotifications(result.data.data);
        setUnreadCount(result.data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      loadNotifications(); // Reload
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <div>
      <h2>Thông báo ({unreadCount} chưa đọc)</h2>
      {notifications.map((notif) => (
        <div
          key={notif.id}
          style={{
            backgroundColor: notif.read ? 'white' : '#e3f2fd',
            padding: '10px',
            margin: '5px 0'
          }}
        >
          <h4>{notif.title}</h4>
          <p>{notif.message}</p>
          <small>{new Date(notif.createdAt).toLocaleString('vi-VN')}</small>
          {!notif.read && (
            <button onClick={() => markAsRead(notif.id)}>
              Đánh dấu đã đọc
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ===== EXAMPLE 6: Forum Posts =====

export function ForumExample() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const result = await api.forum.posts.list({ limit: 10 });

      if (result.success) {
        setPosts(result.data);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const likePost = async (postId: string) => {
    try {
      const result = await api.forum.posts.like(postId);
      
      if (result.success) {
        console.log('Liked:', result.data.liked);
        console.log('Likes count:', result.data.likesCount);
        loadPosts(); // Reload to see updated likes
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <div>
      <h2>Forum Posts</h2>
      {posts.map((post) => (
        <div key={post.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          <div>
            <span>👁️ {post.views} views</span>
            <span> | </span>
            <button onClick={() => likePost(post.id)}>
              ❤️ {post.likes?.length || 0} likes
            </button>
          </div>
          <small>Category: {post.category}</small>
        </div>
      ))}
    </div>
  );
}

// ===== EXAMPLE 7: Protected Component with Auth Check =====

export function ProtectedExample() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const result = await api.auth.getMe();

      if (result.success) {
        setUser(result.data);
      } else {
        // Token invalid, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Auth check error:', error);
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div>
      <h2>Welcome, {user.name}!</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}

// Export all examples
export default {
  LoginExample,
  TutorsListExample,
  BookSessionExample,
  CalendarExample,
  NotificationsExample,
  ForumExample,
  ProtectedExample
};

