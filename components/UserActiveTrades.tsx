"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Clock, RefreshCcw, Activity } from "lucide-react";
import { toast } from "sonner";

interface TradeSession {
    id: string;
    symbol: string;
    amount: number;
    duration: number;
    start_time: string;
    status: "PENDING" | "WON" | "LOST";
    outcome_override?: string;
}

export default function UserActiveTrades() {
    const { session } = useAuth();
    const [sessions, setSessions] = useState<TradeSession[]>([]);
    const [loading, setLoading] = useState(false);
    const prevSessionsRef = useRef<TradeSession[]>([]);

    // Countdown logic
    const [timeLeftMap, setTimeLeftMap] = useState<Record<string, number>>({});

    const fetchSessions = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const res = await fetch("/api/trade/session", {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();

                // Check for status changes
                data.forEach((newSession: TradeSession) => {
                    const oldSession = prevSessionsRef.current.find(s => s.id === newSession.id);
                    if (oldSession && oldSession.status === 'PENDING' && newSession.status !== 'PENDING') {
                        // Trade completed!
                        if (newSession.status === 'WON') {
                            const profit = newSession.amount * 0.8;
                            toast.success("Trade Won!", {
                                description: `You earned ${formatCurrency(profit)} on ${newSession.symbol}`,
                                duration: 5000,
                            });
                            // Trigger balance update
                            window.dispatchEvent(new Event('balanceUpdated'));
                        } else {
                            toast.error("Trade Lost", {
                                description: `You lost ${formatCurrency(newSession.amount)} on ${newSession.symbol}`,
                                duration: 5000,
                            });
                        }
                    }
                });

                setSessions(data);
                prevSessionsRef.current = data;
            }
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 2000); // Check every 2s
        return () => clearInterval(interval);
    }, [session]);

    // Timer Interval
    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeftMap: Record<string, number> = {};
            sessions.forEach(s => {
                if (s.status === 'PENDING') {
                    const startTime = new Date(s.start_time).getTime();
                    const endTime = startTime + (s.duration * 1000);
                    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
                    newTimeLeftMap[s.id] = remaining;
                }
            });
            setTimeLeftMap(newTimeLeftMap);
        }, 1000);
        return () => clearInterval(timer);
    }, [sessions]);

    // Filter to show active or recently completed
    const displaySessions = sessions.filter(s => s.status === 'PENDING' || (new Date(s.start_time).getTime() + s.duration * 1000 + 60000 > Date.now()));

    if (displaySessions.length === 0) return null;

    return (
        <div className="w-full bg-dark-card border border-dark-border rounded-xl p-6 shadow-xl mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Active Time Trades
                </h2>
                <button onClick={fetchSessions} disabled={loading} className="text-gray-400 hover:text-white">
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="space-y-3">
                {displaySessions.map((item) => {
                    const remaining = timeLeftMap[item.id] !== undefined ? timeLeftMap[item.id] : item.duration;
                    return (
                        <div key={item.id} className="bg-dark-hover rounded-lg p-3 border border-dark-border flex items-center justify-between">
                            <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                    {item.symbol}
                                    {item.status === 'PENDING' && (
                                        <span className="text-xs font-mono bg-purple-500/10 text-purple-400 px-2 rounded border border-purple-500/20">
                                            {remaining}s
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {item.status === 'PENDING' ? 'Trade in progress...' :
                                        item.status === 'WON' ? 'Trade Completed' : 'Trade Ended'}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-sm font-bold text-white">{formatCurrency(item.amount)}</div>
                                <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${item.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
                                    item.status === 'WON' ? 'bg-green-500/20 text-green-500' :
                                        'bg-red-500/20 text-red-500'
                                    }`}>
                                    {item.status}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
