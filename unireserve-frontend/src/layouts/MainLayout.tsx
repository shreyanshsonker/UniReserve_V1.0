import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LogOut, Home, Compass, Shield } from 'lucide-react';
import apiClient from '../api/client';

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout/');
    } catch {
      // Clear client state even if the server-side session is already gone.
    } finally {
      logout();
      navigate('/auth/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, visible: true },
    { name: 'Explore', path: '/facilities', icon: Compass, visible: true },
    { name: 'Approvals', path: '/manager', icon: Shield, visible: user?.role === 'MANAGER' || user?.role === 'ADMIN' },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none"></div>

      <nav className="border-b border-white/5 bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex-shrink-0 flex items-center text-xl font-heading font-bold text-white">
                Uni<span className="text-primary">Reserve</span>
              </div>
              <div className="hidden md:flex space-x-2">
                {navItems.filter(item => item.visible).map(item => (
                  <Link 
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${location.pathname.startsWith(item.path) ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-400">Welcome, </span>
                <span className="font-medium text-white">{user?.first_name}</span>
                <span className="ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10 text-gray-300">
                  {user?.role}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-red-500/20 transition-colors focus:outline-none"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 z-10 relative">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
