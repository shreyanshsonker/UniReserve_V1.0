import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HiArrowRight,
  HiCalendar,
  HiCheckCircle,
  HiChevronLeft,
  HiClock,
  HiDesktopComputer,
  HiInformationCircle,
  HiLibrary,
  HiLocationMarker,
  HiMusicNote,
  HiOfficeBuilding,
  HiPrinter,
  HiRefresh,
  HiShieldCheck,
  HiSpeakerphone,
  HiSparkles,
  HiUserGroup,
  HiWifi,
} from 'react-icons/hi';
import api from '../api/axios';
import BookingConfirmationModal from '../components/BookingConfirmationModal';
import { notifyError, notifySuccess } from '../utils/notify';
import '../styles/facilityBooking.css';

const facilityExperience = {
  library: {
    eyebrow: 'Quiet study zone',
    summary: 'Designed for solo focus, reading sprints, and distraction-free revision blocks.',
    guidelines:
      'Keep calls outside the pod, leave the desk reset, and use headphones for any media playback.',
    access: 'RFID access required for library pod entry',
    equipment: [
      {
        title: '4K work display',
        detail: 'Large-screen setup for notes, PDFs, and split-screen research.',
        icon: HiDesktopComputer,
      },
      {
        title: 'Campus Wi-Fi 6',
        detail: 'Stable high-speed connection tuned for research and cloud tools.',
        icon: HiWifi,
      },
      {
        title: 'Focus seating',
        detail: 'Ergonomic chair and task lighting for long study sessions.',
        icon: HiLibrary,
      },
    ],
  },
  study_room: {
    eyebrow: 'Small group room',
    summary: 'Ideal for collaborative prep, whiteboard sessions, and low-noise teamwork.',
    guidelines:
      'Keep the room organized, respect the booking end time, and leave shared surfaces clean.',
    access: 'Campus ID unlocks the study room for booked users',
    equipment: [
      {
        title: 'Shared display',
        detail: 'Plug-and-present screen for slides, docs, and group review.',
        icon: HiDesktopComputer,
      },
      {
        title: 'Flexible seating',
        detail: 'Moveable chairs and tables for pair work or small team huddles.',
        icon: HiUserGroup,
      },
      {
        title: 'Reliable Wi-Fi',
        detail: 'Optimized network access for collaboration tools and streaming.',
        icon: HiWifi,
      },
    ],
  },
  discussion: {
    eyebrow: 'Discussion room',
    summary: 'Built for idea reviews, project standups, and spoken collaboration.',
    guidelines:
      'Keep noise within the room, avoid overruns, and wipe any shared boards after use.',
    access: 'Booked users can enter with their university ID',
    equipment: [
      {
        title: 'Presentation screen',
        detail: 'Quick-connect display for laptops and collaborative walkthroughs.',
        icon: HiDesktopComputer,
      },
      {
        title: 'Conversation seating',
        detail: 'Comfortable arrangement for brainstorming and peer review.',
        icon: HiUserGroup,
      },
      {
        title: 'Voice-friendly acoustics',
        detail: 'Room treatment that keeps meetings clear without disturbing neighbors.',
        icon: HiSpeakerphone,
      },
    ],
  },
  computer_lab: {
    eyebrow: 'Digital workstation',
    summary: 'Best for coding, simulation work, lab software, and hardware-backed coursework.',
    guidelines:
      'Use the assigned machine only, save files to your own storage, and log out before leaving.',
    access: 'Manager approval may be required for specialized lab time',
    equipment: [
      {
        title: 'Lab-grade computers',
        detail: 'Configured systems for coursework, IDEs, and resource-heavy tools.',
        icon: HiDesktopComputer,
      },
      {
        title: 'Gigabit network',
        detail: 'Fast wired and wireless access for downloads, repos, and cloud sync.',
        icon: HiWifi,
      },
      {
        title: 'Collaboration seating',
        detail: 'Set up for paired work, demos, and assistant walkthroughs.',
        icon: HiUserGroup,
      },
    ],
  },
  seminar: {
    eyebrow: 'Presentation space',
    summary: 'Made for workshops, talks, and structured group learning sessions.',
    guidelines:
      'Arrive early for setup, test presentation devices before start time, and reset AV inputs after use.',
    access: 'Managed entry for approved seminar reservations',
    equipment: [
      {
        title: 'Front-of-room display',
        detail: 'Large-format screen for decks, live demos, and visual content.',
        icon: HiDesktopComputer,
      },
      {
        title: 'Room audio support',
        detail: 'Speaker and microphone support for presentations and Q&A.',
        icon: HiSpeakerphone,
      },
      {
        title: 'Audience seating',
        detail: 'Arranged layout for classes, workshops, and review sessions.',
        icon: HiUserGroup,
      },
    ],
  },
  music: {
    eyebrow: 'Practice room',
    summary: 'Reserved for rehearsal, recording prep, and focused performance practice.',
    guidelines:
      'Keep the room ventilated, return stands and stools, and respect the posted volume rules.',
    access: 'Sound-isolated room with monitored access',
    equipment: [
      {
        title: 'Acoustic treatment',
        detail: 'Room designed to support clean rehearsal and reduced spill.',
        icon: HiMusicNote,
      },
      {
        title: 'Stable connectivity',
        detail: 'Network access for backing tracks, uploads, and digital resources.',
        icon: HiWifi,
      },
      {
        title: 'Flexible setup',
        detail: 'Open floor space for solo practice or small ensemble rehearsal.',
        icon: HiUserGroup,
      },
    ],
  },
  '3d_print': {
    eyebrow: 'Fabrication station',
    summary: 'Use this space for print jobs, prototyping checks, and supervised making sessions.',
    guidelines:
      'Bring approved files only, follow safety signage, and do not leave active prints unattended.',
    access: 'Safety policy acknowledgement required before entry',
    equipment: [
      {
        title: '3D print hardware',
        detail: 'Prototype-ready equipment maintained for student fabrication.',
        icon: HiPrinter,
      },
      {
        title: 'Prep workstation',
        detail: 'Review slicing, dimensions, and file readiness before printing.',
        icon: HiDesktopComputer,
      },
      {
        title: 'Safety oversight',
        detail: 'Managed environment with ventilation and monitored operations.',
        icon: HiShieldCheck,
      },
    ],
  },
  default: {
    eyebrow: 'Campus booking space',
    summary: 'A flexible space built to help students move from search to productive work quickly.',
    guidelines:
      'Respect the session window, leave the room ready for the next student, and follow posted usage policies.',
    access: 'University ID required for entry',
    equipment: [
      {
        title: 'Student-ready setup',
        detail: 'Core furniture and equipment for day-to-day academic work.',
        icon: HiOfficeBuilding,
      },
      {
        title: 'Campus network',
        detail: 'Reliable Wi-Fi access for research, coursework, and collaboration.',
        icon: HiWifi,
      },
      {
        title: 'Shared occupancy',
        detail: 'Sized for individual focus or small-team usage depending on capacity.',
        icon: HiUserGroup,
      },
    ],
  },
};

const formatDateLabel = (value, options) => {
  if (!value) {
    return 'TBD';
  }

  const parsed = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return 'TBD';
  }

  return parsed.toLocaleDateString('en-US', options);
};

const formatTime = (value) => (value ? value.slice(0, 5) : '--:--');

const getSlotWindow = (slot) => `${formatTime(slot?.start_time)} - ${formatTime(slot?.end_time)}`;

const getDurationHours = (slot) => {
  if (!slot?.start_time || !slot?.end_time) {
    return 0;
  }

  const start = new Date(`1970-01-01T${slot.start_time}`);
  const end = new Date(`1970-01-01T${slot.end_time}`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  return Math.max(0, (end.getTime() - start.getTime()) / 3600000);
};

const getSlotPhase = (slot) => {
  const startHour = Number.parseInt(slot?.start_time?.slice(0, 2) || '0', 10);

  if (startHour < 12) {
    return 'Morning';
  }

  if (startHour < 17) {
    return 'Afternoon';
  }

  if (startHour < 21) {
    return 'Evening';
  }

  return 'Night';
};

const getAvailabilityPresentation = (status) => {
  switch (status) {
    case 'green':
      return {
        label: 'Available now',
        tone: 'success',
        detail: 'Best chance to lock this in immediately.',
      };
    case 'yellow':
      return {
        label: 'Filling fast',
        tone: 'warning',
        detail: 'Seats remain, but demand is rising.',
      };
    case 'red':
      return {
        label: 'Waitlist open',
        tone: 'danger',
        detail: 'All seats are taken for this window.',
      };
    case 'blocked':
      return {
        label: 'Unavailable',
        tone: 'muted',
        detail: 'This slot is blocked or under maintenance.',
      };
    default:
      return {
        label: 'Unknown',
        tone: 'muted',
        detail: 'Status is still loading.',
      };
  }
};

const isSlotLiveNow = (slot) => {
  if (!slot?.date || !slot?.start_time || !slot?.end_time || slot?.is_blocked) {
    return false;
  }

  const start = new Date(`${slot.date}T${slot.start_time}`);
  const end = new Date(`${slot.date}T${slot.end_time}`);
  const now = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  return now >= start && now <= end && slot.availability_status !== 'red';
};

const SlotPicker = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [facility, setFacility] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dates = Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + index);

    return {
      full: nextDate.toISOString().split('T')[0],
      day: nextDate.toLocaleDateString('en-US', { weekday: 'short' }),
      date: nextDate.getDate(),
      month: nextDate.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  const fetchSlots = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [facilityResponse, slotResponse] = await Promise.all([
          api.get(`/facilities/${id}/`),
          api.get(`/facilities/${id}/slots/?date=${selectedDate}`),
        ]);

        setFacility(facilityResponse.data);
        const slotData = slotResponse.data.results || slotResponse.data;
        setSlots(Array.isArray(slotData) ? slotData : []);
    } catch {
      notifyError('Failed to load facility availability. Please try again.');
    } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, selectedDate],
  );

  useEffect(() => {
    fetchSlots();

    const interval = setInterval(() => {
      fetchSlots(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSlots]);

  useEffect(() => {
    setSelectedSlot((currentSlot) => {
      if (!slots.length) {
        return null;
      }

      if (currentSlot) {
        const sameSlot = slots.find((slot) => slot.id === currentSlot.id && !slot.is_blocked);
        if (sameSlot) {
          return sameSlot;
        }
      }

      return (
        slots.find((slot) => !slot.is_blocked && slot.availability_status !== 'red') ||
        slots.find((slot) => !slot.is_blocked) ||
        slots[0]
      );
    });
  }, [slots]);

  const handleJoinWaitlist = async (slot) => {
    if (
      !window.confirm(
        `Join the waitlist for ${getSlotWindow(slot)}? Your estimated position is ${
          slot.current_bookings - slot.capacity + 1
        }.`,
      )
    ) {
      return;
    }

    try {
      await api.post('/bookings/waitlist/', { slot_id: slot.id });
      notifySuccess('Successfully joined the waitlist. You can track it in My Reservations.');
      fetchSlots(true);
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to join the waitlist.';
      notifyError(message);
    }
  };

  const handlePrimaryAction = () => {
    if (!selectedSlot || selectedSlot.is_blocked) {
      return;
    }

    if (selectedSlot.availability_status === 'red') {
      handleJoinWaitlist(selectedSlot);
      return;
    }

    setIsModalOpen(true);
  };

  const activeExperience = facilityExperience[facility?.type] || facilityExperience.default;
  const liveSlot = slots.find((slot) => isSlotLiveNow(slot));
  const availableCount = slots.filter(
    (slot) => !slot.is_blocked && ['green', 'yellow'].includes(slot.availability_status),
  ).length;
  const waitlistCount = slots.filter((slot) => slot.availability_status === 'red').length;
  const heroStatus = liveSlot
    ? getAvailabilityPresentation('green')
    : availableCount > 0
      ? getAvailabilityPresentation('yellow')
      : waitlistCount > 0
        ? getAvailabilityPresentation('red')
        : getAvailabilityPresentation('blocked');
  const selectedPresentation = getAvailabilityPresentation(selectedSlot?.availability_status);
  const selectedCredits = Math.max(10, Math.round(getDurationHours(selectedSlot) * 10)) || 10;
  const selectedDateLabel = formatDateLabel(selectedDate, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const facilityDescription =
    facility?.description?.trim() || activeExperience.summary;
  const topBadgeText = liveSlot ? 'Available Now' : heroStatus.label;
  const slotActionLabel = !selectedSlot
    ? 'Choose a Time Slot'
    : selectedSlot.is_blocked
      ? 'Unavailable'
      : selectedSlot.availability_status === 'red'
        ? 'Join Waitlist'
        : 'Confirm Booking';

  return (
    <div className="facility-booking-page">
      <main className="facility-booking-main">
        <div className="facility-page-header">
          <button
            type="button"
            className="facility-back-link"
            onClick={() => navigate('/facilities')}
          >
            <HiChevronLeft />
            <span>Back to Facilities</span>
          </button>
        </div>

        {loading ? (
          <div className="facility-booking-skeleton">
            <div className="facility-booking-skeleton__hero" />
            <div className="facility-booking-skeleton__grid">
              <div className="facility-booking-skeleton__panel" />
              <div className="facility-booking-skeleton__panel" />
            </div>
          </div>
        ) : facility ? (
          <>
            <section className={`facility-hero facility-hero--${facility.type || 'default'}`}>
              <div className="facility-hero__visual" aria-hidden="true">
                <div className="facility-hero__orb facility-hero__orb--primary" />
                <div className="facility-hero__orb facility-hero__orb--secondary" />
                <div className="facility-hero__grid" />
              </div>

              <div className="facility-hero__content">
                <div className="facility-hero__eyebrow">
                  <HiLocationMarker />
                  <span>{facility.location}</span>
                </div>

                <h1>{facility.name}</h1>
                <p className="facility-hero__description">{facilityDescription}</p>

                <div className="facility-hero__badges">
                  <span className={`facility-pill facility-pill--${heroStatus.tone}`}>
                    <HiCheckCircle />
                    {topBadgeText}
                  </span>
                  <span className="facility-pill facility-pill--violet">
                    <HiUserGroup />
                    {facility.capacity_per_slot} person{facility.capacity_per_slot === 1 ? '' : 's'}
                  </span>
                  <span className="facility-pill facility-pill--muted">
                    <HiSparkles />
                    {activeExperience.eyebrow}
                  </span>
                </div>
              </div>
            </section>

            <div className="facility-booking-layout">
              <div className="facility-booking-layout__main">
                <section className="facility-surface">
                  <div className="facility-surface__header">
                    <div>
                      <h2>Available Time Slots</h2>
                      <p>Select your preferred session window and confirm on the right.</p>
                    </div>
                    <div className="facility-surface__header-meta">
                      <span>
                        <HiCalendar />
                        {selectedDateLabel}
                      </span>
                      <button
                        type="button"
                        className="facility-refresh"
                        onClick={() => fetchSlots(true)}
                      >
                        <HiRefresh className={refreshing ? 'facility-spin' : ''} />
                        {refreshing ? 'Refreshing' : 'Refresh'}
                      </button>
                    </div>
                  </div>

                  <div className="facility-date-strip" role="tablist" aria-label="Available dates">
                    {dates.map((date) => (
                      <button
                        key={date.full}
                        type="button"
                        className={`facility-date-chip${
                          selectedDate === date.full ? ' facility-date-chip--active' : ''
                        }`}
                        onClick={() => setSelectedDate(date.full)}
                      >
                        <span>{date.day}</span>
                        <strong>{date.date}</strong>
                        <small>{date.month}</small>
                      </button>
                    ))}
                  </div>

                  <div className="facility-slot-legend">
                    <span className="facility-slot-legend__item">
                      <i className="facility-slot-legend__dot facility-slot-legend__dot--success" />
                      Ready to book
                    </span>
                    <span className="facility-slot-legend__item">
                      <i className="facility-slot-legend__dot facility-slot-legend__dot--warning" />
                      Busy but open
                    </span>
                    <span className="facility-slot-legend__item">
                      <i className="facility-slot-legend__dot facility-slot-legend__dot--danger" />
                      Waitlist only
                    </span>
                  </div>

                  {slots.length === 0 ? (
                    <div className="facility-empty-state">
                      <div className="facility-empty-state__icon">
                        <HiCalendar />
                      </div>
                      <h3>No slots generated for this date yet</h3>
                      <p>Try another day or check back soon once the facility schedule is published.</p>
                    </div>
                  ) : (
                    <div className="facility-slot-grid">
                      {slots.map((slot) => {
                        const presentation = getAvailabilityPresentation(slot.availability_status);
                        const isSelected = selectedSlot?.id === slot.id;
                        const slotClasses = `facility-slot-card facility-slot-card--${presentation.tone}${
                          isSelected ? ' facility-slot-card--selected' : ''
                        }${slot.is_blocked ? ' facility-slot-card--disabled' : ''}`;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            className={slotClasses}
                            onClick={() => !slot.is_blocked && setSelectedSlot(slot)}
                            disabled={slot.is_blocked}
                          >
                            <span className="facility-slot-card__phase">{getSlotPhase(slot)}</span>
                            <strong>{getSlotWindow(slot)}</strong>
                            <span className="facility-slot-card__status">{presentation.label}</span>
                            <small>
                              {slot.is_blocked
                                ? 'Maintenance mode'
                                : slot.availability_status === 'red'
                                  ? `Waitlist available`
                                  : `${slot.slots_remaining} seat${slot.slots_remaining === 1 ? '' : 's'} left`}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                <div className="facility-booking-bento">
                  <section className="facility-surface">
                    <div className="facility-surface__title">
                      <HiDesktopComputer />
                      <h2>In-Space Equipment</h2>
                    </div>

                    <div className="facility-equipment">
                      {activeExperience.equipment.map((item) => (
                        <article key={item.title} className="facility-equipment__item">
                          <div className="facility-equipment__icon">
                            <item.icon />
                          </div>
                          <div>
                            <h3>{item.title}</h3>
                            <p>{item.detail}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="facility-surface facility-surface--guide">
                    <div className="facility-surface__title">
                      <HiShieldCheck />
                      <h2>Space Guidelines</h2>
                    </div>

                    <p className="facility-guidelines__copy">{activeExperience.guidelines}</p>

                    <div className="facility-guidelines__badge">
                      <HiShieldCheck />
                      <span>{activeExperience.access}</span>
                    </div>

                    <div className="facility-guidelines__meta">
                      <div>
                        <span>Approvals</span>
                        <strong>Manager review before activation</strong>
                      </div>
                      <div>
                        <span>Cancellation</span>
                        <strong>Free up to 30 min before start</strong>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <aside className="facility-booking-layout__sidebar">
                <div className="facility-summary">
                  <h2>Reservation Details</h2>

                  {selectedSlot ? (
                    <>
                      <div className="facility-summary__rows">
                        <div className="facility-summary__row">
                          <span>Facility</span>
                          <strong>{facility.name}</strong>
                        </div>
                        <div className="facility-summary__row">
                          <span>Date</span>
                          <strong>{selectedDateLabel}</strong>
                        </div>
                        <div className="facility-summary__row">
                          <span>Time</span>
                          <strong className={`facility-summary__accent facility-summary__accent--${selectedPresentation.tone}`}>
                            {getSlotWindow(selectedSlot)}
                          </strong>
                        </div>
                        <div className="facility-summary__row">
                          <span>Status</span>
                          <strong>{selectedPresentation.label}</strong>
                        </div>
                        <div className="facility-summary__row">
                          <span>Credits</span>
                          <strong>{selectedCredits}</strong>
                        </div>
                      </div>

                      <div className={`facility-summary__callout facility-summary__callout--${selectedPresentation.tone}`}>
                        <p>{selectedPresentation.detail}</p>
                        <span>
                          {selectedSlot.is_blocked
                            ? 'Unavailable for booking'
                            : selectedSlot.availability_status === 'red'
                              ? 'Join the queue and we will notify you if a seat opens.'
                              : `${selectedSlot.slots_remaining} spot${selectedSlot.slots_remaining === 1 ? '' : 's'} remaining in this slot.`}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`facility-summary__action${
                          selectedSlot.availability_status === 'red'
                            ? ' facility-summary__action--waitlist'
                            : ''
                        }`}
                        onClick={handlePrimaryAction}
                        disabled={selectedSlot.is_blocked}
                      >
                        {slotActionLabel}
                        <HiArrowRight />
                      </button>

                      <p className="facility-summary__caption">
                        Booking requests are reviewed by the facility manager before becoming active.
                      </p>
                    </>
                  ) : (
                    <div className="facility-empty-state facility-empty-state--compact">
                      <div className="facility-empty-state__icon">
                        <HiClock />
                      </div>
                      <h3>Select a slot to continue</h3>
                      <p>Once you choose a time window, your reservation summary will appear here.</p>
                    </div>
                  )}
                </div>

                <div className="facility-map-card">
                  <div className="facility-map-card__canvas" aria-hidden="true">
                    <div className="facility-map-card__rings" />
                    <div className="facility-map-card__pin">
                      <HiLocationMarker />
                    </div>
                  </div>

                  <div className="facility-map-card__copy">
                    <h3>Location Snapshot</h3>
                    <p>{facility.location}</p>
                    <span>
                      Managed by {facility.manager_name || 'facility operations'} • {facility.type_display}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </>
        ) : (
          <div className="facility-empty-state">
            <div className="facility-empty-state__icon">
              <HiInformationCircle />
            </div>
            <h3>Facility details are unavailable</h3>
            <p>We could not load this booking page right now. Please head back and try again.</p>
            <button type="button" className="facility-ghost-button" onClick={() => navigate('/facilities')}>
              Back to Explore
            </button>
          </div>
        )}
      </main>

      <BookingConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slot={selectedSlot}
        facility={facility}
        onConfirm={() => fetchSlots(true)}
      />
    </div>
  );
};

export default SlotPicker;
