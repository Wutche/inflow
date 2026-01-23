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
  Sparkles,
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
      <main className="min-h-screen  selection:bg-brand-orange selection:text-white overflow-x-hidden transition-colors duration-300">
        <Navbar />

        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center pt-32 pb-32 px-6 overflow-hidden">
          {/* Extreme-Contrast Logo-Inspired Mesh Background */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Orange gradient - top right */}
            <div
              className="absolute top-[-20%] right-[-10%] w-[1400px] h-[1400px] rounded-full opacity-80 dark:opacity-40"
              style={{
                background:
                  "radial-gradient(circle, rgba(255, 138, 0, 0.8) 0%, rgba(255, 180, 100, 0.4) 40%, transparent 70%)",
                filter: "blur(140px)",
              }}
            />
            {/* Cyan/Teal gradient - bottom left */}
            <div
              className="absolute bottom-[-30%] left-[-15%] w-[1600px] h-[1600px] rounded-full opacity-70 dark:opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgba(0, 209, 255, 0.8) 0%, rgba(100, 220, 255, 0.4) 40%, transparent 70%)",
                filter: "blur(140px)",
              }}
            />
          </div>

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center justify-center gap-3 mb-10 cursor-default"
            >
              <div className="h-px w-8 bg-linear-to-r from-transparent to-brand-orange/50" />
              <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.3em] text-brand-orange uppercase">
                Modern Cross-Chain Invoicing
              </span>
              <div className="h-px w-8 bg-linear-to-l from-transparent to-brand-blue/50" />
            </motion.div>

            <motion.h1
              {...fadeInUp}
              className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 max-w-5xl mx-auto leading-[1.1] font-heading relative"
            >
              Move USDC between{" "}
              <span className="relative inline-block">
                <span className="text-brand-blue">Ethereum</span>
                {/* Connection Arc SVG */}
                <svg
                  className="absolute -top-6 left-1/2 w-[200%] h-12 pointer-events-none hidden md:block"
                  viewBox="0 0 200 40"
                  fill="none"
                  style={{ transform: "translateX(-25%)" }}
                >
                  <motion.path
                    d="M 50 40 Q 100 0 150 40"
                    stroke="url(#gradient-bridge)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  />
                  <defs>
                    <linearGradient id="gradient-bridge" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--color-brand-blue)" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="var(--color-brand-orange)" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="var(--color-brand-orange)" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  {/* Flowing particle */}
                  <motion.circle
                    r="3"
                    fill="white"
                    className="shadow-[0_0_8px_white]"
                    animate={{
                      offsetDistance: ["0%", "100%"],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      offsetPath: "path('M 50 40 Q 100 0 150 40')",
                    }}
                  />
                </svg>
              </span>{" "}
              and{" "}
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
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all group scale-100 hover:scale-105 active:scale-95 cursor-pointer shadow-sm hover:shadow-md dark:bg-white dark:text-black"
                style={{ backgroundColor: '#000000', color: '#ffffff' }}
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 border border-border-subtle rounded-2xl font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
                style={{ backgroundColor: '#ffffff', color: '#000000' }}
              >
                Pay Invoice
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* About Inflow Section */}
        <section id="about" className="py-24 px-6 bg-sidebar transition-colors duration-300">
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
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-card border border-border-subtle flex items-center justify-center">
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
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-card border border-border-subtle flex items-center justify-center">
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
                className="relative p-12 rounded-[40px] bg-card border border-border-subtle allow-shadow dark:shadow-dark-sleek max-w-xl mx-auto transition-all"
                style={{ boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.08)' }}
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
                <div className="grid grid-cols-2 gap-12 border-t border-border-subtle pt-10">
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
                <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-between opacity-50">
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
        <footer className="py-12 border-t border-border-subtle text-center bg-background transition-colors duration-300">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative w-6 h-6">
              <Image
                src="/inflow Logo1 (1).png"
                alt="Inflow Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">Inflow</span>
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
      className="p-8 rounded-3xl bg-card border border-border-subtle hover:border-brand-orange/50 transition-all group cursor-pointer dark:shadow-dark-sleek"
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
