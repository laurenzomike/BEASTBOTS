import { User } from "firebase/auth";

export type BotStatus = "online" | "offline" | "error" | "auth-required";

export interface Bot {
  id: string;
  name: string;
  type: string;
  status: BotStatus;
  autonomous?: boolean;
  config: {
    userGoal?: string;
    winCondition?: string;
    systemDirective?: string;
    winCount?: number;
    schedule?: string;
    responsibilities?: string[];
    isInitialized?: boolean;
    [key: string]: any;
  };
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Activity {
  id: string;
  userId: string;
  botId: string;
  botType: string;
  text: string;
  timestamp: any;
  type?: 'action' | 'analysis' | 'error';
}

export interface Memory {
  id: string;
  botId: string;
  fact: string;
  sourceLogId?: string;
  createdAt: any;
}

export interface BotType {
  id: string;
  name: string;
  role: string;
  authType: "oauth" | "apikey";
  expertise: string;
}
