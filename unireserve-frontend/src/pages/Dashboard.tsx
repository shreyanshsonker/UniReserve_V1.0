import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Bell, Calendar, MapPin, Activity } from 'lucide-react';
import apiClient from '../api/client';
import type { ApiEnvelope, BookingSummary } from '../types/api';
import { formatSlotDateTime, formatSlotTime } from '../utils/dateTime';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<BookingSummary[]>([]);

  useEffect(() => {
    apiClient
      .get<ApiEnvelope<BookingSummary[]>>('/bookings/')
      .then((response) => {
        setBookings(response.data.data);
      })
      .catch((error) => console.error('Failed to load bookings', error));
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading mb-1">Student Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.first_name}.</p>
        </div>
        <div className="relative">
          <div className="bg-surface-high p-3 rounded-full cursor-pointer hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5 text-gray-300" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-surface-high"></div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/20 text-primary rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Bookings</p>
              <p className="text-2xl font-bold">{bookings.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-tertiary/20 text-tertiary rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Waitlist Queue</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings List */}
      <div>
        <h2 className="text-xl mb-4 font-heading">Upcoming Bookings</h2>
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="glass-panel p-8 text-center text-gray-500">
              You have no active bookings. Time to explore facilities!
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="glass-card p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{booking.slot.facility_name}</h3>
                    <p className="text-sm text-gray-400">
                      {formatSlotDateTime(booking.slot.slot_date, booking.slot.start_time)} - {formatSlotTime(booking.slot.slot_date, booking.slot.end_time)}
                    </p>
                  </div>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    booking.status === 'CONFIRMED' ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' : 
                    booking.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
