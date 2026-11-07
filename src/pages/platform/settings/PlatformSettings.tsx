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
  Radio,
  AlertTriangle,
  Megaphone,
  Wrench,
  ShieldAlert,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { PlatformSettings as PlatformSettingsType } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';

export const PlatformSettings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isSuperAdmin = user?.role === 'super_admin';
  const [settings, setSettings] = useState<PlatformSettingsType>(() => MockStorage.getPlatformSettings());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Permission Denied', 'Super Admin Manager is restricted from changing platform settings. Only Super Administrator can modify platform settings.', 'error');
      return;
    }
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

      {!isSuperAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              View-Only Mode • Super Admin Manager Restricted
            </h4>
            <p className="text-xs text-amber-700">
              You are signed in as Super Admin Manager. You have permission to inspect global platform configurations, but changing platform settings is restricted strictly to Super Administrator.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Branding & Platform Identity */}
        <Card>
          <CardHeader
            title="Platform Branding & General Information"
            subtitle="Master white-label platform branding for all healthcare facility tenants"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Platform Brand Name"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                disabled={!isSuperAdmin}
                required
              />
              <Input
                label="Master Support Contact Email"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                disabled={!isSuperAdmin}
                required
              />
            </div>

            <div>
              <Select
                label="Default Subscription Tier on Signup"
                value={settings.defaultPlanTier || 'trial'}
                onChange={(e) => setSettings({ ...settings, defaultPlanTier: e.target.value as any })}
                disabled={!isSuperAdmin}
              >
                <option value="trial">Free Trial Plan (Trial)</option>
                <option value="basic">Starter Clinic Plan</option>
                <option value="standard">Professional Hospital Plan</option>
                <option value="enterprise">Enterprise Health Network</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Global System Broadcast & Tenant Maintenance Center */}
        <Card>
          <CardHeader
            title="Global System Broadcast & Tenant Maintenance Center"
            subtitle="Broadcast real-time operational alerts across all tenant portals and manage system availability"
          />
          <CardContent className="space-y-4">
            {/* Maintenance Mode Toggle */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Platform Maintenance Mode</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    When active, hospital staff and patient logins display a scheduled maintenance screen while preserving Super Admin administrative access.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                disabled={!isSuperAdmin}
                className="w-5 h-5 text-[#FF3030] rounded focus:ring-[#FF3030] cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Broadcast Banner Controls */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#FF3030]" />
                  <span className="text-xs font-bold text-slate-900">Global Tenant Broadcast Announcement</span>
                </div>
                <label className={`flex items-center gap-2 text-xs font-semibold text-slate-700 ${!isSuperAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={settings.broadcastBannerActive || false}
                    onChange={(e) => setSettings({ ...settings, broadcastBannerActive: e.target.checked })}
                    disabled={!isSuperAdmin}
                    className="w-4 h-4 text-[#FF3030] rounded focus:ring-[#FF3030] cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span>Display Banner</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="sm:col-span-2">
                  <Input
                    label="Announcement Message"
                    value={settings.broadcastBannerText || ''}
                    onChange={(e) => setSettings({ ...settings, broadcastBannerText: e.target.value })}
                    placeholder="e.g. Scheduled system upgrade tonight from 2:00 AM to 3:00 AM IST."
                    disabled={!isSuperAdmin}
                  />
                </div>
                <div>
                  <Select
                    label="Alert Priority Level"
                    value={settings.broadcastBannerLevel || 'info'}
                    onChange={(e) => setSettings({ ...settings, broadcastBannerLevel: e.target.value as any })}
                    disabled={!isSuperAdmin}
                  >
                    <option value="info">🔵 Information (Blue)</option>
                    <option value="warning">🟡 Warning (Amber)</option>
                    <option value="critical">🔴 Critical Alert (Red)</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Multi-Tenant Database Sync Policy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Select
                  label="Multi-Tenant Database Sync Engine"
                  value={settings.databaseSyncFrequency || 'realtime'}
                  onChange={(e) => setSettings({ ...settings, databaseSyncFrequency: e.target.value as any })}
                  disabled={!isSuperAdmin}
                >
                  <option value="realtime">Real-Time Synchronous MySQL (Strict ACID)</option>
                  <option value="15min">Periodic Batch Sync (Every 15 Minutes)</option>
                  <option value="hourly">Hourly Audit Sync</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Database Sync Status</label>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    MySQL 8.0 Cluster
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    Connected (crm_hms_db)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Licensing & Add-On Modules Control */}
        <Card>
          <CardHeader
            title="Add-On Modules & Hospital Feature Governance"
            subtitle="Control which external integration modules are visible and accessible to Hospital Admins"
          />
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-purple-600 text-white rounded-xl font-bold text-xs shrink-0">
                  POS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Billing Software Add-On Integration Module</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    When switched <strong className="text-purple-700">ON</strong>, Hospital Admins will see the "+ Add On Billing Software" button and pricing modal. When turned <strong className="text-rose-600">OFF</strong>, the add-on module is completely hidden across all Hospital Admin portals.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-bold uppercase font-mono px-2.5 py-1 rounded-md ${
                  settings.enableBillingAddonModule !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {settings.enableBillingAddonModule !== false ? 'Active (ON)' : 'Disabled (OFF)'}
                </span>
                <input
                  type="checkbox"
                  checked={settings.enableBillingAddonModule !== false}
                  onChange={(e) => setSettings({ ...settings, enableBillingAddonModule: e.target.checked })}
                  disabled={!isSuperAdmin}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          {isSuperAdmin ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Changing Platform Settings Restricted to Super Administrator</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
