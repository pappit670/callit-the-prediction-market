// src/types/index.ts

export interface Topic {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export interface Profile {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  reputation_score: number;
}

export interface Opinion {
  id: string;
  statement: string;
  description: string;
  options: string[];
  end_time: string;
  call_count: number;
  follower_count: number;
  rising_score: number;
  icon_url: string;
  image_url: string;
  source_name: string | null;
  source_url: string | null;
  topics?: Topic;
  profiles?: Profile;
  status: string;
  created_at: string;
}

export interface Call {
  id: string;
  user_id: string;
  opinion_id: string;
  chosen_option: string;
  stake_amount: number;
  potential_payout: number;
  status: string;
  created_at: string;
  opinions?: Opinion;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    reputation_score?: number;
  };
  opinions?: Opinion;
}

export interface ActivityItem {
  id: string;
  type: "call" | "debate" | "position";
  user: string;
  action: string;
  target: string;
  time: string;
  opinionId?: string;
}
