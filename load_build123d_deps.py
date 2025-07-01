import micropip
import asyncio

async def load_all_dependencies():
    print("📦 Loading all dependencies for build123d...")
    
    # Common packages that build123d might need
    packages_to_load = [
        'typing-extensions',
        'packaging', 
        'setuptools',
        'wheel',
        'six',
        'python-dateutil',
        'pytz'
    ]
    
    # Load each package individually to identify which ones are missing
    for package in packages_to_load:
        try:
            print(f"📥 Loading {package}...")
            await micropip.install(package)
            print(f"✅ {package} loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load {package}: {e}")
    
    print("🔧 Testing typing-extensions specifically...")
    try:
        import typing_extensions
        print(f"✅ typing-extensions imported successfully (version: {typing_extensions.__version__})")
    except ImportError as e:
        print(f"❌ typing-extensions import failed: {e}")
        
        # Try alternative import
        try:
            from typing_extensions import *
            print("✅ typing-extensions imported with wildcard import")
        except ImportError as e2:
            print(f"❌ typing-extensions wildcard import also failed: {e2}")
    
    print("🏗️ Now testing build123d import...")
    try:
        from build123d import *
        print("✅ build123d imported successfully!")
        
        # Try creating a simple object to verify it's working
        print("🧪 Testing build123d functionality...")
        with BuildPart() as test_part:
            Box(10, 10, 10)
        print("✅ build123d is working correctly!")
        
    except Exception as e:
        print(f"❌ build123d import/usage failed: {e}")
        print("💡 Try reloading the webpage to pick up the new typing-extensions package")

# Run the dependency loading
asyncio.get_event_loop().run_until_complete(load_all_dependencies()) 