"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Globe,
  ArrowRight,
  CheckCircle,
  Smartphone,
  CreditCard
} from "lucide-react";
import LandingTerminal from "@/components/LandingTerminal";

export default function LandingPage() {
  const stats = [
    { value: "$12B+", label: "Quarterly Volume" },
    { value: "2M+", label: "Verified Users" },
    { value: "150+", label: "Countries Supported" },
    { value: "<50ms", label: "Latency Speed" },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: "Advanced Trading Engine",
      description: "Execute orders with institutional-grade speed and precision using our proprietary matching engine.",
      color: "text-emerald-400"
    },
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "Your assets are protected by cold storage, multi-sig wallets, and real-time threat monitoring.",
      color: "text-sky-400"
    },
    {
      icon: Zap,
      title: "Lightning Execution",
      description: "Experience zero-lag trading with our distributed global server network optimized for high frequency.",
      color: "text-yellow-400"
    },
    {
      icon: BarChart3,
      title: "Pro Analytics Suite",
      description: "Access Level 2 market data, custom indicators, and automated technical analysis tools.",
      color: "text-purple-400"
    },
    {
      icon: Smartphone,
      title: "Mobile Native",
      description: "Trade anywhere with our award-winning mobile app, fully synced with your desktop experience.",
      color: "text-pink-400"
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Trade stocks, crypto, forex, and commodities from a single unified account.",
      color: "text-blue-400"
    },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">

      {/* Navbar with Glass Effect */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-dark-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                QUANTUM
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/signin"
                className="hidden sm:inline-block text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signin"
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all active:scale-95"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 overflow-hidden">
        {/* Background Decorative Elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-sky-500/20 rounded-full blur-[120px] -z-10"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -z-10"
        />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
          >
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-400 tracking-wide uppercase">Live Market Access v2.0</span>
            </motion.div>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight"
            >
              The Future of <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-emerald-400 to-cyan-400 drop-shadow-sm">
                Decentralized Trading
              </span>
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Experience the next evolution of financial markets. Zero fees, lightning-fast execution, and bank-grade security for your digital assets.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/signin"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all"
              >
                Start Trading Free
              </Link>
              <Link
                href="/markets"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 backdrop-blur-sm transition-all flex items-center justify-center gap-2 group"
              >
                View Markets
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> No Credit Card Required</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> $10k Demo Account</div>
            </motion.div>
          </motion.div>
        </div>

        {/* Terminal Section with Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
          className="mt-20 max-w-5xl mx-auto relative z-20 group"
        >
          {/* Glow Effect behind terminal */}
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

          <div className="relative">
            <LandingTerminal />
          </div>
        </motion.div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-white/5 bg-white/[0.02] backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.2 }
              }
            }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className="text-center"
              >
                <h4 className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</h4>
                <p className="text-sm font-medium text-emerald-400 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Built for <span className="text-emerald-400">Professional</span> Traders</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">Everything you need to analyze, execute, and scale your portfolio in one unified ecosystem.</p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
                className="glass-card p-8 group hover:-translate-y-2 hover:bg-white/[0.03] transition-all duration-300 border border-white/5 hover:border-emerald-500/20"
              >
                <div className={`w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-gradient-to-br group-hover:from-white/10 group-hover:to-transparent transition-all ${feature.color}`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust / CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-12 md:p-20 text-center overflow-hidden"
          >
            {/* Radial Glow */}
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full -z-10"
            />

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to maximize your returns?</h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Join the fastest growing decentralized exchange platform today. Setup takes less than 2 minutes.</p>

            <Link
              href="/signin"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-emerald-950 font-bold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all shadow-xl"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-6 text-sm text-gray-500">Join 2M+ users • No credit card required</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">QUANTUM</span>
            </div>
            <p className="text-gray-400 max-w-sm mb-6">The world's most trusted social trading platform. Connect, trade, and grow your wealth with advanced tools and community insights.</p>
            <div className="flex gap-4">
              {/* Social placeholders */}
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"><Globe className="w-5 h-5" /></div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-emerald-400 cursor-pointer">Markets</li>
              <li className="hover:text-emerald-400 cursor-pointer">Live Trading</li>
              <li className="hover:text-emerald-400 cursor-pointer">Copy Trading</li>
              <li className="hover:text-emerald-400 cursor-pointer">Earn</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-emerald-400 cursor-pointer">Help Center</li>
              <li className="hover:text-emerald-400 cursor-pointer">API Documentation</li>
              <li className="hover:text-emerald-400 cursor-pointer">Fees</li>
              <li className="hover:text-emerald-400 cursor-pointer">Security</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-emerald-400 cursor-pointer">About Us</li>
              <li className="hover:text-emerald-400 cursor-pointer">Careers</li>
              <li className="hover:text-emerald-400 cursor-pointer">Blog</li>
              <li className="hover:text-emerald-400 cursor-pointer">Contact</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; 2024 Quantum Austrade. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
