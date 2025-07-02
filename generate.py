# Parameters will be injected here
length = {{LENGTH}}
width = {{WIDTH}}
thickness = {{THICKNESS}}
center_hole_dia = {{CENTER_HOLE_DIA}}

with BuildPart() as ex2:
    Box(length, width, thickness)
    Cylinder(radius=center_hole_dia / 2, height=thickness, mode=Mode.SUBTRACT)

export_stl(ex2.part, "output.stl")
with open("output.stl", 'rb') as fh:
    stl = fh.read()

# Store STL data for 3D viewer
window.stlData = to_js(stl, create_pyproxies=False)
print("STL data ready for 3D viewer")