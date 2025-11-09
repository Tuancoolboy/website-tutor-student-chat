import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import TutorDashboard from '../pages/tutor/TutorDashboard'
import TutorDashboardMobile from '../pages/tutor/TutorDashboardMobile'
import HandleCancelReschedule from '../pages/tutor/HandleCancelReschedule'
import HandleCancelRescheduleMobile from '../pages/tutor/HandleCancelRescheduleMobile'
import ManageSessions from '../pages/tutor/ManageSessions'
import ManageSessionsMobile from '../pages/tutor/ManageSessionsMobile'
import Messages from '../pages/tutor/Messages'
import MessagesMobile from '../pages/tutor/MessagesMobile'
import SetAvailability from '../pages/tutor/SetAvailability'
import SetAvailabilityMobile from '../pages/tutor/SetAvailabilityMobile'
import TrackStudentProgress from '../pages/tutor/TrackStudentProgress'
import TrackStudentProgressMobile from '../pages/tutor/TrackStudentProgressMobile'
import TutorSessionDetail from '../pages/tutor/TutorSessionDetail'
import TutorSessionDetailMobile from '../pages/tutor/TutorSessionDetailMobile'
import TutorLMS from '../pages/tutor/TutorLMS'
import TutorLMSMobile from '../pages/tutor/TutorLMSMobile'

const TutorDeviceDetector: React.FC = () => {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Determine which component to render based on device and route
  const renderComponent = () => {
    if (isMobile) {
      // Check specific mobile routes
      if (location.pathname === '/tutor/availability') {
        return <SetAvailabilityMobile />
      }
      if (location.pathname === '/tutor/cancel-reschedule') {
        return <HandleCancelRescheduleMobile />
      }
      if (location.pathname === '/tutor/sessions') {
        return <ManageSessionsMobile />
      }
      if (location.pathname === '/tutor/lms') {
        return <TutorLMSMobile />
      }
      if (location.pathname === '/tutor/messages') {
        return <MessagesMobile />
      }
      if (location.pathname === '/tutor/track-progress') {
        return <TrackStudentProgressMobile />
      }
      if (location.pathname.startsWith('/tutor/session/') || location.pathname.startsWith('/tutor/class/')) {
        return <TutorSessionDetailMobile />
      }
      return <TutorDashboardMobile />
    }

    // Desktop routes
    if (location.pathname === '/tutor/availability') {
      return <SetAvailability />
    }
    if (location.pathname === '/tutor/cancel-reschedule') {
      return <HandleCancelReschedule />
    }
    if (location.pathname === '/tutor/sessions') {
      return <ManageSessions />
    }
    if (location.pathname === '/tutor/lms') {
      return <TutorLMS />
    }
    if (location.pathname === '/tutor/messages') {
      return <Messages />
    }
    if (location.pathname === '/tutor/track-progress') {
      return <TrackStudentProgress />
    }
    if (location.pathname.startsWith('/tutor/session/') || location.pathname.startsWith('/tutor/class/')) {
      return <TutorSessionDetail />
    }
    return <TutorDashboard />
  }

  return (
    <div className="relative">
      {/* Device Switch removed as per user request */}
      
      {renderComponent()}
    </div>
  )
}

export default TutorDeviceDetector
