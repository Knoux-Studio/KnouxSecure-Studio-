
import { GoogleGenAI, Type } from "@google/genai";
import { SandboxResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * KnouxSecure Studio™ - Virtual Sandbox Service
 * 
 * Simulates script execution in a secure, isolated environment using Gemini 3.
 * Provides behavioral analysis and predicted output without executing code locally.
 */
export const runInSandbox = async (code: string, language: string): Promise<SandboxResult> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Simulate the execution of the following ${language} script in a secure sandbox environment. 
            Analyze its behavior and provide the expected standard output (stdout), any security warnings, and a simulated exit code.
            
            CODE:
            ${code}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        output: { type: Type.STRING, description: "The simulated stdout of the script." },
                        exitCode: { type: Type.NUMBER, description: "The status code of the process." },
                        duration: { type: Type.NUMBER, description: "Simulated duration in ms." },
                        securityWarnings: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Any destructive or suspicious actions observed."
                        }
                    },
                    required: ["output", "exitCode", "duration", "securityWarnings"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("Sandbox simulation returned no data.");
        
        return JSON.parse(text) as SandboxResult;
    } catch (error) {
        console.error("Sandbox simulation failed:", error);
        throw error;
    }
};
