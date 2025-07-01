let pyodide = null;
let isInitialized = false;

// DOM elements
const runButton = document.getElementById('run-code');
const runText = document.getElementById('run-text');
const outputDiv = document.getElementById('output');
const statusSpan = document.getElementById('status');
const clearOutputButton = document.getElementById('clear-output');

// Parameter input elements
const lengthInput = document.getElementById('length');
const widthInput = document.getElementById('width');
const thicknessInput = document.getElementById('thickness');
const centerHoleDiaInput = document.getElementById('center-hole-dia');

// Store the base Python script
let basePythonScript = '';

// Initialize Pyodide
async function initializePyodide() {
    try {
        statusSpan.textContent = 'Loading Python WebAssembly runtime...';
        pyodide = await loadPyodide();
        
        // Install common packages
        statusSpan.textContent = 'Installing Python packages...';
        await pyodide.loadPackage(['numpy', 'matplotlib', 'pandas', 'micropip', 'typing-extensions']);
        
        // Load the base Python script
        await loadBasePythonScript();
        
        isInitialized = true;
        runButton.disabled = false;
        runText.textContent = 'Generate Model';
        statusSpan.textContent = 'Python environment ready! 🚀';
        statusSpan.className = 'success';
        
    } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        statusSpan.textContent = 'Failed to initialize Python environment ❌';
        statusSpan.className = 'error';
        runText.textContent = 'Initialization Failed';
    }
}

// Load the base Python script
async function loadBasePythonScript() {
    try {
        const response = await fetch('example.py');
        basePythonScript = await response.text();
    } catch (error) {
        console.error('Could not load example.py:', error);
        throw new Error('Failed to load base Python script');
    }
}

// Get parameter values from input fields
function getParameterValues() {
    return {
        length: parseFloat(lengthInput.value) || 80.0,
        width: parseFloat(widthInput.value) || 60.0,
        thickness: parseFloat(thicknessInput.value) || 10.0,
        center_hole_dia: parseFloat(centerHoleDiaInput.value) || 22.0
    };
}

// Substitute parameter values into the Python script
function createParameterizedScript(params) {
    // Replace the parameter assignments in the script
    let script = basePythonScript;
    
    // Replace the parameter line with user values
    script = script.replace(
        /length, width, thickness = [\d.]+, [\d.]+, [\d.]+/,
        `length, width, thickness = ${params.length}, ${params.width}, ${params.thickness}`
    );
    
    script = script.replace(
        /center_hole_dia = [\d.]+/,
        `center_hole_dia = ${params.center_hole_dia}`
    );
    
    return script;
}

// Run Python code with current parameter values
async function runPythonCode() {
    if (!isInitialized) {
        alert('Python environment is not ready yet. Please wait...');
        return;
    }

    if (!basePythonScript) {
        alert('Base Python script not loaded. Please refresh the page.');
        return;
    }

    // Show loading state
    runButton.disabled = true;
    runText.textContent = 'Generating...';
    runText.parentElement.classList.add('loading');
    outputDiv.textContent = '';

    try {
        // Get current parameter values
        const params = getParameterValues();
        
        // Create parameterized script
        const code = createParameterizedScript(params);
        
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
            outputDiv.textContent = output || 'Model generated successfully (no output)';
            outputDiv.style.color = '#e2e8f0';
        }

    } catch (error) {
        outputDiv.textContent = `Runtime Error: ${error.message}`;
        outputDiv.style.color = '#f56565';
    } finally {
        // Reset button state
        runButton.disabled = false;
        runText.textContent = 'Generate Model';
        runText.parentElement.classList.remove('loading');
    }
}

// Clear output
function clearOutput() {
    outputDiv.textContent = '';
}

// Event listeners
runButton.addEventListener('click', runPythonCode);
clearOutputButton.addEventListener('click', clearOutput);

// Allow Enter key to run code from parameter inputs
[lengthInput, widthInput, thicknessInput, centerHoleDiaInput].forEach(input => {
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (!runButton.disabled) {
                runPythonCode();
            }
        }
    });
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializePyodide); 