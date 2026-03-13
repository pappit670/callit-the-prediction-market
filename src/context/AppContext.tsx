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
