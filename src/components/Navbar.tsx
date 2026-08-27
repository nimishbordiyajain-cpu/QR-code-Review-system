import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import {
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
  ArrowRight,
  Sparkles,
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
  const { currentUser, currentBusiness, logout, isDemoMode: authIsDemoMode, toggleDemoMode, isAdmin } = useAuth();
  const isDemoMode = propIsDemoMode !== undefined ? propIsDemoMode : authIsDemoMode;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer ${
          isActive
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs'
          : 'bg-white border-b border-slate-200/80'
      }`}
    >
      {/* Demo Mode Notice when active */}
      {isDemoMode && (
        <div className="bg-slate-900 text-white px-4 py-1 text-[11px] font-semibold text-center flex items-center justify-center gap-2 border-b border-slate-800 shadow-2xs">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="uppercase tracking-wider font-mono text-[10px] text-slate-300">Sandbox Preview Active</span>
          <span className="text-slate-400 font-normal">• Artisan Roast & Bakery live simulation</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-200 ${scrolled ? 'h-14' : 'h-16'}`}>
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('landing')}
              className="flex items-center text-left group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
            >
              <BrandLogo size="md" subtitle="Storefront Intelligence" />
            </button>

            {/* Desktop Navigation for Authenticated / Demo */}
            {(currentUser || isDemoMode) && (
              <nav className="hidden md:flex items-center gap-1 ml-2">
                {navItem('dashboard', 'Dashboard', <LayoutDashboard className="w-3.5 h-3.5" />)}
                {navItem('qr', 'QR Hardware', <QrCode className="w-3.5 h-3.5" />)}
                {navItem('feedback', 'Customer Feedback', <MessageSquare className="w-3.5 h-3.5" />)}
                {navItem('settings', 'Settings', <Settings className="w-3.5 h-3.5" />)}
                {isAdmin &&
                  navItem('admin', 'Admin Console', <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />)}
              </nav>
            )}
          </div>

          {/* Right Action Menu */}
          <div className="hidden md:flex items-center gap-3">
            {/* Demo Mode Toggle Button */}
            <button
              id="nav-demo-btn"
              onClick={handleDemoClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer ${
                isDemoMode
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <PlayCircle className={`w-3.5 h-3.5 ${isDemoMode ? 'text-blue-600' : 'text-slate-500'}`} />
              <span>{isDemoMode ? 'Exit Demo' : 'Live Storefront Simulator'}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentBusiness?.name || currentUser.displayName || 'My Storefront'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate max-w-[130px] leading-tight">
                    {currentUser.email}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs border border-slate-800">
                  {(currentBusiness?.name || currentUser.displayName || 'B').charAt(0).toUpperCase()}
                </div>

                <button
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isDemoMode ? (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-2xs transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Operator Sign In
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="nav-getstarted-btn"
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-blue-600 shadow-xs transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center gap-1.5"
                >
                  <span>Start Free Trial</span>
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
              className="p-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Toggle Live Demo"
            >
              <PlayCircle className="w-4 h-4" />
            </button>
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
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
            className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 overflow-hidden shadow-lg"
          >
            {currentUser || isDemoMode ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Navigation
                </div>
                {navItem('dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
                {navItem('qr', 'QR Hardware', <QrCode className="w-4 h-4" />)}
                {navItem('feedback', 'Customer Feedback', <MessageSquare className="w-4 h-4" />)}
                {navItem('settings', 'Settings', <Settings className="w-4 h-4" />)}
                {isAdmin &&
                  navItem('admin', 'Admin Console', <ShieldAlert className="w-4 h-4 text-blue-600" />)}

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">{currentBusiness?.name || 'My Storefront'}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{currentUser?.email || 'Sandbox Mode'}</div>
                  </div>
                  {currentUser ? (
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg cursor-pointer"
                    >
                      Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onNavigate('login');
                        setMobileMenuOpen(false);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
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
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Platform Overview
                </button>
                <button
                  onClick={() => {
                    handleDemoClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg flex items-center justify-between cursor-pointer border border-blue-100"
                >
                  <span>Live Storefront Simulator</span>
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-blue-600 rounded-lg shadow-xs cursor-pointer"
                >
                  Operator Sign In
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
