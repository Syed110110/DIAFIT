import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Droplets, Youtube, Apple, User, Info, Menu, X, LogOut, Users, Shield, ClipboardList, Bell, FileText } from 'lucide-react';
// Import the logo directly
import logoImage from '../assests/logo2.png';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Navigation items for authenticated users
  const patientNavItems = [
    { path: '/dashboard', name: 'Dashboard', icon: Activity },
    { path: '/profile', name: 'Profile', icon: User },
    { path: '/diet-planner', name: 'Diet Planner', icon: Apple },
    { path: '/exercise-videos', name: 'Exercise Videos', icon: Youtube },
    { path: '/water-tracker', name: 'Water Tracker', icon: Droplets },
    { path: '/about-us', name: 'About Us', icon: Info },
  ];
  const authenticatedNavItems = user?.role === 'ADMIN'
    ? [{ path: '/admin/users', name: 'User Access', icon: Shield }, { path: '/about-us', name: 'About Us', icon: Info }]
    : user
      ? [...patientNavItems, { path: '/care-team', name: 'Care Team', icon: Users }]
      : patientNavItems;
  if (user && user.role !== 'ADMIN') {
    authenticatedNavItems.push({ path: '/care-logs', name: 'Care Logs', icon: ClipboardList });
    authenticatedNavItems.push({ path: '/care-alerts', name: 'Alerts', icon: Bell });
    authenticatedNavItems.push({ path: '/clinical-report', name: 'Clinical Report', icon: FileText });
  }
  if (user?.role === 'FAMILY_COORDINATOR') {
    authenticatedNavItems.push({ path: '/care-audit', name: 'Audit History', icon: Shield });
  }
  
  // Navigation items for non-authenticated users
  const publicNavItems = [
    { path: '/', name: 'Home', icon: Activity },
    { path: '/about-us', name: 'About Us', icon: Info },
  ];
  
  const navItems = user ? authenticatedNavItems : publicNavItems;
  
  return (
    <header className="dia-header">
      <div className="mx-auto max-w-[1440px] px-3 sm:px-5 lg:px-7">
        <div className="flex h-16 min-w-0 items-center gap-4">
          <div className="flex shrink-0 items-center">
            <Link to="/" className="flex items-center">
              {/* Use the imported logo */}
              <img 
                src={logoImage} 
                alt="DiaFit Logo" 
                className="h-9 w-9 shrink-0" 
              />
              <span className="dia-brand ml-2">DiaFit</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="dia-nav hidden items-center md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`dia-nav-link flex items-center rounded-md px-2.5 py-2 text-sm font-semibold ${isActive(item.path) ? 'dia-nav-link-active' : ''}`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
            
            {user ? (
              <button
                onClick={handleLogout}
                className="dia-nav-link flex items-center rounded-md px-2.5 py-2 text-sm font-semibold"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className={`dia-nav-link flex items-center rounded-md px-2.5 py-2 text-sm font-semibold ${isActive('/login') ? 'dia-nav-link-active' : ''}`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="dia-primary-button flex items-center rounded-md px-3 py-2 text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="dia-nav-link flex items-center rounded-md px-3 py-2 text-base font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="dia-primary-button mt-2 flex items-center rounded-md px-3 py-2 text-base"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;