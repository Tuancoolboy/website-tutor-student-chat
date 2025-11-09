import React, { useState, useEffect } from 'react'
import EvaluateSessionsList from '../pages/student/EvaluateSessionsList'
import EvaluateSessionsListMobile from '../pages/student/EvaluateSessionsListMobile'

const StudentEvaluateListDetector: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword))
      const isSmallScreen = window.innerWidth < 768
      
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile ? <EvaluateSessionsListMobile /> : <EvaluateSessionsList />
}

export default StudentEvaluateListDetector

