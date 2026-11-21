import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Palette } from '../core/palette';

type GeographicPoint = [longitude: number, latitude: number];

const southAmerica: GeographicPoint[] = [
  [-77.5, 8.5], [-72, 12], [-64, 10.5], [-60, 8.5], [-52, 4.5], [-50, 0], [-44, -2.5],
  [-37, -4.5], [-35, -8], [-39, -15], [-41, -22], [-48, -26], [-53.5, -34], [-58, -38.5],
  [-62.5, -41], [-65.5, -45.5], [-68.5, -52.5], [-71, -54], [-74.5, -50], [-73, -41],
  [-73.5, -37], [-71.5, -30], [-70.2, -18.5], [-76, -14], [-81, -6], [-80.5, -2.2],
  [-80, 0.8], [-78.5, 2.5], [-77.3, 7],
];

const centralAmerica: GeographicPoint[] = [
  [-77.5, 8.5], [-80, 9], [-83, 10], [-83.5, 12.5], [-83.3, 15], [-88, 16], [-87, 21.5],
  [-90.5, 21], [-91, 18.5], [-94.5, 18.3], [-97.5, 22], [-97.3, 26], [-105, 30],
  [-114, 32.5], [-117, 32.5], [-110, 23], [-105.5, 20], [-97, 15.8], [-92, 14.5],
  [-87.5, 13], [-85.7, 10.5], [-83, 8.2], [-80, 7.3], [-78, 7.5],
];

const northAmerica: GeographicPoint[] = [
  [-97.3, 26], [-90, 29.5], [-84, 30], [-82.5, 27], [-80.2, 25.5], [-81, 31], [-76, 35],
  [-74, 40], [-70, 42], [-67, 45], [-65, 48], [-60, 52], [-65, 60], [-78, 62], [-95, 60],
  [-110, 60], [-125, 50], [-124, 40], [-117, 32.5], [-114, 32.5], [-105, 30],
];

const galapagosIslands: GeographicPoint[] = [
  [-91.1, -0.6], [-90.3, -0.6], [-89.5, -0.9], [-91.5, -0.3], [-90.6, -0.2],
];

const landmasses = [southAmerica, centralAmerica, northAmerica];
const textureWidth = 2048;
const textureHeight = 1024;
const islandRadiusDegrees = 0.4;

function projectLongitude(longitude: number): number {
  return ((longitude + 180) / 360) * textureWidth;
}

function projectLatitude(latitude: number): number {
  return ((90 - latitude) / 180) * textureHeight;
}

export function createEarthTexture(palette: Palette): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = textureWidth;
  canvas.height = textureHeight;
  const context = canvas.getContext('2d');

  if (context) {
    context.fillStyle = palette.css.ocean;
    context.fillRect(0, 0, textureWidth, textureHeight);
    context.fillStyle = palette.css.land;

    for (const landmass of landmasses) {
      context.beginPath();
      landmass.forEach(([longitude, latitude], pointIndex) => {
        const x = projectLongitude(longitude);
        const y = projectLatitude(latitude);
        if (pointIndex === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.closePath();
      context.fill();
    }

    const islandRadius = (islandRadiusDegrees / 360) * textureWidth;
    for (const [longitude, latitude] of galapagosIslands) {
      context.beginPath();
      context.arc(projectLongitude(longitude), projectLatitude(latitude), islandRadius, 0, Math.PI * 2);
      context.fill();
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
