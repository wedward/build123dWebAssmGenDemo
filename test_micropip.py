import micropip
import asyncio

async def run_tests():
    print("🧪 Testing micropip installations...")

    # Test 1: Simple package from PyPI
    print("📦 Test 1: Installing 'requests' from PyPI...")
    try:
        await micropip.install("requests")
        import requests
        print("✅ Success: requests installed and imported")
    except Exception as e:
        print(f"❌ Failed: {e}")

    # Test 2: Check custom index accessibility
    print("🌐 Test 2: Checking custom index accessibility...")
    try:
        import urllib.request
        response = urllib.request.urlopen("https://yeicor.github.io/OCP.wasm")
        print(f"✅ Custom index is accessible (status: {response.status})")
    except Exception as e:
        print(f"❌ Custom index not accessible: {e}")

    # Test 3: Try setting custom index and installing a simple package
    print("📡 Test 3: Setting custom index URLs...")
    try:
        micropip.set_index_urls(["https://yeicor.github.io/OCP.wasm", "https://pypi.org/simple"])
        print("✅ Custom index URLs set successfully")
        
        # Try installing a simple package that should be available
        print("📦 Trying to install a simple package with custom index...")
        await micropip.install("urllib3")  # Common package that should be available
        print("✅ Package installation with custom index works")
        
    except Exception as e:
        print(f"❌ Custom index setup failed: {e}")

    # Test 4: Check if build123d is available anywhere
    print("🔍 Test 4: Checking build123d availability...")
    try:
        micropip.set_index_urls(["https://pypi.org/simple"])  # Reset to PyPI only
        await micropip.install("build123d")
        print("✅ build123d available from PyPI")
    except Exception as e:
        print(f"❌ build123d not available from PyPI: {e}")

    print("🔍 Tests complete! Check results above.")
    print("💡 If custom index fails, try contacting the build123d maintainers for the correct Pyodide-compatible package source.")

# Run the tests
asyncio.get_event_loop().run_until_complete(run_tests()) 