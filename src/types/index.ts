export interface BrowserConfig {
  headless: boolean;
  devtools: boolean;
  viewport?: {
    width: number;
    height: number;
  };
  userDataDir?: string;
  extensionsPath?: string;
  args?: string[];
}

export interface AgentConfig {
  browser: BrowserConfig;
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    file?: string;
  };
  server?: {
    port: number;
    host: string;
  };
}

export interface ExtensionManifest {
  name: string;
  version: string;
  manifest_version: number;
  description?: string;
  background?: {
    scripts?: string[];
    service_worker?: string;
  };
  content_scripts?: Array<{
    matches: string[];
    js?: string[];
    css?: string[];
  }>;
  permissions?: string[];
}

export interface AgentCommand<TPayload = Record<string, unknown>> {
  type: string;
  payload?: TPayload;
  id?: string;
}

export interface AgentResponse<TData = unknown> {
  success: boolean;
  data?: TData;
  error?: string;
  commandId?: string;
}

export interface SessionInfo {
  id: string;
  startTime: Date;
  browser: {
    version: string;
    userAgent: string;
  };
  extensions: string[];
}

// Export enhanced type systems
export * from './type-guards';
export * from './automation';
export * from './coordination';
