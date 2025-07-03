export class StatusManager {
    constructor(consoleManager) {
        this.consoleManager = consoleManager;
        this.statusSpan = document.getElementById('status');
    }

    // Unified logging function - updates both console and status
    updateStatus(fullMessage, shortMessage, statusClass = 'text-sm') {
        // Update console with full message
        this.consoleManager.appendToConsole(fullMessage);
        
        // Update status panel with short message
        this.statusSpan.textContent = shortMessage;
        this.statusSpan.className = statusClass;
    }
} 