export class PythonRuntime {
    constructor(statusManager) {
        this.pyodide = null;
        this.isInitialized = false;
        this.statusManager = statusManager;
    }

    async initialize() {
        try {
            this.statusManager.updateStatus('🔄 Loading Python WebAssembly runtime...', 'Loading Python WebAssembly runtime...', 'text-sm status-pulse');
            this.pyodide = await loadPyodide();
            
            // Install common packages
            this.statusManager.updateStatus('📦 Installing basic Python packages...', 'Installing basic Python packages...');
            await this.pyodide.loadPackage(['numpy', 'matplotlib', 'pandas', 'micropip', 'typing-extensions']);
            
            // Run the setup script (installs build123d and other packages)
            await this.runSetupScript();
            
            this.isInitialized = true;
            this.statusManager.updateStatus('🚀 Python environment ready!', 'Python environment ready! 🚀', 'text-sm status-success');
            
        } catch (error) {
            console.error('Failed to initialize Pyodide:', error);
            this.statusManager.updateStatus('❌ Failed to initialize Python environment: ' + error.message, 'Failed to initialize Python environment ❌', 'text-sm status-error');
            throw error;
        }
    }

    async runSetupScript() {
        try {
            this.statusManager.updateStatus('⚙️ Setting up Python environment and packages...', 'Setting up Python environment and packages...');
            const response = await fetch('setup.py');
            const setupScript = await response.text();
            
            // Run the setup script
            await this.pyodide.runPythonAsync(setupScript);
            
            this.statusManager.updateStatus('✅ Python packages installed successfully!', 'Python packages installed successfully!');
            
        } catch (error) {
            console.error('Failed to run setup script:', error);
            this.statusManager.updateStatus('❌ Failed to set up Python environment: ' + error.message, 'Setup failed ❌', 'text-sm status-error');
            throw new Error('Failed to set up Python environment: ' + error.message);
        }
    }

    async runCode(code) {
        if (!this.isInitialized) {
            throw new Error('Python environment is not ready yet');
        }
        
        // Clear previous model data
        window.stlData = null;
        window.partsData = null;
        
        try {
            this.statusManager.updateStatus('🔄 Starting model generation... (this may take 10-30 seconds)', 'Generating model... (this may take 10-30 seconds) ⏳', 'text-sm status-pulse');
            
            // Run the generate script
            const generationOutput = await this.pyodide.runPythonAsync(`
import sys
from io import StringIO

old_stdout = sys.stdout
sys.stdout = buffer = StringIO()

try:
    print("Executing parametric model...")
${code.split('\n').map(line => '    ' + line).join('\n')}
    print("✅ Model generation complete")
except Exception as e:
    print(f"❌ Error in model generation: {str(e)}")
    import traceback
    traceback.print_exc()
    raise e
finally:
    sys.stdout = old_stdout

buffer.getvalue()
            `);
            
            // Display generation output
            if (generationOutput) {
                this.statusManager.consoleManager.appendToConsole('=== MODEL GENERATION OUTPUT ===');
                generationOutput.split('\n').forEach(line => {
                    if (line.trim()) {
                        this.statusManager.consoleManager.appendToPythonConsole(line.trim());
                    }
                });
            }
            
            this.statusManager.updateStatus('🔄 Starting export process - generating STL, STEP, and BREP files...', 'Exporting STL, STEP, and BREP files... 📦');
            
            // Run the export script
            const exportResponse = await fetch('export.py');
            const exportScript = await exportResponse.text();
            
            const exportOutput = await this.pyodide.runPythonAsync(`
import sys
from io import StringIO

old_stdout = sys.stdout
sys.stdout = buffer = StringIO()

try:
${exportScript.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(f"❌ Error in export: {str(e)}")
    import traceback
    traceback.print_exc()
    raise e
finally:
    sys.stdout = old_stdout

buffer.getvalue()
            `);
            
            // Display export output
            if (exportOutput) {
                this.statusManager.consoleManager.appendToConsole('=== EXPORT PROCESS OUTPUT ===');
                exportOutput.split('\n').forEach(line => {
                    if (line.trim()) {
                        this.statusManager.consoleManager.appendToPythonConsole(line.trim());
                    }
                });
            }
            
            return {
                generationOutput,
                exportOutput
            };
            
        } catch (error) {
            this.statusManager.updateStatus(`❌ Runtime Error: ${error.message} - Generation failed`, 'Generation failed ❌', 'text-sm status-error');
            throw error;
        }
    }

    isReady() {
        return this.isInitialized;
    }
} 