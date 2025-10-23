import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, Clock, Bookmark } from 'lucide-react';

export function AccountLayout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/account/profile', icon: User, label: 'Profile' },
    { path: '/account/history', icon: Clock, label: 'Watch History' },
    { path: '/account/watchlist', icon: Bookmark, label: 'My Watchlist' },
  ];

  return (
    <div className="min-h-screen bg-white pt-14 pl-60">
      <div className="px-6 py-6">
        <div className="flex gap-6">
          <aside className="w-60">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">My Account</h2>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive(item.path)
                        ? 'bg-gray-200 text-gray-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
