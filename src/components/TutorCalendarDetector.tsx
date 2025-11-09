import React, { useState, useEffect } from 'react'
import Calendar from '../pages/tutor/Calendar'
import CalendarMobile from '../pages/tutor/CalendarMobile'

const TutorCalendarDetector: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkDevice = () => {
      // Check for manual override first
      const manualOverride = localStorage.getItem('deviceOverride')
      if (manualOverride) {
        setIsMobile(manualOverride === 'mobile')
        setIsLoading(false)
        return
      }
      
      // Auto-detect device
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
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

  // device switch removed

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Teaching Calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Render the appropriate component */}
      {isMobile ? <CalendarMobile /> : <Calendar />}
    </div>
  )
}

export default TutorCalendarDetector
