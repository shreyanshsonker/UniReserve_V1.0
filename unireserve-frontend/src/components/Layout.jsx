import React from 'react';
import { matchPath, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import '../styles/appShell.css';

const Layout = () => {
  const location = useLocation();

  const isWideRoute =
    location.pathname === '/dashboard' || Boolean(matchPath('/facilities/:id', location.pathname));

  return (
    <div className="app-shell">
      <Navbar />
      <main className={`app-shell__main${isWideRoute ? ' app-shell__main--wide' : ''}`}>
        <Outlet />
      </main>

      {!isWideRoute && (
        <footer className="app-footer">
          <div className="app-footer__inner">
            <p>
              &copy; {new Date().getFullYear()} UniReserve · University facility booking and
              management
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
