import micropip
import asyncio

async def test_alternatives():
    print("🔄 Alternative build123d installation approach...")

    # Method 1: Try installing dependencies first
    print("📦 Method 1: Installing dependencies separately...")
    try:
        # Install core dependencies that should be available
        await micropip.install(["numpy", "scipy"])
        print("✅ Core dependencies installed")
        
        # Try installing build123d from PyPI
        await micropip.install("build123d")
        print("✅ build123d installed from PyPI!")
        
    except Exception as e:
        print(f"❌ Method 1 failed: {e}")
        
        # Method 2: Try with different index configuration  
        print("📦 Method 2: Trying different index configuration...")
        try:
            # Reset to default PyPI and try again
            micropip.set_index_urls(["https://pypi.org/simple"])
            
            # Try installing a lighter CAD library instead
            await micropip.install("cadquery")  # Alternative CAD library
            print("✅ Alternative: cadquery installed!")
            
        except Exception as e2:
            print(f"❌ Method 2 also failed: {e2}")
            
            print("💡 Suggestions:")
            print("1. Check if build123d has official Pyodide packages")
            print("2. Try using a different 3D/CAD library that's Pyodide-compatible")
            print("3. Contact build123d maintainers for Pyodide installation help")
            
    # Method 3: Manual verification of what's available
    print("🔍 Method 3: Checking what CAD-related packages are available...")
    try:
        # Try some alternatives that might work
        alternatives = ["cadquery", "FreeCAD", "opencascade", "pythonocc"]
        
        for alt in alternatives:
            try:
                await micropip.install(alt)
                print(f"✅ Alternative found: {alt} installed successfully!")
                break
            except:
                print(f"❌ {alt} not available")
                
    except Exception as e:
        print(f"❌ Error checking alternatives: {e}")

    print("🔍 Investigation complete!")

# Run the alternative tests
asyncio.get_event_loop().run_until_complete(test_alternatives()) 