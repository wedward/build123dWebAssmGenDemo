# PARAMETERS_START
# {
#   "length": {"type": "number", "default": 80.0, "min": 10, "max": 200, "step": 0.1, "label": "Length (mm)", "description": "Length of the box"},
#   "width": {"type": "number", "default": 60.0, "min": 10, "max": 200, "step": 0.1, "label": "Width (mm)", "description": "Width of the box"},
#   "thickness": {"type": "number", "default": 10.0, "min": 1, "max": 50, "step": 0.1, "label": "Thickness (mm)", "description": "Thickness of the box"},
#   "center_hole_dia": {"type": "number", "default": 22.0, "min": 0, "max": 100, "step": 0.1, "label": "Center Hole Diameter (mm)", "description": "Diameter of the center hole"},
#   "otherhole": {"type": "number", "default": 40.0, "min": 0, "max": 100, "step": 0.1, "label": "Larger half thickness hole", "description": "Diameter of the larger half thickness hole"}
# }
# PARAMETERS_END

with BuildPart() as ex2:
    Box(length, width, thickness)
    Cylinder(radius=center_hole_dia / 2, height=thickness, mode=Mode.SUBTRACT)
    Cylinder(radius=otherhole / 2, height=thickness / 2, mode=Mode.SUBTRACT)

export_stl(ex2.part, "output.stl")
with open("output.stl", 'rb') as fh:
    stl = fh.read()

# Store STL data for 3D viewer
window.stlData = to_js(stl, create_pyproxies=False)
print("STL data ready for 3D viewer")