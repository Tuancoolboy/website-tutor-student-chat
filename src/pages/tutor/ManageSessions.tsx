import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar
} from '@mui/material'
import { 
  Search, 
  VideoCall, 
  Chat, 
  Edit, 
  Schedule,
  Assignment,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { sessionsAPI, usersAPI } from '../../lib/api'

const ManageSessions: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [studentsMap, setStudentsMap] = useState<Record<string, any>>({})
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [actionSession, setActionSession] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Load sessions and student data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user from localStorage
        const userStr = localStorage.getItem('user')
        if (!userStr) {
          navigate('/login')
          return
        }
        const userData = JSON.parse(userStr)
        setUser(userData)

        // Load sessions for this tutor (increase limit to get all sessions)
        const sessionsResponse = await sessionsAPI.list({ tutorId: userData.id, limit: 1000 })
        
        console.log('Sessions response:', sessionsResponse) // Debug log
        
        // API returns { data: [...], pagination: {...} } structure
        if (sessionsResponse.data && Array.isArray(sessionsResponse.data)) {
          const sessionsData = sessionsResponse.data

          // Load all unique students (support both old studentId and new studentIds array)
          const sessionStudentIds = new Set<string>()
          sessionsData.forEach((s: any) => {
            if (s.studentIds && Array.isArray(s.studentIds)) {
              s.studentIds.forEach((id: string) => sessionStudentIds.add(id))
            } else if (s.studentId) {
              sessionStudentIds.add(s.studentId)
            }
          })
          
          const studentsData: Record<string, any> = {}
          await Promise.all(
            Array.from(sessionStudentIds).map(async (studentId) => {
              try {
                const userResponse = await usersAPI.get(studentId)
                // Check if response has success field or directly has data
                const userData = userResponse.success ? userResponse.data : userResponse
                if (userData) {
                  studentsData[studentId] = userData
                }
              } catch (err) {
                console.error(`Error loading student ${studentId}:`, err)
              }
            })
          )

          setStudentsMap(studentsData)
          setSessions(sessionsData)
        }
      } catch (err: any) {
        console.error('Error loading sessions:', err)
        setError(err.message || 'Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [navigate])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Confirm session handler
  const handleConfirmSession = async () => {
    if (!actionSession) return
    
    try {
      setActionLoading(true)
      const response = await sessionsAPI.update(actionSession.id, { status: 'confirmed' })
      
      if (response.success) {
        // Update local state
        setSessions(prev => prev.map(s => 
          s.id === actionSession.id ? { ...s, status: 'confirmed' } : s
        ))
        setIsConfirmDialogOpen(false)
        setActionSession(null)
        alert('Session confirmed successfully!')
      } else {
        alert('Failed to confirm session: ' + response.error)
      }
    } catch (error: any) {
      console.error('Error confirming session:', error)
      alert('Failed to confirm session')
    } finally {
      setActionLoading(false)
    }
  }

  // Reject session handler
  const handleRejectSession = async () => {
    if (!actionSession || !rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    
    try {
      setActionLoading(true)
      const response = await sessionsAPI.cancel(actionSession.id, rejectReason)
      
      if (response.success) {
        // Update local state
        setSessions(prev => prev.map(s => 
          s.id === actionSession.id ? { ...s, status: 'cancelled' } : s
        ))
        setIsRejectDialogOpen(false)
        setActionSession(null)
        setRejectReason('')
        alert('Session rejected successfully!')
      } else {
        alert('Failed to reject session: ' + response.error)
      }
    } catch (error: any) {
      console.error('Error rejecting session:', error)
      alert('Failed to reject session')
    } finally {
      setActionLoading(false)
    }
  }

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

  // Format date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus
    // Support both old studentId (string) and new studentIds (array)
    const studentId = session.studentIds && session.studentIds.length > 0 ? session.studentIds[0] : session.studentId
    const student = studentId ? studentsMap[studentId] : null
    const studentName = student?.name || 'Unknown Student'
    const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.subject.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })


  const handleEditSession = (session: any) => {
    setSelectedSession(session)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    // In a real app, this would save changes to the backend
    console.log('Session updated:', selectedSession)
    setIsEditDialogOpen(false)
  }

  // Show loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading sessions...</p>
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
              onClick={() => navigate('/tutor')}
            >
              <div className="w-10 h-10 flex items-center justify-center mr-3">
                <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-10 h-10" />
              </div>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                HCMUT
              </span>
            </div>

            {/* Session Stats */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                SESSION STATS
              </h3>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Sessions:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {sessions.length}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Confirmed:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {sessions.filter(s => s.status === 'confirmed').length}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Completed:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {sessions.filter(s => s.status === 'completed').length}
                    </span>
                  </div>
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
                  onClick={() => navigate('/tutor')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6">
          {/* Mobile Menu Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={handleDrawerToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Manage Sessions
                </h1>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  View and manage all your teaching sessions
                </p>
              </div>
              <div className="flex space-x-2">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Assignment className="w-4 h-4 mr-2" />
                  New Session
                </Button>
              </div>
            </div>
          </div>

      {/* Filters and Search */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Search and Filters */}
            <div className="lg:col-span-2">
              <Card 
                className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Search & Filters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full px-4 py-3 pl-10 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Search className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                      className={`w-full px-3 py-3 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="all">All Sessions</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Stats */}
            <div>
              <Card 
                className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>This Week:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {sessions.filter(s => s.status === 'confirmed').length} sessions
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Duration:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {sessions.length > 0 ? `${Math.round(sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60)}h` : '0h'}
                    </span>
                  </div>
                </div>
      </Card>
            </div>
          </div>

      {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Sessions List */}
          {filteredSessions.length === 0 ? (
            <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <Assignment className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
              <p>You don't have any sessions matching the current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSessions.map((session) => {
          // Support both old studentId (string) and new studentIds (array)
          const studentId = session.studentIds && session.studentIds.length > 0 ? session.studentIds[0] : session.studentId
          const student = studentId ? studentsMap[studentId] : null
          const studentName = student?.name || 'Unknown Student'
          
          return (
            <Card
                key={session.id} 
                className={`border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <div className="p-6">
                  {/* Session Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: getAvatarColor(studentName),
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {getInitials(studentName)}
                      </Avatar>
                      <div className="ml-3">
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {studentName}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {session.subject}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      session.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : session.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : session.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {session.status}
                    </span>
                  </div>

                  {/* Session Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <Schedule className="w-4 h-4 text-gray-400 mr-2" />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formatDate(session.startTime)} at {formatTime(session.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Assignment className="w-4 h-4 text-gray-400 mr-2" />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {session.topic || 'No topic'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Duration: {formatDuration(session.duration)}
                      </span>
                    </div>
                    {session.isOnline && (
                      <div className="flex items-center">
                        <VideoCall className="w-4 h-4 text-blue-400 mr-2" />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          Online session
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Session Notes */}
                  {session.notes && (
                    <div className="mb-4">
                      <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Notes:
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {session.notes}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {session.description && (
                    <div className="mb-4">
                      <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Description:
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {session.description}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {session.status === 'pending' ? (
                    // Pending session: Show Confirm/Reject buttons
                    <div className="flex space-x-2">
                      <Button 
                        size="small" 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          setActionSession(session)
                          setIsConfirmDialogOpen(true)
                        }}
                      >
                        ✓ Confirm
                      </Button>
                      <Button 
                        size="small" 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => {
                          setActionSession(session)
                          setIsRejectDialogOpen(true)
                        }}
                      >
                        ✗ Reject
                      </Button>
                    </div>
                  ) : (
                    // Confirmed/other status: Show Join/Chat buttons
                    <div className="flex space-x-2">
                      <Button 
                        size="small" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <VideoCall className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined"
                      className="flex-1"
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
                      <Chat className="w-4 h-4 mr-1" />
                    Chat
                  </Button>
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleEditSession(session)}
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
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
          </div>
          )}
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

              {/* Mobile Session Stats */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  SESSION STATS
                </h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Sessions:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {sessions.length}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Confirmed:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {sessions.filter(s => s.status === 'confirmed').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Actions */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    navigate('/tutor/availability')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Schedule className="mr-3 w-4 h-4" />
                  Set Availability
                </button>
                <button 
                  onClick={() => {
                    navigate('/tutor/track-progress')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <BarChartIcon className="mr-3 w-4 h-4" />
                  Track Progress
                </button>
                <button 
                  onClick={() => {
                    navigate('/tutor')
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

      {/* Edit Session Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onClose={() => setIsEditDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000'
          }
        }}
      >
        <DialogTitle style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
          Edit Session
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={selectedSession?.date || ''}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    '& fieldset': {
                      borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db'
                    },
                    '&:hover fieldset': {
                      borderColor: theme === 'dark' ? '#9ca3af' : '#9ca3af'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                  }
                }}
              />
              </div>
              <div>
              <TextField
                fullWidth
                label="Time"
                type="time"
                value={selectedSession?.time || ''}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    '& fieldset': {
                      borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db'
                    },
                    '&:hover fieldset': {
                      borderColor: theme === 'dark' ? '#9ca3af' : '#9ca3af'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                  }
                }}
              />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <FormControl fullWidth>
                <InputLabel sx={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>Status</InputLabel>
                <Select
                  value={selectedSession?.status || ''}
                  label="Status"
                  sx={{
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme === 'dark' ? '#9ca3af' : '#9ca3af'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6'
                    }
                  }}
                >
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              </div>
              <div>
              <TextField
                fullWidth
                label="Duration"
                value={selectedSession?.duration || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    '& fieldset': {
                      borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db'
                    },
                    '&:hover fieldset': {
                      borderColor: theme === 'dark' ? '#9ca3af' : '#9ca3af'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                  }
                }}
              />
              </div>
            </div>
            <div>
              <TextField
                fullWidth
                label="Topic"
                value={selectedSession?.topic || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    '& fieldset': {
                      borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db'
                    },
                    '&:hover fieldset': {
                      borderColor: theme === 'dark' ? '#9ca3af' : '#9ca3af'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                  }
                }}
              />
            </div>
            <div>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={selectedSession?.notes || ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    '& fieldset': {
                      borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db'
                    },
                    '&:hover fieldset': {
                      borderColor: theme === 'dark' ? '#9ca3af' : '#9ca3af'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setIsEditDialogOpen(false)}
            style={{
              backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
              color: theme === 'dark' ? '#ffffff' : '#000000',
              borderColor: theme === 'dark' ? '#6b7280' : '#d1d5db'
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleSaveEdit} 
            variant="outlined"
            style={{
              backgroundColor: theme === 'dark' ? '#000000' : '#3b82f6',
              color: theme === 'dark' ? '#ffffff' : '#ffffff',
              borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6',
              textTransform: 'none',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1e40af' : '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#000000' : '#3b82f6'
            }}
          >
            Save Changes
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Confirm Session Dialog */}
      <Dialog 
        open={isConfirmDialogOpen} 
        onClose={() => !actionLoading && setIsConfirmDialogOpen(false)}
        PaperProps={{
          style: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000'
          }
        }}
      >
        <DialogTitle style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
          Confirm Session
        </DialogTitle>
        <DialogContent>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
            Are you sure you want to confirm this session with <strong>{actionSession && studentsMap[actionSession.studentId]?.name}</strong>?
          </p>
          {actionSession && (
            <div className="mt-4 space-y-2">
              <p className="text-sm"><strong>Subject:</strong> {actionSession.subject}</p>
              <p className="text-sm"><strong>Date:</strong> {formatDate(actionSession.startTime)}</p>
              <p className="text-sm"><strong>Time:</strong> {formatTime(actionSession.startTime)}</p>
              <p className="text-sm"><strong>Duration:</strong> {formatDuration(actionSession.duration)}</p>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setIsConfirmDialogOpen(false)}
            disabled={actionLoading}
            style={{
              backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
              color: theme === 'dark' ? '#ffffff' : '#000000'
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleConfirmSession}
            disabled={actionLoading}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff'
            }}
          >
            {actionLoading ? 'Confirming...' : 'Confirm Session'}
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Reject Session Dialog */}
      <Dialog 
        open={isRejectDialogOpen} 
        onClose={() => !actionLoading && setIsRejectDialogOpen(false)}
        PaperProps={{
          style: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000'
          }
        }}
      >
        <DialogTitle style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
          Reject Session
        </DialogTitle>
        <DialogContent>
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Please provide a reason for rejecting this session:
          </p>
          {actionSession && (
            <div className="mb-4 space-y-2">
              <p className="text-sm"><strong>Student:</strong> {studentsMap[actionSession.studentId]?.name}</p>
              <p className="text-sm"><strong>Subject:</strong> {actionSession.subject}</p>
              <p className="text-sm"><strong>Date:</strong> {formatDate(actionSession.startTime)}</p>
            </div>
          )}
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            rows={4}
            className={`w-full p-3 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          />
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => {
              setIsRejectDialogOpen(false)
              setRejectReason('')
            }}
            disabled={actionLoading}
            style={{
              backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
              color: theme === 'dark' ? '#ffffff' : '#000000'
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleRejectSession}
            disabled={actionLoading || !rejectReason.trim()}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              opacity: (!rejectReason.trim() || actionLoading) ? 0.5 : 1
            }}
          >
            {actionLoading ? 'Rejecting...' : 'Reject Session'}
          </MuiButton>
        </DialogActions>
      </Dialog>

    </div>
  )
}

export default ManageSessions
