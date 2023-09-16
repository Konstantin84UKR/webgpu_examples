export async function initResurse(device,format) {
    
    //Создаем картинку и загрудаем в нее данные из файла
    let img = new Image();
    img.src = './res/ChasivYar5.jpg'; //'./res/ChasivYar5.jpg';
    await img.decode();

    const imageBitmap = await createImageBitmap(img);

    // Создаем саму текстуру
    const textureImage = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1], //??
        format: format,
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
    });

    //передаем данные о текстуре и данных текстуры в очередь
    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: textureImage },
        [imageBitmap.width, imageBitmap.height]);

    return {textureImage,imageBitmap}    
}