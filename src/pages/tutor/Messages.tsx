import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { Avatar } from '@mui/material'
import { useLongPolling } from '../../hooks/useLongPolling'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { conversationsAPI, usersAPI, authAPI, studentsAPI, uploadAPI } from '../../lib/api'
import { formatDistanceToNow } from 'date-fns'
import { EmojiPicker } from '../../components/EmojiPicker'
import {
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Autorenew as AutorenewIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  MoreVert as MoreVertIcon,
  Menu as MenuIcon,
  BarChart as BarChartIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  VideoCall as VideoCallIcon,
  Chat as ChatIcon,
  Palette as PaletteIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiEmotionsIcon,
  MoreHoriz as MoreHorizIcon,
  OnlinePrediction as OnlinePredictionIcon,
  Close as CloseIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'

const Messages: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('messages')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showThemeOptions, setShowThemeOptions] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [conversations, setConversations] = useState<any[]>([])
  const [users, setUsers] = useState<Record<string, any>>({})
  const [usersLoaded, setUsersLoaded] = useState(0) // Track when users are loaded to force re-render
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [searchUserQuery, setSearchUserQuery] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const [loadingActiveUsers, setLoadingActiveUsers] = useState(false)
  const [showConversationMenu, setShowConversationMenu] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const previousConversationIdRef = useRef<string | null>(null)
  const isLoadingActiveUsersRef = useRef(false)
  const activeUsersIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const activeUsersTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastOnlineUsersRef = useRef<Set<string>>(new Set())
  const usersListCacheRef = useRef<any[]>([]) // Cache users list to avoid repeated fetches
  const usersListCacheTimeRef = useRef<number>(0) // Cache timestamp
  const USERS_CACHE_DURATION = 5 * 60 * 1000 // Cache users for 5 minutes

  // Online Status Hook - Track which users are online via WebSocket
  const { onlineUsers, isUserOnline, isConnected: isWebSocketConnected } = useOnlineStatus({ enabled: true })

  // Debounce reload conversations to avoid too many API calls
  // Optimized for 2-3 users testing - reduced frequency to prevent lag
  const reloadConversationsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastReloadTimeRef = useRef<number>(0)
  const reloadConversations = useCallback(async (force: boolean = false) => {
    // Prevent too frequent reloads - only reload at most once every 8 seconds (increased from 5)
    const now = Date.now()
    if (!force && now - lastReloadTimeRef.current < 8000) {
      return // Skip reload if less than 8 seconds since last reload
    }
    
    // Clear existing timeout
    if (reloadConversationsTimeoutRef.current) {
      clearTimeout(reloadConversationsTimeoutRef.current)
    }
    
    // Debounce: only reload after 5 seconds of no new messages (increased from 3 seconds)
    // Reduced frequency for better performance when testing with 2-3 users
    reloadConversationsTimeoutRef.current = setTimeout(async () => {
      try {
        lastReloadTimeRef.current = Date.now()
        const response = await conversationsAPI.list()
        if (response.success && response.data) {
          const conversationsData = Array.isArray(response.data) ? response.data : []
          // Update conversations without showing loading indicator
          setConversations(prev => {
            // Only update if data actually changed to prevent unnecessary re-renders
            if (JSON.stringify(prev) !== JSON.stringify(conversationsData)) {
              return conversationsData
            }
            return prev
          })
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to reload conversations:', error)
        }
      }
    }, force ? 0 : 5000) // Wait 5 seconds before reloading (increased from 3 seconds)
  }, [])

  // Long Polling Hook
  const { messages, isPolling, isConnected, sendMessage, loadHistory } = useLongPolling({
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId,
    onMessage: (message) => {
      // Only reload conversations if message is from a different conversation
      // This prevents unnecessary reloads when viewing the active conversation
      if (message.conversationId !== selectedConversationId) {
        // Message from another conversation - reload list to update lastMessage
        reloadConversations()
      }
      // If message is from current conversation, no need to reload conversations list
      // The message is already displayed via polling
    },
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Polling error:', error)
      }
    }
  })

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      setIsCheckingAuth(true)
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.log('No token found, redirecting to login')
          setIsCheckingAuth(false)
          setTimeout(() => navigate('/login'), 100)
          return
        }
        
        const response = await authAPI.getMe()
        if (response.success && response.data) {
          const user = response.data
          // Kiểm tra role - chỉ cho phép tutor truy cập
          if (user.role !== 'tutor') {
            console.log(`User role is ${user.role}, redirecting to appropriate dashboard`)
            setIsCheckingAuth(false)
            // Redirect về dashboard tương ứng với role
            if (user.role === 'student') {
              setTimeout(() => navigate('/student'), 100)
            } else if (user.role === 'management') {
              setTimeout(() => navigate('/management'), 100)
            } else {
              setTimeout(() => navigate('/login'), 100)
            }
            return
          }
          setCurrentUser(user)
          setIsCheckingAuth(false)
        } else {
          console.log('Invalid token, redirecting to login')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsCheckingAuth(false)
          setTimeout(() => navigate('/login'), 100)
        }
      } catch (error) {
        console.error('Failed to load current user:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setIsCheckingAuth(false)
        setTimeout(() => navigate('/login'), 100)
      }
    }
    loadCurrentUser()
  }, [navigate])

  // Track if this is the first load
  const isFirstLoadRef = useRef(true)
  const usersRef = useRef<Record<string, any>>({})
  
  // Load conversations
  useEffect(() => {
    const loadConversations = async (showLoading: boolean = false) => {
      try {
        if (showLoading) {
          setLoading(true)
        }
        const response = await conversationsAPI.list()
        
        if (response.success && response.data) {
          const conversationsData = Array.isArray(response.data) ? response.data : []
          
          // Load user info for all participants FIRST (before setting conversations)
          // This ensures names are displayed immediately instead of "User xxx"
          const allUserIds = new Set<string>()
          conversationsData.forEach((conv: any) => {
            if (conv.participants && Array.isArray(conv.participants)) {
              conv.participants.forEach((id: string) => {
                if (!usersRef.current[id]) {
                  allUserIds.add(id)
                }
              })
            }
          })
          
          // Load all users FIRST using batch API (much faster than multiple individual calls)
          // This prevents showing "User xxx" placeholder
          let finalUsersMap: Record<string, any> = { ...usersRef.current }
          
          if (allUserIds.size > 0) {
            try {
              // Use batch loading API - only 1 API call instead of N calls
              const userIdsArray = Array.from(allUserIds)
              const batchResponse = await usersAPI.getByIds(userIdsArray)
              
              if (batchResponse.success && batchResponse.data) {
                // Convert array to map for easy lookup
                batchResponse.data.forEach((user: any) => {
                  finalUsersMap[user.id] = user
                })
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error('[Messages] Failed to batch load users:', error)
              }
              // Fallback to individual loading if batch fails
            const userPromises = Array.from(allUserIds).map(async (userId) => {
              try {
                const userResponse = await usersAPI.get(userId)
                if (userResponse.success && userResponse.data) {
                  return [userId, userResponse.data]
                }
              } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                  console.error(`[Messages] Failed to load user ${userId}:`, error)
                }
              }
              return null
            })
            
            const userResults = await Promise.all(userPromises)
              userResults.forEach(result => {
                if (result) {
                  finalUsersMap[result[0]] = result[1]
                }
              })
            }
          }
          
          // Update usersRef FIRST for immediate access
          usersRef.current = finalUsersMap
          
          // Only update users state if data actually changed to prevent unnecessary re-renders
          let usersChanged = false
          setUsers(prevUsers => {
            // Check if users actually changed
            const prevUsersJson = JSON.stringify(prevUsers)
            const newUsersJson = JSON.stringify(finalUsersMap)
            if (prevUsersJson !== newUsersJson) {
              usersChanged = true
              return finalUsersMap
            }
            return prevUsers // Return same reference to prevent re-render
          })
          
          // Only update usersLoaded if users actually changed
          if (usersChanged) {
            setUsersLoaded(prev => prev + 1) // Force re-render when users are loaded
          }
          
          setConversations(conversationsData)
        } else {
          setConversations([])
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Messages] Failed to load conversations:', error)
        }
        setConversations([])
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    }
    
    // Only load if currentUser is available
    if (currentUser) {
      // Show loading only on first load
      loadConversations(isFirstLoadRef.current)
      isFirstLoadRef.current = false
      
      // Refresh conversations every 90 seconds (increased from 60 to reduce reloads)
      // Don't show loading on refresh - optimized for 2-3 users testing
      const interval = setInterval(() => loadConversations(false), 90000)
      return () => clearInterval(interval)
    } else {
      // If no currentUser yet, set loading to false to show the page
      // (user will be redirected if not authenticated)
      setLoading(false)
    }
  }, [currentUser])

  // Load active users for "Active Now" section
  // Fixed: Prevent infinite loop by using refs and debouncing
  useEffect(() => {
    // Clear any existing timeouts/intervals
    if (activeUsersTimeoutRef.current) {
      clearTimeout(activeUsersTimeoutRef.current)
      activeUsersTimeoutRef.current = null
    }
    if (activeUsersIntervalRef.current) {
      clearInterval(activeUsersIntervalRef.current)
      activeUsersIntervalRef.current = null
    }

    const loadActiveUsers = async (useCache: boolean = true) => {
      // Prevent multiple simultaneous calls
      if (isLoadingActiveUsersRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Tutor Messages] Active users already loading, skipping...')
        }
        return
      }
      
      if (!currentUser) {
        setActiveUsers([])
        return
      }
      
      try {
        isLoadingActiveUsersRef.current = true
        setLoadingActiveUsers(true)
        
        // Check cache first to avoid unnecessary API calls
        let usersList: any[] = []
        const now = Date.now()
        const cacheValid = useCache && 
          usersListCacheRef.current.length > 0 && 
          (now - usersListCacheTimeRef.current) < USERS_CACHE_DURATION
        
        if (cacheValid) {
          // Use cached users list
          usersList = usersListCacheRef.current
          if (process.env.NODE_ENV === 'development') {
            console.log('[Tutor Messages] Using cached users list')
          }
        } else {
          // Load all users from API (only when cache is invalid)
        const response = await usersAPI.list({ limit: 100 })
        
        // Handle different response formats
        if (response && Array.isArray(response)) {
          usersList = response
        } else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            usersList = response.data
          } else if (response.data.data && Array.isArray(response.data.data)) {
            usersList = response.data.data
          }
        } else if (response.data && Array.isArray(response.data)) {
          usersList = response.data
          }
          
          // Update cache
          usersListCacheRef.current = usersList
          usersListCacheTimeRef.current = now
        }
        
        // Filter out current user
        const currentUserId = currentUser?.userId || currentUser?.id || ''
        const otherUsers = usersList.filter((user: any) => 
          user && user.id && user.id !== currentUserId
        )
        
        // Determine active users - Chỉ hiển thị users đang online (connected via WebSocket)
        // Không dựa vào message, chỉ dựa vào online status thực sự
        const activeUsersList = otherUsers
          .filter(user => isUserOnline(user.id)) // Chỉ lấy users đang online
          .map(user => {
            return {
              ...user,
              isActive: true, // Tất cả users trong list này đều online
              lastActivity: new Date().toISOString(), // Current time since they're online
              lastActivityTime: Date.now()
            }
          })
          .sort((a, b) => {
            // Sort by last activity time (most recent first)
            if (a.lastActivityTime && b.lastActivityTime) {
              return b.lastActivityTime - a.lastActivityTime
            }
            if (a.lastActivityTime && !b.lastActivityTime) return -1
            if (!a.lastActivityTime && b.lastActivityTime) return 1
            // Sort alphabetically by name
            const nameA = (a.name || a.email || '').toLowerCase()
            const nameB = (b.name || b.email || '').toLowerCase()
            return nameA.localeCompare(nameB)
          })
          .slice(0, 12) // Show top 12 active users
        
        // Only update state if active users actually changed
        setActiveUsers(prevActiveUsers => {
          const prevIds = new Set(prevActiveUsers.map(u => u.id).sort())
          const newIds = new Set(activeUsersList.map(u => u.id).sort())
          if (prevIds.size !== newIds.size || 
              Array.from(prevIds).some(id => !newIds.has(id))) {
            return activeUsersList
          }
          return prevActiveUsers // Return same reference to prevent re-render
        })
        
        // Update last known online users
        lastOnlineUsersRef.current = new Set(activeUsersList.map(u => u.id))
      } catch (error) {
        console.error('[Tutor Messages] Failed to load active users:', error)
        // Don't clear on error to prevent UI flickering
        // Only clear if this is the first load
        if (activeUsers.length === 0) {
          setActiveUsers([])
        }
      } finally {
        setLoadingActiveUsers(false)
        isLoadingActiveUsersRef.current = false
      }
    }
    
    // Check if onlineUsers actually changed
    const currentOnlineUsersSet = new Set(onlineUsers || [])
    const onlineUsersChanged = 
      currentOnlineUsersSet.size !== lastOnlineUsersRef.current.size ||
      Array.from(currentOnlineUsersSet).some(id => !lastOnlineUsersRef.current.has(id)) ||
      Array.from(lastOnlineUsersRef.current).some(id => !currentOnlineUsersSet.has(id))
    
    // Only load if:
    // 1. We have currentUser
    // 2. Online users actually changed (not just a re-render) OR no active users yet
    // 3. Not already loading
    if (currentUser && (onlineUsersChanged || activeUsers.length === 0)) {
      // Debounce: wait 2 seconds before loading to prevent rapid calls
      // Use cache if onlineUsers changed (users list doesn't change often)
      activeUsersTimeoutRef.current = setTimeout(() => {
        if (!isLoadingActiveUsersRef.current) {
          // Use cache when onlineUsers changed (only filter changes, not user list)
          // Force refresh only if cache is invalid or no active users
          const useCache = onlineUsersChanged && activeUsers.length > 0
          loadActiveUsers(useCache)
        }
      }, 2000) // 2 seconds debounce (increased from 1 second)
    }
    
    // Set up interval for periodic refresh (only if we have currentUser)
    // Increased to 3 minutes to reduce load - optimized for 2-3 users testing
    // Users list doesn't change often, so we can cache it longer
    if (currentUser) {
      activeUsersIntervalRef.current = setInterval(() => {
        if (!isLoadingActiveUsersRef.current) {
          // Use cache for periodic refresh (only refresh online status)
          loadActiveUsers(true) // Use cache - only filter by online status
        }
      }, 180000) // Refresh every 3 minutes (increased from 90 seconds)
    }
    
    return () => {
      if (activeUsersTimeoutRef.current) {
        clearTimeout(activeUsersTimeoutRef.current)
        activeUsersTimeoutRef.current = null
      }
      if (activeUsersIntervalRef.current) {
        clearInterval(activeUsersIntervalRef.current)
        activeUsersIntervalRef.current = null
      }
    }
  }, [currentUser, onlineUsers, isUserOnline]) // Removed 'conversations' - it causes infinite loop

  // Note: loadHistory is automatically called by useLongPolling hook when conversationId changes
  // No need to call it manually here to avoid duplicate calls

  // Scroll to bottom ONLY ONCE when opening a conversation (first time)
  // After that, let user scroll manually
  useEffect(() => {
    // Check if conversation actually changed
    const conversationChanged = previousConversationIdRef.current !== selectedConversationId
    
    if (!conversationChanged || !selectedConversationId) {
      // Same conversation or no conversation - don't scroll, let user control
      return
    }
    
    // Conversation changed - update ref immediately
    previousConversationIdRef.current = selectedConversationId
    
    // Scroll to bottom ONCE when opening conversation
    let scrollTimeout: NodeJS.Timeout | null = null
    let checkInterval: NodeJS.Timeout | null = null
    let hasScrolled = false
    
    const performScroll = () => {
      if (hasScrolled || !messagesContainerRef.current) return
      
      const container = messagesContainerRef.current
      
      // Only scroll if there are messages or content to scroll to
      if (container.scrollHeight > container.clientHeight) {
        hasScrolled = true
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto'
        })
      }
    }
    
    // Try to scroll after a short delay to ensure DOM is ready
    scrollTimeout = setTimeout(() => {
      performScroll()
      
      // If no content yet, wait for it with interval (check less frequently)
      if (!hasScrolled) {
        checkInterval = setInterval(() => {
          if (messagesContainerRef.current) {
            const container = messagesContainerRef.current
            if (container.scrollHeight > container.clientHeight) {
              clearInterval(checkInterval!)
              checkInterval = null
              if (!hasScrolled) {
                performScroll()
              }
            }
          }
        }, 300) // Check every 300ms to reduce overhead
        
        // Clear interval after 2 seconds
        setTimeout(() => {
          if (checkInterval) {
            clearInterval(checkInterval)
            checkInterval = null
          }
        }, 2000)
      }
    }, 400) // Delay to ensure messages are rendered
    
    // Cleanup
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      if (checkInterval) clearInterval(checkInterval)
    }
  }, [selectedConversationId]) // ONLY depend on conversationId to avoid re-renders

  // Close emoji picker when clicking outside - MUST be before useMemo hooks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Helper function to get initials from name
  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return '?'
    }
    const words = name.trim().split(' ').filter(w => w.length > 0)
    if (words.length === 0) {
      return '?'
    }
    return words
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Helper function to generate avatar color based on name
  const getAvatarColor = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      name = 'Unknown' // Default to 'Unknown' for color generation
    }
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
      '#ff5722', '#795548', '#607d8b'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, path: '/tutor' },
    { id: 'availability', label: 'Set Availability', icon: <ScheduleIcon />, path: '/tutor/availability' },
    { id: 'sessions', label: 'Manage Sessions', icon: <AssignmentIcon />, path: '/tutor/sessions' },
    { id: 'progress', label: 'Track Progress', icon: <BarChartIcon />, path: '/tutor/track-progress' },
    { id: 'cancel-reschedule', label: 'Cancel/Reschedule', icon: <AutorenewIcon />, path: '/tutor/cancel-reschedule' },
    { id: 'messages', label: 'Messages', icon: <ChatIcon />, path: '/tutor/messages' }
  ]

  // IMPORTANT: All hooks must be called BEFORE any conditional returns
  // Memoize formatted conversations to avoid re-computing on every render
  // Format conversation inline to avoid useCallback dependency issues
  // Use Object.keys(users).length as dependency instead of users object to avoid reference issues
  const usersKeysLength = Object.keys(users).length
    const currentUserId = currentUser?.userId || currentUser?.id || ''
  
  const formattedConversations = useMemo(() => {
    if (!currentUser) return []
    
    return conversations.map((conversation: any) => {
      const otherId = conversation.participants?.find((id: string) => id !== currentUserId)
      // Use users state directly instead of usersRef to ensure it updates immediately
      const otherUser = otherId ? users[otherId] : null
    const lastMessage = conversation.lastMessage
    const unreadCount = conversation.unreadCount?.[currentUserId] || 0
    
    // Get other participant ID even if user info not loaded yet
    const displayName = otherUser?.name || otherUser?.email || `User ${otherId?.slice(0, 8) || 'Unknown'}`
    
    return {
      id: conversation.id,
      name: displayName,
      type: otherUser?.role || 'user',
      lastMessage: lastMessage?.content || 'No messages yet',
      time: lastMessage?.createdAt 
        ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })
        : 'No messages',
      unread: unreadCount,
      online: false, // TODO: Implement online status
      avatar: getInitials(displayName),
      subject: otherUser?.subjects?.[0] || otherUser?.preferredSubjects?.[0] || 'General',
      otherUser,
      otherId
    }
    })
  }, [conversations, conversations.length, currentUserId, users, usersKeysLength, usersLoaded, currentUser])
  
  // Memoize filtered conversations to avoid re-filtering on every render
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return formattedConversations
    const query = searchQuery.toLowerCase()
    return formattedConversations.filter(conv =>
      conv.name.toLowerCase().includes(query) ||
      conv.subject.toLowerCase().includes(query)
    )
  }, [formattedConversations, searchQuery])
  
  // Memoize selected conversation
  const selectedConversation = useMemo(() => {
    return formattedConversations.find(c => c.id === selectedConversationId)
  }, [formattedConversations, selectedConversationId])

  // Show loading screen while checking authentication (AFTER all hooks)
  if (isCheckingAuth || !currentUser) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {isCheckingAuth ? 'Đang kiểm tra đăng nhập...' : 'Đang tải dữ liệu...'}
          </p>
        </div>
      </div>
    )
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuClick = (item: any) => {
    setActiveMenu(item.id)
    if (item.path) {
      navigate(item.path)
    }
  }

  const handleThemeToggle = () => {
    toggleTheme()
    setShowThemeOptions(false)
  }

  // Load available users (all users: students, tutors, management)
  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true)
      
      // Check cache first to avoid unnecessary API calls
      const now = Date.now()
      const cacheValid = usersListCacheRef.current.length > 0 && 
        (now - usersListCacheTimeRef.current) < USERS_CACHE_DURATION
      
      let usersList: any[] = []
      
      if (cacheValid) {
        // Use cached users list
        usersList = usersListCacheRef.current
        if (process.env.NODE_ENV === 'development') {
          console.log('[Tutor Messages] Using cached users list for available users')
        }
      } else {
      // Load all users (students, tutors, management) - không filter theo role
      const response = await usersAPI.list({ limit: 100 })
      
      // Handle different response formats
      // API returns: { data: [...], pagination: {...} } OR { success: true, data: [...] }
      if (response && Array.isArray(response)) {
        // Direct array response
        usersList = response
      } else if (response.success && response.data) {
        // Wrapped in success response
        if (Array.isArray(response.data)) {
          usersList = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          usersList = response.data.data
        }
      } else if (response.data && Array.isArray(response.data)) {
        // Paginated response: { data: [...], pagination: {...} }
        usersList = response.data
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        usersList = response.data.data
        }
        
        // Update cache
        usersListCacheRef.current = usersList
        usersListCacheTimeRef.current = now
      }
      
      if (usersList.length > 0) {
        const currentUserId = currentUser?.userId || currentUser?.id || ''
        // Chỉ filter ra current user - hiển thị tất cả users khác (kể cả đã có conversation)
        const filteredUsers = usersList.filter((user: any) => 
          user && user.id && user.id !== currentUserId
        )
        setAvailableUsers(filteredUsers)
      } else {
        console.warn('[Tutor Messages] No users found in usersList')
        setAvailableUsers([])
      }
    } catch (error) {
      console.error('[Tutor Messages] Failed to load available users:', error)
      setAvailableUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  // Create new conversation or open existing one
  const handleCreateConversation = async (userId: string) => {
    try {
      setCreatingConversation(true)
      
      // Kiểm tra xem đã có conversation với user này chưa
      const existingConversation = conversations.find((conv: any) => 
        conv.participants && conv.participants.includes(userId)
      )
      
      if (existingConversation) {
        // Đã có conversation - mở conversation đó
        setSelectedConversationId(existingConversation.id)
        setShowNewConversationModal(false)
        setSearchUserQuery('')
        setCreatingConversation(false)
        return
      }
      
      // Chưa có conversation - tạo mới
      const response = await conversationsAPI.create({
        participantIds: [userId]
      })
      
      if (response.success && response.data) {
        // Reload conversations and all user info
        const loadConversations = async () => {
          try {
            const convResponse = await conversationsAPI.list()
            if (convResponse.success && convResponse.data) {
              const conversationsData = Array.isArray(convResponse.data) ? convResponse.data : []
              setConversations(conversationsData)
              
              // Load user info for ALL participants in ALL conversations
              const allUserIds = new Set<string>()
              conversationsData.forEach((conv: any) => {
                if (conv.participants && Array.isArray(conv.participants)) {
                  conv.participants.forEach((id: string) => allUserIds.add(id))
                }
              })
              
              // Load users in parallel
              const userPromises = Array.from(allUserIds).map(async (userId) => {
                try {
                  const userResponse = await usersAPI.get(userId)
                  if (userResponse.success && userResponse.data) {
                    return [userId, userResponse.data]
                  }
                } catch (error) {
                  console.error(`Failed to load user ${userId}:`, error)
                }
                return null
              })
              
              const userResults = await Promise.all(userPromises)
              const usersMap: Record<string, any> = {}
              userResults.forEach(result => {
                if (result) {
                  usersMap[result[0]] = result[1]
                }
              })
              
              // Only update users state if data actually changed
              setUsers(prevUsers => {
                const prevUsersJson = JSON.stringify(prevUsers)
                const newUsersJson = JSON.stringify(usersMap)
                if (prevUsersJson !== newUsersJson) {
                  return usersMap
                }
                return prevUsers // Return same reference to prevent re-render
              })
            }
          } catch (error) {
            console.error('Failed to reload conversations:', error)
          }
        }
        await loadConversations()
        
        // Select the new conversation
        setSelectedConversationId(response.data.id)
        setShowNewConversationModal(false)
        setSearchUserQuery('')
      } else {
        alert('Không thể tạo cuộc trò chuyện: ' + (response.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to create conversation:', error)
      alert('Không thể tạo cuộc trò chuyện: ' + (error.message || 'Unknown error'))
    } finally {
      setCreatingConversation(false)
    }
  }

  // Open new conversation modal
  const handleOpenNewConversation = () => {
    setShowNewConversationModal(true)
    // Always reload users to ensure latest data
      loadAvailableUsers()
  }

  // Delete conversation (hide for current user only)
  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This will only hide it for you.')) {
      return
    }

    try {
      const response = await conversationsAPI.delete(conversationId)
      if (response.success) {
        // Reload conversations
        const loadConversations = async () => {
          try {
            const response = await conversationsAPI.list()
            if (response.success && response.data) {
              const conversationsData = Array.isArray(response.data) ? response.data : []
              setConversations(conversationsData)
            }
          } catch (error) {
            console.error('Failed to reload conversations:', error)
          }
        }
        await loadConversations()
        
        // Clear selected conversation if it was deleted
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null)
        }
        setShowConversationMenu(null)
      }
    } catch (error: any) {
      console.error('Failed to delete conversation:', error)
      alert('Failed to delete conversation: ' + (error.message || 'Unknown error'))
    }
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || sending || uploadingFile) return
    
    // If no conversation selected, we need to create one first
    if (!selectedConversationId) {
      alert('Vui lòng chọn hoặc tạo một cuộc trò chuyện trước khi gửi tin nhắn')
      return
    }

    // If file is selected, upload it first
    if (selectedFile) {
      await handleFileUpload()
      return
    }
    
    const messageContent = newMessage.trim()
    if (!messageContent) return

    try {
      setSending(true)
      setNewMessage('') // Clear input immediately for better UX
      
      await sendMessage(messageContent)
      
      // Message is already added to state by sendMessage, no need to reload immediately
      // Only reload history as fallback if message doesn't appear
      setTimeout(async () => {
        const messageExists = messages.some(m => m.content === messageContent)
        if (!messageExists) {
          await loadHistory()
        }
      }, 1000)
      
      // Reload conversations list to update lastMessage (debounced, won't reload if recent)
      reloadConversations()
    } catch (error: any) {
      console.error('Failed to send message:', error)
      alert('Không thể gửi tin nhắn: ' + (error.message || 'Unknown error'))
      // Restore message if sending failed
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    // Focus input after selecting emoji
    setTimeout(() => {
      messageInputRef.current?.focus()
    }, 0)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`File quá lớn. Kích thước tối đa là 5MB.`)
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      alert(`Loại file không được hỗ trợ. Các loại file được hỗ trợ: PDF, JPG, PNG, GIF, DOC, DOCX`)
      return
    }

    setSelectedFile(file)
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedConversationId) return

    try {
      setUploadingFile(true)
      
      // Upload file
      const uploadResponse = await uploadAPI.uploadFile(selectedFile)
      
      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error(uploadResponse.error || 'Upload failed')
      }

      const { url, fileName, mimeType } = uploadResponse.data

      // Determine message type
      const messageType = mimeType.startsWith('image/') ? 'image' : 'file'
      const messageContent = fileName

      // Send message with file
      await sendMessage(messageContent, messageType, url)

      // Clear file
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Reload conversations
      reloadConversations()
    } catch (error: any) {
      console.error('Failed to upload file:', error)
      alert('Không thể upload file: ' + (error.message || 'Unknown error'))
    } finally {
      setUploadingFile(false)
    }
  }


  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Sticky */}
        <div className={`w-full lg:w-60 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} lg:block`}>
          <div className="p-6">
            {/* Logo */}
            <div 
              className="flex items-center mb-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/tutor')}
            >
              <div className="w-10 h-10 flex items-center justify-center mr-3">
                <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-10 h-10" />
              </div>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                HCMUT
              </span>
            </div>

            {/* Navigation Menu */}
            <div className="mb-8">
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeMenu === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                SETTINGS
              </h3>
              <div className="space-y-2">
                <button className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <PersonIcon className="mr-3 w-4 h-4" />
                  Profile
                </button>
                <button className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <NotificationsIcon className="mr-3 w-4 h-4" />
                  Notifications
                </button>
                <button 
                  onClick={() => setShowThemeOptions(!showThemeOptions)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <PaletteIcon className="mr-3 w-4 h-4" />
                  Theme
                </button>
                {showThemeOptions && (
                  <div className={`mt-2 ml-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="space-y-2">
                      <button 
                        onClick={handleThemeToggle}
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                          theme === 'light' 
                            ? 'bg-blue-100 text-blue-700' 
                            : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`
                        }`}
                      >
                        {theme === 'dark' ? <LightModeIcon className="mr-3 w-4 h-4" /> : <DarkModeIcon className="mr-3 w-4 h-4" />}
                        {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                      </button>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} px-3 py-1`}>
                        Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6">
          {/* Mobile Menu Button & Theme Toggle */}
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <button
              onClick={handleDrawerToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            
            {/* Mobile Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} transition-colors`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <LightModeIcon className="w-6 h-6 text-yellow-400" /> : <DarkModeIcon className="w-6 h-6" />}
            </button>
          </div>

          {/* Search Bar & Desktop Theme Toggle */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-4 py-3 pl-10 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
                  Search
                </Button>
                
                {/* Desktop Theme Toggle */}
                <button
                  onClick={handleThemeToggle}
                  className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} transition-colors`}
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                  {theme === 'dark' ? <LightModeIcon className="w-5 h-5 text-yellow-400" /> : <DarkModeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>


          {/* Active Status Section - Always show */}
          <div className="mb-6">
            <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Active Now
              </h3>
              {loadingActiveUsers ? (
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                  Loading...
                      </div>
              ) : activeUsers.length > 0 ? (
                <div 
                  className="flex space-x-4 overflow-x-auto pb-2"
                  style={{
                    width: '100%',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollbarWidth: 'thin',
                    scrollbarColor: theme === 'dark' ? '#4b5563 #1f2937' : '#9ca3af #e5e7eb',
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x proximity',
                    msOverflowStyle: '-ms-autohiding-scrollbar',
                    display: 'flex',
                    flexWrap: 'nowrap',
                    whiteSpace: 'nowrap'
                  }}
                >
                {/* Active Users */}
                  {activeUsers.map((user) => {
                    // Find conversation with this user
                    const userConversation = conversations.find((conv: any) => 
                      conv.participants && conv.participants.includes(user.id)
                    )
                    
                    return (
                      <div 
                        key={user.id} 
                        className="flex flex-col items-center min-w-[80px] flex-shrink-0 cursor-pointer"
                        style={{ scrollSnapAlign: 'start' }}
                        onClick={() => {
                          if (userConversation) {
                            setSelectedConversationId(userConversation.id)
                          } else {
                            handleCreateConversation(user.id)
                          }
                        }}
                      >
                    <div className="relative">
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                              bgcolor: getAvatarColor(user.name || user.email),
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                              border: user.isActive ? '3px solid #10b981' : '3px solid transparent'
                        }}
                      >
                            {getInitials(user.name || user.email)}
                      </Avatar>
                          {user.isActive && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                    </div>
                    <span className={`text-xs text-center mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {(user.name || user.email).split(' ')[0]}
                    </span>
                  </div>
                    )
                  })}
              </div>
              ) : (
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                  No online users
                </div>
              )}
            </div>
          </div>

          {/* Messages Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[620px]">
            {/* Conversations List */}
            <div className={`lg:col-span-1 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}
                 style={{
                   borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                   backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                   boxShadow: 'none !important'
                 }}>
              <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Messages
                </h2>
                <button
                  onClick={handleOpenNewConversation}
                  className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}
                  title="Tạo cuộc trò chuyện mới"
                >
                  <ChatIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-y-auto h-[540px]">
                {loading ? (
                  <div className="p-4 text-center">
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Đang tải...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {conversations.length === 0 
                        ? 'Không có cuộc trò chuyện nào. Hãy bắt đầu một cuộc trò chuyện mới!' 
                        : 'Không tìm thấy cuộc trò chuyện nào phù hợp với tìm kiếm của bạn.'}
                    </p>
                    <button
                      onClick={handleOpenNewConversation}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      + Tạo cuộc trò chuyện mới
                    </button>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`p-4 border-b cursor-pointer transition-colors ${
                        selectedConversationId === conversation.id
                          ? theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
                          : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      } ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: getAvatarColor(conversation.name),
                            fontSize: '1rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {conversation.avatar}
                        </Avatar>
                        {conversation.online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {conversation.name}
                          </h3>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {conversation.time}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {conversation.lastMessage}
                          </p>
                          {conversation.unread > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {conversation.unread}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            conversation.type === 'student' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {conversation.type === 'student' ? 'Student' : 'Tutor'}
                          </span>
                          <span className={`text-xs ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {conversation.subject}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`lg:col-span-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex flex-col overflow-hidden`}
                 style={{
                   borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                   backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                   boxShadow: 'none !important'
                 }}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: getAvatarColor(selectedConversation.name),
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {selectedConversation.avatar}
                        </Avatar>
                        {selectedConversation.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {selectedConversation.name}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {selectedConversation.subject}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 relative">
                      <div className="relative">
                      <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowConversationMenu(showConversationMenu === selectedConversationId ? null : selectedConversationId || null)
                          }}
                        className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        style={{
                          color: theme === 'dark' ? '#ffffff' : '#374151'
                        }}
                          title="More options"
                      >
                          <MoreHorizIcon className="w-5 h-5" />
                      </button>
                        {showConversationMenu === selectedConversationId && (
                          <>
                            <div 
                              className="fixed inset-0 z-40"
                              onClick={() => setShowConversationMenu(null)}
                            />
                            <div 
                              className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-50 ${
                                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                      <button 
                                onClick={() => {
                                  if (selectedConversationId) {
                                    handleDeleteConversation(selectedConversationId)
                                  }
                                }}
                                className={`w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
                                  theme === 'dark' ? 'text-red-400' : 'text-red-600'
                                }`}
                      >
                                <DeleteIcon className="w-4 h-4" />
                                <span>Delete</span>
                      </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 p-4 overflow-y-auto space-y-4" 
                    style={{ 
                      maxHeight: 'calc(100vh - 300px)',
                      scrollBehavior: 'smooth'
                    }}
                  >
                    {!selectedConversationId ? (
                      <div className="text-center py-8">
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Chọn một cuộc trò chuyện để xem tin nhắn
                        </p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                        </p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => {
                          const currentUserIdForComparison = currentUser?.userId || currentUser?.id || ''
                          const isOwnMessage = message.senderId === currentUserIdForComparison
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
                            >
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'
                                  : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                              } ${isOwnMessage ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {/* File Message */}
                                {message.type === 'file' && message.fileUrl && (
                                  <div className="mb-2">
                                    <a
                                      href={message.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center space-x-2 hover:underline"
                                    >
                                      <AttachFileIcon className="w-4 h-4" />
                                      <span className="break-words">{message.content}</span>
                                    </a>
                                  </div>
                                )}
                                {/* Image Message */}
                                {message.type === 'image' && message.fileUrl && (
                                  <div className="mb-2">
                                    <a
                                      href={message.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block"
                                    >
                                      <img
                                        src={message.fileUrl}
                                        alt={message.content}
                                        className="max-w-full h-auto rounded-lg cursor-pointer"
                                        style={{ maxHeight: '300px' }}
                                      />
                                    </a>
                                    <p className="text-xs mt-1 break-words">{message.content}</p>
                                  </div>
                                )}
                                {/* Text Message */}
                                {message.type === 'text' && (
                                <p className="break-words">{message.content || '(No content)'}</p>
                                )}
                                <span className={`text-xs block mt-1 ${
                                  isOwnMessage
                                    ? theme === 'dark' ? 'text-blue-200' : 'text-blue-100'
                                    : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} style={{ height: '1px' }} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    {/* Selected File Preview */}
                    {selectedFile && (
                      <div className={`mb-2 p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-between`}>
                    <div className="flex items-center space-x-2">
                          <AttachFileIcon className="w-4 h-4" />
                          <span className="text-sm truncate max-w-xs">{selectedFile.name}</span>
                          <span className="text-xs text-gray-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      <button 
                          onClick={() => {
                            setSelectedFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        style={{
                          color: theme === 'dark' ? '#ffffff' : '#374151'
                        }}
                        disabled={uploadingFile}
                      >
                        <AttachFileIcon className="w-5 h-5" />
                      </button>
                      
                      <div className="flex-1 relative">
                        <input
                          ref={messageInputRef}
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className={`w-full px-4 py-2 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      
                      <div className="relative" ref={emojiPickerRef}>
                      <button 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${showEmojiPicker ? (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                        style={{
                          color: theme === 'dark' ? '#ffffff' : '#374151'
                        }}
                      >
                        <EmojiEmotionsIcon className="w-5 h-5" />
                      </button>
                        {showEmojiPicker && (
                          <EmojiPicker
                            onEmojiSelect={handleEmojiSelect}
                            theme={theme === 'dark' ? 'dark' : 'light'}
                          />
                        )}
                      </div>
                      
                      <Button
                        onClick={handleSendMessage}
                        disabled={(!newMessage.trim() && !selectedFile) || sending || uploadingFile}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 disabled:opacity-50"
                        style={{
                          color: '#ffffff'
                        }}
                      >
                        {sending || uploadingFile ? (
                          <span className="text-sm">{uploadingFile ? 'Đang upload...' : 'Đang gửi...'}</span>
                        ) : (
                          <SendIcon className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <ChatIcon className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Select a conversation
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Panel - Sticky */}
        <div className={`w-full lg:w-80 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} mt-6 lg:mt-0`}>
          <div className="p-6">
            {/* Profile Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Your Profile
              </h3>
              <button className="p-1">
                <MoreVertIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* User Profile */}
            <div className="text-center mb-8">
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  bgcolor: getAvatarColor('Dr. Smith'),
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  mx: 'auto',
                  mb: 2
                }}
              >
                {getInitials('Dr. Smith')}
              </Avatar>
              <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Good Morning Dr. Smith
              </h4>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Continue inspiring students and sharing your knowledge
              </p>
            </div>

            {/* Social Links */}
            <div className="flex justify-center space-x-4 mb-8">
              <button className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                <FacebookIcon className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-colors">
                <TwitterIcon className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white hover:bg-pink-600 transition-colors">
                <InstagramIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Online Status */}
            <div className="mb-8">
              <h4 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Online Status
              </h4>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Available for messages
                </span>
                <div className="flex items-center">
                  <OnlinePredictionIcon className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm text-green-500">Online</span>
                </div>
              </div>
            </div>

            {/* Recent Contacts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Recent Contacts
                </h4>
                <button className="text-sm text-blue-600">
                  <MoreVertIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {formattedConversations
                  .filter(conv => conv.lastMessage && conv.lastMessage !== 'No messages yet') // Only show conversations with messages
                  .sort((a, b) => {
                    // Sort by last message time (most recent first)
                    const timeA = conversations.find(c => c.id === a.id)?.lastMessage?.createdAt || conversations.find(c => c.id === a.id)?.updatedAt || ''
                    const timeB = conversations.find(c => c.id === b.id)?.lastMessage?.createdAt || conversations.find(c => c.id === b.id)?.updatedAt || ''
                    if (timeA && timeB) {
                      return new Date(timeB).getTime() - new Date(timeA).getTime()
                    }
                    if (timeA && !timeB) return -1
                    if (!timeA && timeB) return 1
                    return 0
                  })
                  .slice(0, 3) // Only show top 3 most recent
                  .map((contact, index) => (
                    <div key={contact.id || index} className="flex items-center">
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: getAvatarColor(contact.name),
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}
                    >
                        {contact.avatar || getInitials(contact.name)}
                    </Avatar>
                    <div className="flex-1 ml-3">
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {contact.name || 'Unknown'}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {contact.subject || 'General'}
                      </p>
                    </div>
                    {contact.online && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle}></div>
          <div className={`fixed left-0 top-0 h-full w-80 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
            <div className="p-6">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center mr-3">
                    <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-8 h-8" />
                  </div>
                  <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    HCMUT
                  </span>
                </div>
                <button
                  onClick={handleDrawerToggle}
                  className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleMenuClick(item)
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeMenu === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Mobile Settings */}
              <div className="mt-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  SETTINGS
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      navigate('/tutor/profile')
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <PersonIcon className="mr-3 w-4 h-4" />
                    Profile
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/tutor/notifications')
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <NotificationsIcon className="mr-3 w-4 h-4" />
                    Notifications
                  </button>
                  <button 
                    onClick={() => setShowThemeOptions(!showThemeOptions)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <PaletteIcon className="mr-3 w-4 h-4" />
                    Theme
                  </button>
                  {showThemeOptions && (
                    <div className={`mt-2 ml-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="space-y-2">
                        <button 
                          onClick={() => {
                            handleThemeToggle()
                            setMobileOpen(false)
                          }}
                          className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                            theme === 'light' 
                              ? 'bg-blue-100 text-blue-700' 
                              : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'}`
                          }`}
                        >
                          {theme === 'dark' ? <LightModeIcon className="mr-3 w-4 h-4" /> : <DarkModeIcon className="mr-3 w-4 h-4" />}
                          {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                        </button>
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} px-3 py-1`}>
                          Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowNewConversationModal(false)}>
          <div 
            className={`w-full max-w-md mx-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Tạo cuộc trò chuyện mới
                </h3>
                <button
                  onClick={() => {
                    setShowNewConversationModal(false)
                    setSearchUserQuery('')
                  }}
                  className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Search Users */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Tìm kiếm người dùng (student, tutor, management)..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Users List */}
              <div className="max-h-96 overflow-y-auto">
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Đang tải...</p>
                  </div>
                ) : (
                  <>
                    {availableUsers
                      .filter((user: any) => 
                        user.name?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
                        user.email?.toLowerCase().includes(searchUserQuery.toLowerCase())
                      )
                      .map((user: any) => {
                        // Kiểm tra xem đã có conversation với user này chưa
                        const hasConversation = conversations.some((conv: any) => 
                          conv.participants && conv.participants.includes(user.id)
                        )
                        
                        return (
                        <div
                          key={user.id}
                          onClick={() => !creatingConversation && handleCreateConversation(user.id)}
                          className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-gray-700' 
                              : 'hover:bg-gray-100'
                          } ${creatingConversation ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: getAvatarColor(user.name || user.email),
                                fontSize: '1rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {getInitials(user.name || user.email)}
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {user.name || user.email}
                              </h4>
                                  {user.role && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                      user.role === 'tutor' 
                                        ? theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'
                                        : user.role === 'student'
                                        ? theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'
                                        : theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-700'
                                    }`}>
                                      {user.role === 'tutor' ? 'Tutor' : user.role === 'student' ? 'Student' : 'Management'}
                                    </span>
                                  )}
                                  {hasConversation && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      Đã có cuộc trò chuyện
                                    </span>
                                  )}
                                </div>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {user.email}
                              </p>
                            </div>
                            {creatingConversation && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            )}
                          </div>
                        </div>
                        )
                      })}
                    {availableUsers.filter((user: any) => 
                      user.name?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
                      user.email?.toLowerCase().includes(searchUserQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-8">
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          {searchUserQuery ? 'Không tìm thấy người dùng nào' : 'Không có người dùng nào'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages
