import { User } from "firebase/auth";
import { FieldValue } from "firebase/firestore";

export type BotStatus = "online" | "offline" | "error" | "auth-required";

export interface Workflow {
  id: string;
  name?: string;
  trigger: string;
  action: string;
  status?: "active" | "paused";
}

export interface BotConfig {
  userGoal?: string;
  winCondition?: string;
  systemDirective?: string;
  winCount?: number | FieldValue;
  schedule?: string;
  scheduleType?: string;
  intervalMs?: number;
  responsibilities?: string[];
  isInitialized?: boolean;
  workflows?: Workflow[];
  strategy?: string;
  parameters?: Record<string, string>;
  autoResponseEnabled?: boolean;
  responseTone?: string;
  responseSignature?: string;
  temperature?: number;
}

export interface Bot {
  id: string;
  name: string;
  type: string;
  status: BotStatus;
  autonomous?: boolean;
  config: BotConfig;
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

export interface BotType {
  id: string;
  name: string;
  role: string;
  authType: "oauth" | "apikey";
  expertise: string;
}
