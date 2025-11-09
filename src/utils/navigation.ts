/**
 * Navigation utilities for role-based routing
 */

export const getDashboardRoute = (userRole?: string): string => {
  // Try to get user from localStorage if not provided
  if (!userRole) {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        userRole = user.role
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
    }
  }

  // Route based on role
  switch (userRole) {
    case 'student':
      return '/student'
    case 'tutor':
      return '/tutor'
    case 'management':
      return '/management'
    default:
      // If no role or unknown role, go to login
      return '/login'
  }
}

export const navigateToDashboard = (navigate: (path: string) => void, userRole?: string) => {
  const dashboardRoute = getDashboardRoute(userRole)
  navigate(dashboardRoute)
}

