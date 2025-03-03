precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

// UI Parameters
uniform float u_speed;
uniform float u_iterations;
uniform float u_scale;
uniform float u_dotFactor;
uniform float u_vOffset;
uniform float u_intensityFactor;
uniform float u_expFactor;
uniform vec3 u_colorFactors;
uniform float u_colorShift;
uniform float u_dotMultiplier;

// Logo Parameters
uniform sampler2D u_logoTexture;
uniform float u_logoOpacity;
uniform float u_logoScale;
uniform float u_logoAspectRatio;
uniform float u_logoInteractStrength;
uniform int u_logoBlendMode;  // 0=Normal, 1=Multiply, 2=Screen, 3=Overlay

// Pseudo-random function for noise generation
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Edge detection for logo interaction
float detectEdges(vec2 uv, float threshold) {
    float dx = 1.0 / u_resolution.x;
    float dy = 1.0 / u_resolution.y;
    
    vec4 center = texture2D(u_logoTexture, uv);
    vec4 left = texture2D(u_logoTexture, uv - vec2(dx, 0.0));
    vec4 right = texture2D(u_logoTexture, uv + vec2(dx, 0.0));
    vec4 top = texture2D(u_logoTexture, uv - vec2(0.0, dy));
    vec4 bottom = texture2D(u_logoTexture, uv + vec2(0.0, dy));
    
    // Calculate difference between neighboring pixels
    float diff = length(center - left) + length(center - right) + 
                length(center - top) + length(center - bottom);
    
    // Return edge intensity
    return smoothstep(0.0, threshold, diff);
}

// Liquid metal effect enhancement
vec4 liquidMetalEffect(vec4 color, float edge, float time) {
    // Create a metallic highlight that moves with time
    float highlight = pow(0.5 + 0.5 * sin(time * 0.5 + edge * 6.0), 8.0) * edge;
    
    // Apply a slight chromatic shift for more realistic metal
    vec4 metallic = vec4(
        color.r + highlight * 0.4,
        color.g + highlight * 0.3,
        color.b + highlight * 0.5,
        color.a
    );
    
    // Add a subtle ripple effect
    float ripple = sin(edge * 15.0 + time) * 0.05;
    metallic.rgb += ripple;
    
    return clamp(metallic, 0.0, 1.0);
}

// Various blend modes for combining logo with animation
vec4 applyBlendMode(vec4 base, vec4 blend, int mode, float opacity) {
    vec4 result;
    
    if (mode == 1) {
        // Multiply
        result = base * blend;
    } else if (mode == 2) {
        // Screen
        result = 1.0 - (1.0 - base) * (1.0 - blend);
    } else if (mode == 3) {
        // Overlay
        vec4 check = step(0.5, base);
        result = mix(2.0 * base * blend, 1.0 - 2.0 * (1.0 - base) * (1.0 - blend), check);
    } else {
        // Normal
        result = blend;
    }
    
    // Apply opacity
    return mix(base, result, opacity);
}

void main() {
    vec2 r = u_resolution;
    vec2 FC = gl_FragCoord.xy;
    float time = u_time * u_speed;
    
    // Calculate UV coordinates for logo texture
    vec2 uv = FC.xy / r;

    // Center logo based on scale factor
    vec2 logoUV = (uv - 0.5) / u_logoScale + 0.5;

    // Fix vertical flip for texture
    logoUV.y = 1.0 - logoUV.y;

    // NO aspect ratio adjustment here - we're letting the canvas/texture 
    // dimensions handle the aspect ratio correctly.
    // By removing the aspect ratio correction, we prevent double-correction.

    // Sample logo texture
    vec4 logoColor = texture2D(u_logoTexture, logoUV);
    float logoAlpha = logoColor.a;
    
    // Check if we're inside the logo shape
    bool insideLogo = logoAlpha > 0.1;
    
    // If not inside logo, set pixel to transparent black (no animation outside logo)
    if (!insideLogo && logoUV.x >= 0.0 && logoUV.x <= 1.0 && logoUV.y >= 0.0 && logoUV.y <= 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }
    
    // Edge detection for interaction
    float edge = detectEdges(logoUV, 0.2) * u_logoInteractStrength;
    
    // Original pattern calculation
    vec2 p = (FC.xy*2.0-r)/r.y;
    vec2 l = vec2(0.0);
    float dotP = dot(p, p);
    l.x += abs(u_dotFactor-dotP) * u_dotMultiplier;
    
    // Modify pattern based on logo edges
    float edgeInfluence = edge * 5.0;
    vec2 v = p*(1.0-l.x)/u_scale;
    
    // Apply edge interaction to vector field
    v += vec2(sin(edge * 10.0), cos(edge * 8.0)) * edgeInfluence;
    
    // Original animation logic
    vec4 o = vec4(0.0);
    for(float i = 0.0; i < 16.0; i++) {
        if (i >= u_iterations) break;
        float idx = i + 1.0;
        
        // Make animation flow around logo edges
        vec2 offset = cos(v.yx*idx+vec2(0.0,idx)+time)/idx+u_vOffset;
        if (logoAlpha > 0.1 && edge > 0.1) {
            // Deflect flow around logo edges
            offset *= 1.0 + edge * 2.0;
        }
        
        v += offset;
        o += (sin(vec4(v.x,v.y,v.y,v.x))+1.0)*abs(v.x-v.y)*u_intensityFactor;
    }
    
    // Apply color shift if requested
    if (u_colorShift > 0.0) {
        o = o.wxyz * u_colorShift + o * (1.0 - u_colorShift);
    }
    
    // Apply tanh function (implemented manually)
    vec4 expPy = exp(p.y*vec4(u_colorFactors.x, u_colorFactors.y, u_colorFactors.z, 0.0));
    float expLx = exp(-u_expFactor*l.x);
    vec4 ratio = expPy*expLx/o;
    
    vec4 exp2x = exp(2.0 * ratio);
    o = (exp2x - 1.0) / (exp2x + 1.0);
    
    // Add film grain
    vec2 noiseCoord = FC / 1.5;
    float noise = random(noiseCoord + time * 0.001) * 0.12 - 0.075;
    o = o + vec4(noise);
    
    // Apply liquid metal effect
    o = liquidMetalEffect(o, edge, time);
    
    // Clamp values to avoid artifacts
    o = clamp(o, 0.0, 1.0);
    
    // Final output
    if (logoUV.x >= 0.0 && logoUV.x <= 1.0 && logoUV.y >= 0.0 && logoUV.y <= 1.0) {
        if (insideLogo) {
            // Inside logo shape - keep animation 
            // Blend the logo with animation for liquid metal look
            vec4 finalColor = mix(o, vec4(o.rgb * 0.8 + 0.2, logoAlpha), 0.3);
            
            // Apply metallic highlights along edges
            float highlight = pow(edge * 1.2, 2.0) * (0.5 + 0.5 * sin(time * 2.0));
            finalColor.rgb += highlight * vec3(0.6, 0.6, 0.8);
            
            gl_FragColor = finalColor;
        } else {
            // Outside logo shape - transparent
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
    } else {
        // Completely outside logo bounds
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}