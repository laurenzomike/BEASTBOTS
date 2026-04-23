import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { google } from "googleapis";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null
});

// Assume Firebase Admin is initialized in server.ts and is globally accessible here,
// or re-initialize if needed. For safety, we will re-init if not present.
import fs from "fs";
if (!admin.apps.length) {
    const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
}
const db = admin.firestore();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const executionWorker = new Worker('bot-execution', async (job: Job) => {
    const { uid, botType, actionIntent, aiReasoning } = job.data;
    console.log(`Processing execution for ${botType} - Intent: ${actionIntent}`);

    try {
        const botDoc = await db.collection("users").doc(String(uid)).collection("bots").doc(botType).get();
        const config = botDoc.data()?.config || {};

        let aiOutput = actionIntent;

        if (ai) {
            // Fetch knowledge files
            const filesSnap = await db.collection("users").doc(String(uid)).collection("bots").doc(botType).collection("files").get();
            const filesContext = filesSnap.docs.map(d => {
                const f = d.data();
                return f.content ? `--- Document: ${f.fileName} ---\n${f.content}\n` : "";
            }).filter(Boolean).join("\n");

            const prompt = `System Instruction: You are the ${botType} elite Bot. Decisive and technical.
USER COMMAND DIRECTIVES: ${config.systemDirective || "Maintain peak efficiency and data-driven objectivity."}

${filesContext ? `KNOWLEDGE BASE:\n${filesContext}\n` : ""}
Task: ${actionIntent}
Reasoning: ${aiReasoning || "Execute standard protocols."}

Output format:
- [ACTION] descriptive step
- [ANALYSIS] technical insight
- [OBJECTIVE: description] ONLY if you satisfy the SUCCESS DIRECTIVE above.

Keep it to 1-2 authoritative sentences.`;

            const aiResponse = await ai.models.generateContent({
                model: "gemini-3.1-pro-preview",
                contents: prompt,
                config: { temperature: 0.8 }
            });

            aiOutput = aiResponse.text || `[ANALYSIS] Maintaining standby status for ${botType}.`;

            // Execute actual platform logic (Stubbed for now, mapped in step 3)
            if (!config.enableLiveExecution) {
                 aiOutput = "[SIMULATED] " + aiOutput;
            }

            // Log to activities collection
            await db.collection("users").doc(String(uid)).collection("activities").add({
                userId: String(uid),
                botId: botType,
                botType: botType,
                text: aiOutput,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                type: aiOutput.startsWith('[ACTION]') ? 'action' : 'analysis'
            });
        }
        return { success: true, aiOutput };
    } catch (error) {
        console.error(`Worker failed processing ${job.id}:`, error);
        throw error;
    }
}, { connection });

executionWorker.on('completed', job => {
    console.log(`${job.id} has completed!`);
});

executionWorker.on('failed', (job, err) => {
    console.log(`${job?.id} has failed with ${err.message}`);
});
