// Set up canvas and WebGL context
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
const playPauseIndicator = document.getElementById('play-pause-indicator');

if (!gl) {
    alert('WebGL not supported in your browser');
}

// Set canvas size
function resizeCanvas() {
    const maxSize = 800;
    canvas.width = Math.min(window.innerWidth, maxSize);
    canvas.height = Math.min(window.innerHeight, maxSize);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Store all controllers for updating later
let guiControllers = {};

// Default parameters
const params = {
    // Animation Settings
    speed: 2.2,
    iterations: 13,
    // Presets
    preset: 'Liquid',
    // Pattern Settings
    scale: 0.05,
    dotFactor: 0.1,
    vOffset: 6.4,
    intensityFactor: 0.23,
    expFactor: 0.6,
    dotMultiplier: 0.3,
    // Color Settings
    redFactor: 0.0,
    greenFactor: 0.0,
    blueFactor: 0.0,
    colorShift: 0.0,
    // Logo Settings (fixed values)
    logoOpacity: 1.0,
    logoScale: 1.5,
    logoInteractStrength: 0.6,

    // Animation Control
    playing: true,
    randomizeInputs: function() {
        randomizeInputs();
    },
    saveImage: function() {
      saveImage();
    },
    exportVideo: function() {
      toggleVideoRecord();
    },
};

// Animation state
let animationFrameId;
let startTime = Date.now();
let pausedTime = 0;
let currentTime = 0;

// Initialize dat.gui
function initGui() {
    const gui = new dat.GUI({ width: 300 });
    
    // Create folders for organization
    const animationFolder = gui.addFolder('Animation');
    const presetFolder = gui.addFolder('Presets');
    const patternFolder = gui.addFolder('Pattern');
    const colorFolder = gui.addFolder('Color');
    
    // Animation controls
    guiControllers.speed = animationFolder.add(params, 'speed', 0.1, 2.0).name('Speed');
    guiControllers.iterations = animationFolder.add(params, 'iterations', 3, 24).step(1).name('Iterations');
    animationFolder.add(params, 'randomizeInputs').name('Randomize Inputs (r)');
    animationFolder.add(params, 'saveImage').name('Save Image (s)');
    animationFolder.add(params, 'exportVideo').name('Record Video (v)');
    animationFolder.open();

    // Presets dropdown
    const presetNames = Object.keys(presets);
    presetFolder.add(params, 'preset', presetNames).name('Load Preset')
        .onChange(function(presetName) {
            applyPreset(presetName);
        });
    presetFolder.open();
    
    // Pattern controls
    guiControllers.scale = patternFolder.add(params, 'scale', 0.02, 4.0).name('Pattern Scale');
    guiControllers.dotFactor = patternFolder.add(params, 'dotFactor', 0.1, 1.2).name('Dot Factor');
    guiControllers.dotMultiplier = patternFolder.add(params, 'dotMultiplier', 0.0, 2.0).name('Dot Multiplier');
    guiControllers.vOffset = patternFolder.add(params, 'vOffset', 0.0, 10.0).step(0.1).name('Pattern Offset');
    guiControllers.intensityFactor = patternFolder.add(params, 'intensityFactor', 0.05, 1.0).name('Intensity');
    guiControllers.expFactor = patternFolder.add(params, 'expFactor', 0.1, 10.0).name('Exp Factor');
    patternFolder.open();

    // Color controls
    guiControllers.redFactor = colorFolder.add(params, 'redFactor', -3.0, 3.0).step(0.1).name('Red Component');
    guiControllers.greenFactor = colorFolder.add(params, 'greenFactor', -3.0, 3.0).step(0.1).name('Green Component');
    guiControllers.blueFactor = colorFolder.add(params, 'blueFactor', -3.0, 3.0).step(0.1).name('Blue Component');
    guiControllers.colorShift = colorFolder.add(params, 'colorShift', 0.0, 2.0).step(0.1).name('Color Shift');
    colorFolder.open();

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
    
    // Always ensure fixed logoOpacity
    params.logoOpacity = 1.0;
    
    // Note: We're not resetting logoScale when a preset is applied
    // so users can keep their preferred scale when switching presets
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
        playPauseIndicator.textContent = "Playing";
    } else {
        // Pausing playback
        pausedTime = currentTime;
        playPauseIndicator.textContent = "Paused";
    }
    
    // Show indicator
    playPauseIndicator.classList.add('visible');
    
    // Hide indicator after 1.5 seconds
    setTimeout(() => {
        playPauseIndicator.classList.remove('visible');
    }, 1500);
}

// Update the randomize function to include logo parameters but not change logoScale
function randomizeInputs() {
    // Animation parameters
    params.speed = Math.random() * 0.5 + 0.3;
    params.iterations = Math.ceil(Math.random() * 12 + 4); // 4 to 16
    
    // Pattern parameters
    params.scale = Math.random() * 4;
    params.dotFactor = Math.random() * 1.0;
    params.dotMultiplier = Math.random() * 1.0;
    params.vOffset = Math.random() * 10.0;
    params.intensityFactor = Math.random() * 1.0;
    params.expFactor = Math.random() * 10.0;
    
    // Color parameters
    params.redFactor = Math.random() * 4.0 - 2.0; // -2.0 to 2.0
    params.greenFactor = Math.random() * 4.0 - 2.0; // -2.0 to 2.0
    params.blueFactor = Math.random() * 4.0 - 2.0; // -2.0 to 2.0
    params.colorShift = Math.random(); // 0.0 to 1.0
    
    params.logoInteractStrength = 0.3 + Math.random()*0.4; // 0.0 to 1.0
    
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
      
      // Show indicator
      playPauseIndicator.textContent = "Randomized";
      playPauseIndicator.classList.add('visible');
      
      // Hide indicator after 1.5 seconds
      setTimeout(() => {
          playPauseIndicator.classList.remove('visible');
      }, 1500);
    }

    if (event.code === 'KeyS') {
      saveImage();
    }

    if (event.code === 'KeyV') {
      toggleVideoRecord();
    }
});