import { AdditiveBlending, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import type { Palette } from '../core/palette';

export interface WarpTunnel {
  readonly mesh: Mesh;
  update(elapsedTime: number, intensity: number, aspectRatio: number): void;
}

const vertexShader = `
  varying vec2 vScreenPosition;
  void main() {
    vScreenPosition = position.xy;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 coolColor;
  uniform vec3 warmColor;
  uniform float time;
  uniform float intensity;
  uniform float aspectRatio;
  varying vec2 vScreenPosition;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 blend = fract(point);
    blend = blend * blend * (3.0 - 2.0 * blend);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), blend.x),
      blend.y
    );
  }

  void main() {
    vec2 point = vScreenPosition * vec2(aspectRatio, 1.0);
    float radius = length(point);
    vec2 direction = point / max(radius, 0.0001);
    float depth = 0.6 / (radius + 0.08) + time * 2.4;

    float rays = pow(noise(direction * 7.0 + 19.0), 3.0);
    float fineRays = pow(noise(direction * 23.0 + 5.0), 5.0);
    float pulses = 0.55 + 0.45 * sin(depth * 5.0 + rays * 12.0);
    float swirl = noise(direction * 3.0 + vec2(depth * 0.35, -depth * 0.2));

    float opening = smoothstep(0.12, 0.85, radius);
    float brightness = (rays * 1.6 + fineRays * 1.2) * pulses * opening;
    vec3 color = mix(coolColor, warmColor, swirl) * brightness;
    color += coolColor * smoothstep(0.9, 1.9, radius) * 0.35;

    gl_FragColor = vec4(color * intensity, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createWarpTunnel(palette: Palette): WarpTunnel {
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      coolColor: { value: palette.color('wormhole') },
      warmColor: { value: palette.color('accent') },
      time: { value: 0 },
      intensity: { value: 0 },
      aspectRatio: { value: 1 },
    },
    blending: AdditiveBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const mesh = new Mesh(new PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 100;
  mesh.visible = false;

  return {
    mesh,
    update(elapsedTime, intensity, aspectRatio) {
      mesh.visible = intensity > 0;
      material.uniforms.time.value = elapsedTime;
      material.uniforms.intensity.value = intensity;
      material.uniforms.aspectRatio.value = aspectRatio;
    },
  };
}
