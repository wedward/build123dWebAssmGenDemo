export class ParameterHandler {
    constructor(statusManager) {
        this.statusManager = statusManager;
        this.parameterDefinitions = {};
        this.parameterInputs = {};
        this.basePythonScript = '';
        this.reloadParamsButton = document.getElementById('reload-params');
        
        this.setupEventListeners();
    }

    parseParameterDefinitions(scriptContent) {
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

    generateParameterInputs() {
        // Find the container for dynamic parameter inputs
        const parameterContainer = document.querySelector('.space-y-3');
        
        // Clear existing content (loading message)
        parameterContainer.innerHTML = '';
        
        // Generate new inputs based on parameter definitions
        Object.entries(this.parameterDefinitions).forEach(([paramName, paramDef]) => {
            const inputContainer = document.createElement('div');
            inputContainer.className = 'parameter-group';
            
            const label = document.createElement('label');
            label.htmlFor = `param-${paramName}`;
            label.className = 'block text-xs font-medium text-white/90 mb-1';
            label.textContent = paramDef.label;
            
            let inputElement;
            
            if (paramDef.type === 'bool') {
                inputElement = this.createBooleanInput(paramName, paramDef, label, inputContainer);
            } else if (paramDef.type === 'string' || paramDef.type === 'text') {
                inputElement = this.createStringInput(paramName, paramDef, label, inputContainer);
            } else {
                inputElement = this.createNumberInput(paramName, paramDef, label, inputContainer);
            }
            
            parameterContainer.appendChild(inputContainer);
            
            // Store reference to input
            this.parameterInputs[paramName] = inputElement;
        });
    }

    createBooleanInput(paramName, paramDef, label, container) {
        // Create toggle switch for boolean parameters
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'flex items-center space-x-3';
        
        const toggle = document.createElement('div');
        toggle.className = 'relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out cursor-pointer bg-white/20 hover:bg-white/30';
        toggle.id = `param-${paramName}`;
        
        const toggleSwitch = document.createElement('div');
        toggleSwitch.className = 'inline-block w-4 h-4 transform bg-white rounded-full transition duration-200 ease-in-out translate-x-1';
        
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'checkbox';
        hiddenInput.checked = paramDef.default;
        hiddenInput.className = 'hidden';
        hiddenInput.name = paramName;
        
        // Update toggle appearance based on state
        const updateToggleState = () => {
            if (hiddenInput.checked) {
                toggle.classList.add('bg-blue-600');
                toggle.classList.remove('bg-white/20');
                toggleSwitch.classList.add('translate-x-6');
                toggleSwitch.classList.remove('translate-x-1');
            } else {
                toggle.classList.remove('bg-blue-600');
                toggle.classList.add('bg-white/20');
                toggleSwitch.classList.remove('translate-x-6');
                toggleSwitch.classList.add('translate-x-1');
            }
        };
        
        // Initialize toggle state
        updateToggleState();
        
        // Toggle click handler
        toggle.addEventListener('click', () => {
            hiddenInput.checked = !hiddenInput.checked;
            updateToggleState();
        });
        
        // Enter key handling for toggle
        toggle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                hiddenInput.checked = !hiddenInput.checked;
                updateToggleState();
                if (event.key === 'Enter') {
                    this.triggerGeneration();
                }
            }
        });
        
        // Make toggle focusable
        toggle.setAttribute('tabindex', '0');
        toggle.setAttribute('role', 'switch');
        toggle.setAttribute('aria-checked', hiddenInput.checked);
        
        if (paramDef.description) {
            toggle.title = paramDef.description;
        }
        
        toggle.appendChild(toggleSwitch);
        toggleContainer.appendChild(toggle);
        
        const toggleLabel = document.createElement('span');
        toggleLabel.className = 'text-xs text-white/70';
        toggleLabel.textContent = hiddenInput.checked ? 'On' : 'Off';
        toggleContainer.appendChild(toggleLabel);
        
        // Update label text when toggle changes
        toggle.addEventListener('click', () => {
            setTimeout(() => {
                toggleLabel.textContent = hiddenInput.checked ? 'On' : 'Off';
                toggle.setAttribute('aria-checked', hiddenInput.checked);
            }, 0);
        });
        
        container.appendChild(label);
        container.appendChild(toggleContainer);
        
        return hiddenInput;
    }

    createStringInput(paramName, paramDef, label, container) {
        // Create text input for string parameters
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `param-${paramName}`;
        input.name = paramName;
        input.value = paramDef.default || '';
        input.placeholder = paramDef.placeholder || '';
        input.className = 'w-full px-3 py-2 bg-white/5 border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/40';
        
        if (paramDef.description) {
            input.title = paramDef.description;
        }
        
        // Add Enter key handling for string inputs
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.triggerGeneration();
            }
        });
        
        // Optional validation for string length
        if (paramDef.minLength || paramDef.maxLength) {
            input.addEventListener('input', (event) => {
                const value = event.target.value;
                const minLen = paramDef.minLength || 0;
                const maxLen = paramDef.maxLength || Infinity;
                
                if (value.length < minLen || value.length > maxLen) {
                    event.target.classList.add('border-red-300', 'ring-red-200');
                    event.target.classList.remove('border-white/30');
                } else {
                    event.target.classList.remove('border-red-300', 'ring-red-200');
                    event.target.classList.add('border-white/30');
                }
            });
        }
        
        container.appendChild(label);
        container.appendChild(input);
        
        return input;
    }

    createNumberInput(paramName, paramDef, label, container) {
        // Create regular input for number parameters
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
                this.triggerGeneration();
            }
        });
        
        container.appendChild(label);
        container.appendChild(input);
        
        return input;
    }

    async loadBasePythonScript() {
        try {
            const response = await fetch('generate.py');
            this.basePythonScript = await response.text();
            
            // Parse parameter definitions from the script (if not already done)
            if (Object.keys(this.parameterDefinitions).length === 0) {
                this.parameterDefinitions = this.parseParameterDefinitions(this.basePythonScript);
            }
            
            // Generate dynamic input fields (if not already done)
            if (Object.keys(this.parameterInputs).length === 0) {
                this.generateParameterInputs();
            }
            
        } catch (error) {
            console.error('Could not load generate.py:', error);
            throw new Error('Failed to load generation Python script: ' + error.message);
        }
    }

    async loadParameterDefinitionsEarly() {
        try {
            this.statusManager.updateStatus('📋 Loading parameter definitions...', 'Loading parameter definitions...');
            const response = await fetch('generate.py');
            const scriptContent = await response.text();
            
            // Parse parameter definitions from the script
            this.parameterDefinitions = this.parseParameterDefinitions(scriptContent);
            
            // Generate dynamic input fields immediately
            this.generateParameterInputs();
            
            this.statusManager.updateStatus('✅ Parameters loaded! Starting Python environment...', 'Parameters loaded! Starting Python environment...');
            
            // Store the script content for later use
            this.basePythonScript = scriptContent;
            
        } catch (error) {
            console.error('Failed to load parameter definitions:', error);
            this.statusManager.updateStatus('❌ Failed to load parameter definitions: ' + error.message, 'Failed to load parameters ❌', 'text-sm status-error');
            throw error;
        }
    }

    async reloadParameterDefinitions() {
        try {
            // Disable the reload button during reload
            this.reloadParamsButton.disabled = true;
            this.reloadParamsButton.innerHTML = '<svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg><span>Reloading...</span>';
            
            this.statusManager.updateStatus('🔄 Reloading parameter definitions...', 'Reloading parameter definitions...', 'text-sm status-pulse');
            
            // Preserve existing parameter values
            const existingValues = {};
            Object.entries(this.parameterInputs).forEach(([paramName, input]) => {
                existingValues[paramName] = input.value;
            });
            
            // Re-fetch the script
            const response = await fetch('generate.py?' + Date.now()); // Cache-busting
            const scriptContent = await response.text();
            
            // Parse new parameter definitions
            const newParameterDefinitions = this.parseParameterDefinitions(scriptContent);
            
            // Update stored data
            this.parameterDefinitions = newParameterDefinitions;
            this.basePythonScript = scriptContent;
            
            // Clear existing inputs
            this.parameterInputs = {};
            
            // Generate new input fields
            this.generateParameterInputs();
            
            // Restore existing values where parameter names match
            Object.entries(existingValues).forEach(([paramName, value]) => {
                if (this.parameterInputs[paramName]) {
                    this.parameterInputs[paramName].value = value;
                }
            });
            
            this.statusManager.updateStatus('✅ Parameters reloaded successfully! 🔄', 'Parameters reloaded successfully! 🔄', 'text-sm status-success');
            
        } catch (error) {
            console.error('Failed to reload parameter definitions:', error);
            this.statusManager.updateStatus('❌ Failed to reload parameter definitions: ' + error.message, 'Failed to reload parameters ❌', 'text-sm status-error');
        } finally {
            // Re-enable the reload button
            this.reloadParamsButton.disabled = false;
            this.reloadParamsButton.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg><span>Reload</span>';
        }
    }

    getParameterValues() {
        const values = {};
        
        Object.entries(this.parameterInputs).forEach(([paramName, input]) => {
            const paramDef = this.parameterDefinitions[paramName];
            
            if (paramDef.type === 'bool') {
                // For boolean parameters, get the checked state
                values[paramName] = input.checked;
            } else if (paramDef.type === 'string' || paramDef.type === 'text') {
                // For string parameters, get the text value
                values[paramName] = input.value || paramDef.default || '';
            } else {
                // For number parameters, parse the value
                const value = parseFloat(input.value);
                const defaultValue = paramDef.default;
                values[paramName] = isNaN(value) ? defaultValue : value;
            }
        });
        
        return values;
    }

    createParameterizedScript(params) {
        let script = this.basePythonScript;
        
        // Auto-generate variable assignments right after PARAMETERS_END
        const endMarker = '# PARAMETERS_END';
        const endMarkerIndex = script.indexOf(endMarker);
        
        if (endMarkerIndex !== -1) {
            // Generate variable assignment lines
            const variableAssignments = '\n\n# Auto-generated parameter variables\n' +
                Object.keys(this.parameterDefinitions)
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
            const paramDef = this.parameterDefinitions[paramName];
            
            // Convert values to appropriate Python format
            let pythonValue;
            if (paramDef.type === 'bool') {
                pythonValue = value ? 'True' : 'False';
            } else if (paramDef.type === 'string' || paramDef.type === 'text') {
                // Escape quotes and wrap string in Python quotes
                const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                pythonValue = `"${escapedValue}"`;
            } else {
                pythonValue = value;
            }
            
            script = script.replace(placeholder, pythonValue);
        });
        
        return script;
    }

    triggerGeneration() {
        // This will be set by the main script
        if (this.onGenerationTrigger) {
            this.onGenerationTrigger();
        }
    }

    setupEventListeners() {
        this.reloadParamsButton.addEventListener('click', () => this.reloadParameterDefinitions());
    }
} 