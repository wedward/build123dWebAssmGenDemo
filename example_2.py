import micropip, asyncio
async def fix_numpy_issue():
    await micropip.install("numpy", deps=False)  # Force upgrade without checking deps
    import importlib
    importlib.reload(numpy)

micropip.set_index_urls(["https://yeicor.github.io/OCP.wasm", "https://pypi.org/simple"])
micropip.add_mock_package("py-lib3mf", "2.4.1", modules={"py_lib3mf": '''import micropip; import asyncio; asyncio.run(micropip.install("lib3mf")); from lib3mf import *'''}) # Only required for build123d<0.10.0
asyncio.get_event_loop().run_until_complete(micropip.install(["build123d", "sqlite3"]))
from js import Blob, document
from js import window
from pyodide.ffi import to_js
import io
from build123d import *

length, width, thickness = 80.0, 60.0, 10.0
center_hole_dia = 22.0

with BuildPart() as ex2:
    Box(length, width, thickness)
    Cylinder(radius=center_hole_dia / 2, height=thickness, mode=Mode.SUBTRACT)

brep_byte_array = io.BytesIO()
export_brep(ex2.part, brep_byte_array)
blob = Blob.new([to_js(brep_byte_array.getvalue(),create_pyproxies=False)])

url = window.URL.createObjectURL(blob)
a = document.createElement('a')
a.href = url
a.download = "output_filename.brep"
document.body.appendChild(a)
a.click()
document.body.removeChild(a)