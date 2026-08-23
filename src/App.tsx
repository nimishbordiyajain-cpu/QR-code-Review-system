import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { QRManagementPage } from './pages/QRManagementPage';
import { FeedbackListPage } from './pages/FeedbackListPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { DemoPage } from './pages/DemoPage';
import { CustomerFeedbackFlow } from './pages/CustomerFeedbackFlow';
import { PrivacyPolicyPage, TermsPage } from './pages/LegalPages';

function AppContent() {
  const { currentUser, currentBusiness, loading, isDemoMode, setIsDemoMode } = useAuth();

  // Current active view: 'landing' | 'login' | 'register' | 'forgot-password' | 'onboarding' | 'dashboard' | 'qr' | 'feedback' | 'settings' | 'admin' | 'demo' | 'customer-flow' | 'privacy' | 'terms'
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

    if (path === '/login') return 'login';
    if (path === '/register' || path === '/signup') return 'register';
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
      register: 'Get Started | ReviewFlow AI',
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
    setCurrentView(view);
    if (params) {
      setCustomerRouteParams(params);
    }

    // Update browser URL cleanly
    let targetPath = '/';
    if (view === 'login') targetPath = '/login';
    else if (view === 'register') targetPath = '/register';
    else if (view === 'forgot-password') targetPath = '/forgot-password';
    else if (view === 'onboarding') targetPath = '/onboarding';
    else if (view === 'dashboard') targetPath = '/dashboard';
    else if (view === 'qr') targetPath = '/dashboard/qr';
    else if (view === 'feedback') targetPath = '/dashboard/feedback';
    else if (view === 'settings') targetPath = '/dashboard/settings';
    else if (view === 'admin') targetPath = '/admin';
    else if (view === 'demo') targetPath = '/demo';
    else if (view === 'privacy') targetPath = '/privacy';
    else if (view === 'terms') targetPath = '/terms';
    else if (view === 'customer-flow' && params) {
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

    const protectedViews = ['dashboard', 'qr', 'feedback', 'settings'];
    if (protectedViews.includes(currentView) && !currentUser && !isDemoMode) {
      navigate('login');
    }

    if (currentUser && !currentBusiness && currentView === 'dashboard') {
      navigate('onboarding');
    }
  }, [currentUser, currentBusiness, currentView, loading, isDemoMode]);

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

        {currentView === 'register' && (
          <RegisterPage onNavigate={navigate} onStartDemo={handleStartDemo} />
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

        {currentView === 'admin' && <AdminPage onNavigate={navigate} />}

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
