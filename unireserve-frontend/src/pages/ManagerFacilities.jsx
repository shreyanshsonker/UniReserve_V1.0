import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { notifySuccess, notifyError } from '../utils/notify';
import {
  HiArrowRight,
  HiCalendar,
  HiCheckCircle,
  HiClock,
  HiMail,
  HiOfficeBuilding,
  HiPlus,
  HiSparkles,
  HiXCircle,
} from 'react-icons/hi';
import '../styles/workspacePages.css';

const initialFacilityForm = {
  name: '',
  type: 'library',
  location: '',
  description: '',
  capacity_per_slot: 1,
};

const initialSlotForm = {
  date: new Date().toISOString().split('T')[0],
  start_time: '09:00',
  end_time: '10:00',
  capacity: 10,
};

const formatDate = (value) => {
  if (!value) {
    return 'Date pending';
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (value) => (value ? value.slice(0, 5) : '--:--');

const facilityTypeLabels = {
  library: 'Library Seat',
  computer_lab: 'Computer Lab',
  study_room: 'Study Room',
  discussion: 'Discussion Room',
  seminar: 'Seminar Hall',
  music: 'Music Room',
  '3d_print': '3D Printing Lab',
};

const facilityTypeCopy = {
  library: 'Built for quiet revision, reading blocks, and uninterrupted focus.',
  computer_lab: 'Configured for software-heavy sessions and technical coursework.',
  study_room: 'A flexible collaboration room for team planning and assignment work.',
  discussion: 'Ideal for active conversations, critique sessions, and group reviews.',
  seminar: 'Set up for presentations, workshops, and larger academic cohorts.',
  music: 'Acoustically safer space for practice, recording, and performance prep.',
  '3d_print': 'Hands-on fabrication space for prototype sprints and maker projects.',
};

const ManagerFacilities = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('facilities');
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [activeFacility, setActiveFacility] = useState(null);
  const [facilityForm, setFacilityForm] = useState(initialFacilityForm);
  const [slotForm, setSlotForm] = useState(initialSlotForm);
  const [reviewModal, setReviewModal] = useState({
    open: false,
    action: 'approve',
    approval: null,
    note: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, appRes] = await Promise.all([
        api.get('/facilities/managed/'),
        api.get('/bookings/approvals/'),
      ]);
      const facData = facRes.data.results || facRes.data;
      const appData = appRes.data.results || appRes.data;
      setFacilities(Array.isArray(facData) ? facData : []);
      setApprovals(Array.isArray(appData) ? appData : []);
    } catch {
      notifyError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFacility = async (event) => {
    event.preventDefault();
    try {
      await api.post('/facilities/', {
        ...facilityForm,
        capacity_per_slot: Number(facilityForm.capacity_per_slot),
      });
      notifySuccess('Facility created successfully!');
      setShowFacilityModal(false);
      setFacilityForm(initialFacilityForm);
      await fetchData();
    } catch {
      notifyError('Failed to create facility.');
    }
  };

  const handleCreateSlot = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/facilities/${activeFacility.id}/slots/`, {
        ...slotForm,
        capacity: Number(slotForm.capacity),
      });
      notifySuccess('Slot created successfully!');
      setShowSlotModal(false);
      setSlotForm(initialSlotForm);
      setActiveFacility(null);
      await fetchData();
    } catch {
      notifyError('Failed to create slot.');
    }
  };

  const handleApproval = async () => {
    if (!reviewModal.approval) {
      return;
    }

    try {
      await api.patch(`/bookings/approvals/${reviewModal.approval.id}/action/`, {
        action: reviewModal.action,
        note: reviewModal.note,
      });
      notifySuccess(
        reviewModal.action === 'approve'
          ? 'Booking approved successfully.'
          : 'Booking rejected successfully.',
      );
      setReviewModal({ open: false, action: 'approve', approval: null, note: '' });
      await fetchData();
    } catch (error) {
      const msg = error.response?.data?.error || 'Action failed.';
      notifyError(msg);
    }
  };

  const openSlotModal = (facility) => {
    setActiveFacility(facility);
    setSlotForm(initialSlotForm);
    setShowSlotModal(true);
  };

  const openReviewModal = (approval, action) => {
    setReviewModal({
      open: true,
      action,
      approval,
      note: '',
    });
  };

  const activeFacilityCount = facilities.filter((facility) => facility.is_active).length;
  const totalSeatCapacity = facilities.reduce(
    (total, facility) => total + Number(facility.capacity_per_slot || 0),
    0,
  );
  const spaceMix = new Set(facilities.map((facility) => facility.type).filter(Boolean)).size;
  const latestApproval = approvals[0] || null;

  const kpiCards = [
    {
      label: 'Managed Spaces',
      value: facilities.length,
      hint: `${activeFacilityCount} actively listed for student bookings`,
      icon: HiOfficeBuilding,
    },
    {
      label: 'Pending Requests',
      value: approvals.length,
      hint: approvals.length ? 'Students are waiting for your review' : 'No review backlog right now',
      icon: HiMail,
    },
    {
      label: 'Seat Capacity',
      value: totalSeatCapacity,
      hint: 'Combined seats available per slot cycle',
      icon: HiCheckCircle,
    },
    {
      label: 'Space Mix',
      value: spaceMix,
      hint: 'Distinct facility categories in your portfolio',
      icon: HiSparkles,
    },
  ];

  const tabOptions = [
    { id: 'facilities', label: 'Facilities', count: facilities.length },
    { id: 'approvals', label: 'Approvals', count: approvals.length },
  ];

  const facilityCards = useMemo(() => [...facilities], [facilities]);
  const approvalCards = useMemo(() => [...approvals], [approvals]);

  return (
    <div className="workspace-page">
      <section className="workspace-hero">
        <div className="workspace-hero__content">
          <div className="workspace-hero__eyebrow">
            <HiSparkles />
            <span>Manager operations desk</span>
          </div>

          <h1 className="workspace-hero__title">
            Run your spaces with a clearer <span>control panel</span>.
          </h1>

          <p className="workspace-hero__description">
            Create facilities, publish slot capacity, and review student demand without bouncing
            between disconnected pages.
          </p>

          <div className="workspace-hero__actions">
            <button
              type="button"
              className="workspace-button workspace-button--primary"
              onClick={() => setShowFacilityModal(true)}
            >
              Add Facility
              <HiPlus />
            </button>
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={() => navigate('/manager/analytics')}
            >
              Open Analytics
              <HiArrowRight />
            </button>
          </div>
        </div>

        <div className="workspace-hero__aside">
          <article className="workspace-summary-card">
            <p className="workspace-summary-card__kicker">Approvals queue</p>
            <h2 className="workspace-summary-card__value">{approvals.length}</h2>
            <p className="workspace-summary-card__copy">
              {latestApproval
                ? `${latestApproval.user_name || 'A student'} is waiting on ${latestApproval.facility_name}.`
                : 'Your review queue is clear right now.'}
            </p>
            {latestApproval && (
              <div className="workspace-inline-meta">
                <span>{formatDate(latestApproval.slot_details?.date)}</span>
                <span>
                  {formatTime(latestApproval.slot_details?.start_time)} -{' '}
                  {formatTime(latestApproval.slot_details?.end_time)}
                </span>
              </div>
            )}
          </article>

          <article className="workspace-summary-card">
            <p className="workspace-summary-card__kicker">This portfolio</p>
            <div className="workspace-chip-grid">
              <div className="workspace-highlight-card">
                <p className="workspace-highlight-card__eyebrow">Live spaces</p>
                <h3 className="workspace-highlight-card__title">{activeFacilityCount}</h3>
                <p className="workspace-note">Facilities currently visible to students for booking.</p>
              </div>
              <div className="workspace-highlight-card">
                <p className="workspace-highlight-card__eyebrow">Seat supply</p>
                <h3 className="workspace-highlight-card__title">{totalSeatCapacity}</h3>
                <p className="workspace-note">Total available seats across a single slot cycle.</p>
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
            <h2 className="workspace-panel__title">Facility Operations</h2>
            <p className="workspace-panel__description">
              Switch between space management and approval workflows without losing context.
            </p>
          </div>
          <span className="workspace-panel__meta">
            {loading ? 'Loading live manager data...' : `${facilities.length} spaces, ${approvals.length} pending request(s)`}
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

          <div className="workspace-panel__actions">
            <button
              type="button"
              className="workspace-button workspace-button--ghost"
              onClick={fetchData}
            >
              Refresh
            </button>
            <button
              type="button"
              className="workspace-button workspace-button--secondary"
              onClick={() => setShowFacilityModal(true)}
            >
              New Space
            </button>
          </div>
        </div>

        {loading ? (
          <div className="workspace-card-grid workspace-card-grid--3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="workspace-skeleton" style={{ minHeight: '16rem' }} />
            ))}
          </div>
        ) : activeTab === 'facilities' ? (
          facilityCards.length === 0 ? (
            <div className="workspace-empty-state">
              <div className="workspace-empty-state__icon">
                <HiOfficeBuilding />
              </div>
              <h3>No facilities managed yet</h3>
              <p>Create your first campus space to start publishing slots and receiving bookings.</p>
              <button
                type="button"
                className="workspace-button workspace-button--primary"
                onClick={() => setShowFacilityModal(true)}
              >
                Create Facility
              </button>
            </div>
          ) : (
            <div className="workspace-card-grid workspace-card-grid--3">
              {facilityCards.map((facility) => (
                <article key={facility.id} className="workspace-card">
                  <div className="workspace-card__header">
                    <div className="workspace-card__icon">
                      <HiOfficeBuilding />
                    </div>
                    <span className="workspace-type-pill">
                      {facility.type_display || facilityTypeLabels[facility.type] || 'General'}
                    </span>
                  </div>

                  <h3 className="workspace-card__title" style={{ marginTop: '1rem' }}>
                    {facility.name || 'Unnamed Facility'}
                  </h3>

                  <div className="workspace-card__meta">
                    <span>
                      <HiOfficeBuilding />
                      {facility.location || 'Location pending'}
                    </span>
                    <span>
                      <HiCheckCircle />
                      {facility.capacity_per_slot} seat{facility.capacity_per_slot === 1 ? '' : 's'} per slot
                    </span>
                    <span>
                      <HiCalendar />
                      Added {formatDate(facility.created_at)}
                    </span>
                  </div>

                  <p className="workspace-card__description">
                    {facility.description ||
                      facilityTypeCopy[facility.type] ||
                      'Flexible campus resource ready for student scheduling.'}
                  </p>

                  <div className="workspace-card__footer">
                    <span
                      className={`workspace-status-pill ${
                        facility.is_active ? 'workspace-status-pill--success' : 'workspace-status-pill--muted'
                      }`}
                    >
                      {facility.is_active ? 'Live' : 'Hidden'}
                    </span>

                    <div className="workspace-highlight-card__actions" style={{ marginTop: 0 }}>
                      <button
                        type="button"
                        className="workspace-button workspace-button--secondary"
                        onClick={() => openSlotModal(facility)}
                      >
                        Add Slot
                      </button>
                      <button
                        type="button"
                        className="workspace-button workspace-button--ghost"
                        onClick={() => setActiveTab('approvals')}
                      >
                        Review Requests
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : approvalCards.length === 0 ? (
          <div className="workspace-empty-state">
            <div className="workspace-empty-state__icon">
              <HiCheckCircle />
            </div>
            <h3>Approval queue is clear</h3>
            <p>No pending booking requests are waiting for your decision right now.</p>
          </div>
        ) : (
          <div className="workspace-stack">
            {approvalCards.map((approval) => (
              <article key={approval.id} className="workspace-list-card">
                <div className="workspace-list-card__header">
                  <div>
                    <h3 className="workspace-card__title">{approval.user_name || 'Student Request'}</h3>
                    <div className="workspace-list-card__meta">
                      <span>
                        <HiOfficeBuilding />
                        {approval.facility_name || 'Campus space'}
                      </span>
                      <span>
                        <HiCalendar />
                        {formatDate(approval.slot_details?.date)}
                      </span>
                      <span>
                        <HiClock />
                        {formatTime(approval.slot_details?.start_time)} - {formatTime(approval.slot_details?.end_time)}
                      </span>
                    </div>
                  </div>
                  <span className="workspace-status-pill workspace-status-pill--warning">
                    Pending Approval
                  </span>
                </div>

                <div className="workspace-list-card__content">
                  <div className="workspace-notice workspace-notice--info">
                    <HiMail />
                    <p>
                      Review the booking and optionally leave a short note so the student knows why
                      it was approved or declined.
                    </p>
                  </div>
                </div>

                <div className="workspace-list-card__footer">
                  <div className="workspace-list-card__actions">
                    <button
                      type="button"
                      className="workspace-button workspace-button--success"
                      onClick={() => openReviewModal(approval, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="workspace-button workspace-button--danger"
                      onClick={() => openReviewModal(approval, 'reject')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showFacilityModal && (
        <div className="workspace-modal">
          <div className="workspace-modal__card">
            <div className="workspace-modal__header">
              <div>
                <h2 className="workspace-modal__title">Create a New Facility</h2>
                <p className="workspace-modal__description">
                  Add the core details now, then start publishing slots for students.
                </p>
              </div>
              <button
                type="button"
                className="workspace-icon-action"
                onClick={() => setShowFacilityModal(false)}
                aria-label="Close facility modal"
              >
                <HiXCircle />
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="workspace-form">
              <div className="workspace-field">
                <label htmlFor="facility-name">Facility Name</label>
                <input
                  id="facility-name"
                  required
                  type="text"
                  placeholder="Central Library Pod 04"
                  value={facilityForm.name}
                  onChange={(event) => setFacilityForm({ ...facilityForm, name: event.target.value })}
                />
              </div>

              <div className="workspace-form__grid">
                <div className="workspace-field">
                  <label htmlFor="facility-type">Type</label>
                  <select
                    id="facility-type"
                    value={facilityForm.type}
                    onChange={(event) => setFacilityForm({ ...facilityForm, type: event.target.value })}
                  >
                    {Object.entries(facilityTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="workspace-field">
                  <label htmlFor="facility-capacity">Capacity Per Slot</label>
                  <input
                    id="facility-capacity"
                    required
                    type="number"
                    min="1"
                    value={facilityForm.capacity_per_slot}
                    onChange={(event) =>
                      setFacilityForm({ ...facilityForm, capacity_per_slot: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="workspace-field">
                <label htmlFor="facility-location">Location</label>
                <input
                  id="facility-location"
                  required
                  type="text"
                  placeholder="Block A, 3rd Floor"
                  value={facilityForm.location}
                  onChange={(event) => setFacilityForm({ ...facilityForm, location: event.target.value })}
                />
              </div>

              <div className="workspace-field">
                <label htmlFor="facility-description">Description</label>
                <textarea
                  id="facility-description"
                  placeholder="Describe what makes this space useful for students."
                  value={facilityForm.description}
                  onChange={(event) =>
                    setFacilityForm({ ...facilityForm, description: event.target.value })
                  }
                />
              </div>

              <div className="workspace-modal__actions">
                <button type="submit" className="workspace-modal__submit">
                  Create Facility
                </button>
                <button
                  type="button"
                  className="workspace-modal__cancel"
                  onClick={() => setShowFacilityModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSlotModal && (
        <div className="workspace-modal">
          <div className="workspace-modal__card">
            <div className="workspace-modal__header">
              <div>
                <h2 className="workspace-modal__title">Add a New Slot</h2>
                <p className="workspace-modal__description">
                  Publish availability for <strong>{activeFacility?.name}</strong>.
                </p>
              </div>
              <button
                type="button"
                className="workspace-icon-action"
                onClick={() => {
                  setShowSlotModal(false);
                  setActiveFacility(null);
                }}
                aria-label="Close slot modal"
              >
                <HiXCircle />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="workspace-form">
              <div className="workspace-field">
                <label htmlFor="slot-date">Slot Date</label>
                <input
                  id="slot-date"
                  required
                  type="date"
                  value={slotForm.date}
                  onChange={(event) => setSlotForm({ ...slotForm, date: event.target.value })}
                />
              </div>

              <div className="workspace-form__grid">
                <div className="workspace-field">
                  <label htmlFor="slot-start">Start Time</label>
                  <input
                    id="slot-start"
                    required
                    type="time"
                    value={slotForm.start_time}
                    onChange={(event) => setSlotForm({ ...slotForm, start_time: event.target.value })}
                  />
                </div>

                <div className="workspace-field">
                  <label htmlFor="slot-end">End Time</label>
                  <input
                    id="slot-end"
                    required
                    type="time"
                    value={slotForm.end_time}
                    onChange={(event) => setSlotForm({ ...slotForm, end_time: event.target.value })}
                  />
                </div>
              </div>

              <div className="workspace-field">
                <label htmlFor="slot-capacity">Total Slot Capacity</label>
                <input
                  id="slot-capacity"
                  required
                  type="number"
                  min="1"
                  value={slotForm.capacity}
                  onChange={(event) => setSlotForm({ ...slotForm, capacity: event.target.value })}
                />
              </div>

              <div className="workspace-modal__actions">
                <button type="submit" className="workspace-modal__submit">
                  Publish Slot
                </button>
                <button
                  type="button"
                  className="workspace-modal__cancel"
                  onClick={() => {
                    setShowSlotModal(false);
                    setActiveFacility(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewModal.open && (
        <div className="workspace-modal">
          <div className="workspace-modal__card">
            <div className="workspace-modal__header">
              <div>
                <h2 className="workspace-modal__title">
                  {reviewModal.action === 'approve' ? 'Approve Booking Request' : 'Reject Booking Request'}
                </h2>
                <p className="workspace-modal__description">
                  {reviewModal.approval?.user_name || 'The student'} requested{' '}
                  <strong>{reviewModal.approval?.facility_name}</strong> on{' '}
                  {formatDate(reviewModal.approval?.slot_details?.date)}.
                </p>
              </div>
              <button
                type="button"
                className="workspace-icon-action"
                onClick={() =>
                  setReviewModal({ open: false, action: 'approve', approval: null, note: '' })
                }
                aria-label="Close approval modal"
              >
                <HiXCircle />
              </button>
            </div>

            <div className="workspace-form">
              <div className="workspace-notice workspace-notice--info">
                <HiMail />
                <p>Leave a short note if you want the student to understand your decision faster.</p>
              </div>

              <div className="workspace-field">
                <label htmlFor="approval-note">Manager Note</label>
                <textarea
                  id="approval-note"
                  placeholder="Optional context for the student"
                  value={reviewModal.note}
                  onChange={(event) =>
                    setReviewModal({ ...reviewModal, note: event.target.value })
                  }
                />
              </div>

              <div className="workspace-modal__actions">
                <button
                  type="button"
                  className="workspace-modal__submit"
                  onClick={handleApproval}
                >
                  {reviewModal.action === 'approve' ? 'Approve Booking' : 'Reject Booking'}
                </button>
                <button
                  type="button"
                  className="workspace-modal__cancel"
                  onClick={() =>
                    setReviewModal({ open: false, action: 'approve', approval: null, note: '' })
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerFacilities;
