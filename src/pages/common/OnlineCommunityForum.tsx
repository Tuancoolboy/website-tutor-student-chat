import React, { useState, useEffect } from 'react'
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
  NotificationsActive as NotificationsIcon
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

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true)
        const response = await forumAPI.posts.list({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchTerm || undefined
        })
        
        if (response.success && response.data) {
          const posts = Array.isArray(response.data) ? response.data : response.data.posts || []
          setForumPosts(posts)
          
          // Load user info for all authors
          const userIds = new Set<string>()
          posts.forEach((post: any) => {
            if (post.authorId) {
              userIds.add(post.authorId)
            }
          })
          
          // Load users
          const userPromises = Array.from(userIds).map(async (userId) => {
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
          setUsers(usersMap)
        }
      } catch (error) {
        console.error('Failed to load posts:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadPosts()
  }, [selectedCategory, searchTerm])

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
      author: author?.name || author?.email || 'Unknown',
      authorRole: author?.role || 'User',
      category: post.category,
      content: post.content,
      images: post.images || [],
      likes: post.likes?.length || 0,
      comments: post.commentsCount || 0,
      shares: 0,
      isBookmarked: false,
      isLiked,
      timestamp: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
      tags: post.tags || []
    }
  }

  const categories = [
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
  
  const filteredPosts = formattedPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        post.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleLike = (postId: number) => {
    console.log('Like post:', postId)
  }

  const handleComment = (postId: number) => {
    console.log('Comment on post:', postId)
  }

  const handleShare = (postId: number) => {
    console.log('Share post:', postId)
  }

  const handleBookmark = (postId: number) => {
    console.log('Bookmark post:', postId)
  }

  const handleCreatePost = () => {
    navigate('/common/forum/create')
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
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Bookmarked:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {formattedPosts.filter(p => p.isBookmarked).length}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Active Users:</span>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>1,247</span>
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
                {categories.map((category) => (
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
                  onClick={() => navigate('/common')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Login
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
                  <div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <FilterList className="w-4 h-4 mr-2" />
                      Advanced Filters
                    </Button>
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
                    <Bookmark className="mr-3 w-4 h-4" />
                    My Bookmarks
                  </button>
                  <button className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}>
                    <TrendingUp className="mr-3 w-4 h-4" />
                    Trending Posts
                  </button>
                  <button className={`w-full flex items-center px-4 py-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}>
                    <Person className="mr-3 w-4 h-4" />
                    My Posts
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
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Đang tải bài viết...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Không có bài viết nào</p>
                <Button 
                  onClick={handleCreatePost}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                >
                  Tạo Bài Viết Đầu Tiên
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
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center">
                          <Person className="w-4 h-4 text-gray-400 mr-2" />
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {post.author}
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            post.authorRole === 'Tutor' ? 'bg-blue-100 text-blue-800' :
                            post.authorRole === 'Professor' ? 'bg-purple-100 text-purple-800' :
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
                        className={`p-2 rounded-lg ${
                          post.isBookmarked 
                            ? 'bg-yellow-100 text-yellow-600' 
                            : `${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`
                        }`}
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
                          +{post.images.length - 3} hình ảnh khác
                        </p>
                      )}
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-3`}>
                      {post.content}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 4).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{post.tags.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 ${
                          post.isLiked 
                            ? 'text-blue-600' 
                            : `${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'}`
                        }`}
                      >
                        <ThumbUp className="w-4 h-4" />
                        <span className="text-sm">{post.likes}</span>
                      </button>
                      <button
                        onClick={() => handleComment(post.id)}
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
                    <Button 
                      size="small" 
                      variant="outlined"
                      style={{
                        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                        borderColor: theme === 'dark' ? '#000000' : '#d1d5db',
                        textTransform: 'none',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#1f2937' : '#f3f4f6'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff'
                      }}
                    >
                      Read More
                    </Button>
                  </div>
                </div>
              </Card>
              ))
            )}
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
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Bookmarked:</span>
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {formattedPosts.filter(p => p.isBookmarked).length}
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
                  {categories.map((category) => (
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
                    navigate('/common')
                    setMobileOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ArrowBackIcon className="mr-3 w-4 h-4" />
                  Back to Login
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
