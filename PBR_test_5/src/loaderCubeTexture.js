import { createTextureFromImage , createCubeTextureFromImage} from './textureUtils.js';


export async function loaderCubeTexture(device) {
      
       //TEXTURE 
       //Создаем картинку и загрудаем в нее данные из файла
       // const uniformBuffer_CUBEMAP = uBiffers.uniformBuffer_CUBEMAP;
      
       const sampler_CUBEMAP = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
      });
  
        //TEXTURE 
        //Создаем картинку и загрудаем в нее данные из файла
        
        // const imgSrcs = [
        //   './res/tex/forestBlur/nx.png',
        //   './res/tex/forestBlur/px.png',
        //   './res/tex/forestBlur/py.png',
        //   './res/tex/forestBlur/ny.png',
        //   './res/tex/forestBlur/pz.png',
        //   './res/tex/forestBlur/nz.png'
        // ];

        const imgSrcs = [
          './res/tex/forestBlur/MipMaps1/nx.png',
          './res/tex/forestBlur/MipMaps1/px.png',
          './res/tex/forestBlur/MipMaps1/py.png',
          './res/tex/forestBlur/MipMaps1/ny.png',
          './res/tex/forestBlur/MipMaps1/pz.png',
          './res/tex/forestBlur/MipMaps1/nz.png'
        ];

        const imgSrcsSkyBox = [
          './res/tex/forestBlur/MipMaps0/nx.png',
          './res/tex/forestBlur/MipMaps0/px.png',
          './res/tex/forestBlur/MipMaps0/py.png',
          './res/tex/forestBlur/MipMaps0/ny.png',
          './res/tex/forestBlur/MipMaps0/pz.png',
          './res/tex/forestBlur/MipMaps0/nz.png'
        ];

        const imgSrcsSkyBox1 = [
          './res/tex/forestBlur/MipMaps1/nx.png',
          './res/tex/forestBlur/MipMaps1/px.png',
          './res/tex/forestBlur/MipMaps1/py.png',
          './res/tex/forestBlur/MipMaps1/ny.png',
          './res/tex/forestBlur/MipMaps1/pz.png',
          './res/tex/forestBlur/MipMaps1/nz.png'
        ];

        const imgSrcsSkyBox2 = [
          './res/tex/forestBlur/MipMaps2/nx.png',
          './res/tex/forestBlur/MipMaps2/px.png',
          './res/tex/forestBlur/MipMaps2/py.png',
          './res/tex/forestBlur/MipMaps2/ny.png',
          './res/tex/forestBlur/MipMaps2/pz.png',
          './res/tex/forestBlur/MipMaps2/nz.png'
        ];

        const imgSrcsSkyBox3 = [
          './res/tex/forestBlur/MipMaps3/nx.png',
          './res/tex/forestBlur/MipMaps3/px.png',
          './res/tex/forestBlur/MipMaps3/py.png',
          './res/tex/forestBlur/MipMaps3/ny.png',
          './res/tex/forestBlur/MipMaps3/pz.png',
          './res/tex/forestBlur/MipMaps3/nz.png'
        ];

        const imgSrcsSkyBox4 = [
          './res/tex/forestBlur/MipMaps4/nx.png',
          './res/tex/forestBlur/MipMaps4/px.png',
          './res/tex/forestBlur/MipMaps4/py.png',
          './res/tex/forestBlur/MipMaps4/ny.png',
          './res/tex/forestBlur/MipMaps4/pz.png',
          './res/tex/forestBlur/MipMaps4/nz.png'
        ];

        const imgSrcsSkyBox5 = [
          './res/tex/forestBlur/MipMaps5/nx.png',
          './res/tex/forestBlur/MipMaps5/px.png',
          './res/tex/forestBlur/MipMaps5/py.png',
          './res/tex/forestBlur/MipMaps5/ny.png',
          './res/tex/forestBlur/MipMaps5/pz.png',
          './res/tex/forestBlur/MipMaps5/nz.png'
        ];
       
        
        const promises = loadPromisesSkyBox(imgSrcs); 

        const promisesSkyBox = loadPromisesSkyBox(imgSrcsSkyBox);
        const promisesSkyBox1 = loadPromisesSkyBox(imgSrcsSkyBox1);
        const promisesSkyBox2 = loadPromisesSkyBox(imgSrcsSkyBox2);
        const promisesSkyBox3 = loadPromisesSkyBox(imgSrcsSkyBox3);
        const promisesSkyBox4 = loadPromisesSkyBox(imgSrcsSkyBox4);
        const promisesSkyBox5 = loadPromisesSkyBox(imgSrcsSkyBox5);
 
        const imageBitmaps = await Promise.all(promises);
        const imageBitmapsSkyBox = await Promise.all(promisesSkyBox);
        const imageBitmapsSkyBox1 = await Promise.all(promisesSkyBox1); 
        const imageBitmapsSkyBox2 = await Promise.all(promisesSkyBox2); 
        const imageBitmapsSkyBox3 = await Promise.all(promisesSkyBox3); 
        const imageBitmapsSkyBox4 = await Promise.all(promisesSkyBox4); 
        const imageBitmapsSkyBox5 = await Promise.all(promisesSkyBox5);  
      
        // Создаем саму текстуру
        //const texture_CUBEMAP = await createCubeTextureFromImage(device, imgSrcsSkyBox ,{ mips: true, flipY: false });
        const texture_CUBEMAP = device.createTexture({
          size: [imageBitmaps[0].width, imageBitmaps[0].height, 6], //??
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
          dimension: '2d',
        });
          
        //imageBitmapsSkyBox
        //передаем данные о текстуре и данных текстуры в очередь
 
        
          for (let i = 0; i < imageBitmapsSkyBox.length; i++) {
            const imageBitmap = imageBitmaps[i];
            device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture_CUBEMAP, origin: [0, 0, i] , mipLevel:0},
            [imageBitmap.width, imageBitmap.height]);
          }
        
          const sampler_CUBEMAP_PBR = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
          });
        
           // Создаем саму текстуру
           
           //const texture_CUBEMAP_PBR = await createCubeTextureFromImage(device,imgSrcs,{ mips: true, flipY: false });
           const texture_CUBEMAP_PBR = device.createTexture({
            size: [imageBitmapsSkyBox[0].width, imageBitmapsSkyBox[0].height, 6], //??
            format: 'rgba8unorm',
            mipLevelCount: 6,
            usage: GPUTextureUsage.TEXTURE_BINDING |
              GPUTextureUsage.COPY_DST |
              GPUTextureUsage.RENDER_ATTACHMENT,
            dimension: '2d',
          });
        
          //передаем данные о текстуре и данных текстуры в очередь
          for (let i = 0; i < imageBitmapsSkyBox.length; i++) {
            const imageBitmap = imageBitmapsSkyBox[i];
            device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture_CUBEMAP_PBR, origin: [0, 0, i], mipLevel: 0},
            [imageBitmap.width, imageBitmap.height]);
          }
        
          for (let i = 0; i < imageBitmapsSkyBox1.length; i++) {
            const imageBitmap = imageBitmapsSkyBox1[i];
            device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture_CUBEMAP_PBR, origin: [0, 0, i] , mipLevel: 1},
            [imageBitmap.width, imageBitmap.height]);
          }
        
          for (let i = 0; i < imageBitmapsSkyBox2.length; i++) {
            const imageBitmap = imageBitmapsSkyBox2[i];
            device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture_CUBEMAP_PBR, origin: [0, 0, i] , mipLevel: 2},
            [imageBitmap.width, imageBitmap.height]);
          }
        
          for (let i = 0; i < imageBitmapsSkyBox3.length; i++) {
            const imageBitmap = imageBitmapsSkyBox3[i];
            device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture_CUBEMAP_PBR, origin: [0, 0, i] , mipLevel: 3},
            [imageBitmap.width, imageBitmap.height]);
          }
        
          for (let i = 0; i < imageBitmapsSkyBox4.length; i++) {
            const imageBitmap = imageBitmapsSkyBox4[i];
            device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture_CUBEMAP_PBR, origin: [0, 0, i] , mipLevel: 4},
            [imageBitmap.width, imageBitmap.height]);
          }
        
          for (let i = 0; i < imageBitmapsSkyBox5.length; i++) {
            const imageBitmap = imageBitmapsSkyBox5[i];
            device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture_CUBEMAP_PBR, origin: [0, 0, i] , mipLevel: 5},
            [imageBitmap.width, imageBitmap.height]);
          }
        
           
          // Создаем саму текстуру // imageBitmaps
             const texture_IBL_PBR = device.createTexture({
              size: [imageBitmaps[0].width, imageBitmaps[0].height, 6], //??
              format: 'rgba8unorm',
              usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
              dimension: '2d',
            });
          
          //передаем данные о текстуре и данных текстуры в очередь
          for (let i = 0; i < imageBitmaps.length; i++) {
            const imageBitmap = imageBitmaps[i];
            device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture_IBL_PBR, origin: [0, 0, i] },
            [imageBitmap.width, imageBitmap.height]);
          }
             
         const texture_LUT = await createTextureFromImage(device, './res/LUT.png', { mips: false, flipY: false });
             
         const CUBEMAP = {
            texture_CUBEMAP,
            texture_LUT,
            sampler_CUBEMAP,
            sampler_CUBEMAP_PBR,
            texture_CUBEMAP_PBR,
            texture_IBL_PBR

         }

         return CUBEMAP
}


function loadPromisesSkyBox(imgSrcsSkyBox) {
  const promisesSkyBox = imgSrcsSkyBox.map(async (src) => {
    let img = new Image();
    img.src = src; //'./tex/yachik.jpg';
    await img.decode();
    return await createImageBitmap(img);
  }); 

  return promisesSkyBox;
}

