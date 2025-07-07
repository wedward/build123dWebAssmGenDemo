Some thoughts on parameters:

When we talk about parameters we are talking about 3 distinct things:
Models, Views, and Delegates

Delegates: each individual Parameter (height = 2, text = "wedward")
Model: the list of all Parameters. (i.e. the json passed between script and viewer)
View: the widget for displaying/editing a Parameter (a slider or text box)

To keep these straight I will try to use Parameter, ParameterList, and ParameterWidget.

CURRENT GOALS

As a model designer:

No red squigglies! I have 1st class support for auto complete, LSPs etc. This means everything that is called in a script should be imported into the script -- a script shouldn't assume that it will be called in an evironment where show_object() is available. 

My model scripts are portable. I can write my code in VScode + ocp_viewer and it will run just fine everywhere else.

Easy definition and maintenance. If I decide to change or remove a parameter, it should be simple to update the ParameterList. Parameter definitions can be localized to a single area in the code.

I don't have to worry about how the Viewer will display my parameters, but I can be specific if needed -- use slider w/ min, max, step

Once defined, I should be able to use Parameters in my build script without a lot of boiler plate. They should look and act like a simple variable. -- p.h = 2, p.w = p.h * 2, p.txt = "wedward"

If I want to, I can handle how the model is rebuilt when a parameter is changed -- use cached objects, apply a random noise function... 

I can set rules for when parameters are visible/enabled in the viewer. -- Only show the "split" ParameterWidget if "width" >  100.


As a model viewer:

Your code is a black box to me. I receive an object to display (stl, gltf, ocp_tessellate) and a ParameterList.

I shouldn't be expected to touch your code. No finding/replacing or inserting. All comms between model code and viewer occur thru the ParameterList

From the ParameterList, I will build all my ParameterWidgets.

I can send a new ParameterList to your code and expect to receive a new ViewObject.

I know the default way to display a Parameter type -- a "num" is a label, a text input, and a reset to default button 

I accept a limited number of ways to modify a ParameterWidget ( a "num" can have a slider )

I can display the script's number units (mm) in the user's preferred format (in).
(deg) (rad)
(euler) (quat)

I respect rules such as: radius.enabled = False if square else radius.enabled = True




Other Considerations:
Applying parameters to Objects: Solids, Faces, Vertices
What if I want to display two+ objects in a viewer.








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
