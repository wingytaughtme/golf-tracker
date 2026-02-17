import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo_crest_text.png"
                alt="Birdie Book"
                width={160}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-white/90 hover:text-secondary transition-colors font-medium"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="bg-secondary text-primary px-4 py-2 rounded-lg font-medium hover:bg-secondary-400 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-primary pb-20 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white mb-6">
              Track Your Golf Game
              <span className="block text-secondary">Like a Pro</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              The simplest way to track your scores, calculate your handicap, and analyze your game.
              Works on any course, right from your phone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-secondary text-primary-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-secondary-400 transition-colors shadow-lg"
              >
                Start Tracking Free
              </Link>
              <Link
                href="/login"
                className="bg-white/10 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition-colors border border-secondary/30"
              >
                Log In
              </Link>
            </div>
          </div>

          {/* Scorecard Preview */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-card rounded-xl shadow-2xl overflow-hidden border-t-3 border-secondary">
              <div className="bg-primary-600 px-6 py-3 flex justify-between items-center">
                <span className="text-white font-semibold">Pebble Beach Golf Links</span>
                <span className="text-primary-200 text-sm">Blue Tees - 72.4 / 134</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream-200 border-b border-card-border">
                      <th className="px-3 py-2 text-left font-semibold text-muted">HOLE</th>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <th key={n} className="px-3 py-2 text-center font-semibold text-muted w-10">{n}</th>
                      ))}
                      <th className="px-3 py-2 text-center font-semibold text-muted bg-cream-300">OUT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-card-border">
                      <td className="px-3 py-2 font-medium text-muted">PAR</td>
                      {[4, 5, 4, 4, 3, 5, 3, 4, 4].map((p, i) => (
                        <td key={i} className="px-3 py-2 text-center text-muted">{p}</td>
                      ))}
                      <td className="px-3 py-2 text-center font-semibold bg-cream-300 text-charcoal">36</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium text-charcoal">You</td>
                      {[4, 6, 4, 5, 3, 5, 2, 4, 5].map((s, i) => {
                        const par = [4, 5, 4, 4, 3, 5, 3, 4, 4][i];
                        const diff = s - par;
                        let className = "px-3 py-2 text-center font-semibold ";
                        if (diff <= -2) className += "text-score-eagle";
                        else if (diff === -1) className += "text-score-birdie";
                        else if (diff === 0) className += "text-charcoal";
                        else if (diff === 1) className += "text-score-bogey";
                        else className += "text-score-triple";
                        return <td key={i} className={className}>{s}</td>;
                      })}
                      <td className="px-3 py-2 text-center font-bold bg-cream-300 text-charcoal">38</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal mb-4">
              Everything You Need to Improve
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              From casual weekend rounds to tournament play, Birdie Book helps you understand your game.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card p-8 hover:shadow-md transition-shadow">
              <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-3">Digital Scorecard</h3>
              <p className="text-muted">
                Beautiful, easy-to-use scorecard that works just like paper. Track scores for up to 4 players with automatic totals.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-8 hover:shadow-md transition-shadow">
              <div className="h-14 w-14 bg-secondary/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="h-7 w-7 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-3">Handicap Calculator</h3>
              <p className="text-muted">
                Automatic handicap calculation using the World Handicap System. Watch your index improve as you play more rounds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-8 hover:shadow-md transition-shadow">
              <div className="h-14 w-14 bg-score-birdie/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="h-7 w-7 text-score-birdie" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-3">Detailed Statistics</h3>
              <p className="text-muted">
                Track fairways, greens in regulation, putts, and more. See trends over time and identify areas to practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">1000+</div>
              <div className="text-white/70">Golf Courses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">18</div>
              <div className="text-white/70">Holes Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">4</div>
              <div className="text-white/70">Players per Round</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">WHS</div>
              <div className="text-white/70">Handicap System</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal mb-4">
            Ready to Lower Your Scores?
          </h2>
          <p className="text-lg text-muted mb-8">
            Join golfers who are tracking their way to better rounds. It&apos;s free to get started.
          </p>
          <Link
            href="/register"
            className="btn-primary inline-block text-lg px-8 py-4"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cream-300 border-t border-card-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo_crest_text.png"
                alt="Birdie Book"
                width={120}
                height={30}
                className="h-8 w-auto"
              />
            </div>
            <p className="text-sm text-muted">
              &copy; {new Date().getFullYear()} Birdie Book. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
