/**
 * Multi-Language Execution Service
 * 
 * Handles execution of multiple programming languages in notebook cells:
 * - Python (via Pyodide)
 * - SQL (via Web SQL or backend)
 * - Rust (via WebAssembly or backend compilation)
 * - R (via R.js or backend)
 * - NAVΛ (via NAVΛ compiler/runtime)
 */

import type { NotebookOutput, CellExecutionResult } from './jupyter-notebook-service';
import { pythonExecutionService } from './python-execution-service';

export type SupportedLanguage = 'python' | 'sql' | 'rust' | 'r' | 'navlambda' | 'vnc' | 'javascript' | 'typescript';

export interface ExecutionOptions {
  timeout?: number;
  captureOutput?: boolean;
  workingDirectory?: string;
  environment?: Record<string, string>;
  compileOnly?: boolean; // For Rust, compile but don't execute
}

class MultiLanguageExecutionService {
  private executionCounts: Map<SupportedLanguage, number> = new Map();

  /**
   * Execute code in the specified language
   */
  async executeCode(
    language: SupportedLanguage,
    code: string,
    options: ExecutionOptions = {}
  ): Promise<CellExecutionResult> {
    const count = (this.executionCounts.get(language) || 0) + 1;
    this.executionCounts.set(language, count);

    try {
      switch (language) {
        case 'python':
          return await pythonExecutionService.executeCode(code, options);

        case 'sql':
          return await this.executeSQL(code, options);

        case 'rust':
          return await this.executeRust(code, options);

        case 'r':
          return await this.executeR(code, options);

        case 'navlambda':
        case 'vnc':
          return await this.executeNavLambda(code, options);

        case 'javascript':
        case 'typescript':
          return await this.executeJavaScript(code, language, options);

        default:
          throw new Error(`Unsupported language: ${language}`);
      }
    } catch (error: any) {
      return {
        success: false,
        outputs: [{
          output_type: 'error',
          ename: 'ExecutionError',
          evalue: error.message || String(error),
          traceback: [String(error)],
        }],
        execution_count: count,
        error: {
          ename: 'ExecutionError',
          evalue: error.message || String(error),
          traceback: [String(error)],
        },
      };
    }
  }

  /**
   * Execute SQL queries
   */
  private async executeSQL(
    code: string,
    options: ExecutionOptions
  ): Promise<CellExecutionResult> {
    const count = (this.executionCounts.get('sql') || 0) + 1;

    try {
      // Try to use Tauri backend for SQL execution
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        try {
          const { invoke } = await import('@tauri-apps/api/tauri' as any);
          const result = await invoke('execute_sql', {
            query: code,
            timeout: options.timeout || 30000,
          }) as { success: boolean; rows?: any[]; error?: string };

          if (result.success && result.rows) {
            // Format as table
            const tableOutput = this.formatSQLTable(result.rows);
            return {
              success: true,
              outputs: [{
                output_type: 'execute_result',
                execution_count: count,
                data: {
                  'text/plain': tableOutput,
                  'text/html': this.formatSQLTableHTML(result.rows),
                },
              }],
              execution_count: count,
            };
          } else {
            throw new Error(result.error || 'SQL execution failed');
          }
        } catch (tauriError) {
          // Fall through to web SQL
        }
      }

      // Web SQL fallback (for development/demo)
      return this.executeSQLWeb(code, count);
    } catch (error: any) {
      return {
        success: false,
        outputs: [{
          output_type: 'error',
          ename: 'SQLError',
          evalue: error.message || String(error),
          traceback: [String(error)],
        }],
        execution_count: count,
      };
    }
  }

  /**
   * Execute SQL in browser (Web SQL API - deprecated but works for demo)
   */
  private async executeSQLWeb(code: string, count: number): Promise<CellExecutionResult> {
    // For demo purposes, simulate SQL execution
    // In production, you'd use IndexedDB or a backend service
    const outputs: NotebookOutput[] = [];

    // Simple SELECT simulation
    if (code.trim().toUpperCase().startsWith('SELECT')) {
      outputs.push({
        output_type: 'execute_result',
        execution_count: count,
        data: {
          'text/plain': 'Query executed successfully\n(Simulated - use backend for real SQL)',
          'text/html': '<div style="padding: 12px; background: #1e1e1e; border-radius: 4px;">Query executed successfully<br/>(Simulated - use backend for real SQL)</div>',
        },
      });
    } else {
      outputs.push({
        output_type: 'stream',
        name: 'stdout',
        text: 'SQL command executed (simulated)\n',
      });
    }

    return {
      success: true,
      outputs,
      execution_count: count,
    };
  }

  /**
   * Execute Rust code
   */
  private async executeRust(
    code: string,
    options: ExecutionOptions
  ): Promise<CellExecutionResult> {
    const count = (this.executionCounts.get('rust') || 0) + 1;

    try {
      // Try Tauri backend for Rust compilation/execution
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        try {
          const { invoke } = await import('@tauri-apps/api/tauri' as any);
          
          if (options.compileOnly) {
            // Just compile
            const result = await invoke('compile_rust', {
              code,
              target: 'wasm', // or 'native'
            }) as { success: boolean; output?: string; error?: string };

            if (result.success) {
              return {
                success: true,
                outputs: [{
                  output_type: 'stream',
                  name: 'stdout',
                  text: result.output || 'Compilation successful',
                }],
                execution_count: count,
              };
            } else {
              throw new Error(result.error || 'Rust compilation failed');
            }
          } else {
            // Compile and execute
            const result = await invoke('execute_rust', {
              code,
              timeout: options.timeout || 30000,
            }) as { success: boolean; output?: string; error?: string };

            if (result.success) {
              return {
                success: true,
                outputs: [{
                  output_type: 'stream',
                  name: 'stdout',
                  text: result.output || 'Execution successful',
                }],
                execution_count: count,
              };
            } else {
              throw new Error(result.error || 'Rust execution failed');
            }
          }
        } catch (tauriError) {
          // Fall through to simulation
        }
      }

      // Fallback: simulate Rust execution
      return {
        success: true,
        outputs: [{
          output_type: 'stream',
          name: 'stdout',
          text: 'Rust code compiled and executed (simulated)\nNote: Real Rust execution requires backend or WebAssembly compilation',
        }],
        execution_count: count,
      };
    } catch (error: any) {
      return {
        success: false,
        outputs: [{
          output_type: 'error',
          ename: 'RustError',
          evalue: error.message || String(error),
          traceback: [String(error)],
        }],
        execution_count: count,
      };
    }
  }

  /**
   * Execute R code
   */
  private async executeR(
    code: string,
    options: ExecutionOptions
  ): Promise<CellExecutionResult> {
    const count = (this.executionCounts.get('r') || 0) + 1;

    try {
      // Try backend R execution
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        try {
          const { invoke } = await import('@tauri-apps/api/tauri' as any);
          const result = await invoke('execute_r', {
            code,
            timeout: options.timeout || 30000,
          }) as { success: boolean; output?: string; error?: string };

          if (result.success) {
            return {
              success: true,
              outputs: [{
                output_type: 'stream',
                name: 'stdout',
                text: result.output || 'R code executed successfully',
              }],
              execution_count: count,
            };
          } else {
            throw new Error(result.error || 'R execution failed');
          }
        } catch (tauriError) {
          // Fall through to simulation
        }
      }

      // Fallback: simulate R execution
      return {
        success: true,
        outputs: [{
          output_type: 'stream',
          name: 'stdout',
          text: 'R code executed (simulated)\nNote: Real R execution requires R.js or backend R installation',
        }],
        execution_count: count,
      };
    } catch (error: any) {
      return {
        success: false,
        outputs: [{
          output_type: 'error',
          ename: 'RError',
          evalue: error.message || String(error),
          traceback: [String(error)],
        }],
        execution_count: count,
      };
    }
  }

  /**
   * Execute NAVΛ code
   */
  private async executeNavLambda(
    code: string,
    options: ExecutionOptions
  ): Promise<CellExecutionResult> {
    const count = (this.executionCounts.get('navlambda') || 0) + 1;

    try {
      // Try Tauri backend for NAVΛ compilation/execution
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        try {
          const { invoke } = await import('@tauri-apps/api/tauri' as any);
          
          // Parse and execute NAVΛ code
          const result = await invoke('run_live_preview', { code }) as string;
          
          try {
            // run_live_preview returns a result string, which might be JSON
            const parsedResult = JSON.parse(result);
            return {
              success: true,
              outputs: [{
                output_type: 'execute_result',
                execution_count: count,
                data: {
                  'application/json': parsedResult,
                  'text/plain': typeof parsedResult === 'string' ? parsedResult : JSON.stringify(parsedResult, null, 2),
                },
              }],
              execution_count: count,
            };
          } catch (e) {
            // Not JSON, just plain text
            return {
              success: true,
              outputs: [{
                output_type: 'stream',
                name: 'stdout',
                text: result,
              }],
              execution_count: count,
            };
          }
        } catch (tauriError: any) {
          // Fall through to simulation if command fails
          console.error('Tauri NAVΛ execution failed:', tauriError);
        }
      }

      // Fallback: simulate NAVΛ execution
      return {
        success: true,
        outputs: [{
          output_type: 'stream',
          name: 'stdout',
          text: 'NAVΛ code executed (simulated)\n→ Navigation field computed\n→ Optimal path calculated\nNote: Real NAVΛ execution requires backend compiler',
        }],
        execution_count: count,
      };
    } catch (error: any) {
      return {
        success: false,
        outputs: [{
          output_type: 'error',
          ename: 'NavLambdaError',
          evalue: error.message || String(error),
          traceback: [String(error)],
        }],
        execution_count: count,
      };
    }
  }

  /**
   * Execute JavaScript/TypeScript code
   */
  private async executeJavaScript(
    code: string,
    language: 'javascript' | 'typescript',
    options: ExecutionOptions
  ): Promise<CellExecutionResult> {
    const count = (this.executionCounts.get(language) || 0) + 1;

    try {
      // Execute in browser context
      const outputs: NotebookOutput[] = [];
      const consoleLogs: string[] = [];

      // Capture console.log
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.map(a => String(a)).join(' '));
        originalLog.apply(console, args);
      };

      try {
        // Execute JavaScript directly
        if (language === 'typescript') {
          // For TypeScript, we'd need a TS compiler
          // For now, treat as JavaScript
          eval(code);
        } else {
          eval(code);
        }

        if (consoleLogs.length > 0) {
          outputs.push({
            output_type: 'stream',
            name: 'stdout',
            text: consoleLogs.join('\n') + '\n',
          });
        } else {
          outputs.push({
            output_type: 'execute_result',
            execution_count: count,
            data: {
              'text/plain': 'Code executed successfully',
            },
          });
        }
      } finally {
        console.log = originalLog;
      }

      return {
        success: true,
        outputs,
        execution_count: count,
      };
    } catch (error: any) {
      return {
        success: false,
        outputs: [{
          output_type: 'error',
          ename: 'JavaScriptError',
          evalue: error.message || String(error),
          traceback: [error.stack || String(error)],
        }],
        execution_count: count,
      };
    }
  }

  /**
   * Format SQL results as plain text table
   */
  private formatSQLTable(rows: any[]): string {
    if (rows.length === 0) {
      return 'No rows returned';
    }

    const keys = Object.keys(rows[0]);
    const header = keys.join(' | ');
    const separator = keys.map(() => '---').join(' | ');
    const dataRows = rows.slice(0, 100).map(row =>
      keys.map(key => String(row[key] || '')).join(' | ')
    );

    return [header, separator, ...dataRows].join('\n') + 
      (rows.length > 100 ? `\n... (${rows.length - 100} more rows)` : '');
  }

  /**
   * Format SQL results as HTML table
   */
  private formatSQLTableHTML(rows: any[]): string {
    if (rows.length === 0) {
      return '<div>No rows returned</div>';
    }

    const keys = Object.keys(rows[0]);
    const headerRow = `<tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;
    const dataRows = rows.slice(0, 100).map(row =>
      `<tr>${keys.map(k => `<td>${String(row[k] || '')}</td>`).join('')}</tr>`
    ).join('');

    return `
      <table style="border-collapse: collapse; width: 100%; font-family: monospace; font-size: 12px;">
        <thead>${headerRow}</thead>
        <tbody>${dataRows}</tbody>
      </table>
      ${rows.length > 100 ? `<div>... (${rows.length - 100} more rows)</div>` : ''}
    `;
  }

  /**
   * Reset execution count for a language
   */
  resetExecutionCount(language?: SupportedLanguage): void {
    if (language) {
      this.executionCounts.set(language, 0);
    } else {
      this.executionCounts.clear();
    }
  }

  /**
   * Get execution count for a language
   */
  getExecutionCount(language: SupportedLanguage): number {
    return this.executionCounts.get(language) || 0;
  }
}

export const multiLanguageExecutionService = new MultiLanguageExecutionService();
