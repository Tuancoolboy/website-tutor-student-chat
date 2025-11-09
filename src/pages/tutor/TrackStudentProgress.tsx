import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  TrendingUp, 
  Schedule,
  Star,
  Assignment,
  Quiz,
  Person,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material'
import { Avatar } from '@mui/material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { progressAPI, usersAPI, sessionsAPI } from '../../lib/api'

interface StudentProgress {
  studentId: string
  studentName: string
  progressRecords: any[]
  sessions: any[]
  averageScore: number
  totalSessions: number
  subjects: string[]
}

const TrackStudentProgress: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progressData, setProgressData] = useState<any[]>([])
  const [studentsMap, setStudentsMap] = useState<Record<string, any>>({})
  const [studentsProgress, setStudentsProgress] = useState<StudentProgress[]>([])
  const [selectedStudent, setSelectedStudent] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Load progress data on mount
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

        // Load progress records for this tutor
        const progressResponse = await progressAPI.list({ tutorId: userData.id, limit: 1000 })
        
        console.log('Progress response:', progressResponse) // Debug

        if (progressResponse.data && Array.isArray(progressResponse.data)) {
          const progressRecords = progressResponse.data

          // Get unique student IDs
          const studentIds = [...new Set(progressRecords.map((p: any) => p.studentId))] as string[]
          
          // Load student data
          const studentsData: Record<string, any> = {}
          await Promise.all(
            studentIds.map(async (studentId) => {
              try {
                const response = await usersAPI.get(studentId)
                const userData = response.success ? response.data : response
                if (userData) {
                  studentsData[studentId] = userData
                }
              } catch (err) {
                console.error(`Error loading student ${studentId}:`, err)
              }
            })
          )

          setStudentsMap(studentsData)
          setProgressData(progressRecords)

          // Process data by student
          const studentProgressMap = new Map<string, StudentProgress>()

          progressRecords.forEach((progress: any) => {
            if (!studentProgressMap.has(progress.studentId)) {
              studentProgressMap.set(progress.studentId, {
                studentId: progress.studentId,
                studentName: studentsData[progress.studentId]?.name || 'Unknown Student',
                progressRecords: [],
                sessions: [],
                averageScore: 0,
                totalSessions: 0,
                subjects: []
              })
            }

            const studentProgress = studentProgressMap.get(progress.studentId)!
            studentProgress.progressRecords.push(progress)
            
            // Add unique subjects
            if (!studentProgress.subjects.includes(progress.subject)) {
              studentProgress.subjects.push(progress.subject)
            }
          })

          // Calculate averages
          studentProgressMap.forEach((studentProgress) => {
            const scores = studentProgress.progressRecords.map((p: any) => p.score || 0)
            // Convert score from 0-10 scale to 0-100 percentage
            const averageScore = scores.length > 0 
              ? scores.reduce((a, b) => a + b, 0) / scores.length
              : 0
            studentProgress.averageScore = Math.round(averageScore * 10) // Convert to percentage
            studentProgress.totalSessions = studentProgress.progressRecords.length
          })

          setStudentsProgress(Array.from(studentProgressMap.values()))
        }
      } catch (err: any) {
        console.error('Error loading progress:', err)
        setError(err.message || 'Failed to load progress data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [navigate])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
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

  // Filter students
  const filteredStudents = studentsProgress.filter(student => {
    const matchesStudent = selectedStudent === 'all' || student.studentId === selectedStudent
    const matchesSubject = selectedSubject === 'all' || student.subjects.includes(selectedSubject)
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStudent && matchesSubject && matchesSearch
  })

  // Calculate overall stats
  const overallStats = {
    totalStudents: studentsProgress.length,
    averageProgress: studentsProgress.length > 0 
      ? Math.round(studentsProgress.reduce((sum, s) => sum + s.averageScore, 0) / studentsProgress.length)
      : 0,
    totalSessions: studentsProgress.reduce((sum, s) => sum + s.totalSessions, 0),
    averageRating: '0.0' // Not available in progress data
  }

  // Get unique subjects for filter
  const allSubjects = [...new Set(studentsProgress.flatMap(s => s.subjects))]

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading student progress...</p>
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

            {/* Progress Overview */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                PROGRESS OVERVIEW
              </h3>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Students:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {overallStats.totalStudents}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Avg Progress:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {overallStats.averageProgress}%
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Sessions:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {overallStats.totalSessions}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Avg Rating:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {overallStats.averageRating}
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
        Track Student Progress
                </h1>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Monitor and analyze student learning progress
                </p>
              </div>
              <div className="flex space-x-2">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <BarChartIcon className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </div>

      {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card 
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
              {overallStats.totalStudents}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Students
                  </p>
                </div>
                <div className="text-3xl text-blue-600">
                  <Person />
                </div>
              </div>
          </Card>

            <Card 
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
              {overallStats.averageProgress}%
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Avg Progress
                  </p>
                </div>
                <div className="text-3xl text-green-600">
                  <TrendingUp />
                </div>
              </div>
          </Card>

            <Card 
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
              {overallStats.totalSessions}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Sessions
                  </p>
                </div>
                <div className="text-3xl text-purple-600">
                  <Schedule />
                </div>
              </div>
          </Card>

            <Card 
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
              {overallStats.averageRating}
                  </p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Avg Rating
                  </p>
                </div>
                <div className="text-3xl text-yellow-600">
                  <Star />
                </div>
              </div>
          </Card>
          </div>

      {/* Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Search and Filters */}
            <div className="lg:col-span-2">
              <Card 
                className={`p-6 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
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
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search students..."
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
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                      className={`w-full px-3 py-3 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                      <option value="all">All Students</option>
                {studentsProgress.map((student) => (
                        <option key={student.studentId} value={student.studentId}>
                          {student.studentName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                      className={`w-full px-3 py-3 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="all">All Subjects</option>
                      {allSubjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card 
                className={`p-6 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}>
                    <Assignment className="mr-3 w-4 h-4" />
                    Assign Homework
                  </button>
                  <button className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}>
                    <Quiz className="mr-3 w-4 h-4" />
                    Create Quiz
                  </button>
                  <button className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}>
                    <BarChartIcon className="mr-3 w-4 h-4" />
                    View Analytics
                  </button>
                </div>
      </Card>
            </div>
          </div>

      {/* Student Progress Cards */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {filteredStudents.length === 0 ? (
            <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <Person className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No students found</h3>
              <p>No progress records match the current filters.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
              <Card 
                key={student.studentId} 
                className={`overflow-hidden border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <div className="p-6">
                  {/* Student Header */}
                  <div className="flex items-center mb-4">
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: getAvatarColor(student.studentName),
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        mr: 3
                      }}
                    >
                      {getInitials(student.studentName)}
                    </Avatar>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {student.studentName}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {student.subjects.length > 0 ? student.subjects.join(', ') : 'No subjects'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Average Score
                      </span>
                      <span className={`text-sm font-medium text-blue-600`}>
                        {student.averageScore}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${student.averageScore}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {student.totalSessions} progress records
                    </p>
                  </div>

                  {/* Recent Progress Records */}
                  <div className="mb-4">
                    <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Recent Topics:
                    </h4>
                    <div className="space-y-2">
                      {student.progressRecords.slice(0, 3).map((progress: any, index: number) => {
                        const scorePercentage = Math.round(progress.score * 10) // Convert 0-10 to 0-100
                        return (
                          <div key={index} className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-center">
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {progress.topic}
                            </span>
                              <span className={`text-xs font-medium ${scorePercentage >= 80 ? 'text-green-600' : scorePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {scorePercentage}%
                            </span>
                          </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Improvements from latest record */}
                  {student.progressRecords.length > 0 && student.progressRecords[0].improvements && student.progressRecords[0].improvements.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Recent Improvements:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {student.progressRecords[0].improvements.slice(0, 3).map((improvement: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                            {improvement}
                        </span>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Challenges from latest record */}
                  {student.progressRecords.length > 0 && student.progressRecords[0].challenges && student.progressRecords[0].challenges.length > 0 && (
                  <div className="mb-4">
                    <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Challenges:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {student.progressRecords[0].challenges.slice(0, 3).map((challenge: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                        >
                            {challenge}
                        </span>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button 
                      size="small" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Assignment className="w-4 h-4 mr-1" />
                      Assign
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
                      <Quiz className="w-4 h-4 mr-1" />
                      Quiz
                    </Button>
                  </div>
                </div>
            </Card>
            ))}
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

              {/* Mobile Progress Overview */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  PROGRESS OVERVIEW
                </h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Students:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {overallStats.totalStudents}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Avg Progress:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {overallStats.averageProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Actions */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    navigate('/tutor/sessions')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Assignment className="mr-3 w-4 h-4" />
                  Manage Sessions
                </button>
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
    </div>
  )
}

export default TrackStudentProgress
