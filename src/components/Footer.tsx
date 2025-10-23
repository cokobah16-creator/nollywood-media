import { Link } from 'react-router-dom';
import { Film, Shield, Mail, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const genres = [
    'Action',
    'Comedy',
    'Drama',
    'Romance',
    'Thriller',
    'Horror',
  ];

  const quickLinks = [
    { label: 'Home', path: '/' },
    { label: 'Catalog', path: '/catalog' },
    { label: 'Search', path: '/search' },
  ];

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div>
            <Link to="/" className="mb-4 flex items-center gap-2">
              <Film className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold text-white">NaijaMation</span>
            </Link>
            <p className="mb-4 text-sm text-slate-400">
              Your premier destination for authentic Nollywood entertainment. Stream the best Nigerian films and series.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Browse Genres */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Browse by Genre
            </h3>
            <ul className="space-y-2">
              {genres.map((genre) => (
                <li key={genre}>
                  <Link
                    to={`/genre/${genre.toLowerCase()}`}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {genre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/content/films"
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  Films
                </Link>
              </li>
              <li>
                <Link
                  to="/content/series"
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  Series
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Admin */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Contact & Support
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@naijamation.com"
                  className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" />
                  support@naijamation.com
                </a>
              </li>
              <li className="pt-2">
                <Link
                  to="/admin/login"
                  className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-red-600"
                >
                  <Shield className="h-4 w-4" />
                  Admin Portal
                </Link>
              </li>
            </ul>

            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs font-semibold text-slate-300">Business Inquiries</p>
              <a
                href="mailto:business@naijamation.com"
                className="text-xs text-slate-400 hover:text-white"
              >
                business@naijamation.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-slate-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-slate-400">
              &copy; {currentYear} NaijaMation. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-6">
              <a href="#" className="text-sm text-slate-400 transition-colors hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-slate-400 transition-colors hover:text-white">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-slate-400 transition-colors hover:text-white">
                Cookie Policy
              </a>
              <a href="#" className="text-sm text-slate-400 transition-colors hover:text-white">
                Help Center
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
