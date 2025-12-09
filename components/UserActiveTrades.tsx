"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Clock, RefreshCcw, Activity } from "lucide-react";

interface TradeSession {
    id: string;
    symbol: string;
    amount: number;
    duration: number;
    start_time: string;
    status: "PENDING" | "WON" | "LOST";
}

export default function UserActiveTrades() {
    const { session } = useAuth();
    const [sessions, setSessions] = useState<TradeSession[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSessions = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const res = await fetch("/api/trade/session", {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 3000); // Auto refresh frequently for user
        return () => clearInterval(interval);
    }, [session]);

    if (sessions.length === 0) return null;

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
                {sessions.map((item) => (
                    <div key={item.id} className="bg-dark-hover rounded-lg p-3 border border-dark-border flex items-center justify-between">
                        <div>
                            <div className="font-bold text-white">{item.symbol}</div>
                            <div className="text-xs text-gray-400">{item.duration}s Trade</div>
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
                ))}
            </div>
        </div>
    );
}
