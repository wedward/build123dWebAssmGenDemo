let pyodide = null;
let isInitialized = false;

// DOM elements
const runButton = document.getElementById('run-code');
const runText = document.getElementById('run-text');
const outputDiv = document.getElementById('output');
const statusSpan = document.getElementById('status');
const clearOutputButton = document.getElementById('clear-output');
const downloadButton = document.getElementById('download-stl');
const resetViewButton = document.getElementById('reset-view');

// Parameter input elements
const lengthInput = document.getElementById('length');
const widthInput = document.getElementById('width');
const thicknessInput = document.getElementById('thickness');
const centerHoleDiaInput = document.getElementById('center-hole-dia');

// Three.js elements
const threeContainer = document.getElementById('three-container');
const viewerPlaceholder = document.getElementById('viewer-placeholder');

// Store the base Python script and current STL data
let basePythonScript = '';
let currentStlBlob = null;
let scene, camera, renderer, controls, currentMesh;

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
        
        // Initialize Three.js viewer
        initThreeJS();
        
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

// Initialize Three.js scene
function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
    camera.position.set(100, 100, 100);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add grid
    const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Handle window resize
function onWindowResize() {
    if (!camera || !renderer) return;
    
    camera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
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
    
    // Modify the script to return STL data instead of auto-downloading
    script = script.replace(
        /a\.click\(\)/,
        `# Store STL data for 3D viewer instead of auto-downloading
from pyodide.ffi import to_js
import js
js.window.stlData = to_js(stl, create_pyproxies=False)
print("STL data ready for 3D viewer")`
    );
    
    return script;
}

// Load STL into Three.js viewer
function loadStlInViewer(stlData) {
    const loader = new THREE.STLLoader();
    
    // STLLoader can handle ArrayBuffer directly for binary STL files
    const geometry = loader.parse(stlData.buffer);
    
    // Remove existing mesh
    if (currentMesh) {
        scene.remove(currentMesh);
    }
    
    // Create material
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x049ef4,
        shininess: 100,
        specular: 0x222222
    });
    
    // Create mesh
    currentMesh = new THREE.Mesh(geometry, material);
    currentMesh.castShadow = true;
    currentMesh.receiveShadow = true;
    
    // Center the model
    const box = new THREE.Box3().setFromObject(currentMesh);
    const center = box.getCenter(new THREE.Vector3());
    currentMesh.position.sub(center);
    
    // Add to scene
    scene.add(currentMesh);
    
    // Hide placeholder and show canvas
    viewerPlaceholder.style.display = 'none';
    if (!threeContainer.contains(renderer.domElement)) {
        threeContainer.appendChild(renderer.domElement);
    }
    
    // Enable buttons
    downloadButton.disabled = false;
    resetViewButton.disabled = false;
    
    // Start animation loop if not already running
    animate();
    
    // Fit camera to model
    resetCameraView();
}

// Reset camera view to fit the model
function resetCameraView() {
    if (!currentMesh) return;
    
    const box = new THREE.Box3().setFromObject(currentMesh);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;
    
    camera.position.set(cameraZ, cameraZ, cameraZ);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}

// Download STL file
function downloadStl() {
    if (!currentStlBlob) {
        alert('No STL file available for download');
        return;
    }
    
    const url = window.URL.createObjectURL(currentStlBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_model.stl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
        
        // Clear previous STL data
        window.stlData = null;
        
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
            
            // Check if STL data is available
            if (window.stlData) {
                // Convert JavaScript array to Uint8Array
                const stlData = new Uint8Array(window.stlData);
                currentStlBlob = new Blob([stlData], { type: 'application/octet-stream' });
                loadStlInViewer(stlData);
            }
            
        } catch (e) {
            error = e.message;
        }

        // Display results
        if (error) {
            outputDiv.textContent = `Error: ${error}`;
            outputDiv.style.color = '#f56565';
        } else {
            outputDiv.textContent = output || 'Model generated successfully';
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
downloadButton.addEventListener('click', downloadStl);
resetViewButton.addEventListener('click', resetCameraView);

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