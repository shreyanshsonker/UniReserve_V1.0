import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { Clock, Users, ArrowLeft } from 'lucide-react';
import type {
  ApiEnvelope,
  BookingSummary,
  FacilityDetail as FacilityDetailType,
  SlotAvailability,
} from '../types/api';
import { extractErrorMessage } from '../utils/api';
import { formatSlotTime } from '../utils/dateTime';

const getToday = () => new Date().toISOString().slice(0, 10);

const FacilityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<FacilityDetailType | null>(null);
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!id) {
      return;
    }

    apiClient
      .get<ApiEnvelope<FacilityDetailType>>(`/facilities/${id}/`)
      .then((response) => setFacility(response.data.data))
      .catch((error) => setMsg(extractErrorMessage(error, 'Failed to load facility details.')));
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    setSelectedSlot(null);
    apiClient
      .get<ApiEnvelope<SlotAvailability[]>>(`/facilities/${id}/availability/`, {
        params: { date: selectedDate },
      })
      .then((response) => setSlots(response.data.data))
      .catch((error) => setMsg(extractErrorMessage(error, 'Failed to load available slots.')));
  }, [id, selectedDate]);

  const handleBook = async () => {
    if (!selectedSlot || !facility) return;

    setLoading(true);
    setMsg('');

    try {
      await apiClient.post<ApiEnvelope<BookingSummary>>('/bookings/', {
        facility: facility.id,
        slot: selectedSlot.id,
        group_size: 1,
      });

      setMsg(facility.requires_approval ? 'Booking request submitted for approval.' : 'Booking confirmed successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setMsg(extractErrorMessage(err, 'Failed to book slot.'));
    } finally {
      setLoading(false);
    }
  };

  if (!facility) return <div className="p-8 text-center text-gray-500">Loading details...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button onClick={() => navigate('/facilities')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Facilities
      </button>

      <div className="glass-panel overflow-hidden mb-8">
        <div className="h-64 bg-gradient-to-r from-primary/40 to-secondary/40 relative">
          <div className="absolute inset-0 bg-surface/40 backdrop-blur-lg"></div>
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-4xl font-heading font-bold drop-shadow-md">{facility.name}</h1>
            <div className="flex gap-4 mt-3 text-sm font-medium">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-full border border-white/10">
                <Users className="w-4 h-4 text-tertiary" /> {facility.total_capacity} Capacity
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-full border border-white/10">
                {facility.requires_approval ? 'Approval Required' : 'Instant Booking'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-bold font-heading">Available Time Slots</h2>
            <label className="text-sm text-gray-300">
              Booking Date
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="input-field mt-2"
              />
            </label>
          </div>
          {msg && (
            <div className={`p-4 rounded-xl border ${(msg.includes('successfully') || msg.includes('submitted')) ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {msg}
            </div>
          )}
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {slots.map((slot) => (
              <button 
                key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                disabled={slot.is_blocked || slot.available_capacity <= 0}
                className={`p-4 rounded-xl border transition-all text-left ${selectedSlot?.id === slot.id ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-surface-high/50 border-white/5 hover:border-white/20'} ${(slot.is_blocked || slot.available_capacity <= 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Clock className={`w-5 h-5 mb-2 ${selectedSlot?.id === slot.id ? 'text-primary' : 'text-gray-400'}`} />
                <div className="font-bold">{formatSlotTime(slot.slot_date, slot.start_time)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {slot.is_blocked ? 'Blocked' : `${slot.available_capacity} spots left`}
                </div>
              </button>
            ))}
            {slots.length === 0 && <div className="col-span-3 text-gray-400">No time slots available.</div>}
          </div>
        </div>

        <div>
          <div className="glass-card p-6 sticky top-6">
            <h3 className="font-bold text-lg mb-4">Reservation Summary</h3>
            {selectedSlot ? (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">Time</span>
                  <span className="font-medium text-right">{formatSlotTime(selectedSlot.slot_date, selectedSlot.start_time)}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-gray-400">Date</span>
                  <span className="font-medium text-right">{new Date(`${selectedSlot.slot_date}T${selectedSlot.start_time}`).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-6">Select a time slot to proceed with booking.</p>
            )}
            
            <button 
              onClick={handleBook}
              disabled={!selectedSlot || loading}
              className={`primary-button text-lg ${!selectedSlot ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetail;
