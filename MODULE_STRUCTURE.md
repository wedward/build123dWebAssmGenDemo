# WebAssmPy Module Structure

This document describes the refactored modular structure of the WebAssmPy application.

## Overview

The original `script.js` file (1232 lines) has been split into logical modules for better maintainability and code organization.

## Module Architecture

### Core Modules

#### 1. `modules/three-viewer.js` - ThreeViewer Class
- **Purpose**: Handles all 3D visualization and rendering
- **Key Features**:
  - Three.js scene initialization
  - STL model loading and display
  - Camera controls and lighting
  - Multi-part model support with colors and transparency
  - Responsive viewport handling

#### 2. `modules/console-manager.js` - ConsoleManager Class
- **Purpose**: Manages console output and user interface
- **Key Features**:
  - Dual console tabs (JavaScript/Python)
  - Console resizing functionality
  - Message logging and scrolling
  - Console visibility toggle

#### 3. `modules/python-runtime.js` - PythonRuntime Class
- **Purpose**: Handles Pyodide initialization and Python code execution
- **Key Features**:
  - Pyodide environment setup
  - Python package installation
  - Code execution with output capture
  - Error handling and status reporting

#### 4. `modules/parameter-handler.js` - ParameterHandler Class
- **Purpose**: Manages parameter parsing and UI generation
- **Key Features**:
  - Dynamic parameter definition parsing from Python scripts
  - UI input generation (boolean toggles, text inputs, number inputs)
  - Parameter validation and value extraction
  - Script templating and parameterization

#### 5. `modules/status-manager.js` - StatusManager Class
- **Purpose**: Coordinates status updates across the application
- **Key Features**:
  - Unified status messaging
  - Console and status bar synchronization

#### 6. `modules/file-downloads.js` - FileDownloads Class
- **Purpose**: Handles file download functionality
- **Key Features**:
  - STL, STEP, and BREP file downloads
  - Multi-part file handling
  - Filename generation with parameters and timestamps

#### 7. `modules/ui-controls.js` - UIControls Class
- **Purpose**: Manages UI interactions and mobile responsiveness
- **Key Features**:
  - Mobile sidebar toggle
  - Responsive layout handling
  - Touch and mouse event management

### Main Application

#### `script-refactored.js` - WebAssmPyApp Class
- **Purpose**: Main application orchestrator
- **Key Features**:
  - Module initialization and dependency management
  - Application lifecycle management
  - Event coordination between modules
  - Error handling and recovery

## Dependencies

The modules have the following dependency relationships:

```
WebAssmPyApp
├── ConsoleManager (independent)
├── StatusManager (depends on ConsoleManager)
├── PythonRuntime (depends on StatusManager)
├── ParameterHandler (depends on StatusManager)
├── FileDownloads (depends on ParameterHandler)
├── UIControls (independent)
└── ThreeViewer (independent)
```

## Benefits of the Modular Structure

1. **Maintainability**: Each module has a single responsibility
2. **Testability**: Modules can be tested independently
3. **Reusability**: Modules can be reused in other projects
4. **Readability**: Code is organized by functionality
5. **Scalability**: New features can be added as new modules

## Usage

To use the refactored version, update your HTML to import the new script:

```html
<!-- Replace the old script.js with -->
<script type="module" src="script-refactored.js"></script>
```

The refactored version maintains full backward compatibility with the original functionality while providing a much cleaner and more maintainable code structure. 