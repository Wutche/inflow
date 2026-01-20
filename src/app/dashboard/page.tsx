"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCards } from "@/components/dashboard/StatCards";
import { RecentInvoices } from "@/components/RecentInvoices";
import { BridgeActivity } from "@/components/dashboard/BridgeActivity";
import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Overview of your cross-chain activity"
    >
      <div className="space-y-8">
        {/* Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <StatCards />
        </motion.div>

        {/* Activity Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <RecentInvoices />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <BridgeActivity />
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
