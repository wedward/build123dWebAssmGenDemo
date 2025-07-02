let pyodide = null;
let isInitialized = false;

// DOM elements
const runButton = document.getElementById('run-code');
const runText = document.getElementById('run-text');
const jsOutputDiv = document.getElementById('js-output');
const pythonOutputDiv = document.getElementById('python-output');
const statusSpan = document.getElementById('status');
const clearOutputButton = document.getElementById('clear-output');
const expandConsoleButton = document.getElementById('expand-console');
const consoleSection = document.getElementById('console-section');
const resizeHandle = document.getElementById('resize-handle');
const downloadButton = document.getElementById('download-stl');
const resetViewButton = document.getElementById('reset-view');
const mobileToggle = document.getElementById('mobile-toggle');
const reloadParamsButton = document.getElementById('reload-params');
const jsConsoleTab = document.getElementById('js-console-tab');
const pythonConsoleTab = document.getElementById('python-console-tab');

// Dynamic parameter storage
let parameterDefinitions = {};
let parameterInputs = {};

// Three.js elements
const threeContainer = document.getElementById('three-container');
const viewerPlaceholder = document.getElementById('viewer-placeholder');

// Sidebar element for mobile toggle
const sidebar = document.querySelector('.fixed.left-3.top-3.bottom-3');

// Store the base Python script and current model data
let basePythonScript = '';
let currentStlBlob = null;
let currentParts = []; // Array to store multiple parts
let scene, camera, renderer, controls, currentMeshes = [];

// Mobile sidebar state
let sidebarOpen = false;

// Console expansion state
let consoleExpanded = true;
let activeConsole = 'js'; // 'js' or 'python'

// Global console functions
function appendToJsConsole(message) {
    jsOutputDiv.innerText += message + '\n';
    jsOutputDiv.scrollTop = jsOutputDiv.scrollHeight;
}

function appendToPythonConsole(message) {
    pythonOutputDiv.innerText += message + '\n';
    pythonOutputDiv.scrollTop = pythonOutputDiv.scrollHeight;
}

function appendToConsole(message) {
    // Default to JS console for backward compatibility
    appendToJsConsole(message);
}

function clearConsole() {
    jsOutputDiv.innerText = '';
    pythonOutputDiv.innerText = '';
}

function clearActiveConsole() {
    if (activeConsole === 'js') {
        jsOutputDiv.innerText = '';
    } else {
        pythonOutputDiv.innerText = '';
    }
}

// Console tab switching
function switchConsoleTab(tabName) {
    activeConsole = tabName;
    
    // Update tab active states
    jsConsoleTab.classList.toggle('active', tabName === 'js');
    pythonConsoleTab.classList.toggle('active', tabName === 'python');
    
    // Show/hide console content
    jsOutputDiv.classList.toggle('hidden', tabName !== 'js');
    pythonOutputDiv.classList.toggle('hidden', tabName !== 'python');
}

// Unified logging function - updates both console and status
function updateStatus(fullMessage, shortMessage, statusClass = 'text-sm') {
    // Update console with full message
    appendToConsole(fullMessage);
    
    // Update status panel with short message
    statusSpan.textContent = shortMessage;
    statusSpan.className = statusClass;
}

// Initialize Pyodide
async function initializePyodide() {
    try {
        updateStatus('🔄 Loading Python WebAssembly runtime...', 'Loading Python WebAssembly runtime...', 'text-sm status-pulse');
        pyodide = await loadPyodide();
        
        // Install common packages
        updateStatus('📦 Installing basic Python packages...', 'Installing basic Python packages...');
        await pyodide.loadPackage(['numpy', 'matplotlib', 'pandas', 'micropip', 'typing-extensions']);
        
        // Run the setup script (installs build123d and other packages)
        await runSetupScript();
        
        // Skip loading the script if already loaded during early parameter loading
        if (!basePythonScript) {
            await loadBasePythonScript();
        }
        
        // Initialize Three.js viewer
        initThreeJS();
        
        isInitialized = true;
        runButton.disabled = false;
        runText.textContent = 'Generate Model';
        updateStatus('🚀 Python environment ready!', 'Python environment ready! 🚀', 'text-sm status-success');
        
        runPythonCode();
        
    } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        updateStatus('❌ Failed to initialize Python environment: ' + error.message, 'Failed to initialize Python environment ❌', 'text-sm status-error');
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
        alpha: true,  // Enable alpha for transparency support
        powerPreference: "high-performance"
    });
    
    // Force full screen sizing
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Updated property name
    
    // Enable proper sorting for transparency
    renderer.sortObjects = true;
    
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

// Parse parameter definitions from Python script
function parseParameterDefinitions(scriptContent) {
    const startMarker = '# PARAMETERS_START';
    const endMarker = '# PARAMETERS_END';
    
    const startIndex = scriptContent.indexOf(startMarker);
    const endIndex = scriptContent.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
        throw new Error('Parameter definitions not found in script');
    }
    
    // Extract the JSON between the markers
    const paramSection = scriptContent.substring(startIndex + startMarker.length, endIndex);
    
    // Remove comment characters and parse JSON
    const jsonString = paramSection
        .split('\n')
        .map(line => line.replace(/^#\s*/, ''))
        .join('\n')
        .trim();
    
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error('Invalid parameter definition JSON: ' + error.message);
    }
}

// Generate dynamic input fields based on parameter definitions
function generateParameterInputs() {
    // Find the container for dynamic parameter inputs
    const parameterContainer = document.querySelector('.space-y-3');
    
    // Clear existing content (loading message)
    parameterContainer.innerHTML = '';
    
    // Generate new inputs based on parameter definitions
    Object.entries(parameterDefinitions).forEach(([paramName, paramDef]) => {
        const inputContainer = document.createElement('div');
        inputContainer.className = 'parameter-group';
        
        const label = document.createElement('label');
        label.htmlFor = `param-${paramName}`;
        label.className = 'block text-xs font-medium text-white/90 mb-1';
        label.textContent = paramDef.label;
        
        const input = document.createElement('input');
        input.type = paramDef.type;
        input.id = `param-${paramName}`;
        input.name = paramName;
        input.value = paramDef.default;
        input.min = paramDef.min;
        input.max = paramDef.max;
        input.step = paramDef.step;
        input.className = 'w-full px-3 py-2 bg-white/5 border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/40';
        
        if (paramDef.description) {
            input.title = paramDef.description;
        }
        
        // Add input validation and Enter key handling
        input.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            if (isNaN(value) || value < paramDef.min || value > paramDef.max) {
                event.target.classList.add('border-red-300', 'ring-red-200');
                event.target.classList.remove('border-white/30');
            } else {
                event.target.classList.remove('border-red-300', 'ring-red-200');
                event.target.classList.add('border-white/30');
            }
        });
        
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                if (!runButton.disabled) {
                    runPythonCode();
                }
            }
        });
        
        inputContainer.appendChild(label);
        inputContainer.appendChild(input);
        parameterContainer.appendChild(inputContainer);
        
        // Store reference to input
        parameterInputs[paramName] = input;
    });
}

// Load the generation Python script
async function loadBasePythonScript() {
    try {
        const response = await fetch('generate.py');
        basePythonScript = await response.text();
        
        // Parse parameter definitions from the script (if not already done)
        if (Object.keys(parameterDefinitions).length === 0) {
            parameterDefinitions = parseParameterDefinitions(basePythonScript);
        }
        
        // Generate dynamic input fields (if not already done)
        if (Object.keys(parameterInputs).length === 0) {
            generateParameterInputs();
        }
        
    } catch (error) {
        console.error('Could not load generate.py:', error);
        throw new Error('Failed to load generation Python script: ' + error.message);
    }
}

// Run the setup script
async function runSetupScript() {
    try {
        updateStatus('⚙️ Setting up Python environment and packages...', 'Setting up Python environment and packages...');
        const response = await fetch('setup.py');
        const setupScript = await response.text();
        
        // Run the setup script
        await pyodide.runPythonAsync(setupScript);
        
        updateStatus('✅ Python packages installed successfully!', 'Python packages installed successfully!');
        
    } catch (error) {
        console.error('Failed to run setup script:', error);
        updateStatus('❌ Failed to set up Python environment: ' + error.message, 'Setup failed ❌', 'text-sm status-error');
        throw new Error('Failed to set up Python environment: ' + error.message);
    }
}

// Get parameter values from dynamic input fields
function getParameterValues() {
    const values = {};
    
    Object.entries(parameterInputs).forEach(([paramName, input]) => {
        const value = parseFloat(input.value);
        const defaultValue = parameterDefinitions[paramName].default;
        values[paramName] = isNaN(value) ? defaultValue : value;
    });
    
    return values;
}

// Create parameterized script with user input values using template substitution
function createParameterizedScript(params) {
    let script = basePythonScript;
    
    // Auto-generate variable assignments right after PARAMETERS_END
    const endMarker = '# PARAMETERS_END';
    const endMarkerIndex = script.indexOf(endMarker);
    
    if (endMarkerIndex !== -1) {
        // Generate variable assignment lines
        const variableAssignments = '\n\n# Auto-generated parameter variables\n' +
            Object.keys(parameterDefinitions)
                .map(paramName => `${paramName} = {{${paramName}}}`)
                .join('\n');
        
        // Find the end of the PARAMETERS_END line
        const lineEnd = script.indexOf('\n', endMarkerIndex);
        
        // Insert variable assignments right after PARAMETERS_END
        script = script.substring(0, lineEnd) + 
                variableAssignments + 
                script.substring(lineEnd);
    }
    
    // Then, replace template placeholders with actual parameter values
    Object.entries(params).forEach(([paramName, value]) => {
        const placeholder = `{{${paramName}}}`;
        script = script.replace(placeholder, value);
    });
    
    return script;
}

// Load parts into Three.js viewer (supports both single STL and multiple parts)
function loadPartsInViewer(partsData) {
    const loader = new THREE.STLLoader();
    
    // Remove existing meshes
    currentMeshes.forEach(mesh => {
        scene.remove(mesh);
    });
    currentMeshes = [];

    const allMeshes = [];
    
    partsData.forEach((partData, index) => {
        // Parse STL data
        const stlData = new Uint8Array(partData.stl);
        const geometry = loader.parse(stlData.buffer);
        
        // Create material with part-specific color and opacity
        const color = partData.color ? partData.color : getDefaultColor(index);
        const opacity = partData.opacity !== undefined ? partData.opacity : 1.0;
        
        const material = new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 100,
            specular: 0x333333,
            transparent: opacity < 1.0,
            opacity: opacity
        });
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = partData.name || `part_${index}`;
        
        // Set render order for transparent objects (higher numbers render later)
        if (material.transparent) {
            mesh.renderOrder = 1;
        }
        
        allMeshes.push(mesh);
        currentMeshes.push(mesh);
        scene.add(mesh);
    });
    
    // Center all parts as a group
    if (allMeshes.length > 0) {
        const groupBox = new THREE.Box3();
        allMeshes.forEach(mesh => {
            const meshBox = new THREE.Box3().setFromObject(mesh);
            groupBox.union(meshBox);
        });
        
        const center = groupBox.getCenter(new THREE.Vector3());
        allMeshes.forEach(mesh => {
            mesh.position.sub(center);
        });
    }
    
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

// Get default colors for parts when not specified
function getDefaultColor(index) {
    const colors = [
        '#4f46e5', // indigo
        '#10b981', // emerald  
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // violet
        '#06b6d4', // cyan
        '#84cc16', // lime
        '#f97316'  // orange
    ];
    return colors[index % colors.length];
}

// Reset camera view to fit the model
function resetCameraView() {
    if (currentMeshes.length === 0) return;
    
    // Calculate bounding box for all meshes
    const groupBox = new THREE.Box3();
    currentMeshes.forEach(mesh => {
        const meshBox = new THREE.Box3().setFromObject(mesh);
        groupBox.union(meshBox);
    });
    
    const size = groupBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 2;
    
    camera.position.set(cameraZ * 0.7, cameraZ * 0.7, cameraZ * 0.7);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
}

// Download STL file(s)
function downloadStl() {
    const params = getParameterValues();
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const paramStr = Object.entries(params)
        .slice(0, 3) // Take first 3 parameters for filename
        .map(([name, value]) => `${name}${value}`)
        .join('_');
    
    if (currentParts.length > 0) {
        // Multiple parts - download each individually
        if (currentParts.length === 1) {
            // Single part in new format
            const part = currentParts[0];
            const blob = new Blob([part.stl], { type: 'application/octet-stream' });
            const filename = `${part.name}_${paramStr}_${timestamp}.stl`;
            downloadBlob(blob, filename);
        } else {
            // Multiple parts - download as zip would be ideal, but for now download separately
            currentParts.forEach((part, index) => {
                const blob = new Blob([part.stl], { type: 'application/octet-stream' });
                const filename = `${part.name}_${paramStr}_${timestamp}.stl`;
                
                // Add small delay between downloads to avoid browser blocking
                setTimeout(() => {
                    downloadBlob(blob, filename);
                }, index * 500);
            });
            
            alert(`Downloading ${currentParts.length} separate STL files. Check your downloads folder.`);
        }
    } else if (currentStlBlob) {
        // Legacy single STL blob
        const filename = `model_${paramStr}_${timestamp}.stl`;
        downloadBlob(currentStlBlob, filename);
    } else {
        alert('No STL file available for download');
    }
}

// Helper function to download a blob
function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
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

// Toggle console visibility
function toggleConsole() {
    consoleExpanded = !consoleExpanded;
    const buttonText = expandConsoleButton.querySelector('span');
    const buttonIcon = expandConsoleButton.querySelector('svg path');
    
    if (consoleExpanded) {
        // Show console
        jsOutputDiv.style.display = 'block';
        pythonOutputDiv.style.display = activeConsole === 'python' ? 'block' : 'none';
        resizeHandle.style.display = 'flex';
        buttonText.textContent = 'Hide';
        buttonIcon.setAttribute('d', 'M17 10l-5 5-5-5'); // Down arrow
    } else {
        // Hide console
        jsOutputDiv.style.display = 'none';
        pythonOutputDiv.style.display = 'none';
        resizeHandle.style.display = 'none';
        buttonText.textContent = 'Show';
        buttonIcon.setAttribute('d', 'M7 14l5-5 5 5'); // Up arrow
    }
}

// Console resize functionality
let isResizing = false;
let startY = 0;
let startHeight = 0;

function initializeConsoleResize() {
    // Mouse events
    resizeHandle.addEventListener('mousedown', startResize);
    
    // Touch events for mobile
    resizeHandle.addEventListener('touchstart', startResize);
}

function startResize(e) {
    isResizing = true;
    startY = e.clientY || e.touches[0].clientY;
    const activeOutputDiv = activeConsole === 'js' ? jsOutputDiv : pythonOutputDiv;
    startHeight = parseInt(document.defaultView.getComputedStyle(activeOutputDiv).height, 10);
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchmove', handleResize);
    document.addEventListener('touchend', stopResize);
    
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
}

function handleResize(e) {
    if (!isResizing) return;
    
    const currentY = e.clientY || e.touches[0].clientY;
    const deltaY = startY - currentY; // Invert direction: dragging up = positive delta = bigger console
    const newHeight = startHeight + deltaY;
    
    // Enforce min/max constraints
    const minHeight = 80;
    const maxHeight = 400;
    const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    
    // Apply the new height to both consoles so they stay in sync
    jsOutputDiv.style.height = constrainedHeight + 'px';
    pythonOutputDiv.style.height = constrainedHeight + 'px';
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', handleResize);
    document.removeEventListener('touchend', stopResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
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
    runText.textContent = '⏳ Generating...';
    runText.parentElement.classList.add('loading');
    
    // Close mobile sidebar if open
    if (sidebarOpen && window.innerWidth < 1024) {
        toggleSidebar();
    }

    try {
        // Get current parameter values
        const params = getParameterValues();
        
        // Create parameterized script
        const code = createParameterizedScript(params);
        
        // Clear previous model data
        window.stlData = null;
        window.partsData = null;
        
        try {
            // Don't clear console - preserve previous logs
            updateStatus('🔄 Starting model generation... (this may take 10-30 seconds)', 'Generating model... (this may take 10-30 seconds) ⏳', 'text-sm status-pulse');
            
            // First run the generate script
            const generationOutput = await pyodide.runPythonAsync(`
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
            
            // Display generation output as it completes
            if (generationOutput) {
                appendToConsole('=== MODEL GENERATION OUTPUT ===');
                generationOutput.split('\n').forEach(line => {
                    if (line.trim()) {
                        appendToPythonConsole(line.trim());
                    }
                });
            }
            
            updateStatus('🔄 Starting export process - generating STL files...', 'Exporting STL files... 📦');
            
            // Then run the export script
            const exportResponse = await fetch('export.py');
            const exportScript = await exportResponse.text();
            
            const exportOutput = await pyodide.runPythonAsync(`
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
            
            // Display export output as it completes
            if (exportOutput) {
                appendToConsole('=== EXPORT PROCESS OUTPUT ===');
                exportOutput.split('\n').forEach(line => {
                    if (line.trim()) {
                        appendToPythonConsole(line.trim());
                    }
                });
            }
            
            // Check if model data is available (supports both single and multiple parts)
            if (window.partsData) {
                const partsData = window.partsData;
                currentParts = partsData;
                
                loadPartsInViewer(partsData);
                
                updateStatus(`🎉 Success! Generated ${partsData.length} parts for 3D viewer - Model generated successfully!`, `Model generated successfully! 🎉 (${partsData.length} parts)`, 'text-sm status-success');
                
            } else if (window.stlData) {
                // Single part format (legacy support)
                const stlData = new Uint8Array(window.stlData);
                currentStlBlob = new Blob([stlData], { type: 'application/octet-stream' });
                loadPartsInViewer(stlData);
                
                updateStatus('🎉 Success! Generated model for 3D viewer - Model generated successfully!', 'Model generated successfully! 🎉', 'text-sm status-success');
            } else {
                appendToConsole('❌ No model data generated');
                throw new Error('No model data generated');
            }
            
        } catch (e) {
            updateStatus(`❌ Runtime Error: ${e.message} - Generation failed`, 'Generation failed ❌', 'text-sm status-error');
        }

    } catch (error) {
        appendToConsole(`Runtime Error: ${error.message}`);
        updateStatus(`❌ Outer Runtime Error: ${error.message}`, 'Generation failed ❌', 'text-sm status-error');
    } finally {
        // Reset button state
        runButton.disabled = false;
        runText.textContent = 'Generate Model';
        runText.parentElement.classList.remove('loading');
    }
}

// Clear output
function clearOutput() {
    clearActiveConsole();
}

// Event listeners
runButton.addEventListener('click', runPythonCode);
clearOutputButton.addEventListener('click', clearOutput);
expandConsoleButton.addEventListener('click', toggleConsole);
downloadButton.addEventListener('click', downloadStl);
resetViewButton.addEventListener('click', resetCameraView);
reloadParamsButton.addEventListener('click', reloadParameterDefinitions);
mobileToggle.addEventListener('click', toggleSidebar);
jsConsoleTab.addEventListener('click', () => switchConsoleTab('js'));
pythonConsoleTab.addEventListener('click', () => switchConsoleTab('python'));

// Window resize handler for mobile layout
window.addEventListener('resize', () => {
    onWindowResize();
    handleMobileLayout();
});

// Event handlers for dynamic inputs are set up in generateParameterInputs()

// Load parameter definitions early for better UX
async function loadParameterDefinitionsEarly() {
    try {
        updateStatus('📋 Loading parameter definitions...', 'Loading parameter definitions...');
        const response = await fetch('generate.py');
        const scriptContent = await response.text();
        
        // Parse parameter definitions from the script
        parameterDefinitions = parseParameterDefinitions(scriptContent);
        
        // Generate dynamic input fields immediately
        generateParameterInputs();
        
        updateStatus('✅ Parameters loaded! Starting Python environment...', 'Parameters loaded! Starting Python environment...');
        
        // Store the script content for later use
        basePythonScript = scriptContent;
        
    } catch (error) {
        console.error('Failed to load parameter definitions:', error);
        updateStatus('❌ Failed to load parameter definitions: ' + error.message, 'Failed to load parameters ❌', 'text-sm status-error');
        
        // Still try to initialize Pyodide even if parameter loading fails
        throw error;
    }
}

// Reload parameter definitions from generate.py
async function reloadParameterDefinitions() {
    try {
        // Disable the reload button during reload
        reloadParamsButton.disabled = true;
        reloadParamsButton.innerHTML = '<svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg><span>Reloading...</span>';
        
        updateStatus('🔄 Reloading parameter definitions...', 'Reloading parameter definitions...', 'text-sm status-pulse');
        
        // Preserve existing parameter values
        const existingValues = {};
        Object.entries(parameterInputs).forEach(([paramName, input]) => {
            existingValues[paramName] = input.value;
        });
        
        // Re-fetch the script
        const response = await fetch('generate.py?' + Date.now()); // Cache-busting
        const scriptContent = await response.text();
        
        // Parse new parameter definitions
        const newParameterDefinitions = parseParameterDefinitions(scriptContent);
        
        // Update stored data
        parameterDefinitions = newParameterDefinitions;
        basePythonScript = scriptContent;
        
        // Clear existing inputs
        parameterInputs = {};
        
        // Generate new input fields
        generateParameterInputs();
        
        // Restore existing values where parameter names match
        Object.entries(existingValues).forEach(([paramName, value]) => {
            if (parameterInputs[paramName]) {
                parameterInputs[paramName].value = value;
            }
        });
        
        updateStatus('✅ Parameters reloaded successfully! 🔄', 'Parameters reloaded successfully! 🔄', 'text-sm status-success');
        
        // Show a brief success message
        setTimeout(() => {
            if (isInitialized) {
                statusSpan.textContent = 'Python environment ready! 🚀';
            }
        }, 2000);
        
    } catch (error) {
        console.error('Failed to reload parameter definitions:', error);
        updateStatus('❌ Failed to reload parameter definitions: ' + error.message, 'Failed to reload parameters ❌', 'text-sm status-error');
    } finally {
        // Re-enable the reload button
        reloadParamsButton.disabled = false;
        reloadParamsButton.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg><span>Reload</span>';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize console resize functionality
    initializeConsoleResize();
    
    // Load parameters first for immediate UI feedback
    try {
        await loadParameterDefinitionsEarly();
    } catch (error) {
        console.error('Parameter loading failed, continuing with Pyodide initialization');
    }
    
    // Then initialize Pyodide in parallel
    initializePyodide();
    handleMobileLayout();
}); 