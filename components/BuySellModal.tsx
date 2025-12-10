"use client";

import { useState, useEffect } from "react";
import { X, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Stock } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface BuySellModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
  type: "buy" | "sell";
}

// Generate mock candlestick data for the chart
const generateCandlestickData = (basePrice: number) => {
  const data = [];
  let currentPrice = basePrice;

  for (let i = 0; i < 20; i++) {
    const change = (Math.random() - 0.5) * (basePrice * 0.02);
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.01);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.01);

    data.push({
      time: i,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    currentPrice = close;
  }

  return data;
};

export default function BuySellModal({
  isOpen,
  onClose,
  stock,
  type,
}: BuySellModalProps) {
  const { session } = useAuth();

  // Time Trade State
  const [duration, setDuration] = useState<number>(60);
  const [amount, setAmount] = useState<number>(50);
  const [candlestickData, setCandlestickData] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate candlestick data when stock changes
  useEffect(() => {
    if (stock) {
      setCandlestickData(generateCandlestickData(stock.price));
    }
  }, [stock]);

  // Update candlestick data every 2 seconds for live effect
  useEffect(() => {
    if (!stock || !isOpen) return;

    const interval = setInterval(() => {
      setCandlestickData(prev => {
        const newData = [...prev];
        newData.shift(); // Remove first element

        const lastCandle = newData[newData.length - 1];
        const change = (Math.random() - 0.5) * (stock.price * 0.02);
        const open = lastCandle.close;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * (stock.price * 0.01);
        const low = Math.min(open, close) - Math.random() * (stock.price * 0.01);

        newData.push({
          time: lastCandle.time + 1,
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
        });

        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [stock, isOpen]);

  if (!stock) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      setError("Please sign in to place orders");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = session.access_token;

      // Ensure symbol has /USD suffix for trade sessions
      const tradeSymbol = stock.symbol.includes('/') ? stock.symbol : `${stock.symbol}/USD`;

      const response = await fetch("/api/trade/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: tradeSymbol,
          amount: amount,
          duration: duration
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process transaction");
      }

      // Success - trigger balance update event
      window.dispatchEvent(new Event('balanceUpdated'));

      onClose();
      // Reload to show updated balance and active trade
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to process transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate min and max for chart scaling
  const allPrices = candlestickData.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl rounded-lg border border-dark-border bg-dark-card shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-dark-border bg-purple-500/10 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Trade {stock.symbol}
                </h2>
                <button onClick={onClose} className="rounded-lg p-1 text-blue-accent hover:bg-dark-hover">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Stock Info with Live Chart */}
                <div className="rounded-lg bg-dark-hover p-4 border border-dark-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold text-blue-accent text-lg">{stock.symbol}</div>
                      <div className="text-sm text-blue-accent/70">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{formatCurrency(stock.price)}</div>
                      <div className={`text-sm flex items-center gap-1 justify-end ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>

                  {/* Candlestick Chart */}
                  <div className="relative h-48 bg-dark-bg rounded-lg p-2">
                    <svg width="100%" height="100%" className="overflow-visible">
                      {candlestickData.map((candle, index) => {
                        const x = (index / (candlestickData.length - 1)) * 100;
                        const yHigh = ((maxPrice - candle.high) / priceRange) * 100;
                        const yLow = ((maxPrice - candle.low) / priceRange) * 100;
                        const yOpen = ((maxPrice - candle.open) / priceRange) * 100;
                        const yClose = ((maxPrice - candle.close) / priceRange) * 100;

                        const isGreen = candle.close >= candle.open;
                        const color = isGreen ? "#10b981" : "#ef4444";

                        return (
                          <g key={index}>
                            {/* Wick */}
                            <line
                              x1={`${x}%`}
                              y1={`${yHigh}%`}
                              x2={`${x}%`}
                              y2={`${yLow}%`}
                              stroke={color}
                              strokeWidth="1"
                            />
                            {/* Body */}
                            <rect
                              x={`${x - 1.5}%`}
                              y={`${Math.min(yOpen, yClose)}%`}
                              width="3%"
                              height={`${Math.abs(yClose - yOpen) || 0.5}%`}
                              fill={color}
                            />
                          </g>
                        );
                      })}
                    </svg>
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">Live Chart</div>
                  </div>
                </div>

                {/* Duration Selection */}
                <div>
                  <label className="block text-sm font-medium text-blue-accent mb-2">Duration (Seconds)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[60, 120, 180, 240, 300].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDuration(s)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${duration === s
                            ? "bg-purple-600 text-white shadow-lg"
                            : "bg-dark-hover text-blue-accent hover:text-white"
                          }`}
                      >
                        {s}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Selection */}
                <div>
                  <label className="block text-sm font-medium text-blue-accent mb-2">Amount ($)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[50, 100, 150, 200, 500].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAmount(a)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${amount === a
                            ? "bg-green-600 text-white shadow-lg"
                            : "bg-dark-hover text-blue-accent hover:text-white"
                          }`}
                      >
                        ${a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trade Summary */}
                <div className="rounded-lg bg-purple-500/10 p-4 border border-purple-500/20 text-center">
                  <p className="text-sm text-purple-200">
                    Trade <b>{stock.symbol}</b> for <b>{duration}s</b> at <b>${amount}</b>
                  </p>
                  <p className="text-xs text-purple-300/70 mt-1">
                    Potential Payout: ${amount + (amount * 0.8)} (80% Profit)
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg disabled:opacity-50 bg-purple-600 hover:bg-purple-700 shadow-purple-500/50"
                >
                  {isSubmitting ? "Processing..." : "Execute Trade"}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
