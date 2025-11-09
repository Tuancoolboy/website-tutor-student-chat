import React, { useState, useEffect } from 'react'
import SessionDetail from '../pages/student/SessionDetail'
import SessionDetailMobile from '../pages/student/SessionDetailMobile'

const StudentSessionDetailDetector: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile ? <SessionDetailMobile /> : <SessionDetail />
}

export default StudentSessionDetailDetector

