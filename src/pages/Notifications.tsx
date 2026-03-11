import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, ThumbsUp, AtSign, Bell, Star, CheckCheck, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import type { AppNotification } from "@/context/AppContext";

const notifIcon: Record<AppNotification["type"], React.ReactNode> = {
  win: <Trophy className="h-4 w-4" />,
  call_resolved: <CheckCheck className="h-4 w-4" />,
  call_closing: <Clock className="h-4 w-4" />,
  like: <ThumbsUp className="h-4 w-4" />,
  mention: <AtSign className="h-4 w-4" />,
  new_caller: <Bell className="h-4 w-4" />,
  gift: <Gift className="h-4 w-4" />,
};

const notifIconBg: Record<AppNotification["type"], string> = {
  win: "bg-yes/15 text-yes",
  call_resolved: "bg-muted text-muted-foreground",
  call_closing: "bg-gold/15 text-gold",
  like: "bg-gold/15 text-gold",
  mention: "bg-gold/15 text-gold",
  new_caller: "bg-gold/15 text-gold",
  gift: "bg-yes/15 text-yes",
};

type Filter = "All" | "Wins" | "Calls" | "Mentions";
const filters: Filter[] = ["All", "Wins", "Calls", "Mentions"];

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, markAllRead, markRead, unreadCount } = useApp();
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const filtered = notifications.filter((n) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Wins") return n.type === "win" || n.type === "call_resolved";
    if (activeFilter === "Calls") return n.type === "call_closing" || n.type === "new_caller";
    if (activeFilter === "Mentions") return n.type === "mention" || n.type === "like";
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <h1 className="font-headline text-3xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground font-body mt-1">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-gold hover:text-gold-hover transition-colors font-body mt-1"
            >
              Mark all read
            </button>
          )}
        </motion.div>

        {/* Filter pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex gap-2 mb-6 flex-wrap"
        >
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                activeFilter === f
                  ? "bg-gold text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </motion.div>

        {/* List */}
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-body">No notifications here</p>
              </motion.div>
            ) : (
              filtered.map((notif, i) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  onClick={() => {
                    markRead(notif.id);
                    if (notif.opinionId) navigate(`/opinion/${notif.opinionId}`);
                  }}
                  className={`flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition-all duration-200 hover:border-gold/50 ${
                    notif.read
                      ? "bg-card border-border"
                      : "bg-card border-gold/30 shadow-sm"
                  }`}
                >
                  {/* Icon */}
                  <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${notifIconBg[notif.type]}`}>
                    {notifIcon[notif.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold font-body ${notif.read ? "text-muted-foreground" : "text-foreground"}`}>
                        {notif.title}
                      </p>
                      <span className="text-[11px] text-muted-foreground font-body shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-body mt-0.5 leading-relaxed">{notif.body}</p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-gold mt-1" />
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
