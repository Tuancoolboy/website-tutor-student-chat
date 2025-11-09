import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Login from '../pages/common/Login'
import LoginMobile from '../pages/common/LoginMobile'
import Register from '../pages/common/Register'
import RegisterMobile from '../pages/common/RegisterMobile'
import ProfileManagement from '../pages/common/ProfileManagement'
import ProfileManagementMobile from '../pages/common/ProfileManagementMobile'
import DigitalLibraryAccess from '../pages/common/DigitalLibraryAccess'
import DigitalLibraryAccessMobile from '../pages/common/DigitalLibraryAccessMobile'
import OnlineCommunityForum from '../pages/common/OnlineCommunityForum'
import OnlineCommunityForumMobile from '../pages/common/OnlineCommunityForumMobile'
import CreatePost from '../pages/common/CreatePost'
import CreatePostMobile from '../pages/common/CreatePostMobile'
import NotificationsCenter from '../pages/common/NotificationsCenter'
import NotificationsCenterMobile from '../pages/common/NotificationsCenterMobile'

const CommonDeviceDetector: React.FC = () => {
  const location = useLocation()
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

  // Determine which component to render based on device and route
  const renderComponent = () => {
    if (isMobile) {
      // Check specific mobile routes
      if (location.pathname === '/common' || location.pathname === '/' || location.pathname === '/login') {
        return <LoginMobile />
      }
      if (location.pathname === '/common/login') {
        return <LoginMobile />
      }
      if (location.pathname === '/common/register' || location.pathname === '/register') {
        return <RegisterMobile />
      }
      if (location.pathname === '/common/profile') {
        return <ProfileManagementMobile />
      }
      if (location.pathname === '/common/library') {
        return <DigitalLibraryAccessMobile />
      }
      if (location.pathname === '/common/forum') {
        return <OnlineCommunityForumMobile />
      }
      if (location.pathname === '/common/forum/create') {
        return <CreatePostMobile />
      }
      if (location.pathname === '/common/notifications') {
        return <NotificationsCenterMobile />
      }
      // For other common routes, use desktop versions for now
      // You can add mobile versions later if needed
      return <Login />
    }

    // Desktop routes
    if (location.pathname === '/common' || location.pathname === '/' || location.pathname === '/login') {
      return <Login />
    }
    if (location.pathname === '/common/login') {
      return <Login />
    }
    if (location.pathname === '/common/register' || location.pathname === '/register') {
      return <Register />
    }
    if (location.pathname === '/common/profile') {
      return <ProfileManagement />
    }
    if (location.pathname === '/common/library') {
      return <DigitalLibraryAccess />
    }
    if (location.pathname === '/common/forum') {
      return <OnlineCommunityForum />
    }
    if (location.pathname === '/common/forum/create') {
      return <CreatePost />
    }
    if (location.pathname === '/common/notifications') {
      return <NotificationsCenter />
    }
    return <Login />
  }

  return (
    <div className="relative">
      {/* Device Switch Button - Disabled on all pages */}
      {/* {!isMobile && location.pathname !== '/common' && location.pathname !== '/' && (
        <div className="fixed top-4 right-4 z-50">
          <DeviceSwitch 
            currentDevice="desktop" 
            onDeviceChange={(isMobile) => handleDeviceSwitch(isMobile)}
          />
        </div>
      )} */}

      {/* Render the appropriate component */}
      {renderComponent()}
    </div>
  )
}

export default CommonDeviceDetector
