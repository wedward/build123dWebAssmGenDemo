print("Starting package installation...")
import micropip
print("micropip imported")

micropip.set_index_urls(["https://yeicor.github.io/OCP.wasm", "https://pypi.org/simple"])
print("Index URLs set")

print("Installing lib3mf first...")
await micropip.install("lib3mf")
print("lib3mf installed")

micropip.add_mock_package("py-lib3mf", "2.4.1", modules={"py_lib3mf": '''from lib3mf import *'''}) # Only required for build123d<0.10.0
print("Mock package added")

print("Installing build123d and sqlite3...")
await micropip.install(["build123d", "sqlite3"])
print("Installation completed")

print("Importing JavaScript interfaces...")
from js import Blob, document
from js import window
from pyodide.ffi import to_js
import io
print("JavaScript interfaces imported")

print("Attempting to import build123d...")
try:
    from build123d import *
    print("build123d imported successfully!")
except ImportError as e:
    print(f"Failed to import build123d: {e}")
    import sys
    print("Available packages:")
    print([pkg for pkg in sys.modules.keys() if 'build' in pkg.lower()])
    