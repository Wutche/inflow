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
    <div className="bg-white p-6 rounded-3xl border border-border-subtle shadow-sleek transition-all hover:shadow-md group">
      <div className="flex justify-between items-start mb-4">
        <div
          className={cn(
            "p-2 rounded-xl bg-opacity-10",
            iconColor || "bg-brand-orange/10",
          )}
        >
          <Icon
            className={cn(
              "inline-block",
              iconColor
                ? iconColor.replace("bg-", "text-")
                : "text-brand-orange",
            )}
            size={20}
          />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend === "up"
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600",
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
        <span className="text-2xl font-bold tracking-tight">{value}</span>
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
  const { stats, isLoaded } = useBridgeHistory();

  // Calculate values from real bridge history
  const totalReceived = isLoaded ? formatCurrency(stats.totalReceived) : "0.00";
  const totalSent = isLoaded ? formatCurrency(stats.totalSent) : "0.00";
  const bridgeVolume = isLoaded ? formatCurrency(stats.totalVolume) : "0.00";
  const pendingCount = isLoaded ? stats.pendingCount : 0;

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
        iconColor="bg-blue-500/10"
      />
      <StatCard
        title="Pending"
        value={pendingCount.toString()}
        subtitle="Awaiting confirmation"
        icon={Clock}
        iconColor="bg-amber-500/10"
      />
      <StatCard
        title="Bridge Volume"
        value={`$${bridgeVolume}`}
        subtitle="Via xReserve"
        icon={ArrowLeftRight}
        iconColor="bg-indigo-500/10"
      />
    </div>
  );
}
