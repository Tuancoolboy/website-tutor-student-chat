import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentDashboardMobile from '../pages/student/StudentDashboardMobile'
import BookSession from '../pages/student/BookSession'
import BookSessionMobile from '../pages/student/BookSessionMobile'
import ChatbotSupport from '../pages/student/ChatbotSupport'
import ChatbotSupportMobile from '../pages/student/ChatbotSupportMobile'
import EvaluateSession from '../pages/student/EvaluateSession'
import EvaluateSessionMobile from '../pages/student/EvaluateSessionMobile'
import StudentMessages from '../pages/student/Messages'
import MessagesMobile from '../pages/student/MessagesMobile'
import SearchTutors from '../pages/student/SearchTutors'
import SearchTutorsMobile from '../pages/student/SearchTutorsMobile'
import SessionDetail from '../pages/student/SessionDetail'
import SessionDetailMobile from '../pages/student/SessionDetailMobile'
import ViewProgress from '../pages/student/ViewProgress'
import ViewProgressMobile from '../pages/student/ViewProgressMobile'

const DeviceDetector: React.FC = () => {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

        // Determine which component to render based on route
        const renderComponent = () => {
          if (isMobile) {
            // Check specific mobile routes
            if (location.pathname === '/student/book') {
              return <BookSessionMobile />
            }
            if (location.pathname === '/student/chatbot') {
              return <ChatbotSupportMobile />
            }
            if (location.pathname.startsWith('/student/evaluate/')) {
              return <EvaluateSessionMobile />
            }
            if (location.pathname === '/student/messages') {
              return <MessagesMobile />
            }
            if (location.pathname === '/student/search') {
              return <SearchTutorsMobile />
            }
            if (location.pathname.startsWith('/student/session')) {
              return <SessionDetailMobile />
            }
            if (location.pathname === '/student/progress') {
              return <ViewProgressMobile />
            }
            return <StudentDashboardMobile />
          }

          // Desktop routes
          if (location.pathname === '/student/book') {
            return <BookSession />
          }
          if (location.pathname === '/student/chatbot') {
            return <ChatbotSupport />
          }
          if (location.pathname.startsWith('/student/evaluate/')) {
            return <EvaluateSession />
          }
          if (location.pathname === '/student/messages') {
            return <StudentMessages />
          }
          if (location.pathname === '/student/search') {
            return <SearchTutors />
          }
          if (location.pathname.startsWith('/student/session')) {
            return <SessionDetail />
          }
          if (location.pathname === '/student/progress') {
            return <ViewProgress />
          }
          return <StudentDashboard />
        }

  return (
    <div className="relative">
      {/* Device Switch removed as per user request */}
      
      {renderComponent()}
    </div>
  )
}

export default DeviceDetector
