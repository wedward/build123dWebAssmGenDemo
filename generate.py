# PARAMETERS_START
# {
#   "length": {"type": "number", "default": 80.0, "min": 10, "max": 200, "step": 0.1, "label": "Length (mm)", "description": "Length of the box"},
#   "width": {"type": "number", "default": 60.0, "min": 10, "max": 200, "step": 0.1, "label": "Width (mm)", "description": "Width of the box"},
#   "thickness": {"type": "number", "default": 10.0, "min": 1, "max": 50, "step": 0.1, "label": "Thickness (mm)", "description": "Thickness of the box"},
#   "center_hole_dia": {"type": "number", "default": 22.0, "min": 0, "max": 100, "step": 0.1, "label": "Center Hole Diameter (mm)", "description": "Diameter of the center hole"},
#   "tubeSize": {"type": "number", "default": 18.0, "min": 0, "max": 100, "step": 0.1, "label": "Tube Size (mm)", "description": "Diameter of the larger half thickness hole"}
# }
# PARAMETERS_END

with BuildPart() as boxHole:
    Box(length, width, thickness)
    Cylinder(radius=center_hole_dia / 2, height=thickness, mode=Mode.SUBTRACT)

with BuildPart() as tube:
    Cylinder(radius=tubeSize / 2, height=thickness * 4, rotation=(0, 0, 90))

output = [
    {"name": "tube", "part": tube.part, "color": "#4f46e5", "opacity": 0.6},
    {"name": "boxHole", "part": boxHole.part, "color": "#10b981"}
]
