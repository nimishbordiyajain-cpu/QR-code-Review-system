import React, { useState } from 'react';
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
  ExternalLink,
  ChevronRight,
  Store,
} from 'lucide-react';

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
  const { currentUser, userProfile, currentBusiness, logout, isDemoMode: authIsDemoMode, toggleDemoMode } = useAuth();
  const isDemoMode = propIsDemoMode !== undefined ? propIsDemoMode : authIsDemoMode;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          isActive
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Demo Mode Notice when active */}
      {isDemoMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1 text-[11px] font-bold text-center flex items-center justify-center gap-2 border-b border-amber-600">
          <span className="uppercase tracking-wider">Demo Mode Active</span>
          <span className="font-medium text-slate-900">• Testing sample Café feedback and QR generation</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-5">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 text-left group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-1">
                  ReviewFlow<span className="text-indigo-600 font-black">AI</span>
                </span>
                <span className="block text-[9px] text-slate-400 font-bold -mt-1 tracking-wider uppercase">
                  Authentic Reviews
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
                {userProfile?.role === 'admin' &&
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isDemoMode
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <PlayCircle className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-600 animate-spin' : 'text-slate-500'}`} />
              <span>{isDemoMode ? 'Exit Demo' : 'Try Live Demo'}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentBusiness?.name || currentUser.displayName || 'My Business'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[130px] leading-tight">
                    {currentUser.email}
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-[10px] border border-slate-300">
                  {(currentBusiness?.name || currentUser.displayName || 'B').charAt(0).toUpperCase()}
                </div>

                <button
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : isDemoMode ? (
              <div className="flex items-center gap-2">
                <button
                  id="nav-register-btn"
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs transition-all"
                >
                  Create Free Account
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="nav-get-started-btn"
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs transition-all"
                >
                  Get Started Free
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
              className="p-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold"
            >
              <PlayCircle className="w-4 h-4" />
            </button>
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2">
          {currentUser || isDemoMode ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Menu
              </div>
              {navItem('dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
              {navItem('qr', 'QR Codes', <QrCode className="w-4 h-4" />)}
              {navItem('feedback', 'Customer Feedback', <MessageSquare className="w-4 h-4" />)}
              {navItem('settings', 'Settings', <Settings className="w-4 h-4" />)}
              {userProfile?.role === 'admin' &&
                navItem('admin', 'Admin Panel', <ShieldAlert className="w-4 h-4 text-amber-600" />)}

              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs">
                  <div className="font-bold text-slate-900">{currentBusiness?.name || 'My Business'}</div>
                  <div className="text-slate-500">{currentUser?.email || 'Demo Mode'}</div>
                </div>
                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg"
                  >
                    Log Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onNavigate('register');
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
                  >
                    Sign Up Free
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
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                Home
              </button>
              <button
                onClick={() => {
                  handleDemoClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-amber-800 bg-amber-50 rounded-lg flex items-center justify-between"
              >
                <span>Try Live Demo Café</span>
                <ChevronRight className="w-4 h-4 text-amber-600" />
              </button>
              <button
                onClick={() => {
                  onNavigate('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  onNavigate('register');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center px-4 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl shadow-sm"
              >
                Get Started Free
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
