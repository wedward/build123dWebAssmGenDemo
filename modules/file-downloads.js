export class FileDownloads {
    constructor() {
        this.currentParts = [];
        this.setupEventListeners();
    }

    updateCurrentParts(parts) {
        this.currentParts = parts;
    }

    enableDownloadButtons() {
        document.getElementById('download-stl').disabled = false;
        document.getElementById('download-step').disabled = false;
        document.getElementById('download-brep').disabled = false;
    }

    // Helper method to generate filename
    generateFilename(partName, extension) {
        const params = this.getParameterValues();
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const paramStr = Object.entries(params)
            .slice(0, 3) // Take first 3 parameters for filename
            .map(([name, value]) => `${name}${value}`)
            .join('_');
        
        return `${partName}_${paramStr}_${timestamp}.${extension}`;
    }

    // Helper method to download multiple parts with delays
    downloadMultipleParts(parts, extension, dataKey) {
        parts.forEach((part, index) => {
            const blob = new Blob([part[dataKey]], { type: 'application/octet-stream' });
            const filename = this.generateFilename(part.name, extension);
            
            // Add small delay between downloads to avoid browser blocking
            setTimeout(() => {
                this.downloadBlob(blob, filename);
            }, index * 500);
        });
        
        alert(`Downloading ${parts.length} separate ${extension.toUpperCase()} files. Check your downloads folder.`);
    }

    // Helper method to download single part
    downloadSinglePart(part, extension, dataKey) {
        const blob = new Blob([part[dataKey]], { type: 'application/octet-stream' });
        const filename = this.generateFilename(part.name, extension);
        this.downloadBlob(blob, filename);
    }

    // Generic method to handle part-based downloads
    downloadParts(extension, dataKey) {
        if (this.currentParts.length === 0) {
            alert(`No ${extension.toUpperCase()} files available for download`);
            return;
        }

        const availableParts = this.currentParts.filter(part => part[dataKey]);
        
        if (availableParts.length === 0) {
            alert(`No ${extension.toUpperCase()} files available for download. Please regenerate the model.`);
            return;
        }
        
        if (availableParts.length === 1) {
            this.downloadSinglePart(availableParts[0], extension, dataKey);
        } else {
            this.downloadMultipleParts(availableParts, extension, dataKey);
        }
    }

    // Download STL file(s)
    downloadStl() {
        this.downloadParts('stl', 'stl');
    }

    // Download STEP file(s)
    downloadStep() {
        this.downloadParts('step', 'step');
    }

    // Download BREP file(s)
    downloadBrep() {
        this.downloadParts('brep', 'brep');
    }

    // Helper function to download a blob
    downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    getParameterValues() {
        // This will be injected by the main script
        return this.parameterHandler ? this.parameterHandler.getParameterValues() : {};
    }

    setupEventListeners() {
        document.getElementById('download-stl').addEventListener('click', () => this.downloadStl());
        document.getElementById('download-step').addEventListener('click', () => this.downloadStep());
        document.getElementById('download-brep').addEventListener('click', () => this.downloadBrep());
    }
} 