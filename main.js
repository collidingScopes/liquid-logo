// Global variables for WebGL
let programInfo;
let positionBuffer;
let logoTexture = null;
let logoImage = null;
let logoAspectRatio = 1.0;
let gui; // Global reference to dat.gui instance

// Initialize the application
async function init() {
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
    
    // Initialize logo parameters
    initLogoParams();
    
    // Initialize GUI
    gui = initGui();
    
    // Setup image upload handler
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    
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

    // Set background color to solid black
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Ensure we're drawing on the full canvas by setting a black quad first
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
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // Create an image element
        logoImage = new Image();
        logoImage.onload = function() {
            // Create texture when image loads
            logoAspectRatio = logoImage.width / logoImage.height;
            createLogoTexture(logoImage);
            
            // Show success message
            const indicator = document.getElementById('play-pause-indicator');
            indicator.textContent = "Logo Uploaded!";
            indicator.classList.add('visible');
            setTimeout(() => {
                indicator.classList.remove('visible');
            }, 1500);
        };
        logoImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Function to load demo logos
function loadDemoLogo(logoName) {
    const logoPath = `assets/${logoName}.png`;
    
    // Load the selected demo logo
    const image = new Image();
    image.onload = function() {
        logoImage = image;
        logoAspectRatio = image.width / image.height;
        createLogoTexture(image);
        
        // Show success message
        const indicator = document.getElementById('play-pause-indicator');
        indicator.textContent = `Demo Logo: ${logoName}`;
        indicator.classList.add('visible');
        setTimeout(() => {
            indicator.classList.remove('visible');
        }, 1500);
    };
    
    image.onerror = function() {
        console.error(`Failed to load demo logo: ${logoPath}`);
    };
    
    image.src = logoPath;
}

// Create a WebGL texture from the logo image
function createLogoTexture(image) {
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
    
    // Upload the image into the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
    // Add logo settings to GUI if not already added
    if (!params.hasOwnProperty('logoInteractStrength') || !guiControllers.hasOwnProperty('logoInteractStrength')) {
        addLogoControlsToGUI();
    }
}

// Add logo controls to the GUI
function addLogoControlsToGUI() {
    // Add logo parameters to GUI
    const logoFolder = gui.addFolder('Logo Settings');
    guiControllers.logoScale = logoFolder.add(params, 'logoScale', 0.5, 3.0).name('Logo Scale');
    guiControllers.logoInteractStrength = logoFolder.add(params, 'logoInteractStrength', 0.0, 1.0).name('Edge Interaction');
    logoFolder.open();
}

// Initialize logo parameters
function initLogoParams() {
    params.logoOpacity = 1.0;        // Fixed at 1.0 (fully visible)
    params.logoScale = 1.5;          // Fixed at 1.5
    params.logoInteractStrength = 0.6; // How much the animation interacts with logo edges
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

// Initialize the application when the page loads
window.addEventListener('load', init);