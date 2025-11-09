import React, { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button as MuiButton,
  Typography,
  Avatar
} from '@mui/material'
import { 
  Search, 
  Add,
  Person,
  Assignment,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp,
  BarChart as BarChartIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  ArrowForward as ArrowForwardIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Star as StarIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const AwardCreditsMobile: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false)
  const [creditAmount, setCreditAmount] = useState('')
  const [awardReason, setAwardReason] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [activeMenu, setActiveMenu] = useState('award-credits')
  

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
    setMobileOpen(false)
  }

  // Menu items for navigation
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/management' },
    { id: 'approval-requests', label: 'Approval Requests', icon: <Assignment />, path: '/management/approval' },
    { id: 'reports-analytics', label: 'Reports & Analytics', icon: <BarChartIcon />, path: '/management/reports' },
    { id: 'award-credits', label: 'Award Credits', icon: <StarIcon />, path: '/management/awards' },
    { id: 'user-management', label: 'User Management', icon: <Person />, path: '/management/users' },
    { id: 'system-settings', label: 'System Settings', icon: <SettingsIcon />, path: '/management/settings' },
    { id: 'security', label: 'Security', icon: <SecurityIcon />, path: '/management/security' },
    { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon />, path: '/management/notifications' }
  ]

  const users = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@email.com',
      role: 'Student',
      currentCredits: 150,
      totalEarned: 300,
      lastAward: '2024-01-10',
      achievements: ['Perfect Attendance', 'Top Performer', 'Course Completion']
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      role: 'Tutor',
      currentCredits: 250,
      totalEarned: 500,
      lastAward: '2024-01-12',
      achievements: ['Excellent Teaching', 'Student Satisfaction', 'Innovation Award']
    },
    {
      id: 3,
      name: 'Mike Chen',
      email: 'mike.chen@email.com',
      role: 'Student',
      currentCredits: 75,
      totalEarned: 200,
      lastAward: '2024-01-08',
      achievements: ['Course Completion', 'Active Participation']
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice.brown@email.com',
      role: 'Tutor',
      currentCredits: 400,
      totalEarned: 800,
      lastAward: '2024-01-14',
      achievements: ['Mentor of the Year', 'Research Excellence', 'Community Service']
    }
  ]

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAwardCredits = (user: any) => {
    setSelectedUser(user)
    setIsAwardDialogOpen(true)
  }

  const handleSubmitAward = () => {
    console.log('Award credits:', {
      user: selectedUser,
      amount: creditAmount,
      reason: awardReason
    })
    setIsAwardDialogOpen(false)
    setCreditAmount('')
    setAwardReason('')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Student': return 'bg-blue-100 text-blue-800'
      case 'Tutor': return 'bg-green-100 text-green-800'
      case 'Admin': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} pb-16`}>
      {/* Mobile Header */}
      <div className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between p-4">
          <div 
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/management')}
          >
            <div className="w-8 h-8 flex items-center justify-center mr-3">
              <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-8 h-8" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Award Credits
              </h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage training credits
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

        {/* Credit Stats - Mobile */}
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Credit Statistics
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600 mb-1">{users.length}</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Users</div>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600 mb-1">{users.reduce((sum, user) => sum + user.currentCredits, 0)}</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Credits</div>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600 mb-1">{Math.round(users.reduce((sum, user) => sum + user.currentCredits, 0) / users.length)}</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Avg Credits</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters - Mobile */}
        <Card
          className={`p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            boxShadow: 'none !important'
          }}
        >
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Search Users
          </h3>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search by name, email, or role..."
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
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg border ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            } transition-colors`}
          >
            <FilterListIcon className="w-4 h-4 mr-2" />
            Advanced Filters
            <div className={`ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>
              <ArrowForwardIcon className="w-4 h-4" />
            </div>
          </button>

          {/* Advanced Filters Content */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    User Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['all', 'student', 'tutor', 'admin'].map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          // Filter logic would go here
                          console.log('Filter by role:', role)
                        }}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          role === 'all'
                            ? 'bg-blue-100 text-blue-700'
                            : `${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                        }`}
                      >
                        {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Actions - Mobile */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            className={`flex items-center justify-center px-4 py-3 rounded-lg border ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            } transition-colors`}
          >
            <Add className="w-4 h-4 mr-2" />
            Bulk Award
          </button>
          <button 
            className={`flex items-center justify-center px-4 py-3 rounded-lg border ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            } transition-colors`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </button>
        </div>

        {/* Users List - Mobile */}
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className={`overflow-hidden border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              style={{
                borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                boxShadow: 'none !important'
              }}
            >
              <div className="p-4">
                {/* User Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: getAvatarColor(user.name),
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        mr: 2
                      }}
                    >
                      {getInitials(user.name)}
                    </Avatar>
                    <div>
                      <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {user.name}
                      </h3>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>

                {/* Credit Information */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Current Credits:
                    </span>
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {user.currentCredits}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Total Earned:
                    </span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {user.totalEarned}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Last Award:
                    </span>
                    <span className={`text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {user.lastAward}
                    </span>
                  </div>
                </div>

                {/* Achievements */}
                <div className="mb-3">
                  <h4 className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Recent Achievements:
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {user.achievements.slice(0, 2).map((achievement, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                      >
                        {achievement}
                      </span>
                    ))}
                    {user.achievements.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{user.achievements.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button 
                    size="small" 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleAwardCredits(user)}
                  >
                    <Add className="w-3 h-3 mr-1" />
                    Award Credits
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
                    <Person className="w-3 h-3 mr-1" />
                    View Profile
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
                  onClick={() => navigate('/management')}
                  className={`flex flex-col items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                >
                  <ArrowBackIcon className="w-6 h-6 text-blue-600 mb-2" />
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Dashboard
                  </span>
                </button>
                <button 
                  onClick={() => navigate('/management/approval')}
                  className={`flex flex-col items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                >
                  <Assignment className="w-6 h-6 text-green-600 mb-2" />
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Approvals
                  </span>
                </button>
                <button 
                  onClick={() => navigate('/management/reports')}
                  className={`flex flex-col items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                >
                  <BarChartIcon className="w-6 h-6 text-purple-600 mb-2" />
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Reports
                  </span>
                </button>
                <button 
                  onClick={() => navigate('/common')}
                  className={`flex flex-col items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                >
                  <ArrowBackIcon className="w-6 h-6 text-orange-600 mb-2" />
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Login
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
            <div className="p-6 h-full flex flex-col overflow-hidden">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <div 
                  className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/management')}
                >
                  <div className="w-8 h-8 flex items-center justify-center mr-3">
                    <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-8 h-8" />
                  </div>
                  <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    HCMUT Admin
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
                        navigate('/management')
                        setMobileOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                    >
                      <ArrowBackIcon className="mr-3 w-4 h-4" />
                      Back to Dashboard
                    </button>
                  </div>
                </div>

                {/* Mobile Credit Stats */}
                <div className="mb-8">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    CREDIT STATS
                  </h3>
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Users:</span>
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {users.length}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Credits:</span>
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {users.reduce((sum, user) => sum + user.currentCredits, 0)}
                        </span>
                      </div>
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
        </div>
      )}

      {/* Award Credits Dialog */}
      <Dialog 
        open={isAwardDialogOpen} 
        onClose={() => setIsAwardDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            color: theme === 'dark' ? '#ffffff' : '#111827',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
          }}
        >
          Award Credits to {selectedUser?.name}
        </DialogTitle>
        <DialogContent 
          sx={{ 
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
          }}
        >
          <div className="space-y-4 mt-4">
            <div>
              <Typography 
                variant="body1" 
                gutterBottom
                sx={{ 
                  color: theme === 'dark' ? '#ffffff' : '#111827',
                  fontWeight: '500'
                }}
              >
                User: {selectedUser?.name} ({selectedUser?.role})
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme === 'dark' ? '#d1d5db' : '#6b7280',
                  fontWeight: '400'
                }}
              >
                Current Credits: {selectedUser?.currentCredits}
              </Typography>
            </div>

            <div>
              <TextField
                fullWidth
                label="Credit Amount"
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Enter number of credits to award"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#ffffff' : '#111827',
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    '& fieldset': {
                      borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: theme === 'dark' ? '#3b82f6' : '#3b82f6',
                  },
                }}
              />
            </div>

            <div>
              <TextField
                fullWidth
                label="Reason for Award"
                multiline
                rows={3}
                value={awardReason}
                onChange={(e) => setAwardReason(e.target.value)}
                placeholder="Enter reason for awarding credits..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: theme === 'dark' ? '#ffffff' : '#111827',
                    backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                    '& fieldset': {
                      borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme === 'dark' ? '#3b82f6' : '#3b82f6',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: theme === 'dark' ? '#3b82f6' : '#3b82f6',
                  },
                }}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions 
          sx={{ 
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            padding: '16px 24px'
          }}
        >
          <MuiButton 
            onClick={() => setIsAwardDialogOpen(false)}
            sx={{
              color: theme === 'dark' ? '#ffffff' : '#111827',
              '&:hover': {
                backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6'
              }
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleSubmitAward} 
            variant="contained"
            color="success"
            sx={{
              backgroundColor: '#10b981',
              '&:hover': {
                backgroundColor: '#059669'
              }
            }}
          >
            Award Credits
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default AwardCreditsMobile
