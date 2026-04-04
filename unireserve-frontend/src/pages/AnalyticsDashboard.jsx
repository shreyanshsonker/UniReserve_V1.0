import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { notifyError } from '../utils/notify';
import { useAuth } from '../context/useAuth';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  HiChartBar,
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiOfficeBuilding,
  HiOutlineFire,
  HiRefresh,
  HiSparkles,
  HiTrendingUp,
} from 'react-icons/hi';
import '../styles/workspacePages.css';

const COLORS = ['#a3a6ff', '#6ce0a8', '#f4c06d', '#ff7a91'];

const chartTooltipStyle = {
  backgroundColor: '#0f1930',
  border: '1px solid rgba(163, 170, 196, 0.14)',
  borderRadius: '16px',
  color: '#dee5ff',
};

const formatPercent = (value, total) => `${Math.round(total ? (value / total) * 100 : 0)}%`;

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [popularity, setPopularity] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadFacilities = async () => {
      try {
        const endpoint = isAdmin ? '/facilities/' : '/facilities/managed/';
        const response = await api.get(endpoint);
        const facilityData = response.data.results || response.data;
        setFacilities(Array.isArray(facilityData) ? facilityData : []);
      } catch {
        notifyError('Failed to load facility options.');
      }
    };

    loadFacilities();
  }, [isAdmin, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadAnalytics = async () => {
      setLoading(true);

      try {
        const params = selectedFacility ? { facility_id: selectedFacility } : undefined;
        const analyticsRequest = api.get('/bookings/analytics/manager/', { params });
        const popularityRequest = isAdmin ? api.get('/bookings/analytics/admin/') : Promise.resolve(null);
        const [analyticsResponse, popularityResponse] = await Promise.all([
          analyticsRequest,
          popularityRequest,
        ]);

        setData(analyticsResponse.data);
        setPopularity(popularityResponse?.data?.popularity || []);
      } catch {
        notifyError('Failed to load performance analytics.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [isAdmin, refreshKey, selectedFacility, user]);

  const totals = data?.kpis || {};
  const totalBookings = totals.total || 0;
  const attendedBookings = totals.attended || 0;
  const noShowBookings = totals.no_shows || 0;
  const cancelledBookings = totals.cancelled || 0;
  const activeBookings = Math.max(0, totalBookings - attendedBookings - noShowBookings - cancelledBookings);

  const selectedFacilityName = facilities.find(
    (facility) => String(facility.id) === String(selectedFacility),
  )?.name;

  const busiestDay = useMemo(() => {
    if (!data?.daily_trends?.length) {
      return null;
    }

    return data.daily_trends.reduce((topDay, day) => (day.bookings > topDay.bookings ? day : topDay));
  }, [data]);

  const peakHour = useMemo(() => {
    if (!data?.heatmap?.length) {
      return null;
    }

    return data.heatmap.reduce((topHour, hour) => (hour.count > topHour.count ? hour : topHour));
  }, [data]);

  const topHours = useMemo(
    () => [...(data?.heatmap || [])].sort((left, right) => right.count - left.count).slice(0, 5),
    [data],
  );

  const insights = [
    {
      title: 'Attendance reliability',
      body: `${formatPercent(attendedBookings, totalBookings)} of bookings ended in successful attendance over the current 7-day window.`,
    },
    {
      title: 'Busiest day',
      body: busiestDay
        ? `${busiestDay.date} carried the heaviest load with ${busiestDay.bookings} booking${busiestDay.bookings === 1 ? '' : 's'}.`
        : 'Usage trends will appear once bookings start coming in.',
    },
    {
      title: 'Peak hour',
      body: peakHour
        ? `${peakHour.hour} is currently your most active start time with ${peakHour.count} booking${peakHour.count === 1 ? '' : 's'}.`
        : 'Peak-hour insight will appear once enough sessions are booked.',
    },
  ];

  const kpiItems = [
    {
      label: 'Total Bookings',
      value: totalBookings,
      hint: selectedFacilityName ? `Filtered to ${selectedFacilityName}` : 'Across the current analytics window',
      icon: HiTrendingUp,
    },
    {
      label: 'Attendance Rate',
      value: formatPercent(attendedBookings, totalBookings),
      hint: `${attendedBookings} attended visit${attendedBookings === 1 ? '' : 's'}`,
      icon: HiCheckCircle,
    },
    {
      label: 'No-Show Rate',
      value: formatPercent(noShowBookings, totalBookings),
      hint: `${noShowBookings} missed reservation${noShowBookings === 1 ? '' : 's'}`,
      icon: HiExclamationCircle,
    },
    {
      label: 'Active Pipeline',
      value: activeBookings,
      hint: `${cancelledBookings} cancelled in the same time window`,
      icon: HiClock,
    },
  ];

  if (loading) {
    return (
      <div className="workspace-page">
        <div className="workspace-skeleton" style={{ minHeight: '18rem' }} />
        <div className="workspace-kpi-grid">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="workspace-skeleton" style={{ minHeight: '9rem' }} />
          ))}
        </div>
        <div className="workspace-skeleton" style={{ minHeight: '32rem' }} />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="workspace-page">
      <section className="workspace-hero">
        <div className="workspace-hero__content">
          <div className="workspace-hero__eyebrow">
            <HiSparkles />
            <span>{isAdmin ? 'System analytics' : 'Manager analytics'}</span>
          </div>

          <h1 className="workspace-hero__title">
            Turn booking traffic into clear <span>operational signals</span>.
          </h1>

          <p className="workspace-hero__description">
            Watch demand trends, attendance health, and high-pressure time windows so you can keep
            facility planning ahead of student behavior.
          </p>

          <div className="workspace-hero__actions">
            <button
              type="button"
              className="workspace-button workspace-button--primary"
              onClick={() => setRefreshKey((current) => current + 1)}
            >
              Refresh Insights
              <HiRefresh />
            </button>

            {facilities.length > 0 && (
              <select
                className="workspace-filter-select"
                value={selectedFacility}
                onChange={(event) => setSelectedFacility(event.target.value)}
              >
                <option value="">All Facilities</option>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="workspace-hero__aside">
          <article className="workspace-summary-card">
            <p className="workspace-summary-card__kicker">Peak demand</p>
            <h2 className="workspace-summary-card__value">{peakHour?.hour || 'No peak yet'}</h2>
            <p className="workspace-summary-card__copy">
              {peakHour
                ? `${peakHour.count} bookings currently cluster at this start time.`
                : 'Once bookings accumulate, the highest-demand hour will surface here.'}
            </p>
          </article>

          <article className="workspace-summary-card">
            <p className="workspace-summary-card__kicker">Focus scope</p>
            <div className="workspace-chip-grid">
              <div className="workspace-highlight-card">
                <p className="workspace-highlight-card__eyebrow">Tracking</p>
                <h3 className="workspace-highlight-card__title">
                  {selectedFacilityName || (isAdmin ? 'Campus-wide' : 'All managed spaces')}
                </h3>
                <p className="workspace-note">Change the filter to zoom into one facility at a time.</p>
              </div>
              <div className="workspace-highlight-card">
                <p className="workspace-highlight-card__eyebrow">Top day</p>
                <h3 className="workspace-highlight-card__title">{busiestDay?.date || 'Waiting'}</h3>
                <p className="workspace-note">Your strongest daily demand signal in the current view.</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="workspace-kpi-grid">
        {kpiItems.map((item) => (
          <article key={item.label} className="workspace-kpi-card">
            <div className="workspace-kpi-card__top">
              <div className="workspace-kpi-card__icon">
                <item.icon />
              </div>
            </div>
            <p className="workspace-kpi-card__label">{item.label}</p>
            <h2 className="workspace-kpi-card__value">{item.value}</h2>
            <p className="workspace-kpi-card__hint">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="analytics-grid">
        <article className="analytics-panel analytics-panel--wide">
          <div className="analytics-panel__header">
            <div>
              <h2 className="analytics-panel__title">Booking Trends</h2>
              <p className="workspace-panel__description">
                Daily demand across the most recent seven-day window.
              </p>
            </div>
            <span className="workspace-panel__meta">Bookings per day</span>
          </div>

          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily_trends || []}>
                <defs>
                  <linearGradient id="analytics-bookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a3a6ff" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#a3a6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(163, 170, 196, 0.12)" vertical={false} />
                <XAxis dataKey="date" stroke="#7f89aa" tickLine={false} axisLine={false} />
                <YAxis stroke="#7f89aa" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#a3a6ff"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#analytics-bookings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel">
          <div className="analytics-panel__header">
            <div>
              <h2 className="analytics-panel__title">Attendance Mix</h2>
              <p className="workspace-panel__description">
                How bookings are resolving across status outcomes.
              </p>
            </div>
            <span className="workspace-panel__meta">Status split</span>
          </div>

          <div className="analytics-chart analytics-chart--short">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.status_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(data.status_distribution || []).map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics-insights">
            {insights.slice(0, 2).map((insight) => (
              <div key={insight.title} className="analytics-insight">
                <strong>{insight.title}</strong>
                <span>{insight.body}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-panel analytics-panel--wide">
          <div className="analytics-panel__header">
            <div>
              <h2 className="analytics-panel__title">Popular Start Times</h2>
              <p className="workspace-panel__description">
                See the time bands with the strongest booking pressure.
              </p>
            </div>
            <span className="workspace-panel__meta">Heatmap by hour</span>
          </div>

          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.heatmap || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(163, 170, 196, 0.12)" vertical={false} />
                <XAxis dataKey="hour" stroke="#7f89aa" tickLine={false} axisLine={false} />
                <YAxis stroke="#7f89aa" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" fill="#7de9ff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel">
          <div className="analytics-panel__header">
            <div>
              <h2 className="analytics-panel__title">
                {isAdmin ? 'Campus Rankings' : 'Top Time Bands'}
              </h2>
              <p className="workspace-panel__description">
                {isAdmin
                  ? 'Most-booked facilities across the system.'
                  : 'The strongest demand windows across your portfolio.'}
              </p>
            </div>
            <span className="workspace-panel__meta">
              {isAdmin ? <HiOfficeBuilding /> : <HiOutlineFire />}
            </span>
          </div>

          {isAdmin ? (
            popularity.length > 0 ? (
              <div className="analytics-ranking">
                {popularity.map((item, index) => (
                  <div key={item.name} className="analytics-ranking__item">
                    <div className="analytics-ranking__index">{index + 1}</div>
                    <div>
                      <strong>{item.name}</strong>
                      <span>Top performing facility by booking volume</span>
                    </div>
                    <p>{item.bookings}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="workspace-empty-state" style={{ minHeight: '14rem' }}>
                <div className="workspace-empty-state__icon">
                  <HiOfficeBuilding />
                </div>
                <h3>No ranking data yet</h3>
                <p>Facility popularity will appear here once the system has booking volume.</p>
              </div>
            )
          ) : topHours.length > 0 ? (
            <div className="analytics-ranking">
              {topHours.map((hour, index) => (
                <div key={hour.hour} className="analytics-ranking__item">
                  <div className="analytics-ranking__index">{index + 1}</div>
                  <div>
                    <strong>{hour.hour}</strong>
                    <span>Students most often start reservations at this time.</span>
                  </div>
                  <p>{hour.count}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="workspace-empty-state" style={{ minHeight: '14rem' }}>
              <div className="workspace-empty-state__icon">
                <HiClock />
              </div>
              <h3>No time-band data yet</h3>
              <p>Once students begin booking, the most popular hours will surface here.</p>
            </div>
          )}
        </article>

        <article className="analytics-panel analytics-panel--full">
          <div className="analytics-panel__header">
            <div>
              <h2 className="analytics-panel__title">Operational Notes</h2>
              <p className="workspace-panel__description">
                High-level takeaways you can use for staffing, slot planning, and policy tweaks.
              </p>
            </div>
            <span className="workspace-panel__meta">
              <HiChartBar />
            </span>
          </div>

          <div className="analytics-insights">
            {insights.map((insight) => (
              <div key={insight.title} className="analytics-insight">
                <strong>{insight.title}</strong>
                <span>{insight.body}</span>
              </div>
            ))}
            <div className="analytics-insight">
              <strong>Cancellation pressure</strong>
              <span>
                {formatPercent(cancelledBookings, totalBookings)} of reservations were cancelled in
                this view. If this stays high, it may be worth tightening slot duration choices or
                reminder timing.
              </span>
            </div>
            <div className="analytics-insight">
              <strong>Attention flag</strong>
              <span>
                {noShowBookings > attendedBookings
                  ? 'No-shows are currently outweighing attended visits. A reminder flow or access checkpoint could help.'
                  : 'Attendance is staying ahead of no-shows, which suggests the current workflow is mostly healthy.'}
              </span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
