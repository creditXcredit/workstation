/**
 * LLM Integration for stackBrowserAgent
 * Supports both Ollama and other LLM libraries for local AI capabilities
 */

import { logger } from './logger';
import * as http from 'http';
import * as https from 'https';

// ========================
// TYPES
// ========================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  provider: 'ollama' | 'llm' | 'custom';
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason?: string;
}

export interface ModelInfo {
  name: string;
  size: string;
  modified: Date;
  digest: string;
}

// ========================
// PROMPT TEMPLATES
// ========================

export class PromptTemplates {
  /**
   * Code analysis template
   */
  static codeAnalysis(code: string, language: string): string {
    return `Analyze the following ${language} code and provide:
1. Summary of what the code does
2. Potential bugs or issues
3. Performance concerns
4. Security vulnerabilities
5. Suggestions for improvement

Code:
\`\`\`${language}
${code}
\`\`\`

Provide a detailed analysis:`;
  }

  /**
   * Code generation template
   */
  static codeGeneration(description: string, language: string): string {
    return `Generate ${language} code based on the following description:

${description}

Requirements:
- Write clean, production-ready code
- Include error handling
- Add inline comments for complex logic
- Follow best practices for ${language}

Code:`;
  }

  /**
   * Task planning template
   */
  static taskPlanning(task: string, context?: string): string {
    return `Break down the following task into actionable steps:

Task: ${task}

${context ? `Context: ${context}` : ''}

Provide:
1. High-level approach
2. Detailed step-by-step plan
3. Dependencies between steps
4. Estimated complexity for each step
5. Potential risks or challenges

Plan:`;
  }

  /**
   * Error diagnosis template
   */
  static errorDiagnosis(error: string, context: string): string {
    return `Diagnose the following error and provide solutions:

Error: ${error}

Context: ${context}

Provide:
1. Root cause analysis
2. Why this error occurred
3. Step-by-step solution
4. Prevention strategies
5. Related best practices

Analysis:`;
  }

  /**
   * Documentation generation template
   */
  static documentation(code: string, language: string): string {
    return `Generate comprehensive documentation for the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Include:
1. Overview/purpose
2. Parameters with types and descriptions
3. Return value
4. Usage examples
5. Edge cases and error handling

Documentation:`;
  }

  /**
   * Test case generation template
   */
  static testGeneration(code: string, language: string, framework: string): string {
    return `Generate ${framework} test cases for the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Requirements:
- Cover happy path scenarios
- Test edge cases
- Test error conditions
- Include setup and teardown if needed
- Follow ${framework} best practices

Test Code:`;
  }

  /**
   * Custom template
   */
  static custom(systemPrompt: string, userPrompt: string): LLMMessage[] {
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];
  }
}

// ========================
// CONTEXT WINDOW MANAGER
// ========================

export class ContextWindowManager {
  private maxTokens: number;
  private estimatedTokensPerChar = 0.25; // Rough estimate: 4 chars per token

  constructor(maxTokens: number = 4096) {
    this.maxTokens = maxTokens;
  }

  /**
   * Estimate token count from text
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length * this.estimatedTokensPerChar);
  }

  /**
   * Truncate messages to fit within token limit
   */
  truncateMessages(messages: LLMMessage[], reserveForResponse: number = 1000): LLMMessage[] {
    const maxPromptTokens = this.maxTokens - reserveForResponse;
    let totalTokens = 0;
    const truncated: LLMMessage[] = [];

    // Always keep system message
    if (messages.length > 0 && messages[0].role === 'system') {
      truncated.push(messages[0]);
      totalTokens += this.estimateTokens(messages[0].content);
    }

    // Add messages from most recent backwards
    for (let i = messages.length - 1; i >= (messages[0]?.role === 'system' ? 1 : 0); i--) {
      const tokens = this.estimateTokens(messages[i].content);

      if (totalTokens + tokens > maxPromptTokens) {
        logger.warn('Context window limit reached, truncating older messages');
        break;
      }

      truncated.unshift(messages[i]);
      totalTokens += tokens;
    }

    return truncated;
  }

  /**
   * Optimize prompt by removing unnecessary whitespace
   */
  optimizePrompt(text: string): string {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');
  }
}

// ========================
// OLLAMA PROVIDER
// ========================

export class OllamaProvider {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:11434', timeout: number = 60000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Generate completion using Ollama
   */
  async generate(
    model: string,
    messages: LLMMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<LLMResponse> {
    const payload = {
      model,
      messages,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? -1,
      },
      stream: false,
    };

    try {
      const response = await this.makeRequest('/api/chat', 'POST', payload);

      return {
        content: response.message.content,
        model: response.model,
        finishReason: response.done ? 'stop' : 'length',
      };
    } catch (error: any) {
      logger.error('Ollama generation failed:', error.message);
      throw new Error(`Ollama error: ${error.message}`);
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.makeRequest('/api/tags', 'GET');
      return response.models.map((m: any) => ({
        name: m.name,
        size: m.size,
        modified: new Date(m.modified_at),
        digest: m.digest,
      }));
    } catch (error: any) {
      logger.error('Failed to list Ollama models:', error.message);
      return [];
    }
  }

  /**
   * Pull/download a model
   */
  async pullModel(modelName: string): Promise<boolean> {
    try {
      logger.info(`Pulling Ollama model: ${modelName}`);
      await this.makeRequest('/api/pull', 'POST', { name: modelName }, 300000); // 5 min timeout
      logger.info(`Model pulled successfully: ${modelName}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to pull model:', error.message);
      return false;
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<boolean> {
    try {
      await this.makeRequest('/api/delete', 'DELETE', { name: modelName });
      logger.info(`Model deleted: ${modelName}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to delete model:', error.message);
      return false;
    }
  }

  /**
   * Check if Ollama is running
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.makeRequest('/api/tags', 'GET', undefined, 5000);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Make HTTP request to Ollama
   */
  private makeRequest(path: string, method: string, body?: any, timeout?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const isHttps = url.protocol === 'https:';
      const lib = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: timeout || this.timeout,
      };

      const req = lib.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
            }
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }
}

// ========================
// LLM MANAGER (Main Interface)
// ========================

export class LLMManager {
  private config: LLMConfig;
  private provider: OllamaProvider;
  private contextManager: ContextWindowManager;
  private conversationHistory: Map<string, LLMMessage[]> = new Map();

  constructor(config: LLMConfig) {
    this.config = config;
    this.provider = new OllamaProvider(config.baseUrl);
    this.contextManager = new ContextWindowManager(config.maxTokens || 4096);
  }

  /**
   * Generate response from LLM
   */
  async generate(prompt: string | LLMMessage[], sessionId?: string): Promise<LLMResponse> {
    let messages: LLMMessage[];

    if (typeof prompt === 'string') {
      messages = [{ role: 'user', content: prompt }];
    } else {
      messages = prompt;
    }

    // Add conversation history if session exists
    if (sessionId && this.conversationHistory.has(sessionId)) {
      const history = this.conversationHistory.get(sessionId)!;
      messages = [...history, ...messages];
    }

    // Truncate to fit context window
    messages = this.contextManager.truncateMessages(messages);

    // Generate response
    const response = await this.provider.generate(this.config.model, messages, {
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });

    // Store in conversation history
    if (sessionId) {
      const history = this.conversationHistory.get(sessionId) || [];
      history.push(...messages);
      history.push({ role: 'assistant', content: response.content });

      // Keep only recent messages
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      this.conversationHistory.set(sessionId, history);
    }

    return response;
  }

  /**
   * Analyze code
   */
  async analyzeCode(code: string, language: string): Promise<string> {
    const prompt = PromptTemplates.codeAnalysis(code, language);
    const response = await this.generate(prompt);
    return response.content;
  }

  /**
   * Generate code
   */
  async generateCode(description: string, language: string): Promise<string> {
    const prompt = PromptTemplates.codeGeneration(description, language);
    const response = await this.generate(prompt);
    return response.content;
  }

  /**
   * Plan task
   */
  async planTask(task: string, context?: string): Promise<string> {
    const prompt = PromptTemplates.taskPlanning(task, context);
    const response = await this.generate(prompt);
    return response.content;
  }

  /**
   * Diagnose error
   */
  async diagnoseError(error: string, context: string): Promise<string> {
    const prompt = PromptTemplates.errorDiagnosis(error, context);
    const response = await this.generate(prompt);
    return response.content;
  }

  /**
   * Generate documentation
   */
  async generateDocumentation(code: string, language: string): Promise<string> {
    const prompt = PromptTemplates.documentation(code, language);
    const response = await this.generate(prompt);
    return response.content;
  }

  /**
   * Generate test cases
   */
  async generateTests(code: string, language: string, framework: string): Promise<string> {
    const prompt = PromptTemplates.testGeneration(code, language, framework);
    const response = await this.generate(prompt);
    return response.content;
  }

  /**
   * List available models
   */
  async listModels(): Promise<ModelInfo[]> {
    return await this.provider.listModels();
  }

  /**
   * Download model
   */
  async downloadModel(modelName: string): Promise<boolean> {
    return await this.provider.pullModel(modelName);
  }

  /**
   * Switch model
   */
  switchModel(modelName: string): void {
    this.config.model = modelName;
    logger.info(`Switched to model: ${modelName}`);
  }

  /**
   * Check if LLM service is available
   */
  async isAvailable(): Promise<boolean> {
    return await this.provider.isAvailable();
  }

  /**
   * Clear conversation history
   */
  clearHistory(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId: string): LLMMessage[] {
    return this.conversationHistory.get(sessionId) || [];
  }
}
