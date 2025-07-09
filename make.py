try:
    from build123d import *
except Exception:
    print('Build123d not present')

try:
    from cadquery import *
except Exception:
    print('Cadquery not present')

# from make_plus import export_gltf_plus

# import os
import subprocess as sp
from pathlib import Path
from os import name as osname

from enum import Enum
b=Box(1,1,1)
# from teacup import teacup
# t=teacup()
class OS(Enum):
    NT=1
    POSIX=2
    MAC=3
    UNKNOWN=4

if osname == 'nt':
    osname = OS.NT 
elif osname == 'posix':
    osname = OS.POSIX  
else: osname = OS.UNKNOWN

print(f"Detected {osname}")

home = str(Path.home())

def posixRunning():
    try:
        tasklist = sp.check_output(['ps', 'aux', ], encoding='utf-8')
    except Exception:
        print("couldn't obtain tasklist")
        return True
    
    return "/home/will/abcq/0.1.1/ABCQ/build/Desktop-Debug/abcq" in tasklist


def winRunning():
    try:
        tasklist = sp.check_output(['tasklist'], encoding='utf-8')
        return 'abcq.exe' in tasklist
    except Exception:
        return False

def running():
    match osname:
        case OS.NT:
            return winRunning()
        case OS.POSIX:
            return posixRunning()
        case _:
            print("OS NOT SUPPORTED")
            return True

def launch(path, force=False):
    if force or not running():
        match osname:
            case OS.NT:

                try:
                    print(home+"\\ABCQ\\abcq.exe")
                    sp.Popen([home + "\\ABCQ\\abcq.exe", path])
                    return True
                except Exception:
                    print('failed to open')
                    return False
            
            case OS.POSIX:
                
                try:
                    print("/home/will/abcq/0.1.1/ABCQ/build/Desktop-Debug/abcq")
                    sp.Popen(["/home/will/abcq/0.1.1/ABCQ/build/Desktop-Debug/abcq", path])
                    return True
                except Exception:
                    print('failed to open')
                    return False
        
    return False
    
## rgba = lambda h: tuple([int(a[i*2:i*2+2],16)/255.0 for i in range(len(a)//2)])
def hex2rgba(hex):

    r = int(hex[0:2], 16) / 255.0
    g = int(hex[2:4], 16) / 255.0
    b = int(hex[4:6], 16) / 255.0

    a = int(hex[6:8], 16) / 255.0 if len(hex) > 6 else 1.0
    
    return (r, g, b, a)

#export a b123d part
def make(part,
        fn= "abcq",
        ext = "glb",
        unit=None,
        dir= None,
        color=None,
        bin=True,
        ld=0.001,
        ad=0.1,
        start=True,
        force = False,
        plus = False
        ):

    
    if ext[0] != ".":
        ext = "." + ext
    
    if "." in fn:
        ext = ""
    
    if dir is None:
        dir = str(Path.home())

    if dir[-1] != "/" or "\\":
        dir = dir + "/"

    fullpath = dir+fn+ext
    print(fullpath)

    if type(part) == BuildPart:
        part = part.part
    
    if color is not None:
        
        if type(color) == str:
            
            if color[0] in ['#','/']:
                part.color = Color(hex2rgba(color[1:]))
            else:
                part.color = Color(color)

        elif type(color) == Color:
            part.color = color

        else:
            print("wrong color type")

    print(ext[1:])

    match ext[1:]:
        case 'stl':
            print(f"Render: {export_stl(part,fullpath,ld,ad,bin)}")
        case 'brep':
            print(export_brep(part,fullpath))
        # case 'plus':
        #     export_gltf_plus(part,fullpath,binary=bin,linear_deflection=ld,angular_deflection=ad)
        case _:
            export_gltf(
                part,
                fullpath,
                binary=bin,
                linear_deflection=ld,
                angular_deflection=ad
            )
        
    if start or force:
        if launch(fullpath, force=force): print("Opening ABCQ...") 
        else: print('ABCQ Already Running')
        


 
