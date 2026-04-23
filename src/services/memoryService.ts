import { collection, addDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Memory } from "../types";

export const saveMemory = async (userId: string, botId: string, fact: string, sourceLogId?: string) => {
  const memRef = collection(db, "users", userId, "bots", botId, "memories");
  await addDoc(memRef, {
    fact,
    sourceLogId,
    createdAt: new Date()
  });
};

export const getRelevantMemories = async (userId: string, botId: string, count: number = 5): Promise<Memory[]> => {
  const memRef = collection(db, "users", userId, "bots", botId, "memories");
  const q = query(memRef, orderBy("createdAt", "desc"), limit(count));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    botId,
    ...doc.data()
  } as Memory));
};
