
import { GoogleGenAI, Type } from "@google/genai";
import { SecurityIssue } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeCodeWithAI = async (code: string): Promise<SecurityIssue[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Analyze the following script for security vulnerabilities, dangerous commands, or obfuscation patterns. Return findings as a JSON array of objects with properties: line (number), type (DANGEROUS_COMMAND, OBFUSCATION, or SUSPICIOUS_PATTERN), description (string), and severity (LOW, MEDIUM, HIGH).\n\nCODE:\n${code}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            line: { type: Type.NUMBER },
                            type: { type: Type.STRING },
                            description: { type: Type.STRING },
                            severity: { type: Type.STRING }
                        },
                        required: ["line", "type", "description", "severity"]
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text) as SecurityIssue[];
    } catch (error) {
        console.error("AI Analysis failed:", error);
        return [];
    }
};
