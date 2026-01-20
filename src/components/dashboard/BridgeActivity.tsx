"use client";

import { ArrowLeftRight, Inbox } from "lucide-react";
import Link from "next/link";
import { useBridgeHistory } from "@/hooks/useBridgeHistory";

export function BridgeActivity() {
  const { recentTransactions, formatTransactionForDisplay, isLoaded } =
    useBridgeHistory();

  return (
    <div className="bg-card rounded-3xl border border-border-subtle dark:shadow-dark-sleek flex-1 transition-all duration-300">
      <div className="p-6 border-b border-border-subtle flex justify-between items-center text-foreground">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Bridge Activity</h2>
          <p className="text-xs text-muted font-medium mt-1">
            Cross-chain transfers
          </p>
        </div>
        <Link
          href="/dashboard/bridge"
          className="text-xs font-bold text-brand-orange hover:underline decoration-2 underline-offset-4 transition-all cursor-pointer"
        >
          View all
        </Link>
      </div>

      <div className="p-2">
        {!isLoaded ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full" />
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-xl bg-sidebar border border-border-subtle flex items-center justify-center mb-3">
              <Inbox size={18} className="text-muted" />
            </div>
            <p className="text-xs text-muted font-medium">
              No bridge activity yet
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentTransactions.map((tx) => {
              const display = formatTransactionForDisplay(tx);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-sidebar-hover transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sidebar border border-border-subtle flex items-center justify-center group-hover:bg-card transition-colors dark:group-hover:bg-sidebar-hover">
                      <ArrowLeftRight
                        size={18}
                        className="text-muted group-hover:text-brand-orange transition-colors"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        {tx.route}
                      </h4>
                      <p className="text-[10px] text-muted font-medium mt-0.5">
                        {display.displayDate}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground mb-1">
                      {display.displayAmount}
                    </p>
                    <span
                      className={`text-[10px] font-bold ${display.statusColor} uppercase tracking-wider`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
