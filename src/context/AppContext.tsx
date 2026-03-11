import React, { createContext, useContext, useState, useCallback } from "react";

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
}

interface AppContextType {
  user: UserProfile;
  setUser: (u: Partial<UserProfile>) => void;
  positions: Record<number, Position>;
  callCoin: (opinionId: number, side: "yes" | "no", coins: number) => void;
  postedCalls: PostedCall[];
  postCall: (call: Omit<PostedCall, "id" | "createdAt">) => void;
  notifications: AppNotification[];
  markAllRead: () => void;
  markRead: (id: number) => void;
  unreadCount: number;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  hasSeenHero: boolean;
  setHasSeenHero: (val: boolean) => void;
}

const defaultUser: UserProfile = {
  username: "johndoe",
  displayName: "JohnDoe",
  initials: "JD",
  bio: "Calling it like I see it 🔥",
  balance: 2500,
  joinDate: "Jan 2026",
};

const defaultNotifications: AppNotification[] = [
  {
    id: 1,
    type: "win",
    title: "You called it right! 🏆",
    body: 'You won 240 coins on "Is Kendrick\'s run the greatest?"',
    time: "2h ago",
    read: false,
    opinionId: 2,
  },
  {
    id: 2,
    type: "call_closing",
    title: "Call closing soon ⏳",
    body: '"Will Drake drop an album before summer?" closes in 2 hours',
    time: "3h ago",
    read: false,
    opinionId: 1,
  },
  {
    id: 3,
    type: "like",
    title: "vibecheck liked your comment",
    body: "Your take on the BTC prediction got 12 likes",
    time: "5h ago",
    read: false,
  },
  {
    id: 4,
    type: "new_caller",
    title: "New callers on your opinion 📣",
    body: '3 new people called on "Will Afrobeats dominate 2025?"',
    time: "1d ago",
    read: true,
    opinionId: 4,
  },
  {
    id: 5,
    type: "call_resolved",
    title: "Opinion resolved",
    body: '"Will BTC pass ETH in dev activity?" has been resolved — Yes won',
    time: "2d ago",
    read: true,
    opinionId: 5,
  },
  {
    id: 6,
    type: "mention",
    title: "goatdebater mentioned you",
    body: "@johndoe this is exactly what I was saying last week",
    time: "3d ago",
    read: true,
  },
  {
    id: 7,
    type: "gift",
    title: "Welcome gift credited 🎁",
    body: "1,000 coins added to your wallet. Start calling!",
    time: "Jan 2026",
    read: true,
  },
];

const AppContext = createContext<AppContextType | null>(null);

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<UserProfile>(defaultUser);
  const [positions, setPositions] = useState<Record<number, Position>>({
    1: { side: "yes", coins: 200 },
    3: { side: "no", coins: 150 },
    4: { side: "yes", coins: 300 },
    6: { side: "yes", coins: 100 },
    2: { side: "yes", coins: 250 },
    5: { side: "no", coins: 80 },
  });
  const [postedCalls, setPostedCalls] = useState<PostedCall[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(defaultNotifications);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [hasSeenHero, setHasSeenHero] = useState(false);

  const setUser = useCallback((updates: Partial<UserProfile>) => {
    setUserState((prev) => ({ ...prev, ...updates }));
  }, []);

  const callCoin = useCallback((opinionId: number, side: "yes" | "no", coins: number) => {
    setPositions((prev) => ({ ...prev, [opinionId]: { side, coins } }));
    setUserState((prev) => ({ ...prev, balance: Math.max(0, prev.balance - coins) }));
  }, []);

  const postCall = useCallback((call: Omit<PostedCall, "id" | "createdAt">) => {
    setPostedCalls((prev) => [
      { ...call, id: Date.now(), createdAt: new Date() },
      ...prev,
    ]);
    setUserState((prev) => ({ ...prev, balance: Math.max(0, prev.balance - call.stake) }));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const login = () => setIsLoggedIn(true);
  const logout = () => setIsLoggedIn(false);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
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
        logout,
        hasSeenHero,
        setHasSeenHero,
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
