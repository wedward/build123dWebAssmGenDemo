import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

export class ThreeViewer {
    constructor(container, placeholder) {
        this.container = container;
        this.placeholder = placeholder;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentMeshes = [];
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111827); // Match CSS background
        
        // Create camera with proper aspect ratio for full screen
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(100, 100, 100);
        
        // Create renderer with full screen dimensions
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,  // Enable alpha for transparency support
            powerPreference: "high-performance"
        });
        
        // Force full screen sizing
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Enable proper sorting for transparency
        this.renderer.sortObjects = true;
        
        // Ensure canvas fills full screen
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.width = '100vw';
        this.renderer.domElement.style.height = '100vh';
        this.renderer.domElement.style.zIndex = '1';
        this.renderer.domElement.style.pointerEvents = 'auto';
        
        // Create controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 500;
        
        // Add lights with better setup for full screen
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        this.scene.add(directionalLight);
        
        // Add a subtle fill light
        const fillLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
        fillLight.position.set(-50, 50, -50);
        this.scene.add(fillLight);
        
        // Add grid with better visibility
        const gridHelper = new THREE.GridHelper(200, 20, 0x6b7280, 0x374151);
        gridHelper.material.opacity = 0.5;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start animation loop
        this.animate();
        
        this.isInitialized = true;
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        
        // Ensure canvas maintains full screen
        this.renderer.domElement.style.width = '100vw';
        this.renderer.domElement.style.height = '100vh';
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    loadParts(partsData) {
        const loader = new STLLoader();
        
        // Remove existing meshes
        this.currentMeshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.currentMeshes = [];

        const allMeshes = [];
        
        partsData.forEach((partData, index) => {
            // Parse STL data
            const stlData = new Uint8Array(partData.stl);
            const geometry = loader.parse(stlData.buffer);
            
            // Create material with part-specific color and opacity
            const color = partData.color ? partData.color : this.getDefaultColor(index);
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
            this.currentMeshes.push(mesh);
            this.scene.add(mesh);
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
        this.placeholder.style.display = 'none';
        this.placeholder.style.visibility = 'hidden';
        this.placeholder.style.opacity = '0';
        this.placeholder.style.pointerEvents = 'none';
        
        if (!this.container.contains(this.renderer.domElement)) {
            this.container.appendChild(this.renderer.domElement);
        }
        
        // Ensure canvas is properly positioned and interactive
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.width = '100vw';
        this.renderer.domElement.style.height = '100vh';
        this.renderer.domElement.style.zIndex = '1';
        this.renderer.domElement.style.pointerEvents = 'auto';
        this.renderer.domElement.style.display = 'block';
        
        // Fit camera to model
        this.resetCameraView();
    }

    getDefaultColor(index) {
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

    resetCameraView() {
        if (this.currentMeshes.length === 0) return;
        
        // Calculate bounding box for all meshes
        const groupBox = new THREE.Box3();
        this.currentMeshes.forEach(mesh => {
            const meshBox = new THREE.Box3().setFromObject(mesh);
            groupBox.union(meshBox);
        });
        
        const size = groupBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        const fov = this.camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 2;
        
        this.camera.position.set(cameraZ * 0.7, cameraZ * 0.7, cameraZ * 0.7);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }
} 