# Python WebAssembly Runner

A modern web application that runs Python code directly in the browser using WebAssembly via Pyodide. No server-side Python installation required!

## 🚀 Features

- **Browser-based Python execution** using WebAssembly (Pyodide)
- **Pre-installed libraries**: NumPy, Matplotlib, Pandas
- **Modern, responsive UI** with syntax highlighting
- **Real-time code execution** with output capture
- **Error handling** and display
- **Example code** to get you started
- **Keyboard shortcuts** (Ctrl/Cmd + Enter to run)

## 🛠️ Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (required due to CORS restrictions)

### Quick Start

1. **Clone or download** this project to your local machine

2. **Start a local web server** in the project directory:

   **Option 1: Using Python (if you have Python installed)**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option 2: Using Node.js (if you have Node.js installed)**
   ```bash
   npx http-server -p 8000
   ```

   **Option 3: Using PHP (if you have PHP installed)**
   ```bash
   php -S localhost:8000
   ```

3. **Open your browser** and navigate to:
   ```
   http://localhost:8000
   ```

4. **Wait for initialization** (first load takes ~5-10 seconds to download Pyodide)

5. **Start coding!** The example code will load automatically, or write your own Python scripts.

## 📁 Project Structure

```
WebAssmPy/
├── index.html          # Main HTML file with UI
├── style.css           # Modern CSS styling
├── script.js           # JavaScript for Pyodide integration
├── example.py          # Example Python script
└── README.md           # This file
```

## 🐍 Available Python Libraries

This setup comes with several pre-installed Python libraries:

- **NumPy** - Numerical computing
- **Matplotlib** - Plotting and visualization
- **Pandas** - Data manipulation and analysis
- **Micropip** - Dynamic package installer for pure Python packages
- **Standard Library** - All built-in Python modules

You can install additional packages in two ways:

1. **Pre-install packages** by modifying the `loadPackage` call in `script.js`
2. **Dynamically install packages** in your Python code using micropip:
   ```python
   import micropip
   await micropip.install('package_name')
   ```
   
   **Note**: Micropip can only install pure Python packages (no compiled extensions). For packages with compiled components, they need to be specifically built for Pyodide.

## 💡 Example Code

The project includes a comprehensive example (`example.py`) that demonstrates:

- Basic Python syntax and operations
- NumPy array operations and linear algebra
- Data analysis with statistics
- Object-oriented programming
- Functional programming concepts
- String manipulation
- JSON handling
- Algorithm implementation (Fibonacci)

## 🎮 Usage Tips

1. **Keyboard Shortcuts**: Press `Ctrl+Enter` (or `Cmd+Enter` on Mac) to run your code
2. **Clear Functions**: Use the "Clear" buttons to reset code or output
3. **Error Display**: Errors are displayed in red in the output section
4. **Performance**: First run may be slower due to initialization; subsequent runs are faster

## 🔧 Customization

### Adding More Python Packages

Edit the `loadPackage` call in `script.js`:

```javascript
await pyodide.loadPackage(['numpy', 'matplotlib', 'pandas', 'scipy', 'sympy']);
```

Check [Pyodide packages](https://pyodide.org/en/stable/usage/packages-in-pyodide.html) for available libraries.

### Styling

Modify `style.css` to customize the appearance. The current design uses:
- Modern gradient backgrounds
- Responsive design for mobile devices
- Smooth animations and transitions
- Professional color scheme

### Functionality

Extend `script.js` to add features like:
- File upload/download
- Code persistence in localStorage
- Multiple code tabs
- Code sharing functionality

## 🌐 Browser Compatibility

- ✅ Chrome 79+
- ✅ Firefox 72+
- ✅ Safari 14+
- ✅ Edge 79+

## 📊 Performance Notes

- **Initial Load**: ~5-10 seconds (downloads Pyodide runtime)
- **Subsequent Runs**: Near-native Python speed
- **Memory Usage**: Reasonable for most applications
- **Package Loading**: Additional packages may take extra time on first use

## 🐛 Troubleshooting

### "Failed to initialize Python environment"
- Ensure you're running from a web server (not opening the HTML file directly)
- Check your internet connection (Pyodide downloads from CDN)
- Try refreshing the page

### Code not running
- Wait for "Python environment ready! 🚀" message
- Check for syntax errors in your Python code
- Ensure your browser supports WebAssembly

### Performance issues
- Close other browser tabs if memory usage is high
- Refresh the page to reset the Python environment
- Consider breaking large computations into smaller chunks

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve this project!

## 📄 License

This project is open source and available under the MIT License.

## 🔗 Useful Links

- [Pyodide Documentation](https://pyodide.org/en/stable/)
- [WebAssembly Official Site](https://webassembly.org/)
- [Python.org](https://www.python.org/)

---

**Happy coding with Python in the browser! 🐍✨** 