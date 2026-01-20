"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useBridgeHistory } from "@/hooks/useBridgeHistory";
import { useInvoiceHistory } from "@/hooks/useInvoiceHistory";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  trendValue?: string;
  iconColor?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  iconColor,
}: StatCardProps) {
  return (
    <div className="bg-card p-6 rounded-3xl border border-border-subtle dark:shadow-dark-sleek transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div
          className={cn(
            "p-2.5 rounded-xl transition-colors",
            iconColor || "bg-brand-orange/10 dark:bg-brand-orange/20",
          )}
        >
          <Icon
            className={cn(
              "inline-block transition-colors",
              iconColor
                ? iconColor.replace("bg-", "text-").replace("/10", "").replace("/20", "")
                : "text-brand-orange dark:text-brand-orange/90",
            )}
            size={20}
          />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight",
              trend === "up"
                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20",
            )}
          >
            {trend === "up" ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-muted text-sm font-medium mb-1">{title}</h3>
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        <p className="text-muted text-xs mt-2 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function StatCards() {
  const { stats, isLoaded: bridgeLoaded } = useBridgeHistory();
  const { history, isLoaded: invoiceLoaded } = useInvoiceHistory();

  // Calculate values from real bridge history
  const totalReceived = bridgeLoaded ? formatCurrency(stats.totalReceived) : "0.00";
  const totalSent = bridgeLoaded ? formatCurrency(stats.totalSent) : "0.00";
  const bridgeVolume = bridgeLoaded ? formatCurrency(stats.totalVolume) : "0.00";
  
  // Count pending items: pending invoices + pending bridge transactions
  const pendingInvoices = invoiceLoaded 
    ? history.filter(inv => inv.status === "pending").length 
    : 0;
  const pendingBridge = bridgeLoaded ? stats.pendingCount : 0;
  const totalPending = pendingInvoices + pendingBridge;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Received"
        value={`$${totalReceived}`}
        subtitle="USDCx on Stacks"
        icon={ArrowDownLeft}
      />
      <StatCard
        title="Total Sent"
        value={`$${totalSent}`}
        subtitle="Cross-chain payments"
        icon={ArrowUpRight}
        iconColor="bg-blue-500/10 dark:bg-blue-500/20"
      />
      <StatCard
        title="Pending"
        value={totalPending.toString()}
        subtitle={`${pendingInvoices} invoices • ${pendingBridge} transfers`}
        icon={Clock}
        iconColor="bg-amber-500/10 dark:bg-amber-500/20"
      />
      <StatCard
        title="Bridge Volume"
        value={`$${bridgeVolume}`}
        subtitle="Via xReserve"
        icon={ArrowLeftRight}
        iconColor="bg-indigo-500/10 dark:bg-indigo-500/20"
      />
    </div>
  );
}
