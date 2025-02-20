import { SpriteMaterial, Texture } from 'three';

export class MaterialHelper {
  private THREE: any;

  constructor(THREE: any) {
    this.THREE = THREE;
  }

  createTextMaterial(texture: Texture): SpriteMaterial {
    return new this.THREE.SpriteMaterial({
      map: texture,
      useScreenCoordinates: false,
      opacity: 1,
      alphaTest: 0.01,
      depthTest: true,
      transparent: true,
      sizeAttenuation: false,
      precision: 'highp',
    });
  }

  createBackgroundMaterial(texture: Texture): SpriteMaterial {
    return new this.THREE.SpriteMaterial({
      map: texture,
      opacity: 0.99,
      transparent: false,
      useScreenCoordinates: false,
      alphaTest: 0.1,
      sizeAttenuation: false,
    });
  }

  createTexture(canvas: HTMLCanvasElement): Texture {
    const texture = new this.THREE.Texture(canvas);
    texture.needsUpdate = true;

    texture.minFilter = this.THREE.LinearFilter;
    texture.magFilter = this.THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.anisotropy = 16;

    return texture;
  }
}
