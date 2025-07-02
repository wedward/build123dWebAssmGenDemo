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
const mobileToggle = document.getElementById('mobile-toggle');

// Parameter input elements
const lengthInput = document.getElementById('length');
const widthInput = document.getElementById('width');
const thicknessInput = document.getElementById('thickness');
const centerHoleDiaInput = document.getElementById('center-hole-dia');

// Three.js elements
const threeContainer = document.getElementById('three-container');
const viewerPlaceholder = document.getElementById('viewer-placeholder');

// Sidebar element for mobile toggle
const sidebar = document.querySelector('.fixed.left-3.top-3.bottom-3');

// Store the base Python script and current STL data
let basePythonScript = '';
let currentStlBlob = null;
let scene, camera, renderer, controls, currentMesh;

// Mobile sidebar state
let sidebarOpen = false;

// Initialize Pyodide
async function initializePyodide() {
    try {
        statusSpan.textContent = 'Loading Python WebAssembly runtime...';
        statusSpan.className = 'text-sm status-pulse';
        pyodide = await loadPyodide();
        
        // Install common packages
        statusSpan.textContent = 'Installing basic Python packages...';
        await pyodide.loadPackage(['numpy', 'matplotlib', 'pandas', 'micropip', 'typing-extensions']);
        
        // Run the setup script (installs build123d and other packages)
        await runSetupScript();
        
        // Load the generation Python script
        await loadBasePythonScript();
        
        // Initialize Three.js viewer
        initThreeJS();
        
        isInitialized = true;
        runButton.disabled = false;
        runText.textContent = 'Generate Model';
        statusSpan.textContent = 'Python environment ready! 🚀';
        statusSpan.className = 'text-sm status-success';
        
        runPythonCode();
        
    } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        statusSpan.textContent = 'Failed to initialize Python environment ❌';
        statusSpan.className = 'text-sm status-error';
        runText.textContent = 'Initialization Failed';
    }
}

// Initialize Three.js scene
function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // Match CSS background
    
    // Create camera with proper aspect ratio for full screen
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(100, 100, 100);
    
    // Create renderer with full screen dimensions
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
    });
    
    // Force full screen sizing
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    // Ensure canvas fills full screen
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    renderer.domElement.style.zIndex = '1';
    renderer.domElement.style.pointerEvents = 'auto';
    
    // Create controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    
    // Add lights with better setup for full screen
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);
    
    // Add a subtle fill light
    const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
    fillLight.position.set(-50, 50, -50);
    scene.add(fillLight);
    
    // Add grid with better visibility
    const gridHelper = new THREE.GridHelper(200, 20, 0x6b7280, 0x374151);
    gridHelper.material.opacity = 0.5;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

// Handle window resize for full screen layout
function onWindowResize() {
    if (!camera || !renderer) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    // Ensure canvas maintains full screen
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

// Load the generation Python script
async function loadBasePythonScript() {
    try {
        const response = await fetch('generate.py');
        basePythonScript = await response.text();
    } catch (error) {
        console.error('Could not load generate.py:', error);
        throw new Error('Failed to load generation Python script');
    }
}

// Run the setup script
async function runSetupScript() {
    try {
        statusSpan.textContent = 'Setting up Python environment and packages...';
        const response = await fetch('setup.py');
        const setupScript = await response.text();
        
        // Run the setup script
        await pyodide.runPythonAsync(setupScript);
        
        statusSpan.textContent = 'Python packages installed successfully!';
        
    } catch (error) {
        console.error('Failed to run setup script:', error);
        throw new Error('Failed to set up Python environment: ' + error.message);
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

// Create parameterized script with user input values using template substitution
function createParameterizedScript(params) {
    // Use simple template substitution instead of fragile regex replacement
    let script = basePythonScript;
    
    // Replace template placeholders with actual parameter values
    script = script.replace('{{LENGTH}}', params.length);
    script = script.replace('{{WIDTH}}', params.width);
    script = script.replace('{{THICKNESS}}', params.thickness);
    script = script.replace('{{CENTER_HOLE_DIA}}', params.center_hole_dia);
    
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
    
    // Create material with enhanced appearance
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x4f46e5, // Tailwind indigo-600
        shininess: 100,
        specular: 0x333333,
        transparent: false
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
    viewerPlaceholder.style.visibility = 'hidden';
    viewerPlaceholder.style.opacity = '0';
    viewerPlaceholder.style.pointerEvents = 'none';
    
    if (!threeContainer.contains(renderer.domElement)) {
        threeContainer.appendChild(renderer.domElement);
    }
    
    // Ensure canvas is properly positioned and interactive
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    renderer.domElement.style.zIndex = '1';
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.display = 'block';
    
    // Enable buttons
    downloadButton.disabled = false;
    resetViewButton.disabled = false;
    
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
    const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 2;
    
    camera.position.set(cameraZ * 0.7, cameraZ * 0.7, cameraZ * 0.7);
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
    
    const params = getParameterValues();
    const filename = `model_${params.length}x${params.width}x${params.thickness}.stl`;
    
    const url = window.URL.createObjectURL(currentStlBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Mobile sidebar toggle functionality
function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    
    if (sidebarOpen) {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'sidebar-backdrop';
        backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden';
        backdrop.addEventListener('click', toggleSidebar);
        document.body.appendChild(backdrop);
    } else {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
        // Remove backdrop
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }
}

// Handle mobile responsiveness
function handleMobileLayout() {
    const isLargeScreen = window.innerWidth >= 1024; // lg breakpoint
    
    if (isLargeScreen) {
        // Reset sidebar for desktop
        sidebar.classList.remove('-translate-x-full', 'translate-x-0');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        sidebarOpen = false;
    } else {
        // Initialize sidebar as hidden on mobile
        if (!sidebar.classList.contains('-translate-x-full') && !sidebarOpen) {
            sidebar.classList.add('-translate-x-full');
        }
    }
}

// Run Python code with current parameter values
async function runPythonCode() {
    if (!isInitialized) {
        alert('Python environment is not ready yet. Please wait...');
        return;
    }

    if (!basePythonScript) {
        alert('Generation script not loaded. Please refresh the page.');
        return;
    }

    // Show loading state
    runButton.disabled = true;
    runText.textContent = 'Generating...';
    runText.parentElement.classList.add('loading');
    outputDiv.textContent = 'Generating 3D model...';
    
    // Close mobile sidebar if open
    if (sidebarOpen && window.innerWidth < 1024) {
        toggleSidebar();
    }

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
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
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
                
                statusSpan.textContent = 'Model generated successfully! 🎉';
                statusSpan.className = 'text-sm status-success';
            } else {
                throw new Error('No STL data generated');
            }
            
        } catch (e) {
            error = e.message;
        }

        // Display results
        if (error) {
            outputDiv.textContent = `Error: ${error}`;
            statusSpan.textContent = 'Generation failed ❌';
            statusSpan.className = 'text-sm status-error';
        } else {
            outputDiv.textContent = output || 'Model generated successfully';
        }

    } catch (error) {
        outputDiv.textContent = `Runtime Error: ${error.message}`;
        statusSpan.textContent = 'Generation failed ❌';
        statusSpan.className = 'text-sm status-error';
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
mobileToggle.addEventListener('click', toggleSidebar);

// Window resize handler for mobile layout
window.addEventListener('resize', () => {
    onWindowResize();
    handleMobileLayout();
});

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
    
    // Add real-time validation feedback
    input.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value);
        if (isNaN(value) || value < 0) {
            event.target.classList.add('border-red-300', 'ring-red-200');
            event.target.classList.remove('border-gray-300');
        } else {
            event.target.classList.remove('border-red-300', 'ring-red-200');
            event.target.classList.add('border-gray-300');
        }
    });
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializePyodide();
    handleMobileLayout();
}); 