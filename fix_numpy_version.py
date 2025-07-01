import micropip
import asyncio
import numpy

async def fix_numpy_issue():
    print("🔍 Numpy version conflict diagnosis and fix...")
    
    # Check current numpy version
    print(f"📊 Current numpy version: {numpy.__version__}")
    
    # Check what build123d actually requires
    print("🔧 Attempting to upgrade numpy to meet build123d requirements...")
    
    try:
        # Try to upgrade numpy first
        print("📦 Upgrading numpy to latest version...")
        await micropip.install("numpy", deps=False)  # Force upgrade without checking deps
        
        # Re-import to get new version
        import importlib
        importlib.reload(numpy)
        print(f"✅ Numpy upgraded to: {numpy.__version__}")
        
    except Exception as e:
        print(f"❌ Failed to upgrade numpy: {e}")
        
        # Alternative: try installing specific numpy version
        try:
            print("🔄 Trying to install specific numpy version 2.0...")
            await micropip.install("numpy==2.0.*")
            importlib.reload(numpy)
            print(f"✅ Numpy updated to: {numpy.__version__}")
        except Exception as e2:
            print(f"❌ Failed to install specific numpy version: {e2}")
            print("💡 Numpy version conflict cannot be resolved in this Pyodide environment")
            return False
    
    # Now try installing build123d
    print("🏗️ Attempting to install build123d with updated numpy...")
    try:
        await micropip.install("build123d")
        print("✅ build123d installed successfully!")
        return True
    except Exception as e:
        print(f"❌ build123d installation still failed: {e}")
        
        # Try with --no-deps to skip dependency checking
        try:
            print("🔄 Trying build123d installation without dependency checking...")
            await micropip.install("build123d", deps=False)
            print("✅ build123d installed without dependency checking!")
            print("⚠️  Warning: Some features might not work due to version conflicts")
            return True
        except Exception as e2:
            print(f"❌ Even --no-deps installation failed: {e2}")
            return False

# Run the fix
result = asyncio.get_event_loop().run_until_complete(fix_numpy_issue())

if result:
    print("🎉 Success! You can now try importing build123d")
else:
    print("😞 Could not resolve the numpy version conflict")
    print("💡 Consider using an alternative CAD library or a different approach") 