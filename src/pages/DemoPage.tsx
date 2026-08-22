import React, { useState } from 'react';
import { DashboardPage } from './DashboardPage';
import { QRManagementPage } from './QRManagementPage';
import { FeedbackListPage } from './FeedbackListPage';
import { SettingsPage } from './SettingsPage';
import { CustomerFeedbackFlow } from './CustomerFeedbackFlow';
import {
  PlayCircle,
  LayoutDashboard,
  QrCode,
  MessageSquare,
  Sparkles,
  Smartphone,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface DemoPageProps {
  onNavigate: (view: string) => void;
  onExitDemo: () => void;
}

export const DemoPage: React.FC<DemoPageProps> = ({ onNavigate, onExitDemo }) => {
  // Demo internal tab: 'dashboard' | 'qr' | 'feedback' | 'settings' | 'customer-flow'
  const [demoTab, setDemoTab] = useState<string>('dashboard');
  const [customerFlowQRId, setCustomerFlowQRId] = useState<string>('qr_demo_table_1');

  const handleOpenCustomerFlow = (qrId: string) => {
    setCustomerFlowQRId(qrId);
    setDemoTab('customer-flow');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Demo Controls Sub-Bar */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 py-1.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
            <PlayCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
            <span>Interactive Demo: "Artisan Roast & Bakery"</span>
            <span className="text-amber-700/80 font-normal hidden md:inline text-[10px]">
              (Explore pre-populated analytics, QR codes, or test customer scan flow)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex bg-white rounded-lg p-0.5 border border-amber-200 shadow-2xs">
              <button
                onClick={() => setDemoTab('dashboard')}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                  demoTab === 'dashboard' ? 'bg-amber-500 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setDemoTab('qr')}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                  demoTab === 'qr' ? 'bg-amber-500 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                QR Codes
              </button>
              <button
                onClick={() => setDemoTab('feedback')}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                  demoTab === 'feedback' ? 'bg-amber-500 text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Feedback Log
              </button>
              <button
                onClick={() => setDemoTab('customer-flow')}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-colors flex items-center gap-1 ${
                  demoTab === 'customer-flow'
                    ? 'bg-amber-500 text-white'
                    : 'text-amber-900 hover:bg-amber-50'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Simulate Scan</span>
              </button>
            </div>

            <button
              onClick={onExitDemo}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Exit Demo
            </button>
          </div>
        </div>
      </div>

      {/* Tab Render */}
      {demoTab === 'dashboard' && (
        <DashboardPage
          onNavigate={(view) => {
            if (view === 'qr' || view === 'feedback' || view === 'settings') {
              setDemoTab(view);
            } else {
              onNavigate(view);
            }
          }}
          isDemoMode={true}
          onOpenCustomerFlow={handleOpenCustomerFlow}
        />
      )}

      {demoTab === 'qr' && (
        <QRManagementPage
          onNavigate={(view) => {
            if (view === 'dashboard' || view === 'feedback' || view === 'settings') {
              setDemoTab(view);
            } else {
              onNavigate(view);
            }
          }}
          isDemoMode={true}
          onOpenCustomerFlow={handleOpenCustomerFlow}
        />
      )}

      {demoTab === 'feedback' && (
        <FeedbackListPage
          onNavigate={(view) => {
            if (view === 'dashboard' || view === 'qr' || view === 'settings') {
              setDemoTab(view);
            } else {
              onNavigate(view);
            }
          }}
          isDemoMode={true}
        />
      )}

      {demoTab === 'settings' && (
        <SettingsPage
          onNavigate={(view) => {
            if (view === 'dashboard' || view === 'qr' || view === 'feedback') {
              setDemoTab(view);
            } else {
              onNavigate(view);
            }
          }}
          isDemoMode={true}
        />
      )}

      {demoTab === 'customer-flow' && (
        <div className="relative">
          <div className="bg-slate-900 text-white p-3 text-center text-xs flex items-center justify-center gap-3">
            <span>Customer Mobile Flow Simulation</span>
            <button
              onClick={() => setDemoTab('dashboard')}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Demo Dashboard</span>
            </button>
          </div>
          <CustomerFeedbackFlow
            businessSlug="artisan-roast-cafe"
            qrId={customerFlowQRId}
            isDemo={true}
            onFinishedDemo={() => setDemoTab('dashboard')}
          />
        </div>
      )}
    </div>
  );
};
