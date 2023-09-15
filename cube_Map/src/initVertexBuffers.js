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
      size: mesh.cubeVertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
  
    //загружаем данные в буффер */
    new Float32Array(vertexBuffer.getMappedRange()).set(mesh.cubeVertexArray);
    // передаем буфер в управление ГПУ */
    vertexBuffer.unmap();
  
    mesh.vertexBuffer = vertexBuffer; 
   
  }