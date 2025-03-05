/*
To do:
Add GUI toggle for canvas background color
Ability to export images and or video with transparent background?
Additional noise / distortion styles or parameters
Fix edge pixelation / aliasing?
*/

// Global variables for WebGL
let programInfo;
let positionBuffer;
let logoTexture = null;
let logoImage = null;
let logoAspectRatio = 1.0;
let gui;

//const MAX_DIMENSION = Math.min(1200, window.innerWidth);
const MAX_DIMENSION = 1024;

// Animation state
let animationFrameId;
let startTime = Date.now();
let pausedTime = 0;
let currentTime = 0;

// Set up canvas and WebGL context
const canvas = document.getElementById('canvas');
//const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
const gl = canvas.getContext('webgl', { 
    antialias: true,
    alpha: true,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
});

if (!gl) {
    alert('WebGL not supported in your browser');
}

// Function to resize an image and create a texture while preserving aspect ratio
function resizeAndCreateLogoTexture(originalImage) {
    // Get original dimensions and aspect ratio
    const originalWidth = originalImage.width;
    const originalHeight = originalImage.height;
    const originalAspect = originalWidth / originalHeight;
    
    // Store the original aspect ratio for the shader
    logoAspectRatio = originalAspect;
    
    console.log(`Original image: ${originalWidth}x${originalHeight}, aspect ratio: ${originalAspect}`);
        
    // Calculate target dimensions while preserving aspect ratio exactly
    let imageTargetWidth, imageTargetHeight;
    
    if (originalWidth >= originalHeight) {
        // Landscape orientation (width >= height)
        imageTargetWidth = Math.min(originalWidth, MAX_DIMENSION);
        imageTargetHeight = Math.round(imageTargetWidth / originalAspect);
    } else {
        // Portrait orientation (height > width)
        imageTargetHeight = Math.min(originalHeight, MAX_DIMENSION);
        imageTargetWidth = Math.round(imageTargetHeight * originalAspect);
    }

    // Adjust dimensions to be divisible by 4
    imageTargetWidth = Math.floor(imageTargetWidth / 4) * 4;
    imageTargetHeight = Math.floor(imageTargetHeight / 4) * 4;
    
    // Make sure we have at least 4x4 pixels
    imageTargetWidth = Math.max(imageTargetWidth, 4);
    imageTargetHeight = Math.max(imageTargetHeight, 4);
    
    // Determine the square canvas size (use the larger dimension)
    const squareSize = Math.max(imageTargetWidth, imageTargetHeight);
    
    // Ensure square size is divisible by 4
    const adjustedSquareSize = Math.ceil(squareSize / 4) * 4;
    
    // Calculate centering offsets to position the image in the middle of the square canvas
    const offsetX = Math.floor((adjustedSquareSize - imageTargetWidth) / 2);
    const offsetY = Math.floor((adjustedSquareSize - imageTargetHeight) / 2);
    
    console.log(`Image target dimensions: ${imageTargetWidth}x${imageTargetHeight}`);
    console.log(`Square canvas size: ${adjustedSquareSize}x${adjustedSquareSize}`);
    console.log(`Centering offsets: X=${offsetX}, Y=${offsetY}`);
    
    // Set canvas size to square dimensions
    canvas.width = adjustedSquareSize;
    canvas.height = adjustedSquareSize;
    gl.viewport(0, 0, adjustedSquareSize, adjustedSquareSize);
    
    // Create a temporary canvas for resizing
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d', {
        alpha: true,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });
    tempCanvas.width = adjustedSquareSize;
    tempCanvas.height = adjustedSquareSize;
    
    // Set transparent background
    ctx.clearRect(0, 0, adjustedSquareSize, adjustedSquareSize);
    
    // Draw image centered in the square canvas
    ctx.drawImage(originalImage, offsetX, offsetY, imageTargetWidth, imageTargetHeight);
    
    // Create WebGL texture
    if (!gl) return;
    
    // Delete existing texture if any
    if (logoTexture) {
        gl.deleteTexture(logoTexture);
    }
    
    // Create new texture
    logoTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, logoTexture);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Upload the canvas content to the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tempCanvas);
}

// Initialize the application
async function init() {
    // Initial canvas setup - this will be overridden when a logo is loaded
    canvas.width = 800;
    canvas.height = 800;
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Initialize the shader program
    const shaderProgram = await initShaderProgram(gl);
    
    if (!shaderProgram) {
        console.error('Failed to create shader program');
        return;
    }
    
    // Get attribute and uniform locations
    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
            resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
            time: gl.getUniformLocation(shaderProgram, 'u_time'),
            speed: gl.getUniformLocation(shaderProgram, 'u_speed'),
            iterations: gl.getUniformLocation(shaderProgram, 'u_iterations'),
            scale: gl.getUniformLocation(shaderProgram, 'u_scale'),
            dotFactor: gl.getUniformLocation(shaderProgram, 'u_dotFactor'),
            vOffset: gl.getUniformLocation(shaderProgram, 'u_vOffset'),
            intensityFactor: gl.getUniformLocation(shaderProgram, 'u_intensityFactor'),
            expFactor: gl.getUniformLocation(shaderProgram, 'u_expFactor'),
            colorFactors: gl.getUniformLocation(shaderProgram, 'u_colorFactors'),
            colorShift: gl.getUniformLocation(shaderProgram, 'u_colorShift'),
            dotMultiplier: gl.getUniformLocation(shaderProgram, 'u_dotMultiplier'),
            noiseIntensity: gl.getUniformLocation(shaderProgram, 'u_noiseIntensity'),
            // Logo-related uniforms
            logoTexture: gl.getUniformLocation(shaderProgram, 'u_logoTexture'),
            logoOpacity: gl.getUniformLocation(shaderProgram, 'u_logoOpacity'),
            logoScale: gl.getUniformLocation(shaderProgram, 'u_logoScale'),
            logoAspectRatio: gl.getUniformLocation(shaderProgram, 'u_logoAspectRatio'),
            logoInteractStrength: gl.getUniformLocation(shaderProgram, 'u_logoInteractStrength'),
            logoBlendMode: gl.getUniformLocation(shaderProgram, 'u_logoBlendMode'),
        },
    };
    
    // Initialize buffers
    positionBuffer = initBuffers(gl);
    
    // Initialize GUI
    gui = initGui();
    gui.close();
    
    // Setup image upload handler
    document.getElementById('fileInput').addEventListener('change', handleImageUpload);
    
    // Load default logo
    loadDemoLogo('apple');
    
    // Start rendering
    animate();
}

function drawScene() {
    // Update current time
    if (params.playing) {
        currentTime = Date.now() - startTime;
    }

    // Clear the canvas with transparency
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Always ensure viewport matches canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Set up blending for transparent backgrounds
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Use the shader program
    gl.useProgram(programInfo.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        2,          // 2 components per vertex
        gl.FLOAT,   // 32bit floating point values
        false,      // don't normalize
        0,          // stride (0 = auto)
        0           // offset into buffer
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    // Set the uniforms
    gl.uniform2f(programInfo.uniformLocations.resolution, canvas.width, canvas.height);
    gl.uniform1f(programInfo.uniformLocations.time, currentTime / 1000);

    // Set the UI parameter uniforms
    gl.uniform1f(programInfo.uniformLocations.speed, params.speed);
    gl.uniform1f(programInfo.uniformLocations.iterations, params.iterations);
    gl.uniform1f(programInfo.uniformLocations.scale, params.scale);
    gl.uniform1f(programInfo.uniformLocations.dotFactor, params.dotFactor);
    gl.uniform1f(programInfo.uniformLocations.vOffset, params.vOffset);
    gl.uniform1f(programInfo.uniformLocations.intensityFactor, params.intensityFactor);
    gl.uniform1f(programInfo.uniformLocations.expFactor, params.expFactor);
    gl.uniform3f(programInfo.uniformLocations.colorFactors, 
                params.redFactor, params.greenFactor, params.blueFactor);
    gl.uniform1f(programInfo.uniformLocations.colorShift, params.colorShift);
    gl.uniform1f(programInfo.uniformLocations.dotMultiplier, params.dotMultiplier);
    gl.uniform1f(programInfo.uniformLocations.noiseIntensity, params.noiseIntensity);

    // Handle logo texture and related uniforms
    if (logoTexture) {
        // Activate texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, logoTexture);
        gl.uniform1i(programInfo.uniformLocations.logoTexture, 0);
        
        // Set logo-related uniforms
        gl.uniform1f(programInfo.uniformLocations.logoOpacity, params.logoOpacity);
        gl.uniform1f(programInfo.uniformLocations.logoScale, params.logoScale);
        gl.uniform1f(programInfo.uniformLocations.logoAspectRatio, logoAspectRatio);
        gl.uniform1f(programInfo.uniformLocations.logoInteractStrength, params.logoInteractStrength);
        
        // Always use Normal blend mode (0)
        gl.uniform1i(programInfo.uniformLocations.logoBlendMode, 0);
    }

    // Draw the quad (TRIANGLE_STRIP needs only 4 vertices for a quad)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Draw the scene
function animate() {
    drawScene();
    animationFrameId = requestAnimationFrame(animate);
}

// Process the uploaded image
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.type.match('image.*')) return;
    
    processLogoImage(file)
        .then(processedCanvas => {
            // Create a texture from the processed canvas with transparent background
            resizeAndCreateLogoTexture(processedCanvas);
        })
        .catch(error => {
            console.error("Error processing logo:", error);
            
            // Fallback to original method if background removal fails
            const reader = new FileReader();
            reader.onload = function(e) {
                const tempImage = new Image();
                tempImage.onload = function() {
                    // Use original image without background removal
                    resizeAndCreateLogoTexture(tempImage);
                };
                tempImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

    canvas.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Function to load demo logos
function loadDemoLogo(logoName) {
    console.log("Load new demo logo: "+logoName);
    const logoPath = `assets/${logoName}.png`;
    
    // Load the selected demo logo
    const tempImage = new Image();
    tempImage.onload = function() {
        // Resize and create texture in one step
        resizeAndCreateLogoTexture(tempImage);
    };

    canvas.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    tempImage.onerror = function() {
        console.error(`Failed to load demo logo: ${logoPath}`);
    };
    
    tempImage.src = logoPath;

}

// Save function for exporting image with logo
function saveImageWithLogo() {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'animated-logo.png';
    link.click();
}

// Override the save image function
params.saveImage = function() {
    saveImageWithLogo();
};

// Cleanup on page unload
window.addEventListener('unload', () => {
    cancelAnimationFrame(animationFrameId);
    if (logoTexture) {
        gl.deleteTexture(logoTexture);
    }
});

function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
}

// Initialize the application when the page loads
window.addEventListener('load', init);
applyPreset(defaultPreset);