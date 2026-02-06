// Admin Analytics Dashboard Component / Admin-Analytics-Dashboard-Komponente / Componentă Dashboard Analytics Admin
// Real-time analytics dashboard for monitoring website traffic and engagement
// Echtzeit-Analytics-Dashboard zur Überwachung des Website-Traffics und Engagements
// Dashboard analytics în timp real pentru monitorizarea traficului și engagement-ului site-ului

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  FaUsers, 
  FaEye, 
  FaClock, 
  FaChartLine,
  FaDesktop,
  FaMobile,
  FaTablet,
  FaGlobe,
  FaSync,
  FaArrowUp,
  FaArrowDown,
  FaFire,
  FaCalendarAlt
} from 'react-icons/fa';

interface AnalyticsData {
  activeUsers: number;
  todayViews: number;
  todaySessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: { page: string; views: number }[];
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  recentActivity: { time: string; page: string; device: string }[];
  viewsTrend: { hour: string; views: number }[];
  weeklyStats: { date: string; views: number; sessions: number }[];
}

interface Props {
  className?: string;
}

export default function AnalyticsDashboard({ className = '' }: Props) {
  const { language } = useLanguage();
  const supabase = createClient();
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Translations / Übersetzungen / Traduceri
  const t = {
    title: {
      de: 'Analytics Dashboard',
      en: 'Analytics Dashboard',
      ro: 'Dashboard Analytics',
      ru: 'Панель аналитики'
    },
    activeNow: {
      de: 'Jetzt aktiv',
      en: 'Active Now',
      ro: 'Activi acum',
      ru: 'Активны сейчас'
    },
    todayViews: {
      de: 'Heute Aufrufe',
      en: 'Today Views',
      ro: 'Vizualizări azi',
      ru: 'Просмотров сегодня'
    },
    sessions: {
      de: 'Sitzungen',
      en: 'Sessions',
      ro: 'Sesiuni',
      ru: 'Сессии'
    },
    avgDuration: {
      de: 'Ø Dauer',
      en: 'Avg Duration',
      ro: 'Durată medie',
      ru: 'Сред. длительность'
    },
    bounceRate: {
      de: 'Absprungrate',
      en: 'Bounce Rate',
      ro: 'Rată respingere',
      ru: 'Показатель отказов'
    },
    topPages: {
      de: 'Top Seiten',
      en: 'Top Pages',
      ro: 'Pagini populare',
      ru: 'Топ страницы'
    },
    devices: {
      de: 'Geräte',
      en: 'Devices',
      ro: 'Dispozitive',
      ru: 'Устройства'
    },
    recentActivity: {
      de: 'Letzte Aktivität',
      en: 'Recent Activity',
      ro: 'Activitate recentă',
      ru: 'Последняя активность'
    },
    viewsTrend: {
      de: 'Aufrufe-Trend',
      en: 'Views Trend',
      ro: 'Trend vizualizări',
      ru: 'Тренд просмотров'
    },
    lastUpdated: {
      de: 'Zuletzt aktualisiert',
      en: 'Last updated',
      ro: 'Ultima actualizare',
      ru: 'Последнее обновление'
    },
    autoRefresh: {
      de: 'Auto-Aktualisierung',
      en: 'Auto Refresh',
      ro: 'Auto-reîmprospătare',
      ru: 'Авто-обновление'
    },
    refresh: {
      de: 'Aktualisieren',
      en: 'Refresh',
      ro: 'Reîmprospătează',
      ru: 'Обновить'
    },
    today: {
      de: 'Heute',
      en: 'Today',
      ro: 'Azi',
      ru: 'Сегодня'
    },
    week: {
      de: 'Woche',
      en: 'Week',
      ro: 'Săptămână',
      ru: 'Неделя'
    },
    month: {
      de: 'Monat',
      en: 'Month',
      ro: 'Lună',
      ru: 'Месяц'
    },
    noData: {
      de: 'Keine Daten verfügbar',
      en: 'No data available',
      ro: 'Nu sunt date disponibile',
      ru: 'Данные недоступны'
    },
    liveIndicator: {
      de: 'LIVE',
      en: 'LIVE',
      ro: 'LIVE',
      ru: 'LIVE'
    }
  };

  const getText = (key: keyof typeof t) => t[key][language as keyof typeof t.title] || t[key].en;

  // Fetch analytics data / Analytics-Daten abrufen / Obține datele analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      let startDate = startOfToday;
      if (timeRange === 'week') startDate = startOfWeek;
      if (timeRange === 'month') startDate = startOfMonth;

      // Get active users count / Anzahl aktiver Benutzer abrufen
      const { count: activeCount } = await supabase
        .from('active_users')
        .select('*', { count: 'exact', head: true })
        .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      // Get today's page views / Heutige Seitenaufrufe abrufen
      const { data: viewsData, count: viewsCount, error: viewsError } = await supabase
        .from('page_views')
        .select('page_path, created_at, device_type', { count: 'exact' })
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(100);

      if (viewsError) {
        console.error('❌ Views fetch error:', viewsError.message);
      } else {
        console.log(`📊 Fetched ${viewsCount} page views`);
      }

      // Get sessions data / Sitzungsdaten abrufen
      const { data: sessionsData, count: sessionsCount, error: sessionsError } = await supabase
        .from('analytics_sessions')
        .select('duration_seconds, is_bounce, device_type')
        .gte('started_at', startDate);

      if (sessionsError) {
        console.error('❌ Sessions fetch error:', sessionsError.message);
      } else {
        console.log(`📊 Fetched ${sessionsCount} sessions`);
      }

      // Calculate metrics / Metriken berechnen
      const avgDuration = sessionsData?.length 
        ? Math.round(sessionsData.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessionsData.length)
        : 0;

      const bounceRate = sessionsData?.length
        ? Math.round((sessionsData.filter(s => s.is_bounce).length / sessionsData.length) * 100)
        : 0;

      // Top pages / Top-Seiten
      const pageCounts: Record<string, number> = {};
      viewsData?.forEach(v => {
        pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([page, views]) => ({ page, views }));

      // Device breakdown / Geräte-Aufschlüsselung
      const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
      viewsData?.forEach(v => {
        if (v.device_type === 'desktop') deviceCounts.desktop++;
        else if (v.device_type === 'mobile') deviceCounts.mobile++;
        else if (v.device_type === 'tablet') deviceCounts.tablet++;
      });

      // Recent activity / Letzte Aktivität
      const recentActivity = viewsData?.slice(0, 10).map(v => ({
        time: new Date(v.created_at).toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        page: v.page_path,
        device: v.device_type || 'unknown'
      })) || [];

      // Views trend by hour / Aufrufe-Trend pro Stunde
      const hourCounts: Record<string, number> = {};
      // Initialize all 24 hours with 0
      for (let i = 0; i < 24; i++) {
        hourCounts[`${i.toString().padStart(2, '0')}:00`] = 0;
      }
      
      // Count views per hour
      viewsData?.forEach(v => {
        const viewDate = new Date(v.created_at);
        const hour = viewDate.getHours();
        const key = `${hour.toString().padStart(2, '0')}:00`;
        hourCounts[key]++;
      });
      
      // Convert to array and sort by hour
      const viewsTrend = Object.entries(hourCounts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([hour, views]) => ({ hour, views }));
      
      console.log('📈 Views trend:', viewsTrend.filter(v => v.views > 0));

      setData({
        activeUsers: activeCount || 0,
        todayViews: viewsCount || 0,
        todaySessions: sessionsCount || 0,
        avgSessionDuration: avgDuration,
        bounceRate,
        topPages,
        deviceBreakdown: deviceCounts,
        recentActivity,
        viewsTrend,
        weeklyStats: [], // TODO: Implement weekly stats
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, timeRange, language]);

  // Initial fetch and auto-refresh / Initialer Abruf und Auto-Aktualisierung
  useEffect(() => {
    fetchAnalytics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchAnalytics, autoRefresh]);

  // Format duration / Dauer formatieren
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className={`glass-effect rounded-2xl p-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls / Kopfzeile mit Steuerungen */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaChartLine className="text-blue-500" />
            {getText('title')}
          </h2>
          <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs font-bold animate-pulse">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            {getText('liveIndicator')}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Time range selector / Zeitraum-Auswahl */}
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-white/20">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-gray-700 dark:text-white/70 hover:bg-white/10'
                }`}
              >
                {getText(range)}
              </button>
            ))}
          </div>

          {/* Auto-refresh toggle / Auto-Aktualisierung umschalten */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-white/70">{getText('autoRefresh')}</span>
          </label>

          {/* Manual refresh / Manuelles Aktualisieren */}
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            {getText('refresh')}
          </button>
        </div>
      </div>

      {/* Last updated / Zuletzt aktualisiert */}
      <p className="text-xs text-gray-500 dark:text-white/40">
        {getText('lastUpdated')}: {lastRefresh.toLocaleTimeString()}
      </p>

      {/* Main stats grid / Haupt-Statistik-Raster */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Active Users / Aktive Benutzer */}
        <div className="glass-effect rounded-xl p-4 col-span-1">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <FaFire className="text-lg" />
            <span className="text-xs font-medium tracking-wide">{getText('activeNow')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data?.activeUsers || 0}
          </p>
        </div>

        {/* Today Views / Heutige Aufrufe */}
        <div className="glass-effect rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <FaEye className="text-lg" />
            <span className="text-xs font-medium tracking-wide">{getText('todayViews')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data?.todayViews?.toLocaleString() || 0}
          </p>
        </div>

        {/* Sessions / Sitzungen */}
        <div className="glass-effect rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <FaUsers className="text-lg" />
            <span className="text-xs font-medium tracking-wide">{getText('sessions')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data?.todaySessions || 0}
          </p>
        </div>

        {/* Avg Duration / Ø Dauer */}
        <div className="glass-effect rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <FaClock className="text-lg" />
            <span className="text-xs font-medium tracking-wide">{getText('avgDuration')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatDuration(data?.avgSessionDuration || 0)}
          </p>
        </div>

        {/* Bounce Rate / Absprungrate */}
        <div className="glass-effect rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <FaArrowUp className="text-lg" />
            <span className="text-xs font-medium tracking-wide">{getText('bounceRate')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data?.bounceRate || 0}%
          </p>
        </div>
      </div>

      {/* Secondary stats / Sekundäre Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Pages / Top-Seiten */}
        <div className="glass-effect rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-500" />
            {getText('topPages')}
          </h3>
          <div className="space-y-3">
            {data?.topPages?.length ? (
              data.topPages.map((page, i) => (
                <div key={page.page} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-white/80 truncate max-w-[150px]">
                      {page.page === '/' ? 'Home' : page.page}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {page.views}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-white/40 text-sm">{getText('noData')}</p>
            )}
          </div>
        </div>

        {/* Device Breakdown / Geräte-Aufschlüsselung */}
        <div className="glass-effect rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaDesktop className="text-purple-500" />
            {getText('devices')}
          </h3>
          <div className="space-y-4">
            {/* Desktop */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
                  <FaDesktop /> Desktop
                </span>
                <span className="text-sm font-semibold">{data?.deviceBreakdown?.desktop || 0}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${data?.todayViews ? (data.deviceBreakdown.desktop / data.todayViews) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
            {/* Mobile */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
                  <FaMobile /> Mobile
                </span>
                <span className="text-sm font-semibold">{data?.deviceBreakdown?.mobile || 0}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${data?.todayViews ? (data.deviceBreakdown.mobile / data.todayViews) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
            {/* Tablet */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
                  <FaTablet /> Tablet
                </span>
                <span className="text-sm font-semibold">{data?.deviceBreakdown?.tablet || 0}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${data?.todayViews ? (data.deviceBreakdown.tablet / data.todayViews) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity / Letzte Aktivität */}
        <div className="glass-effect rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaGlobe className="text-green-500" />
            {getText('recentActivity')}
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data?.recentActivity?.length ? (
              data.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {activity.device === 'mobile' ? <FaMobile className="text-xs text-gray-400" /> : 
                     activity.device === 'tablet' ? <FaTablet className="text-xs text-gray-400" /> :
                     <FaDesktop className="text-xs text-gray-400" />}
                    <span className="text-gray-700 dark:text-white/70 truncate max-w-[120px]">
                      {activity.page === '/' ? 'Home' : activity.page}
                    </span>
                  </div>
                  <span className="text-gray-500 dark:text-white/40 text-xs">{activity.time}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-white/40 text-sm">{getText('noData')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Views Trend Chart / Aufrufe-Trend-Diagramm */}
      <div className="glass-effect rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FaCalendarAlt className="text-blue-500" />
          {getText('viewsTrend')} ({getText('today')})
        </h3>
        <div className="flex items-end justify-between h-40 gap-0.5 pb-6">
          {data?.viewsTrend?.map((item, i) => {
            const maxViews = Math.max(...(data.viewsTrend?.map(v => v.views) || [1]), 1);
            const height = item.views > 0 ? Math.max((item.views / maxViews) * 100, 10) : 2;
            const hasViews = item.views > 0;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                {/* Bar */}
                <div 
                  className={`w-full rounded-t transition-all duration-300 ${
                    hasViews 
                      ? 'bg-blue-500 hover:bg-blue-400' 
                      : 'bg-gray-300 dark:bg-white/10'
                  }`}
                  style={{ height: `${height}%`, minHeight: hasViews ? '12px' : '2px' }}
                />
                {/* Tooltip on hover */}
                {hasViews && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {item.views} views
                  </div>
                )}
                {/* Hour label - show every 2nd hour to save space */}
                {i % 2 === 0 && (
                  <span className="text-[8px] text-gray-500 dark:text-white/40 absolute -bottom-4 whitespace-nowrap">
                    {item.hour.replace(':00', '')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* Summary below chart */}
        <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500 dark:text-white/40">
          <span>Total: {data?.viewsTrend?.reduce((sum, v) => sum + v.views, 0) || 0} views</span>
        </div>
      </div>
    </div>
  );
}
