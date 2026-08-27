import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  QrCode,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  PlayCircle,
  ChevronRight,
  Store,
  ArrowRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: () => void;
  onStartDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isDemoMode: propIsDemoMode,
  onToggleDemoMode,
  onStartDemo,
}) => {
  const { currentUser, userProfile, currentBusiness, logout, isDemoMode: authIsDemoMode, toggleDemoMode, isAdmin } = useAuth();
  const isDemoMode = propIsDemoMode !== undefined ? propIsDemoMode : authIsDemoMode;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDemoClick = () => {
    if (onToggleDemoMode) {
      onToggleDemoMode();
    } else if (onStartDemo && !isDemoMode) {
      onStartDemo();
    } else if (toggleDemoMode) {
      toggleDemoMode();
      onNavigate(isDemoMode ? 'landing' : 'demo');
    } else {
      onNavigate('demo');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate('landing');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItem = (view: string, label: string, icon: React.ReactNode) => {
    const isActive = currentView === view;
    return (
      <button
        id={`nav-link-${view}`}
        key={view}
        onClick={() => {
          onNavigate(view);
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
          isActive
            ? 'bg-amber-700 text-white shadow-xs'
            : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-xs'
          : 'bg-white border-b border-stone-200/80'
      }`}
    >
      {/* Demo Mode Notice when active */}
      {isDemoMode && (
        <div className="bg-amber-600 text-white px-4 py-1 text-[11px] font-bold text-center flex items-center justify-center gap-2 border-b border-amber-700 shadow-2xs">
          <span className="uppercase tracking-wider">Demo Mode Active</span>
          <span className="font-medium text-amber-100">• Testing sample Artisan Roast & Bakery feedback flow</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-200 ${scrolled ? 'h-13' : 'h-15'}`}>
          {/* Logo */}
          <div className="flex items-center gap-5">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 text-left group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg p-1"
            >
              <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-amber-400 shadow-xs group-hover:bg-amber-700 group-hover:text-white transition-colors">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-display font-extrabold text-base text-stone-900 tracking-tight flex items-center gap-1">
                  ReviewFlow<span className="text-amber-700 font-black">AI</span>
                </span>
                <span className="block text-[9px] text-stone-600 font-bold -mt-1 tracking-wider uppercase">
                  Storefront Reviews
                </span>
              </div>
            </button>

            {/* Desktop Navigation for Authenticated / Demo */}
            {(currentUser || isDemoMode) && (
              <nav className="hidden md:flex items-center gap-1 ml-2">
                {navItem('dashboard', 'Dashboard', <LayoutDashboard className="w-3.5 h-3.5" />)}
                {navItem('qr', 'QR Codes', <QrCode className="w-3.5 h-3.5" />)}
                {navItem('feedback', 'Customer Feedback', <MessageSquare className="w-3.5 h-3.5" />)}
                {navItem('settings', 'Settings', <Settings className="w-3.5 h-3.5" />)}
                {isAdmin &&
                  navItem('admin', 'Admin Panel', <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />)}
              </nav>
            )}
          </div>

          {/* Right Action Menu */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Demo Mode Toggle Button */}
            <button
              id="nav-demo-btn"
              onClick={handleDemoClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
                isDemoMode
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <PlayCircle className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-600 animate-spin' : 'text-amber-600'}`} />
              <span>{isDemoMode ? 'Exit Demo' : 'Try Live Demo'}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-stone-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-stone-800 leading-tight">
                    {currentBusiness?.name || currentUser.displayName || 'My Business'}
                  </div>
                  <div className="text-[10px] text-stone-600 truncate max-w-[130px] leading-tight">
                    {currentUser.email}
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 font-bold text-[10px] border border-stone-300">
                  {(currentBusiness?.name || currentUser.displayName || 'B').charAt(0).toUpperCase()}
                </div>

                <button
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : isDemoMode ? (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-stone-900 text-white hover:bg-amber-700 shadow-2xs transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  Business Sign In
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-stone-900 text-white hover:bg-amber-700 shadow-2xs transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 flex items-center gap-1.5"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              id="nav-mobile-demo-btn"
              onClick={() => {
                if (onToggleDemoMode) onToggleDemoMode();
                else onNavigate('demo');
              }}
              className="p-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="Toggle Live Demo"
            >
              <PlayCircle className="w-4 h-4" />
            </button>
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-6 space-y-2 overflow-hidden"
          >
            {currentUser || isDemoMode ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-bold text-stone-600 uppercase tracking-wider">
                  Navigation
                </div>
                {navItem('dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
                {navItem('qr', 'QR Codes', <QrCode className="w-4 h-4" />)}
                {navItem('feedback', 'Customer Feedback', <MessageSquare className="w-4 h-4" />)}
                {navItem('settings', 'Settings', <Settings className="w-4 h-4" />)}
                {isAdmin &&
                  navItem('admin', 'Admin Panel', <ShieldAlert className="w-4 h-4 text-amber-600" />)}

                <div className="pt-4 mt-2 border-t border-stone-100 flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-bold text-stone-900">{currentBusiness?.name || 'My Business'}</div>
                    <div className="text-stone-600">{currentUser?.email || 'Demo Mode'}</div>
                  </div>
                  {currentUser ? (
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg cursor-pointer"
                    >
                      Log Out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onNavigate('login');
                        setMobileMenuOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-stone-900 rounded-lg cursor-pointer"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    onNavigate('landing');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 rounded-lg cursor-pointer"
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    handleDemoClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-bold text-amber-900 bg-amber-50 rounded-lg flex items-center justify-between cursor-pointer border border-amber-200"
                >
                  <span>Try Live Demo Café</span>
                  <ChevronRight className="w-4 h-4 text-amber-600" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center px-4 py-2.5 text-sm font-bold text-white bg-stone-900 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Business Sign In
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

