# PARAMETERS_START
# {
#   "length": {"type": "number", "default": 80.0, "min": 10, "max": 200, "step": 0.1, "label": "Length (mm)", "description": "Length of the box"},
#   "width": {"type": "number", "default": 60.0, "min": 10, "max": 200, "step": 0.1, "label": "Width (mm)", "description": "Width of the box"},
#   "thickness": {"type": "number", "default": 10.0, "min": 1, "max": 50, "step": 0.1, "label": "Thickness (mm)", "description": "Thickness of the box"},
#   "center_hole_dia": {"type": "number", "default": 22.0, "min": 0, "max": 100, "step": 0.1, "label": "Center Hole Diameter (mm)", "description": "Diameter of the center hole"},
#   "tubeSize": {"type": "number", "default": 18.0, "min": 0, "max": 100, "step": 0.1, "label": "Tube Size (mm)", "description": "Diameter of the larger half thickness hole"},
#   "include_tube": {"type": "bool", "default": true, "label": "Include Tube", "description": "Whether to include the tube part in the output"},
#   "model_name": {"type": "string", "default": "Custom Model", "label": "Model Name", "description": "A custom name for your model", "placeholder": "Enter model name..."}
# }
# PARAMETERS_END

# Print the custom model name to demonstrate string parameter support
print(f"🏷️  Generating model: '{model_name}'")
print(f"📏 Dimensions: {length}mm x {width}mm x {thickness}mm")
print(f"🕳️  Center hole diameter: {center_hole_dia}mm")
if include_tube:
    print(f"🔧 Including tube with diameter: {tubeSize}mm")
else:
    print("🚫 Tube excluded from output")

with BuildPart() as boxHole:
    Box(length, width, thickness)
    Cylinder(radius=center_hole_dia / 2, height=thickness, mode=Mode.SUBTRACT)

with BuildPart() as tube:
    Cylinder(radius=tubeSize / 2, height=thickness * 4, rotation=(0, 0, 90))

# Build output list based on parameters
output = []

# Always include the main box
output.append({"name": "boxHole", "part": boxHole.part, "color": "#10b981"})

# Conditionally include the tube based on the toggle
if include_tube:
    output.append({"name": "tube", "part": tube.part, "color": "#4f46e5", "opacity": 0.6})
