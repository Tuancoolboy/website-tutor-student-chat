import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  School, 
  Schedule, 
  Assignment,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as BarChartIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarTodayIcon,
  Close as CloseIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Dashboard as DashboardIcon,
  PersonSearch,
  Class,
  SmartToy as SmartToyIcon,
  Chat as ChatIcon
} from '@mui/icons-material'
import { 
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Divider
} from '@mui/material'
import { progressAPI, usersAPI } from '../../lib/api'

interface SubjectProgress {
  subject: string
  averageScore: number
  totalRecords: number
  topics: string[]
  improvements: string[]
  challenges: string[]
  progressRecords: any[]
}

const ViewProgressMobile: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [progressRecords, setProgressRecords] = useState<any[]>([])
  const [tutorsMap, setTutorsMap] = useState<Record<string, any>>({})
  const [subjectsProgress, setSubjectsProgress] = useState<SubjectProgress[]>([])
  const [timeRange, setTimeRange] = useState('3months')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false)
  const [activeMenu, setActiveMenu] = useState('view-progress')

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
  }

  // Menu items for navigation
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
    { id: 'search-tutors', label: 'Find Tutors', icon: <PersonSearch />, path: '/student/search' },
    { id: 'book-session', label: 'Book Session', icon: <School />, path: '/student/book' },
    { id: 'view-progress', label: 'View Progress', icon: <BarChartIcon />, path: '/student/progress' },
    { id: 'session-detail', label: 'Session Details', icon: <Class />, path: '/student/session' },
    { id: 'chatbot-support', label: 'AI Support', icon: <SmartToyIcon />, path: '/student/chatbot' },
    { id: 'messages', label: 'Messages', icon: <ChatIcon />, path: '/student/messages' }
  ]

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      if (showTimeRangeDropdown && !target.closest('.time-range-dropdown-container')) {
        setShowTimeRangeDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTimeRangeDropdown])

  // Time range options
  const timeRangeOptions = [
    { value: '1month', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' }
  ]

  const getSelectedTimeRange = () => {
    return timeRangeOptions.find(option => option.value === timeRange) || timeRangeOptions[1]
  }

  // Load progress data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Get user from localStorage
        const userStr = localStorage.getItem('user')
        if (!userStr) {
          navigate('/login')
          return
        }
        const userData = JSON.parse(userStr)

        // Load progress records for this student
        const progressResponse = await progressAPI.list({ studentId: userData.id, limit: 1000 })
        
        if (progressResponse.data && Array.isArray(progressResponse.data)) {
          const records = progressResponse.data
          setProgressRecords(records)

          // Get unique tutor IDs
          const tutorIds = [...new Set(records.map((p: any) => p.tutorId))] as string[]
          
          // Load tutor data
          const tutorsData: Record<string, any> = {}
          await Promise.all(
            tutorIds.map(async (tutorId) => {
              try {
                const response = await usersAPI.get(tutorId)
                const tutorData = response.success ? response.data : response
                if (tutorData) {
                  tutorsData[tutorId] = tutorData
                }
              } catch (err) {
                console.error(`Error loading tutor ${tutorId}:`, err)
              }
            })
          )

          setTutorsMap(tutorsData)

          // Process data by subject
          const subjectMap = new Map<string, SubjectProgress>()

          records.forEach((progress: any) => {
            if (!subjectMap.has(progress.subject)) {
              subjectMap.set(progress.subject, {
                subject: progress.subject,
                averageScore: 0,
                totalRecords: 0,
                topics: [],
                improvements: [],
                challenges: [],
                progressRecords: []
              })
            }

            const subjectProgress = subjectMap.get(progress.subject)!
            subjectProgress.progressRecords.push(progress)
            
            // Add unique topics
            if (progress.topic && !subjectProgress.topics.includes(progress.topic)) {
              subjectProgress.topics.push(progress.topic)
            }

            // Collect improvements and challenges
            if (progress.improvements) {
              progress.improvements.forEach((imp: string) => {
                if (!subjectProgress.improvements.includes(imp)) {
                  subjectProgress.improvements.push(imp)
                }
              })
            }
            if (progress.challenges) {
              progress.challenges.forEach((chal: string) => {
                if (!subjectProgress.challenges.includes(chal)) {
                  subjectProgress.challenges.push(chal)
                }
              })
            }
          })

          // Calculate averages
          subjectMap.forEach((subjectProgress) => {
            const scores = subjectProgress.progressRecords.map((p: any) => p.score || 0)
            const averageScore = scores.length > 0 
              ? scores.reduce((a, b) => a + b, 0) / scores.length
              : 0
            subjectProgress.averageScore = Math.round(averageScore * 10) // Convert 0-10 to 0-100%
            subjectProgress.totalRecords = subjectProgress.progressRecords.length
          })

          setSubjectsProgress(Array.from(subjectMap.values()))
        }
      } catch (err: any) {
        console.error('Error loading progress:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [navigate])

  // Calculate overall stats
  const overallProgress = subjectsProgress.length > 0
    ? Math.round(subjectsProgress.reduce((sum, s) => sum + s.averageScore, 0) / subjectsProgress.length)
    : 0

  const totalSessions = subjectsProgress.reduce((sum, s) => sum + s.totalRecords, 0)

  const stats = [
    { title: 'Total Sessions', value: totalSessions.toString(), icon: <Schedule />, color: 'primary' },
    { title: 'Subjects Studied', value: subjectsProgress.length.toString(), icon: <School />, color: 'success' },
    { title: 'Overall Progress', value: `${overallProgress}%`, icon: <TrendingUp />, color: 'info' },
    { title: 'Progress Records', value: progressRecords.length.toString(), icon: <Assignment />, color: 'secondary' },
  ]

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Header */}
      <div className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/student')}
              className={`p-2 rounded-lg mr-3 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <ArrowBackIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Progress Report
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleThemeToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <LightModeIcon className="w-5 h-5 text-yellow-400" /> : <DarkModeIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleDrawerToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="p-4 space-y-4">
        {/* Header Section */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px'
          }}
        >
        {/* Time Range Selector */}
          <div className="flex items-center justify-between mb-4 relative time-range-dropdown-container">
            <Typography variant="body2" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>
              Time Range
            </Typography>
              <button
                onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
              className={`px-3 py-1.5 border rounded-lg text-sm flex items-center justify-between transition-all ${
                theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
                  <span className="font-medium">{getSelectedTimeRange().label}</span>
              <div className={`transform transition-transform ml-2 ${showTimeRangeDropdown ? 'rotate-180' : ''}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

            {/* Dropdown Options */}
              {showTimeRangeDropdown && (
              <div className="absolute top-full right-0 z-[9999] mt-1 min-w-[180px]">
                <div className={`rounded-lg shadow-xl border overflow-hidden ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-200'
                  }`}>
                  {timeRangeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTimeRange(option.value)
                          setShowTimeRangeDropdown(false)
                        }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          option.value === timeRange
                            ? theme === 'dark'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700'
                            : theme === 'dark'
                              ? 'text-gray-300 hover:bg-gray-600'
                              : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      >
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
              <Box 
              key={index} 
                sx={{ 
                  p: 2,
                  backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >
                <Box sx={{ color: '#3b82f6', fontSize: '1.5rem', mb: 0.5 }}>
                  {stat.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827', mb: 0.25 }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.7rem' }}>
                  {stat.title}
                </Typography>
              </Box>
          ))}
        </div>
        </Paper>

        {/* Overall Performance */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>
              Overall Performance
            </Typography>
            <Chip 
              label={`${overallProgress}%`} 
              sx={{ 
                backgroundColor: '#3b82f6', 
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                height: '28px'
              }} 
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={overallProgress} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#3b82f6',
                borderRadius: 5
              }
            }} 
          />
          <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', mt: 1, display: 'block' }}>
            Average across all subjects
          </Typography>
        </Paper>

        {/* Subject Performance */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px'
          }}
        >
          <Typography variant="subtitle1" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827', mb: 2 }}>
            Subject Performance
          </Typography>
          {subjectsProgress.length === 0 ? (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 4,
                backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                borderRadius: '8px'
              }}
            >
              <School sx={{ fontSize: 40, color: theme === 'dark' ? '#6b7280' : '#9ca3af', mb: 1 }} />
              <Typography variant="body2" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                No progress records yet
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {subjectsProgress.map((subject, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    p: 2,
                    backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="body2" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>
                      {subject.subject}
                    </Typography>
                    <Chip 
                      label={`${subject.averageScore}%`} 
                      size="small"
                      sx={{ 
                        backgroundColor: subject.averageScore >= 80 ? '#10b981' : subject.averageScore >= 60 ? '#f59e0b' : '#ef4444',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }} 
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={subject.averageScore} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      mb: 1.5,
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#e5e7eb',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: subject.averageScore >= 80 ? '#10b981' : subject.averageScore >= 60 ? '#f59e0b' : '#ef4444',
                        borderRadius: 3
                      }
                    }} 
                  />
                  <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Assignment sx={{ fontSize: 14, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                      <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.7rem' }}>
                        {subject.totalRecords} sessions
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <School sx={{ fontSize: 14, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                      <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.7rem' }}>
                        {subject.topics.length} topics
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* Recent Sessions */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px'
          }}
        >
          <Typography variant="subtitle1" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827', mb: 2 }}>
              Recent Sessions
          </Typography>
          {progressRecords.length === 0 ? (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 4,
                backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                borderRadius: '8px'
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 40, color: theme === 'dark' ? '#6b7280' : '#9ca3af', mb: 1 }} />
              <Typography variant="body2" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                No sessions completed yet
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {progressRecords.slice(0, 4).map((record, index) => {
                const tutor = tutorsMap[record.tutorId]
                const tutorName = tutor?.name || 'Unknown Tutor'
                const scorePercentage = Math.round(record.score * 10)
                const recordDate = new Date(record.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })
                
                return (
                  <Box 
                    key={index}
                    sx={{ 
                      p: 2,
                      backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                      borderRadius: '8px',
                      border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827', mb: 0.5 }}>
                          {record.subject} - {record.topic}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', display: 'block', fontSize: '0.7rem' }}>
                          {tutorName} • {recordDate}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`${scorePercentage}%`} 
              size="small" 
                        sx={{ 
                          backgroundColor: scorePercentage >= 80 ? '#10b981' : scorePercentage >= 60 ? '#f59e0b' : '#ef4444',
                          color: '#ffffff',
                          fontWeight: 'bold',
                          fontSize: '0.7rem',
                          height: '22px'
                        }} 
                      />
                    </Box>
                    {record.notes && (
                      <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', display: 'block', fontStyle: 'italic', fontSize: '0.7rem' }}>
                        "{record.notes}"
                      </Typography>
                    )}
                  </Box>
                )
              })}
            </Box>
          )}
        </Paper>

        {/* Improvements */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px'
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>
              Improvements
            </Typography>
          </Box>
          {progressRecords.length === 0 || progressRecords.filter(r => r.improvements && r.improvements.length > 0).length === 0 ? (
            <Typography variant="body2" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', textAlign: 'center', py: 3 }}>
              No improvements recorded yet
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {progressRecords
                .filter(r => r.improvements && r.improvements.length > 0)
                .slice(0, 4)
                .flatMap(r => r.improvements.map((imp: string) => ({ text: imp, subject: r.subject })))
                .slice(0, 4)
                .map((item: any, index: number) => (
                  <Box 
                    key={index}
                    sx={{ 
                      p: 1.5,
                      backgroundColor: theme === 'dark' ? '#374151' : '#f0fdf4',
                      borderRadius: '6px',
                      border: `1px solid ${theme === 'dark' ? '#4b5563' : '#bbf7d0'}`
                    }}
                  >
                    <Typography variant="caption" fontWeight="600" sx={{ color: theme === 'dark' ? '#10b981' : '#059669', display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                      {item.subject}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme === 'dark' ? '#e5e7eb' : '#111827', fontSize: '0.8rem' }}>
                      {item.text}
                    </Typography>
                  </Box>
                ))}
            </Box>
          )}
        </Paper>

        {/* Challenges */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px'
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <WarningIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>
              Areas to Focus
            </Typography>
          </Box>
          {progressRecords.length === 0 || progressRecords.filter(r => r.challenges && r.challenges.length > 0).length === 0 ? (
            <Typography variant="body2" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', textAlign: 'center', py: 3 }}>
              No challenges recorded yet
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {progressRecords
                .filter(r => r.challenges && r.challenges.length > 0)
                .slice(0, 4)
                .flatMap(r => r.challenges.map((chal: string) => ({ text: chal, subject: r.subject })))
                .slice(0, 4)
                .map((item: any, index: number) => (
                  <Box 
                key={index} 
                    sx={{ 
                      p: 1.5,
                      backgroundColor: theme === 'dark' ? '#374151' : '#fffbeb',
                      borderRadius: '6px',
                      border: `1px solid ${theme === 'dark' ? '#4b5563' : '#fde68a'}`
                    }}
                  >
                    <Typography variant="caption" fontWeight="600" sx={{ color: theme === 'dark' ? '#f59e0b' : '#d97706', display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                      {item.subject}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme === 'dark' ? '#e5e7eb' : '#111827', fontSize: '0.8rem' }}>
                      {item.text}
                    </Typography>
                  </Box>
                ))}
            </Box>
          )}
        </Paper>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle}></div>
          <div className={`fixed left-0 top-0 h-full w-80 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="p-6 h-full flex flex-col overflow-hidden">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <div 
                  className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/student')}
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

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Quick Actions */}
                <div className="mb-8">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    QUICK ACTIONS
                  </h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        navigate('/student')
                        setMobileOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                    >
                      <ArrowBackIcon className="mr-3 w-4 h-4" />
                      Back to Dashboard
                    </button>
                  </div>
                </div>

                {/* Mobile Progress Overview */}
                <div className="mb-8">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    PROGRESS OVERVIEW
                  </h3>
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="text-center mb-3">
                      <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {overallProgress}%
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Overall Progress
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${overallProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className="space-y-2 mb-8">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item)}
                      className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewProgressMobile
