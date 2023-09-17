export async function initVertexBuffers(device,cube){

    const vertexBuffer = device.createBuffer({
        size: cube.cube_vertex.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
        mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(vertexBuffer.getMappedRange()).set(cube.cube_vertex);
    // передаем буфер в управление ГПУ */
    vertexBuffer.unmap();

    cube.vertexBuffer = vertexBuffer;

    const indexBuffer = device.createBuffer({
        size: cube.cube_index.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });

    new Uint32Array(indexBuffer.getMappedRange()).set(cube.cube_index);
    indexBuffer.unmap(); 

    cube.indexBuffer = indexBuffer;

}