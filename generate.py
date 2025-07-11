_custom_data=None ###DO NOT MODIFY

## IMPORT LOCAL DEPENDS
try:
    import js
    WEBPY = True
except ImportError:
    WEBPY = False

if not WEBPY:
    from build123d import *
    from utils import *

c=    """Part Object: Cylinder

    Create a cylinder(s) and combine with part.

    Args:
        radius (float): cylinder size
        height (float): cylinder size
        arc_size (float, optional): angular size of cone. Defaults to 360.
        rotation (RotationLike, optional): angles to rotate about axes. Defaults to (0, 0, 0).
        align (Align | tuple[Align, Align, Align] | None, optional): align min, center,
            or max of object. Defaults to (Align.CENTER, Align.CENTER, Align.CENTER).
        mode (Mode, optional): combine mode. Defaults to Mode.ADD.
    """

# DEFINE PARAMETERS
lbltxt = 'box || cone || cylinder || sphere || torus || wedge '
incl = P('include_companion', 'bool', False)
index = {
    'box': [
            P('shape', 'str', 'box', prev='box', label=lbltxt),
            P('length', 'num', 80.0),
            P('width',  'num', 60.0),
            P('height', 'num', 10.0),
            P('rotation', 'str', '( 0 , 0 , 0 )'),
            P('align', 'str', "( Align.CENTER , Align.CENTER , Align.CENTER )"),
            P('mode', 'str', 'Mode.ADD'),
            incl,
    ],

    'cone': [
            P('shape', 'str', 'cone', prev='cone', label=lbltxt),
            P('bottom_radius', 'num',25.0),
            P('top_radius', 'num', 0),
            P('height', 'num', 100.0),
            P('arc_size', 'num', 360.0),
            P('rotation', 'str', '( 0 , 0 , 0 )'),
            P('align', 'str', "( Align.CENTER , Align.CENTER , Align.CENTER )"),
            P('mode', 'str', 'Mode.ADD'),
            incl,
    ],

    'cylinder': [
            P('shape', 'str', 'cylinder', prev='cylinder', label=lbltxt),
            P('radius', 'num',25.0),
            P('height', 'num', 100.0),
            P('arc_size', 'num', 360.0),
            P('rotation', 'str', '( 0 , 0 , 0 )'),
            P('align', 'str', "( Align.CENTER , Align.CENTER , Align.CENTER )"),
            P('mode', 'str', 'Mode.ADD'),
            incl,
    ],

    'sphere': [
            P('shape', 'str', 'sphere', prev='sphere', label=lbltxt),
            P('radius', 'num',25.0),
            P('arc_size1', 'num', -90.0),
            P('arc_size2', 'num', 90.0),
            P('arc_size3', 'num', 360.0),
            P('rotation', 'str', '( 0 , 0 , 0 )'),
            P('align', 'str', "( Align.CENTER , Align.CENTER , Align.CENTER )"),
            P('mode', 'str', 'Mode.ADD'),
            incl,
    ],

    'torus': [
            P('shape', 'str', 'torus', prev='torus', label=lbltxt),
            P('major_radius', 'num', 25.0),
            P('minor_radius', 'num', 10.0),
            P('major_arc_size', 'num', 0),
            P('minor_arc_size', 'num', 360),
            # P('rotation', 'str', '( 0 , 0 , 0 )'),
            P('align', 'str', "( Align.CENTER , Align.CENTER , Align.CENTER )"),
            P('mode', 'str', 'Mode.ADD'),
            incl,
    ],

    'wedge': [
            P('shape', 'str', 'wedge', prev='wedge', label=lbltxt),
            P('xsize', 'num', 60.0),
            P('ysize', 'num', 60.0),
            P('zsize', 'num', 45.0),
            P('xmin', 'num', 40.0),
            P('zmin', 'num', 30.0),
            P('xmax', 'num', 60.0),
            P('zmax', 'num', 60.0),
            P('rotation', 'str', '( 0 , 0 , 0 )'),
            P('align', 'str', "( Align.CENTER , Align.CENTER , Align.CENTER )"),
            P('mode', 'str', 'Mode.ADD'),
            incl,
    ],
   
    }



        


# LOAD JSON 
if _custom_data:
    p = loadParam(_custom_data)

    # REBUILD PARAMS
    if p.shape.value != p.shape.prev:
        new = p.shape.value 
        del(p)  
        p = ParameterGroup(index[new])

# INITIAL BUILD
else:
    p = ParameterGroup (index['wedge'])

# EXPORT PARAMETERS TO VIEWER
if WEBPY:
    window.jsonData = p.dumps() # type: ignore
else:
    pass# print(p.dumps())

# #BUILD MODEL
with BuildPart() as box:
    if p.include_companion.value == True: 
        Box(50,50,50)

    match p.shape.value:
        case 'box':    
            Box(length = p.length.value,
            width = p.width.value, 
            height = p.height.value,
            rotation= eval(p.rotation.value),
            align = eval(p.align.value),
            mode = eval(p.mode.value)
            )

        case 'cone':
            Cone(p.bottom_radius.value, p.top_radius.value, p.height.value,p.arc_size.value, eval(p.rotation.value), eval(p.align.value), eval(p.mode.value)       )
        

        case 'cylinder':
            Cylinder(p.radius.value,  p.height.value,p.arc_size.value, eval(p.rotation.value), eval(p.align.value), eval(p.mode.value)       )
        
        case 'sphere':
            Sphere(p.radius.value,  p.arc_size1.value,  p.arc_size2.value,  p.arc_size3.value, eval(p.rotation.value), eval(p.align.value), eval(p.mode.value)       )
        
        case 'torus':
            ## can't rotate by float???
            Torus(p.major_radius.value,p.minor_radius.value, p.major_arc_size.value, p.minor_arc_size.value, align=eval(p.align.value), mode=eval(p.mode.value))
        
        case 'wedge':
            Wedge(p.xsize.value, p.ysize.value, p.zsize.value, p.xmin.value, p.zmin.value, p.xmax.value, p.zmax.value, align=eval(p.align.value), mode=eval(p.mode.value))
        
        
        case _: pass



## OUTPUT SHAPE TO VIEWER
output = []
output.append({"name": "box", "part": box.part.rotate(Axis.X, -90), "color": "#10b981", "opacity": 0.75})


