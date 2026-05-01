// src/components/NotificationHub.tsx
// Floating pill notification hub for Callit.
// Fixed position top-right, expands on tap/click.
// Minimal, non-intrusive, dark base.

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Radio, TrendingUp, User, CheckCircle2 } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────
interface Notification {
  id: string;
  type: "market_alert" | "match_event" | "personal" | "resolution" | "system";
  title: string;
  body: string;
  opinion_id?: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<Notification["type"], any> = {
  market_alert: TrendingUp,
  match_event:  Radio,
  personal:     User,
  resolution:   CheckCircle2,
  system:       Bell,
};

const TYPE_COLOR: Record<Notification["type"], string> = {
  market_alert: "#F5C518",
  match_event:  "#DC2626",
  personal:     "#2563EB",
  resolution:   "#22C55E",
  system:       "#6B7280",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ── Notification Item ──────────────────────────────────────────
function NotifItem({ notif, onRead, onClick }: {
  notif: Notification;
  onRead: (id: string) => void;
  onClick: () => void;
}) {
  const Icon = TYPE_ICON[notif.type] ?? Bell;
  const color = TYPE_COLOR[notif.type] ?? "#6B7280";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      onClick={() => { onRead(notif.id); onClick(); }}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/40 border-b border-border/30 last:border-0 ${
        !notif.read ? "bg-secondary/20" : ""
      }`}
    >
      <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: color + "15" }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold leading-snug ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
            {notif.title}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(notif.created_at)}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
      </div>
      {!notif.read && (
        <div className="h-1.5 w-1.5 rounded-full bg-[#F5C518] shrink-0 mt-2" />
      )}
    </motion.button>
  );
}

// ── Main Component ─────────────────────────────────────────────
export function NotificationHub() {
  const { user, isLoggedIn } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "markets" | "personal">("all");
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  // Fetch notifications
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setNotifications((data || []) as Notification[]);
    };

    fetch();

    // Subscribe to real-time new notifications
    const channel = supabase
      .channel(`notifs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLoggedIn, user?.id]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
  };

  const filtered = notifications.filter(n => {
    if (activeTab === "all") return true;
    if (activeTab === "markets") return ["market_alert", "match_event", "resolution"].includes(n.type);
    if (activeTab === "personal") return ["personal", "system"].includes(n.type);
    return true;
  });

  if (!isLoggedIn) return null;

  return (
    <div ref={ref} className="fixed top-4 right-16 z-[100] md:right-20" style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
      {/* Pill button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border shadow-lg hover:border-foreground/30 transition-all"
      >
        <Bell className="h-3.5 w-3.5 text-foreground" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.div
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 h-4 min-w-4 flex items-center justify-center rounded-full text-[9px] font-black text-black"
              style={{ background: "#F5C518" }}
            >
              {unread > 9 ? "9+" : unread}
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-[340px] max-w-[calc(100vw-24px)] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "min(480px, 70vh)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-semibold text-[#F5C518] hover:opacity-80 transition-opacity"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {(["all", "markets", "personal"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${
                    activeTab === tab
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(min(480px, 70vh) - 100px)" }}>
              <AnimatePresence initial={false}>
                {filtered.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2 py-10 text-muted-foreground"
                  >
                    <Bell className="h-8 w-8 opacity-20" />
                    <p className="text-xs">No notifications yet</p>
                  </motion.div>
                ) : (
                  filtered.map(n => (
                    <NotifItem
                      key={n.id}
                      notif={n}
                      onRead={markRead}
                      onClick={() => {
                        if (n.opinion_id) navigate(`/opinion/${n.opinion_id}`);
                        setOpen(false);
                      }}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
