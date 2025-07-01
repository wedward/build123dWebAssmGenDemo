import micropip, asyncio

async def debug_build123d():
    print("🔍 Starting build123d installation debug...")

    print("📡 Setting up custom index URLs...")
    micropip.set_index_urls(["https://yeicor.github.io/OCP.wasm", "https://pypi.org/simple"])

    print("🏗️ Adding mock package for py-lib3mf...")
    micropip.add_mock_package("py-lib3mf", "2.4.1", modules={"py_lib3mf": '''import micropip; import asyncio; asyncio.run(micropip.install("lib3mf")); from lib3mf import *'''})

    print("📦 Attempting to install build123d...")
    try:
        await micropip.install(["build123d"])
        print("✅ build123d installation successful!")
    except Exception as e:
        print(f"❌ Error installing build123d: {e}")
        print("🔍 Let's try a different approach...")
        
        # Try installing without custom index first
        try:
            print("📦 Trying to install from PyPI only...")
            micropip.set_index_urls(["https://pypi.org/simple"])
            await micropip.install(["build123d"])
            print("✅ build123d installation from PyPI successful!")
        except Exception as e2:
            print(f"❌ Error installing from PyPI: {e2}")
            print("This package might not be compatible with Pyodide or requires special handling.")

    try:
        print("📦 Attempting to install sqlite3...")
        await micropip.install(["sqlite3"])
        print("✅ sqlite3 installation successful!")
    except Exception as e:
        print(f"❌ Error installing sqlite3: {e}")

    print("🔍 Debug complete. Check the errors above to identify the issue.")

# Run the debug function
asyncio.get_event_loop().run_until_complete(debug_build123d()) 