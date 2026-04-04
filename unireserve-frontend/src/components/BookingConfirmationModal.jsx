import React, { useEffect, useState } from 'react';
import {
  HiCalendar,
  HiCheckCircle,
  HiClock,
  HiExclamation,
  HiOfficeBuilding,
  HiX,
} from 'react-icons/hi';
import api from '../api/axios';
import { notifyError, notifySuccess } from '../utils/notify';

const BookingConfirmationModal = ({ isOpen, onClose, slot, facility, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
    }
  }, [isOpen, slot?.id]);

  if (!isOpen || !slot || !facility) {
    return null;
  }

  const handleBook = async () => {
    if (!agreed) {
      notifyError('You must agree to the university booking policy.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/bookings/bookings/', { slot_id: slot.id });
      const status = response.data.status;

      if (status === 'pending_approval') {
        notifySuccess('Request submitted. Your session becomes active after manager approval.');
      } else {
        notifySuccess('Booking confirmed successfully!');
      }

      onConfirm();
      onClose();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to complete booking. Please try again.';
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-modal">
      <div className="booking-modal__card">
        <button
          type="button"
          className="facility-icon-button booking-modal__close"
          onClick={onClose}
          aria-label="Close confirmation"
        >
          <HiX />
        </button>

        <div className="booking-modal__header">
          <div className="booking-modal__badge">
            <HiCheckCircle />
          </div>
          <h2>Confirm Reservation</h2>
          <p>Review the booking details and send your request for approval.</p>
        </div>

        <div className="booking-modal__summary">
          <div className="booking-modal__row">
            <HiOfficeBuilding />
            <div>
              <span className="booking-modal__row-label">Facility</span>
              <strong>{facility.name}</strong>
              <small>{facility.location}</small>
            </div>
          </div>

          <div className="booking-modal__grid">
            <div className="booking-modal__row">
              <HiCalendar />
              <div>
                <span className="booking-modal__row-label">Date</span>
                <strong>
                  {new Date(slot.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </strong>
              </div>
            </div>

            <div className="booking-modal__row">
              <HiClock />
              <div>
                <span className="booking-modal__row-label">Time</span>
                <strong>
                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-policy">
          <HiExclamation />
          <p>
            <strong>Booking policy</strong>
            Requests are reviewed by the facility manager. Cancellations are allowed up to 30 minutes
            before the session starts, and repeated no-shows may lead to booking restrictions.
          </p>
        </div>

        <label className="booking-checkbox">
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
          <span>I agree to the university facility usage, check-in, and attendance policy.</span>
        </label>

        <button
          type="button"
          className="booking-modal__action"
          disabled={loading}
          onClick={handleBook}
        >
          {loading ? 'Processing...' : 'Request This Session'}
        </button>

        <p className="booking-modal__footer">Booking updates will be sent to your university email</p>
      </div>
    </div>
  );
};

export default BookingConfirmationModal;
