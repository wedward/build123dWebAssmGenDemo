// Import all modules
import { ThreeViewer } from './modules/three-viewer.js';
import { ConsoleManager } from './modules/console-manager.js';
import { StatusManager } from './modules/status-manager.js';
import { PythonRuntime } from './modules/python-runtime.js';
import { ParameterHandler } from './modules/parameter-handler.js';
import { FileDownloads } from './modules/file-downloads.js';
import { UIControls } from './modules/ui-controls.js';

// Main Application Class
class WebAssmPyApp {
    constructor() {
        this.isInitialized = false;
        this.initializeModules();
        this.setupEventListeners();
    }

    initializeModules() {
        // Initialize modules in dependency order
        this.consoleManager = new ConsoleManager();
        this.statusManager = new StatusManager(this.consoleManager);
        this.pythonRuntime = new PythonRuntime(this.statusManager);
        this.parameterHandler = new ParameterHandler(this.statusManager);
        this.fileDownloads = new FileDownloads();
        this.uiControls = new UIControls();
        
        // Initialize Three.js viewer
        const threeContainer = document.getElementById('three-container');
        const viewerPlaceholder = document.getElementById('viewer-placeholder');
        this.threeViewer = new ThreeViewer(threeContainer, viewerPlaceholder);
        
        // Cross-wire dependencies
        this.fileDownloads.parameterHandler = this.parameterHandler;
        this.parameterHandler.onGenerationTrigger = () => this.runPythonCode();
        
        // DOM elements
        this.runButton = document.getElementById('run-code');
        this.runText = document.getElementById('run-text');
        this.clearOutputButton = document.getElementById('clear-output');
        this.resetViewButton = document.getElementById('reset-view');
    }

    setupEventListeners() {
        this.runButton.addEventListener('click', () => this.runPythonCode());
        this.clearOutputButton.addEventListener('click', () => this.clearOutput());
        this.resetViewButton.addEventListener('click', () => this.threeViewer.resetCameraView());
    }

    async initialize() {
        try {
            // Load parameters first for immediate UI feedback
            await this.parameterHandler.loadParameterDefinitionsEarly();
            
            // Initialize Three.js viewer
            this.threeViewer.init();
            
            // Then initialize Python runtime
            await this.pythonRuntime.initialize();
            
            // Skip loading the script if already loaded during early parameter loading
            if (!this.parameterHandler.basePythonScript) {
                await this.parameterHandler.loadBasePythonScript();
            }
            
            this.isInitialized = true;
            this.runButton.disabled = false;
            this.runText.innerHTML = 'Generate Model';
            
            // Auto-run the first generation
            this.runPythonCode();
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.statusManager.updateStatus('❌ Failed to initialize application: ' + error.message, 'Initialization Failed ❌', 'text-sm status-error');
            this.runText.innerHTML = 'Initialization Failed';
        }
    }

    async runPythonCode() {
        if (!this.isInitialized) {
            alert('Python environment is not ready yet. Please wait...');
            return;
        }

        if (!this.parameterHandler.basePythonScript) {
            alert('Generation script not loaded. Please refresh the page.');
            return;
        }

        // Show loading state
        this.runButton.disabled = true;
        this.runText.innerHTML = '<div class="loading-spinner"></div>Generating...';
        this.runText.parentElement.classList.add('loading');
        
        // Close mobile sidebar if open
        this.uiControls.closeSidebarIfOpen();

        try {
            // Get current parameter values
            const params = this.parameterHandler.getParameterValues();
            
            // Create parameterized script
            const code = this.parameterHandler.createParameterizedScript(params);
            
            // Run the Python code
            await this.pythonRuntime.runCode(code);
            
            // Check if model data is available (supports both single and multiple parts)
            if (window.partsData) {
                const partsData = window.partsData;
                this.fileDownloads.updateCurrentParts(partsData);
                
                this.threeViewer.loadParts(partsData);
                this.fileDownloads.enableDownloadButtons();
                this.resetViewButton.disabled = false;
                
                this.statusManager.updateStatus(
                    `🎉 Success! Generated ${partsData.length} parts for 3D viewer - Model generated successfully!`, 
                    `Model generated successfully! 🎉 (${partsData.length} parts)`, 
                    'text-sm status-success'
                );
                
            } else {
                this.consoleManager.appendToConsole('❌ No model data generated');
                throw new Error('No model data generated');
            }
            
        } catch (error) {
            this.consoleManager.appendToConsole(`Runtime Error: ${error.message}`);
            this.statusManager.updateStatus(`❌ Outer Runtime Error: ${error.message}`, 'Generation failed ❌', 'text-sm status-error');
        } finally {
            // Reset button state
            this.runButton.disabled = false;
            this.runText.innerHTML = 'Generate Model';
            this.runText.parentElement.classList.remove('loading');
        }
    }

    clearOutput() {
        this.consoleManager.clearActiveConsole();
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new WebAssmPyApp();
    app.initialize();
}); 