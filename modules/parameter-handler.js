export class ParameterHandler {
    constructor(statusManager) {
        this.statusManager = statusManager;
        this.parameterDefinitions = {};
        this.parameterInputs = {};
        this.basePythonScript = '';
        this.reloadParamsButton = document.getElementById('reload-params');
        
        this.setupEventListeners();
    }

    parseParameterDefinitions() {
    
        if ('jsonData' in window){
            console.log(window.jsonData)
            try { return JSON.parse(window.jsonData) }
            catch (error) {
                throw new Error('Invalid parameter definition JSON: ' + error.message);
            }
        }
        else {
            console.log('INITIAL RUN -- USING PARAMETER DEFAULTS')
        }
    }

    generateParameterInputs() {
        // Find the container for dynamic parameter inputs
        const parameterContainer = document.querySelector('.space-y-3');
        
        // Clear existing content (loading message)
        parameterContainer.innerHTML = '';
        
        // Generate new inputs based on parameter definitions

        // console.log('>>>>>>>>>>>>>>>>>>>>>')
        // console.log(this.parameterDefinitions.children)


        this.parameterDefinitions.children.forEach((param, index) => {
            console.log(param)
            const inputContainer = document.createElement('div');
            inputContainer.className = 'parameter-group';
            
            const label = this.createLabel(param);
            let inputElement;
            
            if (param.type === 'bool') {
                inputElement = this.createBooleanInput(param, label, inputContainer);
                inputElement.addEventListener('change', () => {
                    this.parameterDefinitions.children[index].value = inputElement.checked
                    console.log( 'input det: ' + 'bool' )
                });

                
                
            }            
            else if (param.type === 'num') {
                inputElement = this.createNumberInput(param, label, inputContainer);
                inputContainer.oninput = () => {
                    this.parameterDefinitions.children[index].value = parseFloat(inputElement.value)
                    console.log('input det: num')
                }
            } 
            else  {
                inputElement = this.createStringInput(param, label, inputContainer);
                // inputContainer.oninput = () => {
                //     this.parameterDefinitions.children[index].value = inputElement.value
                //     console.log('input det: string' + inputElement.vale) 
                // }

                inputElement.addEventListener('input', () => {
                    this.parameterDefinitions.children[index].value = inputElement.value;
                    console.log('input det: string' + inputElement.value) 
                });
            } 

            
            parameterContainer.appendChild(inputContainer);
            this.parameterInputs[param.name] = inputElement;
        });
    }

    // Helper method to create consistent labels
    createLabel(param) {
        const label = document.createElement('label');
        label.htmlFor = `param-${param.name}`;
        label.className = 'block text-xs font-medium text-white/90 mb-1';
        label.textContent = param.label ? param.label : param.name;
        return label;
    }

    // Helper method to set up common input properties
    setupCommonInputProperties(input, param) {
        input.id = `param-${param.name}`;
        input.name = param.name;
        
        if (param.description) {
            input.title = param.description;
        }
        
        // Add Enter key handling
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.triggerGeneration();
            }
        });
    }

    // Helper method to apply validation styling
    applyValidationStyling(input, isValid) {
        if (isValid) {
            input.classList.remove('border-red-300', 'ring-red-200');
            input.classList.add('border-white/30');
        } else {
            input.classList.add('border-red-300', 'ring-red-200');
            input.classList.remove('border-white/30');
        }
    }

    // Helper method to get standard input classes
    getStandardInputClasses() {
        return 'w-full px-3 py-2 bg-white/5 border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 hover:border-white/40';
    }

    createBooleanInput(param, label, container) {
        // Create toggle switch for boolean parameters
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'flex items-center space-x-3';
        
        const toggle = document.createElement('div');
        toggle.className = 'relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out cursor-pointer bg-white/20 hover:bg-white/30';
        toggle.id = `param-${param.name}`;
        
        const toggleSwitch = document.createElement('div');
        toggleSwitch.className = 'inline-block w-4 h-4 transform bg-white rounded-full transition duration-200 ease-in-out translate-x-1';
        
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'checkbox';
        hiddenInput.checked = param.value;
        hiddenInput.className = 'hidden';
        hiddenInput.name = param.name;
        
        if (param.description) {
            toggle.title = param.description;
        }
        
        // Update toggle appearance based on state
        const updateToggleState = () => {
            const isChecked = hiddenInput.checked;
            toggle.classList.toggle('bg-blue-600', isChecked);
            toggle.classList.toggle('bg-white/20', !isChecked);
            toggleSwitch.classList.toggle('translate-x-6', isChecked);
            toggleSwitch.classList.toggle('translate-x-1', !isChecked);
        };
        
        // Initialize toggle state
        updateToggleState();
        
        // Toggle click handler
        const toggleHandler = () => {
            hiddenInput.checked = !hiddenInput.checked;
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            updateToggleState();
        };
        
        toggle.addEventListener('click', toggleHandler);
        
        // Enter key handling for toggle
        toggle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleHandler();
                if (event.key === 'Enter') {
                    this.triggerGeneration();
                }
            }
        });
        
        // Set accessibility attributes
        toggle.setAttribute('tabindex', '0');
        toggle.setAttribute('role', 'switch');
        toggle.setAttribute('aria-checked', hiddenInput.checked);
        
        toggle.appendChild(toggleSwitch);
        toggleContainer.appendChild(toggle);
        
        const toggleLabel = document.createElement('span');
        toggleLabel.className = 'text-xs text-white/70';
        toggleLabel.textContent = hiddenInput.checked ? 'On' : 'Off';
        toggleContainer.appendChild(toggleLabel);
        
        // Update label text when toggle changes
        const updateToggleLabel = () => {
            setTimeout(() => {
                toggleLabel.textContent = hiddenInput.checked ? 'On' : 'Off';
                toggle.setAttribute('aria-checked', hiddenInput.checked);
            }, 0);
        };
        
        toggle.addEventListener('click', updateToggleLabel);
        
        container.appendChild(label);
        container.appendChild(toggleContainer);
        
        return hiddenInput;
    }

    createStringInput(param, label, container) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = param.value || '';
        input.placeholder = param.placeholder || '';
        input.className = this.getStandardInputClasses();
        
        this.setupCommonInputProperties(input, param);
        
        container.appendChild(label);
        container.appendChild(input);
        
        return input;
    }

    createNumberInput(param, label, container) {
        const input = document.createElement('input');
        input.type = param.type;
        input.value = param.value;
        input.min = param.min ? param.min : param.value/5;
        input.max = param.max ? param.max : param.value*5;
        input.step = param.step ? param.step : 1;
        input.className = this.getStandardInputClasses();
        
        this.setupCommonInputProperties(input, param);
        
        // Add number-specific validation
        input.addEventListener('input', (event) => {
            const value = parseFloat(event.target.value);
            const isValid = !isNaN(value) && value >= param.min && value <= param.max;
            this.applyValidationStyling(event.target, isValid);
        });
        
        container.appendChild(label);
        container.appendChild(input);
        
        return input;
    }

    async loadBasePythonScript() {
        try {
            const response = await fetch('generate.py');
            this.basePythonScript = await response.text();
            
            // // Parse parameter definitions from the script (if not already done)
            // if (Object.keys(this.parameterDefinitions).length === 0) {
            //     this.parameterDefinitions = this.parseParameterDefinitions(this.basePythonScript);
            // }
            
            // // Generate dynamic input fields (if not already done)
            // if (Object.keys(this.parameterInputs).length === 0) {
            //     this.generateParameterInputs();
            // }
            
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
            this.parameterDefinitions = this.parseParameterDefinitions();
            
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
            this.setReloadButtonState(true);
            this.statusManager.updateStatus('🔄 Reloading parameter definitions...', 'Reloading parameter definitions...', 'text-sm status-pulse');
            
            // Preserve existing parameter values
            // const existingValues = this.preserveExistingValues();
            
            // Re-fetch and parse script
            // await this.refetchAndParseScript();
            
            // Regenerate inputs and restore values
            // this.regenerateInputsAndRestoreValues(existingValues);

            // Parse parameter definitions from the script
            this.parameterDefinitions = this.parseParameterDefinitions();
            
            // Generate dynamic input fields immediately
            this.generateParameterInputs();
            
            this.statusManager.updateStatus('✅ Parameters reloaded successfully! 🔄', 'Parameters reloaded successfully! 🔄', 'text-sm status-success');
            
        } catch (error) {
            console.error('Failed to reload parameter definitions:', error);
            this.statusManager.updateStatus('❌ Failed to reload parameter definitions: ' + error.message, 'Failed to reload parameters ❌', 'text-sm status-error');
        } finally {
            this.setReloadButtonState(false);
        }
    }

    // Helper method to manage reload button state
    setReloadButtonState(isLoading) {
        this.reloadParamsButton.disabled = isLoading;
        this.reloadParamsButton.innerHTML = isLoading 
            ? '<svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg><span>Reloading...</span>'
            : '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg><span>Reload</span>';
    }

    // // Helper method to preserve existing parameter values
    // preserveExistingValues() {
    //     const existingValues = {};
    //     Object.entries(this.parameterInputs).forEach(([paramName, input]) => {
    //         existingValues[paramName] = input.value;
    //     });
    //     return existingValues;
    // }

    // Helper method to refetch and parse script
    async refetchAndParseScript() {
        const response = await fetch('generate.py?' + Date.now()); // Cache-busting
        const scriptContent = await response.text();
        
        // Parse new parameter definitions
        this.parameterDefinitions = this.parseParameterDefinitions(scriptContent);
        this.basePythonScript = scriptContent;
    }

    // // Helper method to regenerate inputs and restore values
    // regenerateInputsAndRestoreValues(existingValues) {
    //     // Clear existing inputs
    //     this.parameterInputs = {};
        
    //     // Generate new input fields
    //     this.generateParameterInputs();
        
    //     // Restore existing values where parameter names match
    //     Object.entries(existingValues).forEach(([paramName, value]) => {
    //         if (this.parameterInputs[paramName]) {
    //             this.parameterInputs[paramName].value = value;
    //         }
    //     });
    // }

    // Helper method to extract parameter value based on type
    // extractParameterValue(param, input,) {
    //     if (param.type === 'bool') {
    //         return input.checked;
    //     } else if (param.type === 'string' || param.type === 'text') {
    //         return input.value || param.default || '';
    //     } else {
    //         const value = parseFloat(input.value);
    //         return isNaN(value) ? paramDef.default : value;
    //     }
    // }

    getParameterValues() {
        const values = {};
        
        Object.entries(this.parameterInputs).forEach((param) => {
            values[param.name] = param.value
        });
        
        return values;
    }

    // Helper method to convert parameter values to Python format
    // convertToPythonValue(value, paramDef) {
    //     if (paramDef.type === 'bool') {
    //         return value ? 'True' : 'False';
    //     } else if (paramDef.type === 'string' || paramDef.type === 'text') {
    //         const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    //         return `"${escapedValue}"`;
    //     } else {
    //         return value;
    //     }
    // }

    createParameterizedScript() {
        let script = this.basePythonScript;


        // no parameters have been initialized, so we return the python script who will always generate the init params.
        if (window.jsonData==null){
            return script
        }

        const endMarker = '###DO NOT MODIFY';
        const endMarkerIndex = script.indexOf(endMarker);

        const jsonStr = JSON.stringify(this.parameterDefinitions, null, 2);
        
        if (endMarkerIndex !== -1) {
        
        script = `_custom_data='''${jsonStr}'''` +
                script.substring(endMarkerIndex);
        }
        
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