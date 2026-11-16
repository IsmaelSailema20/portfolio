import { CanvasTexture, SRGBColorSpace } from 'three';

const emblemWidth = 128;
const emblemHeight = 160;

const emblemColors = {
  border: '#d9a520',
  sky: '#8ecbe8',
  sun: '#f6c21c',
  mountain: '#6f8fa3',
  snow: '#f4f4f0',
  ground: '#3f8f4f',
  river: '#2f6fb0',
  condor: '#26262b',
};

export function createGlowTexture(size = 128): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) {
    const center = size / 2;
    const gradient = context.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.45)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createEcuadorEmblemTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = emblemWidth;
  canvas.height = emblemHeight;
  const context = canvas.getContext('2d');

  if (context) {
    context.fillStyle = emblemColors.condor;
    context.beginPath();
    context.moveTo(64, 44);
    context.quadraticCurveTo(40, 14, 8, 30);
    context.quadraticCurveTo(38, 30, 56, 50);
    context.lineTo(72, 50);
    context.quadraticCurveTo(90, 30, 120, 30);
    context.quadraticCurveTo(88, 14, 64, 44);
    context.fill();
    context.beginPath();
    context.arc(64, 36, 7, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.beginPath();
    context.ellipse(64, 100, 40, 52, 0, 0, Math.PI * 2);
    context.clip();

    context.fillStyle = emblemColors.sky;
    context.fillRect(0, 40, emblemWidth, 120);

    context.fillStyle = emblemColors.sun;
    context.beginPath();
    context.arc(64, 66, 10, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = emblemColors.mountain;
    context.beginPath();
    context.moveTo(18, 128);
    context.lineTo(70, 74);
    context.lineTo(112, 128);
    context.fill();

    context.fillStyle = emblemColors.snow;
    context.beginPath();
    context.moveTo(54, 91);
    context.lineTo(70, 74);
    context.lineTo(84, 92);
    context.lineTo(72, 88);
    context.lineTo(64, 95);
    context.fill();

    context.fillStyle = emblemColors.ground;
    context.fillRect(0, 122, emblemWidth, 40);

    context.strokeStyle = emblemColors.river;
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(70, 122);
    context.quadraticCurveTo(52, 136, 66, 156);
    context.stroke();
    context.restore();

    context.strokeStyle = emblemColors.border;
    context.lineWidth = 6;
    context.beginPath();
    context.ellipse(64, 100, 40, 52, 0, 0, Math.PI * 2);
    context.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
