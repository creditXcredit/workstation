/**
 * Type declarations for imap-simple
 * This is a minimal type definition for the imap-simple library
 */

declare module 'imap-simple' {
  export interface ImapSimpleConfig {
    imap: {
      user: string;
      password: string;
      host: string;
      port: number;
      tls: boolean;
      authTimeout?: number;
      tlsOptions?: any;
    };
  }

  export interface ImapSimple {
    openBox(boxName: string): Promise<any>;
    search(criteria: any[], options: any): Promise<any[]>;
    addFlags(source: string | string[], flags: string | string[]): Promise<void>;
    end(): void;
  }

  export function connect(config: ImapSimpleConfig): Promise<ImapSimple>;
}
