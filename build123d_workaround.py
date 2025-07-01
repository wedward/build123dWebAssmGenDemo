import micropip
import asyncio
import numpy

async def try_workarounds():
    print("🔧 build123d installation workarounds...")
    print(f"📊 Current numpy version: {numpy.__version__}")
    
    # Workaround 1: Try installing from the custom OCP index directly
    print("🔄 Workaround 1: Using custom OCP.wasm index...")
    try:
        micropip.set_index_urls(["https://yeicor.github.io/OCP.wasm", "https://pypi.org/simple"])
        
        # Try installing OCP first (the underlying CAD kernel)
        print("📦 Installing OCP (Open CASCADE Python)...")
        await micropip.install("OCP")
        print("✅ OCP installed successfully!")
        
        # Then try build123d
        print("📦 Installing build123d...")
        await micropip.install("build123d")
        print("✅ build123d installed successfully with OCP!")
        return True
        
    except Exception as e:
        print(f"❌ Custom index approach failed: {e}")
    
    # Workaround 2: Try a different CAD library that doesn't need numpy 2.0
    print("🔄 Workaround 2: Trying alternative CAD libraries...")
    alternatives = [
        ("cadquery", "CadQuery - popular Python CAD library"),
        ("solidpython", "SolidPython - OpenSCAD for Python"),
        ("py-stl", "STL file manipulation"),
        ("trimesh", "3D mesh processing")
    ]
    
    for lib_name, description in alternatives:
        try:
            print(f"📦 Trying {lib_name} ({description})...")
            await micropip.install(lib_name)
            print(f"✅ {lib_name} installed successfully!")
            
            # Try importing to verify it works
            if lib_name == "cadquery":
                import cadquery as cq
                print("✅ CadQuery imported successfully!")
                print("💡 You can use CadQuery instead of build123d for CAD operations")
            elif lib_name == "trimesh":
                import trimesh
                print("✅ Trimesh imported successfully!")
                print("💡 You can use Trimesh for 3D mesh operations")
            
            return lib_name
        except Exception as e:
            print(f"❌ {lib_name} failed: {e}")
    
    # Workaround 3: Manual geometry creation without CAD libraries
    print("🔄 Workaround 3: Simple geometry without CAD libraries...")
    try:
        print("💡 Creating simple box geometry with basic Python...")
        
        # Create a simple box representation
        def create_simple_box(length, width, height):
            # Simple box vertices (8 corners)
            vertices = [
                [0, 0, 0], [length, 0, 0], [length, width, 0], [0, width, 0],  # bottom
                [0, 0, height], [length, 0, height], [length, width, height], [0, width, height]  # top
            ]
            
            # Box faces (6 faces, each with 4 vertices)
            faces = [
                [0, 1, 2, 3],  # bottom
                [4, 5, 6, 7],  # top
                [0, 1, 5, 4],  # front
                [2, 3, 7, 6],  # back
                [0, 3, 7, 4],  # left
                [1, 2, 6, 5]   # right
            ]
            
            return {"vertices": vertices, "faces": faces}
        
        box = create_simple_box(80, 60, 10)
        print(f"✅ Simple box created with {len(box['vertices'])} vertices and {len(box['faces'])} faces")
        print("💡 You can create basic geometry without CAD libraries")
        return "simple_geometry"
        
    except Exception as e:
        print(f"❌ Even simple geometry failed: {e}")
    
    return False

# Run the workarounds
result = asyncio.get_event_loop().run_until_complete(try_workarounds())

if result:
    if result == "simple_geometry":
        print("🎯 Simple geometry approach works!")
        print("💡 Consider using basic Python for geometry or try the numpy fix script")
    elif isinstance(result, str):
        print(f"🎯 Alternative library {result} works!")
        print("💡 You can use this instead of build123d")
    else:
        print("🎯 build123d installation successful!")
else:
    print("😞 All workarounds failed")
    print("💡 The numpy version conflict is preventing CAD library installation") 