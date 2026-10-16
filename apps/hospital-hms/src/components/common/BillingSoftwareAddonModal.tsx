import React, { useState } from 'react';
import { Check, ArrowUpRight, Zap } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useNotification } from '../../context/NotificationContext';

interface BillingSoftwareAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillingSoftwareAddonModal: React.FC<BillingSoftwareAddonModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useNotification();
  const [addonDuration, setAddonDuration] = useState<'3_months' | '6_months' | '1_year'>('1_year');

  const handleOpenBillingSystem = (planName?: string) => {
    showToast('Redirecting to Billing System', `Opening billing software portal for ${planName || 'Add-On'}...`);
    window.open('https://billing-system-1-gyvd.onrender.com/', '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Billing Software Add-On Subscription Plans"
      subtitle="Integrate our intelligent POS & billing system software with your hospital suite."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/30">
              Special Add-On Integration
            </span>
            <h3 className="text-base font-bold mt-1">Standalone Billing Software Suite</h3>
            <p className="text-xs text-slate-300">Choose a billing tier and connect directly to our billing portal.</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenBillingSystem('Billing System')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold shrink-0"
            leftIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            Open Billing Portal
          </Button>
        </div>

        {/* Pricing Duration Selector Pills */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setAddonDuration('3_months')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                addonDuration === '3_months' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3 MONTHS
            </button>
            <button
              type="button"
              onClick={() => setAddonDuration('6_months')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                addonDuration === '6_months' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 MONTHS
            </button>
            <button
              type="button"
              onClick={() => setAddonDuration('1_year')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                addonDuration === '1_year' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1 YEAR
            </button>
          </div>
        </div>

        {/* Addon Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Basic Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Basic</h4>
              <div className="flex items-center gap-1 mb-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black text-sm rounded-lg border border-indigo-100">
                  {addonDuration === '3_months' && '₹1,199.00'}
                  {addonDuration === '6_months' && '₹2,199.00'}
                  {addonDuration === '1_year' && '₹3,999.00'}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  /{addonDuration.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-snug">
                Essential features for small shops. Includes core billing, simple inventory, and basic dashboard analytics.
              </p>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Cashier Limit</span>
                  <span className="font-bold text-slate-900">2</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Festival Offers</span>
                  <span className="text-slate-300 font-mono">✕</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Batch Tracking</span>
                  <span className="text-slate-300 font-mono">✕</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Advanced Reports</span>
                  <span className="text-slate-300 font-mono">✕</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Smart Insights (AI)</span>
                  <span className="text-slate-300 font-mono">✕</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Demand Forecasting</span>
                  <span className="text-slate-300 font-mono">✕</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Dynamic Pricing</span>
                  <span className="text-slate-300 font-mono">✕</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="w-full font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                onClick={() => handleOpenBillingSystem('Basic Billing Add-On')}
              >
                OK with Add On
              </Button>
            </div>
          </div>

          {/* Standard Card */}
          <div className="rounded-xl border border-indigo-200 bg-slate-50/50 p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
              Popular Add-On
            </span>
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Standard</h4>
              <div className="flex items-center gap-1 mb-3">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-black text-sm rounded-lg border border-indigo-200">
                  {addonDuration === '3_months' && '₹2,699.00'}
                  {addonDuration === '6_months' && '₹4,999.00'}
                  {addonDuration === '1_year' && '₹8,999.00'}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  /{addonDuration.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-snug">
                Perfect for growing businesses. Adds supplier management, purchase orders, batch & expiry tracking, festival offers, and advanced reports.
              </p>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Cashier Limit</span>
                  <span className="font-bold text-slate-900">10</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span>Festival Offers</span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span>Batch Tracking</span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span>Advanced Reports</span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Smart Insights (AI)</span>
                  <span className="text-slate-300 font-mono">✕</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Demand Forecasting</span>
                  <span className="text-slate-300 font-mono">✕</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Dynamic Pricing</span>
                  <span className="text-slate-300 font-mono">✕</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200">
              <Button
                variant="primary"
                size="sm"
                className="w-full font-bold bg-indigo-600 hover:bg-indigo-700"
                onClick={() => handleOpenBillingSystem('Standard Billing Add-On')}
              >
                OK with Add On
              </Button>
            </div>
          </div>

          {/* Premium Card */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/20 p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Premium</h4>
              <div className="flex items-center gap-1 mb-3">
                <span className="px-3 py-1 bg-purple-100 text-purple-900 font-black text-sm rounded-lg border border-purple-200">
                  {addonDuration === '3_months' && '₹5,199.00'}
                  {addonDuration === '6_months' && '₹9,999.00'}
                  {addonDuration === '1_year' && '₹17,999.00'}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  /{addonDuration.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-snug">
                The complete intelligent store solution. Unlocks all features including Smart AI Insights, Demand Forecasting, Dynamic Auto-Pricing, and unlimited cashier accounts.
              </p>

              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Cashier Limit</span>
                  <span className="font-bold text-purple-700 uppercase font-mono">Unlimited</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span>Festival Offers</span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span>Batch Tracking</span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span>Advanced Reports</span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span>Smart Insights (AI)</span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span>Demand Forecasting</span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-medium">
                  <span>Dynamic Pricing</span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-purple-100">
              <Button
                variant="primary"
                size="sm"
                className="w-full font-bold bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => handleOpenBillingSystem('Premium Billing Add-On')}
              >
                OK with Add On
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Need custom enterprise billing integration? Direct URL:{' '}
            <a
              href="https://billing-system-1-gyvd.onrender.com/"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 font-mono underline"
            >
              billing-system-1-gyvd.onrender.com
            </a>
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Window
          </Button>
        </div>
      </div>
    </Modal>
  );
};
