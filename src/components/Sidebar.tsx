import { Home, Compass, Film, Tv, Music, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const mainLinks = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Compass, label: 'Explore', path: '/catalog' },
  ];

  const contentLinks = [
    { icon: Film, label: 'Movies', path: '/content/film' },
    { icon: Tv, label: 'Series', path: '/content/series' },
    { icon: Sparkles, label: 'Anime', path: '/content/anime' },
    { icon: Music, label: 'Music', path: '/content/music' },
  ];

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-60 bg-white border-r border-gray-200 overflow-y-auto scrollbar-thin hidden lg:block">
      <div className="py-2">
        <div className="px-3 py-2">
          {mainLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-6 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(link.path)
                  ? 'bg-gray-100 font-medium text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span className="text-sm">{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="border-t border-gray-200 my-2"></div>

        <div className="px-3 py-2">
          <h3 className="px-3 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Browse
          </h3>
          {contentLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-6 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(link.path)
                  ? 'bg-gray-100 font-medium text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span className="text-sm">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
