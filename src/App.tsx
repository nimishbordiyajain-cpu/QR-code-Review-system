import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { QRManagementPage } from './pages/QRManagementPage';
import { FeedbackListPage } from './pages/FeedbackListPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { RequireAdmin } from './components/RequireAdmin';
import { DemoPage } from './pages/DemoPage';
import { CustomerFeedbackFlow } from './pages/CustomerFeedbackFlow';
import { EnquiryPage } from './pages/EnquiryPage';
import { PrivacyPolicyPage, TermsPage } from './pages/LegalPages';
import { AlertTriangle, LogOut, Mail } from 'lucide-react';

function AppContent() {
  const { currentUser, currentBusiness, isAdmin, logout, loading, isDemoMode, setIsDemoMode } = useAuth();

  // Current active view: 'landing' | 'login' | 'forgot-password' | 'onboarding' | 'dashboard' | 'qr' | 'feedback' | 'settings' | 'admin' | 'demo' | 'customer-flow' | 'privacy' | 'terms'
  const [currentView, setCurrentView] = useState<string>('landing');

  // Customer Flow parameters
  const [customerRouteParams, setCustomerRouteParams] = useState<{
    businessSlug?: string;
    qrId?: string;
  }>({});

  // Helper to parse path from URL
  const parseCurrentPath = () => {
    const path = window.location.pathname;

    // Check customer QR flow routes: /r/:slug/:qrId or /r/:slug or /review/:slug
    if (path.startsWith('/r/') || path.startsWith('/review/')) {
      const segments = path.split('/').filter(Boolean);
      const slug = segments[1];
      const qrId = segments[2];
      setCustomerRouteParams({ businessSlug: slug, qrId: qrId });
      return 'customer-flow';
    }

    if (path === '/login' || path === '/register' || path === '/signup') return 'login';
    if (path === '/enquire' || path === '/enquiry') return 'enquiry';
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/onboarding') return 'onboarding';
    if (path === '/dashboard' || path === '/app') return 'dashboard';
    if (path === '/dashboard/qr' || path === '/qr') return 'qr';
    if (path === '/dashboard/feedback' || path === '/feedback') return 'feedback';
    if (path === '/dashboard/settings' || path === '/settings') return 'settings';
    if (path === '/admin') return 'admin';
    if (path === '/demo') return 'demo';
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';

    return 'landing';
  };

  useEffect(() => {
    const initialView = parseCurrentPath();
    setCurrentView(initialView);

    const handlePopState = () => {
      setCurrentView(parseCurrentPath());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update dynamic document title with app name and view
  useEffect(() => {
    const titles: Record<string, string> = {
      landing: 'ReviewFlow AI — Authentic Reviews & Smart Feedback Platform',
      dashboard: 'Dashboard | ReviewFlow AI',
      qr: 'QR Code Management | ReviewFlow AI',
      feedback: 'Customer Feedback & Sentiment | ReviewFlow AI',
      settings: 'Business Settings | ReviewFlow AI',
      login: 'Sign In | ReviewFlow AI',
      enquiry: 'Request Storefront Access | ReviewFlow AI',
      'forgot-password': 'Reset Password | ReviewFlow AI',
      onboarding: 'Setup Your Business | ReviewFlow AI',
      admin: 'Admin Overview | ReviewFlow AI',
      demo: 'Interactive Live Demo | ReviewFlow AI',
      privacy: 'Privacy Policy | ReviewFlow AI',
      terms: 'Terms of Service | ReviewFlow AI',
      'customer-flow': 'Customer Feedback & Review | ReviewFlow AI',
    };

    document.title = titles[currentView] || 'ReviewFlow AI — Authentic Reviews & Smart Feedback Platform';
  }, [currentView]);

  const navigate = (view: string, params?: { businessSlug?: string; qrId?: string }) => {
    // Intercept any legacy register navigations to login
    const targetView = view === 'register' ? 'login' : view;
    setCurrentView(targetView);
    if (params) {
      setCustomerRouteParams(params);
    }

    // Update browser URL cleanly
    let targetPath = '/';
    if (targetView === 'login') targetPath = '/login';
    else if (targetView === 'enquiry') targetPath = '/enquire';
    else if (targetView === 'forgot-password') targetPath = '/forgot-password';
    else if (targetView === 'onboarding') targetPath = '/onboarding';
    else if (targetView === 'dashboard') targetPath = '/dashboard';
    else if (targetView === 'qr') targetPath = '/dashboard/qr';
    else if (targetView === 'feedback') targetPath = '/dashboard/feedback';
    else if (targetView === 'settings') targetPath = '/dashboard/settings';
    else if (targetView === 'admin') targetPath = '/admin';
    else if (targetView === 'demo') targetPath = '/demo';
    else if (targetView === 'privacy') targetPath = '/privacy';
    else if (targetView === 'terms') targetPath = '/terms';
    else if (targetView === 'customer-flow' && params) {
      targetPath = `/r/${params.businessSlug || 'demo'}${params.qrId ? `/${params.qrId}` : ''}`;
    }

    try {
      window.history.pushState({}, '', targetPath);
    } catch (e) {
      // In some sandbox environments pushState might throw
    }
    window.scrollTo(0, 0);
  };

  const handleStartDemo = () => {
    setIsDemoMode(true);
    navigate('demo');
  };

  const handleExitDemo = () => {
    setIsDemoMode(false);
    navigate('landing');
  };

  const handleOpenCustomerFlow = (qrId: string) => {
    const slug = currentBusiness?.slug || 'artisan-roast-cafe';
    navigate('customer-flow', { businessSlug: slug, qrId });
  };

  // Auth Protection Logic
  useEffect(() => {
    if (loading) return;

    const protectedViews = ['dashboard', 'qr', 'feedback', 'settings', 'admin'];
    if (protectedViews.includes(currentView) && !currentUser && !isDemoMode) {
      navigate('login');
      return;
    }

    // Explicit check: Non-admin logged in users cannot access admin console
    if (currentView === 'admin' && currentUser && !isAdmin && !isDemoMode) {
      navigate('dashboard');
      return;
    }

    if (currentUser && !currentBusiness && currentView === 'dashboard' && !isAdmin) {
      navigate('onboarding');
    }
  }, [currentUser, currentBusiness, currentView, loading, isDemoMode, isAdmin]);

  // Loading spinner for auth init
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
          Initializing ReviewFlow...
        </span>
      </div>
    );
  }

  // Account Disabled Guard Screen (for inactive businesses)
  if (
    currentUser &&
    !isDemoMode &&
    !isAdmin &&
    currentBusiness?.status === 'disabled' &&
    ['dashboard', 'qr', 'feedback', 'settings', 'onboarding'].includes(currentView)
  ) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-200 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Account Inactive</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              The business account for <strong className="text-slate-800">{currentBusiness?.name || 'your business'}</strong> is currently deactivated or pending activation.
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 border border-slate-200 text-left space-y-1">
            <div className="font-bold text-slate-800">Need help reactivating?</div>
            <div>Please contact your platform administrator or account representative to restore access.</div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={async () => {
                await logout();
                navigate('login');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pure Customer Mobile View (no business navbar/footer)
  if (currentView === 'customer-flow') {
    return (
      <CustomerFeedbackFlow
        businessSlug={customerRouteParams.businessSlug}
        qrId={customerRouteParams.qrId}
        isDemo={isDemoMode || customerRouteParams.businessSlug === 'demo' || customerRouteParams.businessSlug === 'artisan-roast-cafe'}
        onFinishedDemo={() => navigate('dashboard')}
      />
    );
  }

  // Interactive Demo container
  if (currentView === 'demo') {
    return <DemoPage onNavigate={navigate} onExitDemo={handleExitDemo} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Navbar currentView={currentView} onNavigate={navigate} onStartDemo={handleStartDemo} />

      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onNavigate={navigate}
            onStartDemo={handleStartDemo}
            onOpenCustomerFlow={handleOpenCustomerFlow}
          />
        )}

        {currentView === 'login' && (
          <LoginPage onNavigate={navigate} onStartDemo={handleStartDemo} />
        )}

        {currentView === 'enquiry' && (
          <EnquiryPage onNavigate={navigate} onStartDemo={handleStartDemo} />
        )}

        {currentView === 'forgot-password' && <ForgotPasswordPage onNavigate={navigate} />}

        {currentView === 'onboarding' && <OnboardingPage onNavigate={navigate} />}

        {currentView === 'dashboard' && (
          <DashboardPage
            onNavigate={navigate}
            isDemoMode={isDemoMode}
            onOpenCustomerFlow={handleOpenCustomerFlow}
          />
        )}

        {currentView === 'qr' && (
          <QRManagementPage
            onNavigate={navigate}
            isDemoMode={isDemoMode}
            onOpenCustomerFlow={handleOpenCustomerFlow}
          />
        )}

        {currentView === 'feedback' && (
          <FeedbackListPage onNavigate={navigate} isDemoMode={isDemoMode} />
        )}

        {currentView === 'settings' && (
          <SettingsPage onNavigate={navigate} isDemoMode={isDemoMode} />
        )}

        {currentView === 'admin' && (
          <RequireAdmin onNavigate={navigate}>
            <AdminPage onNavigate={navigate} />
          </RequireAdmin>
        )}

        {currentView === 'privacy' && <PrivacyPolicyPage onNavigate={navigate} />}

        {currentView === 'terms' && <TermsPage onNavigate={navigate} />}
      </main>

      <Footer onNavigate={navigate} onStartDemo={handleStartDemo} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
