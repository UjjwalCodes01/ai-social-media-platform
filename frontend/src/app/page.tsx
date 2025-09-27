import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">AI Social Platform</h1>
          <div className="flex space-x-4">
            <Link
              href="/Dashboard"
              className="text-gray-300 hover:text-white px-4 py-2 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/auth"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Manage Your Social Media with AI
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Create engaging content, schedule posts, and analyze performance across all your social media platforms with the power of artificial intelligence.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors transform hover:scale-105"
            >
              Start Free Trial
            </Link>
            <Link
              href="/auth"
              className="border border-gray-600 text-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 hover:border-gray-500 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6 bg-gray-800 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-3 text-white">AI Content Creation</h3>
            <p className="text-gray-300">
              Generate engaging posts, captions, and hashtags using advanced AI technology.
            </p>
          </div>
          
          <div className="text-center p-6 bg-gray-800 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-3 text-white">Smart Scheduling</h3>
            <p className="text-gray-300">
              Schedule posts across multiple platforms with optimal timing recommendations.
            </p>
          </div>
          
          <div className="text-center p-6 bg-gray-800 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3 text-white">Performance Analytics</h3>
            <p className="text-gray-300">
              Track engagement, reach, and growth with comprehensive analytics and insights.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
