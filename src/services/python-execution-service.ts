/**
 * Python Execution Service
 * 
 * Executes Python code cells and returns Jupyter-compatible outputs
 * Supports both browser-based (Pyodide) and backend execution
 */

import type { NotebookOutput, CellExecutionResult } from './jupyter-notebook-service';

export interface PythonExecutionOptions {
  timeout?: number;
  captureOutput?: boolean;
  workingDirectory?: string;
  environment?: Record<string, string>;
}

class PythonExecutionService {
  private executionCount = 0;
  private pyodide: any = null;
  private pyodideLoading = false;

  /**
   * Initialize Pyodide for browser-based Python execution
   */
  async initializePyodide(): Promise<void> {
    if (this.pyodide) {
      return;
    }

    if (this.pyodideLoading) {
      // Wait for existing load
      while (this.pyodideLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.pyodideLoading = true;

    try {
      // Dynamically load Pyodide from CDN
      if (typeof window !== 'undefined') {
        // Check if Pyodide is already loaded
        if ((window as any).loadPyodide) {
          const { loadPyodide } = (window as any);
          this.pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
          });
        } else {
          // Load Pyodide from CDN
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide'));
            document.head.appendChild(script);
          });

          // @ts-ignore - Pyodide is loaded from CDN
          const { loadPyodide } = (window as any);
          this.pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
          });
        }

        // Install common packages
        await this.pyodide.loadPackage(['micropip', 'numpy', 'matplotlib', 'pandas', 'scipy']);
        
        // Set up matplotlib backend for browser
        this.pyodide.runPython(`
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import sys
from io import StringIO
        `);
      }
    } catch (error) {
      console.warn('Pyodide initialization failed, falling back to backend execution:', error);
      this.pyodide = null;
    } finally {
      this.pyodideLoading = false;
    }
  }

  /**
   * Execute Python code and return Jupyter-compatible outputs
   */
  async executeCode(
    code: string,
    options: PythonExecutionOptions = {}
  ): Promise<CellExecutionResult> {
    this.executionCount++;

    // Try Pyodide first (browser-based)
    if (this.pyodide || await this.tryInitializePyodide()) {
      return await this.executeWithPyodide(code, options);
    }

    // Fallback to backend execution via API
    return await this.executeWithBackend(code, options);
  }

  /**
   * Try to initialize Pyodide
   */
  private async tryInitializePyodide(): Promise<boolean> {
    try {
      await this.initializePyodide();
      return this.pyodide !== null;
    } catch {
      return false;
    }
  }

  /**
   * Execute Python code using Pyodide (browser-based)
   */
  private async executeWithPyodide(
    code: string,
    options: PythonExecutionOptions
  ): Promise<CellExecutionResult> {
    if (!this.pyodide) {
      throw new Error('Pyodide not initialized');
    }

    const outputs: NotebookOutput[] = [];

    try {
      // Set up stdout/stderr capture
      this.pyodide.runPython(`
import sys
from io import StringIO
_stdout_capture = StringIO()
_stderr_capture = StringIO()
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture
      `);

      // Execute code
      let result: any;
      try {
        result = this.pyodide.runPython(code);
      } catch (execError: any) {
        // Get stderr if there was an error
        const stderrContent = this.pyodide.runPython('_stderr_capture.getvalue()');
        if (stderrContent) {
          outputs.push({
            output_type: 'stream',
            name: 'stderr',
            text: stderrContent,
          });
        }
        throw execError;
      }

      // Get stdout
      const stdoutContent = this.pyodide.runPython('_stdout_capture.getvalue()');
      if (stdoutContent) {
        outputs.push({
          output_type: 'stream',
          name: 'stdout',
          text: stdoutContent,
        });
      }

      // Get stderr
      const stderrContent = this.pyodide.runPython('_stderr_capture.getvalue()');
      if (stderrContent) {
        outputs.push({
          output_type: 'stream',
          name: 'stderr',
          text: stderrContent,
        });
      }

      // Check for matplotlib figures
      try {
        const hasFigure = this.pyodide.runPython(`
try:
    import matplotlib.pyplot as plt
    has_fig = len(plt.get_fignums()) > 0
    if has_fig:
        import io
        import base64
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        img_data = base64.b64encode(buf.read()).decode('utf-8')
        plt.close('all')
        img_data
    else:
        None
except Exception as e:
    None
        `);

        if (hasFigure && hasFigure !== 'None') {
          outputs.push({
            output_type: 'display_data',
            data: {
              'image/png': hasFigure,
              'text/plain': '<matplotlib.figure.Figure>',
            },
          });
        }
      } catch (plotError) {
        // Ignore plot errors
      }

      // If there's a return value, display it
      if (result !== undefined && result !== null && result !== 'None') {
        const repr = String(result);
        if (repr && repr !== 'None') {
          outputs.push({
            output_type: 'execute_result',
            execution_count: this.executionCount,
            data: {
              'text/plain': repr,
            },
          });
        }
      }

      return {
        success: true,
        outputs,
        execution_count: this.executionCount,
      };
    } catch (error: any) {
      // Try to get Python traceback
      let traceback: string[] = [];
      let errorName = 'Error';
      let errorValue = String(error);

      try {
        const pyError = this.pyodide.runPython(`
import traceback
try:
    exc_type, exc_value, exc_traceback = sys.exc_info()
    if exc_traceback:
        tb_lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
        '\\n'.join(tb_lines)
    else:
        str(sys.last_value) if hasattr(sys, 'last_value') else 'Unknown error'
except:
    'Error occurred'
        `);
        if (pyError) {
          traceback = pyError.split('\n');
          errorValue = traceback[0] || String(error);
        }
      } catch {
        // Fallback to JavaScript error
        traceback = error.stack ? error.stack.split('\n') : [String(error)];
      }

      const errorOutput: NotebookOutput = {
        output_type: 'error',
        ename: errorName,
        evalue: errorValue,
        traceback: traceback.length > 0 ? traceback : [String(error)],
      };

      return {
        success: false,
        outputs: [errorOutput],
        execution_count: this.executionCount,
        error: {
          ename: errorOutput.ename!,
          evalue: errorOutput.evalue!,
          traceback: errorOutput.traceback!,
        },
      };
    }
  }

  /**
   * Execute Python code using backend (Tauri or API)
   */
  private async executeWithBackend(
    code: string,
    options: PythonExecutionOptions
  ): Promise<CellExecutionResult> {
    // Check if we're in Tauri environment
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      return await this.executeWithTauri(code, options);
    }

    // Fallback: use fetch to backend API
    return await this.executeWithAPI(code, options);
  }

  /**
   * Execute Python code via Tauri backend
   */
  private async executeWithTauri(
    code: string,
    options: PythonExecutionOptions
  ): Promise<CellExecutionResult> {
    try {
      // Check if Tauri is available
      if (typeof window === 'undefined' || !(window as any).__TAURI__) {
        throw new Error('Tauri is not available');
      }

      // Use the same import path as other services
      // Wrap in try-catch to handle module not found errors
      let invoke: any;
      try {
        const tauriApi = await import('@tauri-apps/api/tauri' as any);
        invoke = tauriApi.invoke;
      } catch (importError) {
        // Module not found - we're in web mode, fall back to simulation
        return this.simulateExecution(code);
      }

      const result = await invoke('execute_python_code', {
        code,
        timeout: options.timeout || 30000,
        workingDirectory: options.workingDirectory,
        environment: options.environment,
      }) as CellExecutionResult;

      result.execution_count = this.executionCount;
      return result;
    } catch (error: any) {
      // If Tauri command doesn't exist or execution fails, fall back to simulation
      return this.simulateExecution(code);
    }
  }

  /**
   * Execute Python code via HTTP API
   */
  private async executeWithAPI(
    code: string,
    options: PythonExecutionOptions
  ): Promise<CellExecutionResult> {
    try {
      const response = await fetch('/api/python/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          timeout: options.timeout || 30000,
          workingDirectory: options.workingDirectory,
          environment: options.environment,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as CellExecutionResult;
      result.execution_count = this.executionCount;
      return result;
    } catch (error: any) {
      // Fallback: simulate execution for development
      return this.simulateExecution(code);
    }
  }

  /**
   * Simulate Python execution (for development/testing)
   */
  private simulateExecution(code: string): CellExecutionResult {
    // Simple simulation - in production, this should never be used
    const outputs: NotebookOutput[] = [];

    // Check for print statements
    const printMatches = code.match(/print\s*\([^)]+\)/g);
    if (printMatches) {
      printMatches.forEach(match => {
        const content = match.replace(/print\s*\(['"]?([^'"]+)['"]?\)/, '$1');
        outputs.push({
          output_type: 'stream',
          name: 'stdout',
          text: content + '\n',
        });
      });
    }

    // Check for imports
    if (code.includes('import matplotlib') || code.includes('import plt')) {
      outputs.push({
        output_type: 'display_data',
        data: {
          'text/plain': '<matplotlib.figure.Figure>',
        },
      });
    }

    if (outputs.length === 0) {
      outputs.push({
        output_type: 'execute_result',
        execution_count: this.executionCount,
        data: {
          'text/plain': 'Code executed successfully (simulated)',
        },
      });
    }

    return {
      success: true,
      outputs,
      execution_count: this.executionCount,
      data: {
          'text/plain': 'Code executed successfully (simulated)',
      },
    } as any;
  }

  /**
   * Reset execution count
   */
  resetExecutionCount(): void {
    this.executionCount = 0;
  }

  /**
   * Get current execution count
   */
  getExecutionCount(): number {
    return this.executionCount;
  }
}

export const pythonExecutionService = new PythonExecutionService();
