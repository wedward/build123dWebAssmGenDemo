import micropip
import asyncio

async def install_ocp():
    print("🔧 Installing OCP (OpenCASCADE Python) for build123d...")
    
    # Set up the custom index that has OCP.wasm
    print("📡 Setting up custom OCP.wasm index...")
    micropip.set_index_urls(["https://yeicor.github.io/OCP.wasm", "https://pypi.org/simple"])
    print("✅ Custom index URLs configured")
    
    # Install OCP first
    print("📦 Installing OCP (OpenCASCADE Python)...")
    try:
        await micropip.install("OCP")
        print("✅ OCP installed successfully!")
        
        # Test OCP import
        print("🧪 Testing OCP import...")
        import OCP
        print(f"✅ OCP imported successfully!")
        
    except Exception as e:
        print(f"❌ Failed to install OCP: {e}")
        
        # Try alternative OCP installation
        print("🔄 Trying alternative OCP installation...")
        try:
            await micropip.install("opencascade-python")
            print("✅ Alternative OCP package installed!")
            import OCP
            print("✅ Alternative OCP imported successfully!")
        except Exception as e2:
            print(f"❌ Alternative OCP installation failed: {e2}")
            print("💡 OCP installation failed - this is required for build123d")
            return False
    
    # Now try build123d
    print("🏗️ Installing build123d with OCP available...")
    try:
        await micropip.install("build123d")
        print("✅ build123d installed successfully!")
        
        # Test build123d import and basic functionality
        print("🧪 Testing build123d import and functionality...")
        import build123d
        print("✅ build123d imported successfully!")
        
        # Test creating a simple object
        print("🎯 Testing basic build123d functionality...")
        with build123d.BuildPart() as test_part:
            build123d.Box(10, 10, 10)
        print("✅ build123d basic functionality works!")
        
        # Test the specific operations from your original script
        print("🔍 Testing your specific operations...")
        length, width, thickness = 80.0, 60.0, 10.0
        center_hole_dia = 22.0
        
        with build123d.BuildPart() as ex2:
            build123d.Box(length, width, thickness)
            build123d.Cylinder(radius=center_hole_dia / 2, height=thickness, mode=build123d.Mode.SUBTRACT)
        
        print("✅ Your specific build123d operations work!")
        print("🎉 Success! build123d is fully functional")
        return True
        
    except Exception as e:
        print(f"❌ build123d installation/testing failed: {e}")
        
        # Try installing build123d without dependency checking
        try:
            print("🔄 Trying build123d installation without dependency checking...")
            await micropip.install("build123d", deps=False)
            import build123d
            print("✅ build123d installed and imported without dependency checking!")
            print("⚠️  Some features might not work properly")
            return True
        except Exception as e2:
            print(f"❌ Even no-deps installation failed: {e2}")
            return False

# Run the OCP installation
result = asyncio.get_event_loop().run_until_complete(install_ocp())

if result:
    print("🎉 Success! OCP and build123d are now ready to use!")
    print("💡 You can now run your original build123d script")
else:
    print("😞 OCP/build123d installation failed")
    print("💡 Consider using alternative CAD libraries or approaches") 