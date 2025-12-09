"use client";

import { X, Lock, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
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
                        <div className="w-full max-w-sm bg-dark-card border border-red-500/30 rounded-xl p-6 shadow-2xl relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                    <Lock className="w-8 h-8 text-red-500" />
                                </div>

                                <h2 className="text-xl font-bold text-white mb-2">Withdraw Funds</h2>

                                <div className="text-gray-400 text-sm mb-6 space-y-2">
                                    <p>
                                        To protect your assets, withdrawals are processed manually.
                                    </p>
                                    <p className="text-blue-400 font-medium flex items-center justify-center gap-1">
                                        Please contact support to proceed.
                                    </p>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-500/20"
                                >
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
