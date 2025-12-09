"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TrendingUp, Bell, User, LogOut, Menu, X, Search } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar, { MobileMenuButton } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import UserSearch from "./UserSearch";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, session } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notification count
  useEffect(() => {
    if (!session || !user) {
      setUnreadCount(0);
      return;
    }

    const fetchNotificationCount = async () => {
      try {
        const token = session.access_token;
        const response = await fetch("/api/notifications?limit=1", {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 10000);
    return () => clearInterval(interval);
  }, [session, user]);

  const handleSignOut = async () => {
    await signOut();
    setIsNotificationOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 z-40 w-full h-16 border-b border-white/5 bg-dark-bg/80 backdrop-blur-xl"
      >
        <div className="flex h-full items-center justify-between px-4 lg:px-8">

          {/* Left: Mobile Menu + Logo */}
          <div className="flex items-center gap-4">
            <MobileMenuButton onClick={() => setIsSidebarOpen(true)} />

            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                QUANTUM
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          {user && (
            <div className="hidden md:block flex-1 max-w-xl mx-8 relative">
              <UserSearch />
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-dark-card animate-pulse" />
                    )}
                  </button>
                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                </div>

                {/* Profile Link (Mobile only mostly, or quick link) */}
                <Link
                  href="/profile"
                  className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all md:hidden"
                >
                  <User className="h-5 w-5" />
                </Link>

                {/* Desktop User Widget */}
                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/5">
                  <div className="text-right hidden lg:block">
                    <div className="text-sm font-medium text-white">{user.user_metadata?.name || "Trader"}</div>
                    <div className="text-xs text-emerald-400">Pro Plan</div>
                  </div>
                  <Link href="/profile" className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 p-[2px] cursor-pointer hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
                    <div className="w-full h-full rounded-full bg-dark-bg flex items-center justify-center">
                      <span className="font-bold text-white text-sm">{user.email?.charAt(0).toUpperCase()}</span>
                    </div>
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/signin"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signin"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:opacity-90 text-white text-sm font-medium shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
