import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { User } from "@supabase/supabase-js";

export interface Position {
  side: "yes" | "no";
  coins: number;
}

export interface PostedCall {
  id: number;
  question: string;
  declared: "yes" | "no";
  category: string;
  duration: string;
  stake: number;
  resolutionType: "crowd" | "event" | "metric";
  createdAt: Date;
}

export interface AppNotification {
  id: number;
  type: "win" | "call_resolved" | "call_closing" | "like" | "mention" | "new_caller" | "gift";
  title: string;
  body: string;
  time: string;
  read: boolean;
  opinionId?: number;
}

interface UserProfile {
  username: string;
  displayName: string;
  initials: string;
  bio: string;
  balance: number;
  joinDate: string;
  avatar?: string;
  wins: number;
  losses: number;
  total_calls: number;
}

interface AppContextType {
  user: UserProfile;
  setUser: (u: Partial<UserProfile>) => void;
  supabaseUser: User | null;
  positions: Record<number, Position>;
  callCoin: (opinionId: number, side: "yes" | "no", coins: number) => void;
  postedCalls: PostedCall[];
  postCall: (call: Omit<PostedCall, "id" | "createdAt">) => void;
  notifications: AppNotification[];
  markAllRead: () => void;
  markRead: (id: number) => void;
  unreadCount: number;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (email: string, password: string, username: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  hasSeenHero: boolean;
  setHasSeenHero: (val: boolean) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const defaultUser: UserProfile = {
  username: "", displayName: "", initials: "",
  bio: "", balance: 0, joinDate: "",
  wins: 0, losses: 0, total_calls: 0,
};

const defaultNotifications: AppNotification[] = [
  { id: 7, type: "gift", title: "Welcome to Callit", body: "Start making your calls!", time: "Just now", read: false },
];

const AppContext = createContext<AppContextType | null>(null);

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUserState] = useState<UserProfile>(defaultUser);
  const [positions, setPositions] = useState<Record<number, Position>>({});
  const [postedCalls, setPostedCalls] = useState<PostedCall[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(defaultNotifications);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ── hasSeenHero — persisted to localStorage so refresh doesn't reset it ──
  const [hasSeenHero, _setHasSeenHero] = useState<boolean>(() => {
    try { return localStorage.getItem("callit-seen-hero") === "true"; }
    catch { return false; }
  });

  const setHasSeenHero = useCallback((val: boolean) => {
    try {
      if (val) localStorage.setItem("callit-seen-hero", "true");
      else localStorage.removeItem("callit-seen-hero");
    } catch { }
    _setHasSeenHero(val);
  }, []);

  // ── Theme — persisted, uses callit-theme key to match index.html script ──
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("callit-theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch { }
    return "dark"; // default dark
  });

  // Apply theme class to <html> on change
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    try { localStorage.setItem("callit-theme", theme); } catch { }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }, []);

  // ── Auth state ────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setIsLoggedIn(true);
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setIsLoggedIn(true);
        fetchProfile(session.user.id);
      } else {
        setSupabaseUser(null);
        setIsLoggedIn(false);
        setUserState(defaultUser);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles").select("*").eq("id", userId).single();

    if (data && !error) {
      const profile: UserProfile = {
        username: data.username,
        displayName: data.username,
        initials: data.username?.slice(0, 2).toUpperCase() || "??",
        bio: data.bio || "Calling it like I see it",
        balance: data.balance ?? data.coins ?? 1000,
        joinDate: new Date(data.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        avatar: data.avatar_url,
        wins: data.wins || 0,
        losses: data.losses || 0,
        total_calls: data.total_calls || 0,
      };
      setUserState(profile);
      return profile;
    }
    return defaultUser;
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user?.id) throw new Error("Login failed");
    const profile = await fetchProfile(data.user.id);
    setSupabaseUser(data.user);
    setIsLoggedIn(true);
    return profile;
  };

  const signup = async (email: string, password: string, username: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } },
    });
    if (authError) throw authError;
    const userId = authData.user?.id;
    if (!userId) throw new Error("User ID not returned");

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, username, email, balance: 1000 })
      .select().single();
    if (profileError) throw profileError;

    const profile: UserProfile = {
      username: profileData.username,
      displayName: profileData.username,
      initials: profileData.username?.slice(0, 2).toUpperCase() || "??",
      bio: profileData.bio || "Calling it like I see it",
      balance: profileData.balance ?? 1000,
      joinDate: new Date(profileData.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      avatar: profileData.avatar_url,
      wins: profileData.wins || 0,
      losses: profileData.losses || 0,
      total_calls: profileData.total_calls || 0,
    };
    setUserState(profile);
    setSupabaseUser(authData.user);
    setIsLoggedIn(true);
    return profile;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserState(defaultUser);
    setSupabaseUser(null);
    setIsLoggedIn(false);
  };

  const setUser = useCallback((updates: Partial<UserProfile>) => {
    setUserState(prev => ({ ...prev, ...updates }));
  }, []);

  const callCoin = useCallback((opinionId: number, side: "yes" | "no", coins: number) => {
    setPositions(prev => ({ ...prev, [opinionId]: { side, coins } }));
  }, []);

  const postCall = useCallback((call: Omit<PostedCall, "id" | "createdAt">) => {
    setPostedCalls(prev => [{ ...call, id: Date.now(), createdAt: new Date() }, ...prev]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      user, setUser, supabaseUser,
      positions, callCoin,
      postedCalls, postCall,
      notifications, markAllRead, markRead, unreadCount,
      isLoggedIn, login, signup, logout,
      hasSeenHero, setHasSeenHero,
      theme, toggleTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppContextProvider");
  return ctx;
};