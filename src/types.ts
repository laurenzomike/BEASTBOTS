import { User } from "firebase/auth";

export type BotStatus = "online" | "offline" | "error" | "auth-required";

export interface Workflow {
  id: number;
  trigger: string;
  action: string;
  prompt: string;
  active?: boolean;
}

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
    workflows?: Workflow[];
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
