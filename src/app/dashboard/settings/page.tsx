"use client";

import { useState, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Toast } from "@/components/ui/Toast";
import {
  User,
  Building2,
  Bell,
  Shield,
  Camera,
  ChevronRight,
  LogOut,
  Check,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";
import { useWallet } from "@/context/WalletContext";

type Tab = "account" | "business" | "notifications" | "security";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 2000);
  }, []);

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
                  ? "bg-card text-brand-orange border border-border-subtle"
                  : "text-muted hover:bg-sidebar-hover hover:text-foreground"
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
        <div className="lg:col-span-9 bg-card border border-border-subtle rounded-[40px] relative overflow-hidden">
          <div className="p-10">
            <AnimatePresence mode="wait">
              {activeTab === "account" && (
                <AccountSettings showToast={showToast} />
              )}
              {activeTab === "business" && (
                <BusinessSettings showToast={showToast} />
              )}
              {activeTab === "notifications" && (
                <NotificationSettings showToast={showToast} />
              )}
              {activeTab === "security" && (
                <SecuritySettings showToast={showToast} />
              )}
            </AnimatePresence>
          </div>

          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/3 rounded-full blur-[100px] -z-10" />
        </div>
      </div>

      <Toast
        message={toastMessage}
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />
    </DashboardLayout>
  );
}

// ============================================================================
// ACCOUNT SETTINGS
// ============================================================================

function AccountSettings({ showToast }: { showToast: (msg: string) => void }) {
  const { account, updateAccount, updateProfilePicture, removeProfilePicture } =
    useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state
  const [fullName, setFullName] = useState(account.fullName);
  const [email, setEmail] = useState(account.email);
  const [bio, setBio] = useState(account.bio);

  const handleSave = async () => {
    setIsSaving(true);
    updateAccount({ fullName, email, bio });
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
    showToast("Account settings saved!");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await updateProfilePicture(file);
      showToast("Profile picture updated!");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePicture = () => {
    removeProfilePicture();
    showToast("Profile picture removed");
  };

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
          disabled={isSaving}
          className="px-8 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer dark:bg-white dark:text-black disabled:opacity-50"
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <>
              <Check size={16} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-start gap-10">
        {/* Profile Picture */}
        <div className="relative group">
          <div className="w-32 h-32 rounded-[40px] bg-sidebar border-2 border-dashed border-border-subtle flex items-center justify-center text-muted overflow-hidden relative">
            {account.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={account.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={48} className="opacity-20" />
            )}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
            >
              {isUploading ? (
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Camera size={24} />
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {account.profilePicture ? (
            <button
              onClick={handleRemovePicture}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center dark:shadow-lg border-2 border-card cursor-pointer hover:bg-red-600 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center dark:shadow-lg border-2 border-card cursor-pointer hover:bg-brand-orange/90 transition-colors"
            >
              <PlusIcon size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Bio / Professional Summary
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all resize-none"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// BUSINESS SETTINGS
// ============================================================================

function BusinessSettings({ showToast }: { showToast: (msg: string) => void }) {
  const { business, updateBusiness } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  // Local form state
  const [legalEntityName, setLegalEntityName] = useState(
    business.legalEntityName
  );
  const [country, setCountry] = useState(business.country);
  const [taxId, setTaxId] = useState(business.taxId);
  const [currency, setCurrency] = useState(business.currency);

  const handleSave = async () => {
    setIsSaving(true);
    updateBusiness({ legalEntityName, country, taxId, currency });
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
    showToast("Business profile saved!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between border-b border-border-subtle pb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Business Profile</h2>
          <p className="text-muted text-xs font-medium mt-1">
            Information displayed on your invoices.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer dark:bg-white dark:text-black disabled:opacity-50"
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <>
              <Check size={16} />
              <span>Save Details</span>
            </>
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
              value={legalEntityName}
              onChange={(e) => setLegalEntityName(e.target.value)}
              placeholder="Your Company Inc."
              className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Tax / VAT ID
            </label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="XX-XXXX-XXX"
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
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all appearance-none cursor-pointer"
              >
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Canada</option>
                <option>Germany</option>
                <option>France</option>
                <option>Singapore</option>
                <option>Nigeria</option>
                <option>Other</option>
              </select>
              <ChevronRight
                size={16}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted rotate-90 pointer-events-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Invoicing Currency
            </label>
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-5 py-3.5 bg-sidebar border border-border-subtle rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all appearance-none cursor-pointer"
              >
                <option>USD (United States Dollar)</option>
                <option>EUR (Euro)</option>
                <option>GBP (British Pound)</option>
                <option>NGN (Nigerian Naira)</option>
                <option>USDC (USD Coin)</option>
              </select>
              <ChevronRight
                size={16}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted rotate-90 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

function NotificationSettings({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const { notifications, updateNotifications } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  // Local state for toggles
  const [invoicePaid, setInvoicePaid] = useState(notifications.invoicePaid);
  const [overdueReminders, setOverdueReminders] = useState(
    notifications.overdueReminders
  );
  const [bridgeCompletions, setBridgeCompletions] = useState(
    notifications.bridgeCompletions
  );
  const [securityAlerts, setSecurityAlerts] = useState(
    notifications.securityAlerts
  );

  const handleSave = async () => {
    setIsSaving(true);
    updateNotifications({
      invoicePaid,
      overdueReminders,
      bridgeCompletions,
      securityAlerts,
    });
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
    showToast("Notification preferences saved!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between border-b border-border-subtle pb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted text-xs font-medium mt-1">
            Control how you receive alerts and updates.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer dark:bg-white dark:text-black disabled:opacity-50"
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <>
              <Check size={16} />
              <span>Update Alerts</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <NotificationToggle
          title="Invoice Paid"
          desc="Get notified as soon as a client pays an invoice."
          checked={invoicePaid}
          onChange={setInvoicePaid}
        />
        <NotificationToggle
          title="Overdue Reminders"
          desc="Weekly alerts for any outstanding or late payments."
          checked={overdueReminders}
          onChange={setOverdueReminders}
        />
        <NotificationToggle
          title="Bridge Completions"
          desc="Notifications for confirmed cross-chain transfers."
          checked={bridgeCompletions}
          onChange={setBridgeCompletions}
        />
        <NotificationToggle
          title="Security Alerts"
          desc="Critical alerts regarding wallet connections and sessions."
          checked={securityAlerts}
          onChange={setSecurityAlerts}
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// SECURITY SETTINGS
// ============================================================================

function SecuritySettings({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const {
    ethConnected,
    ethAddress,
    ethTruncatedAddress,
    stacksConnected,
    stacksAddress,
    stacksTruncatedAddress,
    disconnectEthereum,
    disconnectStacks,
    connectEthereum,
    connectStacks,
  } = useWallet();

  const handleDisconnectEth = () => {
    disconnectEthereum();
    showToast("Ethereum wallet disconnected");
  };

  const handleDisconnectStacks = () => {
    disconnectStacks();
    showToast("Stacks wallet disconnected");
  };

  const handleConnectEth = async () => {
    try {
      await connectEthereum();
      showToast("Ethereum wallet connected!");
    } catch {
      showToast("Failed to connect Ethereum wallet");
    }
  };

  const handleConnectStacks = async () => {
    try {
      await connectStacks();
      showToast("Stacks wallet connected!");
    } catch {
      showToast("Failed to connect Stacks wallet");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between border-b border-border-subtle pb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Security & Wallets
          </h2>
          <p className="text-muted text-xs font-medium mt-1">
            Manage your connected wallets and authentication.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Wallet Connections */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-muted uppercase tracking-widest pl-2">
            Connected Wallets
          </h3>
          <div className="space-y-3">
            {/* Stacks Wallet */}
            {stacksConnected ? (
              <WalletCard
                name="Stacks Wallet"
                address={stacksTruncatedAddress || ""}
                fullAddress={stacksAddress || ""}
                isPrimary={true}
                icon="https://cryptologos.cc/logos/stacks-stx-logo.png"
                bgColor="bg-[#5546FF]"
                onDisconnect={handleDisconnectStacks}
              />
            ) : (
              <ConnectWalletCard
                name="Stacks"
                icon="https://cryptologos.cc/logos/stacks-stx-logo.png"
                bgColor="bg-[#5546FF]"
                onConnect={handleConnectStacks}
              />
            )}

            {/* Ethereum Wallet */}
            {ethConnected ? (
              <WalletCard
                name="Ethereum Wallet"
                address={ethTruncatedAddress || ""}
                fullAddress={ethAddress || ""}
                isPrimary={false}
                icon="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                bgColor="bg-[#627EEA]"
                onDisconnect={handleDisconnectEth}
              />
            ) : (
              <ConnectWalletCard
                name="Ethereum"
                icon="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                bgColor="bg-[#627EEA]"
                onConnect={handleConnectEth}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface NotificationToggleProps {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function NotificationToggle({
  title,
  desc,
  checked,
  onChange,
}: NotificationToggleProps) {
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
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${checked ? "bg-brand-orange dark:shadow-[0_0_20px_rgba(255,107,0,0.2)]" : "bg-sidebar-hover"}`}
      >
        <motion.div
          animate={{ x: checked ? 26 : 4 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-foreground"
        />
      </button>
    </div>
  );
}

interface WalletCardProps {
  name: string;
  address: string;
  fullAddress: string;
  isPrimary: boolean;
  icon: string;
  bgColor: string;
  onDisconnect: () => void;
}

function WalletCard({
  name,
  address,
  isPrimary,
  icon,
  bgColor,
  onDisconnect,
}: WalletCardProps) {
  return (
    <div className="flex items-center justify-between p-5 bg-sidebar-hover rounded-2xl border border-border-subtle hover:border-brand-orange/30 transition-all group">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center border border-border-subtle`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon} className="w-5 h-5 brightness-0 invert" alt="" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold">{name}</h4>
            {isPrimary && (
              <span className="px-1.5 py-0.5 bg-brand-orange/10 text-brand-orange text-[8px] font-black uppercase tracking-widest rounded-md border border-brand-orange/20">
                Primary
              </span>
            )}
            <span className="px-1.5 py-0.5 bg-green-500/10 text-green-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-green-500/20">
              Connected
            </span>
          </div>
          <p className="text-[10px] text-muted font-mono font-bold mt-0.5">
            {address}
          </p>
        </div>
      </div>
      <button
        onClick={onDisconnect}
        className="p-2 rounded-lg text-muted hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer"
        title="Disconnect wallet"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}

interface ConnectWalletCardProps {
  name: string;
  icon: string;
  bgColor: string;
  onConnect: () => void;
}

function ConnectWalletCard({
  name,
  icon,
  bgColor,
  onConnect,
}: ConnectWalletCardProps) {
  return (
    <div className="flex items-center justify-between p-5 bg-sidebar rounded-2xl border border-dashed border-border-subtle hover:border-brand-orange/30 transition-all group">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center opacity-50`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon} className="w-5 h-5 brightness-0 invert" alt="" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-muted">{name} Wallet</h4>
          <p className="text-[10px] text-muted font-medium mt-0.5">
            Not connected
          </p>
        </div>
      </div>
      <button
        onClick={onConnect}
        className="px-4 py-2 bg-card border border-border-subtle rounded-xl text-xs font-bold text-foreground hover:bg-sidebar-hover hover:border-brand-orange/30 transition-all cursor-pointer"
      >
        Connect
      </button>
    </div>
  );
}

function PlusIcon({ size }: { size: number }) {
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
