export class ConsoleManager {
    constructor() {
        this.jsOutputDiv = document.getElementById('js-output');
        this.pythonOutputDiv = document.getElementById('python-output');
        this.expandConsoleButton = document.getElementById('expand-console');
        this.resizeHandle = document.getElementById('resize-handle');
        this.jsConsoleTab = document.getElementById('js-console-tab');
        this.pythonConsoleTab = document.getElementById('python-console-tab');
        
        this.activeConsole = 'js';
        this.consoleExpanded = true;
        this.isResizing = false;
        this.startY = 0;
        this.startHeight = 0;
        
        this.initializeResize();
        this.setupEventListeners();
    }

    appendToJsConsole(message) {
        this.jsOutputDiv.innerText += message + '\n';
        this.jsOutputDiv.scrollTop = this.jsOutputDiv.scrollHeight;
    }

    appendToPythonConsole(message) {
        this.pythonOutputDiv.innerText += message + '\n';
        this.pythonOutputDiv.scrollTop = this.pythonOutputDiv.scrollHeight;
    }

    appendToConsole(message) {
        // Default to JS console for backward compatibility
        this.appendToJsConsole(message);
    }

    clearConsole() {
        this.jsOutputDiv.innerText = '';
        this.pythonOutputDiv.innerText = '';
    }

    clearActiveConsole() {
        if (this.activeConsole === 'js') {
            this.jsOutputDiv.innerText = '';
        } else {
            this.pythonOutputDiv.innerText = '';
        }
    }

    switchConsoleTab(tabName) {
        this.activeConsole = tabName;
        
        // Update tab active states
        this.jsConsoleTab.classList.toggle('active', tabName === 'js');
        this.pythonConsoleTab.classList.toggle('active', tabName === 'python');
        
        // Show/hide console content
        this.jsOutputDiv.classList.toggle('hidden', tabName !== 'js');
        this.pythonOutputDiv.classList.toggle('hidden', tabName !== 'python');
    }

    toggleConsole() {
        this.consoleExpanded = !this.consoleExpanded;
        const buttonText = this.expandConsoleButton.querySelector('span');
        const buttonIcon = this.expandConsoleButton.querySelector('svg path');
        
        if (this.consoleExpanded) {
            // Show console
            this.jsOutputDiv.style.display = 'block';
            this.pythonOutputDiv.style.display = this.activeConsole === 'python' ? 'block' : 'none';
            this.resizeHandle.style.display = 'flex';
            buttonText.textContent = 'Hide';
            buttonIcon.setAttribute('d', 'M17 10l-5 5-5-5'); // Down arrow
        } else {
            // Hide console
            this.jsOutputDiv.style.display = 'none';
            this.pythonOutputDiv.style.display = 'none';
            this.resizeHandle.style.display = 'none';
            buttonText.textContent = 'Show';
            buttonIcon.setAttribute('d', 'M7 14l5-5 5 5'); // Up arrow
        }
    }

    initializeResize() {
        // Mouse events
        this.resizeHandle.addEventListener('mousedown', (e) => this.startResize(e));
        
        // Touch events for mobile
        this.resizeHandle.addEventListener('touchstart', (e) => this.startResize(e));
    }

    startResize(e) {
        this.isResizing = true;
        this.startY = e.clientY || e.touches[0].clientY;
        const activeOutputDiv = this.activeConsole === 'js' ? this.jsOutputDiv : this.pythonOutputDiv;
        this.startHeight = parseInt(document.defaultView.getComputedStyle(activeOutputDiv).height, 10);
        
        document.addEventListener('mousemove', (e) => this.handleResize(e));
        document.addEventListener('mouseup', () => this.stopResize());
        document.addEventListener('touchmove', (e) => this.handleResize(e));
        document.addEventListener('touchend', () => this.stopResize());
        
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    }

    handleResize(e) {
        if (!this.isResizing) return;
        
        const currentY = e.clientY || e.touches[0].clientY;
        const deltaY = this.startY - currentY; // Invert direction: dragging up = positive delta = bigger console
        const newHeight = this.startHeight + deltaY;
        
        // Enforce min/max constraints
        const minHeight = 80;
        const maxHeight = 400;
        const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
        
        // Apply the new height to both consoles so they stay in sync
        this.jsOutputDiv.style.height = constrainedHeight + 'px';
        this.pythonOutputDiv.style.height = constrainedHeight + 'px';
    }

    stopResize() {
        this.isResizing = false;
        document.removeEventListener('mousemove', this.handleResize);
        document.removeEventListener('mouseup', this.stopResize);
        document.removeEventListener('touchmove', this.handleResize);
        document.removeEventListener('touchend', this.stopResize);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    setupEventListeners() {
        this.expandConsoleButton.addEventListener('click', () => this.toggleConsole());
        this.jsConsoleTab.addEventListener('click', () => this.switchConsoleTab('js'));
        this.pythonConsoleTab.addEventListener('click', () => this.switchConsoleTab('python'));
    }
} 