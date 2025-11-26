/**
 * Excel Agent for workflow automation
 * Handles Excel file reading, writing, multi-sheet operations, and cell formatting
 * Phase 1: Data Agents
 * Security: Migrated from xlsx to exceljs (resolved GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)
 */

import ExcelJS from 'exceljs';
import { logger } from '../../../utils/logger';

/**
 * Helper to convert Buffer to ArrayBuffer for ExcelJS
 */
function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  // Ensure we return an ArrayBuffer, not SharedArrayBuffer
  if (arrayBuffer instanceof ArrayBuffer) {
    return arrayBuffer;
  }
  // Fallback: create a new ArrayBuffer
  const newBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(newBuffer);
  view.set(buffer);
  return newBuffer;
}

export interface ExcelReadOptions {
  sheetName?: string;
  sheetIndex?: number;
  range?: string;
  raw?: boolean;
  defval?: unknown;
}

export interface ExcelWriteOptions {
  sheetName?: string;
  compression?: boolean;
  bookType?: 'xlsx' | 'xlsm' | 'xlsb' | 'xls' | 'csv';
}

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  bgColor?: string;
  fontSize?: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface FormattedCell {
  cell: string; // e.g., 'A1', 'B2'
  format: CellFormat;
}

/**
 * Excel Agent Implementation
 * Provides comprehensive Excel data handling capabilities using xlsx library
 */
export class ExcelAgent {
  /**
   * Read Excel file with support for multi-sheet workbooks
   */
  async readExcel(params: {
    input: Buffer | string;
    options?: ExcelReadOptions;
  }): Promise<{
    success: boolean;
    data?: unknown[];
    sheets?: string[];
    sheetName?: string;
    error?: string;
  }> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Read workbook from buffer or file path
      if (typeof params.input === 'string') {
        await workbook.xlsx.readFile(params.input);
      } else {
        await workbook.xlsx.load(bufferToArrayBuffer(params.input));
      }

      const options = params.options || {};
      
      // Determine which sheet to read
      let worksheet: ExcelJS.Worksheet | undefined;
      let sheetName: string;
      
      if (options.sheetName) {
        worksheet = workbook.getWorksheet(options.sheetName);
        sheetName = options.sheetName;
      } else if (options.sheetIndex !== undefined) {
        worksheet = workbook.getWorksheet(options.sheetIndex + 1); // ExcelJS is 1-indexed
        sheetName = worksheet?.name || '';
      } else {
        // Default to first sheet
        worksheet = workbook.worksheets[0];
        sheetName = worksheet?.name || '';
      }

      if (!worksheet) {
        throw new Error(`Sheet not found: ${options.sheetName || 'index ' + options.sheetIndex}`);
      }

      // Convert sheet to JSON array
      const data: unknown[] = [];
      const headers: string[] = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // First row is headers
          row.eachCell((cell) => {
            headers.push(String(cell.value || ''));
          });
        } else {
          // Data rows
          const rowData: Record<string, unknown> = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = options.raw ? cell.value : String(cell.value || options.defval || '');
            }
          });
          data.push(rowData);
        }
      });

      const sheets = workbook.worksheets.map(ws => ws.name);

      logger.info(`Excel file read successfully: ${data.length} rows from sheet '${sheetName}'`);

      return {
        success: true,
        data,
        sheets,
        sheetName
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Excel read error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Write data to Excel format
   */
  async writeExcel(params: {
    data: unknown[] | Record<string, unknown[]>;
    options?: ExcelWriteOptions;
  }): Promise<{
    success: boolean;
    buffer?: Buffer;
    error?: string;
  }> {
    try {
      const options: ExcelWriteOptions = {
        sheetName: 'Sheet1',
        compression: false,
        bookType: 'xlsx',
        ...params.options
      };

      const workbook = new ExcelJS.Workbook();

      // Handle single sheet (array) or multi-sheet (object with sheet names as keys)
      if (Array.isArray(params.data)) {
        if (params.data.length === 0) {
          throw new Error('Data array cannot be empty');
        }

        const worksheet = workbook.addWorksheet(options.sheetName);
        
        // Extract headers from first data object
        const firstRow = params.data[0] as Record<string, unknown>;
        const headers = Object.keys(firstRow);
        
        // Add header row
        worksheet.addRow(headers);
        
        // Add data rows
        params.data.forEach((row) => {
          const rowData = headers.map(header => (row as Record<string, unknown>)[header]);
          worksheet.addRow(rowData);
        });
      } else {
        // Multi-sheet workbook
        const sheets = Object.keys(params.data);
        if (sheets.length === 0) {
          throw new Error('Data object must contain at least one sheet');
        }

        for (const sheetName of sheets) {
          const sheetData = params.data[sheetName];
          if (!Array.isArray(sheetData) || sheetData.length === 0) {
            logger.warn(`Skipping empty sheet: ${sheetName}`);
            continue;
          }

          const worksheet = workbook.addWorksheet(sheetName);
          
          // Extract headers from first data object
          const firstRow = sheetData[0] as Record<string, unknown>;
          const headers = Object.keys(firstRow);
          
          // Add header row
          worksheet.addRow(headers);
          
          // Add data rows
          sheetData.forEach((row) => {
            const rowData = headers.map(header => (row as Record<string, unknown>)[header]);
            worksheet.addRow(rowData);
          });
        }
      }

      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();

      logger.info('Excel file generated successfully');

      return {
        success: true,
        buffer: Buffer.from(buffer)
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Excel write error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Get specific sheet data by name or index
   */
  async getSheet(params: {
    input: Buffer | string;
    sheetName?: string;
    sheetIndex?: number;
  }): Promise<{
    success: boolean;
    data?: unknown[];
    sheetName?: string;
    error?: string;
  }> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      if (typeof params.input === 'string') {
        await workbook.xlsx.readFile(params.input);
      } else {
        await workbook.xlsx.load(bufferToArrayBuffer(params.input));
      }

      let worksheet: ExcelJS.Worksheet | undefined;
      let sheetName: string;
      
      if (params.sheetName) {
        worksheet = workbook.getWorksheet(params.sheetName);
        sheetName = params.sheetName;
      } else if (params.sheetIndex !== undefined) {
        worksheet = workbook.getWorksheet(params.sheetIndex + 1); // ExcelJS is 1-indexed
        sheetName = worksheet?.name || '';
      } else {
        throw new Error('Either sheetName or sheetIndex must be provided');
      }

      if (!worksheet) {
        throw new Error(`Sheet not found: ${params.sheetName || 'index ' + params.sheetIndex}`);
      }

      // Convert sheet to JSON array
      const data: unknown[] = [];
      const headers: string[] = [];
      
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // First row is headers
          row.eachCell((cell) => {
            headers.push(String(cell.value || ''));
          });
        } else {
          // Data rows
          const rowData: Record<string, unknown> = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = cell.value;
            }
          });
          data.push(rowData);
        }
      });

      logger.info(`Sheet '${sheetName}' extracted: ${data.length} rows`);

      return {
        success: true,
        data,
        sheetName
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Get sheet error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * List all sheets in a workbook
   */
  async listSheets(params: {
    input: Buffer | string;
  }): Promise<{
    success: boolean;
    sheets?: string[];
    count?: number;
    error?: string;
  }> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      if (typeof params.input === 'string') {
        await workbook.xlsx.readFile(params.input);
      } else {
        await workbook.xlsx.load(bufferToArrayBuffer(params.input));
      }

      const sheets = workbook.worksheets.map(ws => ws.name);

      logger.info(`Workbook contains ${sheets.length} sheets`);

      return {
        success: true,
        sheets,
        count: sheets.length
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('List sheets error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Apply formatting to cells
   * ExcelJS has full formatting support built-in
   */
  async formatCells(params: {
    input: Buffer | string;
    sheetName?: string;
    formats: FormattedCell[];
  }): Promise<{
    success: boolean;
    buffer?: Buffer;
    message?: string;
    error?: string;
  }> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      if (typeof params.input === 'string') {
        await workbook.xlsx.readFile(params.input);
      } else {
        await workbook.xlsx.load(bufferToArrayBuffer(params.input));
      }

      const sheetName = params.sheetName || workbook.worksheets[0]?.name;
      const worksheet = workbook.getWorksheet(sheetName);

      if (!worksheet) {
        throw new Error(`Sheet not found: ${sheetName}`);
      }

      // Apply formats to cells
      for (const { cell, format } of params.formats) {
        const cellObj = worksheet.getCell(cell);

        if (!cellObj) {
          logger.warn(`Cell ${cell} not found in sheet ${sheetName}`);
          continue;
        }

        // Apply font formatting
        const font: Partial<ExcelJS.Font> = {};
        if (format.bold !== undefined) {
          font.bold = format.bold;
        }
        if (format.italic !== undefined) {
          font.italic = format.italic;
        }
        if (format.underline !== undefined) {
          font.underline = format.underline;
        }
        if (format.color) {
          font.color = { argb: format.color.replace('#', '') };
        }
        if (format.fontSize) {
          font.size = format.fontSize;
        }

        if (Object.keys(font).length > 0) {
          cellObj.font = { ...cellObj.font, ...font };
        }

        // Apply background color
        if (format.bgColor) {
          cellObj.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: format.bgColor.replace('#', '') }
          };
        }

        // Apply alignment
        if (format.alignment) {
          cellObj.alignment = {
            horizontal: format.alignment
          };
        }
      }

      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();

      logger.info(`Formatted ${params.formats.length} cells in sheet '${sheetName}'`);

      return {
        success: true,
        buffer: Buffer.from(buffer),
        message: 'Cell formatting applied successfully with ExcelJS'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Format cells error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Get Excel file information and statistics
   */
  async getInfo(params: {
    input: Buffer | string;
  }): Promise<{
    success: boolean;
    info?: {
      sheetCount: number;
      sheets: Array<{
        name: string;
        rowCount: number;
        columnCount: number;
      }>;
    };
    error?: string;
  }> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      if (typeof params.input === 'string') {
        await workbook.xlsx.readFile(params.input);
      } else {
        await workbook.xlsx.load(bufferToArrayBuffer(params.input));
      }

      const sheets = workbook.worksheets.map(worksheet => {
        const rowCount = worksheet.rowCount;
        const columnCount = worksheet.columnCount;

        return {
          name: worksheet.name,
          rowCount,
          columnCount
        };
      });

      logger.info(`Excel info retrieved: ${sheets.length} sheets`);

      return {
        success: true,
        info: {
          sheetCount: sheets.length,
          sheets
        }
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Get Excel info error:', { error: errorMsg });
      return {
        success: false,
        error: errorMsg
      };
    }
  }
}

// Export singleton instance
export const excelAgent = new ExcelAgent();
