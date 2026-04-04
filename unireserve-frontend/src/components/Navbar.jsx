import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HiCalendar,
  HiChartBar,
  HiHome,
  HiLogout,
  HiMenu,
  HiOfficeBuilding,
  HiUserCircle,
  HiX,
} from 'react-icons/hi';
import { useAuth } from '../context/useAuth';
import '../styles/appShell.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const homePath = useMemo(() => {
    if (!user) {
      return '/login';
    }

    if (user?.role === 'manager') {
      return '/manager/dashboard';
    }

    if (user?.role === 'admin') {
      return '/admin/dashboard';
    }

    return '/dashboard';
  }, [user]);

  const navLinks = useMemo(
    () => [
      { name: 'Dashboard', path: '/dashboard', icon: HiHome, roles: ['student'] },
      { name: 'Facilities', path: '/facilities', icon: HiOfficeBuilding, roles: ['student'] },
      { name: 'My Bookings', path: '/bookings', icon: HiCalendar, roles: ['student'] },
      { name: 'Dashboard', path: '/manager/dashboard', icon: HiOfficeBuilding, roles: ['manager'] },
      { name: 'Analytics', path: '/manager/analytics', icon: HiChartBar, roles: ['manager', 'admin'] },
      { name: 'Admin Hub', path: '/admin/dashboard', icon: HiUserCircle, roles: ['admin'] },
    ],
    [],
  );

  const guestLinks = useMemo(
    () => [
      { name: 'Student Register', path: '/register/student' },
      { name: 'Manager Register', path: '/register/manager' },
    ],
    [],
  );

  const filteredLinks = navLinks.filter((link) => link.roles.includes(user?.role));
  const initials = (user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <header className="app-navbar">
      <div className="app-navbar__inner">
        <button
          type="button"
          className="app-navbar__brand"
          onClick={() => {
            setIsOpen(false);
            navigate(homePath);
          }}
        >
          <span className="app-navbar__brand-mark">U</span>
          <span className="app-navbar__brand-copy">
            <strong>UniReserve</strong>
            <small>
              {user?.role === 'student'
                ? 'Student workspace'
                : user?.role === 'manager'
                  ? 'Manager workspace'
                  : 'Admin workspace'}
            </small>
          </span>
        </button>

        {user ? (
          <nav className="app-navbar__links" aria-label="Primary navigation">
            {filteredLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `app-navbar__link${isActive ? ' app-navbar__link--active' : ''}`
                }
                onClick={() => setIsOpen(false)}
              >
                <link.icon />
                <span>{link.name}</span>
              </NavLink>
            ))}
          </nav>
        ) : (
          <nav className="app-navbar__links" aria-label="Guest navigation">
            {guestLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `app-navbar__link${isActive ? ' app-navbar__link--active' : ''}`
                }
                onClick={() => setIsOpen(false)}
              >
                <span>{link.name}</span>
              </NavLink>
            ))}
          </nav>
        )}

        <div className="app-navbar__actions">
          {user ? (
            <>
              <div className="app-navbar__profile">
                <div className="app-navbar__profile-copy">
                  <strong>{user?.name || 'UniReserve'}</strong>
                  <small>
                    {user?.department || (user?.role ? `${user.role[0].toUpperCase()}${user.role.slice(1)}` : 'Guest')}
                  </small>
                </div>
                <span className="app-navbar__avatar" aria-hidden="true">
                  {initials}
                </span>
              </div>

              <button
                type="button"
                className="app-navbar__logout"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
              >
                <HiLogout />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="app-navbar__guest-actions">
              <NavLink to="/login" className="app-navbar__guest-link" onClick={() => setIsOpen(false)}>
                Login
              </NavLink>
              <NavLink
                to="/register/student"
                className="app-navbar__guest-link app-navbar__guest-link--primary"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </NavLink>
            </div>
          )}

          <button
            type="button"
            className="app-navbar__menu-toggle"
            onClick={() => setIsOpen((current) => !current)}
            aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          >
            {isOpen ? <HiX /> : <HiMenu />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="app-navbar__mobile">
          <nav className="app-navbar__mobile-links" aria-label="Mobile navigation">
            {user
              ? filteredLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `app-navbar__mobile-link${isActive ? ' app-navbar__mobile-link--active' : ''}`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    <link.icon />
                    <span>{link.name}</span>
                  </NavLink>
                ))
              : guestLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `app-navbar__mobile-link${isActive ? ' app-navbar__mobile-link--active' : ''}`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    <span>{link.name}</span>
                  </NavLink>
                ))}
          </nav>

          {user ? (
            <button
              type="button"
              className="app-navbar__mobile-logout"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
            >
              <HiLogout />
              <span>Logout</span>
            </button>
          ) : (
            <NavLink
              to="/login"
              className="app-navbar__mobile-logout"
              onClick={() => setIsOpen(false)}
            >
              <span>Login</span>
            </NavLink>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
