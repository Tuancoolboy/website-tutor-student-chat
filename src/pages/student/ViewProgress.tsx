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
  CalendarToday as CalendarTodayIcon
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

const ViewProgress: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [progressRecords, setProgressRecords] = useState<any[]>([])
  const [tutorsMap, setTutorsMap] = useState<Record<string, any>>({})
  const [subjectsProgress, setSubjectsProgress] = useState<SubjectProgress[]>([])
  const [timeRange, setTimeRange] = useState('3months')
  const [mobileOpen, setMobileOpen] = useState(false)

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
        
        console.log('Progress response:', progressResponse) // Debug

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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

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

            {/* Progress Overview */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                PROGRESS OVERVIEW
              </h3>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-center mb-3">
                  <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
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

            {/* Quick Actions */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                QUICK ACTIONS
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/student')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Redesigned Report Layout */}
        <div className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto">
          {/* Mobile Menu Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={handleDrawerToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Header Section */}
          <Paper 
            elevation={0}
            sx={{ 
              mb: 4, 
              p: 4, 
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
              borderRadius: '12px'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827', mb: 1 }}>
                  Learning Progress Report
                </Typography>
                <Typography variant="body1" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                  Comprehensive overview of your learning journey and achievements
                </Typography>
              </Box>
                <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
                className={`px-4 py-2.5 border rounded-lg font-medium ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="1month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                </select>
            </Box>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {stats.map((stat, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    p: 2.5,
                    backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}
                >
                  <Box sx={{ color: '#3b82f6', fontSize: '2rem', mb: 1 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827', mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.75rem' }}>
                    {stat.title}
                  </Typography>
                </Box>
              ))}
            </div>
          </Paper>

          {/* Main Report Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Progress Overview */}
            <div className="lg:col-span-8">
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  height: '100%'
                }}
              >
        {/* Overall Progress */}
                <Box mb={4}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Typography variant="h6" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>
                      Overall Performance
                    </Typography>
                    <Chip 
                      label={`${overallProgress}%`} 
                      sx={{ 
                        backgroundColor: '#3b82f6', 
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        height: '36px'
                      }} 
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={overallProgress} 
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#3b82f6',
                        borderRadius: 6
                      }
                    }} 
                  />
                  <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', mt: 1, display: 'block' }}>
                    Average across all subjects
                  </Typography>
                </Box>

                <Divider sx={{ my: 3, borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }} />

                {/* Subject-wise Progress */}
                <Box mb={4}>
                  <Typography variant="h6" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827', mb: 3 }}>
                    Subject Performance
                  </Typography>
                  {subjectsProgress.length === 0 ? (
                    <Box 
                      sx={{ 
                        textAlign: 'center', 
                        py: 6,
                        backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                        borderRadius: '8px'
                      }}
                    >
                      <School sx={{ fontSize: 48, color: theme === 'dark' ? '#6b7280' : '#9ca3af', mb: 2 }} />
                      <Typography sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        No progress records yet. Start learning with your tutors!
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {subjectsProgress.map((subject, index) => (
                        <Box 
                          key={index}
                          sx={{ 
                            p: 3,
                            backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                            borderRadius: '8px',
                            border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="subtitle1" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>
                              {subject.subject}
                            </Typography>
                            <Chip 
                              label={`${subject.averageScore}%`} 
                              size="small"
                              sx={{ 
                                backgroundColor: subject.averageScore >= 80 ? '#10b981' : subject.averageScore >= 60 ? '#f59e0b' : '#ef4444',
                                color: '#ffffff',
                                fontWeight: 'bold'
                              }} 
                            />
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={subject.averageScore} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              mb: 2,
                              backgroundColor: theme === 'dark' ? '#1f2937' : '#e5e7eb',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: subject.averageScore >= 80 ? '#10b981' : subject.averageScore >= 60 ? '#f59e0b' : '#ef4444',
                                borderRadius: 4
                              }
                            }} 
                          />
                          <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Assignment sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                              <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                                {subject.totalRecords} sessions
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <School sx={{ fontSize: 16, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                              <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                                {subject.topics.length} topics covered
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 3, borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }} />

                {/* Recent Progress Records */}
                <Box>
                  <Typography variant="h6" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827', mb: 3 }}>
                    Recent Sessions
                  </Typography>
                  {progressRecords.length === 0 ? (
                    <Box 
                      sx={{ 
                        textAlign: 'center', 
                        py: 6,
                        backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                        borderRadius: '8px'
                      }}
                    >
                      <CalendarTodayIcon sx={{ fontSize: 48, color: theme === 'dark' ? '#6b7280' : '#9ca3af', mb: 2 }} />
                      <Typography sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        No sessions completed yet
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {progressRecords.slice(0, 5).map((record, index) => {
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
                              p: 2.5,
                              backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                              borderRadius: '8px',
                              border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e5e7eb'}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 2
                            }}
                          >
                            <Box flex={1} minWidth="200px">
                              <Typography variant="subtitle2" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827', mb: 0.5 }}>
                                {record.subject} - {record.topic}
                              </Typography>
                              <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', display: 'block' }}>
                                {tutorName} • {recordDate}
                              </Typography>
                              {record.notes && (
                                <Typography variant="caption" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', display: 'block', mt: 1, fontStyle: 'italic' }}>
                                  "{record.notes}"
                                </Typography>
                              )}
                            </Box>
                            <Chip 
                              label={`${scorePercentage}%`} 
                              sx={{ 
                                backgroundColor: scorePercentage >= 80 ? '#10b981' : scorePercentage >= 60 ? '#f59e0b' : '#ef4444',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                minWidth: '60px'
                              }} 
                            />
                          </Box>
                        )
                      })}
                    </Box>
                  )}
                </Box>
              </Paper>
              </div>

            {/* Right Column - Insights */}
            <div className="lg:col-span-4">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                  <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                    <CheckCircleIcon sx={{ color: '#10b981', fontSize: 24 }} />
                    <Typography variant="h6" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>
                      Improvements
                    </Typography>
                  </Box>
                  {progressRecords.length === 0 || progressRecords.filter(r => r.improvements && r.improvements.length > 0).length === 0 ? (
                    <Typography variant="body2" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', textAlign: 'center', py: 4 }}>
                      No improvements recorded yet
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {progressRecords
                        .filter(r => r.improvements && r.improvements.length > 0)
                        .slice(0, 5)
                        .flatMap(r => r.improvements.map((imp: string) => ({ text: imp, subject: r.subject })))
                        .slice(0, 6)
                        .map((item: any, index: number) => (
                          <Box 
                            key={index}
                            sx={{ 
                              p: 2,
                              backgroundColor: theme === 'dark' ? '#374151' : '#f0fdf4',
                              borderRadius: '6px',
                              border: `1px solid ${theme === 'dark' ? '#4b5563' : '#bbf7d0'}`
                            }}
                          >
                            <Typography variant="caption" fontWeight="600" sx={{ color: theme === 'dark' ? '#10b981' : '#059669', display: 'block', mb: 0.5 }}>
                              {item.subject}
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}>
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
                  <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                    <WarningIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
                    <Typography variant="h6" fontWeight="600" sx={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}>
                      Areas to Focus
                    </Typography>
                  </Box>
                  {progressRecords.length === 0 || progressRecords.filter(r => r.challenges && r.challenges.length > 0).length === 0 ? (
                    <Typography variant="body2" sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280', textAlign: 'center', py: 4 }}>
                      No challenges recorded yet
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {progressRecords
                        .filter(r => r.challenges && r.challenges.length > 0)
                        .slice(0, 5)
                        .flatMap(r => r.challenges.map((chal: string) => ({ text: chal, subject: r.subject })))
                        .slice(0, 6)
                        .map((item: any, index: number) => (
                          <Box 
                            key={index}
                            sx={{ 
                              p: 2,
                              backgroundColor: theme === 'dark' ? '#374151' : '#fffbeb',
                              borderRadius: '6px',
                              border: `1px solid ${theme === 'dark' ? '#4b5563' : '#fde68a'}`
                            }}
                          >
                            <Typography variant="caption" fontWeight="600" sx={{ color: theme === 'dark' ? '#f59e0b' : '#d97706', display: 'block', mb: 0.5 }}>
                              {item.subject}
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}>
                              {item.text}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                  )}
                </Paper>
              </Box>
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

              {/* Mobile Quick Actions */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    navigate('/student/book')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <CheckCircleIcon className="mr-3 w-4 h-4" />
                  Book Session
                </button>
                <button 
                  onClick={() => {
                    navigate('/student/search')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <BarChartIcon className="mr-3 w-4 h-4" />
                  Find Tutors
                </button>
                <button 
                  onClick={() => {
                    navigate('/student')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewProgress
