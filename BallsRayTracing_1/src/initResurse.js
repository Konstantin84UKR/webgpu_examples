import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';

export async function initResurse(device) {

    const meshSphereGeometry = new SphereGeometry(1.0, 32, 16);
    const modelSphere = {};
    modelSphere.vertex = new Float32Array(meshSphereGeometry.vertices);
    modelSphere.index = new Uint32Array(meshSphereGeometry.indices);    
    modelSphere.uv = new Float32Array(meshSphereGeometry.uvs);
    modelSphere.normal = new Float32Array(meshSphereGeometry.normals);

     //-------------------- TEXTURE ---------------------
     let img = new Image();
     img.src = './res/green.jpg';
     await img.decode();

     const imageBitmap = await createImageBitmap(img);

     const sampler = device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: "nearest", //nearest
        addressModeU: 'repeat',
        addressModeV: 'repeat'
      });
    
      const texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT
      });

      device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: texture },
        [imageBitmap.width, imageBitmap.height]);

        return { modelSphere, texture, sampler}
}