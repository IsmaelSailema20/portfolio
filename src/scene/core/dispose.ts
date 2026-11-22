import type { BufferGeometry, Material, Object3D, Texture } from 'three';

interface Disposable {
  geometry?: BufferGeometry;
  material?: Material | Material[];
}

function disposeMaterial(material: Material): void {
  const texture = (material as Material & { map?: Texture | null }).map;
  texture?.dispose();
  material.dispose();
}

export function disposeObject(root: Object3D): void {
  root.traverse((object) => {
    const disposable = object as Object3D & Disposable;
    disposable.geometry?.dispose();
    if (Array.isArray(disposable.material)) {
      disposable.material.forEach(disposeMaterial);
    } else if (disposable.material) {
      disposeMaterial(disposable.material);
    }
  });
}
