// WebGL Fluid Simulation Engine
// Adapted from Pavel Dobryakov (https://codepen.io/PavelDoGreat/pen/zdWzEL)
// Optimized for weight, robustness, and performance in Next.js

export interface FluidParams {
  cursorSize: number;
  cursorPower: number;
  distortionPower: number;
}

export class FluidSimulation {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private programs: { [key: string]: { program: WebGLProgram; uniforms: { [key: string]: WebGLUniformLocation } } } = {};
  
  // Framebuffers
  private velocityFBO!: ReturnType<typeof this.createDoubleFBO>;
  private dyeFBO!: ReturnType<typeof this.createDoubleFBO>;
  private divergenceFBO!: ReturnType<typeof this.createFBO>;
  private pressureFBO!: ReturnType<typeof this.createDoubleFBO>;

  // Textures
  private videoTexture!: WebGLTexture;

  // State
  private width = 0;
  private height = 0;
  private simWidth = 0;
  private simHeight = 0;
  private textureType = 0;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // Try WebGL2 first, then WebGL1
    const gl = (canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false }) ||
                canvas.getContext('webgl', { alpha: false, antialias: false, depth: false })) as WebGL2RenderingContext | WebGLRenderingContext;
    
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    this.gl = gl;
    
    this.initExtensionsAndTypes();
    this.initShaders();
    this.resize();
    this.initTextures();
  }

  private initExtensionsAndTypes() {
    const gl = this.gl;
    const isWebGL2 = 'RGBA16F' in gl; // Simple check for WebGL2

    if (isWebGL2) {
      const gl2 = gl as WebGL2RenderingContext;
      gl2.getExtension('EXT_color_buffer_float');
      // In WebGL2, HALF_FLOAT is built-in
      this.textureType = gl2.HALF_FLOAT;
    } else {
      const extFloat = gl.getExtension('OES_texture_float');
      const extFloatLinear = gl.getExtension('OES_texture_float_linear');
      const extHalf = gl.getExtension('OES_texture_half_float');
      const extHalfLinear = gl.getExtension('OES_texture_half_float_linear');

      if (extFloat && extFloatLinear) {
        this.textureType = gl.FLOAT;
      } else if (extHalf && extHalfLinear) {
        this.textureType = extHalf.HALF_FLOAT_OES;
      } else {
        this.textureType = gl.UNSIGNED_BYTE;
      }
    }
  }

  private initShaders() {
    const gl = this.gl;

    const vertShaderSource = `
      precision highp float;
      attribute vec2 a_position;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 u_texel;
      void main () {
        vUv = .5 * (a_position + 1.);
        vL = vUv - vec2(u_texel.x, 0.);
        vR = vUv + vec2(u_texel.x, 0.);
        vT = vUv + vec2(0., u_texel.y);
        vB = vUv - vec2(0., u_texel.y);
        gl_Position = vec4(a_position, 0., 1.);
      }
    `;

    const shaders = {
      splat: `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D u_input_texture;
        uniform float u_ratio;
        uniform vec3 u_point_value;
        uniform vec2 u_point;
        uniform float u_point_size;
        void main () {
          vec2 p = vUv - u_point;
          p.x *= u_ratio;
          vec3 splat = .6 * pow(2., -dot(p, p) / u_point_size) * u_point_value;
          vec3 base = texture2D(u_input_texture, vUv).xyz;
          gl_FragColor = vec4(base + splat, 1.);
        }
      `,
      advection: `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform sampler2D u_velocity_texture;
        uniform sampler2D u_input_texture;
        uniform vec2 u_texel;
        uniform vec2 u_output_textel;
        uniform float u_dt;
        uniform float u_dissipation;
        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
          vec2 st = uv / tsize - 0.5;
          vec2 iuv = floor(st);
          vec2 fuv = fract(st);
          vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
          vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
          vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
          vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
          return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }
        void main () {
          vec2 coord = vUv - u_dt * bilerp(u_velocity_texture, vUv, u_texel).xy * u_texel;
          vec4 velocity = bilerp(u_input_texture, coord, u_output_textel);
          gl_FragColor = u_dissipation * velocity;
        }
      `,
      divergence: `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D u_velocity_texture;
        void main () {
          float L = texture2D(u_velocity_texture, vL).x;
          float R = texture2D(u_velocity_texture, vR).x;
          float T = texture2D(u_velocity_texture, vT).y;
          float B = texture2D(u_velocity_texture, vB).y;
          float div = .25 * (R - L + T - B);
          gl_FragColor = vec4(div, 0., 0., 1.);
        }
      `,
      pressure: `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D u_pressure_texture;
        uniform sampler2D u_divergence_texture;
        void main () {
          float L = texture2D(u_pressure_texture, vL).x;
          float R = texture2D(u_pressure_texture, vR).x;
          float T = texture2D(u_pressure_texture, vT).x;
          float B = texture2D(u_pressure_texture, vB).x;
          float divergence = texture2D(u_divergence_texture, vUv).x;
          float pressure = (L + R + B + T - divergence) * .25;
          gl_FragColor = vec4(pressure, 0., 0., 1.);
        }
      `,
      gradientSubtract: `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D u_pressure_texture;
        uniform sampler2D u_velocity_texture;
        void main () {
          float L = texture2D(u_pressure_texture, vL).x;
          float R = texture2D(u_pressure_texture, vR).x;
          float T = texture2D(u_pressure_texture, vT).x;
          float B = texture2D(u_pressure_texture, vB).x;
          vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
          velocity.xy -= vec2(R - L, T - B);
          gl_FragColor = vec4(velocity, 0., 1.);
        }
      `,
      display: `
        precision highp float;
        precision highp sampler2D;
        varying vec2 vUv;
        uniform float u_canvas_ratio;
        uniform float u_video_ratio;
        uniform float u_disturb_power;
        uniform sampler2D u_output_texture;
        uniform sampler2D u_velocity_texture;
        uniform sampler2D u_video_texture;
        uniform float u_time;
        uniform float u_zoom_out;
        uniform float u_edge_feather;

        // Cursor color reveal uniforms
        uniform vec2 u_cursor;
        uniform float u_cursor_size;
        uniform float u_cursor_speed;
        uniform float u_r1;
        uniform float u_r2;
        uniform float u_r3;
        uniform float u_r4;

        const vec3 BG_COLOR = vec3(5.0/255.0, 5.0/255.0, 5.0/255.0);

        vec2 get_distorted_uv(vec2 uv, float offset, vec2 velocity) {
          vec2 dist_uv = uv;
          if (length(velocity) > 0.0) {
            dist_uv -= u_disturb_power * normalize(velocity) * offset;
          }
          return clamp(dist_uv, 0.001, 0.999);
        }

        vec2 get_video_uv(vec2 uv) {
          vec2 video_uv = uv - 0.5;
          if (u_canvas_ratio > u_video_ratio) {
            video_uv.y = video_uv.y * u_video_ratio / u_canvas_ratio;
          } else {
            video_uv.x = video_uv.x * u_canvas_ratio / u_video_ratio;
          }
          return video_uv + 0.5;
        }

        float hash(float n) { 
          return fract(sin(n) * 43758.5453123); 
        }

        void main () {
          float offset = texture2D(u_output_texture, vUv).r;
          vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
          
          vec2 dist_uv = get_distorted_uv(vUv, offset, velocity);
          
          // Apply zoom-out: scale UV from center. u_zoom_out goes 0.3→1.0
          // At 0.3, video appears at 30% of screen; at 1.0, full screen
          vec2 zoomed_uv = (dist_uv - 0.5) / u_zoom_out + 0.5;
          vec2 video_uv = get_video_uv(zoomed_uv);

          // Edge feather: smoothly blend video into BG_COLOR near the video bounds
          vec2 edge_dist = 1.0 - abs(video_uv - 0.5) * 2.0;
          float edge_factor = smoothstep(0.0, u_edge_feather, min(edge_dist.x, edge_dist.y));

          // If completely outside bounds, clamp and use bg color
          if (edge_factor <= 0.0) {
            gl_FragColor = vec4(BG_COLOR, 1.0);
            return;
          }
          
          // Sample background video (monochrome base) with focal blur that decays as it zooms in
          vec3 mono_color = vec3(0.0);
          if (u_zoom_out < 1.0) {
            float blur_amount = (1.0 - u_zoom_out) * 0.015; // Blur decays to zero at zoom = 1.0
            mono_color += texture2D(u_video_texture, vec2(video_uv.x - blur_amount, 1.0 - video_uv.y)).rgb * 0.15;
            mono_color += texture2D(u_video_texture, vec2(video_uv.x + blur_amount, 1.0 - video_uv.y)).rgb * 0.15;
            mono_color += texture2D(u_video_texture, vec2(video_uv.x, 1.0 - (video_uv.y - blur_amount))).rgb * 0.15;
            mono_color += texture2D(u_video_texture, vec2(video_uv.x, 1.0 - (video_uv.y + blur_amount))).rgb * 0.15;
            mono_color += texture2D(u_video_texture, vec2(video_uv.x - blur_amount * 0.7, 1.0 - (video_uv.y - blur_amount * 0.7))).rgb * 0.1;
            mono_color += texture2D(u_video_texture, vec2(video_uv.x + blur_amount * 0.7, 1.0 - (video_uv.y - blur_amount * 0.7))).rgb * 0.1;
            mono_color += texture2D(u_video_texture, vec2(video_uv.x - blur_amount * 0.7, 1.0 - (video_uv.y + blur_amount * 0.7))).rgb * 0.1;
            mono_color += texture2D(u_video_texture, vec2(video_uv.x + blur_amount * 0.7, 1.0 - (video_uv.y + blur_amount * 0.7))).rgb * 0.1;
            mono_color += texture2D(u_video_texture, vec2(video_uv.x, 1.0 - video_uv.y)).rgb * 0.1;
          } else {
            mono_color = texture2D(u_video_texture, vec2(video_uv.x, 1.0 - video_uv.y)).rgb;
          }
          vec3 mono_video = vec3(dot(mono_color, vec3(0.299, 0.587, 0.114))) * 0.65;
          
          // Reveal mask logic — uses screen-space dist_uv, not zoomed_uv
          vec2 to_cursor = dist_uv - u_cursor;
          to_cursor.x *= u_canvas_ratio;
          
          // Make the base shape slightly taller (faceshape / oval)
          to_cursor.y *= 0.8;
          
          float dist = length(to_cursor);
          float angle = atan(to_cursor.y, to_cursor.x);
          if (angle < 0.0) angle += 6.28318530718;
          
          float q = angle / 1.57079632679; // Quadrant [0, 4)
          
          // Organic, wobbling face-like shape
          float shape_warp = sin(angle * 2.0 + u_time * 2.0) * 0.18 + 
                             cos(angle * 3.0 - u_time * 1.5) * 0.12 +
                             sin(angle * 5.0 + u_time * 1.8) * 0.09 +
                             cos(angle * 7.0 + u_time * 0.7) * 0.06;
                             
          float blob_r = u_cursor_size * 4.0 * (1.0 + shape_warp);
          
          if (q < 1.0) {
            blob_r *= mix(u_r3, u_r2, fract(q));
          } else if (q < 2.0) {
            blob_r *= mix(u_r2, u_r1, fract(q));
          } else if (q < 3.0) {
            blob_r *= mix(u_r1, u_r4, fract(q));
          } else {
            blob_r *= mix(u_r4, u_r3, fract(q));
          }
          blob_r = blob_r * 0.01;
          
          // Relative softness (feathering) based on percentage of blob radius for a perfect seamless blend
          float reveal = smoothstep(blob_r, blob_r * 0.1, dist);
          // Gate reveal by cursor movement speed
          reveal *= u_cursor_speed;
          
          vec3 color_video = mono_video;
          if (reveal > 0.0) {
              // Enhanced and faster Glitch Effect
              float cycle = mod(u_time, 5.0); // Glitch cycle every 5 seconds
              
              if (cycle < 0.8) { // Glitch lasts for 0.8 seconds
                  float t = floor(u_time * 15.0); // Faster updates (was 8)
                  float block = floor(video_uv.y * 20.0); // Medium bands
                  float rand_val = hash(block + t);

                  vec2 g_uv = video_uv;
                  float r_shift = 0.0;
                  float b_shift = 0.0;

                  // Apply block tearing
                  if (rand_val > 0.6) { // More frequent tearing
                      float shift = (hash(block + 1.0) - 0.5) * 0.08 * reveal;
                      g_uv.x += shift;
                  }

                  // Apply RGB split
                  if (hash(t * 0.5) > 0.4) { // More frequent RGB split
                      r_shift = 0.025 * reveal * (hash(t) - 0.5);
                      b_shift = -0.025 * reveal * (hash(t + 1.0) - 0.5);
                  }

                  float r = texture2D(u_video_texture, vec2(clamp(g_uv.x + r_shift, 0.0, 1.0), 1.0 - g_uv.y)).r;
                  float g = texture2D(u_video_texture, vec2(clamp(g_uv.x, 0.0, 1.0), 1.0 - g_uv.y)).g;
                  float b = texture2D(u_video_texture, vec2(clamp(g_uv.x + b_shift, 0.0, 1.0), 1.0 - g_uv.y)).b;
                  color_video = vec3(r, g, b);
              } else {
                  color_video = texture2D(u_video_texture, vec2(video_uv.x, 1.0 - video_uv.y)).rgb;
              }
          }
          
          vec3 base_bg = mix(mono_video, color_video, reveal);
          base_bg = mix(BG_COLOR, base_bg, edge_factor);
          gl_FragColor = vec4(base_bg, 1.0);
        }
      `
    };

    const vertexShader = this.compileShader(vertShaderSource, gl.VERTEX_SHADER);

    for (const [name, fragSource] of Object.entries(shaders)) {
      const fragShader = this.compileShader(fragSource, gl.FRAGMENT_SHADER);
      const program = gl.createProgram()!;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(`Link failed: ${name}`, gl.getProgramInfoLog(program));
        continue;
      }

      // Collect uniforms
      const uniforms: { [key: string]: WebGLUniformLocation } = {};
      const activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < activeUniforms; i++) {
        const u = gl.getActiveUniform(program, i)!;
        uniforms[u.name] = gl.getUniformLocation(program, u.name)!;
      }

      this.programs[name] = { program, uniforms };
    }
  }

  private compileShader(source: string, type: number): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`Shader compile error: ${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
  }

  public resize() {
    const gl = this.gl;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    
    if (this.width === w && this.height === h) return;
    
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;

    const ratio = w / h;
    this.simWidth = Math.round(256 * ratio);
    this.simHeight = 256;

    // Re-initialize FBOs with correct aspect ratios
    this.velocityFBO = this.createDoubleFBO(this.simWidth, this.simHeight);
    this.dyeFBO = this.createDoubleFBO(this.simWidth, this.simHeight);
    this.divergenceFBO = this.createFBO(this.simWidth, this.simHeight);
    this.pressureFBO = this.createDoubleFBO(this.simWidth, this.simHeight);
  }

  private initTextures() {
    const gl = this.gl;
    
    // Video texture
    this.videoTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  private createFBO(w: number, h: number) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const internalFormat = 'RGBA16F' in gl ? (gl as any).RGBA16F : gl.RGBA;
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, gl.RGBA, this.textureType, null);

    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
      fbo,
      width: w,
      height: h,
      attach(id: number) {
        gl.activeTexture(gl.TEXTURE0 + id);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return id;
      }
    };
  }

  private createDoubleFBO(w: number, h: number) {
    let fbo1 = this.createFBO(w, h);
    let fbo2 = this.createFBO(w, h);
    return {
      width: w,
      height: h,
      texelSizeX: 1 / w,
      texelSizeY: 1 / h,
      read: () => fbo1,
      write: () => fbo2,
      swap() {
        const temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      }
    };
  }

  private blit(target: any) {
    const gl = this.gl;
    
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    if (!target) {
      gl.viewport(0, 0, this.width, this.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    }
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.deleteBuffer(buffer);
  }

  public splat(x: number, y: number, dx: number, dy: number, params: FluidParams) {
    const gl = this.gl;
    const splat = this.programs.splat;
    if (!splat) return;

    gl.useProgram(splat.program);
    gl.uniform1i(splat.uniforms.u_input_texture, this.velocityFBO.read().attach(1));
    gl.uniform1f(splat.uniforms.u_ratio, this.width / this.height);
    gl.uniform2f(splat.uniforms.u_point, x, y);
    gl.uniform3f(splat.uniforms.u_point_value, dx * 6.0, dy * 6.0, 0);
    gl.uniform1f(splat.uniforms.u_point_size, params.cursorSize * 0.0003);

    this.blit(this.velocityFBO.write());
    this.velocityFBO.swap();

    gl.uniform1i(splat.uniforms.u_input_texture, this.dyeFBO.read().attach(1));
    gl.uniform3f(splat.uniforms.u_point_value, params.cursorPower * 0.005, params.cursorPower * 0.005, params.cursorPower * 0.005);
    this.blit(this.dyeFBO.write());
    this.dyeFBO.swap();
  }

  public step(dt: number, params: FluidParams, videoElement: HTMLVideoElement, cursor: { x: number; y: number; r1: number; r2: number; r3: number; r4: number; size: number; speed: number }) {
    const gl = this.gl;
    
    // 1. Upload video frame
    if (videoElement.readyState >= 2) {
      gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElement);
    }

    // 2. Divergence pass
    const div = this.programs.divergence;
    if (div) {
      gl.useProgram(div.program);
      gl.uniform2f(div.uniforms.u_texel, this.velocityFBO.texelSizeX, this.velocityFBO.texelSizeY);
      gl.uniform1i(div.uniforms.u_velocity_texture, this.velocityFBO.read().attach(1));
      this.blit(this.divergenceFBO);
    }

    // 3. Pressure pass (Jacobi iteration)
    const press = this.programs.pressure;
    if (press) {
      gl.useProgram(press.program);
      gl.uniform2f(press.uniforms.u_texel, this.velocityFBO.texelSizeX, this.velocityFBO.texelSizeY);
      gl.uniform1i(press.uniforms.u_divergence_texture, this.divergenceFBO.attach(1));
      for (let i = 0; i < 12; i++) { // Optimized iterations
        gl.uniform1i(press.uniforms.u_pressure_texture, this.pressureFBO.read().attach(2));
        this.blit(this.pressureFBO.write());
        this.pressureFBO.swap();
      }
    }

    // 4. Gradient Subtract pass
    const gradSub = this.programs.gradientSubtract;
    if (gradSub) {
      gl.useProgram(gradSub.program);
      gl.uniform2f(gradSub.uniforms.u_texel, this.velocityFBO.texelSizeX, this.velocityFBO.texelSizeY);
      gl.uniform1i(gradSub.uniforms.u_pressure_texture, this.pressureFBO.read().attach(1));
      gl.uniform1i(gradSub.uniforms.u_velocity_texture, this.velocityFBO.read().attach(2));
      this.blit(this.velocityFBO.write());
      this.velocityFBO.swap();
    }

    // 5. Advect velocity
    const advect = this.programs.advection;
    if (advect) {
      gl.useProgram(advect.program);
      gl.uniform2f(advect.uniforms.u_texel, this.velocityFBO.texelSizeX, this.velocityFBO.texelSizeY);
      gl.uniform2f(advect.uniforms.u_output_textel, this.velocityFBO.texelSizeX, this.velocityFBO.texelSizeY);
      gl.uniform1i(advect.uniforms.u_velocity_texture, this.velocityFBO.read().attach(1));
      gl.uniform1i(advect.uniforms.u_input_texture, this.velocityFBO.read().attach(1));
      gl.uniform1f(advect.uniforms.u_dt, dt);
      gl.uniform1f(advect.uniforms.u_dissipation, 0.98);
      this.blit(this.velocityFBO.write());
      this.velocityFBO.swap();

      // Advect dye (output density)
      gl.uniform2f(advect.uniforms.u_output_textel, this.dyeFBO.texelSizeX, this.dyeFBO.texelSizeY);
      gl.uniform1i(advect.uniforms.u_input_texture, this.dyeFBO.read().attach(2));
      gl.uniform1f(advect.uniforms.u_dt, dt * 6.0);
      gl.uniform1f(advect.uniforms.u_dissipation, 0.975);
      this.blit(this.dyeFBO.write());
      this.dyeFBO.swap();
    }

    // 6. Final display pass
    const disp = this.programs.display;
    if (disp) {
      gl.useProgram(disp.program);
      gl.uniform1f(disp.uniforms.u_canvas_ratio, this.width / this.height);
      
      const vidRatio = videoElement.videoWidth && videoElement.videoHeight
        ? videoElement.videoWidth / videoElement.videoHeight
        : this.width / this.height;
      gl.uniform1f(disp.uniforms.u_video_ratio, vidRatio);
      gl.uniform1f(disp.uniforms.u_disturb_power, params.distortionPower * 0.08);
      gl.uniform1f(disp.uniforms.u_zoom_out, (cursor as any).zoomOut ?? 1.0);
      gl.uniform1f(disp.uniforms.u_edge_feather, (cursor as any).edgeFeather ?? 0.08);

      gl.uniform1i(disp.uniforms.u_output_texture, this.dyeFBO.read().attach(1));
      gl.uniform1i(disp.uniforms.u_velocity_texture, this.velocityFBO.read().attach(2));
      gl.uniform1i(disp.uniforms.u_video_texture, 3); // bind unit 3
      gl.activeTexture(gl.TEXTURE0 + 3);
      gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);

      // Cursor uniforms (normalized coord space, y flipped for WebGL)
      gl.uniform2f(disp.uniforms.u_cursor, cursor.x / this.width, 1.0 - (cursor.y / this.height));
      gl.uniform1f(disp.uniforms.u_cursor_size, cursor.size / this.width);
      gl.uniform1f(disp.uniforms.u_cursor_speed, cursor.speed);
      gl.uniform1f(disp.uniforms.u_r1, cursor.r1);
      gl.uniform1f(disp.uniforms.u_r2, cursor.r2);
      gl.uniform1f(disp.uniforms.u_r3, cursor.r3);
      gl.uniform1f(disp.uniforms.u_r4, cursor.r4);
      gl.uniform1f(disp.uniforms.u_time, performance.now() / 1000.0);

      this.blit(null);
    }
  }
}
