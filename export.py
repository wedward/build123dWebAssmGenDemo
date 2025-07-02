# Export script - handles STL generation and data preparation for 3D viewer
# This script expects an 'output' variable to be defined with the following structure:
# output = [
#     {"name": "part_name", "part": part_geometry, "color": "#hex_color"},
#     ...
# ]

print("Starting export process...")

# Validate output variable exists
if 'output' not in globals():
    raise ValueError("No 'output' variable found. Please define output as a list of parts with name, part, and color.")

if not isinstance(output, list):
    raise ValueError("Output must be a list of part dictionaries.")

if len(output) == 0:
    raise ValueError("Output list is empty. Please add at least one part.")

# Export each part individually and collect STL data
parts_data = []
for i, part_info in enumerate(output):
    # Validate part structure
    if not isinstance(part_info, dict):
        raise ValueError(f"Part {i} must be a dictionary with 'name', 'part', and 'color' keys.")
    
    required_keys = ['name', 'part', 'color']
    missing_keys = [key for key in required_keys if key not in part_info]
    if missing_keys:
        raise ValueError(f"Part {i} is missing required keys: {missing_keys}")
    
    # Generate filename and export STL
    filename = f"output_part_{i}_{part_info['name']}.stl"
    export_stl(part_info['part'], filename)
    
    # Read STL data
    with open(filename, 'rb') as fh:
        stl_data = fh.read()
    
    # Prepare part data for JavaScript
    parts_data.append({
        'name': part_info['name'],
        'color': part_info['color'],
        'stl': to_js(stl_data, create_pyproxies=False)
    })
    
    print(f"Exported part '{part_info['name']}' to {filename}")

# Store parts data for 3D viewer (list of parts with names, colors, and STL data)
window.partsData = to_js(parts_data, create_pyproxies=False)
print(f"Export complete - {len(output)} parts ready for 3D viewer") 