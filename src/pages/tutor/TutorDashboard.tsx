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
  Search as SearchIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Autorenew as AutorenewIcon,
  Star as StarIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
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
  CalendarMonth,
  Logout as LogoutIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Forum as ForumIcon
} from '@mui/icons-material'

const TutorDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showThemeOptions, setShowThemeOptions] = useState(false)
  
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
      // Using OpenWeatherMap API (free tier)
      const API_KEY = 'd055198c2320f9b77049b5b9a1db7205' // Bạn cần đăng ký tại openweathermap.org
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Ho%20Chi%20Minh%20City&appid=${API_KEY}&units=metric`
      )
      const data = await response.json()
      setWeather(data)
    } catch (error) {
      console.error('Error fetching weather:', error)
      // Fallback data nếu API không hoạt động
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
    const isNight = hour >= 18 || hour <= 6 // 6 PM to 6 AM is considered night
    
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        if (isNight) {
          return <WbSunnyIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-400'}`} />
        } else {
          return <WbSunnyIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />
        }
      case 'clouds':
        return <CloudIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
      case 'rain':
      case 'drizzle':
        return <ThunderstormIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
      case 'snow':
        return <AcUnitIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-500'}`} />
      default:
        if (isNight) {
          return <WbSunnyIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-400'}`} />
        } else {
          return <WbSunnyIcon className={`w-6 h-6 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />
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
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Fetch weather on component mount
    fetchWeather()

    // Refresh weather every 10 minutes
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

  // User name from backend
  const userName = user?.name || 'Tutor'
  
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

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Sticky */}
        <div className={`w-full lg:w-60 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} lg:block`}>
          <div className="p-6">
            {/* Logo */}
            <div 
              className="flex items-center mb-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/tutor')}
            >
              <div className="w-10 h-10 flex items-center justify-center mr-3">
                <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-10 h-10" />
              </div>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                HCMUT
              </span>
            </div>

            {/* Navigation Menu */}
            <div className="mb-8">
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeMenu === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                SETTINGS
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/common/profile')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <PersonIcon className="mr-3 w-4 h-4" />
                  Profile
                </button>
                <button 
                  onClick={() => navigate('/common/notifications')}
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
                {showThemeOptions && (
                  <div className={`mt-2 ml-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="space-y-2">
                      <button 
                        onClick={handleThemeToggle}
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                          theme === 'light' 
                            ? 'bg-blue-100 text-blue-700' 
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

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6">
          {/* Mobile Menu Button & Theme Toggle */}
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <button
              onClick={handleDrawerToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            
            {/* Mobile Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} transition-colors`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <LightModeIcon className="w-6 h-6 text-yellow-400" /> : <DarkModeIcon className="w-6 h-6" />}
            </button>
          </div>

          {/* Search Bar & Desktop Theme Toggle */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search students, sessions, or topics..."
                  className={`w-full px-4 py-3 pl-10 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
                  Search
                </Button>
                
                {/* Desktop Theme Toggle */}
                <button
                  onClick={handleThemeToggle}
                  className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} transition-colors`}
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                  {theme === 'dark' ? <LightModeIcon className="w-5 h-5 text-yellow-400" /> : <DarkModeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Time & Weather Widget */}
          <div className="mb-8">
            <div className={`rounded-xl p-6 shadow-lg relative overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} ${weather ? getWeatherBackground(weather.weather[0].main) : 'weather-sunny'}`}>
              {/* Weather Background Effects */}
              {weather && (
                <>
                  {/* Sunny Effect */}
                  {weather.weather[0].main.toLowerCase() === 'clear' && (
                    <div className="absolute inset-0 opacity-20">
                      <div className="sun-animation absolute top-4 right-4 w-16 h-16 bg-yellow-400 rounded-full"></div>
                      <div className="sun-rays absolute top-0 right-0 w-20 h-20">
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
                  
                  {/* Cloudy Effect */}
                  {weather.weather[0].main.toLowerCase() === 'clouds' && (
                    <div className="absolute inset-0 opacity-30">
                      <div className="cloud cloud-1"></div>
                      <div className="cloud cloud-2"></div>
                      <div className="cloud cloud-3"></div>
                  </div>
                  )}
                  
                  {/* Rainy Effect */}
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
                  
                  {/* Snowy Effect */}
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
              
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between relative z-10">
                {/* Time Section */}
                <div className="flex-1 mb-4 lg:mb-0">
                  <div className="flex items-center mb-2">
                    <AccessTimeIcon className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Current Time</span>
                    </div>
                  <div className={`text-3xl lg:text-4xl font-bold mb-1 font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {formatTime(currentTime)}
                  </div>
                  <div className={`text-lg mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {formatDate(currentTime)}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {getGreeting()}, {userName}
                </div>
              </div>

                {/* Weather Section */}
                <div className="flex-1 lg:ml-8">
                  <div className="flex items-center mb-2">
                    <LocationOnIcon className={`w-5 h-5 mr-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Ho Chi Minh City</span>
            </div>

                  {weatherLoading ? (
                    <div className="flex items-center">
                      <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${theme === 'dark' ? 'border-blue-400' : 'border-blue-600'}`}></div>
                      <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading weather...</span>
                    </div>
                  ) : weather ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                        {getWeatherIcon(weather.weather[0].main)}
                        <div className="ml-3">
                          <div className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {Math.round(weather.main.temp)}°C
                </div>
                          <div className={`text-sm capitalize ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {weather.weather[0].description}
                  </div>
                  </div>
                  </div>
                      <div className={`text-right text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div>Humidity: {weather.main.humidity}%</div>
                        <div>Feels like: {Math.round(weather.main.feels_like)}°C</div>
                </div>
              </div>
                  ) : (
                    <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Weather unavailable</div>
                  )}
            </div>
              </div>
            </div>
          </div>
      
      {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
            <Card
                key={index} 
                className={`p-6 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stat.title}
                    </p>
                  </div>
                  <div className="text-3xl text-green-600">{stat.icon}</div>
                </div>
            </Card>
            ))}
          </div>

          {/* Upcoming Sessions Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Upcoming Sessions
              </h2>
              <div className="flex space-x-2">
                <button className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  <ArrowBackIcon className="w-4 h-4" />
                </button>
                <button className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  <ArrowForwardIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingSessions.length === 0 ? (
              <div className={`col-span-3 text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No upcoming sessions
              </div>
            ) : (
              upcomingSessions.map((session) => {
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
          <Card
                  key={session.id} 
                  className={`overflow-hidden border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  style={{
                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    boxShadow: 'none !important'
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
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
                    <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {session.subject}
                    </p>
                    <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formattedDate} at {formattedTime} • {session.duration} mins
                    </p>
                    <div className="flex space-x-2">
              <Button 
                size="small" 
                        variant="outlined" 
                        startIcon={<VideoCallIcon />}
                        style={{
                          backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                          color: theme === 'dark' ? '#ffffff' : '#000000',
                          borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                          textTransform: 'none',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f2937' : '#f3f4f6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'
                        }}
                      >
                    Join
                  </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<ChatIcon />}
                          onClick={() => navigate('/tutor/messages')}
                        style={{
                          backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                          color: theme === 'dark' ? '#ffffff' : '#000000',
                          borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                          textTransform: 'none',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f2937' : '#f3f4f6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'
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
                          fontWeight: '500'
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
                </Card>
                )
              })
            )}
            </div>
          </div>

          {/* My Classes Section */}
          {classes.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  My Classes
                </h2>
                <button 
                  onClick={() => navigate('/tutor/lms')}
                  className={`text-sm ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'}`}
                >
                  Manage Classes
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.slice(0, 6).map((classItem) => {
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
                      <Card
                        className={`overflow-hidden border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-shadow`}
                        style={{
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          boxShadow: 'none !important'
                        }}
                      >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {classItem.code}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusColor}`}>
                            {classItem.status}
                          </span>
                        </div>
                        <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {classItem.subject}
                        </p>
                        <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {classItem.day} • {classItem.startTime} - {classItem.endTime}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <PeopleIcon className={`w-4 h-4 mr-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
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
                    </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Past Sessions Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Past Sessions
              </h2>
              <button 
                onClick={() => navigate('/tutor/lms')}
                className={`text-sm ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'}`}
              >
                See All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastSessions.length === 0 ? (
              <div className={`col-span-3 text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No past sessions
              </div>
            ) : (
              pastSessions.map((session) => {
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
                  <Card
                    key={session.id} 
                    className={`overflow-hidden border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                    style={{
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                      boxShadow: 'none !important'
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
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
                      <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {session.subject}
                      </p>
                      <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formattedDate} at {formattedTime} • {session.duration} mins
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          size="small" 
                          variant="outlined" 
                          onClick={() => navigate(`/tutor/sessions/${session.id}`)}
                          style={{
                            backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                            color: theme === 'dark' ? '#ffffff' : '#000000',
                            borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                            textTransform: 'none',
                            fontWeight: '500'
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
                  </Card>
                )
              })
            )}
            </div>
          </div>
        </div>

        {/* Profile Panel - Sticky */}
        <div className={`w-full lg:w-80 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} mt-6 lg:mt-0`}>
          <div className="p-6">
            {/* Profile Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Your Profile
              </h3>
              <button className="p-1">
                <MoreVertIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* User Profile */}
            <div className="text-center mb-8">
              <Avatar
                src={user?.avatar}
                sx={{
                  width: 96,
                  height: 96,
                  bgcolor: getAvatarColor(userName),
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  mx: 'auto',
                  mb: 2
                }}
              >
                {getInitials(userName)}
              </Avatar>
              <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {getGreeting()}, {userName}
              </h4>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Continue inspiring students and sharing your knowledge
              </p>
            </div>

            {/* Social Links */}
            <div className="flex justify-center space-x-4 mb-8">
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

            {/* Progress Chart */}
            <div className="mb-8">
              <h4 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Teaching Performance
              </h4>
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

        {/* Notifications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Recent Notifications
                </h4>
                <button className="text-sm text-blue-600">
                  <MoreVertIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {notifications.slice(0, 4).map((notification, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
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

                <Button 
                className="w-full mt-4" 
                  variant="outlined" 
                style={{
                  backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                  borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                  textTransform: 'none',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f2937' : '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'
                }}
              >
                View All Notifications
                </Button>
            </div>

            {/* Logout Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                className="w-full"
                onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
                  navigate('/common/login')
                }}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: '600',
                  padding: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                }}
              >
                <LogoutIcon className="mr-2 w-5 h-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle}></div>
          <div className={`fixed left-0 top-0 h-full w-80 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="p-6">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
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
                  <MenuIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleMenuClick(item)
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeMenu === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Mobile Settings */}
              <div className="mt-8">
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
                              ? 'bg-blue-100 text-blue-700' 
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

export default TutorDashboard
