# 3D Model Generator

A web-based 3D model generator that creates parametric models using Python and WebAssembly. Generate STL files and view them in your browser!

## Features

- **Parametric 3D modeling** - Adjust dimensions with simple input fields
- **Real-time 3D preview** - See your model instantly in the browser
- **Multi-format export** - Download your models as STL, STEP, or BREP files
- **Browser-based** - No software installation required

## Requirements

- Python 3.13.5 (or compatible version)
- Modern web browser

## Getting Started

1. **Run the server:**
   ```bash
   python server.py
   ```

2. **Open your browser** and go to the URL shown in the terminal (typically `http://localhost:8000`)

3. **Adjust parameters** in the input fields (length, width, thickness, hole diameter)

4. **Click "Generate Model"** to create and view your 3D model

5. **Download files** in your preferred format (STL, STEP, or BREP) when ready

## What it does

Creates a parametric box with a center hole using the build123d CAD library. Perfect for learning 3D modeling concepts or generating simple mechanical parts.

---

Built with Python 3.13.5, Pyodide, Three.js, and build123d. 