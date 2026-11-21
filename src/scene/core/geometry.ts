import type { BufferGeometry } from 'three';

export function roughenGeometry(geometry: BufferGeometry, amount: number, seed = 0): BufferGeometry {
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const noise = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    const displacement = 1 + (noise - Math.floor(noise) - 0.5) * 2 * amount;
    positions.setXYZ(index, x * displacement, y * displacement, z * displacement);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}
