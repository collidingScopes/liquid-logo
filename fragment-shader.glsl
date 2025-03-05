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
uniform float u_noiseIntensity;

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

// 3D Simplex noise functions
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    //   x0 = x0 - 0.0 + 0.0 * C.xxx;
    //   x1 = x0 - i1  + 1.0 * C.xxx;
    //   x2 = x0 - i2  + 2.0 * C.xxx;
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

    // Permutations
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
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
    float highlight = pow(0.5 + 0.5 * sin(time * 0.0 + edge * 6.0), 8.0) * edge;
    
    // Apply a slight chromatic shift for more realistic metal
    vec4 metallic = vec4(
        color.r + highlight * 0.4,
        color.g + highlight * 0.3,
        color.b + highlight * 0.5,
        color.a
    );
    
    // Add a subtle ripple effect
    float ripple = sin(edge * 15.0 + time) * 0.00;
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

// Apply 3D simplex noise distortion to UV coordinates
vec2 applyNoiseDistortion(vec2 uv, float time, float strength) {
    // Sample noise at different frequencies and amplitudes
    float noise1 = snoise(vec3(uv * 3.0, time * 0.1)) * 0.01 * strength;
    float noise2 = snoise(vec3(uv * 7.0, time * 0.2 + 100.0)) * 0.005 * strength;
    
    // Combine noise samples
    vec2 offset = vec2(
        noise1 + noise2 * 0.5,
        noise1 * 0.8 + noise2
    );
    
    return uv + offset;
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

    // Sample logo texture with original coordinates to keep edges sharp
    vec4 logoColor = texture2D(u_logoTexture, logoUV);
    float logoAlpha = logoColor.a;
    
    // Check if we're inside the logo shape
    bool insideLogo = logoAlpha > 0.1;
    
    // If not inside logo, set pixel to transparent black (no animation outside logo)
    if (!insideLogo && logoUV.x >= 0.0 && logoUV.x <= 1.0 && logoUV.y >= 0.0 && logoUV.y <= 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }
    
    // Edge detection for interaction - use original coordinates to keep edges sharp
    float edge = detectEdges(logoUV, 0.2) * u_logoInteractStrength;
    
    // Original pattern calculation
    vec2 p = (FC.xy*2.0-r)/r.y;
    vec2 l = vec2(0.0);
    float dotP = dot(p, p);
    l.x += abs(u_dotFactor-dotP) * u_dotMultiplier;
    
    // Modify pattern based on logo edges
    float edgeInfluence = edge * 20.0;
    vec2 v = p*(1.0-l.x)/u_scale;
    
    // Apply edge interaction to vector field
    v += vec2(sin(edge * 10.0), cos(edge * 8.0)) * edgeInfluence;
    
    // Add more pronounced noise-based movement to the vector field inside the logo
    // This noise will affect the shader pattern inside the logo without distorting the edges
    float noiseIntensity = insideLogo ? u_noiseIntensity : 0.1; // Stronger effect inside the logo
    float flowNoise = snoise(vec3(p * 2.0, time * 0.15)) * noiseIntensity;
    v += vec2(flowNoise, flowNoise * 0.7);
    
    // Original animation logic
    vec4 o = vec4(0.0);
    for(float i = 0.0; i < 16.0; i++) {
        if (i >= u_iterations) break;
        float idx = i + 1.0;
        
        // Make animation flow around logo edges
        vec2 offset = cos(v.yx*idx+vec2(0.0,idx)+time)/idx+u_vOffset;
        if (logoAlpha > 0.1 && edge > 0.1) {
            // Deflect flow around logo edges
            offset *= 1.0 + edge * 4.0;
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
    float noise = random(noiseCoord + time * 0.0004) * 0.12 - 0.075;
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
            float highlight = pow(edge * 1.2, 4.0);
            finalColor.rgb += highlight * vec3(0.6, 0.7, 0.8);
            
            gl_FragColor = finalColor;
        } else {
            // Outside logo shape - transparent
            //gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            discard;
        }
    } else {
        // Completely outside logo bounds
        //gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        discard;
    }
}