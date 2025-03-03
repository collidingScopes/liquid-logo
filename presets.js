const presets = {
    'Liquid': {
        speed: 2.2,
        iterations: 13,
        scale: 0.05,
        dotFactor: 0.1,
        vOffset: 6.4,
        intensityFactor: 0.23,
        expFactor: 0.6,
        redFactor: 0,
        greenFactor: 0,
        blueFactor: 0,
        colorShift: 1.0,
        // Logo settings
        logoInteractStrength: 0.5,
    },
    'Logo Glow': {
        speed: 1.2,
        iterations: 10,
        scale: 0.15,
        dotFactor: 0.3,
        vOffset: 3.2,
        intensityFactor: 0.18,
        expFactor: 0.8,
        redFactor: 0.8,
        greenFactor: 0.6,
        blueFactor: 1.2,
        colorShift: 0.5,
        // Logo settings
        logoInteractStrength: 0.7,
    },
    'Logo Emboss': {
        speed: 0.9,
        iterations: 8,
        scale: 0.22,
        dotFactor: 0.5,
        vOffset: 1.8,
        intensityFactor: 0.2,
        expFactor: 3.0,
        redFactor: 0.2,
        greenFactor: 0.4,
        blueFactor: 0.8,
        colorShift: 0.3,
        // Logo settings
        logoInteractStrength: 0.9,
    },
    'Horizon': {
        speed: 0.7,
        iterations: 8,
        scale: 0.455,
        dotFactor: 0.54,
        vOffset: 1.5,
        intensityFactor: 0.21,
        expFactor: 6.2,
        redFactor: 0.5,
        greenFactor: 1.2,
        blueFactor: 1.9,
        colorShift: 0.8,
        // Logo settings
        logoInteractStrength: 0.4,
    },
    'Solar Flare': {
        speed: 2.2,
        iterations: 7,
        scale: 0.11,
        dotFactor: 0.32,
        vOffset: 10.0,
        intensityFactor: 0.12,
        expFactor: 12.0,
        redFactor: 1.8,
        greenFactor: 0.4,
        blueFactor: -0.4,
        colorShift: 0.0,
        // Logo settings
        logoInteractStrength: 0.6,
    },
    'Deep Ocean': {
        speed: 0.6,
        iterations: 12,
        scale: 0.25,
        dotFactor: 0.8,
        vOffset: 0.6,
        intensityFactor: 0.15,
        expFactor: 4.5,
        redFactor: -1.2,
        greenFactor: -0.2,
        blueFactor: 1.5,
        colorShift: 0.3,
        // Logo settings
        logoInteractStrength: 0.5,
    },
    'The Matrix': {
        speed: 1.2,
        iterations: 8,
        scale: 0.18,
        dotFactor: 0.75,
        vOffset: 0.9,
        intensityFactor: 0.22,
        expFactor: 2.0,
        redFactor: -1.5,
        greenFactor: 1.8,
        blueFactor: -1.5,
        colorShift: 0.1,
        // Logo settings
        logoInteractStrength: 0.8,
    },
    'Knot': {
        speed: 2.3,
        iterations: 4,
        scale: 0.04,
        dotFactor: 0.31,
        vOffset: 1.14,
        intensityFactor: 0.08,
        expFactor: 3.7,
        redFactor: 0.3,
        greenFactor: 0.0,
        blueFactor: 0.1,
        colorShift: 0,
        // Logo settings
        logoInteractStrength: 0.4,
    }
};

// Create a default logo for users who haven't uploaded one
function createDefaultLogo() {
    // Create a canvas to generate the default logo
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 512;
    logoCanvas.height = 512;
    
    const ctx = logoCanvas.getContext('2d');
    
    // Fill with transparent background
    ctx.clearRect(0, 0, logoCanvas.width, logoCanvas.height);
    
    // Draw a simple placeholder logo
    const centerX = logoCanvas.width / 2;
    const centerY = logoCanvas.height / 2;
    const radius = 120;
    
    // Outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
    
    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.7, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
    ctx.fill();
    
    // Text
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOUR', centerX, centerY - 20);
    ctx.fillText('LOGO', centerX, centerY + 20);
    
    // Convert canvas to image
    const image = new Image();
    image.onload = function() {
        logoImage = image;
        logoAspectRatio = 1.0; // Default logo is square
        createLogoTexture(image);
    };
    
    image.src = logoCanvas.toDataURL('image/png');
}

// Call this function after initializing WebGL
function initDefaultLogo() {
    // Wait until the page is fully loaded before creating default logo
    window.setTimeout(createDefaultLogo, 500);
}