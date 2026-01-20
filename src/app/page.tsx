"use client";

import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Database,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, type ElementType } from "react";
import { WalletModal } from "@/components/WalletModal";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { isConnected } = useWallet();
  const router = useRouter();

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  // Don't render page content if connected (will redirect)
  if (isConnected) {
    return null;
  }

  return (
    <>
      <main className="min-h-screen selection:bg-brand-orange selection:text-white overflow-x-hidden">
        <Navbar />

        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center pt-32 pb-32 px-6 overflow-hidden">
          {/* Extreme-Contrast Logo-Inspired Mesh Background */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div
              className="absolute top-[-10%] right-[-5%] w-[1200px] h-[1200px] rounded-full opacity-50 blur-[130px]"
              style={{
                background:
                  "radial-gradient(circle, #FF8A00 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute bottom-[-10%] left-[-5%] w-[1200px] h-[1200px] rounded-full opacity-50 blur-[130px]"
              style={{
                background:
                  "radial-gradient(circle, #00D1FF 0%, transparent 70%)",
              }}
            />
          </div>

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
              </span>
              Cross-Chain Payments Redefined
            </motion.div>

            <motion.h1
              {...fadeInUp}
              className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 max-w-5xl mx-auto leading-[1.1] font-heading"
            >
              Move USDC between{" "}
              <span className="text-brand-blue">Ethereum</span> and{" "}
              <span className="text-brand-orange font-garamond italic">
                Stacks
              </span>{" "}
              effortlessly.
            </motion.h1>

            <motion.p
              {...fadeInUp}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
            >
              Inflow enables seamless cross-chain invoicing and instant
              settlement powered by Circle’s xReserve. Professional, secure, and
              Bitcoin-backed.
            </motion.p>

            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-black text-white rounded-2xl font-medium hover:bg-black/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 bg-white text-foreground border border-border-subtle rounded-2xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Pay Invoice
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* About Inflow Section */}
        <section id="about" className="py-24 px-6 bg-sidebar">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold tracking-tight mb-6 font-heading">
                  About Inflow
                </h2>
                <p className="text-lg text-muted mb-8 leading-relaxed">
                  Inflow bridges the gap between the programmable Ethereum
                  ecosystem and the Bitcoin-secured Stacks network. By
                  leveraging Circle’s xReserve technology, we ensure that every
                  cross-chain transfer is handled with institutional-grade
                  security and instant finality.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-white border border-border-subtle flex items-center justify-center shadow-sm">
                      <Database className="text-brand-orange w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">xReserve Integration</h4>
                      <p className="text-sm text-muted">
                        Direct deposit-for-burn and minting flow ensuring 1:1
                        USDC mapping across chains.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-white border border-border-subtle flex items-center justify-center shadow-sm">
                      <ShieldCheck className="text-brand-blue w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">
                        Bitcoin-Backed Finality
                      </h4>
                      <p className="text-sm text-muted">
                        Leveraging Stacks PoX mechanism to ensure your payments
                        are as secure as Bitcoin.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Visual Explainer (Ultra-Minimalist Settlement Proof) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative p-12 rounded-[40px] bg-white border border-border-subtle shadow-2xl max-w-xl mx-auto"
              >
                {/* Abstract Security Indicator */}
                <div className="flex items-center gap-2 mb-12">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold tracking-widest text-muted uppercase">
                    System Secured & Verified
                  </span>
                </div>

                {/* Transaction Highlight */}
                <div className="mb-16">
                  <div className="text-xs font-bold text-muted uppercase tracking-tight mb-3">
                    Finalized Settlement
                  </div>
                  <div className="text-5xl font-bold tracking-tight text-foreground flex items-baseline gap-3">
                    1,420.00
                    <span className="text-xl text-muted font-medium">USDC</span>
                  </div>
                </div>

                {/* Security Proof Grid */}
                <div className="grid grid-cols-2 gap-12 border-t border-gray-100 pt-10">
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase mb-4">
                      Protocol Layer
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                        <Zap size={16} className="text-brand-orange" />
                      </div>
                      <span className="text-sm font-bold">xReserve v2</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase mb-4">
                      Settlement Network
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
                        <span className="text-xs text-white font-black">₿</span>
                      </div>
                      <span className="text-sm font-bold tracking-tight">
                        Bitcoin (via Stacks)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proof Marker */}
                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between opacity-50">
                  <div className="text-[9px] font-mono">HASH: 0x82f...d92a</div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-3 h-0.5 bg-gray-200 rounded-full"
                      />
                    ))}
                  </div>
                </div>

                {/* Brand Accent Blur */}
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-brand-orange/ rounded-full blur-3xl -z-10" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4 font-heading">
                Everything you need for global commerce
              </h2>
              <p className="text-muted max-w-2xl mx-auto font-medium">
                Built for modern businesses operating across the multichain
                ecosystem.
              </p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
            >
              <FeatureCard
                icon={Globe}
                title="Cross-Chain Invoicing"
                description="Create invoices denominated in USDCx and receive payments from any supported chain."
              />
              <FeatureCard
                icon={Zap}
                title="Instant Bridge Settlement"
                description="Forget waiting for days. Our xReserve integration ensures near-instant fund availability."
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Bitcoin-Secured Finality"
                description="Transactions on Stacks inherit the security of the Bitcoin network for ultimate peace of mind."
              />
            </motion.div>
          </div>
        </section>

        {/* Basic Footer */}
        <footer className="py-12 border-t border-border-subtle text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative w-6 h-6">
              <Image
                src="/inflow Logo1 (1).png"
                alt="Inflow Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-bold tracking-tight">Inflow</span>
          </div>
          <p className="text-xs text-muted font-medium">
            © 2026 Inflow Protocol. All rights reserved.
          </p>
        </footer>
      </main>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}

interface FeatureCardProps {
  icon: ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="p-8 rounded-3xl bg-white border border-border-subtle hover:border-brand-orange/50 transition-colors group cursor-pointer"
    >
      <div className="w-12 h-12 rounded-2xl bg-sidebar flex items-center justify-center mb-6 group-hover:bg-brand-orange/10 transition-colors">
        <Icon className="w-6 h-6 text-foreground group-hover:text-brand-orange transition-colors" />
      </div>
      <h3 className="text-xl font-bold mb-3 font-heading">{title}</h3>
      <p className="text-muted text-sm leading-relaxed font-medium">
        {description}
      </p>
    </motion.div>
  );
}
