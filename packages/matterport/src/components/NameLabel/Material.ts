import { SpriteMaterial, Texture, Color } from 'three';

export const Material = {
  createForText: (texture: Texture, THREE: any): SpriteMaterial => {
    return new THREE.SpriteMaterial({
      map: texture,
      useScreenCoordinates: false,
      opacity: 1,
      alphaTest: 0.01,
      depthTest: true,
      transparent: true,
      sizeAttenuation: false,
      precision: 'highp',
    });
  },

  createForBackground: (texture: Texture, backgroundColor: string, THREE: any): SpriteMaterial => {
    return new THREE.SpriteMaterial({
      map: texture,
      opacity: 0.99,
      transparent: false,
      useScreenCoordinates: false,
      alphaTest: 0.1,
      sizeAttenuation: false,
    });
  },

  createTexture: (canvas: HTMLCanvasElement, THREE: any): Texture => {
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.anisotropy = 16;

    return texture;
  },
};
