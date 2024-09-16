/* eslint-disable */

import { ColladaExporter } from './ColladaExporter.js';
import { ColladaLoader } from './ColladaLoader.js';

// this translated a modern gltf loaded object (three r123) to a collada that can be loaded into three r71
export const TranslateModel = (THREE, model, scale, height) => {
  return new Promise((resolve, reject) => {
    const avatarPivot = new THREE.Object3D();

    const avatarModel = new THREE.Group();

    const onDone = (result) => {
      const buffColor = result.textures[0].data;

      const colorTexture = new THREE.Texture();

      const imageColorBlob = new Blob([buffColor], { type: 'image/png' });
      // set textures into buffers
      createImageBitmap(imageColorBlob).then(function (imageBitmap) {
        colorTexture.image = imageBitmap;
        colorTexture.needsUpdate = true;
      });
      const colladaLoader = new ColladaLoader();
      // then load collada (two meshes, one is helmet and the other is head)
      colladaLoader.load(result.data, (colladaLoaded) => {
        const mesh1 = colladaLoaded.scene.children[0].children[0]?.children[1]?.children[0];
        if (mesh1) {
          mesh1.rotation.set(0, 3.14, 0);
          const mat1 = mesh1.material;
          mat1.map = colorTexture;
        }

        const mesh2 = colladaLoaded.scene.children[0].children[0]?.children[2]?.children[0];
        if (mesh2) {
          mesh2.rotation.set(0, 3.14, 0);
          const mat2 = mesh2.material;

          if (!mat2) return;

          mat2.map = colorTexture;
          mat2.transparent = true;
        }

        avatarModel.add(colladaLoaded.scene);
        avatarModel.scale.set(scale, scale, scale);
        avatarModel.position.set(0, height, 0);
        avatarPivot.add(avatarModel);
        resolve(avatarPivot);
      });
    };
    // translate from gltf to collada
    const exporter = new ColladaExporter();
    exporter.parse(model, onDone, {
      upAxis: 'Y_UP',
      unitName: 'meter',
      unitMeter: 1,
    });
  });
};

export const disposeAvatar = (avatar) => {
  if (avatar) {
    avatar.children.forEach((obj) => {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        obj.material.dispose();
      }
    });
  }
};
