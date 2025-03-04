# Liquid Logo

![Liquid Logo](assets/siteOGImage4.png)
![Liquid Logo gif](assets/playstation.gif)

A free, open-source tool for creating animated logos using a liquid metal aesthetic. Transform static logos and images into flowing animations.

## Live Demo

Try it in real-time in the browser: [Liquid Logo Tool](https://collidingscopes.github.io/liquid-logo)

### Features

- **Upload your own images** or use one of the demo logos
- **Real-time customization** of key parameters
- **Export as PNG** or **MP4 video**
- **Fully client-side processing** - your images never leave your device

## How It Works

This tool leverages WebGL shaders to create real-time animations that interact with the edges of your logo. It uses edge detection to create flowing patterns that follow the contours of your image, giving a liquid metal aesthetic.

The animation is powered by a custom fragment shader that:
1. Detects the edges of your logo
2. Generates a vector field around these edges
3. Applies fluid dynamics and noise to create the flowing effect
4. Renders with a metallic sheen and customizable color palette

## Technical Details

- **WebGL** for hardware-accelerated graphics rendering
- **GLSL shaders** for the liquid metal animation effect
- **Simplex noise** for organic movement patterns
- **JavaScript** for UI and application logic
- **HTML5 Canvas** for drawing and video export
- **MP4 Muxer** for video encoding
- **dat.GUI** for the control interface

### Usage Guide

1. **Upload an image** of your logo (works best with clean, high-contrast images)
2. Use the **Randomize** button (🎲) to generate interesting variations
3. Fine-tune the animation using the **control panel** at the top-right of the page
4. Export your logo animation as an **image** or **video**

### Keyboard Shortcuts

- **[Space]**: Pause/play the animation
- **[R]**: Randomize all inputs
- **[S]**: Save a screenshot
- **[V]**: Start/stop video recording

## Best Practices

- Use images with **clean edges** and minimal background noise
- **Experiment with presets** to find the best starting point for your logo

## Installation & Usage

### Local Setup

1. Clone the repository:
   ```
   git clone https://github.com/collidingScopes/liquid-logo.git
   ```

2. Navigate to the project directory:
   ```
   cd liquid-logo
   ```

3. Run a local server (you can use Python's built-in server):
   ```
   # Python 3
   python -m http.server
   
   # Python 2
   python -m SimpleHTTPServer
   ```

4. Open your browser and navigate to `http://localhost:8000`


## License

This project is licensed under the [MIT License](LICENSE.txt) - feel free to use it for personal or commercial purposes.

## Related Projects

Check out my other free, open-source creative tools:

- [Particular Drift](https://collidingScopes.github.io/particular-drift): Turn photos into flowing particle animations
- [Video-to-ASCII](https://collidingScopes.github.io/ascii): Convert videos into ASCII pixel art
- [Shape Shimmer](https://collidingScopes.github.io/shimmer): Transform photos into funky wave animations
- [Colliding Scopes](https://collidingScopes.github.io): Create kaleidoscope animations from photos
- [Force-Field Animation](https://collidingScopes.github.io/forcefield): Generate particle animations from photos
- [Manual Brick Breaker](https://manual-brick-breaker.netlify.app): Play brick breaker by waving your hands around

## Acknowledgments

- Enormous thanks to [XorDev](https://x.com/XorDev/status/1894123951401378051) on Twitter, whose "Plasma" shader work served as a starting point for this tool.

## Contact & Connect

Feel free to reach out for questions, suggestions, or just to share what you've created!

- [Instagram](https://www.instagram.com/stereo.drift/)
- [Twitter/X](https://x.com/measure_plan)
- [Email](mailto:stereodriftvisuals@gmail.com)

## Donations

If you found this tool useful, feel free to buy me a coffee. This would be much appreciated during late-night coding sessions!

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/yellow_img.png)](https://www.buymeacoffee.com/stereoDrift)