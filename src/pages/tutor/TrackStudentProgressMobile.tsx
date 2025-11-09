import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Schedule,
  Star,
  Assignment,
  Quiz,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  BarChart as BarChartIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  Dashboard as DashboardIcon,
  Autorenew as AutorenewIcon,
  Chat as ChatIcon
} from '@mui/icons-material'
import { Avatar } from '@mui/material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const TrackStudentProgressMobile: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [selectedStudent, setSelectedStudent] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)
  const [activeMenu, setActiveMenu] = useState('progress')
  

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleThemeToggle = () => {
    toggleTheme()
  }

  const handleMenuClick = (item: any) => {
    setActiveMenu(item.id)
    if (item.path) {
      navigate(item.path)
    }
  }


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      if (showStudentDropdown && !target.closest('.student-dropdown-container')) {
        setShowStudentDropdown(false)
      }
      
      if (showSubjectDropdown && !target.closest('.subject-dropdown-container')) {
        setShowSubjectDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStudentDropdown, showSubjectDropdown])

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

  const students = [
    {
      id: 1,
      name: 'John Smith',
      subject: 'Mathematics',
      progress: 85,
      sessionsCompleted: 12,
      averageRating: 4.8,
      lastSession: '2024-01-10',
      avatar: '/api/placeholder/40/40',
      goals: [
        { topic: 'Calculus', target: 90, current: 85, deadline: '2024-02-15' },
        { topic: 'Algebra', target: 95, current: 88, deadline: '2024-02-20' }
      ],
      recentSessions: [
        { date: '2024-01-10', topic: 'Derivatives', rating: 5, duration: '60 min' },
        { date: '2024-01-08', topic: 'Limits', rating: 4, duration: '60 min' },
        { date: '2024-01-05', topic: 'Functions', rating: 5, duration: '90 min' }
      ],
      strengths: ['Problem Solving', 'Critical Thinking'],
      weaknesses: ['Time Management', 'Complex Calculations']
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      subject: 'Physics',
      progress: 78,
      sessionsCompleted: 8,
      averageRating: 4.6,
      lastSession: '2024-01-08',
      avatar: '/api/placeholder/40/40',
      goals: [
        { topic: 'Mechanics', target: 85, current: 80, deadline: '2024-03-01' },
        { topic: 'Thermodynamics', target: 80, current: 75, deadline: '2024-03-15' }
      ],
      recentSessions: [
        { date: '2024-01-08', topic: 'Newton\'s Laws', rating: 4, duration: '90 min' },
        { date: '2024-01-05', topic: 'Kinematics', rating: 5, duration: '60 min' },
        { date: '2024-01-03', topic: 'Forces', rating: 4, duration: '60 min' }
      ],
      strengths: ['Conceptual Understanding', 'Visual Learning'],
      weaknesses: ['Mathematical Applications', 'Problem Setup']
    },
    {
      id: 3,
      name: 'Mike Chen',
      subject: 'Chemistry',
      progress: 92,
      sessionsCompleted: 6,
      averageRating: 4.9,
      lastSession: '2024-01-05',
      avatar: '/api/placeholder/40/40',
      goals: [
        { topic: 'Organic Chemistry', target: 95, current: 92, deadline: '2024-02-28' },
        { topic: 'Inorganic Chemistry', target: 90, current: 88, deadline: '2024-03-10' }
      ],
      recentSessions: [
        { date: '2024-01-05', topic: 'Organic Reactions', rating: 5, duration: '60 min' },
        { date: '2024-01-03', topic: 'Bonding', rating: 5, duration: '90 min' },
        { date: '2024-01-01', topic: 'Stoichiometry', rating: 4, duration: '60 min' }
      ],
      strengths: ['Memorization', 'Pattern Recognition'],
      weaknesses: ['Laboratory Skills', 'Safety Protocols']
    }
  ]

  const filteredStudents = students.filter(student => {
    const matchesStudent = selectedStudent === 'all' || student.id.toString() === selectedStudent
    const matchesSubject = selectedSubject === 'all' || student.subject === selectedSubject
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStudent && matchesSubject && matchesSearch
  })

  const overallStats = {
    totalStudents: students.length,
    averageProgress: Math.round(students.reduce((sum, student) => sum + student.progress, 0) / students.length),
    totalSessions: students.reduce((sum, student) => sum + student.sessionsCompleted, 0),
    averageRating: (students.reduce((sum, student) => sum + student.averageRating, 0) / students.length).toFixed(1)
  }

  // Subject options
  const subjectOptions = [
    { value: 'all', label: 'All Subjects' },
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Physics', label: 'Physics' },
    { value: 'Chemistry', label: 'Chemistry' }
  ]

  // Student options
  const studentOptions = [
    { value: 'all', label: 'All Students' },
    ...students.map(student => ({
      value: student.id.toString(),
      label: student.name
    }))
  ]

  const getSelectedStudent = () => {
    return studentOptions.find(option => option.value === selectedStudent) || studentOptions[0]
  }

  const getSelectedSubject = () => {
    return subjectOptions.find(option => option.value === selectedSubject) || subjectOptions[0]
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/tutor' },
    { id: 'availability', label: 'Set Availability', icon: <Schedule className="w-4 h-4" />, path: '/tutor/availability' },
    { id: 'sessions', label: 'Manage Sessions', icon: <Assignment className="w-4 h-4" />, path: '/tutor/sessions' },
    { id: 'progress', label: 'Track Progress', icon: <BarChartIcon className="w-4 h-4" />, path: '/tutor/track-progress' },
    { id: 'cancel-reschedule', label: 'Cancel/Reschedule', icon: <AutorenewIcon className="w-4 h-4" />, path: '/tutor/cancel-reschedule' },
    { id: 'messages', label: 'Messages', icon: <ChatIcon className="w-4 h-4" />, path: '/tutor/messages' }
  ]

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} pb-16`}>
      {/* Mobile Header */}
      <div className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/tutor')}
              className={`p-2 rounded-lg mr-3 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <ArrowBackIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Track Progress
              </h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Monitor student learning progress
              </p>
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

        {/* Progress Stats - Mobile */}
        <div className="grid grid-cols-2 gap-3">
          <Card
            className={`p-3 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{
              borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              boxShadow: 'none !important'
            }}
          >
            <div className="text-center">
              <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {overallStats.totalStudents}
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Students
              </p>
            </div>
          </Card>
          <Card
            className={`p-3 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{
              borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              boxShadow: 'none !important'
            }}
          >
            <div className="text-center">
              <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {overallStats.averageProgress}%
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Avg Progress
              </p>
            </div>
          </Card>
          <Card
            className={`p-3 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{
              borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              boxShadow: 'none !important'
            }}
          >
            <div className="text-center">
              <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {overallStats.totalSessions}
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Sessions
              </p>
            </div>
          </Card>
          <Card
            className={`p-3 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            style={{
              borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
              boxShadow: 'none !important'
            }}
          >
            <div className="text-center">
              <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {overallStats.averageRating}
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Avg Rating
              </p>
            </div>
          </Card>
        </div>

        {/* Search & Filters - Mobile */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-3 pl-10 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative student-dropdown-container">
              <button
                onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                className={`w-full px-3 py-3 text-sm border rounded-xl flex items-center justify-between transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <div className="flex items-center">
                  <span className="font-medium">{getSelectedStudent().label}</span>
                </div>
                <div className={`transform transition-transform duration-200 ${showStudentDropdown ? 'rotate-180' : ''}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showStudentDropdown && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1">
                  <div className={`rounded-xl shadow-lg border overflow-hidden ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-200'
                  }`}>
                    {studentOptions.map((option, index) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedStudent(option.value)
                          setShowStudentDropdown(false)
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center transition-colors duration-150 ${
                          option.value === selectedStudent
                            ? theme === 'dark'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700'
                            : theme === 'dark'
                              ? 'text-gray-300 hover:bg-gray-600'
                              : 'text-gray-700 hover:bg-gray-50'
                        } ${index !== studentOptions.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''}`}
                      >
                        <span className="font-medium">{option.label}</span>
                        {option.value === selectedStudent && (
                          <div className="ml-auto">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative subject-dropdown-container">
              <button
                onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                className={`w-full px-3 py-3 text-sm border rounded-xl flex items-center justify-between transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <div className="flex items-center">
                  <span className="font-medium">{getSelectedSubject().label}</span>
                </div>
                <div className={`transform transition-transform duration-200 ${showSubjectDropdown ? 'rotate-180' : ''}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showSubjectDropdown && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1">
                  <div className={`rounded-xl shadow-lg border overflow-hidden ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-200'
                  }`}>
                    {subjectOptions.map((option, index) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedSubject(option.value)
                          setShowSubjectDropdown(false)
                        }}
                        className={`w-full px-4 py-3 text-left flex items-center transition-colors duration-150 ${
                          option.value === selectedSubject
                            ? theme === 'dark'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700'
                            : theme === 'dark'
                              ? 'text-gray-300 hover:bg-gray-600'
                              : 'text-gray-700 hover:bg-gray-50'
                        } ${index !== subjectOptions.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''}`}
                      >
                        <span className="font-medium">{option.label}</span>
                        {option.value === selectedSubject && (
                          <div className="ml-auto">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student Progress Cards - Mobile */}
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              className={`overflow-hidden border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{
                borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                boxShadow: 'none !important'
              }}
            >
              <div className="p-4">
                {/* Student Header */}
                <div className="flex items-center mb-3">
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: getAvatarColor(student.name),
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      mr: 2
                    }}
                  >
                    {getInitials(student.name)}
                  </Avatar>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {student.name}
                    </h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {student.subject}
                    </p>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-400 mr-1" />
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {student.averageRating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Progress
                    </span>
                    <span className={`text-xs font-medium text-blue-600`}>
                      {student.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${student.progress}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {student.sessionsCompleted} sessions • Last: {student.lastSession}
                  </p>
                </div>

                {/* Learning Goals */}
                <div className="mb-3">
                  <h4 className={`text-xs font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Goals:
                  </h4>
                  <div className="space-y-1">
                    {student.goals.slice(0, 2).map((goal, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {goal.topic}
                          </span>
                          <span className={`text-xs font-medium text-blue-600`}>
                            {goal.current}/{goal.target}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-green-500 h-1 rounded-full"
                            style={{ width: `${(goal.current / goal.target) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {student.strengths.slice(0, 2).map((strength, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {student.weaknesses.slice(0, 2).map((weakness, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                      >
                        {weakness}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="small" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    style={{
                      backgroundColor: theme === 'dark' ? '#2563eb' : '#3b82f6',
                      color: '#ffffff',
                      textTransform: 'none',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1e40af' : '#2563eb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2563eb' : '#3b82f6'
                    }}
                  >
                    <Assignment className="w-4 h-4 mr-1" />
                    Assign
                  </Button>
                  <Button 
                    size="small" 
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
                    <Quiz className="w-4 h-4 mr-1" />
                    Quiz
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Help Section - Mobile with Toggle */}
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`w-full flex items-center justify-between p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
          >
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Need Help?
            </h3>
            <div className={`transform transition-transform ${showHelp ? 'rotate-180' : ''}`}>
              <ArrowForwardIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          </button>
          
          {showHelp && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate('/tutor/sessions')}
                  className={`flex flex-col items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                >
                  <Assignment className="w-6 h-6 text-blue-600 mb-2" />
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Manage Sessions
                  </span>
                </button>
                <button 
                  onClick={() => navigate('/tutor/availability')}
                  className={`flex flex-col items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                >
                  <Schedule className="w-6 h-6 text-green-600 mb-2" />
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Set Availability
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle}></div>
          <div className={`fixed left-0 top-0 h-full w-80 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="p-6 h-full flex flex-col">
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

              {/* Quick Actions - Moved to top */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  QUICK ACTIONS
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      navigate('/tutor')
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

              {/* Mobile Navigation */}
              <div className="flex-1 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleMenuClick(item)
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeMenu === item.id
                        ? 'bg-purple-100 text-purple-700'
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
      )}
    </div>
  )
}

export default TrackStudentProgressMobile
