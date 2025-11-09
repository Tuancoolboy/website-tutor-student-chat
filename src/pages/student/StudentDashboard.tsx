import React, { useState, useEffect, useRef } from 'react'
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
  School as SchoolIcon,
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
  SmartToy as SmartToyIcon,
  Palette as PaletteIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  WbSunny as WbSunnyIcon,
  Cloud as CloudIcon,
  Thunderstorm as ThunderstormIcon,
  AcUnit as AcUnitIcon,
  PersonSearch,
  Class,
  Chat as ChatIcon,
  CalendarMonth,
  Logout as LogoutIcon,
  MenuBook as MenuBookIcon,
  Forum as ForumIcon
} from '@mui/icons-material'

const StudentDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showThemeOptions, setShowThemeOptions] = useState(false)
  
  // User data states
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [classes, setClasses] = useState<{ [key: string]: any }>({})
  const [tutors, setTutors] = useState<{ [key: string]: any }>({})
  
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
        
        // Get user sessions and enrollments
        const [sessionsResult, enrollmentsResult] = await Promise.all([
          api.sessions.list({
            studentId: userData.id,
            limit: 100
          }),
          api.enrollments.list({
            studentId: userData.id,
            status: 'active'
          })
        ])
        
        console.log('Sessions API Response:', sessionsResult)
        console.log('Enrollments API Response:', enrollmentsResult)
        
        if (sessionsResult.data && Array.isArray(sessionsResult.data)) {
          const sessionsData = sessionsResult.data
          setSessions(sessionsData)
          console.log('Sessions loaded:', sessionsData.length)
          
          // Load tutor data for each session
          const uniqueTutorIds = [...new Set(sessionsData.map((s: any) => s.tutorId))] as string[]
          const tutorPromises = uniqueTutorIds.map(async (tutorId: string) => {
            try {
              const tutorResponse = await api.users.get(tutorId)
              if (tutorResponse.success && tutorResponse.data) {
                return { id: tutorId, data: tutorResponse.data }
              }
            } catch (err) {
              console.error(`Failed to load tutor ${tutorId}:`, err)
            }
            return null
          })
          
          const tutorResults = await Promise.all(tutorPromises)
          let tutorsMap: { [key: string]: any } = {}
          tutorResults.forEach(result => {
            if (result) {
              tutorsMap[result.id] = result.data
            }
          })
          
          // Load enrollments and classes
          if (enrollmentsResult.success && enrollmentsResult.data && Array.isArray(enrollmentsResult.data)) {
            const enrollmentsData = enrollmentsResult.data
            setEnrollments(enrollmentsData)
            console.log('Enrollments loaded:', enrollmentsData.length)

            // Load class details for each enrollment
            const uniqueClassIds = [...new Set(enrollmentsData.map((e: any) => e.classId))] as string[]
            const classPromises = uniqueClassIds.map(async (classId: string) => {
              try {
                const classResponse = await api.classes.get(classId)
                if (classResponse.success && classResponse.data) {
                  return { id: classId, data: classResponse.data }
                }
              } catch (err) {
                console.error(`Failed to load class ${classId}:`, err)
              }
              return null
            })

            const classResults = await Promise.all(classPromises)
            const classesMap: { [key: string]: any } = {}
            const classTutorIds: string[] = []
            
            classResults.forEach(result => {
              if (result) {
                classesMap[result.id] = result.data
                if (result.data.tutorId && !tutorsMap[result.data.tutorId]) {
                  classTutorIds.push(result.data.tutorId)
                }
              }
            })
            setClasses(classesMap)

            // Load tutors for classes if needed
            if (classTutorIds.length > 0) {
              const classTutorPromises = classTutorIds.map(async (tutorId: string) => {
                try {
                  const tutorResponse = await api.users.get(tutorId)
                  if (tutorResponse.success && tutorResponse.data) {
                    return { id: tutorId, data: tutorResponse.data }
                  }
                } catch (err) {
                  console.error(`Failed to load tutor ${tutorId}:`, err)
                }
                return null
              })

              const classTutorResults = await Promise.all(classTutorPromises)
              classTutorResults.forEach(result => {
                if (result) {
                  tutorsMap[result.id] = result.data
                }
              })
            }
          }
          
          setTutors(tutorsMap)
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

  // Calculate stats from real data
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' || s.status === 'confirmed').length
  const totalClasses = enrollments.length
  
  const stats = [
    { title: 'Enrolled Classes', value: totalClasses.toString(), icon: <SchoolIcon /> },
    { title: 'Total Sessions', value: totalSessions.toString(), icon: <CheckCircleIcon /> },
    { title: 'Upcoming', value: upcomingSessions.toString(), icon: <AutorenewIcon /> }
  ]

  // Map sessions to course format for UI (only show upcoming/confirmed sessions)
  // Filter out class sessions (sessions with classId) - those belong to My Classes section
  const sessionsCourses = sessions
    .filter(session => 
      (session.status === 'confirmed' || session.status === 'pending') &&
      !session.classId // Only show individual sessions, not class sessions
    )
    .map(session => {
      const tutor = tutors[session.tutorId]
      return {
        id: session.id,
        type: 'session' as const,
        title: session.subject,
        instructor: tutor?.name || 'Loading...',
        subject: session.topic || session.subject,
        duration: `${session.duration} mins`,
        nextSession: session.startTime,
        rating: tutor?.rating || 4.5,
        status: session.status === 'confirmed' ? 'active' : 'pending',
        sessionData: session // Keep original session data for reference
      }
    })
    .sort((a, b) => new Date(a.nextSession).getTime() - new Date(b.nextSession).getTime())
    .slice(0, 6) // Limit to 6 items for display

  // Map classes to course format
  const classesCourses = enrollments
    .map(enrollment => {
      const classItem = classes[enrollment.classId]
      const tutor = classItem ? tutors[classItem.tutorId] : null
      return {
        id: enrollment.classId,
        type: 'class' as const,
        title: classItem?.subject || 'Loading...',
        instructor: tutor?.name || 'Loading...',
        subject: `${classItem?.code || 'N/A'} - ${classItem?.day || ''}`,
        duration: `${classItem?.duration || 0} mins`,
        nextSession: classItem?.semesterStart || new Date().toISOString(),
        rating: tutor?.rating || 4.5,
        status: classItem?.status === 'active' ? 'active' : 'inactive',
        classData: classItem // Keep original class data for reference
      }
    })
    .sort((a, b) => new Date(a.nextSession).getTime() - new Date(b.nextSession).getTime())
    .slice(0, 6) // Limit to 6 items for display

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

  // Helper function to generate course thumbnail
  const generateCourseThumbnail = (course: any) => {
    // Subject-based background images with beautiful patterns
    const subjectBackgrounds: { [key: string]: string } = {
      'Toán học': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop',
      'Vật lý': 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&h=400&fit=crop',
      'Hóa học': 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800&h=400&fit=crop',
      'Sinh học': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&h=400&fit=crop',
      'Văn học': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=400&fit=crop',
      'Tiếng Anh': 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=400&fit=crop',
      'Lịch sử': 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=800&h=400&fit=crop',
      'Địa lý': 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&h=400&fit=crop',
      'Tin học': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop',
      'Lập trình': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
      'Kinh tế': 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=400&fit=crop',
      'Triết học': 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=400&fit=crop',
      'Nghệ thuật': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=400&fit=crop',
      'Âm nhạc': 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop',
      'Thể dục': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop',
      'Cấu trúc dữ liệu': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=400&fit=crop',
      'Đại số tuyến tính': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=400&fit=crop',
      'Giải tích': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop'
    }
    
    // Default backgrounds if subject not found
    const defaultBackgrounds = [
      'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&h=400&fit=crop'
    ]
    
    // Get background image
    let backgroundImage = subjectBackgrounds[course.title] || subjectBackgrounds[course.subject]
    if (!backgroundImage) {
      const index = (course.id?.charCodeAt(0) || 0) % defaultBackgrounds.length
      backgroundImage = defaultBackgrounds[index]
    }
    
    return (
      <div 
        className="w-full h-48 flex items-center justify-center relative overflow-hidden rounded-t-lg bg-cover bg-center"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-16 h-16 bg-white rounded-full blur-xl"></div>
          <div className="absolute bottom-4 right-4 w-20 h-20 bg-white rounded-full blur-2xl"></div>
        </div>
        
        {/* Course title overlay */}
        <div className="relative z-10 text-center px-4">
          <div className="text-white text-lg font-bold mb-2 line-clamp-2 drop-shadow-lg">
            {course.title}
          </div>
          <div className="text-white text-sm opacity-90 drop-shadow-md">
            {course.subject}
          </div>
        </div>
      </div>
    )
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
    { id: 'search-tutors', label: 'Find Tutors', icon: <PersonSearch />, path: '/student/search' },
    { id: 'book-session', label: 'Book Session', icon: <SchoolIcon />, path: '/student/book' },
    { id: 'calendar', label: 'Calendar', icon: <CalendarMonth />, path: '/student/calendar' },
    { id: 'view-progress', label: 'View Progress', icon: <BarChartIcon />, path: '/student/progress' },
    { id: 'evaluate-session', label: 'Evaluate Session', icon: <StarIcon />, path: '/student/evaluate' },
    { id: 'session-detail', label: 'Session Details', icon: <Class />, path: '/student/session' },
    { id: 'chatbot-support', label: 'AI Support', icon: <SmartToyIcon />, path: '/student/chatbot' },
    { id: 'messages', label: 'Messages', icon: <ChatIcon />, path: '/student/messages' },
    { id: 'library', label: 'Digital Library', icon: <MenuBookIcon />, path: '/common/library' },
    { id: 'forum', label: 'Community Forum', icon: <ForumIcon />, path: '/common/forum' }
  ]

  // User name and avatar are now from backend
  const userName = user?.name || 'Student'
  const avatarUrl = user?.avatar
 
  // Avatar change handlers (commented out - to be implemented with backend API)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const onPickAvatar = () => {
    // TODO: Implement avatar upload to backend
    console.log('Avatar upload to be implemented')
  }
  const onFileChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement avatar upload to backend
    console.log('Avatar upload to be implemented')
  }
  
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

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Sticky */}
        <div className={`w-full lg:w-60 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} lg:block`}>
          <div className="p-6">
            {/* Logo */}
            <div 
              className="flex items-center mb-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/student')}
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
              </div>

              {/* Theme Options */}
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
                  placeholder="Search courses, instructors, or topics..."
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
              <div className="flex items-center gap-2">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <div className="text-3xl text-blue-600">{stat.icon}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* My Sessions Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                My Upcoming Sessions
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

            {sessionsCourses.length === 0 ? (
              <div className="text-center py-12">
                <SchoolIcon className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  No Upcoming Sessions
                </h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  You don't have any confirmed or pending sessions yet.
                </p>
                <Button 
                  onClick={() => navigate('/student/book')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  Book a Session
                </Button>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {sessionsCourses.map((course) => (
                <div 
                  key={course.id}
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg h-full"
                  onClick={() => navigate(`/student/session/${course.id}`)}
                >
                  <Card 
                    className={`overflow-hidden h-full flex flex-col rounded-lg border ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-750 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
                    style={{
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                      boxShadow: 'none !important'
                    }}
                  >
                  <div className="relative">
                    {/* Generated Thumbnail */}
                    {generateCourseThumbnail(course)}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (course as any).type === 'session' && (course as any).sessionData?.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(course as any).type === 'session' && (course as any).sessionData?.status === 'confirmed' ? 'Confirmed' : (course as any).type === 'class' ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-semibold text-lg line-clamp-2 min-h-[3.5rem] ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {course.title}
                      </h3>
                      <div className="flex items-center flex-shrink-0 ml-2">
                        <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {course.rating}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {course.instructor}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {course.subject}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Duration
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {course.duration}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Type
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {(course as any).type === 'class' 
                            ? ((course as any).classData?.isOnline ? 'Online' : 'In-Person')
                            : ((course as any).sessionData?.isOnline ? 'Online' : 'In-Person')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          (course as any).type === 'class' || ((course as any).type === 'session' && (course as any).sessionData?.status === 'confirmed') ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(course.nextSession).toLocaleDateString('vi-VN', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Button 
                        size="small" 
                        variant="contained"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                  </Card>
                </div>
              ))}
            </div>
            )}
          </div>

          {/* My Classes Section */}
          {classesCourses.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  My Classes
                </h2>
                <Button 
                  onClick={() => navigate('/student/session?view=classes')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
                >
                  View All
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {classesCourses.slice(0, 6).map((course) => (
                  <div 
                    key={course.id}
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg h-full"
                    onClick={() => navigate(`/student/class/${course.id}`)}
                  >
                    <Card 
                      className={`overflow-hidden h-full flex flex-col rounded-lg border ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-750 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
                      style={{
                        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        boxShadow: 'none !important'
                      }}
                    >
                      <div className="relative">
                        {/* Generated Thumbnail */}
                        {generateCourseThumbnail(course)}
                        
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            course.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {course.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`font-semibold text-lg line-clamp-2 min-h-[3.5rem] ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {course.title}
                          </h3>
                          <div className="flex items-center flex-shrink-0 ml-2">
                            <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {course.rating}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {course.instructor}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {course.subject}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Duration
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {course.duration}
                            </p>
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Type
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {(course as any).classData?.isOnline ? 'Online' : 'In-Person'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              course.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                            }`}></div>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(course.nextSession).toLocaleDateString('vi-VN', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Button 
                            size="small" 
                            variant="contained"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                src = {avatarUrl}
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
                {userName}
              </h4>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
              <Button
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                onClick={onPickAvatar}
              >
                Change Avatar
              </Button>
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
                Your Progress
              </h4>
              <div className="flex items-end space-x-2 h-20">
                {[40, 70, 90, 100, 85].map((height, index) => (
                  <div
                    key={index}
                    className="bg-blue-500 rounded-t"
                    style={{ height: `${height}%`, width: '20%' }}
                  ></div>
                ))}
              </div>
            </div>

            {/* My Tutor List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  My Tutor
                </h4>
                <button 
                  onClick={() => navigate('/student/search')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  <MoreVertIcon className="w-4 h-4" />
                </button>
              </div>
              
              {Object.keys(tutors).length === 0 ? (
                <div className="text-center py-8">
                  <PersonSearch className={`w-12 h-12 mx-auto mb-2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    No tutors yet
                  </p>
                  <Button 
                    onClick={() => navigate('/student/search')}
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 text-xs"
                  >
                    Find Tutors
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {Object.values(tutors).slice(0, 4).map((tutor: any, index: number) => (
                      <div 
                        key={index} 
                        className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                        onClick={() => navigate('/student/search')}
                      >
                        <Avatar
                          src={tutor.avatar}
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: getAvatarColor(tutor.name),
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {getInitials(tutor.name)}
                        </Avatar>
                        <div className="flex-1 ml-3">
                          <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {tutor.name}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {tutor.subjects?.[0] || 'Tutor'}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <StarIcon className="w-3 h-3 text-yellow-400 mr-1" />
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {tutor.rating || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => navigate('/student/search')}
                    className="w-full mt-4"
                    variant="outlined"
                    style={{
                      backgroundColor: '#000000',
                      color: '#ffffff',
                      borderColor: '#000000',
                      textTransform: 'none',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1f2937'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#000000'
                    }}
                  >
                    View All Tutors
                  </Button>
                </>
              )}
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

export default StudentDashboard
