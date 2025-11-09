import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@mui/material'
import api from '../../lib/api'
import { 
  Search, 
  Star, 
  LocationOn, 
  Schedule,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  VideoCall as VideoCallIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Dashboard as DashboardIcon,
  PersonSearch,
  School as SchoolIcon,
  BarChart as BarChartIcon,
  Class,
  SmartToy as SmartToyIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const SearchTutorsMobile: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [subject, setSubject] = useState('')
  const [rating, setRating] = useState('')
  const [availability, setAvailability] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)
  const [showRatingDropdown, setShowRatingDropdown] = useState(false)
  const [showAvailabilityDropdown, setShowAvailabilityDropdown] = useState(false)
  const [activeMenu, setActiveMenu] = useState('search-tutors')
  
  // Backend data states
  const [tutors, setTutors] = useState<any[]>([])
  const [allTutors, setAllTutors] = useState<any[]>([]) // Store all tutors for filtering
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Subjects from backend
  const [subjects, setSubjects] = useState<string[]>([])
  const [availabilityData, setAvailabilityData] = useState<any[]>([])
  
  // Tutor detail modal state
  const [selectedTutor, setSelectedTutor] = useState<any>(null)
  const [showTutorModal, setShowTutorModal] = useState(false)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      if (showSubjectDropdown && !target.closest('.subject-dropdown-container')) {
        setShowSubjectDropdown(false)
      }
      
      if (showRatingDropdown && !target.closest('.rating-dropdown-container')) {
        setShowRatingDropdown(false)
      }
      
      if (showAvailabilityDropdown && !target.closest('.availability-dropdown-container')) {
        setShowAvailabilityDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSubjectDropdown, showRatingDropdown, showAvailabilityDropdown])

  // Load all subjects and availability data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        // Load all tutors to extract unique subjects
        const result = await api.tutors.list({ limit: 1000 })
        if (result.success && result.data) {
          const allTutorsData = result.data
          setAllTutors(allTutorsData)
          
          // Extract unique subjects from all tutors
          const uniqueSubjects = new Set<string>()
          allTutorsData.forEach((tutor: any) => {
            if (tutor.subjects && Array.isArray(tutor.subjects)) {
              tutor.subjects.forEach((sub: string) => uniqueSubjects.add(sub))
            }
          })
          setSubjects(Array.from(uniqueSubjects).sort())
          
          // Load availability data by fetching for each tutor
          const availabilityPromises = allTutorsData.map(async (tutor: any) => {
            try {
              const availResult = await fetch(`/api/availability/${tutor.id}`)
              if (availResult.ok) {
                const availData = await availResult.json()
                if (availData.success && availData.data) {
                  return availData.data
                }
              }
            } catch (error) {
              console.error(`Failed to load availability for tutor ${tutor.id}:`, error)
            }
            return null
          })
          
          const availabilityResults = await Promise.all(availabilityPromises)
          const validAvailability = availabilityResults.filter(avail => avail !== null)
          setAvailabilityData(validAvailability)
        }
      } catch (error) {
        console.error('Error loading filter data:', error)
      }
    }
    
    loadFilterData()
  }, [])

  // Day of week options
  const dayOptions = [
    { value: '', label: 'Tất cả các ngày' },
    { value: 'monday', label: 'Thứ Hai' },
    { value: 'tuesday', label: 'Thứ Ba' },
    { value: 'wednesday', label: 'Thứ Tư' },
    { value: 'thursday', label: 'Thứ Năm' },
    { value: 'friday', label: 'Thứ Sáu' },
    { value: 'saturday', label: 'Thứ Bảy' },
    { value: 'sunday', label: 'Chủ Nhật' }
  ]

  // Filter options
  const subjectOptions = [
    { value: '', label: 'Tất cả môn học' },
    ...subjects.map(sub => ({ value: sub, label: sub }))
  ]

  const ratingOptions = [
    { value: '', label: 'Bất kỳ rating' },
    { value: '4+', label: '4+ Sao' },
    { value: '4.5+', label: '4.5+ Sao' },
    { value: '5', label: '5 Sao' }
  ]

  const availabilityOptions = dayOptions

  const getSelectedSubject = () => {
    return subjectOptions.find(option => option.value === subject) || subjectOptions[0]
  }

  const getSelectedRating = () => {
    return ratingOptions.find(option => option.value === rating) || ratingOptions[0]
  }

  const getSelectedAvailability = () => {
    return availabilityOptions.find(option => option.value === availability) || availabilityOptions[0]
  }

  // Menu items for navigation
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
    { id: 'search-tutors', label: 'Find Tutors', icon: <PersonSearch />, path: '/student/search' },
    { id: 'book-session', label: 'Book Session', icon: <SchoolIcon />, path: '/student/book' },
    { id: 'view-progress', label: 'View Progress', icon: <BarChartIcon />, path: '/student/progress' },
    { id: 'evaluate-session', label: 'Evaluate Session', icon: <Star />, path: '/student/evaluate' },
    { id: 'session-detail', label: 'Session Details', icon: <Class />, path: '/student/session' },
    { id: 'chatbot-support', label: 'AI Support', icon: <SmartToyIcon />, path: '/student/chatbot' },
    { id: 'messages', label: 'Messages', icon: <ChatIcon />, path: '/student/messages' }
  ]

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

  // Load tutors from backend
  const loadTutors = async () => {
    try {
      setLoading(true)
      
      const params: any = {
        page,
        limit: 10
      }
      
      // Only add subject if it's not empty
      if (subject && subject !== '') {
        params.subject = subject
      }
      
      // Only add rating if it's not empty
      if (rating && rating !== '') {
        const minRating = parseFloat(rating.replace('+', ''))
        params.minRating = minRating
      }
      
      // Only add search if it's not empty
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm
      }
      
      console.log('Loading tutors with params:', params)
      const result = await api.tutors.list(params)
      console.log('Tutors result:', result)
      
      if (result.success) {
        setTutors(result.data || [])
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1)
        }
      } else {
        console.error('Failed to load tutors:', result.error)
      }
    } catch (error) {
      console.error('Error loading tutors:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and load tutors based on filters
  useEffect(() => {
    const filterAndLoadTutors = async () => {
      if (availability && availabilityData.length > 0 && allTutors.length > 0) {
        setLoading(true)
        // Filter tutors who have availability on the selected day
        const tutorsWithAvailability = allTutors.filter((tutor: any) => {
          const tutorAvailability = availabilityData.find((avail: any) => avail.tutorId === tutor.id)
          if (!tutorAvailability || !tutorAvailability.timeSlots) return false
          
          return tutorAvailability.timeSlots.some((slot: any) => slot.day === availability)
        })
        
        // Apply other filters (subject, rating, search)
        let filtered = tutorsWithAvailability
        
        if (subject) {
          filtered = filtered.filter((tutor: any) => 
            tutor.subjects && tutor.subjects.includes(subject)
          )
        }
        
        if (rating) {
          const minRating = parseFloat(rating.replace('+', ''))
          filtered = filtered.filter((tutor: any) => (tutor.rating || 0) >= minRating)
        }
        
        if (searchTerm && searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase()
          filtered = filtered.filter((tutor: any) =>
            tutor.name.toLowerCase().includes(searchLower) ||
            tutor.email.toLowerCase().includes(searchLower) ||
            (tutor.subjects && tutor.subjects.some((s: string) => s.toLowerCase().includes(searchLower)))
          )
        }
        
        // Paginate
        const pageNum = page || 1
        const limitNum = 10
        const startIndex = (pageNum - 1) * limitNum
        const endIndex = startIndex + limitNum
        const paginatedTutors = filtered.slice(startIndex, endIndex)
        
        setTutors(paginatedTutors)
        setTotalPages(Math.ceil(filtered.length / limitNum))
        setLoading(false)
      } else if (!availability || availabilityData.length === 0 || allTutors.length === 0) {
        // No availability filter or data not loaded yet, use normal API call
    loadTutors()
      }
    }
    
    filterAndLoadTutors()
  }, [availability, availabilityData, allTutors, subject, rating, searchTerm, page])

  const _mockTutors = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      subject: 'Mathematics',
      rating: 4.9,
      reviews: 127,
      experience: '8 years',
      location: 'New York, NY',
      availability: 'Available',
      image: '/api/placeholder/100/100',
      specialties: ['Calculus', 'Algebra', 'Statistics'],
      nextAvailable: 'Today at 2:00 PM'
    },
    {
      id: 2,
      name: 'Prof. Michael Chen',
      subject: 'Physics',
      rating: 4.8,
      reviews: 89,
      experience: '12 years',
      location: 'San Francisco, CA',
      availability: 'Available',
      image: '/api/placeholder/100/100',
      specialties: ['Quantum Physics', 'Mechanics', 'Thermodynamics'],
      nextAvailable: 'Tomorrow at 10:00 AM'
    },
    {
      id: 3,
      name: 'Dr. Emily Davis',
      subject: 'Chemistry',
      rating: 4.7,
      reviews: 156,
      experience: '6 years',
      location: 'Boston, MA',
      availability: 'Busy',
      image: '/api/placeholder/100/100',
      specialties: ['Organic Chemistry', 'Biochemistry', 'Analytical Chemistry'],
      nextAvailable: 'Next week'
    },
    {
      id: 4,
      name: 'Dr. James Wilson',
      subject: 'Biology',
      rating: 4.9,
      reviews: 203,
      experience: '10 years',
      location: 'Chicago, IL',
      availability: 'Available',
      image: '/api/placeholder/100/100',
      specialties: ['Cell Biology', 'Genetics', 'Ecology'],
      nextAvailable: 'Today at 4:00 PM'
    }
  ]


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
              <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Search Tutors
              </h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Find the perfect tutor
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <FilterListIcon className="w-5 h-5" />
            </button>
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
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search tutors by name, subject, or expertise..."
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

        {/* Filters - Mobile with Toggle */}
        {showFilters && (
          <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-visible`} style={{ overflow: 'visible' }}>
            <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Search Filters
            </h3>
            <div className="space-y-4 overflow-visible">
              {/* Subject Dropdown */}
              <div className="relative subject-dropdown-container">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Subject
                </label>
                <button
                  onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                  className={`w-full px-3 py-2 border rounded-xl flex items-center justify-between transition-all duration-200 ${
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
                  <div className="absolute top-full left-0 right-0 z-[9999] mt-1">
                    <div className={`rounded-xl shadow-xl border overflow-hidden max-h-60 overflow-y-auto ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-200'
                    }`}>
                      {subjectOptions.map((option, index) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSubject(option.value)
                            setShowSubjectDropdown(false)
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center transition-colors duration-150 ${
                            option.value === subject
                              ? theme === 'dark'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 text-blue-700'
                              : theme === 'dark'
                                ? 'text-gray-300 hover:bg-gray-600'
                                : 'text-gray-700 hover:bg-gray-50'
                          } ${index !== subjectOptions.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''}`}
                        >
                          <span className="font-medium">{option.label}</span>
                          {option.value === subject && (
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

              {/* Rating Dropdown */}
              <div className="relative rating-dropdown-container">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Rating
                </label>
                <button
                  onClick={() => setShowRatingDropdown(!showRatingDropdown)}
                  className={`w-full px-3 py-2 border rounded-xl flex items-center justify-between transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <div className="flex items-center">
                    <span className="font-medium">{getSelectedRating().label}</span>
                  </div>
                  <div className={`transform transition-transform duration-200 ${showRatingDropdown ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {showRatingDropdown && (
                  <div className="absolute top-full left-0 right-0 z-[9999] mt-1">
                    <div className={`rounded-xl shadow-xl border overflow-hidden ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-200'
                    }`}>
                      {ratingOptions.map((option, index) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setRating(option.value)
                            setShowRatingDropdown(false)
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center transition-colors duration-150 ${
                            option.value === rating
                              ? theme === 'dark'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 text-blue-700'
                              : theme === 'dark'
                                ? 'text-gray-300 hover:bg-gray-600'
                                : 'text-gray-700 hover:bg-gray-50'
                          } ${index !== ratingOptions.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''}`}
                        >
                          <span className="font-medium">{option.label}</span>
                          {option.value === rating && (
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

              {/* Availability Dropdown */}
              <div className="relative availability-dropdown-container">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Availability
                </label>
                <button
                  onClick={() => setShowAvailabilityDropdown(!showAvailabilityDropdown)}
                  className={`w-full px-3 py-2 border rounded-xl flex items-center justify-between transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <div className="flex items-center">
                    <span className="font-medium">{getSelectedAvailability().label}</span>
                  </div>
                  <div className={`transform transition-transform duration-200 ${showAvailabilityDropdown ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {showAvailabilityDropdown && (
                  <div className="absolute top-full left-0 right-0 z-[9999] mt-1">
                    <div className={`rounded-xl shadow-xl border overflow-hidden ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-200'
                    }`}>
                      {availabilityOptions.map((option, index) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setAvailability(option.value)
                            setShowAvailabilityDropdown(false)
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center transition-colors duration-150 ${
                            option.value === availability
                              ? theme === 'dark'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 text-blue-700'
                              : theme === 'dark'
                                ? 'text-gray-300 hover:bg-gray-600'
                                : 'text-gray-700 hover:bg-gray-50'
                          } ${index !== availabilityOptions.length - 1 ? 'border-b border-gray-200 dark:border-gray-600' : ''}`}
                        >
                          <span className="font-medium">{option.label}</span>
                          {option.value === availability && (
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
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Available Tutors ({tutors.length})
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} disabled:opacity-50`}
            >
              <ArrowBackIcon className="w-4 h-4" />
            </button>
            <span className={`px-2 py-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {page}/{totalPages}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} disabled:opacity-50`}
            >
              <ArrowForwardIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading/Empty States */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Đang tải gia sư...
            </div>
          </div>
        ) : tutors.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Không tìm thấy gia sư phù hợp
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tutors.map((tutor) => (
            <Card
              key={tutor.id} 
              className={`overflow-hidden border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{
                borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                boxShadow: 'none !important'
              }}
            >
              <div className="p-4">
                {/* Tutor Header */}
                <div className="flex items-center mb-3">
                  <Avatar
                    src={tutor.avatar}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: getAvatarColor(tutor.name),
                      fontSize: '1.125rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getInitials(tutor.name)}
                  </Avatar>
                  <div className="ml-3 flex-1">
                    <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {tutor.name}
                    </h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {tutor.subjects?.[0] || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Rating & Status */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < Math.floor(tutor.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className={`text-xs ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {tutor.rating?.toFixed(1) || '0.0'} ({tutor.totalReviews || 0})
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    tutor.verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tutor.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>

                {/* Bio */}
                {tutor.bio && (
                  <div className="mb-3">
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                      {tutor.bio}
                    </p>
                  </div>
                )}

                {/* Subjects */}
                {tutor.subjects && tutor.subjects.length > 0 && (
                  <div className="mb-3">
                    <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Môn dạy:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tutor.subjects.slice(0, 3).map((subject: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {subject}
                        </span>
                      ))}
                      {tutor.subjects.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{tutor.subjects.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button 
                    size="small" 
                    variant="outlined"
                    className="flex-1"
                    onClick={() => {
                      setSelectedTutor(tutor)
                      setShowTutorModal(true)
                    }}
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
                    Xem hồ sơ
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained"
                    disabled={!tutor.verified}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => navigate('/student/book', { state: { tutorId: tutor.id } })}
                  >
                    Đặt lịch
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        )}

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
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/student/chatbot')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} transition-colors`}
                >
                  <ChatIcon className="mr-3 w-4 h-4" />
                  Contact Support
                </button>
                <button 
                  onClick={() => navigate('/student/progress')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} transition-colors`}
                >
                  <VideoCallIcon className="mr-3 w-4 h-4" />
                  Video Tutorial
                </button>
                <button 
                  onClick={() => navigate('/common/profile')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} transition-colors`}
                >
                  <PersonIcon className="mr-3 w-4 h-4" />
                  Find Centers
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

                {/* Quick Actions - Moved to top */}
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

                {/* Search Tips */}
                <div className="mb-8">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    SEARCH TIPS
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Use specific subjects
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Search for "Calculus" or "Physics"
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Check availability
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Look for "Available Now"
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Read reviews
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Check ratings before booking
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Popular Subjects */}
                <div className="mb-8">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    POPULAR SUBJECTS
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {subjects.slice(0, 6).map((subjectItem, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSubject(subjectItem)
                          setMobileOpen(false)
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          subject === subjectItem
                            ? 'bg-blue-100 text-blue-800'
                            : `${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                        }`}
                      >
                        {subjectItem}
                      </button>
                    ))}
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

      {/* Tutor Detail Modal */}
      {showTutorModal && selectedTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowTutorModal(false)}></div>
          <div className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="p-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Hồ sơ Gia sư
                </h2>
                <button 
                  onClick={() => setShowTutorModal(false)}
                  className={`p-2 rounded-full hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : ''}`}
                >
                  <CloseIcon className={theme === 'dark' ? 'text-white' : 'text-gray-900'} />
                </button>
              </div>

              {/* Tutor Info */}
              <div className="flex items-start space-x-4 mb-4">
                <Avatar
                  src={selectedTutor.avatar}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: '#3b82f6',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {getInitials(selectedTutor.name)}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {selectedTutor.name}
                    </h3>
                    {selectedTutor.verified && (
                      <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {selectedTutor.rating?.toFixed(1) || 'N/A'}
                      </span>
                      <span className={`ml-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        ({selectedTutor.totalReviews || 0})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {selectedTutor.bio}
              </p>

              {/* Subjects */}
              {selectedTutor.subjects && selectedTutor.subjects.length > 0 && (
                <div className="mb-4">
                  <h4 className={`font-semibold text-sm mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Môn học
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTutor.subjects.map((sub: string, idx: number) => (
                      <span 
                        key={idx}
                        className={`px-2 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {selectedTutor.education && (
                <div className="mb-4">
                  <h4 className={`font-semibold text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Học vấn
                  </h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedTutor.education}
                  </p>
                </div>
              )}

              {/* Experience */}
              {selectedTutor.experience && (
                <div className="mb-4">
                  <h4 className={`font-semibold text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Kinh nghiệm
                  </h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedTutor.experience}
                  </p>
                </div>
              )}

              {/* Languages */}
              {selectedTutor.languages && selectedTutor.languages.length > 0 && (
                <div className="mb-4">
                  <h4 className={`font-semibold text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Ngôn ngữ
                  </h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedTutor.languages.join(', ')}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 mt-4">
                <Button 
                  variant="contained"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    setShowTutorModal(false)
                    navigate('/student/book', { state: { tutorId: selectedTutor.id } })
                  }}
                  disabled={!selectedTutor.verified}
                >
                  Đặt lịch học
                </Button>
                <Button 
                  variant="outlined"
                  className="w-full"
                  onClick={() => {
                    setShowTutorModal(false)
                    navigate('/student/messages', { state: { tutorId: selectedTutor.id } })
                  }}
                  style={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                  }}
                >
                  Nhắn tin
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchTutorsMobile
