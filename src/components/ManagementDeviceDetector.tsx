import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ManagementDashboard from '../pages/management/ManagementDashboard'
import ManagementDashboardMobile from '../pages/management/ManagementDashboardMobile'
import ApprovalRequests from '../pages/management/ApprovalRequests'
import ApprovalRequestsMobile from '../pages/management/ApprovalRequestsMobile'
import ReportsAnalytics from '../pages/management/ReportsAnalytics'
import ReportsAnalyticsMobile from '../pages/management/ReportsAnalyticsMobile'
import AwardCredits from '../pages/management/AwardCredits'
import AwardCreditsMobile from '../pages/management/AwardCreditsMobile'

const ManagementDeviceDetector: React.FC = () => {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const isSmallScreen = window.innerWidth <= 768
      
      setIsMobile(isMobileDevice || isSmallScreen)
      setIsLoading(false)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Determine which component to render based on device and route
  const renderComponent = () => {
    if (isMobile) {
      // Check specific mobile routes
      if (location.pathname === '/management/approval') {
        return <ApprovalRequestsMobile />
      }
      if (location.pathname === '/management/reports') {
        return <ReportsAnalyticsMobile />
      }
      if (location.pathname === '/management/awards') {
        return <AwardCreditsMobile />
      }
      // For other management routes, use the mobile dashboard
      return <ManagementDashboardMobile />
    }

    // Desktop routes
    if (location.pathname === '/management/approval') {
      return <ApprovalRequests />
    }
    if (location.pathname === '/management/reports') {
      return <ReportsAnalytics />
    }
    if (location.pathname === '/management/awards') {
      return <AwardCredits />
    }
    return <ManagementDashboard />
  }

  return (
    <div className="relative">
      {/* Device Switch removed as per user request */}
      
      {renderComponent()}
    </div>
  )
}

export default ManagementDeviceDetector
