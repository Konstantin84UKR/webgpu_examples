export async function initResurse(device){
    
    const cube = {};

    cube.cubeVertexSize = 4 * 10;
    cube.cubePositionOffset = 0;
    cube.cubeColorOffset = 4 * 4;
    cube.cubeUVOffset = 4 * 8;
    cube.cubeVertexCount = 36;    
  
    cube.cubeVertexArray = new Float32Array([
      1, -1, 1, 1,     1, 0, 1, 1,     1, 1,
      -1, -1, 1, 1,    0, 0, 1, 1,     0, 1,
      -1, -1, -1, 1,   0, 0, 0, 1,     0, 0,
      1, -1, -1, 1,    1, 0, 0, 1,     1, 0,
      1, -1, 1, 1,     1, 0, 1, 1,     1, 1,
      -1, -1, -1, 1,   0, 0, 0, 1,     0, 0,
  
      1, 1, 1, 1,      1, 1, 1, 1,     1, 1,
      1, -1, 1, 1,     1, 0, 1, 1,     0, 1,
      1, -1, -1, 1,    1, 0, 0, 1,     0, 0,
      1, 1, -1, 1,     1, 1, 0, 1,     1, 0,
      1, 1, 1, 1,      1, 1, 1, 1,     1, 1,
      1, -1, -1, 1,    1, 0, 0, 1,     0, 0,
  
      -1, 1, 1, 1,     0, 1, 1, 1,     1, 1,
      1, 1, 1, 1,      1, 1, 1, 1,     0, 1,
      1, 1, -1, 1,     1, 1, 0, 1,     0, 0,
      -1, 1, -1, 1,    0, 1, 0, 1,     1, 0,
      -1, 1, 1, 1,     0, 1, 1, 1,     1, 1,
      1, 1, -1, 1,     1, 1, 0, 1,     0, 0,
  
      -1, -1, 1, 1,    0, 0, 1, 1,     1, 1,
      -1, 1, 1, 1,     0, 1, 1, 1,     0, 1,
      -1, 1, -1, 1,    0, 1, 0, 1,     0, 0,
      -1, -1, -1, 1,   0, 0, 0, 1,     1, 0,
      -1, -1, 1, 1,    0, 0, 1, 1,     1, 1,
      -1, 1, -1, 1,    0, 1, 0, 1,     0, 0,
  
      1, 1, 1, 1,      1, 1, 1, 1,    1, 1,
      -1, 1, 1, 1,     0, 1, 1, 1,    0, 1,
      -1, -1, 1, 1,    0, 0, 1, 1,    0, 0,
      -1, -1, 1, 1,    0, 0, 1, 1,    0, 0,
      1, -1, 1, 1,     1, 0, 1, 1,    1, 0,
      1, 1, 1, 1,      1, 1, 1, 1,    1, 1,
  
      1, -1, -1, 1,    1, 0, 0, 1,    1, 1,
      -1, -1, -1, 1,   0, 0, 0, 1,    0, 1,
      -1, 1, -1, 1,    0, 1, 0, 1,    0, 0,
      1, 1, -1, 1,     1, 1, 0, 1,    1, 0,
      1, -1, -1, 1,    1, 0, 0, 1,    1, 1,
      -1, 1, -1, 1,    0, 1, 0, 1,    0, 0,
    ]);
    
    //TEXTURE 
      //Создаем картинку и загрудаем в нее данные из файла
      
      const imgSrcs = [
        './tex/nx.png',
        './tex/px.png',
        './tex/py.png',
        './tex/ny.png',
        './tex/pz.png',
        './tex/nz.png'
      ];
     
      const promises = imgSrcs.map(async (src) => {
        let img = new Image();
        img.src = src; //'./tex/yachik.jpg';
        await img.decode();
        return await createImageBitmap(img);
      });      

      const imageBitmaps = await Promise.all(promises);

      // Создаем саму текстуру
      const texture = device.createTexture({
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
        { texture: texture, origin: [0, 0, i] },
        [imageBitmap.width, imageBitmap.height]);
      }

    return {cube,texture} 
} 