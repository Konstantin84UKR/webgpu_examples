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

      //CUBE Texture
      //TEXTURE 
      //Создаем картинку и загрудаем в нее данные из файла
      
      const imgSrcs = [
        './res/tex/nx.png',
        './res/tex/px.png',
        './res/tex/py.png',
        './res/tex/ny.png',
        './res/tex/pz.png',
        './res/tex/nz.png'
      ];
     
      const promises = imgSrcs.map(async (src) => {
        let img = new Image();
        img.src = src; //'./tex/yachik.jpg';
        await img.decode();
        return await createImageBitmap(img);
      });      

      const imageBitmapsTextureCUBE = await Promise.all(promises);

      // Создаем саму текстуру
      const textureCUBE = device.createTexture({
        size: [imageBitmapsTextureCUBE[0].width, imageBitmapsTextureCUBE[0].height, 6], //??
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
        dimension: '2d',
      });
      
      //передаем данные о текстуре и данных текстуры в очередь
      for (let i = 0; i < imageBitmapsTextureCUBE.length; i++) {
        const imageBitmap = imageBitmapsTextureCUBE[i];
        device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: textureCUBE, origin: [0, 0, i] },
        [imageBitmap.width, imageBitmap.height]);
      }
  



        return { modelSphere, texture, sampler,textureCUBE}
}