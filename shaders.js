// Function to fetch shader code from external files
async function fetchShader(url) {
  const response = await fetch(url);
  if (!response.ok) {
      throw new Error(`Failed to fetch shader: ${url}`);
  }
  return await response.text();
}

// Create shader program from vertex and fragment shader source
function createShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vsSource);
  gl.compileShader(vertexShader);

  // Check for shader compile errors
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
      gl.deleteShader(vertexShader);
      return null;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fsSource);
  gl.compileShader(fragmentShader);

  // Check for shader compile errors
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
      gl.deleteShader(fragmentShader);
      gl.deleteShader(vertexShader);
      return null;
  }

  // Create shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Check for linking errors
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Shader program linking error:', gl.getProgramInfoLog(shaderProgram));
      return null;
  }

  return shaderProgram;
}

// Initialize shader program asynchronously
async function initShaderProgram(gl) {
  try {
      const vsSource = await fetchShader('vertex-shader.glsl');
      const fsSource = await fetchShader('fragment-shader.glsl');
      return createShaderProgram(gl, vsSource, fsSource);
  } catch (error) {
      console.error('Error initializing shader program:', error);
      return null;
  }
}