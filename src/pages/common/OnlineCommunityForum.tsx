import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { 
  Search,
  FilterList,
  Add,
  ThumbUp,
  Comment,
  Share,
  Bookmark,
  TrendingUp,
  Schedule,
  Person,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  LibraryBooks as LibraryIcon,
  NotificationsActive as NotificationsIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Send as SendIcon
} from '@mui/icons-material'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { navigateToDashboard } from '../../utils/navigation'
import { forumAPI, usersAPI, authAPI } from '../../lib/api'
import { formatDistanceToNow } from 'date-fns'

const OnlineCommunityForum: React.FC = () => {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSort, setSelectedSort] = useState('recent')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [forumPosts, setForumPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Record<string, any>>({})
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [postComments, setPostComments] = useState<Record<string, any[]>>({})
  const [likingPostId, setLikingPostId] = useState<string | null>(null)

  // Create post form state
  const [createFormData, setCreateFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: [] as string[],
    images: [] as string[]
  })
  const [tagInput, setTagInput] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string[]>([])

  const categories = [
    'General',
    'Programming',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Engineering',
    'Study Tips',
    'Questions',
    'Resources'
  ]

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await authAPI.getMe()
        if (response.success && response.data) {
          setCurrentUser(response.data)
        }
      } catch (error) {
        console.error('Failed to load current user:', error)
      }
    }
    loadCurrentUser()
  }, [])

  // Load posts function - can be called from anywhere
  const loadPosts = useCallback(async (showLoadingIndicator = true) => {
      try {
      if (showLoadingIndicator) {
        setLoading(true)
      }
      console.log('[Forum] Loading posts...', { selectedCategory, searchTerm })
        const response = await forumAPI.posts.list({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm || undefined,
        limit: 100 // Load more posts so all users can see them
        })
        
      console.log('[Forum] Load posts response:', response)
      
      // Handle different response formats
      let posts: any[] = []
        if (response.success && response.data) {
        // Format: { success: true, data: [...] } or { success: true, data: { data: [...], pagination: {...} } }
        if (Array.isArray(response.data)) {
          posts = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          posts = response.data.data
        } else if (response.data.posts && Array.isArray(response.data.posts)) {
          posts = response.data.posts
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        posts = response
      } else if (response.data && Array.isArray(response.data)) {
        // Format: { data: [...], pagination: {...} }
        posts = response.data
      }
      
      console.log('[Forum] Loaded', posts.length, 'posts from server')
      
      // Sort posts by creation date (newest first)
      const sortedPosts = [...posts].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA // Newest first
      })
      
      // Merge with existing posts to avoid losing optimistic updates
      // This ensures that if a post was just created but server hasn't synced yet,
      // it won't disappear from the UI
      setForumPosts(prevPosts => {
        // If this is the initial load (prevPosts is empty) or showLoadingIndicator is true,
        // just use posts from server (don't merge with empty array)
        if (prevPosts.length === 0) {
          console.log('[Forum] Initial load: Setting', sortedPosts.length, 'posts from server')
          // Load users for these posts
          const userIds = new Set<string>()
          sortedPosts.forEach((post: any) => {
            if (post.authorId) {
              userIds.add(post.authorId)
            }
          })
          
          if (userIds.size > 0) {
            const userIdsArray = Array.from(userIds)
            usersAPI.list({ ids: userIdsArray, limit: 100 })
              .then(batchResponse => {
                if (batchResponse.success && batchResponse.data) {
                  const usersList = Array.isArray(batchResponse.data) ? batchResponse.data : []
                  const usersMap: Record<string, any> = {}
                  usersList.forEach((user: any) => {
                    usersMap[user.id] = user
                  })
                  setUsers(usersMap)
                }
              })
              .catch(error => {
                console.error('Failed to batch load users:', error)
              })
          }
          
          return sortedPosts
        }
        
        // Otherwise, merge with existing posts (for updates/refreshes)
        // Create a map of existing posts by ID
        const existingPostsMap = new Map(prevPosts.map(p => [p.id, p]))
        
        // Add or update posts from server
        sortedPosts.forEach(post => {
          existingPostsMap.set(post.id, post)
        })
        
        // Convert back to array, maintaining order: newest posts first
        const mergedPosts = Array.from(existingPostsMap.values())
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime()
            const dateB = new Date(b.createdAt || 0).getTime()
            return dateB - dateA // Newest first
          })
        
        console.log('[Forum] Merged posts:', mergedPosts.length, 'total (', prevPosts.length, 'previous,', sortedPosts.length, 'from server)')
        
        // Load user info for all authors from merged posts
        const userIds = new Set<string>()
        mergedPosts.forEach((post: any) => {
          if (post.authorId) {
            userIds.add(post.authorId)
          }
        })
        
        // Batch load users using list API with ids parameter
        if (userIds.size > 0) {
          const userIdsArray = Array.from(userIds)
          usersAPI.list({ ids: userIdsArray, limit: 100 })
            .then(batchResponse => {
              if (batchResponse.success && batchResponse.data) {
                const usersList = Array.isArray(batchResponse.data) ? batchResponse.data : []
                setUsers(prevUsers => {
                  // Merge with existing users instead of replacing
                  const updatedUsers = { ...prevUsers }
                  usersList.forEach((user: any) => {
                    updatedUsers[user.id] = user
                  })
                  return updatedUsers
                })
              }
            })
            .catch(error => {
              console.error('Failed to batch load users:', error)
              // Users will be loaded on next render if needed
            })
        }
        
        return mergedPosts
      })
    } catch (error: any) {
      console.error('[Forum] Failed to load posts:', error)
      console.error('[Forum] Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      })
      
      // Don't clear existing posts on error - keep what we have
      // This prevents data loss on network errors
      if (showLoadingIndicator) {
        setLoading(false)
      }
      
      // Show user-friendly error message
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        console.error('[Forum] Blob Storage access error - check BLOB_READ_WRITE_TOKEN')
      }
    } finally {
      if (showLoadingIndicator) {
        setLoading(false)
      }
    }
  }, [selectedCategory, searchTerm])
    
  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Format post for display
  const formatPost = (post: any) => {
    const author = users[post.authorId]
    const currentUserId = currentUser?.userId || currentUser?.id
    const isLiked = post.likes?.includes(currentUserId) || false
    
    return {
      id: post.id,
      title: post.title,
      author: author?.name || author?.email || 'Unknown User',
      authorRole: author?.role || 'User',
      category: post.category,
      content: post.content,
      images: post.images || [],
      likes: post.likes?.length || 0,
      comments: post.commentsCount !== undefined ? post.commentsCount : (postComments[post.id]?.length || 0),
      shares: 0,
      isBookmarked: false,
      isLiked,
      timestamp: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
      tags: post.tags || [],
      views: post.views || 0
    }
  }

  const categoryOptions = [
    { name: 'All', value: 'all', count: forumPosts.length },
    { name: 'General', value: 'General', count: forumPosts.filter((p: any) => p.category === 'General').length },
    { name: 'Programming', value: 'Programming', count: forumPosts.filter((p: any) => p.category === 'Programming').length },
    { name: 'Mathematics', value: 'Mathematics', count: forumPosts.filter((p: any) => p.category === 'Mathematics').length },
    { name: 'Physics', value: 'Physics', count: forumPosts.filter((p: any) => p.category === 'Physics').length },
    { name: 'Chemistry', value: 'Chemistry', count: forumPosts.filter((p: any) => p.category === 'Chemistry').length },
    { name: 'Biology', value: 'Biology', count: forumPosts.filter((p: any) => p.category === 'Biology').length },
    { name: 'Computer Science', value: 'Computer Science', count: forumPosts.filter((p: any) => p.category === 'Computer Science').length },
    { name: 'Engineering', value: 'Engineering', count: forumPosts.filter((p: any) => p.category === 'Engineering').length },
    { name: 'Study Tips', value: 'Study Tips', count: forumPosts.filter((p: any) => p.category === 'Study Tips').length },
    { name: 'Questions', value: 'Questions', count: forumPosts.filter((p: any) => p.category === 'Questions').length },
    { name: 'Resources', value: 'Resources', count: forumPosts.filter((p: any) => p.category === 'Resources').length }
  ]

  const sortOptions = [
    { name: 'Most Recent', value: 'recent' },
    { name: 'Most Popular', value: 'popular' },
    { name: 'Most Liked', value: 'liked' },
    { name: 'Most Commented', value: 'commented' }
  ]

  const formattedPosts = forumPosts.map(formatPost)
  
  // Sort posts
  const sortedPosts = [...formattedPosts].sort((a, b) => {
    if (selectedSort === 'recent') {
      return new Date(forumPosts.find(p => p.id === a.id)?.createdAt || 0).getTime() - 
             new Date(forumPosts.find(p => p.id === b.id)?.createdAt || 0).getTime()
    } else if (selectedSort === 'popular') {
      return (b.views || 0) - (a.views || 0)
    } else if (selectedSort === 'liked') {
      return b.likes - a.likes
    } else if (selectedSort === 'commented') {
      return b.comments - a.comments
    }
    return 0
  }).reverse()
  
  const filteredPosts = sortedPosts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        post.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      alert('Please login to like posts')
      return
    }

    if (likingPostId === postId) return // Prevent duplicate clicks
    
    const currentUserId = currentUser?.userId || currentUser?.id
    if (!currentUserId) return
    
    // Optimistic update: Update like status immediately
    setForumPosts(prevPosts => {
      return prevPosts.map(post => {
        if (post.id === postId) {
          const currentLikes = post.likes || []
          const isLiked = currentLikes.includes(currentUserId)
          const newLikes: string[] = isLiked
            ? currentLikes.filter((id: string) => id !== currentUserId)
            : [...currentLikes, currentUserId]
          return {
            ...post,
            likes: newLikes
          }
        }
        return post
      })
    })
    
    setLikingPostId(postId)
    try {
      const response = await forumAPI.posts.like(postId)
      if (response.success && response.data) {
        // Update with server response to ensure consistency
        setForumPosts(prevPosts => {
          return prevPosts.map(post => {
            if (post.id === postId) {
              // Server returns the actual like count
              const serverLikes = response.data.likesCount || (post.likes?.length || 0)
              // Reconstruct likes array based on server response
              const isLiked = response.data.liked
              const currentLikes = post.likes || []
              let newLikes = currentLikes
              
              if (isLiked && !currentLikes.includes(currentUserId)) {
                newLikes = [...currentLikes, currentUserId]
              } else if (!isLiked && currentLikes.includes(currentUserId)) {
                newLikes = currentLikes.filter((id: string) => id !== currentUserId)
              }
              
              return {
                ...post,
                likes: newLikes
              }
            }
            return post
          })
        })
      } else {
        // Revert optimistic update on error
        setForumPosts(prevPosts => {
          return prevPosts.map(post => {
            if (post.id === postId) {
              const currentLikes = post.likes || []
              const isLiked = currentLikes.includes(currentUserId)
              const newLikes = isLiked
                ? currentLikes.filter((id: string) => id !== currentUserId)
                : [...currentLikes, currentUserId]
              return {
                ...post,
                likes: newLikes
              }
            }
            return post
          })
        })
        alert('Failed to like post: ' + (response.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error liking post:', error)
      // Revert optimistic update on error
      setForumPosts(prevPosts => {
        return prevPosts.map(post => {
          if (post.id === postId) {
            const currentLikes = post.likes || []
            const isLiked = currentLikes.includes(currentUserId)
            const newLikes: string[] = isLiked
              ? currentLikes.filter((id: string) => id !== currentUserId)
              : [...currentLikes, currentUserId]
            return {
              ...post,
              likes: newLikes
            }
          }
          return post
        })
      })
      alert('Error: ' + (error.message || 'Failed to like post'))
    } finally {
      setLikingPostId(null)
    }
  }

  const handleToggleComments = async (postId: string) => {
    const isShowing = showComments[postId]
    setShowComments(prev => ({ ...prev, [postId]: !isShowing }))
    
    if (!isShowing && !postComments[postId]) {
      // Load comments
      try {
        const response = await forumAPI.comments.list(postId)
        if (response.success && response.data) {
          const comments = Array.isArray(response.data) ? response.data : []
          setPostComments(prev => ({ ...prev, [postId]: comments }))
        }
      } catch (error) {
        console.error('Failed to load comments:', error)
      }
    }
  }

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return
    if (!currentUser) {
      alert('Please login to comment')
      return
    }

    const commentContent = commentText.trim()
    const currentUserId = currentUser?.userId || currentUser?.id
    
    // Optimistic update: Add comment to UI immediately
    const tempCommentId = `temp-${Date.now()}`
    const optimisticComment = {
      id: tempCommentId,
      postId,
      authorId: currentUserId,
      content: commentContent,
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setPostComments(prev => {
      const existingComments = prev[postId] || []
      return {
        ...prev,
        [postId]: [...existingComments, optimisticComment]
      }
    })
    
    // Update comment count in posts
    setForumPosts(prevPosts => {
      return prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            commentsCount: (post.commentsCount || 0) + 1
          }
        }
        return post
      })
    })
    
    // Clear comment input
    setCommentText('')
    setSelectedPostId(null)
    
    try {
      const response = await forumAPI.comments.create(postId, {
        content: commentContent
      })
      if (response.success && response.data) {
        // Replace optimistic comment with real comment from server
        setPostComments(prev => {
          const existingComments = prev[postId] || []
          const filteredComments = existingComments.filter(c => c.id !== tempCommentId)
          return {
            ...prev,
            [postId]: [...filteredComments, response.data]
          }
        })
      } else {
        // Remove optimistic comment on error
        setPostComments(prev => {
          const existingComments = prev[postId] || []
          const filteredComments = existingComments.filter(c => c.id !== tempCommentId)
          return {
            ...prev,
            [postId]: filteredComments
          }
        })
        // Revert comment count
        setForumPosts(prevPosts => {
          return prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                commentsCount: Math.max(0, (post.commentsCount || 1) - 1)
              }
            }
            return post
          })
        })
        alert('Failed to add comment: ' + (response.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error adding comment:', error)
      // Remove optimistic comment on error
      setPostComments(prev => {
        const existingComments = prev[postId] || []
        const filteredComments = existingComments.filter(c => c.id !== tempCommentId)
        return {
          ...prev,
          [postId]: filteredComments
        }
      })
      // Revert comment count
      setForumPosts(prevPosts => {
        return prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              commentsCount: Math.max(0, (post.commentsCount || 1) - 1)
            }
          }
          return post
        })
      })
      alert('Error: ' + (error.message || 'Failed to add comment'))
    }
  }

  const handleShare = (postId: string) => {
    if (navigator.share) {
      const post = formattedPosts.find(p => p.id === postId)
      navigator.share({
        title: post?.title || 'Forum Post',
        text: post?.content || '',
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err))
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleBookmark = (postId: string) => {
    // TODO: Implement bookmark functionality
    console.log('Bookmark post:', postId)
  }

  const handleCreatePost = () => {
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setCreateFormData({
      title: '',
      content: '',
      category: 'General',
      tags: [],
      images: []
    })
    setTagInput('')
    setImagePreview([])
  }

  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !createFormData.tags.includes(tagInput.trim())) {
      setCreateFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setCreateFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setCreateFormData(prev => ({
          ...prev,
          images: [...prev.images, base64]
        }))
        setImagePreview(prev => [...prev, base64])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setCreateFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setImagePreview(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!createFormData.title.trim() || createFormData.title.trim().length < 5) {
      alert('Title must be at least 5 characters')
      return
    }

    if (!createFormData.content.trim() || createFormData.content.trim().length < 20) {
      alert('Content must be at least 20 characters')
      return
    }

    if (!currentUser) {
      alert('Please login to create a post')
      return
    }

    setCreateLoading(true)

    try {
      console.log('[Forum] Creating post...', createFormData)
      const response = await forumAPI.posts.create({
        title: createFormData.title.trim(),
        content: createFormData.content.trim(),
        category: createFormData.category,
        tags: createFormData.tags,
        images: createFormData.images
      })

      console.log('[Forum] Create post response:', response)

      // Handle response - check both success flag and status code
      if ((response.success && response.data) || (response.status === 201 && response.data)) {
        const newPost = response.data || response
        console.log('[Forum] New post created:', newPost)
        
        // Validate post has required fields
        if (!newPost.id || !newPost.title) {
          console.error('[Forum] Invalid post data:', newPost)
          alert('Post created but has invalid data. Please refresh the page.')
          handleCloseCreateModal()
          // Still reload to get the correct data
          setTimeout(() => loadPosts(), 1000)
          return
        }
        
        // Also add current user to users map if not already there
        const currentUserId = currentUser?.userId || currentUser?.id
        if (currentUserId) {
          setUsers(prevUsers => {
            if (!prevUsers[currentUserId]) {
              console.log('[Forum] Adding current user to users map:', currentUserId)
              return {
                ...prevUsers,
                [currentUserId]: currentUser
              }
            }
            return prevUsers
          })
        }
        
        // Optimistic update: Add post to state immediately
        setForumPosts(prevPosts => {
          // Check if post already exists (avoid duplicates)
          const exists = prevPosts.some(p => p.id === newPost.id)
          if (exists) {
            console.log('[Forum] Post already exists, skipping duplicate')
            return prevPosts
          }
          
          // Add new post at the beginning of the list
          const updatedPosts = [newPost, ...prevPosts]
          console.log('[Forum] Updated posts list:', updatedPosts.length, 'posts (added new post with id:', newPost.id, ')')
          return updatedPosts
        })
        
        // Close modal and reset form first (before any state updates that might trigger re-renders)
        handleCloseCreateModal()
        
        // IMPORTANT: Reset category filter to 'all' to ensure new post is visible
        // This is critical - if user is filtering by a category that doesn't match the new post,
        // the post won't show up even though it was added to state
        if (selectedCategory !== 'all') {
          console.log('[Forum] Resetting category filter from', selectedCategory, 'to all to show new post')
          setSelectedCategory('all')
        }
        
        // Clear search term to ensure post is visible
        if (searchTerm) {
          console.log('[Forum] Clearing search term to show new post')
          setSearchTerm('')
        }
        
        // Scroll to top to show the new post
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 200)
        
        // DON'T reload immediately - let the optimistic update stay visible
        // Only reload after a longer delay to sync with server for other users
        // This prevents the post from disappearing if server is slow to save
        setTimeout(async () => {
          console.log('[Forum] Syncing posts with server (post should already be visible)...')
          try {
            // Reload without loading indicator and without clearing existing posts
            // The merge logic will preserve the optimistic update
            await loadPosts(false)
            console.log('[Forum] Posts synced with server successfully')
          } catch (error) {
            console.error('[Forum] Error syncing posts:', error)
            // Post should still be visible from optimistic update
            console.log('[Forum] Sync failed, but post should still be visible from optimistic update')
          }
        }, 5000) // Wait 5 seconds for server to fully save to Blob Storage
      } else {
        console.error('[Forum] Create post failed:', response)
        const errorMsg = response.error || response.message || 'Failed to create post'
        alert('Error: ' + errorMsg + '\n\nPlease check console for details.')
      }
    } catch (error: any) {
      console.error('[Forum] Error creating post:', error)
      alert('Error: ' + (error.message || 'Failed to create post. Please try again.'))
    } finally {
      setCreateLoading(false)
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
              onClick={() => navigateToDashboard(navigate)}
            >
              <div className="w-10 h-10 flex items-center justify-center mr-3">
                <img src="/HCMCUT.png" alt="HCMUT Logo" className="w-10 h-10" />
              </div>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                HCMUT
              </span>
            </div>

            {/* Forum Stats */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                FORUM STATS
              </h3>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Posts:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {formattedPosts.length}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Active Users:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {Object.keys(users).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                CATEGORIES
              </h3>
              <div className="space-y-2">
                {categoryOptions.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                      selectedCategory === category.value
                        ? 'bg-blue-100 text-blue-700'
                        : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                QUICK ACTIONS
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => navigateToDashboard(navigate)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Dashboard
                </button>
                <button 
                  onClick={() => navigate('/common/profile')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <PersonIcon className="mr-3 w-4 h-4" />
                  Profile Management
                </button>
                <button 
                  onClick={() => navigate('/common/library')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <LibraryIcon className="mr-3 w-4 h-4" />
                  Digital Library
                </button>
                <button 
                  onClick={() => navigate('/common/notifications')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <NotificationsIcon className="mr-3 w-4 h-4" />
                  Notifications
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6">
          {/* Mobile Menu Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={handleDrawerToggle}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Community Forum
                </h1>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Connect, learn, and share knowledge with the community
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleCreatePost}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Add className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Search */}
            <div className="lg:col-span-2">
              <Card 
                className={`p-6 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Search Posts
                </h3>
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search by title, content, or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-4 py-3 pl-10 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <select
                      value={selectedSort}
                      onChange={(e) => setSelectedSort(e.target.value)}
                      className={`w-full px-3 py-3 border rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card 
                className={`p-6 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}>
                    <TrendingUp className="mr-3 w-4 h-4" />
                    Trending Posts
                  </button>
                </div>
              </Card>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>No posts found</p>
                <Button 
                  onClick={handleCreatePost}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                >
                  Create First Post
                </Button>
              </div>
            ) : (
              filteredPosts.map((post) => (
              <Card 
                key={post.id} 
                className={`overflow-hidden border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                style={{
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  boxShadow: 'none !important'
                }}
              >
                <div className="p-6">
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {post.title}
                      </h3>
                      <div className="flex items-center space-x-4 mb-2 flex-wrap">
                        <div className="flex items-center">
                          <Person className="w-4 h-4 text-gray-400 mr-2" />
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {post.author}
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            post.authorRole === 'tutor' ? 'bg-blue-100 text-blue-800' :
                            post.authorRole === 'management' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {post.authorRole}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Schedule className="w-4 h-4 text-gray-400 mr-2" />
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {post.timestamp}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBookmark(post.id)}
                        className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShare(post.id)}
                        className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        <Share className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="mb-4">
                      <div className={`grid gap-2 ${
                        post.images.length === 1 ? 'grid-cols-1' :
                        post.images.length === 2 ? 'grid-cols-2' :
                        'grid-cols-3'
                      }`}>
                        {post.images.slice(0, 3).map((image: string, index: number) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                      {post.images.length > 3 && (
                        <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          +{post.images.length - 3} more images
                        </p>
                      )}
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-wrap`}>
                      {post.content}
                    </p>
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 4).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                            #{tag}
                        </span>
                      ))}
                      {post.tags.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{post.tags.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-between border-t pt-4 mt-4">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        disabled={likingPostId === post.id}
                        className={`flex items-center space-x-2 ${
                          post.isLiked 
                            ? 'text-blue-600' 
                            : `${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'}`
                        } ${likingPostId === post.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <ThumbUp className="w-4 h-4" />
                        <span className="text-sm">{post.likes}</span>
                      </button>
                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'}`}
                      >
                        <Comment className="w-4 h-4" />
                        <span className="text-sm">{post.comments}</span>
                      </button>
                      <button
                        onClick={() => handleShare(post.id)}
                        className={`flex items-center space-x-2 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'}`}
                      >
                        <Share className="w-4 h-4" />
                        <span className="text-sm">{post.shares}</span>
                      </button>
                    </div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {post.views} views
                    </div>
                  </div>

                  {/* Comments Section */}
                  {showComments[post.id] && (
                    <div className="mt-4 pt-4 border-t">
                      {/* Comments List */}
                      {postComments[post.id] && postComments[post.id].length > 0 && (
                        <div className="space-y-3 mb-4">
                          {postComments[post.id].map((comment: any) => {
                            const commentAuthor = users[comment.authorId]
                            return (
                              <div key={comment.id} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <div className="flex items-center mb-2">
                                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {commentAuthor?.name || commentAuthor?.email || 'Unknown User'}
                                  </span>
                                  <span className={`ml-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {comment.content}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      
                      {/* Add Comment */}
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={post.id === selectedPostId ? commentText : ''}
                          onChange={(e) => {
                            setCommentText(e.target.value)
                            setSelectedPostId(post.id)
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(post.id)
                            }
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className={`px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white`}
                        >
                          <SendIcon className="w-4 h-4" />
                        </button>
                  </div>
                    </div>
                  )}
                </div>
              </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Create New Post
              </h2>
              <button
                onClick={handleCloseCreateModal}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPost}>
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={createFormData.title}
                    onChange={handleCreateFormChange}
                    placeholder="Enter post title (min 5 characters)"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Category *
                  </label>
                  <select
                    name="category"
                    value={createFormData.category}
                    onChange={handleCreateFormChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Content *
                  </label>
                  <textarea
                    name="content"
                    value={createFormData.content}
                    onChange={handleCreateFormChange}
                    placeholder="Write your post content (min 20 characters)"
                    rows={6}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tags
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      placeholder="Add a tag and press Enter"
                      className={`flex-1 px-4 py-2 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                  {createFormData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {createFormData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <CloseIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Images */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Images
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Upload Images
                  </label>
                  {imagePreview.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {imagePreview.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                          >
                            <CloseIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 mt-6">
                <Button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Post'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className={`px-6 ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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

              {/* Mobile Forum Stats */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  FORUM STATS
                </h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Posts:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {formattedPosts.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Categories */}
              <div className="mb-8">
                <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  CATEGORIES
                </h3>
                <div className="space-y-2">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => {
                        setSelectedCategory(category.value)
                        setMobileOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                        selectedCategory === category.value
                          ? 'bg-blue-100 text-blue-700'
                          : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                      }`}
                    >
                      <span>{category.name}</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Quick Actions */}
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    navigateToDashboard(navigate)
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Dashboard
                </button>
                <button 
                  onClick={() => {
                    navigate('/common/profile')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <PersonIcon className="mr-3 w-4 h-4" />
                  Profile Management
                </button>
                <button 
                  onClick={() => {
                    navigate('/common/library')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <LibraryIcon className="mr-3 w-4 h-4" />
                  Digital Library
                </button>
                <button 
                  onClick={() => {
                    navigate('/common/notifications')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <NotificationsIcon className="mr-3 w-4 h-4" />
                  Notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OnlineCommunityForum
