let pyodide = null;
let isInitialized = false;

// DOM elements
const pythonCodeTextarea = document.getElementById('python-code');
const runButton = document.getElementById('run-code');
const runText = document.getElementById('run-text');
const outputDiv = document.getElementById('output');
const statusSpan = document.getElementById('status');
const loadExampleButton = document.getElementById('load-example');
const clearCodeButton = document.getElementById('clear-code');
const clearOutputButton = document.getElementById('clear-output');

// Initialize Pyodide
async function initializePyodide() {
    try {
        statusSpan.textContent = 'Loading Python WebAssembly runtime...';
        pyodide = await loadPyodide();
        
        // Install common packages
        statusSpan.textContent = 'Installing Python packages...';
        await pyodide.loadPackage(['numpy', 'matplotlib', 'pandas', 'micropip', 'typing-extensions']);
        
        isInitialized = true;
        runButton.disabled = false;
        runText.textContent = 'Run Python Code';
        statusSpan.textContent = 'Python environment ready! 🚀';
        statusSpan.className = 'success';
        
        // Load example code by default
        loadExampleCode();
        
    } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        statusSpan.textContent = 'Failed to initialize Python environment ❌';
        statusSpan.className = 'error';
        runText.textContent = 'Initialization Failed';
    }
}

// Run Python code
async function runPythonCode() {
    if (!isInitialized) {
        alert('Python environment is not ready yet. Please wait...');
        return;
    }

    const code = pythonCodeTextarea.value.trim();
    if (!code) {
        alert('Please enter some Python code to run.');
        return;
    }

    // Show loading state
    runButton.disabled = true;
    runText.textContent = 'Running...';
    runText.parentElement.classList.add('loading');
    outputDiv.textContent = '';

    try {
        // Use async execution to support micropip
        let output = '';
        let error = '';
        
        try {
            output = await pyodide.runPythonAsync(`
import sys
from io import StringIO

old_stdout = sys.stdout
sys.stdout = buffer = StringIO()

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(str(e))
finally:
    sys.stdout = old_stdout

buffer.getvalue()
            `);
        } catch (e) {
            error = e.message;
        }

        // Display results
        if (error) {
            outputDiv.textContent = `Error: ${error}`;
            outputDiv.style.color = '#f56565';
        } else {
            outputDiv.textContent = output || 'Code executed successfully (no output)';
            outputDiv.style.color = '#e2e8f0';
        }

    } catch (error) {
        outputDiv.textContent = `Runtime Error: ${error.message}`;
        outputDiv.style.color = '#f56565';
    } finally {
        // Reset button state
        runButton.disabled = false;
        runText.textContent = 'Run Python Code';
        runText.parentElement.classList.remove('loading');
    }
}

// Load example Python code
function loadExampleCode() {
    fetch('example.py')
        .then(response => response.text())
        .then(code => {
            pythonCodeTextarea.value = code;
        })
        .catch(error => {
            console.warn('Could not load example.py, using default example');
            pythonCodeTextarea.value = `print("Hello World!")`;
        });
}

// Clear code
function clearCode() {
    pythonCodeTextarea.value = '';
    pythonCodeTextarea.focus();
}

// Clear output
function clearOutput() {
    outputDiv.textContent = '';
}

// Event listeners
runButton.addEventListener('click', runPythonCode);
loadExampleButton.addEventListener('click', loadExampleCode);
clearCodeButton.addEventListener('click', clearCode);
clearOutputButton.addEventListener('click', clearOutput);

// Allow Ctrl+Enter to run code
pythonCodeTextarea.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!runButton.disabled) {
            runPythonCode();
        }
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializePyodide); 