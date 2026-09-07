import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  UserCheck,
  Building2,
  KeyRound,
  PowerOff,
  Inbox,
  CreditCard,
  Trash2,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';

interface AdminRightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminRightsModal: React.FC<AdminRightsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [allowlist, setAllowlist] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchAdmins = async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch('/api/admin?action=get-admins', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setAllowlist(data.allowlist || []);
            setAdminUsers(data.adminUsers || []);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchAdmins();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const adminRights = [
    {
      title: 'Storefront Client Provisioning',
      description: 'Create new business accounts, assign custom URL slugs, and auto-generate client credentials.',
      icon: <Building2 className="w-4 h-4 text-indigo-600" />,
      tag: 'Full Write',
    },
    {
      title: 'Credential Governance & Password Reset',
      description: 'Instantly generate secure passwords or direct reset links for any client storefront.',
      icon: <KeyRound className="w-4 h-4 text-amber-600" />,
      tag: 'Security Master',
    },
    {
      title: 'Account Killswitch & Reactivation',
      description: 'Instantly disable or restore access for any business storefront upon non-payment or request.',
      icon: <PowerOff className="w-4 h-4 text-rose-600" />,
      tag: 'Access Control',
    },
    {
      title: 'Inbound Enquiry Lead Conversion',
      description: 'Review prospective client submissions and convert them directly into active accounts.',
      icon: <Inbox className="w-4 h-4 text-blue-600" />,
      tag: 'Pipeline Management',
    },
    {
      title: 'Subscription & Renewal Tracking',
      description: 'Manage subscription renewal dates, overdue alerts, and manual fee collection ledgers.',
      icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
      tag: 'Billing Oversight',
    },
    {
      title: 'AI Usage & Telemetry Oversight',
      description: 'Audit real-time AI review generation quotas and daily storefront scan volume.',
      icon: <Sparkles className="w-4 h-4 text-purple-600" />,
      tag: 'Usage Monitor',
    },
    {
      title: 'Global Feedback & Sentiment Audit',
      description: 'Query and review all customer sentiment scores, ratings, and Google review click events.',
      icon: <BarChart3 className="w-4 h-4 text-cyan-600" />,
      tag: 'Global Read',
    },
    {
      title: 'Cascade Account Deprovisioning',
      description: 'Permanently remove businesses, associated QR codes, and feedback history when requested.',
      icon: <Trash2 className="w-4 h-4 text-red-600" />,
      tag: 'Admin Root',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                Super Administrator Privileges & Rights
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Active
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Authenticated Admin: <span className="text-indigo-300">{currentUser?.email || 'Super Administrator'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900">Master Gate Authorization Granted</div>
              <div className="text-slate-600 mt-0.5 leading-relaxed">
                Your account is verified under Firebase Custom Claims and the platform security allowlist. You have full root rights to manage all storefronts, leads, credentials, and telemetry.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {adminRights.map((right, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      {right.icon}
                      <span>{right.title}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {right.description}
                  </p>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase">
                    {right.tag}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    Authorized
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <h3 className="font-bold text-slate-900 mb-2">Active Administrators</h3>
            <div className="text-slate-600 mb-3 leading-relaxed">
              Below are the users currently carrying the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">admin: true</code> custom claim and the environment allowlist.
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="mb-2">
                <span className="font-semibold text-slate-700">Environment Allowlist:</span>
                <ul className="list-disc pl-4 mt-1">
                  {allowlist.length > 0 ? allowlist.map((email) => (
                    <li key={email} className="text-indigo-600 font-mono">{email}</li>
                  )) : <li className="text-slate-500 italic">None configured</li>}
                </ul>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Provisioned Admins (Firestore):</span>
                <ul className="list-disc pl-4 mt-1">
                  {adminUsers.length > 0 ? adminUsers.map((u) => (
                    <li key={u.id} className="text-slate-800 font-mono">
                      {u.email} <span className="text-slate-400 text-[10px]">({u.displayName || 'No name'})</span>
                    </li>
                  )) : <li className="text-slate-500 italic">No admin users found</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Security Rule Level: <strong className="text-slate-700">Root Super-Admin</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
