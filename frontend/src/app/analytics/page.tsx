'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { analyticsAPI } from '@/lib/api'
import { ArrowLeftIcon, TrendingUpIcon, EyeIcon, HeartIcon, ShareIcon, MessageCircleIcon, CalendarIcon, FilterIcon } from 'lucide-react'

// Interfaces for analytics data
interface AnalyticsMetrics {
  totalEngagement: number;
  totalReach: number;
  totalImpressions: number;
  totalFollowers: number;
  engagementRate: number;
  avgPostReach: number;
  previousPeriod?: {
    totalEngagement: number;
    totalReach: number;
    totalImpressions: number;
    totalFollowers: number;
    engagementRate: number;
    avgPostReach: number;
  };
}

interface PlatformData {
  name: string;
  totalEngagement: number;
  engagement: number;
  reach: number;
  followers: number;
  posts: number;
  engagementRate: string;
}

interface EngagementData {
  platform: string;
  engagement: number;
  color: string;
}

interface TopPost {
  id: number | string;
  content: string;
  platform: string;
  engagement: number;
  reach: number;
  likes: number;
  shares: number;
  comments: number;
  date: string;
  platformColor: string;
}

const timeRanges = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' }
]

const platformColors = {
  twitter: 'bg-blue-500',
  linkedin: 'bg-blue-700', 
  instagram: 'bg-pink-600',
  facebook: 'bg-blue-600'
}

export default function AnalyticsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [engagementData, setEngagementData] = useState<EngagementData[]>([])
  const [topPosts, setTopPosts] = useState<TopPost[]>([])
  const [growthData, setGrowthData] = useState<{ [key: string]: number }>({})

  // Platform filter options
  const platformOptions = [
    { label: 'All Platforms', value: 'all' },
    { label: 'Twitter', value: 'twitter' },
    { label: 'LinkedIn', value: 'linkedin' },
    { label: 'Instagram', value: 'instagram' },
    { label: 'Facebook', value: 'facebook' }
  ]  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setIsLoading(true)
        
        // Load overview metrics - only use real data
        const overviewResponse = await analyticsAPI.getOverview(selectedTimeRange)
        if (overviewResponse.success && overviewResponse.data) {
          setMetrics(overviewResponse.data)
          
          // Calculate real growth data from previous period
          if (overviewResponse.data.previousPeriod) {
            const currentMetrics = overviewResponse.data
            const previousMetrics = overviewResponse.data.previousPeriod
            
            const calculateGrowth = (current: number, previous: number) => {
              if (previous === 0) return 0
              return Math.round(((current - previous) / previous) * 100)
            }
            
            setGrowthData({
              totalEngagement: calculateGrowth(currentMetrics.totalEngagement, previousMetrics.totalEngagement),
              totalReach: calculateGrowth(currentMetrics.totalReach, previousMetrics.totalReach),
              engagementRate: calculateGrowth(currentMetrics.engagementRate, previousMetrics.engagementRate),
              totalImpressions: calculateGrowth(currentMetrics.totalImpressions, previousMetrics.totalImpressions),
              totalFollowers: calculateGrowth(currentMetrics.totalFollowers, previousMetrics.totalFollowers),
              avgPostReach: calculateGrowth(currentMetrics.avgPostReach, previousMetrics.avgPostReach)
            })
          } else {
            setGrowthData({})
          }
        } else {
          // No backend data available
          setMetrics(null)
          setGrowthData({})
        }

        // Load platform comparison data - only real data
        const platformResponse = await analyticsAPI.getPlatformComparison(selectedTimeRange)
        if (platformResponse.success && platformResponse.data) {
          let platformData: PlatformData[] = platformResponse.data
          
          // Filter by selected platform if not 'all'
          if (selectedPlatform !== 'all') {
            platformData = platformData.filter((platform: PlatformData) => 
              platform.name.toLowerCase() === selectedPlatform.toLowerCase()
            )
          }
          
          const filteredData = platformData.map((platform: PlatformData) => ({
            platform: platform.name,
            engagement: platform.totalEngagement || 0,
            color: platformColors[platform.name.toLowerCase() as keyof typeof platformColors] || 'bg-gray-500'
          }))
          setEngagementData(filteredData)
        } else {
          // No platform data available
          setEngagementData([])
        }

        // Load top posts - only real data
        const topPostsParams: {
          limit: number;
          timeRange: string;
          platform?: string;
        } = { 
          limit: 5, 
          timeRange: selectedTimeRange 
        }
        
        if (selectedPlatform !== 'all') {
          topPostsParams.platform = selectedPlatform
        }
        
        const postsResponse = await analyticsAPI.getTopPosts(topPostsParams)
        if (postsResponse.success && postsResponse.data) {
          const postsData = postsResponse.data.map((post: TopPost & { scheduledDate?: string; createdAt?: string }) => ({
            id: post.id,
            content: post.content,
            platform: post.platform,
            engagement: post.engagement || 0,
            reach: post.reach || 0,
            likes: post.likes || 0,
            shares: post.shares || 0,
            comments: post.comments || 0,
            date: post.scheduledDate || post.createdAt || post.date,
            platformColor: platformColors[post.platform.toLowerCase() as keyof typeof platformColors] || 'bg-gray-500'
          }))
          setTopPosts(postsData)
        } else {
          // No posts data available
          setTopPosts([])
        }

      } catch (error) {
        console.error('Error loading analytics data:', error)
        toast.error('Failed to load analytics data from backend.', {
          position: 'top-right',
          autoClose: 5000
        })
        
        // Clear all data on error - no fallbacks
        setMetrics(null)
        setEngagementData([])
        setTopPosts([])
        setGrowthData({})
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalyticsData()
  }, [selectedTimeRange, selectedPlatform])

  const maxEngagement = engagementData.length > 0 ? Math.max(...engagementData.map(d => d.engagement)) : 0

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatGrowth = (growth: number) => {
    if (growth > 0) return `+${growth}%`
    if (growth < 0) return `${growth}%`
    return '0%'
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-400 bg-green-500/20'
    if (growth < 0) return 'text-red-400 bg-red-500/20'
    return 'text-gray-400 bg-gray-500/20'
  }

  // Handle view all posts click
  const handleViewAllPosts = () => {
    // Navigate to posts page with current filters
    window.location.href = `/posts?timeRange=${selectedTimeRange}&platform=${selectedPlatform}`
  }

  // Handle export data
  const handleExportData = () => {
    const dataToExport = {
      metrics,
      engagementData,
      topPosts,
      timeRange: selectedTimeRange,
      platform: selectedPlatform,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${selectedTimeRange}-${selectedPlatform}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Analytics data exported successfully!', {
      position: 'top-right',
      autoClose: 3000
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ToastContainer theme="dark" />
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/Dashboard" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-gray-400 text-sm">Performance insights for your content</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select 
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timeRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
                <CalendarIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 border border-gray-700 rounded-lg px-3 py-2 text-sm transition-colors ${
                  showFilters 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <FilterIcon className="w-4 h-4" />
                Filters
              </button>
              
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-t border-gray-800 bg-gray-900/50 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Platform:</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {platformOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Time Range:</label>
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timeRanges.map(range => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedPlatform('all')
                    setSelectedTimeRange('30d')
                    toast.success('Filters reset to default', { position: 'top-right', autoClose: 2000 })
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* No Data Message */}
        {!metrics && !isLoading && (
          <div className="text-center py-12 mb-8">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <TrendingUpIcon className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-50" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Analytics Data Available</h3>
              <p className="text-gray-400 mb-6">
                Start creating and publishing posts to see your analytics data here.
              </p>
              <div className="flex justify-center gap-4">
                <Link 
                  href="/create" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Create Your First Post
                </Link>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards - Only show if we have data */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUpIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-gray-300">Total Engagement</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getGrowthColor(growthData.totalEngagement || 0)}`}>
                  {formatGrowth(growthData.totalEngagement || 0)}
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{formatNumber(metrics?.totalEngagement || 0)}</p>
              <p className="text-sm text-gray-400 mt-1">Likes, shares, comments</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <EyeIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-gray-300">Total Reach</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getGrowthColor(growthData.totalReach || 0)}`}>
                  {formatGrowth(growthData.totalReach || 0)}
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{formatNumber(metrics?.totalReach || 0)}</p>
              <p className="text-sm text-gray-400 mt-1">Unique accounts reached</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <HeartIcon className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-gray-300">Engagement Rate</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getGrowthColor(growthData.engagementRate || 0)}`}>
                  {formatGrowth(growthData.engagementRate || 0)}
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{metrics?.engagementRate || 0}%</p>
              <p className="text-sm text-gray-400 mt-1">Avg. engagement per post</p>
            </div>
          </div>
        )}

        {/* Charts and Analytics - Only show if we have data */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Platform Engagement Chart */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-6">Engagement by Platform</h2>
                
                <div className="space-y-6">
                  {engagementData.length > 0 ? (
                    engagementData.map((platform, index) => (
                      <div key={platform.platform} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-300">{platform.platform}</span>
                          <span className="text-white font-semibold">{formatNumber(platform.engagement)}</span>
                        </div>
                        
                        <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                          <div 
                            className={`${platform.color} h-full rounded-full transition-all duration-1000 ease-out`}
                            style={{ 
                              width: `${maxEngagement > 0 ? (platform.engagement / maxEngagement) * 100 : 0}%`,
                              animationDelay: `${index * 0.2}s`
                            }}
                          />
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <HeartIcon className="w-3 h-3" />
                            {Math.floor(platform.engagement * 0.6)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShareIcon className="w-3 h-3" />
                            {Math.floor(platform.engagement * 0.25)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircleIcon className="w-3 h-3" />
                            {Math.floor(platform.engagement * 0.15)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <TrendingUpIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No platform data available</p>
                      <p className="text-sm mt-2">Publish posts on different platforms to see platform-specific analytics</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* Top Posts */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-6">Top Performing Posts</h2>
              
              <div className="space-y-4">
                {topPosts.length > 0 ? (
                  topPosts.slice(0, 5).map((post, index) => (
                    <div key={post.id} className="group">
                      <div className="bg-gray-750 hover:bg-gray-700 rounded-lg p-4 transition-colors cursor-pointer border border-gray-600">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                              {post.content}
                            </p>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`w-3 h-3 ${post.platformColor} rounded-full`} />
                              <span className="text-xs text-gray-400">{post.platform}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1 text-gray-400">
                                <TrendingUpIcon className="w-3 h-3" />
                                <span>{formatNumber(post.engagement)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-400">
                                <EyeIcon className="w-3 h-3" />
                                <span>{formatNumber(post.reach)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-400">
                                <HeartIcon className="w-3 h-3" />
                                <span>{post.likes}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-400">
                                <ShareIcon className="w-3 h-3" />
                                <span>{post.shares}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <TrendingUpIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No posts available</p>
                    <p className="text-sm mt-2">Create and schedule posts to see top performing content</p>
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleViewAllPosts}
                className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
              >
                View All Posts
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Additional Metrics Row - Only show if we have data */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <EyeIcon className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-300">Total Impressions</h3>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(metrics?.totalImpressions || 0)}</p>
              <p className="text-sm text-gray-400 mt-1">Times content was displayed</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <TrendingUpIcon className="w-5 h-5 text-indigo-500" />
                </div>
                <h3 className="font-semibold text-gray-300">Total Followers</h3>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(metrics?.totalFollowers || 0)}</p>
              <p className="text-sm text-gray-400 mt-1">Across all platforms</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <HeartIcon className="w-5 h-5 text-teal-500" />
                </div>
                <h3 className="font-semibold text-gray-300">Avg. Post Reach</h3>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(metrics?.avgPostReach || 0)}</p>
              <p className="text-sm text-gray-400 mt-1">Average reach per post</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}