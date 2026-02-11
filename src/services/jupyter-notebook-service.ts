/**
 * Jupyter Notebook Service
 * 
 * Handles parsing, execution, and management of Jupyter notebook files (.ipynb)
 */

export interface NotebookCell {
  cell_type: 'code' | 'markdown' | 'raw';
  execution_count: number | null;
  id?: string;
  metadata: Record<string, any>;
  source: string | string[];
  outputs?: NotebookOutput[];
}

export interface NotebookOutput {
  output_type: 'execute_result' | 'display_data' | 'stream' | 'error';
  execution_count?: number | null;
  data?: {
    'text/plain'?: string | string[];
    'text/html'?: string | string[];
    'image/png'?: string;
    'image/jpeg'?: string;
    'image/svg+xml'?: string;
    'application/json'?: any;
    [mimeType: string]: any;
  };
  text?: string | string[];
  name?: 'stdout' | 'stderr';
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

export interface JupyterNotebook {
  cells: NotebookCell[];
  metadata: {
    kernelspec?: {
      display_name: string;
      language: string;
      name: string;
    };
    language_info?: {
      name: string;
      version: string;
      mimetype?: string;
      file_extension?: string;
    };
    [key: string]: any;
  };
  nbformat: number;
  nbformat_minor: number;
}

export interface CellExecutionResult {
  success: boolean;
  outputs: NotebookOutput[];
  execution_count: number;
  error?: {
    ename: string;
    evalue: string;
    traceback: string[];
  };
}

class JupyterNotebookService {
  /**
   * Parse a Jupyter notebook JSON file
   */
  parseNotebook(jsonContent: string): JupyterNotebook {
    try {
      const notebook = JSON.parse(jsonContent) as JupyterNotebook;
      
      // Validate notebook format
      if (!notebook.cells || !Array.isArray(notebook.cells)) {
        throw new Error('Invalid notebook format: missing cells array');
      }

      if (!notebook.nbformat || notebook.nbformat < 4) {
        throw new Error('Unsupported notebook format version');
      }

      // Normalize cell sources (convert string[] to string)
      notebook.cells = notebook.cells.map(cell => ({
        ...cell,
        source: Array.isArray(cell.source) 
          ? cell.source.join('') 
          : (cell.source || ''),
      }));

      return notebook;
    } catch (error) {
      throw new Error(`Failed to parse notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert Jupyter notebook to internal format
   */
  notebookToCells(notebook: JupyterNotebook): Array<{
    id: string;
    type: 'code' | 'markdown';
    language: string;
    content: string;
    executionCount: number | null;
    outputs: NotebookOutput[];
    metadata: Record<string, any>;
  }> {
    return notebook.cells.map((cell, index) => {
      const id = cell.id || `cell-${index}`;
      const source = Array.isArray(cell.source) 
        ? cell.source.join('') 
        : (cell.source || '');
      
      return {
        id,
        type: cell.cell_type === 'code' ? 'code' : 'markdown',
        language: this.detectLanguage(cell, notebook),
        content: source,
        executionCount: cell.execution_count ?? null,
        outputs: cell.outputs || [],
        metadata: cell.metadata || {},
      };
    });
  }

  /**
   * Convert internal cells back to Jupyter notebook format
   */
  cellsToNotebook(
    cells: Array<{
      id: string;
      type: 'code' | 'markdown';
      language: string;
      content: string;
      executionCount: number | null;
      outputs?: NotebookOutput[];
      metadata?: Record<string, any>;
    }>,
    metadata?: JupyterNotebook['metadata']
  ): JupyterNotebook {
    const notebook: JupyterNotebook = {
      cells: cells.map(cell => ({
        cell_type: cell.type === 'code' ? 'code' : 'markdown',
        execution_count: cell.type === 'code' ? cell.executionCount : null,
        id: cell.id,
        metadata: cell.metadata || {},
        source: cell.content.split('\n'),
        ...(cell.type === 'code' && cell.outputs ? { outputs: cell.outputs } : {}),
      })),
      metadata: metadata || {
        kernelspec: {
          display_name: 'Python 3',
          language: 'python',
          name: 'python3',
        },
        language_info: {
          name: 'python',
          version: '3.0.0',
        },
      },
      nbformat: 4,
      nbformat_minor: 4,
    };

    return notebook;
  }

  /**
   * Serialize notebook to JSON string
   */
  serializeNotebook(notebook: JupyterNotebook): string {
    return JSON.stringify(notebook, null, 2);
  }

  /**
   * Detect language from cell and notebook metadata
   */
  private detectLanguage(cell: NotebookCell, notebook: JupyterNotebook): string {
    // Check cell metadata first
    if (cell.metadata?.language) {
      return cell.metadata.language;
    }

    // Check notebook metadata
    if (notebook.metadata?.kernelspec?.language) {
      return notebook.metadata.kernelspec.language;
    }

    if (notebook.metadata?.language_info?.name) {
      return notebook.metadata.language_info.name;
    }

    // Default to python for code cells
    return cell.cell_type === 'code' ? 'python' : 'markdown';
  }

  /**
   * Create a new empty notebook
   */
  createEmptyNotebook(language: string = 'python'): JupyterNotebook {
    return {
      cells: [
        {
          cell_type: 'markdown',
          execution_count: null,
          id: `cell-${Date.now()}`,
          metadata: {},
          source: '# New Notebook\n\nStart writing your code here...',
        },
      ],
      metadata: {
        kernelspec: {
          display_name: language === 'python' ? 'Python 3' : language,
          language: language,
          name: language === 'python' ? 'python3' : language,
        },
        language_info: {
          name: language,
          version: '3.0.0',
        },
      },
      nbformat: 4,
      nbformat_minor: 4,
    };
  }

  /**
   * Normalize cell source (handle both string and string[] formats)
   */
  normalizeSource(source: string | string[]): string {
    if (Array.isArray(source)) {
      return source.join('');
    }
    return source || '';
  }

  /**
   * Format output for display
   */
  formatOutput(output: NotebookOutput): {
    type: 'text' | 'html' | 'image' | 'error' | 'stream';
    content: string;
    mimeType?: string;
  } {
    if (output.output_type === 'error') {
      return {
        type: 'error',
        content: [
          output.ename || 'Error',
          output.evalue || '',
          ...(output.traceback || []),
        ].join('\n'),
      };
    }

    if (output.output_type === 'stream') {
      return {
        type: 'stream',
        content: Array.isArray(output.text) ? output.text.join('') : (output.text || ''),
      };
    }

    if (output.data) {
      // Prefer rich formats
      if (output.data['image/png']) {
        return {
          type: 'image',
          content: output.data['image/png'],
          mimeType: 'image/png',
        };
      }
      if (output.data['image/jpeg']) {
        return {
          type: 'image',
          content: output.data['image/jpeg'],
          mimeType: 'image/jpeg',
        };
      }
      if (output.data['image/svg+xml']) {
        return {
          type: 'image',
          content: Array.isArray(output.data['image/svg+xml']) 
            ? output.data['image/svg+xml'].join('') 
            : output.data['image/svg+xml'],
          mimeType: 'image/svg+xml',
        };
      }
      if (output.data['text/html']) {
        return {
          type: 'html',
          content: Array.isArray(output.data['text/html']) 
            ? output.data['text/html'].join('') 
            : output.data['text/html'],
        };
      }
      if (output.data['text/plain']) {
        return {
          type: 'text',
          content: Array.isArray(output.data['text/plain']) 
            ? output.data['text/plain'].join('') 
            : output.data['text/plain'],
        };
      }
    }

    // Fallback
    return {
      type: 'text',
      content: '',
    };
  }
}

export const jupyterNotebookService = new JupyterNotebookService();
