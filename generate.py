_custom_data=None ###DO NOT MODIFY

#PARAMETERS
l = P('length', 'num', 80.0)
w =  P('width',  'num', 60.0)
t = P('thickness', 'num', 10.0)
dia = P('center_hole_dia', 'num', 22.0)
tube = P('tubeSize', 'num', 18.0)
include = P('include_tube', 'bool', True)
name = P('model_name','string', 'Custom Model', placeholder='ENTER MODEL NAME')

if _custom_data:
    p = loadParam(_custom_data)
else:
    p = ParameterGroup ([l, w, t, dia, tube, include, name])

window.jsonData = p.dumps()

##BUILD
with BuildPart() as boxHole:
    Box(p.length, p.width, p.thickness)
    Cylinder(radius=p.center_hole_dia / 2, height=p.thickness, mode=Mode.SUBTRACT)

with BuildPart() as tube:
    Cylinder(radius=p.tubeSize / 2, height=p.thickness * 4, rotation=(0, 0, 90))

##OUTPUT
output = []

output.append({"name": "boxHole", "part": boxHole.part, "color": "#10b981"})

if p.include_tube:
    output.append({"name": "tube", "part": tube.part, "color": "#4f46e5", "opacity": 0.6})
    


