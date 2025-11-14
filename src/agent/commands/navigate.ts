import { AgentCommand, AgentResponse } from '../../types';
import { BaseCommand } from './base';
import { logger } from '../../utils/logger';

export class NavigateCommand extends BaseCommand {
  async execute(command: AgentCommand<Record<string, unknown>>): Promise<AgentResponse> {
    try {
      const url = command.payload?.url as unknown;

      if (!url || typeof url !== 'string') {
        return {
          success: false,
          error: 'URL is required',
          commandId: command.id,
        };
      }

      const page = await this.browserManager.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });

      logger.info(`Navigated to ${url}`);

      return {
        success: true,
        data: {
          url: page.url(),
          title: await page.title(),
        },
        commandId: command.id,
      };
    } catch (error: any) {
      logger.error('Navigate command failed:', error);
      return {
        success: false,
        error: error.message,
        commandId: command.id,
      };
    }
  }
}
