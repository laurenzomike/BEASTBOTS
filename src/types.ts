import { User } from "firebase/auth";
import { Timestamp, FieldValue } from "firebase/firestore";

export type BotStatus = "online" | "offline" | "error" | "auth-required";

export interface Bot {
  id: string;
  name: string;
  type: string;
  status: BotStatus;
  avatar?: string;
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
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

export interface Activity {
  id: string;
  userId: string;
  botId: string;
  botType: string;
  text: string;
  timestamp: Timestamp | FieldValue;
  type?: 'action' | 'analysis' | 'error';
}

export interface Memory {
  id: string;
  botId: string;
  fact: string;
  sourceLogId?: string;
  createdAt: Timestamp | FieldValue;
}

export interface Responsibility {
  id: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

export interface ParameterSchema {
  id: string;
  label: string;
  type: 'string' | 'number' | 'toggle' | 'select';
  defaultValue: any;
  min?: number;
  max?: number;
  options?: string[];
  description: string;
}

export interface BotType {
  id: string;
  name: string;
  role: string;
  authType: "oauth" | "apikey";
  expertise: string;
  scopes?: string[];
  responsibilities?: Responsibility[];
  parameters?: ParameterSchema[];
}

export interface Workflow {
  id: number;
  trigger: string;
  action: string;
  prompt: string;
  active: boolean;
}

export interface BotFile {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  contentSummary: string;
  createdAt: Timestamp | FieldValue;
}

export interface Milestone {
  id: string;
  title: string;
  createdAt: Timestamp | FieldValue;
}

export interface PlatformInfo {
  connected: boolean;
  accountName: string;
  status: BotStatus;
  stats: Record<string, string>;
}
