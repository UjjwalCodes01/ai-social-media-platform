'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { scheduleAPI } from '@/lib/api';

interface ScheduledPost {
  id: string;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook';
  content: string;
  scheduledDate: string; // YYYY-MM-DD format
  scheduledTime: string; // HH:MM format
  status: 'scheduled' | 'published' | 'draft';
  createdAt: Date;
}

interface NewPostForm {
  content: string;
  platform: string;
  scheduledDate: string;
  scheduledTime: string;
}

const platformConfig = {
  twitter: { name: 'Twitter', icon: '🐦', color: 'bg-blue-500', textColor: 'text-blue-500' },
  linkedin: { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700', textColor: 'text-blue-700' },
  instagram: { name: 'Instagram', icon: '📸', color: 'bg-pink-500', textColor: 'text-pink-500' },
  facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-600', textColor: 'text-blue-600' }
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [showDayView, setShowDayView] = useState(false);
  const [newPost, setNewPost] = useState<NewPostForm>({
    content: '',
    platform: 'twitter',
    scheduledDate: '',
    scheduledTime: '12:00'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScheduledPosts = async () => {
      try {
        const response = await scheduleAPI.getPosts();
        if (response.success) {
          // Transform the data to match our interface
          const transformedPosts = response.posts.map((post: any) => ({
            id: post._id,
            platform: post.platforms[0], // Take the first platform
            content: post.content,
            scheduledDate: new Date(post.scheduledFor).toISOString().split('T')[0],
            scheduledTime: new Date(post.scheduledFor).toTimeString().slice(0, 5),
            status: post.status,
            createdAt: new Date(post.createdAt)
          }));
          setScheduledPosts(transformedPosts);
        }
      } catch (error) {
        console.error('Failed to fetch scheduled posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledPosts();
  }, []);

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getPostsForDate = (dateKey: string) => {
    return scheduledPosts.filter(post => post.scheduledDate === dateKey);
  };

  const hasPostsOnDate = (year: number, month: number, day: number) => {
    const dateKey = formatDateKey(year, month, day);
    return getPostsForDate(dateKey).length > 0;
  };

  const isToday = (year: number, month: number, day: number) => {
    return year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
  };

  const handleDateClick = (day: number) => {
    const dateKey = formatDateKey(currentYear, currentMonth, day);
    setSelectedDate(dateKey);
    setShowDayView(true);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
  };

  const handleAddPost = () => {
    if (!newPost.content.trim()) return;

    const post: ScheduledPost = {
      id: Date.now().toString(),
      platform: newPost.platform as any,
      content: newPost.content,
      scheduledDate: newPost.scheduledDate,
      scheduledTime: newPost.scheduledTime,
      status: 'scheduled',
      createdAt: new Date()
    };

    setScheduledPosts(prev => [...prev, post]);
    setNewPost({ content: '', platform: 'twitter', scheduledDate: '', scheduledTime: '12:00' });
    setShowAddPostModal(false);
  };

  const handleEditPost = (postId: string) => {
    // TODO: Implement edit functionality
    alert(`Edit post ${postId} - This would open an edit modal in a real app`);
  };

  const handleDeletePost = (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      setScheduledPosts(prev => prev.filter(post => post.id !== postId));
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link
              href="/Dashboard"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Content Calendar</h1>
              <p className="text-sm text-gray-400">Plan and schedule your posts</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddPostModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>📝</span>
            <span>Add Post</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Calendar View */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-gray-400 text-sm font-medium">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="p-2"></div>;
                  }

                  const hasScheduledPosts = hasPostsOnDate(currentYear, currentMonth, day);
                  const isCurrentDay = isToday(currentYear, currentMonth, day);
                  const postsForDay = getPostsForDate(formatDateKey(currentYear, currentMonth, day));

                  return (
                    <div
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`
                        relative p-2 h-20 border border-gray-700 cursor-pointer transition-colors hover:bg-gray-700
                        ${isCurrentDay ? 'bg-blue-900 border-blue-600' : 'bg-gray-800'}
                        ${hasScheduledPosts ? 'ring-1 ring-blue-500' : ''}
                      `}
                    >
                      <div className="text-white text-sm font-medium">{day}</div>
                      
                      {/* Platform indicators */}
                      {hasScheduledPosts && (
                        <div className="absolute bottom-1 left-1 right-1 flex space-x-1">
                          {[...new Set(postsForDay.map(p => p.platform))].slice(0, 3).map(platform => (
                            <div
                              key={platform}
                              className={`w-2 h-2 rounded-full ${platformConfig[platform].color}`}
                            />
                          ))}
                          {postsForDay.length > 3 && (
                            <div className="w-2 h-2 rounded-full bg-gray-500" />
                          )}
                        </div>
                      )}
                      
                      {/* Post count */}
                      {postsForDay.length > 0 && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {postsForDay.length}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Day View Sidebar */}
          <div className="lg:col-span-1">
            {showDayView && selectedDate ? (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {formatDate(selectedDate)}
                  </h3>
                  <button
                    onClick={() => setShowDayView(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3">
                  {getPostsForDate(selectedDate).map(post => (
                    <div key={post.id} className="bg-gray-700 rounded-lg p-4">
                      {/* Platform and Time */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{platformConfig[post.platform].icon}</span>
                          <span className={`text-sm font-medium ${platformConfig[post.platform].textColor}`}>
                            {platformConfig[post.platform].name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatTime(post.scheduledTime)}
                        </span>
                      </div>
                      
                      {/* Content */}
                      <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                        {post.content}
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPost(post.id)}
                          className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-500 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {getPostsForDate(selectedDate).length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📅</div>
                      <p className="text-gray-400 text-sm">No posts scheduled for this day</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-lg font-semibold text-white mb-2">Select a Date</h3>
                <p className="text-gray-400 text-sm">Click on a date to view scheduled posts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Post Modal */}
      {showAddPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Schedule New Post</h3>
                <button
                  onClick={() => setShowAddPostModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Platform
                  </label>
                  <select
                    value={newPost.platform}
                    onChange={(e) => setNewPost({...newPost, platform: e.target.value})}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(platformConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.icon} {config.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    placeholder="What would you like to post?"
                    rows={4}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newPost.scheduledDate}
                    onChange={(e) => setNewPost({...newPost, scheduledDate: e.target.value})}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newPost.scheduledTime}
                    onChange={(e) => setNewPost({...newPost, scheduledTime: e.target.value})}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddPostModal(false)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPost}
                  disabled={!newPost.content.trim() || !newPost.scheduledDate}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  Schedule Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}