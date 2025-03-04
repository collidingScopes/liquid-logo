/**
 * Removes solid black or white backgrounds from an uploaded image
 * @param {HTMLImageElement} image - The original image element
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Color threshold (0-255) for determining background (default: 20)
 * @param {number} options.transparencyThreshold - Alpha threshold for transparency (default: 80)
 * @param {boolean} options.detectCorners - Whether to use corners for background detection (default: true)
 * @param {boolean} options.floodFill - Whether to use flood fill algorithm (default: true)
 * @returns {Promise<HTMLCanvasElement>} Canvas element with transparent background
 */
function removeBackground(image, options = {}) {
  return new Promise((resolve) => {
    // Set default options
    const threshold = options.threshold || 20;
    const transparencyThreshold = options.transparencyThreshold || 80;
    const detectCorners = options.detectCorners !== false;
    const floodFill = options.floodFill !== false;
    
    // Create canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match image
    canvas.width = image.width;
    canvas.height = image.height;
    
    // Draw image on canvas
    ctx.drawImage(image, 0, 0);
    
    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Detect background color from corners
    let bgColor = null;
    
    if (detectCorners) {
      // Sample colors from the four corners
      const corners = [
        getPixelColor(data, 0, 0, canvas.width),
        getPixelColor(data, canvas.width - 1, 0, canvas.width),
        getPixelColor(data, 0, canvas.height - 1, canvas.width),
        getPixelColor(data, canvas.width - 1, canvas.height - 1, canvas.width)
      ];
      
      // Check if corners have similar colors (likely a solid background)
      const avgColor = averageColor(corners);
      const cornerVariance = corners.reduce((sum, color) => 
        sum + colorDistance(color, avgColor), 0) / corners.length;
      
      // If corner variance is low, use average color as background
      if (cornerVariance < threshold * 3) {
        bgColor = avgColor;
        
        // Determine if background is closer to black or white
        const luminance = (bgColor.r * 0.299 + bgColor.g * 0.587 + bgColor.b * 0.114);
        const isWhite = luminance > 200;
        const isBlack = luminance < 30;
        
        // Only proceed if background is clearly black or white
        if (isBlack || isWhite) {
          console.log(`Detected ${isWhite ? 'white' : 'black'} background (luminance: ${luminance})`);
          
          if (floodFill) {
            // Use flood fill for more accurate background removal
            makeTransparentByFloodFill(data, canvas.width, canvas.height, bgColor, threshold);
          } else {
            // Simple replacement based on color similarity
            makeTransparentByColor(data, bgColor, threshold);
          }
        } else {
          console.log("Background not clearly black or white, skipping removal");
        }
      } else {
        console.log("Background not uniform in corners, skipping removal");
      }
    }
    
    // Update canvas with processed data
    ctx.putImageData(imageData, 0, 0);
    
    // Return the canvas with transparent background
    resolve(canvas);
  });
}

/**
 * Gets the color of a pixel at specified coordinates
 */
function getPixelColor(data, x, y, width) {
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
    a: data[idx + 3]
  };
}

/**
 * Calculates the average color from an array of colors
 */
function averageColor(colors) {
  const sum = colors.reduce((acc, color) => {
    return {
      r: acc.r + color.r,
      g: acc.g + color.g,
      b: acc.b + color.b,
      a: acc.a + color.a
    };
  }, { r: 0, g: 0, b: 0, a: 0 });
  
  return {
    r: Math.round(sum.r / colors.length),
    g: Math.round(sum.g / colors.length),
    b: Math.round(sum.b / colors.length),
    a: Math.round(sum.a / colors.length)
  };
}

/**
 * Calculates the distance between two colors
 */
function colorDistance(color1, color2) {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
}

/**
 * Makes pixels transparent based on similarity to background color
 */
function makeTransparentByColor(data, bgColor, threshold) {
  for (let i = 0; i < data.length; i += 4) {
    const pixelColor = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2]
    };
    
    // If pixel color is close to background color, make it transparent
    if (colorDistance(pixelColor, bgColor) < threshold) {
      data[i + 3] = 0; // Set alpha to 0 (transparent)
    }
  }
}

/**
 * Makes background transparent using flood fill algorithm
 * More effective for complex backgrounds
 */
function makeTransparentByFloodFill(data, width, height, bgColor, threshold) {
  // Create a visited map to track processed pixels
  const visited = new Array(width * height).fill(false);
  
  // Define directions for flood fill (4-way connectivity)
  const dx = [0, 1, 0, -1];
  const dy = [-1, 0, 1, 0];
  
  // Start flood fill from each corner
  const startPoints = [
    {x: 0, y: 0},
    {x: width - 1, y: 0},
    {x: 0, y: height - 1},
    {x: width - 1, y: height - 1}
  ];
  
  // Process each start point
  for (const point of startPoints) {
    // Skip if already visited
    if (visited[point.y * width + point.x]) continue;
    
    // Get color of start point
    const startColor = getPixelColor(data, point.x, point.y, width);
    
    // Skip if start color is not similar to background color
    if (colorDistance(startColor, bgColor) > threshold) continue;
    
    // Perform flood fill using queue
    const queue = [point];
    visited[point.y * width + point.x] = true;
    
    while (queue.length > 0) {
      const {x, y} = queue.shift();
      const idx = (y * width + x) * 4;
      
      // Make current pixel transparent
      data[idx + 3] = 0;
      
      // Check adjacent pixels
      for (let i = 0; i < 4; i++) {
        const nx = x + dx[i];
        const ny = y + dy[i];
        
        // Skip if out of bounds
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        
        // Skip if already visited
        if (visited[ny * width + nx]) continue;
        
        // Get color of adjacent pixel
        const nextColor = getPixelColor(data, nx, ny, width);
        
        // If color is similar to start color, add to queue
        if (colorDistance(nextColor, startColor) < threshold) {
          queue.push({x: nx, y: ny});
          visited[ny * width + nx] = true;
        }
      }
    }
  }
}

/**
 * Integrates background removal with image upload processing
 * @param {File} file - The uploaded image file
 * @returns {Promise<HTMLCanvasElement>} Processed canvas with transparent background
 */
async function processLogoImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const tempImage = new Image();
      
      tempImage.onload = async function() {
        try {
          // Remove background from image
          const processedCanvas = await removeBackground(tempImage, {
            threshold: 30,
            floodFill: true
          });
          
          resolve(processedCanvas);
        } catch (error) {
          console.error("Error processing image:", error);
          reject(error);
        }
      };
      
      tempImage.onerror = function() {
        reject(new Error("Failed to load image"));
      };
      
      tempImage.src = e.target.result;
    };
    
    reader.onerror = function() {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsDataURL(file);
  });
}