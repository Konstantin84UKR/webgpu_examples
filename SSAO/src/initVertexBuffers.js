export async function initVertexBuffers(device, mesh) {
    //****************** BUFFER ********************//
    //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
    //** который будет в будушем загружен в данный буффер */
    //** указываем размер  буффера в байтах */
    //** usage ХЗ */
    //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
    //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */
    //****************** BUFFER  vertexBuffer
    const vertexBuffer = device.createBuffer({
      size: mesh.vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
  
    //загружаем данные в буффер */
    new Float32Array(vertexBuffer.getMappedRange()).set(mesh.vertex);
    // передаем буфер в управление ГПУ */
    vertexBuffer.unmap();
  
    mesh.vertexBuffer = vertexBuffer;
  
    //****************** BUFFER  uvBuffer
    const uvBuffer = device.createBuffer({
      size: mesh.uv.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(uvBuffer.getMappedRange()).set(mesh.uv);
    // передаем буфер в управление ГПУ */
    uvBuffer.unmap();
  
    mesh.uvBuffer = uvBuffer;
  
    //****************** BUFFER  normalBuffer
    const normalBuffer = device.createBuffer({
      size: mesh.normal.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(normalBuffer.getMappedRange()).set(mesh.normal);
    // передаем буфер в управление ГПУ */
    normalBuffer.unmap();
  
    mesh.normalBuffer = normalBuffer;
  
    //****************** BUFFER  indexBuffer
    const indexBuffer = device.createBuffer({
      size: mesh.index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
  
    new Uint32Array(indexBuffer.getMappedRange()).set(mesh.index);
    indexBuffer.unmap();
  
    mesh.indexBuffer = indexBuffer;
   
  }