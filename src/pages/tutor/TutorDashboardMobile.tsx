import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Avatar } from '@mui/material'
import '../../styles/weather-animations.css'
import api from '../../lib/api'
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Autorenew as AutorenewIcon,
  Star as StarIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Menu as MenuIcon,
  BarChart as BarChartIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  VideoCall as VideoCallIcon,
  Chat as ChatIcon,
  Palette as PaletteIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  WbSunny as WbSunnyIcon,
  Cloud as CloudIcon,
  Thunderstorm as ThunderstormIcon,
  AcUnit as AcUnitIcon,
  Home as HomeIcon,
  Bookmark as BookmarkIcon,
  CalendarMonth,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
  MenuBook as MenuBookIcon,
  Forum as ForumIcon,
  School as SchoolIcon,
  PersonSearch
} from '@mui/icons-material'

const TutorDashboardMobile: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showThemeOptions, setShowThemeOptions] = useState(false)
  const [currentTab, setCurrentTab] = useState('home')
  
  // User data states
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<{ [key: string]: any }>({})
  
  // Time and weather states
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weather, setWeather] = useState<any>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuClick = (item: any) => {
    setActiveMenu(item.id)
    if (item.path) {
      navigate(item.path)
    }
    setMobileOpen(false)
  }

  const handleThemeToggle = () => {
    toggleTheme()
    setShowThemeOptions(false)
  }

  // Load user data and sessions from backend
  const loadUserData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const userResult = await api.auth.getMe()
      if (userResult.success) {
        const userData = userResult.data
        setUser(userData)
        
        // Get tutor sessions and classes in parallel
        const [sessionsResult, classesResult] = await Promise.all([
          api.sessions.list({
            tutorId: userData.id,
            limit: 100
          }),
          api.classes.list({
          tutorId: userData.id,
          limit: 100
        })
        ])
        
        // Process sessions
        if (sessionsResult && sessionsResult.data) {
          const sessionsData = sessionsResult.data || []
          setSessions(sessionsData)
          
          // Collect all unique student IDs from sessions (support both old studentId and new studentIds array)
          const sessionStudentIds = new Set<string>()
          sessionsData.forEach((s: any) => {
            if (s.studentIds && Array.isArray(s.studentIds)) {
              s.studentIds.forEach((id: string) => sessionStudentIds.add(id))
            } else if (s.studentId) {
              sessionStudentIds.add(s.studentId)
            }
          })
          
          // Process classes
          if (classesResult && classesResult.success && classesResult.data) {
            const classesData = classesResult.data || []
            setClasses(classesData)
            
            // Get enrollments for all classes to collect student IDs
            const classEnrollmentsPromises = classesData.map(async (classItem: any) => {
              try {
                const enrollmentsRes = await api.enrollments.list({ classId: classItem.id, status: 'active' })
                if (enrollmentsRes.success && enrollmentsRes.data) {
                  return enrollmentsRes.data.map((e: any) => e.studentId)
                }
              } catch (err) {
                console.error(`Failed to load enrollments for class ${classItem.id}:`, err)
              }
              return []
            })
            
            const classEnrollmentsResults = await Promise.all(classEnrollmentsPromises)
            classEnrollmentsResults.forEach(studentIds => {
              studentIds.forEach((id: string) => sessionStudentIds.add(id))
            })
          }
          
          // Fetch student data for all unique student IDs
          const uniqueStudentIds = Array.from(sessionStudentIds)
          const studentPromises = uniqueStudentIds.map(async (studentId: string) => {
            try {
              const studentResponse = await api.users.get(studentId)
              if (studentResponse.success && studentResponse.data) {
                return { id: studentId, data: studentResponse.data }
              }
            } catch (err) {
              console.error(`Failed to load student ${studentId}:`, err)
            }
            return null
          })
          
          const studentResults = await Promise.all(studentPromises)
          const studentsMap: { [key: string]: any } = {}
          studentResults.forEach(result => {
            if (result) {
              studentsMap[result.id] = result.data
            }
          })
          setStudents(studentsMap)
        } else if (classesResult && classesResult.success && classesResult.data) {
          // If no sessions but has classes
          const classesData = classesResult.data || []
          setClasses(classesData)
          
          // Get enrollments for all classes
          const classEnrollmentsPromises = classesData.map(async (classItem: any) => {
            try {
              const enrollmentsRes = await api.enrollments.list({ classId: classItem.id, status: 'active' })
              if (enrollmentsRes.success && enrollmentsRes.data) {
                return enrollmentsRes.data.map((e: any) => e.studentId)
              }
            } catch (err) {
              console.error(`Failed to load enrollments for class ${classItem.id}:`, err)
            }
            return []
          })
          
          const classEnrollmentsResults = await Promise.all(classEnrollmentsPromises)
          const allStudentIds = new Set<string>()
          classEnrollmentsResults.forEach(studentIds => {
            studentIds.forEach((id: string) => allStudentIds.add(id))
          })
          
          // Fetch student data
          const studentPromises = Array.from(allStudentIds).map(async (studentId: string) => {
            try {
              const studentResponse = await api.users.get(studentId)
              if (studentResponse.success && studentResponse.data) {
                return { id: studentId, data: studentResponse.data }
              }
            } catch (err) {
              console.error(`Failed to load student ${studentId}:`, err)
            }
            return null
          })
          
          const studentResults = await Promise.all(studentPromises)
          const studentsMap: { [key: string]: any } = {}
          studentResults.forEach(result => {
            if (result) {
              studentsMap[result.id] = result.data
            }
          })
          setStudents(studentsMap)
        }
      } else {
        // If auth fails, redirect to login
        if (userResult.error?.includes('xác thực')) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Weather API function
  const fetchWeather = async () => {
    try {
      setWeatherLoading(true)
      const API_KEY = 'd055198c2320f9b77049b5b9a1db7205'
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Ho%20Chi%20Minh%20City&appid=${API_KEY}&units=metric`
      )
      const data = await response.json()
      setWeather(data)
    } catch (error) {
      console.error('Error fetching weather:', error)
      setWeather({
        main: { temp: 28, humidity: 75 },
        weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
        name: 'Ho Chi Minh City'
      })
    } finally {
      setWeatherLoading(false)
    }
  }

  // Get weather icon with time consideration
  const getWeatherIcon = (weatherMain: string) => {
    const hour = currentTime.getHours()
    const isNight = hour >= 18 || hour <= 6
    
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        if (isNight) {
          return <WbSunnyIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-400'}`} />
        } else {
          return <WbSunnyIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />
        }
      case 'clouds':
        return <CloudIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
      case 'rain':
      case 'drizzle':
        return <ThunderstormIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
      case 'snow':
        return <AcUnitIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-500'}`} />
      default:
        if (isNight) {
          return <WbSunnyIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-400'}`} />
        } else {
          return <WbSunnyIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />
        }
    }
  }

  // Get weather background class
  const getWeatherBackground = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return 'weather-sunny'
      case 'clouds':
        return 'weather-cloudy'
      case 'rain':
      case 'drizzle':
        return 'weather-rainy'
      case 'snow':
        return 'weather-snowy'
      default:
        return 'weather-sunny'
    }
  }

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  // useEffect for data loading, time and weather
  useEffect(() => {
    // Load user data and sessions
    loadUserData()
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    fetchWeather()
    const weatherInterval = setInterval(fetchWeather, 10 * 60 * 1000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(weatherInterval)
    }
  }, [])

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Helper function to generate avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#607d8b'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Calculate stats from real data
  const totalSessions = sessions.length
  const totalClasses = classes.length
  const upcomingCount = sessions.filter(s => s.status === 'scheduled' || s.status === 'confirmed').length
  const activeClasses = classes.filter(c => c.status === 'active').length
  
  // Count unique students from both sessions and classes
  const sessionStudentIds = new Set<string>()
  sessions.forEach((s: any) => {
    if (s.studentIds && Array.isArray(s.studentIds)) {
      s.studentIds.forEach((id: string) => sessionStudentIds.add(id))
    } else if (s.studentId) {
      sessionStudentIds.add(s.studentId)
    }
  })
  
  // Get unique students from classes (will be loaded async, so approximate for now)
  const totalEnrolledStudents = classes.reduce((sum, c) => sum + (c.currentEnrollment || 0), 0)
  const uniqueStudents = Math.max(sessionStudentIds.size, totalEnrolledStudents)
  
  const tutorRating = user?.rating || 0
  
  const stats = [
    { title: 'Total Students', value: uniqueStudents.toString(), icon: <PeopleIcon /> },
    { title: 'Total Classes', value: totalClasses.toString(), icon: <CheckCircleIcon /> },
    { title: 'Total Sessions', value: totalSessions.toString(), icon: <ScheduleIcon /> },
    { title: 'Rating', value: tutorRating.toFixed(1), icon: <StarIcon /> }
  ]
  
  // User name and avatar from backend
  const userName = user?.name || 'Tutor'
  const avatarUrl = user?.avatar

  // Get upcoming sessions (confirmed or pending) from real data
  const upcomingSessions = sessions
    .filter(session => {
      const sessionDate = new Date(session.startTime)
      const now = new Date()
      return (session.status === 'confirmed' || session.status === 'pending') && sessionDate >= now
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 6) // Limit to 6 upcoming sessions

  // Get past sessions (completed or in the past)
  const pastSessions = sessions
    .filter(session => {
      const sessionDate = new Date(session.startTime)
      const now = new Date()
      return session.status === 'completed' || (sessionDate < now && session.status !== 'cancelled')
    })
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()) // Most recent first
    .slice(0, 6) // Limit to 6 past sessions

  const notifications = [
    { message: 'New session request from John Smith', time: '2 hours ago', type: 'session' },
    { message: 'Student feedback received from Alice Brown', time: '1 day ago', type: 'feedback' },
    { message: 'Payment received for session with Mike Chen', time: '2 days ago', type: 'payment' },
    { message: 'Schedule change request from Sarah Johnson', time: '3 days ago', type: 'schedule' }
  ]

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/tutor' },
    { id: 'availability', label: 'Set Availability', icon: <ScheduleIcon />, path: '/tutor/availability' },
    { id: 'sessions', label: 'Manage Sessions', icon: <AssignmentIcon />, path: '/tutor/sessions' },
    { id: 'lms', label: 'LMS Management', icon: <SchoolIcon />, path: '/tutor/lms' },
    { id: 'calendar', label: 'Teaching Calendar', icon: <CalendarMonth />, path: '/tutor/calendar' },
    { id: 'progress', label: 'Track Progress', icon: <BarChartIcon />, path: '/tutor/track-progress' },
    { id: 'cancel-reschedule', label: 'Cancel/Reschedule', icon: <AutorenewIcon />, path: '/tutor/cancel-reschedule' },
    { id: 'messages', label: 'Messages', icon: <ChatIcon />, path: '/tutor/messages' },
    { id: 'library', label: 'Digital Library', icon: <MenuBookIcon />, path: '/common/library' },
    { id: 'forum', label: 'Community Forum', icon: <ForumIcon />, path: '/common/forum' }
  ]

  // Show loading state
  if (loading && !user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: theme === 'dark' ? '#fff' : '#000'
      }}>
        <div>Đang tải...</div>
      </div>
    )
  }

  const bottomNavItems = [
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'sessions', label: 'Sessions', icon: <BookmarkIcon /> },
    { id: 'students', label: 'Students', icon: <PeopleIcon /> },
    { id: 'profile', label: 'Profile', icon: <PersonIcon /> }
  ]

  const renderHomeTab = () => (
    <div className="space-y-4">
      {/* Time & Weather Widget - Mobile Optimized */}
      <div className={`rounded-xl p-4 shadow-lg relative overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} ${weather ? getWeatherBackground(weather.weather[0].main) : 'weather-sunny'}`}>
        {/* Weather Background Effects */}
        {weather && (
          <>
            {weather.weather[0].main.toLowerCase() === 'clear' && (
              <div className="absolute inset-0 opacity-20">
                <div className="sun-animation absolute top-2 right-2 w-12 h-12 bg-yellow-400 rounded-full"></div>
                <div className="sun-rays absolute top-0 right-0 w-16 h-16">
                  <div className="ray ray-1"></div>
                  <div className="ray ray-2"></div>
                  <div className="ray ray-3"></div>
                  <div className="ray ray-4"></div>
                  <div className="ray ray-5"></div>
                  <div className="ray ray-6"></div>
                  <div className="ray ray-7"></div>
                  <div className="ray ray-8"></div>
                </div>
              </div>
            )}
            
            {weather.weather[0].main.toLowerCase() === 'clouds' && (
              <div className="absolute inset-0 opacity-30">
                <div className="cloud cloud-1"></div>
                <div className="cloud cloud-2"></div>
                <div className="cloud cloud-3"></div>
              </div>
            )}
            
            {(weather.weather[0].main.toLowerCase() === 'rain' || weather.weather[0].main.toLowerCase() === 'drizzle') && (
              <div className="absolute inset-0 opacity-40">
                <div className="rain">
                  <div className="drop drop-1"></div>
                  <div className="drop drop-2"></div>
                  <div className="drop drop-3"></div>
                  <div className="drop drop-4"></div>
                  <div className="drop drop-5"></div>
                  <div className="drop drop-6"></div>
                  <div className="drop drop-7"></div>
                  <div className="drop drop-8"></div>
                  <div className="drop drop-9"></div>
                  <div className="drop drop-10"></div>
                </div>
              </div>
            )}
            
            {weather.weather[0].main.toLowerCase() === 'snow' && (
              <div className="absolute inset-0 opacity-30">
                <div className="snow">
                  <div className="flake flake-1"></div>
                  <div className="flake flake-2"></div>
                  <div className="flake flake-3"></div>
                  <div className="flake flake-4"></div>
                  <div className="flake flake-5"></div>
                  <div className="flake flake-6"></div>
                </div>
              </div>
            )}
          </>
        )}
        
        <div className="relative z-10">
          {/* Time Section */}
          <div className="mb-3">
            <div className="flex items-center mb-1">
              <AccessTimeIcon className={`w-4 h-4 mr-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Current Time</span>
            </div>
            <div className={`text-2xl font-bold mb-1 font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(currentTime)}
            </div>
            <div className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {formatDate(currentTime)}
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {getGreeting()}, {userName}
            </div>
          </div>

          {/* Weather Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <LocationOnIcon className={`w-4 h-4 mr-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Ho Chi Minh City</span>
            </div>
            
            {weatherLoading ? (
              <div className="flex items-center">
                <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${theme === 'dark' ? 'border-blue-400' : 'border-blue-600'}`}></div>
                <span className={`ml-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</span>
              </div>
            ) : weather ? (
              <div className="flex items-center">
                {getWeatherIcon(weather.weather[0].main)}
                <div className="ml-2">
                  <div className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {Math.round(weather.main.temp)}°C
                  </div>
                  <div className={`text-xs capitalize ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {weather.weather[0].description}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Weather unavailable</div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards - Mobile Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className={`p-3 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{
              borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              boxShadow: 'none !important'
            }}
          >
            <div className="text-center">
              <div className="text-2xl text-green-600 mb-1">{stat.icon}</div>
              <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.title}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {menuItems.slice(1, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item)}
            className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'} transition-colors`}
          >
            <div className="flex items-center">
              <span className="mr-3 text-green-600">{item.icon}</span>
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {item.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Upcoming Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Upcoming Sessions
          </h2>
          <button 
            onClick={() => navigate('/tutor/lms')}
            className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}
          >
            See All
          </button>
        </div>

        <div className="space-y-3">
          {upcomingSessions.length === 0 ? (
            <div className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No upcoming sessions
            </div>
          ) : (
            upcomingSessions.slice(0, 2).map((session) => {
              // Support both old studentId (string) and new studentIds (array)
              const studentIds = session.studentIds && Array.isArray(session.studentIds) 
                ? session.studentIds 
                : session.studentId 
                  ? [session.studentId] 
                  : []
              const firstStudent = studentIds.length > 0 ? students[studentIds[0]] : null
              const sessionDate = new Date(session.startTime)
              const formattedDate = sessionDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
              const formattedTime = sessionDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              
              return (
                <div 
                  key={session.id}
                  className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold text-sm line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {firstStudent?.name || 'Loading...'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                      session.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {session.subject}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formattedDate} at {formattedTime} • {session.duration} mins
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Session #{session.id?.slice(-4)}
                      </p>
                    </div>
                <div className="flex space-x-1">
                  <Button 
                    size="small" 
                    variant="outlined"
                    startIcon={<VideoCallIcon />}
                    style={{
                      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                      color: theme === 'dark' ? '#ffffff' : '#000000',
                      borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                      textTransform: 'none',
                      fontWeight: '500',
                      fontSize: '0.75rem',
                      padding: '4px 8px'
                    }}
                  >
                    Join
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    startIcon={<ChatIcon />}
                    style={{
                      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                      color: theme === 'dark' ? '#ffffff' : '#000000',
                      borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                      textTransform: 'none',
                      fontWeight: '500',
                      fontSize: '0.75rem',
                      padding: '4px 8px'
                    }}
                  >
                    Message
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => navigate(`/tutor/session/${session.id}`)}
                    style={{
                      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                      color: theme === 'dark' ? '#ffffff' : '#000000',
                      borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                      textTransform: 'none',
                      fontWeight: '500',
                      fontSize: '0.75rem',
                      padding: '4px 8px'
                    }}
                  >
                    Details
                  </Button>
                </div>
              </div>
            </div>
              )
            })
          )}
        </div>
      </div>

      {/* My Classes Section */}
      {classes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              My Classes
            </h2>
            <button 
              onClick={() => navigate('/tutor/lms')}
              className={`text-sm ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'}`}
            >
              Manage Classes
            </button>
          </div>

          <div className="space-y-3">
            {classes.slice(0, 3).map((classItem) => {
              const statusColor = classItem.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : classItem.status === 'full'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
              
              return (
                <div
                  key={classItem.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/tutor/class/${classItem.id}`)}
                >
                  <div
                    className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'} transition-colors`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {classItem.code}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusColor}`}>
                        {classItem.status}
                      </span>
                    </div>
                    <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {classItem.subject}
                    </p>
                    <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {classItem.day} • {classItem.startTime} - {classItem.endTime}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <PeopleIcon className={`w-3 h-3 mr-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {classItem.currentEnrollment || 0} / {classItem.maxStudents} students
                        </span>
                      </div>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/tutor/class/${classItem.id}`)
                        }}
                        style={{
                          backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                          color: theme === 'dark' ? '#ffffff' : '#000000',
                          borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                          textTransform: 'none',
                          fontWeight: '500',
                          fontSize: '0.75rem',
                          padding: '4px 8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f2937' : '#f3f4f6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Past Sessions
          </h2>
          <button 
            onClick={() => navigate('/tutor/lms')}
            className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}
          >
            See All
          </button>
        </div>

        <div className="space-y-3">
          {pastSessions.length === 0 ? (
            <div className={`text-center py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No past sessions
            </div>
          ) : (
            pastSessions.slice(0, 3).map((session) => {
              // Support both old studentId (string) and new studentIds (array)
              const studentIds = session.studentIds && Array.isArray(session.studentIds) 
                ? session.studentIds 
                : session.studentId 
                  ? [session.studentId] 
                  : []
              const firstStudent = studentIds.length > 0 ? students[studentIds[0]] : null
              const sessionDate = new Date(session.startTime)
              const formattedDate = sessionDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
              const formattedTime = sessionDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              
              return (
                <div 
                  key={session.id}
                  className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold text-sm line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {firstStudent?.name || 'Loading...'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                      session.status === 'completed' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {session.subject}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formattedDate} at {formattedTime} • {session.duration} mins
                    </p>
                  </div>

                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => navigate(`/tutor/sessions/${session.id}`)}
                    style={{
                      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                      color: theme === 'dark' ? '#ffffff' : '#000000',
                      borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                      textTransform: 'none',
                      fontWeight: '500',
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      width: '100%'
                    }}
                  >
                    View Details
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )

  const renderSessionsTab = () => (
    <div className="space-y-4">
      <div>
        <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          All Sessions & Classes
        </h2>
      </div>

      {/* Upcoming Sessions Section */}
      {upcomingSessions.length > 0 && (
        <div>
          <h3 className={`text-md font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Upcoming Sessions
          </h3>
      <div className="space-y-3">
            {upcomingSessions.map((session) => {
            // Support both old studentId (string) and new studentIds (array)
            const studentIds = session.studentIds && Array.isArray(session.studentIds) 
              ? session.studentIds 
              : session.studentId 
                ? [session.studentId] 
                : []
            const firstStudent = studentIds.length > 0 ? students[studentIds[0]] : null
              const studentCount = studentIds.length
            const sessionDate = new Date(session.startTime)
            const formattedDate = sessionDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
            const formattedTime = sessionDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            
            return (
              <div 
                key={session.id}
                  className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} cursor-pointer`}
                  onClick={() => navigate(`/tutor/session/${session.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-semibold text-sm line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {studentCount > 1 
                        ? `${firstStudent?.name || 'Loading...'} + ${studentCount - 1} more`
                        : firstStudent?.name || 'Loading...'}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                    session.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {session.status}
                  </span>
                </div>
                
                <div className="mb-2">
                  <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {session.subject}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formattedDate} at {formattedTime} • {session.duration} mins
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Session #{session.id?.slice(-4)}
                    </p>
                  </div>
              <div className="flex space-x-1">
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<VideoCallIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                  style={{
                    backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                    textTransform: 'none',
                    fontWeight: '500',
                    fontSize: '0.75rem',
                    padding: '4px 8px'
                  }}
                >
                  Join
                </Button>
                <Button 
                  size="small" 
                  variant="outlined"
                  startIcon={<ChatIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/tutor/messages')
                        }}
                  style={{
                    backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                    textTransform: 'none',
                    fontWeight: '500',
                    fontSize: '0.75rem',
                    padding: '4px 8px'
                  }}
                >
                  Message
                </Button>
              </div>
            </div>
          </div>
            )
            })}
          </div>
        </div>
      )}

      {/* Past Sessions Section */}
      {pastSessions.length > 0 && (
        <div>
          <h3 className={`text-md font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Past Sessions
          </h3>
          <div className="space-y-3">
            {pastSessions.map((session) => {
              // Support both old studentId (string) and new studentIds (array)
              const studentIds = session.studentIds && Array.isArray(session.studentIds) 
                ? session.studentIds 
                : session.studentId 
                  ? [session.studentId] 
                  : []
              const firstStudent = studentIds.length > 0 ? students[studentIds[0]] : null
              const studentCount = studentIds.length
              const sessionDate = new Date(session.startTime)
              const formattedDate = sessionDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
              const formattedTime = sessionDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              
              return (
                <div 
                  key={session.id}
                  className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} cursor-pointer`}
                  onClick={() => navigate(`/tutor/session/${session.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold text-sm line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {studentCount > 1 
                        ? `${firstStudent?.name || 'Loading...'} + ${studentCount - 1} more`
                        : firstStudent?.name || 'Loading...'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                      session.status === 'completed' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
      </div>
                  
                  <div className="mb-2">
                    <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {session.subject}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formattedDate} at {formattedTime} • {session.duration} mins
                    </p>
                  </div>

                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/tutor/session/${session.id}`)
                    }}
                    style={{
                      backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                      color: theme === 'dark' ? '#ffffff' : '#000000',
                      borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                      textTransform: 'none',
                      fontWeight: '500',
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      width: '100%'
                    }}
                  >
                    View Details
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Classes Section */}
      {classes.length > 0 && (
        <div>
          <h3 className={`text-md font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            My Classes
          </h3>
          <div className="space-y-3">
            {classes.map((classItem) => {
              const statusColor = classItem.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : classItem.status === 'full'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
              
              return (
                <div 
                  key={classItem.id}
                  className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} cursor-pointer`}
                  onClick={() => navigate(`/tutor/class/${classItem.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold text-sm line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {classItem.code}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusColor}`}>
                      {classItem.status}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {classItem.subject}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {classItem.day} • {classItem.startTime} - {classItem.endTime}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <PeopleIcon className={`w-3 h-3 mr-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {classItem.currentEnrollment || 0} / {classItem.maxStudents} students
                      </p>
                    </div>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/tutor/class/${classItem.id}`)
                      }}
                      style={{
                        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                        borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                        textTransform: 'none',
                        fontWeight: '500',
                        fontSize: '0.75rem',
                        padding: '4px 8px'
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {upcomingSessions.length === 0 && pastSessions.length === 0 && classes.length === 0 && (
        <div className="text-center py-12">
          <ScheduleIcon className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            No Sessions or Classes Yet
          </h3>
          <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            You don't have any sessions or classes yet.
          </p>
        </div>
      )}
    </div>
  )

  const renderStudentsTab = () => (
    <div className="space-y-4">
      <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Your Students
      </h2>

      {/* Performance Chart */}
      <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Teaching Performance
        </h3>
        <div className="flex items-end space-x-2 h-20">
          {[85, 92, 88, 95, 90].map((height, index) => (
            <div
              key={index}
              className="bg-green-500 rounded-t"
              style={{ height: `${height}%`, width: '20%' }}
            ></div>
          ))}
        </div>
      </div>

      {/* My Students List */}
      <div>
        <h3 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          My Students
        </h3>
        
        {Object.keys(students).length === 0 ? (
          <div className="text-center py-8">
            <PeopleIcon className={`w-12 h-12 mx-auto mb-2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
              No students yet
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              Students will appear here once they book sessions or enroll in your classes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.values(students).map((student: any, index: number) => (
              <div 
                key={student.id || index} 
                className={`flex items-center p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'} transition-colors cursor-pointer`}
                onClick={() => navigate('/tutor/sessions')}
              >
                <Avatar
                  src={student.avatar}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: getAvatarColor(student.name),
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}
                >
                  {getInitials(student.name)}
                </Avatar>
                <div className="flex-1 ml-3">
                  <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {student.name}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {student.email || 'Student'}
                  </p>
                </div>
                <div className="flex items-center">
                  <StarIcon className="w-3 h-3 text-yellow-400 mr-1" />
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {student.rating || 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderProfileTab = () => (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center mb-4">
          <Avatar
            src={avatarUrl}
            sx={{
              width: 64,
              height: 64,
              bgcolor: getAvatarColor(userName),
              fontSize: '1.5rem',
              fontWeight: 'bold',
              mr: 3
            }}
          >
            {getInitials(userName)}
          </Avatar>
          <div>
            <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {userName}
            </h4>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Tutor
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/tutor/profile')}
            className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} transition-colors`}
          >
            <PersonIcon className="w-4 h-4 text-green-600 mb-1" />
            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Profile
            </p>
          </button>
          <button 
            onClick={() => navigate('/tutor/notifications')}
            className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} transition-colors`}
          >
            <NotificationsIcon className="w-4 h-4 text-green-600 mb-1" />
            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Notifications
            </p>
          </button>
        </div>
      </div>

      {/* Social Links */}
      <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Social Links
        </h3>
        <div className="flex justify-center space-x-4">
          <button className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
            <FacebookIcon className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-colors">
            <TwitterIcon className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white hover:bg-pink-600 transition-colors">
            <InstagramIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Recent Notifications
        </h3>
        <div className="space-y-3">
          {notifications.slice(0, 3).map((notification, index) => (
            <div key={index} className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {notification.message}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {notification.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <button
          onClick={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            navigate('/common/login')
          }}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-medium transition-colors ${
            theme === 'dark' 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          <LogoutIcon className="mr-2 w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Header */}
      <div className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between p-4">
          <div 
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/tutor')}
          >
            <div className="w-8 h-8 flex items-center justify-center mr-3">
              <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-8 h-8" />
            </div>
            <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              HCMUT
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleThemeToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <LightModeIcon className="w-5 h-5 text-yellow-400" /> : <DarkModeIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleDrawerToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 pb-20">
        {currentTab === 'home' && renderHomeTab()}
        {currentTab === 'sessions' && renderSessionsTab()}
        {currentTab === 'students' && renderStudentsTab()}
        {currentTab === 'profile' && renderProfileTab()}
      </div>

      {/* Bottom Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex">
          {bottomNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex-1 flex flex-col items-center py-2 px-1 ${
                currentTab === item.id
                  ? `${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`
                  : `${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle}></div>
          <div className={`fixed left-0 top-0 h-full w-80 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="p-6">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8">
                <div 
                  className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/tutor')}
                >
                  <div className="w-8 h-8 flex items-center justify-center mr-3">
                    <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-8 h-8" />
                  </div>
                  <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    HCMUT
                  </span>
                </div>
                <button
                  onClick={handleDrawerToggle}
                  className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                      activeMenu === item.id
                        ? 'bg-teal-100 text-teal-700'
                        : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                    <ChevronRightIcon className="ml-auto w-4 h-4" />
                  </button>
                ))}
                
                {/* Mobile Settings */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    SETTINGS
                  </h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        navigate('/common/profile')
                        setMobileOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <PersonIcon className="mr-3 w-4 h-4" />
                      Profile
                    </button>
                    <button 
                      onClick={() => {
                        navigate('/common/notifications')
                        setMobileOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <NotificationsIcon className="mr-3 w-4 h-4" />
                      Notifications
                    </button>
                    <button 
                      onClick={() => setShowThemeOptions(!showThemeOptions)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <PaletteIcon className="mr-3 w-4 h-4" />
                      Theme
                    </button>
                    <button 
                      onClick={() => {
                        localStorage.removeItem('token')
                        localStorage.removeItem('user')
                        navigate('/common/login')
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 ${theme === 'dark' ? 'hover:bg-red-900/20' : ''}`}
                    >
                      <LogoutIcon className="mr-3 w-4 h-4" />
                      Logout
                    </button>
                  </div>

                  {/* Mobile Theme Options */}
                  {showThemeOptions && (
                    <div className={`mt-2 ml-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="space-y-2">
                        <button 
                          onClick={() => {
                            handleThemeToggle()
                            setMobileOpen(false)
                          }}
                          className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                            theme === 'light' 
                              ? 'bg-green-100 text-green-700' 
                              : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`
                          }`}
                        >
                          {theme === 'dark' ? <LightModeIcon className="mr-3 w-4 h-4" /> : <DarkModeIcon className="mr-3 w-4 h-4" />}
                          {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                        </button>
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} px-3 py-1`}>
                          Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TutorDashboardMobile
