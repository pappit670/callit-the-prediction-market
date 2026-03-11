import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Bell, Shield, Trash2, Check, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import { toast } from "@/hooks/use-toast";

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4 },
  }),
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, setUser } = useApp();

  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [saved, setSaved] = useState(false);

  // Notification prefs
  const [notifWins, setNotifWins] = useState(true);
  const [notifClosing, setNotifClosing] = useState(true);
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifNewCallers, setNotifNewCallers] = useState(false);
  const [notifMarketing, setNotifMarketing] = useState(false);

  const handleSave = () => {
    setUser({ displayName, username, bio });
    setSaved(true);
    toast({
      title: "Profile updated",
      description: "Your changes have been saved.",
    });
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 pb-24 space-y-10">
        {/* Back + Title */}
        <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-body">Back to Profile</span>
          </button>
          <h1 className="font-headline text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Manage your account and preferences</p>
        </motion.div>

        {/* Profile section */}
        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible" className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-gold" />
            <h2 className="font-headline text-base font-semibold text-foreground">Profile</h2>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer">
                <div className="h-16 w-16 rounded-full bg-secondary border-[3px] border-gold flex items-center justify-center text-xl font-bold text-muted-foreground font-headline">
                  {user.initials}
                </div>
                <span className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-body font-medium text-foreground">
                  Change
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground font-body">{user.displayName}</p>
                <p className="text-xs text-muted-foreground font-body">@{user.username}</p>
              </div>
            </div>

            {/* Display name */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-body">
                Display Name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-body">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-body">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  className="w-full rounded-lg border border-border bg-secondary pl-8 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-body">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => { if (e.target.value.length <= 120) setBio(e.target.value); }}
                rows={3}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all resize-none"
              />
              <p className="text-[11px] text-muted-foreground text-right mt-1 font-body">{bio.length}/120</p>
            </div>

            {/* Save */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className={`w-full rounded-full py-3 text-sm font-semibold transition-colors ${
                saved
                  ? "bg-yes text-white"
                  : "bg-gold text-primary-foreground hover:bg-gold-hover"
              }`}
            >
              {saved ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" /> Saved!
                </span>
              ) : (
                "Save Changes"
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Notifications section */}
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible" className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-gold" />
            <h2 className="font-headline text-base font-semibold text-foreground">Notifications</h2>
          </div>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {[
              { label: "Wins & payouts", sub: "When you win a call", value: notifWins, set: setNotifWins },
              { label: "Calls closing", sub: "When your calls are about to close", value: notifClosing, set: setNotifClosing },
              { label: "Mentions", sub: "When someone mentions you", value: notifMentions, set: setNotifMentions },
              { label: "New callers", sub: "When someone joins your opinion", value: notifNewCallers, set: setNotifNewCallers },
              { label: "Updates & tips", sub: "Product news and tips", value: notifMarketing, set: setNotifMarketing },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground font-body">{item.label}</p>
                  <p className="text-xs text-muted-foreground font-body">{item.sub}</p>
                </div>
                <button
                  onClick={() => item.set(!item.value)}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                    item.value ? "bg-gold" : "bg-muted"
                  }`}
                >
                  <motion.div
                    animate={{ x: item.value ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Account section */}
        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible" className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-gold" />
            <h2 className="font-headline text-base font-semibold text-foreground">Account</h2>
          </div>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            <button className="flex items-center justify-between w-full px-6 py-4 hover:bg-secondary/50 transition-colors">
              <div className="text-left">
                <p className="text-sm font-medium text-foreground font-body">Change Password</p>
                <p className="text-xs text-muted-foreground font-body">Update your login credentials</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="flex items-center justify-between w-full px-6 py-4 hover:bg-secondary/50 transition-colors">
              <div className="text-left">
                <p className="text-sm font-medium text-foreground font-body">Privacy Settings</p>
                <p className="text-xs text-muted-foreground font-body">Control who sees your calls</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="flex items-center justify-between w-full px-6 py-4 hover:bg-secondary/50 transition-colors">
              <div className="text-left">
                <p className="text-sm font-medium text-foreground font-body">Linked Accounts</p>
                <p className="text-xs text-muted-foreground font-body">Connect Google, X / Twitter</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-body bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Coming Soon</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="h-4 w-4 text-destructive" />
            <h2 className="font-headline text-base font-semibold text-destructive">Danger Zone</h2>
          </div>
          <div className="bg-card border border-destructive/30 rounded-2xl p-6">
            <p className="text-sm text-muted-foreground font-body mb-4">
              Deleting your account will permanently remove all your calls, coins, and history. This cannot be undone.
            </p>
            <button
              disabled
              className="rounded-full border border-destructive/40 px-5 py-2 text-sm font-semibold text-destructive/50 cursor-not-allowed font-body"
            >
              Delete Account — Coming Soon
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
