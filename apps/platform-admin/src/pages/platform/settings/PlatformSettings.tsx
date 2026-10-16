import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Bell,
  Save,
  Lock,
  Globe,
  Database,
  RefreshCw,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { PlatformSettings as PlatformSettingsType } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useNotification } from '../../../context/NotificationContext';

export const PlatformSettings: React.FC = () => {
  const { showToast } = useNotification();
  const [settings, setSettings] = useState<PlatformSettingsType>(() => MockStorage.getPlatformSettings());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    MockStorage.savePlatformSettings(settings);
    showToast('Settings Saved', 'Global platform configuration updated.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Platform Global Settings & Security Governance"
        subtitle="Configure SaaS platform identity, multi-tenant onboarding parameters, security policies, and session limits."
        breadcrumbs={[{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Platform Settings' }]}
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Branding & Platform Identity */}
        <Card>
          <CardHeader
            title="Platform Branding & General Information"
            subtitle="Master white-label platform branding for all tenants"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Platform Brand Name"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                required
              />
              <Input
                label="Master Support Contact Email"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Default Subscription Tier on Signup"
                value={settings.defaultPlanTier}
                onChange={(e) => setSettings({ ...settings, defaultPlanTier: e.target.value as any })}
              >
                <option value="basic">Starter Clinic</option>
                <option value="standard">Professional Hospital (Recommended)</option>
                <option value="enterprise">Enterprise Health Network</option>
              </Select>

              <Input
                label="Trial Evaluation Window (Days)"
                type="number"
                value={settings.allowTrialDays}
                onChange={(e) => setSettings({ ...settings, allowTrialDays: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security & Authentication Policies */}
        <Card>
          <CardHeader
            title="Security, Authentication & Session Policies"
            subtitle="Enforce HIPAA compliance safeguards across all connected hospital facilities"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Inactivity Session Timeout (Minutes)"
                type="number"
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                helperText="Standard HIPAA threshold is 60 minutes"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Two-Factor Authentication (2FA)</label>
                <div className="p-2.5 rounded-lg border border-slate-300 bg-white flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-medium">Enforce 2FA for all Hospital Admins & Doctors</span>
                  <input
                    type="checkbox"
                    checked={settings.enforce2FA}
                    onChange={(e) => setSettings({ ...settings, enforce2FA: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Public Self-Registration Gateway</p>
                <p className="text-[11px] text-slate-500">Allow new medical facilities to submit self-registration applications</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableMultiTenantSelfRegistration}
                onChange={(e) => setSettings({ ...settings, enableMultiTenantSelfRegistration: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Add-On Modules & Feature Governance */}
        <Card>
          <CardHeader
            title="Add-On Modules & Hospital Feature Governance"
            subtitle="Control feature availability and third-party software add-on integrations across all hospital tenants"
          />
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Billing Software Add-On Module Availability</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    settings.enableBillingAddonModule !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {settings.enableBillingAddonModule !== false ? 'Active for Hospital Admins' : 'Disabled / Hidden'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  When enabled, Hospital Admins will see the <strong>"+ Add On Billing Software"</strong> button and 50% discount subscription cards in their workspace header, billing section, settings, and subscription upgrade dialog.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={settings.enableBillingAddonModule !== false}
                  onChange={(e) => setSettings({ ...settings, enableBillingAddonModule: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setSettings(MockStorage.getPlatformSettings())}
          >
            Reset Changes
          </Button>
          <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
            Save Platform Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
