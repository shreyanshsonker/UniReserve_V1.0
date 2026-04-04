import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { notifySuccess, notifyError } from '../utils/notify';
import {
  HiArchive,
  HiArrowRight,
  HiCalendar,
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiOfficeBuilding,
  HiRefresh,
  HiSparkles,
  HiXCircle,
} from 'react-icons/hi';
import '../styles/workspacePages.css';

const formatDate = (date) => {
  if (!date) {
    return 'Date to be confirmed';
  }

  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (time) => (time ? time.slice(0, 5) : '--:--');

const parseSlotTimestamp = (slotDetails) => {
  if (!slotDetails?.date || !slotDetails?.start_time) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(`${slotDetails.date}T${slotDetails.start_time}`).getTime();
};

const getDurationHours = (slotDetails) => {
  if (!slotDetails?.start_time || !slotDetails?.end_time) {
    return 0;
  }

  const [startHour, startMinute] = slotDetails.start_time.split(':').map(Number);
  const [endHour, endMinute] = slotDetails.end_time.split(':').map(Number);
  return Math.max(0, (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60);
};

const getStatusVariant = (status) => {
  switch (status) {
    case 'active':
    case 'attended':
      return 'workspace-status-pill--success';
    case 'pending_approval':
      return 'workspace-status-pill--warning';
    case 'cancelled':
      return 'workspace-status-pill--muted';
    case 'no_show':
      return 'workspace-status-pill--danger';
    default:
      return 'workspace-status-pill--muted';
  }
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookRes, waitRes] = await Promise.all([
        api.get('/bookings/bookings/my/'),
        api.get('/bookings/waitlist/my/'),
      ]);
      const bookData = bookRes.data.results || bookRes.data;
      const waitData = waitRes.data.results || waitRes.data;
      setBookings(Array.isArray(bookData) ? bookData : []);
      setWaitlists(Array.isArray(waitData) ? waitData : []);
    } catch {
      notifyError('Failed to load your reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.patch(`/bookings/bookings/${id}/cancel/`);
      notifySuccess('Booking cancelled successfully.');
      await fetchData();
    } catch (error) {
      const msg = error.response?.data?.error || 'Cancellation failed.';
      notifyError(msg);
    }
  };

  const handleLeaveWaitlist = async (id) => {
    if (!window.confirm('Withdraw from this waitlist?')) return;
    try {
      await api.delete(`/bookings/waitlist/${id}/leave/`);
      notifySuccess('Withdrawn from waitlist.');
      await fetchData();
    } catch {
      notifyError('Failed to leave waitlist.');
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await api.post(`/bookings/bookings/${id}/check-in/`);
      notifySuccess('Attendance marked! Enjoy your session.');
      await fetchData();
    } catch (error) {
      const msg = error.response?.data?.error || 'Check-in failed.';
      notifyError(msg);
    }
  };

  const upcomingBookings = useMemo(
    () =>
      [...bookings]
        .filter((booking) => ['active', 'pending_approval'].includes(booking.status))
        .sort((left, right) => parseSlotTimestamp(left.slot_details) - parseSlotTimestamp(right.slot_details)),
    [bookings],
  );

  const historyBookings = useMemo(
    () =>
      [...bookings]
        .filter((booking) => ['cancelled', 'no_show', 'attended'].includes(booking.status))
        .sort((left, right) => parseSlotTimestamp(right.slot_details) - parseSlotTimestamp(left.slot_details)),
    [bookings],
  );

  const sortedWaitlists = useMemo(
    () => [...waitlists].sort((left, right) => (left.position || 0) - (right.position || 0)),
    [waitlists],
  );

  const nextBooking = upcomingBookings[0] || null;
  const pendingApprovals = bookings.filter((booking) => booking.status === 'pending_approval').length;
  const attendedSessions = bookings.filter((booking) => booking.status === 'attended').length;
  const totalReservedHours = bookings
    .filter((booking) => ['active', 'pending_approval', 'attended'].includes(booking.status))
    .reduce((total, booking) => total + getDurationHours(booking.slot_details), 0);

  const kpiCards = [
    {
      label: 'Upcoming Sessions',
      value: upcomingBookings.length,
      hint: nextBooking ? `Next up ${formatDate(nextBooking.slot_details?.date)}` : 'No active bookings yet',
      icon: HiCalendar,
    },
    {
      label: 'Waitlist Entries',
      value: sortedWaitlists.length,
      hint: sortedWaitlists.length ? `Closest seat is position #${sortedWaitlists[0].position}` : 'No open waitlists',
      icon: HiClock,
    },
    {
      label: 'Pending Approval',
      value: pendingApprovals,
      hint: pendingApprovals ? 'Managers still need to confirm a few sessions' : 'Everything is either confirmed or completed',
      icon: HiExclamationCircle,
    },
    {
      label: 'Hours Reserved',
      value: totalReservedHours.toFixed(1),
      hint: `${attendedSessions} completed visit${attendedSessions === 1 ? '' : 's'} so far`,
      icon: HiCheckCircle,
    },
  ];

  const tabOptions = [
    { id: 'upcoming', label: 'Upcoming', count: upcomingBookings.length },
    { id: 'waitlist', label: 'Waitlist', count: sortedWaitlists.length },
    { id: 'history', label: 'History', count: historyBookings.length },
  ];

  const activeItems = activeTab === 'upcoming' ? upcomingBookings : historyBookings;

  return (
    <div className="workspace-page">
      <section className="workspace-hero">
        <div className="workspace-hero__content">
          <div className="workspace-hero__eyebrow">
            <HiSparkles />
            <span>Reservation command center</span>
          </div>

          <h1 className="workspace-hero__title">
            Keep every <span>booking</span> and waitlist in one calm view.
          </h1>

          <p className="workspace-hero__description">
            Track what is confirmed, see which sessions still need manager approval, and jump back
            into the space explorer whenever you need a new spot on campus.
          </p>

          <div className="workspace-hero__actions">
            <button
              type="button"
              className="workspace-button workspace-button--primary"
              onClick={() => navigate('/facilities')}
            >
              Explore Facilities
              <HiArrowRight />
            </button>
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={fetchData}
            >
              Refresh Reservations
              <HiRefresh />
            </button>
          </div>
        </div>

        <div className="workspace-hero__aside">
          <article className="workspace-summary-card">
            <p className="workspace-summary-card__kicker">Next on your calendar</p>
            {nextBooking ? (
              <>
                <h2 className="workspace-summary-card__value">{nextBooking.facility_name}</h2>
                <p className="workspace-summary-card__copy">
                  {formatDate(nextBooking.slot_details?.date)} at{' '}
                  {formatTime(nextBooking.slot_details?.start_time)}.{' '}
                  {nextBooking.status === 'pending_approval'
                    ? 'This visit is still waiting for manager approval.'
                    : 'Your seat is confirmed and ready.'}
                </p>
                <div className="workspace-inline-meta">
                  <span>
                    {formatTime(nextBooking.slot_details?.start_time)} -{' '}
                    {formatTime(nextBooking.slot_details?.end_time)}
                  </span>
                  <span>{nextBooking.status_display}</span>
                </div>
                <button
                  type="button"
                  className="workspace-action-link"
                  onClick={() => navigate(`/facilities/${nextBooking.slot_details?.facility}`)}
                >
                  Open Booking Page
                  <HiArrowRight />
                </button>
              </>
            ) : (
              <p className="workspace-summary-card__copy">
                You do not have an upcoming session yet. Browse the facility catalog and reserve a
                new space in a couple of clicks.
              </p>
            )}
          </article>

          <article className="workspace-summary-card">
            <p className="workspace-summary-card__kicker">Quick pulse</p>
            <div className="workspace-chip-grid">
              <div className="workspace-highlight-card">
                <p className="workspace-highlight-card__eyebrow">Confirmed</p>
                <h3 className="workspace-highlight-card__title">
                  {bookings.filter((booking) => booking.status === 'active').length}
                </h3>
                <p className="workspace-note">Sessions ready for check-in or already secured.</p>
              </div>
              <div className="workspace-highlight-card">
                <p className="workspace-highlight-card__eyebrow">In Queue</p>
                <h3 className="workspace-highlight-card__title">{sortedWaitlists.length}</h3>
                <p className="workspace-note">Waitlist spots that can auto-promote when seats open.</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="workspace-kpi-grid">
        {kpiCards.map((card) => (
          <article key={card.label} className="workspace-kpi-card">
            <div className="workspace-kpi-card__top">
              <div className="workspace-kpi-card__icon">
                <card.icon />
              </div>
            </div>
            <p className="workspace-kpi-card__label">{card.label}</p>
            <h2 className="workspace-kpi-card__value">{card.value}</h2>
            <p className="workspace-kpi-card__hint">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="workspace-panel">
        <div className="workspace-panel__header">
          <div>
            <h2 className="workspace-panel__title">Reservation Timeline</h2>
            <p className="workspace-panel__description">
              Move between upcoming sessions, waitlist entries, and finished history without
              leaving the page.
            </p>
          </div>
          <span className="workspace-panel__meta">
            {loading
              ? 'Refreshing your data...'
              : `${bookings.length} booking${bookings.length === 1 ? '' : 's'} tracked`}
          </span>
        </div>

        <div className="workspace-panel__toolbar">
          <div className="workspace-tab-bar">
            {tabOptions.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`workspace-tab${activeTab === tab.id ? ' workspace-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {!loading && (
          <div className="workspace-results">
            <p>
              {activeTab === 'waitlist'
                ? `Tracking ${sortedWaitlists.length} queue position${sortedWaitlists.length === 1 ? '' : 's'}`
                : `Showing ${activeItems.length} ${activeTab === 'history' ? 'past' : 'active'} reservation${activeItems.length === 1 ? '' : 's'}`}
            </p>
            <button
              type="button"
              className="workspace-action-link"
              onClick={() => navigate('/facilities')}
            >
              Book another space
              <HiArrowRight />
            </button>
          </div>
        )}

        {loading ? (
          <div className="workspace-stack">
            {[1, 2, 3].map((item) => (
              <div key={item} className="workspace-skeleton" style={{ minHeight: '13rem' }} />
            ))}
          </div>
        ) : activeTab === 'waitlist' ? (
          sortedWaitlists.length === 0 ? (
            <div className="workspace-empty-state">
              <div className="workspace-empty-state__icon">
                <HiClock />
              </div>
              <h3>No waitlists right now</h3>
              <p>When a slot is full, joining the queue will add it here for easy tracking.</p>
            </div>
          ) : (
            <div className="workspace-card-grid workspace-card-grid--2">
              {sortedWaitlists.map((waitlist) => (
                <article key={waitlist.id} className="workspace-card">
                  <div className="workspace-card__header">
                    <div className="workspace-card__icon">
                      <HiClock />
                    </div>
                    <span className="workspace-status-pill workspace-status-pill--warning">
                      Position #{waitlist.position}
                    </span>
                  </div>

                  <h3 className="workspace-card__title" style={{ marginTop: '1rem' }}>
                    {waitlist.facility_name}
                  </h3>

                  <div className="workspace-card__meta">
                    <span>
                      <HiCalendar />
                      {formatDate(waitlist.slot_details?.date)}
                    </span>
                    <span>
                      <HiClock />
                      {formatTime(waitlist.slot_details?.start_time)} - {formatTime(waitlist.slot_details?.end_time)}
                    </span>
                  </div>

                  <p className="workspace-card__description">
                    Stay ready for auto-promotion. When a seat opens, your waitlist entry can be
                    turned into a pending booking request automatically.
                  </p>

                  <div className="workspace-card__footer">
                    <button
                      type="button"
                      className="workspace-action-link"
                      onClick={() => navigate(`/facilities/${waitlist.slot_details?.facility}`)}
                    >
                      Open Facility
                      <HiArrowRight />
                    </button>
                    <button
                      type="button"
                      className="workspace-button workspace-button--danger"
                      onClick={() => handleLeaveWaitlist(waitlist.id)}
                    >
                      Withdraw
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : activeItems.length === 0 ? (
          <div className="workspace-empty-state">
            <div className="workspace-empty-state__icon">
              <HiArchive />
            </div>
            <h3>No reservations in this section</h3>
            <p>
              Any new booking you make will appear here with status updates, check-in readiness,
              and manager notes.
            </p>
          </div>
        ) : (
          <div className="workspace-stack">
            {activeItems.map((booking) => (
              <article key={booking.id} className="workspace-list-card">
                <div className="workspace-list-card__header">
                  <div>
                    <h3 className="workspace-card__title">{booking.facility_name}</h3>
                    <div className="workspace-list-card__meta">
                      <span>
                        <HiCalendar />
                        {formatDate(booking.slot_details?.date)}
                      </span>
                      <span>
                        <HiClock />
                        {formatTime(booking.slot_details?.start_time)} - {formatTime(booking.slot_details?.end_time)}
                      </span>
                      <span>
                        <HiOfficeBuilding />
                        Facility #{booking.slot_details?.facility || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <span className={`workspace-status-pill ${getStatusVariant(booking.status)}`}>
                    {booking.status_display}
                  </span>
                </div>

                <div className="workspace-list-card__content">
                  {booking.status === 'pending_approval' && (
                    <div className="workspace-notice workspace-notice--warning">
                      <HiExclamationCircle />
                      <p>
                        This session is queued for manager review. It will become active once the
                        facility owner signs off.
                      </p>
                    </div>
                  )}

                  {booking.manager_note && (
                    <div className="workspace-notice workspace-notice--info">
                      <HiCheckCircle />
                      <p>
                        <strong>Manager note:</strong> {booking.manager_note}
                      </p>
                    </div>
                  )}

                  {booking.checked_in_at && (
                    <div className="workspace-notice workspace-notice--info">
                      <HiCheckCircle />
                      <p>Your attendance is already marked for this session.</p>
                    </div>
                  )}
                </div>

                <div className="workspace-list-card__footer">
                  <div className="workspace-list-card__actions">
                    <button
                      type="button"
                      className="workspace-action-link"
                      onClick={() => navigate(`/facilities/${booking.slot_details?.facility}`)}
                    >
                      Open Facility
                      <HiArrowRight />
                    </button>

                    {activeTab === 'upcoming' && booking.status === 'active' && !booking.checked_in_at && (
                      <button
                        type="button"
                        className="workspace-button workspace-button--success"
                        onClick={() => handleCheckIn(booking.id)}
                      >
                        Check In
                      </button>
                    )}
                  </div>

                  {activeTab === 'upcoming' && (
                    <button
                      type="button"
                      className="workspace-button workspace-button--danger"
                      onClick={() => handleCancel(booking.id)}
                    >
                      <HiXCircle />
                      Cancel Session
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyBookings;
