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
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  hasSeenHero: boolean;
  setHasSeenHero: (val: boolean) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const defaultUser: UserProfile = {
  username: "",
  displayName: "",
  initials: "",
  bio: "",
  balance: 0,
  joinDate: "",
  wins: 0,
  losses: 0,
  total_calls: 0,
};

const defaultNotifications: AppNotification[] = [
  {
    id: 7,
    type: "gift",
    title: "Welcome to Callit",
    body: "Start making your calls!",
    time: "Just now",
    read: false,
  },
];

const AppContext = createContext<AppContextType | null>(null);

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUserState] = useState<UserProfile>(defaultUser);
  const [positions, setPositions] = useState<Record<number, Position>>({});
  const [postedCalls, setPostedCalls] = useState<PostedCall[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(defaultNotifications);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSeenHero, setHasSeenHero] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });

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
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data && !error) {
      setUserState({
        username: data.username,
        displayName: data.username,
        initials: data.username.slice(0, 2).toUpperCase(),
        bio: data.bio || "Calling it like I see it",
        balance: 0,
        joinDate: new Date(data.created_at).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        avatar: data.avatar_url,
        wins: data.wins || 0,
        losses: data.losses || 0,
        total_calls: data.total_calls || 0,
      });
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setUser = useCallback((updates: Partial<UserProfile>) => {
    setUserState((prev) => ({ ...prev, ...updates }));
  }, []);

  const callCoin = useCallback((opinionId: number, side: "yes" | "no", coins: number) => {
    setPositions((prev) => ({ ...prev, [opinionId]: { side, coins } }));
  }, []);

  const postCall = useCallback((call: Omit<PostedCall, "id" | "createdAt">) => {
    setPostedCalls((prev) => [
      { ...call, id: Date.now(), createdAt: new Date() },
      ...prev,
    ]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        supabaseUser,
        positions,
        callCoin,
        postedCalls,
        postCall,
        notifications,
        markAllRead,
        markRead,
        unreadCount,
        isLoggedIn,
        login,
        signup,
        logout,
        hasSeenHero,
        setHasSeenHero,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppContextProvider");
  return ctx;
};