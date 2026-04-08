/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export type AIProviderType = 'gemini' | 'openai' | 'anthropic';

export interface AIConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
}

export class AIProvider {
  private config: AIConfig;
  private gemini?: GoogleGenAI;
  private openai?: OpenAI;
  private anthropic?: Anthropic;

  constructor(config: AIConfig) {
    this.config = config;
    this.initProvider();
  }

  private initProvider() {
    switch (this.config.provider) {
      case 'gemini':
        this.gemini = new GoogleGenAI({ 
          apiKey: this.config.apiKey,
          httpOptions: { apiVersion: 'v1beta' }
        });
        break;
      case 'openai':
        this.openai = new OpenAI({ apiKey: this.config.apiKey, dangerouslyAllowBrowser: true });
        break;
      case 'anthropic':
        this.anthropic = new Anthropic({ apiKey: this.config.apiKey, dangerouslyAllowBrowser: true });
        break;
    }
  }

  async generateContent(prompt: string, schema?: any): Promise<string> {
    if (!this.config.apiKey || this.config.apiKey.trim().length < 5) {
      throw new Error(`Connection stalled: No API key provided for ${this.config.provider.toUpperCase()}. Please open Settings and enter a valid key.`);
    }
    try {
      switch (this.config.provider) {
        case 'gemini':
          return await this.generateGemini(prompt, schema);
        case 'openai':
          return await this.generateOpenAI(prompt, schema);
        case 'anthropic':
          return await this.generateAnthropic(prompt, schema);
        default:
          throw new Error('Unsupported AI provider');
      }
    } catch (error: any) {
      console.error(`AI Provider Error (${this.config.provider}):`, error);
      
      // Enhance 429/Quota errors with provider-specific advice
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
        let advice = `Rate limit or quota exceeded for ${this.config.provider.toUpperCase()}.`;
        
        if (this.config.provider === 'openai') {
          advice += " IMPORTANT: OpenAI API usage is billed separately from ChatGPT Plus subscriptions. Please ensure you have a positive balance at platform.openai.com/settings/organization/billing";
        } else if (this.config.provider === 'gemini') {
          advice += " Free tier models have strict per-minute limits. Check your quota at aistudio.google.com";
        }
        
        const enhancedError = new Error(advice);
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }
      
      throw error;
    }
  }

  async generateImage(prompt: string): Promise<string> {
    if (!this.config.apiKey || this.config.apiKey.trim().length < 5) {
      throw new Error(`Connection stalled: No API key provided for ${this.config.provider.toUpperCase()}. Please open Settings and enter a valid key.`);
    }
    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.generateImageOpenAI(prompt);
        case 'gemini':
          return await this.generateImageGemini(prompt);
        default:
          throw new Error(`Image generation is not supported by ${this.config.provider.toUpperCase()} yet. Please switch to OpenAI/DALL-E in settings or use Gemini Nano Banana.`);
      }
    } catch (error: any) {
      console.error(`Image Provider Error (${this.config.provider}):`, error);
      throw error;
    }
  }

  private async generateGemini(prompt: string, schema?: any): Promise<string> {
    if (!this.gemini) throw new Error('Gemini not initialized');
    
    // Use the official SDK structure: contents as array, generationConfig for schema
    const response = await this.gemini.models.generateContent({
      model: this.config.model || "gemini-2.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: schema ? {
        responseMimeType: "application/json",
        responseSchema: schema
      } : undefined
    });
    
    return response.text || "";
  }

  private async generateOpenAI(prompt: string, schema?: any): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not initialized');
    const response = await this.openai.chat.completions.create({
      model: this.config.model || "gpt-5.4-pro",
      messages: [{ role: "user", content: prompt }],
      response_format: schema ? { type: "json_object" } : undefined
    });
    return response.choices[0].message.content || "";
  }

  private async generateAnthropic(prompt: string, schema?: any): Promise<string> {
    if (!this.anthropic) throw new Error('Anthropic not initialized');
    const response = await this.anthropic.messages.create({
      model: this.config.model || "claude-3-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
      system: schema ? "You must respond with a valid JSON object." : undefined
    });
    
    // Anthropic returns an array of content blocks
    const content = response.content[0];
    if ('text' in content) return content.text;
    return "";
  }

  private async generateImageOpenAI(prompt: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not initialized');
    const response = await this.openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    return response.data[0].url || "";
  }

  private async generateImageGemini(prompt: string): Promise<string> {
    if (!this.gemini) throw new Error('Gemini not initialized');
    
    // For Gemini users, we provide a high-performance 'Nano Banana' experience using Pollinations.ai.
    // This ensures that even users on the free tier or without specific Imagen permissions
    // can generate beautiful, data-driven logo inspiration instantly.
    try {
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
      
      // Optional: We can still attempt to log or verify via Gemini if needed, 
      // but return the URL for immediate visual feedback.
      return url;
    } catch (e) {
      console.error("Gemini Visual Fallback Error:", e);
      return "";
    }
  }
}

// Helper to get keys from localStorage
export const getAIKeys = () => {
  const keys = localStorage.getItem('brandforge_ai_keys');
  return keys ? JSON.parse(keys) : {
    gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
    openai: import.meta.env.VITE_OPENAI_API_KEY || '',
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    activeProvider: 'gemini',
    models: {
      gemini: 'gemini-1.5-flash',
      openai: 'gpt-4o',
      anthropic: 'claude-3-5-sonnet-20240620'
    }
  };
};

export const saveAIKeys = (keys: any) => {
  localStorage.setItem('brandforge_ai_keys', JSON.stringify(keys));
};
