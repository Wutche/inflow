"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  User,
  Building2,
  Bell,
  Shield,
  Camera,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "account" | "business" | "notifications" | "security";

interface SettingsProps {
  handleSave: () => void;
  isSaving: boolean;
}

interface NotificationToggleProps {
  title: string;
  desc: string;
  defaultChecked: boolean;
}

interface WalletCardProps {
  name: string;
  address: string;
  isPrimary: boolean;
  icon: string;
}

interface PlusIconProps {
  size: number;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 2000);
  };

  const tabs = [
    { id: "account", label: "My Account", icon: User },
    { id: "business", label: "Business Profile", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security & Wallets", icon: Shield },
  ];

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage your profile, business, and platform preferences"
    >
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-brand-orange shadow-sm border border-border-subtle"
                  : "text-muted hover:bg-white/50 hover:text-foreground"
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-orange"
                />
              )}
            </button>
          ))}

          <div className="mt-8 pt-8 border-t border-border-subtle p-5 bg-brand-orange/5 rounded-3xl">
            <div className="flex items-center gap-2 text-brand-orange mb-2">
              <Shield size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Trust & Safety
              </span>
            </div>
            <p className="text-[10px] text-muted font-bold leading-relaxed uppercase tracking-tight">
              Your data is encrypted and secured on the Bitcoin blockchain via
              PoX.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 bg-white border border-border-subtle rounded-[40px] shadow-sm relative overflow-hidden">
          <div className="p-10">
            <AnimatePresence mode="wait">
              {activeTab === "account" && (
                <AccountSettings handleSave={handleSave} isSaving={isSaving} />
              )}
              {activeTab === "business" && (
                <BusinessSettings handleSave={handleSave} isSaving={isSaving} />
              )}
              {activeTab === "notifications" && (
                <NotificationSettings
                  handleSave={handleSave}
                  isSaving={isSaving}
                />
              )}
              {activeTab === "security" && (
                <SecuritySettings handleSave={handleSave} isSaving={isSaving} />
              )}
            </AnimatePresence>
          </div>

          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/3 rounded-full blur-[100px] -z-10" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function AccountSettings({ handleSave, isSaving }: SettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between border-b border-gray-50 pb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight">My Account</h2>
          <p className="text-muted text-xs font-medium mt-1">
            Update your personal information and profile picture.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-black/10"
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>

      <div className="flex items-start gap-10">
        <div className="relative group">
          <div className="w-32 h-32 rounded-[40px] bg-sidebar border-2 border-dashed border-border-subtle flex items-center justify-center text-muted overflow-hidden relative">
            <User size={48} className="opacity-20" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
              <Camera size={24} />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg border-2 border-white">
            <PlusIcon size={16} />
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Full Name
            </label>
            <input
              type="text"
              defaultValue="Alex Rivera"
              className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Email Address
            </label>
            <input
              type="email"
              defaultValue="alex@inflow.finance"
              className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Bio / Professional Summary
            </label>
            <textarea
              rows={3}
              defaultValue="Blockchain developer focused on cross-chain payment infrastructures."
              className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all resize-none"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BusinessSettings({ handleSave, isSaving }: SettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between border-b border-gray-50 pb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Business Profile</h2>
          <p className="text-muted text-xs font-medium mt-1">
            Information displayed on your invoices.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-black/10"
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <span>Save Details</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Legal Entity Name
            </label>
            <input
              type="text"
              defaultValue="Inflow Labs Inc."
              className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Tax / VAT ID
            </label>
            <input
              type="text"
              defaultValue="US-9821-X01"
              className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
            />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Country / Region
            </label>
            <div className="relative">
              <select className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all appearance-none cursor-pointer">
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Singapore</option>
              </select>
              <ChevronRight
                size={16}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted rotate-90"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Invoicing Currency
            </label>
            <div className="relative">
              <select className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all appearance-none cursor-pointer">
                <option>USD (United States Dollar)</option>
                <option>EUR (Euro)</option>
                <option>STX (Stacks)</option>
              </select>
              <ChevronRight
                size={16}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted rotate-90"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NotificationSettings({ handleSave, isSaving }: SettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between border-b border-gray-50 pb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted text-xs font-medium mt-1">
            Control how you receive alerts and updates.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-black/10"
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <span>Update Alerts</span>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <NotificationToggle
          title="Invoice Paid"
          desc="Get notified as soon as a client pays an invoice."
          defaultChecked={true}
        />
        <NotificationToggle
          title="Overdue Reminders"
          desc="Weekly alerts for any outstanding or late payments."
          defaultChecked={true}
        />
        <NotificationToggle
          title="Bridge Completions"
          desc="Notifications for confirmed cross-chain transfers."
          defaultChecked={false}
        />
        <NotificationToggle
          title="Security Alerts"
          desc="Critical alerts regarding wallet connections and sessions."
          defaultChecked={true}
        />
      </div>
    </motion.div>
  );
}

function SecuritySettings({ handleSave, isSaving }: SettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between border-b border-gray-50 pb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Security & Wallets
          </h2>
          <p className="text-muted text-xs font-medium mt-1">
            Manage your connected wallets and authentication.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-black/10"
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <span>Save Settings</span>
          )}
        </button>
      </div>

      <div className="space-y-8">
        {/* Wallet Connections */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-muted uppercase tracking-widest pl-2">
            Connected Wallets
          </h3>
          <div className="space-y-3">
            <WalletCard
              name="Leather Wallet"
              address="SP2J...9EJ7"
              isPrimary={true}
              icon="https://cryptologos.cc/logos/stacks-stx-logo.png"
            />
            <WalletCard
              name="MetaMask"
              address="0x71...3f21"
              isPrimary={false}
              icon="https://cryptologos.cc/logos/ethereum-eth-logo.png"
            />
          </div>
          <button className="flex items-center gap-2 text-xs font-bold text-brand-orange hover:underline cursor-pointer px-2 transition-all">
            <PlusIcon size={14} />
            <span>Add new wallet</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function NotificationToggle({
  title,
  desc,
  defaultChecked,
}: NotificationToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between p-6 rounded-3xl hover:bg-sidebar transition-all group border border-transparent hover:border-border-subtle">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${checked ? "bg-brand-orange/10 text-brand-orange" : "bg-sidebar text-muted opacity-50"}`}
        >
          <Bell size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold">{title}</h4>
          <p className="text-[10px] text-muted font-bold mt-0.5">{desc}</p>
        </div>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${checked ? "bg-brand-orange shadow-[0_0_20px_rgba(255,107,0,0.2)]" : "bg-gray-200"}`}
      >
        <motion.div
          animate={{ x: checked ? 26 : 4 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

function WalletCard({ name, address, isPrimary, icon }: WalletCardProps) {
  return (
    <div className="flex items-center justify-between p-5 bg-sidebar rounded-2xl border border-border-subtle hover:border-brand-orange/30 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-border-subtle shadow-sm">
          <img src={icon} className="w-5 h-5" alt="" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold">{name}</h4>
            {isPrimary && (
              <span className="px-1.5 py-0.5 bg-brand-orange/10 text-brand-orange text-[8px] font-black uppercase tracking-widest rounded-md border border-brand-orange/20">
                Primary
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted font-mono font-bold mt-0.5">
            {address}
          </p>
        </div>
      </div>
      <button className="p-2 rounded-lg text-muted hover:bg-white hover:text-brand-orange transition-all cursor-pointer">
        <ExternalLink size={14} />
      </button>
    </div>
  );
}

function PlusIcon({ size }: PlusIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
