import React, { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  People,
  Star,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  DateRange as DateRangeIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Dashboard as DashboardIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material'
import { Avatar } from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { axisClasses } from '@mui/x-charts/ChartsAxis'
import { legendClasses } from '@mui/x-charts/ChartsLegend'
import Card from '../../components/ui/Card'

const ReportsAnalyticsMobile: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [activeMenu, setActiveMenu] = useState('reports-analytics')
  

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
    { id: 'approval-requests', label: 'Approval Requests', icon: <AssignmentIcon />, path: '/management/approval' },
    { id: 'reports-analytics', label: 'Reports & Analytics', icon: <BarChartIcon />, path: '/management/reports' },
    { id: 'award-credits', label: 'Award Credits', icon: <Star />, path: '/management/awards' },
    { id: 'user-management', label: 'User Management', icon: <People />, path: '/management/users' },
    { id: 'system-settings', label: 'System Settings', icon: <SettingsIcon />, path: '/management/settings' },
    { id: 'security', label: 'Security', icon: <SecurityIcon />, path: '/management/security' },
    { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon />, path: '/management/notifications' }
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

  const analyticsData = {
    overview: {
      totalUsers: 1247,
      activeUsers: 892,
      totalSessions: 3456
    },
    userGrowth: [
      { month: 'Jan', users: 120, growth: 5.2 },
      { month: 'Feb', users: 135, growth: 12.5 },
      { month: 'Mar', users: 148, growth: 9.6 },
      { month: 'Apr', users: 162, growth: 9.5 },
      { month: 'May', users: 175, growth: 8.0 },
      { month: 'Jun', users: 189, growth: 8.0 }
    ],
    sessionStats: [
      { subject: 'Mathematics', sessions: 1245, completion: 89, rating: 4.8 },
      { subject: 'Physics', sessions: 892, completion: 85, rating: 4.7 },
      { subject: 'Chemistry', sessions: 678, completion: 82, rating: 4.6 },
      { subject: 'Biology', sessions: 456, completion: 88, rating: 4.9 }
    ],
    topPerformers: [
      { name: 'Dr. Sarah Wilson', subject: 'Mathematics', sessions: 156, rating: 4.9, students: 45 },
      { name: 'Prof. Mike Chen', subject: 'Physics', sessions: 134, rating: 4.8, students: 38 },
      { name: 'Dr. Alice Brown', subject: 'Chemistry', sessions: 128, rating: 4.7, students: 42 },
      { name: 'Prof. David Lee', subject: 'Biology', sessions: 112, rating: 4.8, students: 35 }
    ]
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
                Reports & Analytics
              </h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                System analytics and reporting
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

        {/* Analytics Overview - Mobile */}
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Analytics Overview
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600 mb-1">{analyticsData.overview.totalUsers.toLocaleString()}</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Users</div>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600 mb-1">{analyticsData.overview.activeUsers.toLocaleString()}</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Active Users</div>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600 mb-1">{analyticsData.overview.totalSessions.toLocaleString()}</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Sessions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Filters - Mobile */}
        <Card
          className={`p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            boxShadow: 'none !important'
          }}
        >
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Report Filters
          </h3>
          
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
                    Time Period
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: '7d', label: '7 Days' },
                      { value: '30d', label: '30 Days' },
                      { value: '90d', label: '90 Days' },
                      { value: '1y', label: '1 Year' }
                    ].map((period) => (
                      <button
                        key={period.value}
                        onClick={() => setSelectedPeriod(period.value)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          selectedPeriod === period.value
                            ? 'bg-blue-100 text-blue-700'
                            : `${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Metrics
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'all', label: 'All Metrics' },
                      { value: 'users', label: 'Users' },
                      { value: 'sessions', label: 'Sessions' }
                    ].map((metric) => (
                      <button
                        key={metric.value}
                        onClick={() => setSelectedMetric(metric.value)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          selectedMetric === metric.value
                            ? 'bg-blue-100 text-blue-700'
                            : `${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                        }`}
                      >
                        {metric.label}
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
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          <button 
            className={`flex items-center justify-center px-4 py-3 rounded-lg border ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            } transition-colors`}
          >
            <DateRangeIcon className="w-4 h-4 mr-2" />
            Custom Range
          </button>
        </div>

        {/* Subject Performance - Mobile */}
        <Card
          className={`p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            boxShadow: 'none !important'
          }}
        >
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Subject Performance
          </h3>
          <div className="space-y-3">
            {analyticsData.sessionStats.map((stat, index) => (
              <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {stat.subject}
                  </span>
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.sessions} sessions
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${stat.completion}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {stat.completion}% completion
                  </span>
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    ⭐ {stat.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performers - Mobile */}
        <Card
          className={`p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            boxShadow: 'none !important'
          }}
        >
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Top Performers
          </h3>
          <div className="space-y-3">
            {analyticsData.topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center">
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: getAvatarColor(performer.name),
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      mr: 2
                    }}
                  >
                    {getInitials(performer.name)}
                  </Avatar>
                  <div>
                    <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {performer.name}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {performer.subject}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {performer.sessions} sessions
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    ⭐ {performer.rating} • {performer.students} students
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

         {/* User Growth Chart - Mobile */}
         <Card
           className={`p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
           style={{
             borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
             backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
             boxShadow: 'none !important'
           }}
         >
           <div className="flex items-center justify-between mb-4">
             <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
               User Growth Trend
             </h3>
             <div className="flex items-center space-x-2">
               <div className="flex items-center">
                 <div className="w-2 h-2 bg-blue-500 rounded mr-1"></div>
                 <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Users</span>
               </div>
               <div className="flex items-center">
                 <div className="w-2 h-2 bg-green-500 rounded mr-1"></div>
                 <span className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Growth %</span>
               </div>
             </div>
           </div>
           
           {/* Simple Mobile MUI X Line Chart */}
           <div className="h-64">
             <LineChart
               height={200}
               series={[
                 {
                   data: analyticsData.userGrowth.map(d => d.users),
                   label: 'Users',
                   color: '#3b82f6',
                   showMark: true
                 },
                 {
                   data: analyticsData.userGrowth.map(d => d.growth),
                   label: 'Growth %',
                   color: '#10b981',
                   showMark: true
                 }
               ]}
               xAxis={[{
                 scaleType: 'point',
                 data: analyticsData.userGrowth.map(d => d.month)
               }]}
               yAxis={[{
                 valueFormatter: (value: number) => value.toString()
               }]}
               grid={{ vertical: true, horizontal: true }}
               margin={{ left: 50, right: 24, top: 10, bottom: 20 }}
               sx={{
                 [`& .${axisClasses.root}`]: {
                   [`& .${axisClasses.tickLabel}`]: {
                     fill: theme === 'dark' ? '#ffffff' : '#374151',
                     fontSize: '0.75rem',
                     fontWeight: 500
                   },
                   [`& .${axisClasses.label}`]: {
                     fill: theme === 'dark' ? '#ffffff' : '#374151',
                     fontSize: '0.75rem',
                     fontWeight: 500
                   },
                   [`& .${axisClasses.tick}, .${axisClasses.line}`]: {
                     stroke: theme === 'dark' ? '#4b5563' : '#e5e7eb',
                     strokeWidth: 1
                   }
                 },
                 [`& .${legendClasses.root} .${legendClasses.label}`]: {
                   fill: theme === 'dark' ? '#ffffff' : '#374151',
                   fontSize: '0.75rem',
                   fontWeight: 500
                 },
                 '& .MuiChartsGrid-root .MuiChartsGrid-line': {
                   stroke: theme === 'dark' ? '#4b5563' : '#e5e7eb',
                   strokeWidth: 1
                 }
               }}
             />
           </div>
           
           {/* Mobile Chart Summary */}
           <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
             <div className="grid grid-cols-3 gap-2 text-center">
               <div>
                 <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                   {analyticsData.userGrowth[analyticsData.userGrowth.length - 1].users}
                 </p>
                 <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                   Current
                 </p>
               </div>
               <div>
                 <p className={`text-lg font-bold text-green-600`}>
                   +{Math.round(analyticsData.userGrowth.reduce((sum, data) => sum + data.growth, 0) / analyticsData.userGrowth.length)}%
                 </p>
                 <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                   Avg Growth
                 </p>
               </div>
               <div>
                 <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                   {analyticsData.userGrowth[analyticsData.userGrowth.length - 1].users - analyticsData.userGrowth[0].users}
                 </p>
                 <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                   Total
                 </p>
               </div>
             </div>
           </div>
         </Card>

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
                  <AssignmentIcon className="w-6 h-6 text-green-600 mb-2" />
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Approvals
                  </span>
                </button>
                <button 
                  onClick={() => navigate('/management/awards')}
                  className={`flex flex-col items-center p-3 rounded-lg border ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                >
                  <Star className="w-6 h-6 text-purple-600 mb-2" />
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Awards
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

                {/* Mobile Analytics Overview */}
                <div className="mb-8">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    ANALYTICS OVERVIEW
                  </h3>
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Users:</span>
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {analyticsData.overview.totalUsers.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Active Users:</span>
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {analyticsData.overview.activeUsers.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Sessions:</span>
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {analyticsData.overview.totalSessions.toLocaleString()}
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
    </div>
  )
}

export default ReportsAnalyticsMobile
