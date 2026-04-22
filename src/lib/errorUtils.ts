import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface ErrorInfo {
  msg: string;
  type: 'auth' | 'rate-limit' | 'permission' | 'network' | 'unknown';
  suggestedStatus?: 'online' | 'offline' | 'error' | 'auth-required';
  action?: string;
  actionFn?: () => void;
}

export const getActionableErrorMessage = (err: any): ErrorInfo => {
  const message = (err?.message || String(err)).toLowerCase();
  
  // Authentication Errors
  if (message.includes("401") || message.includes("unauthorized") || message.includes("unauthenticated") || message.includes("token expired") || message.includes("invalid key")) {
     return { 
       msg: "AUTH_FAILURE: Security tokens expired or invalid credentials detected.", 
       type: 'auth',
       suggestedStatus: 'auth-required',
       action: "Renew Access"
     };
  }

  // Rate Limiting / Quota
  if (message.includes("429") || message.includes("too many requests") || message.includes("quota") || message.includes("rate limit") || message.includes("rate_limit")) {
    return { 
      msg: "RATE_LIMIT: Network throttling active. Efficiency reduced to 0%.", 
      type: 'rate-limit',
      suggestedStatus: 'error',
      action: "Sync Cooldown"
    };
  }

  // Permission Denied (403)
  if (message.includes("403") || message.includes("permission")) {
    return { 
      msg: "PERMISSION_DENIED: Access level insufficient for requested operation.", 
      type: 'permission',
      suggestedStatus: 'error',
      action: "Audit Roles"
    };
  }
  
  // Connection / Network
  if (message.includes("connection") || message.includes("network") || message.includes("fetch") || message.includes("failed to fetch")) {
    return { 
      msg: "LINK_LOST: Peer connection unstable. Retrying handshake...", 
      type: 'network',
      suggestedStatus: 'error',
      action: "Forced Pulse"
    };
  }

  return { 
    msg: "SYSTEM_REJECT: Execution aborted due to internal logic conflict.", 
    type: 'unknown',
    suggestedStatus: 'error',
    action: "Restart Node"
  };
};

export const handleBotErrorTransition = async (botId: string, userId: string, botType: string, err: any) => {
  const errorInfo = getActionableErrorMessage(err);
  
  try {
    // 1. Update status in Firestore
    if (errorInfo.suggestedStatus) {
      const botRef = doc(db, "users", userId, "bots", botId);
      await setDoc(botRef, { 
        status: errorInfo.suggestedStatus,
        updatedAt: serverTimestamp() 
      }, { merge: true });
    }

    // 2. Log high-priority activity
    const activityRef = collection(db, "users", userId, "activities");
    await addDoc(activityRef, {
      botId: botId,
      botType: botType,
      userId: userId,
      text: `[TERMINAL_ALARM] ${errorInfo.msg}`,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("Critical: Error transition logic failed", e);
  }
  return errorInfo;
};
