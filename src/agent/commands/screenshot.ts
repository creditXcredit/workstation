import { AgentCommand, AgentResponse } from '../../types';
import { BaseCommand } from './base';
import { logger } from '../../utils/logger';

export class ScreenshotCommand extends BaseCommand {
  async execute(command: AgentCommand<Record<string, unknown>>): Promise<AgentResponse> {
    try {
      const path = command.payload?.path as unknown;
      const fullPage = (command.payload?.fullPage as unknown) ?? false;

      const pages = await this.browserManager.getPages();
      if (pages.length === 0) {
        return {
          success: false,
          error: 'No active page',
          commandId: command.id,
        };
      }

      // Take screenshot without path first
      const screenshot = await pages[0].screenshot({
        fullPage: typeof fullPage === 'boolean' ? fullPage : false,
        encoding: 'base64',
      });

      // If path is provided and valid, write to file separately
      if (typeof path === 'string' && path.length > 0) {
        const fs = await import('fs/promises');
        await fs.writeFile(path, screenshot, 'base64');
      }

      logger.info(`Screenshot taken${path ? ` and saved to ${path}` : ''}`);

      return {
        success: true,
        data: {
          screenshot: path ? path : screenshot,
        },
        commandId: command.id,
      };
    } catch (error: any) {
      logger.error('Screenshot command failed:', error);
      return {
        success: false,
        error: error.message,
        commandId: command.id,
      };
    }
  }
}
