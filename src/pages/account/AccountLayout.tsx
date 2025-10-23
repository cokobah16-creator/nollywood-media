import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, Clock, Bookmark, Heart, MessageSquare } from 'lucide-react';

export function AccountLayout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/account/profile', icon: User, label: 'Profile' },
    { path: '/account/watchlist', icon: Bookmark, label: 'My Watchlist' },
    { path: '/account/history', icon: Clock, label: 'Watch History' },
  ];

  return (
    <div className="min-h-screen bg-white pt-14 lg:pl-60">
      <div className="px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          <aside className="w-60 flex-shrink-0">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 sticky top-20">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">My Account</h2>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-red-600 text-white font-medium shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                  Library
                </h3>
                <nav className="space-y-1">
                  <Link
                    to="/account/watchlist"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:translate-x-1 transition-all duration-200"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>Saved Videos</span>
                  </Link>
                  <Link
                    to="/account/history"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:translate-x-1 transition-all duration-200"
                  >
                    <Clock className="h-4 w-4" />
                    <span>History</span>
                  </Link>
                </nav>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
