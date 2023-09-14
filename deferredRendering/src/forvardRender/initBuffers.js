
export function initBuffers(device,ligthHelper){
   
    const ligthHelper_vertexBuffer = device.createBuffer({
        size: ligthHelper.vertex.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
        mappedAtCreation: true
    });  
    //загружаем данные в буффер */
    new Float32Array(ligthHelper_vertexBuffer.getMappedRange()).set(ligthHelper.vertex);
    // передаем буфер в управление ГПУ */
    ligthHelper_vertexBuffer.unmap();
    ligthHelper.vertexBuffer = ligthHelper_vertexBuffer;
    
    //****************** BUFFER  indexBuffer
    const ligthHelper_indexBuffer = device.createBuffer({
        size: ligthHelper.index.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });

    new Uint32Array(ligthHelper_indexBuffer.getMappedRange()).set(ligthHelper.index);
    ligthHelper_indexBuffer.unmap();
    ligthHelper.indexBuffer = ligthHelper_indexBuffer;
  
}
