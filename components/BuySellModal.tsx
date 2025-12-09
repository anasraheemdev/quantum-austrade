"use client";

import { useState } from "react";
import { X, Clock, DollarSign } from "lucide-react";
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

export default function BuySellModal({
  isOpen,
  onClose,
  stock,
  type,
}: BuySellModalProps) {
  const { session } = useAuth();
  const [mode, setMode] = useState<"standard" | "time">("standard");

  // Standard Mode State
  const [quantity, setQuantity] = useState<string>("1");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState<string>("");

  // Time Mode State
  const [duration, setDuration] = useState<number>(60);
  const [amount, setAmount] = useState<number>(50);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!stock) return null;

  // Standard Calculations
  const qty = parseFloat(quantity) || 0;
  const price = orderType === "market" ? stock.price : parseFloat(limitPrice) || stock.price;
  const total = qty * price;
  const estimatedCost = total;
  const estimatedFee = total * 0.001;
  const totalCost = estimatedCost + estimatedFee;

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
      let url = "/api/transactions";
      let body: any = {
        symbol: stock.symbol,
        type: type,
        shares: qty,
        price: price,
      };

      if (mode === "time") {
        url = "/api/trade/session";
        body = {
          symbol: stock.symbol,
          amount: amount,
          duration: duration
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process transaction");
      }

      // Success
      onClose();
      // Optional: Show success toast
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to process transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="w-full max-w-md rounded-lg border border-dark-border bg-dark-card shadow-2xl overflow-hidden">

              {/* Mode Switcher */}
              <div className="flex bg-dark-hover border-b border-dark-border">
                <button
                  onClick={() => setMode("standard")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === "standard" ? "bg-dark-card text-blue-accent border-t-2 border-blue-accent" : "text-gray-400 hover:text-white"
                    }`}
                >
                  Standard Trade
                </button>
                <button
                  onClick={() => setMode("time")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === "time" ? "bg-dark-card text-purple-accent border-t-2 border-purple-accent" : "text-gray-400 hover:text-white"
                    }`}
                >
                  Time Trade
                </button>
              </div>

              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b border-dark-border ${mode === "time" ? "bg-purple-500/10" : (type === "buy" ? "bg-green-500/10" : "bg-red-500/10")
                }`}>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {mode === "time" ? <Clock className="w-5 h-5" /> : (type === "buy" ? "Buy" : "Sell")} {stock.symbol}
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

                {/* Shared Stock Info */}
                <div className="rounded-lg bg-dark-hover p-4 border border-dark-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-blue-accent">{stock.symbol}</div>
                      <div className="text-sm text-blue-accent/70">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{formatCurrency(stock.price)}</div>
                      <div className={`text-sm ${stock.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                </div>

                {mode === "standard" ? (
                  // STANDARD MODE UI
                  <>
                    <div>
                      <label className="block text-sm font-medium text-blue-accent mb-2">Order Type</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setOrderType("market")} className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${orderType === "market" ? "bg-blue-gradient text-white shadow-blue-glow" : "bg-dark-hover text-blue-accent"}`}>Market</button>
                        <button type="button" onClick={() => setOrderType("limit")} className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${orderType === "limit" ? "bg-blue-gradient text-white shadow-blue-glow" : "bg-dark-hover text-blue-accent"}`}>Limit</button>
                      </div>
                    </div>

                    {orderType === "limit" && (
                      <div>
                        <label className="block text-sm font-medium text-blue-accent mb-2">Limit Price</label>
                        <input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder={stock.price.toFixed(2)} className="w-full px-4 py-2 rounded-lg bg-dark-hover border border-dark-border text-white focus:outline-none focus:border-blue-primary" />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-blue-accent mb-2">Quantity</label>
                      <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" className="w-full px-4 py-2 rounded-lg bg-dark-hover border border-dark-border text-white focus:outline-none focus:border-blue-primary" />
                    </div>

                    <div className="rounded-lg bg-dark-hover p-4 border border-dark-border space-y-2">
                      <div className="flex justify-between text-sm text-blue-accent/70"><span>Estimate</span><span className="text-white">{formatCurrency(estimatedCost)}</span></div>
                      <div className="flex justify-between font-bold text-white pt-2 border-t border-dark-border"><span>Total</span><span>{formatCurrency(totalCost)}</span></div>
                    </div>
                  </>
                ) : (
                  // TIME TRADE MODE UI
                  <>
                    <div>
                      <label className="block text-sm font-medium text-blue-accent mb-2">Duration (Seconds)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[60, 120, 180, 240, 300].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setDuration(s)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${duration === s ? "bg-purple-600 text-white shadow-lg" : "bg-dark-hover text-blue-accent hover:text-white"
                              }`}
                          >
                            {s}s
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-accent mb-2">Amount ($)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[50, 100, 150, 200, 500].map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => setAmount(a)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${amount === a ? "bg-green-600 text-white shadow-lg" : "bg-dark-hover text-blue-accent hover:text-white"
                              }`}
                          >
                            ${a}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-purple-500/10 p-4 border border-purple-500/20 text-center">
                      <p className="text-sm text-purple-200">
                        Trade <b>{stock.symbol}</b> for <b>{duration}s</b> at <b>${amount}</b>?
                      </p>
                      <p className="text-xs text-purple-300/70 mt-1">
                        Potential Payout: ${amount + (amount * 0.8)} (80% Profit)
                      </p>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg disabled:opacity-50 ${mode === "time"
                      ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/50"
                      : (type === "buy" ? "bg-green-500 hover:bg-green-600 shadow-green-500/50" : "bg-red-500 hover:bg-red-600 shadow-red-500/50")
                    }`}
                >
                  {isSubmitting ? "Processing..." : (mode === "time" ? "Execute Time Trade" : `${type === "buy" ? "Buy" : "Sell"} ${stock.symbol}`)}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
