import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
    opinion: { id: string; statement: string; topics?: { name: string; icon: string } };
    onClose: () => void;
}

const SHARE_OPTIONS = [
    { label: "WhatsApp", icon: "💬", color: "#25D366", action: (url: string, text: string) => `https://wa.me/?text=${encodeURIComponent(text + " " + url)}` },
    { label: "X", icon: "𝕏", color: "#000000", action: (url: string, text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { label: "Instagram", icon: "📸", color: "#E1306C", action: null }, // copy only
    { label: "Telegram", icon: "✈️", color: "#0088cc", action: (url: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { label: "Facebook", icon: "👤", color: "#1877F2", action: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
];

export function ShareSheet({ opinion, onClose }: Props) {
    const [copied, setCopied] = useState(false);
    const url = `${window.location.origin}/opinion/${opinion.id}`;
    const text = `"${opinion.statement}" — Call it on Callit 🎯`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = (option: typeof SHARE_OPTIONS[0]) => {
        if (!option.action) {
            handleCopy();
            toast("Copy the link and paste it on Instagram");
            return;
        }
        const shareUrl = option.action(url, text);
        window.open(shareUrl, "_blank");
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 300 }}
                    className="w-full max-w-lg bg-card rounded-t-2xl border-t border-border overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Handle */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="h-1 w-10 rounded-full bg-border" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                        <span className="text-sm font-bold text-foreground">Share this Call</span>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Preview */}
                    <div className="mx-4 my-4 p-4 rounded-xl bg-secondary/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-gold uppercase tracking-wider">
                                {opinion.topics?.icon} {opinion.topics?.name || "Callit"}
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                            {opinion.statement}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">callitmarket.com</p>
                    </div>

                    {/* Share options */}
                    <div className="grid grid-cols-5 gap-3 px-5 pb-4">
                        {SHARE_OPTIONS.map(opt => (
                            <button key={opt.label}
                                onClick={() => handleShare(opt)}
                                className="flex flex-col items-center gap-1.5">
                                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl border border-border bg-secondary/40 hover:bg-secondary transition-colors"
                                    style={{ borderColor: opt.color + "40" }}>
                                    {opt.icon}
                                </div>
                                <span className="text-[10px] text-muted-foreground">{opt.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Copy link */}
                    <div className="px-5 pb-8">
                        <div className="flex items-center gap-2 bg-secondary/40 rounded-xl border border-border p-3">
                            <span className="text-xs text-muted-foreground flex-1 truncate">{url}</span>
                            <button onClick={handleCopy}
                                className="flex items-center gap-1.5 text-xs font-bold text-gold hover:text-gold-hover transition-colors shrink-0">
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}