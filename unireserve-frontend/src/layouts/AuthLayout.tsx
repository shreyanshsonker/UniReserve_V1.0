import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="bg-surface min-h-screen text-white">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
