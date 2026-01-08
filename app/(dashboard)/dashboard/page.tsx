import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Golfer';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-display font-bold text-golf-text">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Ready to hit the links? Start a new round or check your stats.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start New Round */}
        <Link
          href="/rounds/new"
          className="group bg-primary hover:bg-primary-600 text-white rounded-xl p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Start New Round</h3>
              <p className="text-white/70 text-sm">Begin tracking a round</p>
            </div>
          </div>
        </Link>

        {/* View Courses */}
        <Link
          href="/courses"
          className="group bg-white hover:bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
              <svg className="h-6 w-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-golf-text">View Courses</h3>
              <p className="text-gray-500 text-sm">Browse golf courses</p>
            </div>
          </div>
        </Link>

        {/* My Stats */}
        <Link
          href="/players"
          className="group bg-white hover:bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-colors">
              <svg className="h-6 w-6 text-accent-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-golf-text">My Stats</h3>
              <p className="text-gray-500 text-sm">View your statistics</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Handicap Index</p>
          <p className="text-3xl font-bold text-golf-text">--</p>
          <p className="text-xs text-gray-400 mt-1">No rounds yet</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Rounds Played</p>
          <p className="text-3xl font-bold text-golf-text">0</p>
          <p className="text-xs text-gray-400 mt-1">This year</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Best Score</p>
          <p className="text-3xl font-bold text-golf-text">--</p>
          <p className="text-xs text-gray-400 mt-1">No rounds yet</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Average Score</p>
          <p className="text-3xl font-bold text-golf-text">--</p>
          <p className="text-xs text-gray-400 mt-1">No rounds yet</p>
        </div>
      </div>

      {/* Recent Rounds */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-golf-text">Recent Rounds</h2>
            <Link
              href="/rounds"
              className="text-sm text-primary hover:text-primary-600 font-medium transition-colors"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-golf-text mb-2">No rounds yet</h3>
          <p className="text-gray-500 mb-4">Start tracking your golf game by creating your first round.</p>
          <Link
            href="/rounds/new"
            className="btn-primary"
          >
            Start Your First Round
          </Link>
        </div>
      </div>

      {/* In Progress Round (placeholder for when there's an active round) */}
      {/* This section will show when a user has an in-progress round */}
    </div>
  );
}
