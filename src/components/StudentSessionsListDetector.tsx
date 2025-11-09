import React, { useState, useEffect } from 'react'
import SessionsList from '../pages/student/SessionsList'
import SessionsListMobile from '../pages/student/SessionsListMobile'

const StudentSessionsListDetector: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile ? <SessionsListMobile /> : <SessionsList />
}

export default StudentSessionsListDetector

