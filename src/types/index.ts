export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: number;
  model?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
}

export interface AppConfig {
  geminiCliPath?: string;
  apiKey?: string;
  selectedModel: string;
  isSetupComplete: boolean;
}

export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  available: boolean;
}
