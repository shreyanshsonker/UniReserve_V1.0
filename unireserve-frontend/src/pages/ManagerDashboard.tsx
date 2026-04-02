import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { CheckCircle, XCircle } from 'lucide-react';
import type { ApiEnvelope, BookingSummary } from '../types/api';
import { formatSlotDateTime } from '../utils/dateTime';

const ManagerDashboard = () => {
  const [pending, setPending] = useState<BookingSummary[]>([]);
  
  const fetchPending = () => {
    apiClient
      .get<ApiEnvelope<BookingSummary[]>>('/bookings/')
      .then((response) => {
        const pendingBookings = response.data.data.filter((booking) => booking.status === 'PENDING');
        setPending(pendingBookings);
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiClient.post(`/bookings/${id}/${action}/`);
      fetchPending();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading mb-6">Manager Approvals Hub</h1>
      
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold mb-4">Pending Booking Requests</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="py-3 px-4 font-medium">Facility</th>
                <th className="py-3 px-4 font-medium">Student Info</th>
                <th className="py-3 px-4 font-medium">Time Slot</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">All caught up! No pending approvals.</td>
                </tr>
              ) : (
                pending.map((booking) => (
                  <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-medium">{booking.slot.facility_name}</td>
                    <td className="py-4 px-4">{booking.student.email}</td>
                    <td className="py-4 px-4 text-sm text-gray-300">
                      {formatSlotDateTime(booking.slot.slot_date, booking.slot.start_time)}
                    </td>
                    <td className="py-4 px-4 flex justify-end gap-2">
                      <button onClick={() => handleAction(booking.id, 'approve')} className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors border border-green-500/30">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleAction(booking.id, 'reject')} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors border border-red-500/30">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
