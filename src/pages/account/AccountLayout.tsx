import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, Clock, Bookmark, ArrowLeft } from 'lucide-react';

export function AccountLayout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/account/profile', icon: User, label: 'Profile' },
    { path: '/account/history', icon: Clock, label: 'Watch History' },
    { path: '/account/watchlist', icon: Bookmark, label: 'My Watchlist' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <h2 className="mb-4 text-lg font-bold text-white">My Account</h2>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive(item.path)
                        ? 'bg-red-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
