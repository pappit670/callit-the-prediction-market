import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

/* ── Coin rain (reused from Wallet) ── */
const CoinParticle = ({ delay, x }: { delay: number; x: number }) => (
  <motion.div
    className="absolute text-gold text-2xl pointer-events-none"
    initial={{ top: -40, left: `${x}%`, opacity: 1, rotate: 0 }}
    animate={{ top: "110%", opacity: 0, rotate: 360 }}
    transition={{ duration: 2.5, delay, ease: "easeOut" }}
  >
    <Coins className="h-6 w-6" />
  </motion.div>
);

const coinParticle
