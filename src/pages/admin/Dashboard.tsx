import { useEffect, useState } from 'react';
import { Film, Users, Eye, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalFilms: number;
  totalUsers: number;
  totalViews: number;
  recentFilms: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalFilms: 0,
    totalUsers: 0,
    totalViews: 0,
    recentFilms: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [filmsResult, usersResult] = await Promise.all([
        supabase.from('films').select('id, views, created_at', { count: 'exact' }),
        supabase.from('user_roles').select('id', { count: 'exact' }),
      ]);

      const totalViews = filmsResult.data?.reduce((sum, film) => sum + (film.views || 0), 0) || 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentFilms = filmsResult.data?.filter(
        (film) => new Date(film.created_at) > thirtyDaysAgo
      ).length || 0;

      setStats({
        totalFilms: filmsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalViews,
        recentFilms,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Films', value: stats.totalFilms, icon: Film, color: 'text-blue-500' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-green-500' },
    { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-purple-500' },
    { label: 'Recent Films', value: stats.recentFilms, icon: TrendingUp, color: 'text-red-500' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-red-600 mx-auto"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-slate-400">Welcome to the admin dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-slate-800 bg-slate-900 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="/admin/films/new"
            className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-center hover:bg-slate-750 transition-colors"
          >
            <Film className="mx-auto h-8 w-8 text-red-600 mb-2" />
            <p className="font-semibold text-white">Add New Film</p>
          </a>
          <a
            href="/admin/users"
            className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-center hover:bg-slate-750 transition-colors"
          >
            <Users className="mx-auto h-8 w-8 text-green-600 mb-2" />
            <p className="font-semibold text-white">Manage Users</p>
          </a>
          <a
            href="/admin/analytics"
            className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-center hover:bg-slate-750 transition-colors"
          >
            <TrendingUp className="mx-auto h-8 w-8 text-purple-600 mb-2" />
            <p className="font-semibold text-white">View Analytics</p>
          </a>
        </div>
      </div>
    </div>
  );
}
