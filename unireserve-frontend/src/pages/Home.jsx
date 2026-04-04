import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiArrowRight,
  HiBookmarkAlt,
  HiCalendar,
  HiCheckCircle,
  HiClock,
  HiDotsVertical,
  HiExclamationCircle,
  HiLightningBolt,
  HiLocationMarker,
  HiLogout,
  HiQuestionMarkCircle,
  HiRefresh,
  HiSparkles,
} from 'react-icons/hi';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { notifyError } from '../utils/notify';
import '../styles/studentDashboard.css';

const getInitials = (name = 'Scholar') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

const parseDate = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  const parsed = dateValue.includes('T')
    ? new Date(dateValue)
    : new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseSlotDateTime = (slot, key) => {
  if (!slot?.date || !slot?.[key]) {
    return null;
  }

  const parsed = new Date(`${slot.date}T${slot[key]}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTime = (timeValue) => (timeValue ? timeValue.slice(0, 5) : '--:--');

const formatDateLabel = (dateValue, formatOptions) => {
  const parsed = parseDate(dateValue);

  if (!parsed) {
    return 'TBD';
  }

  return parsed.toLocaleDateString('en-US', formatOptions);
};

const formatFriendlyDate = (dateValue) => {
  const parsed = parseDate(dateValue);

  if (!parsed) {
    return 'Date pending';
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const difference = Math.round((parsed.getTime() - todayStart.getTime()) / 86400000);

  if (difference === 0) {
    return `Today, ${parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  if (difference === 1) {
    return `Tomorrow, ${parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const getHoursBetween = (startValue, endValue) => {
  if (!startValue || !endValue) {
    return 0;
  }

  const start = new Date(`1970-01-01T${startValue}`);
  const end = new Date(`1970-01-01T${endValue}`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  return Math.max(0, (end.getTime() - start.getTime()) / 3600000);
};

const getCountdownLabel = (slot, referenceTimestamp) => {
  const start = parseSlotDateTime(slot, 'start_time');
  const end = parseSlotDateTime(slot, 'end_time');

  if (!start) {
    return 'Schedule pending';
  }

  const difference = start.getTime() - referenceTimestamp;

  if (difference <= 0) {
    if (end && end.getTime() > referenceTimestamp) {
      return 'Live now';
    }

    return 'Started';
  }

  const totalMinutes = Math.max(1, Math.ceil(difference / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} mins`;
  }

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
};

const getActivityAppearance = (status) => {
  switch (status) {
    case 'attended':
      return {
        title: 'Booking completed',
        note: 'Attendance confirmed and session archived.',
        tone: 'success',
        icon: HiCheckCircle,
      };
    case 'pending_approval':
      return {
        title: 'Approval in progress',
        note: 'A facility manager is reviewing your request.',
        tone: 'warning',
        icon: HiClock,
      };
    case 'cancelled':
      return {
        title: 'Reservation cancelled',
        note: 'The slot has been released back to the pool.',
        tone: 'neutral',
        icon: HiRefresh,
      };
    case 'no_show':
      return {
        title: 'Check-in missed',
        note: 'A policy reminder has been added to your account.',
        tone: 'danger',
        icon: HiExclamationCircle,
      };
    default:
      return {
        title: 'Reservation scheduled',
        note: 'Everything is ready for your next session.',
        tone: 'accent',
        icon: HiBookmarkAlt,
      };
  }
};

const Home = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [waitlists, setWaitlists] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [userProfile, setUserProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referenceNow, setReferenceNow] = useState(0);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const results = await Promise.allSettled([
        api.get('/bookings/recommendations/'),
        api.get('/auth/profile/'),
        api.get('/bookings/bookings/my/'),
        api.get('/bookings/waitlist/my/'),
        api.get('/facilities/'),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      const [recommendationResult, profileResult, bookingResult, waitlistResult, facilityResult] = results;

      if (recommendationResult.status === 'fulfilled') {
        const data = recommendationResult.value.data?.results || recommendationResult.value.data;
        setRecommendations(Array.isArray(data) ? data : []);
      } else {
        setRecommendations([]);
      }

      if (profileResult.status === 'fulfilled') {
        const profileData = profileResult.value.data?.user || profileResult.value.data;
        setUserProfile(profileData);
        setUser(profileData);
      } else {
        setUserProfile((currentProfile) => currentProfile || user);
      }

      if (bookingResult.status === 'fulfilled') {
        const data = bookingResult.value.data?.results || bookingResult.value.data;
        setBookings(Array.isArray(data) ? data : []);
      } else {
        setBookings([]);
      }

      if (waitlistResult.status === 'fulfilled') {
        const data = waitlistResult.value.data?.results || waitlistResult.value.data;
        setWaitlists(Array.isArray(data) ? data : []);
      } else {
        setWaitlists([]);
      }

      if (facilityResult.status === 'fulfilled') {
        const data = facilityResult.value.data?.results || facilityResult.value.data;
        setFacilities(Array.isArray(data) ? data : []);
      } else {
        setFacilities([]);
      }

      if (results.some((result) => result.status === 'rejected')) {
        notifyError('Some dashboard details could not be refreshed.');
      }

      setReferenceNow(Date.now());
      setLoading(false);
      setRefreshing(false);
    },
    [setUser, user],
  );

  useEffect(() => {
    const loadTimeout = window.setTimeout(() => {
      loadDashboard();
    }, 0);

    return () => window.clearTimeout(loadTimeout);
  }, [loadDashboard]);

  const profile = userProfile || user || {};
  const facilityLookup = {};

  facilities.forEach((facility) => {
    facilityLookup[facility.id] = facility;
  });

  const orderedBookings = [...bookings].sort((left, right) => {
    const leftDate = parseSlotDateTime(left.slot_details, 'start_time') || new Date(0);
    const rightDate = parseSlotDateTime(right.slot_details, 'start_time') || new Date(0);
    return leftDate.getTime() - rightDate.getTime();
  });

  const upcomingBookings = orderedBookings.filter((booking) => {
    const bookingEnd = parseSlotDateTime(booking.slot_details, 'end_time');
    const isActiveStatus = ['active', 'pending_approval'].includes(booking.status);
    return isActiveStatus && (!bookingEnd || bookingEnd.getTime() >= referenceNow);
  });

  const nextBooking = upcomingBookings[0] || null;
  const nextBookingFacility = nextBooking ? facilityLookup[nextBooking.slot_details?.facility] : null;
  const primaryRecommendation = recommendations[0] || null;
  const primaryRecommendationFacility = primaryRecommendation
    ? facilityLookup[primaryRecommendation.slot?.facility]
    : null;

  const lastThirtyDays = referenceNow - 30 * 24 * 60 * 60 * 1000;
  const recentStudyHours = bookings.reduce((total, booking) => {
    const bookingStart = parseSlotDateTime(booking.slot_details, 'start_time');
    const isCounted = ['active', 'attended', 'pending_approval'].includes(booking.status);

    if (!bookingStart || bookingStart.getTime() < lastThirtyDays || !isCounted) {
      return total;
    }

    return total + getHoursBetween(booking.slot_details?.start_time, booking.slot_details?.end_time);
  }, 0);

  const completedSessions = bookings.filter((booking) => booking.status === 'attended').length;
  const resolvedSessions = bookings.filter((booking) =>
    ['attended', 'cancelled', 'no_show'].includes(booking.status),
  ).length;
  const attendanceRate = resolvedSessions
    ? Math.round((completedSessions / resolvedSessions) * 100)
    : 100;

  const campusActiveCount = facilities.filter((facility) => facility.is_active).length;
  const suggestionCount = recommendations.length;
  const nextReservationCountdown = nextBooking
    ? getCountdownLabel(nextBooking.slot_details, referenceNow)
    : 'No session';
  const nextReservationNote = nextBooking
    ? `${formatFriendlyDate(nextBooking.slot_details?.date)} • ${formatTime(nextBooking.slot_details?.start_time)}`
    : 'Build your next study block in seconds';

  const dashboardName = profile.name || 'Scholar';
  const firstName = dashboardName.split(' ')[0] || 'Scholar';
  const departmentLine = profile.department
    ? `${profile.department}${profile.year_of_study ? ` • Year ${profile.year_of_study}` : ''}`
    : 'Focused study mode';

  let heroDescription = 'Discover quieter rooms, faster slots, and the spaces that fit your workflow best.';

  if (profile.is_suspended && profile.suspended_until) {
    heroDescription = `Your booking access is paused until ${formatDateLabel(profile.suspended_until, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}.`;
  } else if (nextBooking) {
    heroDescription = `${nextBooking.facility_name} is already on your calendar for ${formatFriendlyDate(
      nextBooking.slot_details?.date,
    )}.`;
  } else if (primaryRecommendation) {
    heroDescription = `${primaryRecommendation.facility_name} is looking like a strong fit for your next session right now.`;
  }

  const recommendationCards = recommendations.slice(0, 3).map((recommendation, index) => {
    const linkedFacility = facilityLookup[recommendation.slot?.facility];
    return {
      id: `${recommendation.slot?.id || 'suggestion'}-${index}`,
      facilityId: recommendation.slot?.facility,
      title: recommendation.facility_name,
      type: linkedFacility?.type_display || 'Recommended Space',
      location: linkedFacility?.location || 'Campus workspace',
      timing: `${formatFriendlyDate(recommendation.slot?.date)} • ${formatTime(
        recommendation.slot?.start_time,
      )}`,
      availability:
        recommendation.slot?.availability_status === 'green'
          ? 'Quiet right now'
          : recommendation.slot?.slots_remaining
            ? `${recommendation.slot.slots_remaining} seats left`
            : 'Opening available',
      reason: recommendation.reason,
    };
  });

  const activityEntries = [
    ...bookings.map((booking) => {
      const appearance = getActivityAppearance(booking.status);

      return {
        id: `booking-${booking.id}`,
        timestamp: new Date(booking.updated_at || booking.created_at || referenceNow).getTime(),
        title: appearance.title,
        meta: `${booking.facility_name} • ${formatFriendlyDate(booking.slot_details?.date)}`,
        note: appearance.note,
        tone: appearance.tone,
        icon: appearance.icon,
      };
    }),
    ...waitlists.map((waitlist) => ({
      id: `waitlist-${waitlist.id}`,
      timestamp: new Date(waitlist.created_at || referenceNow).getTime(),
      title: 'Waitlist active',
      meta: `${waitlist.facility_name} • Position #${waitlist.position}`,
      note: 'We will notify you as soon as a slot opens up.',
      tone: 'warning',
      icon: HiClock,
    })),
  ]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 4);

  const statCards = [
    {
      label: 'Study Hours',
      value: recentStudyHours.toFixed(1),
      suffix: 'hrs',
      note: 'Past 30 days',
      accent: 'indigo',
      icon: HiClock,
    },
    {
      label: 'Sessions Completed',
      value: completedSessions.toString(),
      suffix: attendanceRate ? `${attendanceRate}% attendance` : 'No history yet',
      note: resolvedSessions ? 'Consistency tracker' : 'Start your first booking',
      accent: 'violet',
      icon: HiCheckCircle,
    },
    {
      label: 'Next Reservation',
      value: nextReservationCountdown,
      suffix: nextBooking ? 'until start' : 'pick a room',
      note: nextReservationNote,
      accent: 'cyan',
      icon: HiLightningBolt,
    },
  ];

  return (
    <div className="student-dashboard">
      <aside className="student-sidebar">
        <section className="student-sidebar__card">
          <p className="student-sidebar__kicker">Workspace snapshot</p>
          <div className="student-sidebar__identity">
            <div className="student-sidebar__avatar" aria-hidden="true">
              {getInitials(dashboardName)}
            </div>
            <div>
              <h2>{dashboardName}</h2>
              <p>{departmentLine}</p>
            </div>
          </div>
        </section>

        <section className="student-sidebar__card">
          <p className="student-sidebar__kicker">Today at a glance</p>
          <div className="student-sidebar__stats">
            <div className="student-sidebar__stat">
              <span>Active spaces</span>
              <strong>{campusActiveCount || facilities.length || 0}</strong>
            </div>
            <div className="student-sidebar__stat">
              <span>Suggestions</span>
              <strong>{suggestionCount}</strong>
            </div>
            <div className="student-sidebar__stat">
              <span>Waitlists</span>
              <strong>{waitlists.length}</strong>
            </div>
          </div>
        </section>

        <div className="student-sidebar__footer">
          <button
            type="button"
            className="student-sidebar__cta"
            onClick={() => navigate('/facilities')}
            disabled={profile.is_suspended}
          >
            {profile.is_suspended ? 'Access Paused' : 'Book Now'}
          </button>

          <button
            type="button"
            className="student-sidebar__secondary-action"
            onClick={() => loadDashboard(true)}
          >
            <HiRefresh className={refreshing ? 'student-spin' : ''} />
            <span>{refreshing ? 'Refreshing' : 'Refresh Insights'}</span>
          </button>

          <div className="student-sidebar__helper">
            <button
              type="button"
              className="student-sidebar__helper-link"
              onClick={() => navigate('/bookings')}
            >
              <HiQuestionMarkCircle />
              <span>Support</span>
            </button>
            <button type="button" className="student-sidebar__helper-link" onClick={logout}>
              <HiLogout />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="student-dashboard__main">
        <main className="student-content">
          <section className="student-hero">
            <div className="student-hero__content">
              <div className="student-hero__eyebrow">
                <HiSparkles />
                <span>{campusActiveCount || facilities.length || 0} active spaces across campus</span>
              </div>

              <h1 className="student-hero__title">
                Welcome back, {firstName}. <br />
                Ready to <span>study?</span>
              </h1>

              <p className="student-hero__description">{heroDescription}</p>

              <div className="student-hero__actions">
                <button
                  type="button"
                  className="student-button student-button--primary"
                  onClick={() => navigate('/facilities')}
                  disabled={profile.is_suspended}
                >
                  {profile.is_suspended ? 'Access Paused' : 'Book a Space'}
                </button>
                <button
                  type="button"
                  className="student-button student-button--secondary"
                  onClick={() => navigate('/bookings')}
                >
                  View Calendar
                </button>
              </div>

              <div className="student-hero__chips">
                <div className="student-chip">
                  <strong>{suggestionCount}</strong>
                  <span>smart suggestions</span>
                </div>
                <div className="student-chip">
                  <strong>{attendanceRate}%</strong>
                  <span>attendance rate</span>
                </div>
                <div className="student-chip">
                  <strong>{waitlists.length}</strong>
                  <span>active waitlists</span>
                </div>
              </div>
            </div>

            <div className="student-hero__visual" aria-hidden="true">
              <div className="student-hero__visual-card">
                <span className="student-hero__visual-badge">
                  {nextBooking ? nextReservationCountdown : 'Quiet right now'}
                </span>
                <div className="student-hero__visual-copy">
                  <p>{nextBooking ? 'Next reservation' : 'Recommended focus zone'}</p>
                  <h2>
                    {nextBooking?.facility_name ||
                      primaryRecommendation?.facility_name ||
                      'Science Library Pod 04'}
                  </h2>
                  <span>
                    {nextBookingFacility?.location ||
                      primaryRecommendationFacility?.location ||
                      'Main Library, Wing A'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {profile.is_suspended && profile.suspended_until && (
            <section className="student-alert student-alert--danger">
              <HiExclamationCircle />
              <div>
                <p className="student-alert__title">Booking privileges are currently paused</p>
                <p className="student-alert__body">
                  Access will resume on{' '}
                  {formatDateLabel(profile.suspended_until, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  .
                </p>
              </div>
            </section>
          )}

          {!profile.is_suspended && profile.no_show_count > 0 && (
            <section className="student-alert student-alert--warning">
              <HiExclamationCircle />
              <div>
                <p className="student-alert__title">Attendance reminder</p>
                <p className="student-alert__body">
                  {profile.no_show_count} warning
                  {profile.no_show_count === 1 ? '' : 's'} on record. Check in on time to keep full access.
                </p>
              </div>
            </section>
          )}

          {loading ? (
            <>
              <section className="student-stats">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="student-stat-card student-skeleton" />
                ))}
              </section>

              <section className="student-main-grid">
                <div className="student-panel student-skeleton student-skeleton--panel" />
                <div className="student-panel student-skeleton student-skeleton--panel" />
              </section>
            </>
          ) : (
            <>
              <section className="student-stats">
                {statCards.map((card) => (
                  <article
                    key={card.label}
                    className={`student-stat-card student-stat-card--${card.accent}`}
                  >
                    <div className="student-stat-card__head">
                      <div className="student-stat-card__icon">
                        <card.icon />
                      </div>
                      <span className="student-stat-card__note">{card.note}</span>
                    </div>
                    <p className="student-stat-card__label">{card.label}</p>
                    <h3 className="student-stat-card__value">
                      {card.value} <span>{card.suffix}</span>
                    </h3>
                  </article>
                ))}
              </section>

              <section className="student-main-grid">
                <div className="student-panel">
                  <div className="student-panel__header">
                    <div>
                      <h2>Upcoming Reservation</h2>
                      <p>Your next confirmed or pending study block.</p>
                    </div>
                    <button
                      type="button"
                      className="student-text-button"
                      onClick={() => navigate('/bookings')}
                    >
                      View All
                    </button>
                  </div>

                  {nextBooking ? (
                    <div className="student-reservation">
                      <div className="student-reservation__media">
                        <div className="student-reservation__badge">{nextReservationCountdown}</div>
                        <div className="student-reservation__frame" />
                      </div>

                      <div className="student-reservation__body">
                        <div className="student-reservation__title-row">
                          <div>
                            <span className="student-reservation__kicker">
                              {nextBookingFacility?.type_display || 'Upcoming reservation'}
                            </span>
                            <h3>{nextBooking.facility_name}</h3>
                          </div>
                          <button type="button" className="student-icon-button" aria-label="Reservation options">
                            <HiDotsVertical />
                          </button>
                        </div>

                        <p className="student-reservation__location">
                          <HiLocationMarker />
                          <span>{nextBookingFacility?.location || 'Campus space details available in bookings'}</span>
                        </p>

                        <div className="student-reservation__details">
                          <div className="student-reservation__detail-card">
                            <span>Date</span>
                            <strong>{formatFriendlyDate(nextBooking.slot_details?.date)}</strong>
                          </div>
                          <div className="student-reservation__detail-card">
                            <span>Time</span>
                            <strong>
                              {formatTime(nextBooking.slot_details?.start_time)} -{' '}
                              {formatTime(nextBooking.slot_details?.end_time)}
                            </strong>
                          </div>
                          <div className="student-reservation__detail-card">
                            <span>Status</span>
                            <strong>
                              {nextBooking.status === 'pending_approval' ? 'Awaiting approval' : 'Confirmed'}
                            </strong>
                          </div>
                        </div>

                        {nextBooking.manager_note && (
                          <p className="student-reservation__note">
                            Manager note: {nextBooking.manager_note}
                          </p>
                        )}

                        <div className="student-reservation__actions">
                          <button
                            type="button"
                            className="student-button student-button--muted"
                            onClick={() => navigate('/bookings')}
                          >
                            Manage Booking
                          </button>
                          <button
                            type="button"
                            className="student-button student-button--danger"
                            onClick={() =>
                              navigate(
                                nextBooking.slot_details?.facility
                                  ? `/facilities/${nextBooking.slot_details.facility}`
                                  : '/facilities',
                              )
                            }
                          >
                            Open Space
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="student-empty-state">
                      <div className="student-empty-state__icon">
                        <HiCalendar />
                      </div>
                      <h3>No reservation on the calendar yet</h3>
                      <p>
                        Browse live facility availability and lock in your next focused study session.
                      </p>
                      <button
                        type="button"
                        className="student-button student-button--primary"
                        onClick={() => navigate('/facilities')}
                      >
                        Explore Spaces
                      </button>
                    </div>
                  )}
                </div>

                <aside className="student-panel">
                  <div className="student-panel__header">
                    <div>
                      <h2>Recent Activity</h2>
                      <p>Your latest booking and waitlist updates.</p>
                    </div>
                  </div>

                  <div className="student-activity">
                    {activityEntries.length > 0 ? (
                      activityEntries.map((entry) => {
                        const EntryIcon = entry.icon;
                        return (
                          <article
                            key={entry.id}
                            className={`student-activity__item student-activity__item--${entry.tone}`}
                          >
                            <div className="student-activity__icon">
                              <EntryIcon />
                            </div>
                            <div className="student-activity__copy">
                              <h3>{entry.title}</h3>
                              <p>{entry.meta}</p>
                              <span>{entry.note}</span>
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className="student-empty-state student-empty-state--compact">
                        <div className="student-empty-state__icon">
                          <HiSparkles />
                        </div>
                        <h3>Nothing to show just yet</h3>
                        <p>Your dashboard activity will fill in as soon as you start booking spaces.</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="student-button student-button--full student-button--secondary"
                    onClick={() => navigate('/bookings')}
                  >
                    View Activity History
                  </button>
                </aside>
              </section>

              {recommendationCards.length > 0 && (
                <section className="student-panel">
                  <div className="student-panel__header">
                    <div>
                      <h2>Recommended Next</h2>
                      <p>Real-time suggestions based on your booking patterns and quieter slots.</p>
                    </div>
                  </div>

                  <div className="student-recommendations">
                    {recommendationCards.map((card) => (
                      <article key={card.id} className="student-recommendation">
                        <div className="student-recommendation__head">
                          <span>{card.type}</span>
                          <strong>{card.availability}</strong>
                        </div>
                        <h3>{card.title}</h3>
                        <p className="student-recommendation__location">{card.location}</p>
                        <p className="student-recommendation__timing">{card.timing}</p>
                        <p className="student-recommendation__reason">{card.reason}</p>
                        <button
                          type="button"
                          className="student-text-button"
                          onClick={() =>
                            navigate(card.facilityId ? `/facilities/${card.facilityId}` : '/facilities')
                          }
                        >
                          Quick Book
                          <HiArrowRight />
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          <footer className="student-footer">
            <p>
              © {new Date().getFullYear()} UniReserve. Designed to keep students moving from search to
              seat in a few clicks.
            </p>
            <div className="student-footer__links">
              <button type="button" className="student-footer__link" onClick={() => navigate('/facilities')}>
                Campus Map
              </button>
              <button type="button" className="student-footer__link" onClick={() => navigate('/bookings')}>
                Privacy
              </button>
              <button type="button" className="student-footer__link" onClick={() => navigate('/bookings')}>
                Terms
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Home;
