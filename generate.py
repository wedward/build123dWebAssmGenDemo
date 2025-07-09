_custom_data=None ###DO NOT MODIFY

try:
    import js
    WEBPY = True
except ImportError:
    WEBPY = False

if not WEBPY:
    from build123d import *
    from utils import P, ParameterGroup, loadParam

#PARAMETERS
l = P('length', 'num', 80.0)
w =  P('width',  'num', 60.0)
h = P('height', 'num', 10.0)
include_companion = P('include_companion', 'bool', False)
rot = P('rotation', 'str', '( 0 , 0 , 0 )')
ali = P('align', 'str', "( Align.CENTER , Align.CENTER , Align.CENTER )")
mode = P('mode', 'str', 'Mode.ADD')

if _custom_data:
    p = loadParam(_custom_data)
else:
    p = ParameterGroup ([l, w, h, rot, include_companion, ali, mode])

if WEBPY:
    window.jsonData = p.dumps()
else:
    pass# print(p.dumps())

##BUILD
with BuildPart() as box:
    if p.include_companion: 
        Box(50,50,50)
    Box(length = p.length,
        width = p.width, 
        height = p.height,
        rotation= eval(p.rotation.value),
        align = eval(p.align.value),
        mode = eval(p.mode.value)
        )

##OUTPUT
output = []
output.append({"name": "box", "part": box.part, "color": "#10b981" "opacity": 0.75})


