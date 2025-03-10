let guiControllers = {};
let defaultPreset = "Galaxy";

// Default parameters
const params = {
    // Animation Settings
    speed: 2.2,
    iterations: 13,
    //backgroundColor: "#000000",
    // Presets
    preset: defaultPreset,
    // Pattern Settings
    scale: 0.05,
    dotFactor: 0.1,
    vOffset: 6.4,
    intensityFactor: 0.23,
    expFactor: 0.6,
    dotMultiplier: 0.3,
    noiseIntensity: 4.0,
    // Color Settings
    redFactor: 0.0,
    greenFactor: 0.0,
    blueFactor: 0.0,
    colorShift: 0.0,
    // Logo Settings (fixed values)
    logoOpacity: 1.0,
    logoScale: 1.0,
    logoInteractStrength: 0.4,

    // Animation Control
    playing: true,
};

// Initialize dat.gui
function initGui() {
    const gui = new dat.GUI({ width: 300 });
    
    // Create folders for organization
    const animationFolder = gui.addFolder('Animation Settings');
    const colorFolder = gui.addFolder('Color');
    const logoFolder = gui.addFolder('Logo Settings');

    // Animation Setting controls

    const presetNames = Object.keys(presets);
    animationFolder.add(params, 'preset', presetNames).name('Load Preset')
        .onChange(function(presetName) {
            applyPreset(presetName);
        });

    guiControllers.speed = animationFolder.add(params, 'speed', 0.1, 2.0).name('Speed');
    guiControllers.iterations = animationFolder.add(params, 'iterations', 3, 24).step(1).name('Color Smoothing');
    /*
    guiControllers.backgroundColor = animationFolder.addColor(params, 'backgroundColor').name('Background Color')
    .onChange(function() {
        // This will trigger an immediate update when background color changes
        //const bgColor = hexToRgb(params.backgroundColor);
        //gl.clearColor(bgColor.r / 255, bgColor.g / 255, bgColor.b / 255, 1.0);
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //canvas.style.backgroundColor = params.backgroundColor;
    });
    animationFolder.add(params, 'randomizeInputs').name('Randomize Inputs (r)');
    animationFolder.add(params, 'saveImage').name('Save Image (s)');
    animationFolder.add(params, 'exportVideo').name('Record Video (v)');
    */

    // Pattern controls
    guiControllers.noiseIntensity = animationFolder.add(params, 'noiseIntensity', 0.0, 10.0).step(0.1).name('Noise Intensity');
    guiControllers.scale = animationFolder.add(params, 'scale', 0.1, 4.0).step(0.01).name('Pattern Scale');
    guiControllers.dotFactor = animationFolder.add(params, 'dotFactor', 0.1, 1.2).name('Dot Factor');
    guiControllers.dotMultiplier = animationFolder.add(params, 'dotMultiplier', 0.0, 2.0).name('Dot Multiplier');
    guiControllers.vOffset = animationFolder.add(params, 'vOffset', 0.0, 10.0).step(0.1).name('Pattern Offset');
    guiControllers.intensityFactor = animationFolder.add(params, 'intensityFactor', 0.05, 0.5).name('Intensity');
    guiControllers.expFactor = animationFolder.add(params, 'expFactor', 0.1, 5.0).name('Exp Factor');

    animationFolder.open();

    // Color controls
    guiControllers.redFactor = colorFolder.add(params, 'redFactor', -3.0, 3.0).step(0.1).name('Red Component');
    guiControllers.greenFactor = colorFolder.add(params, 'greenFactor', -3.0, 3.0).step(0.1).name('Green Component');
    guiControllers.blueFactor = colorFolder.add(params, 'blueFactor', -3.0, 3.0).step(0.1).name('Blue Component');
    guiControllers.colorShift = colorFolder.add(params, 'colorShift', 0.0, 2.0).step(0.1).name('Color Shift');
    colorFolder.open();

    // Add logo parameters to GUI
    guiControllers.logoScale = logoFolder.add(params, 'logoScale', 0.5, 3.0).name('Logo Scale');
    guiControllers.logoInteractStrength = logoFolder.add(params, 'logoInteractStrength', 0.0, 0.3).step(0.01).name('Edge Interaction');
    logoFolder.open();

    return gui;
}

// Apply a preset
function applyPreset(presetName) {
    const preset = presets[presetName];
    if (!preset) return;
    
    // Update the params object with preset values
    Object.keys(preset).forEach(key => {
        if (key in params) {
            params[key] = preset[key];
            
            // Update the UI controller if it exists
            if (guiControllers[key]) {
                guiControllers[key].updateDisplay();
            }
        }
    });
    
    params.logoOpacity = 1.0;
    params.logoScale = 1.0;
}

// Create buffers for the quad (two triangles that cover the entire canvas)
function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Create a quad that covers the entire clip space (-1 to 1)
    const positions = [
        -1.0, -1.0,  // bottom left
        1.0, -1.0,  // bottom right
        -1.0,  1.0,  // top left
        1.0,  1.0,  // top right
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    return positionBuffer;
}

// Toggle play/pause
function togglePlayPause() {
    params.playing = !params.playing;
    
    if (params.playing) {
        // Resuming playback
        startTime = Date.now() - pausedTime;
    } else {
        // Pausing playback
        pausedTime = currentTime;
    }
}

// Update the randomize function to include logo parameters but not change logoScale
function randomizeInputs() {
    // Animation parameters
    params.speed = Math.random() * 0.5 + 0.3;
    params.iterations = Math.ceil(Math.random() * 8 + 4);

    // Pattern parameters
    params.scale = Math.random() * 3.9 + 0.1;
    params.dotFactor = Math.random() * 1.0;
    params.dotMultiplier = Math.random() * 1.0;
    params.vOffset = Math.random() * 10.0;
    params.intensityFactor = Math.random() * 0.5;
    params.expFactor = Math.random() * 5.0;
    params.noiseIntensity = Math.random() * 10.0;

    // Color parameters
    params.redFactor = Math.random() * 4.0 - 2.0; // -2.0 to 2.0
    params.greenFactor = Math.random() * 4.0 - 2.0; // -2.0 to 2.0
    params.blueFactor = Math.random() * 4.0 - 2.0; // -2.0 to 2.0
    params.colorShift = Math.random(); // 0.0 to 1.0

    params.logoInteractStrength = 0.01 + Math.random()*0.29;
    params.logoOpacity = 1.0;

    // Update all UI controllers
    for (const key in guiControllers) {
        if (guiControllers[key]) {
            guiControllers[key].updateDisplay();
        }
    }
}

function resetAnimation(){
  startTime = Date.now();
}

// Handle keyboard events
window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        togglePlayPause();
    }

    if (event.code === 'KeyR') {
      randomizeInputs();
    }

    if (event.code === 'KeyS') {
      saveImage();
    }

    if (event.code === 'KeyV') {
      toggleVideoRecord();
    }
});

document.getElementById('randomizeBtn').addEventListener('click', () => randomizeInputs());
document.getElementById('exportVideoBtn').addEventListener('click', () => toggleVideoRecord());
document.getElementById('saveBtn').addEventListener('click', () => saveImage());