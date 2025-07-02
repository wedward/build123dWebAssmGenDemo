length, width, thickness = 80.0, 60.0, 10.0
center_hole_dia = 22.0

with BuildPart() as ex2:
    Box(length, width, thickness)
    Cylinder(radius=center_hole_dia / 2, height=thickness, mode=Mode.SUBTRACT)

export_stl(ex2.part, "output.stl")
with open("output.stl", 'rb') as fh:
    stl = fh.read()
blob = Blob.new([to_js(stl, create_pyproxies=False)])
url = window.URL.createObjectURL(blob)
a = document.createElement("a")
a.href = url
a.download = "output.stl"
a.click()