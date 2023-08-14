export async function initBuffers(device, model, plane) {
    
    // -- Выделяем память под буферы и заполняем их данными Моделей 
    // -- Для Юниформ буфером просто выдяляем память 
  
  
    //******************
    // MODEL
    //******************
    //****************** BUFFER  vertexBuffer
    const vertexBuffer = device.createBuffer({
      size: model.vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });  
   
    //загружаем данные в буффер */
    new Float32Array(vertexBuffer.getMappedRange()).set(model.vertex);
    // передаем буфер в управление ГПУ */
    vertexBuffer.unmap();
    model.vertexBuffer = vertexBuffer;
    
    //****************** BUFFER  uvBuffer
    const uvBuffer = device.createBuffer({
      size: model.uv.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(uvBuffer.getMappedRange()).set(model.uv);
    // передаем буфер в управление ГПУ */
    uvBuffer.unmap();
    model.uvBuffer = uvBuffer;

   //****************** BUFFER  normalBuffer
    const normalBuffer = device.createBuffer({
      size: model.normal.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(normalBuffer.getMappedRange()).set(model.normal);
    // передаем буфер в управление ГПУ */
    normalBuffer.unmap();
    model.normalBuffer = normalBuffer;

    //****************** BUFFER  cubeTangentBuffer
    const cubeTangentBuffer = device.createBuffer({
      size: model.tangents.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(cubeTangentBuffer.getMappedRange()).set(model.tangents);
    // передаем буфер в управление ГПУ */
    cubeTangentBuffer.unmap();
    model.tangentBuffer = cubeTangentBuffer;

    //****************** BUFFER  cubeBitangentlBuffer
    const cubeBitangentlBuffer = device.createBuffer({
      size: model.bitangents.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(cubeBitangentlBuffer.getMappedRange()).set(model.bitangents);
    // передаем буфер в управление ГПУ */
    cubeBitangentlBuffer.unmap();
    model.bitangentBuffer = cubeBitangentlBuffer;
    
   //****************** BUFFER  indexBuffer
    const indexBuffer = device.createBuffer({
      size: model.index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint32Array(indexBuffer.getMappedRange()).set(model.index);
    indexBuffer.unmap();
    model.indexBuffer = indexBuffer;

    //******************
    // PLANE
    //******************
    const plane_vertexBuffer = device.createBuffer({
      size: plane.vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });

    //загружаем данные в буффер */
    new Float32Array(plane_vertexBuffer.getMappedRange()).set(plane.vertex);
    // передаем буфер в управление ГПУ */
    plane_vertexBuffer.unmap();
    plane.vertexBuffer = plane_vertexBuffer;

    //****************** BUFFER  uvBuffer
    const plane_uvBuffer = device.createBuffer({
      size: plane.uv.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    }); 
    //загружаем данные в буффер */
    new Float32Array(plane_uvBuffer.getMappedRange()).set(plane.uv);
    // передаем буфер в управление ГПУ */
    plane_uvBuffer.unmap();
    plane.uvBuffer = plane_uvBuffer;

    //****************** BUFFER  normalBuffer
    const plane_normalBuffer = device.createBuffer({
      size: plane.normal.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(plane_normalBuffer.getMappedRange()).set(plane.normal);
    // передаем буфер в управление ГПУ */
    plane_normalBuffer.unmap();
    plane.normalBuffer = plane_normalBuffer;

    const planeTangentBuffer = device.createBuffer({
      size: plane.tangents.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(planeTangentBuffer.getMappedRange()).set(plane.tangents);
    // передаем буфер в управление ГПУ */
    planeTangentBuffer.unmap();
    plane.tangentBuffer = planeTangentBuffer;

    const planeBitangentBuffer = device.createBuffer({
      size: plane.bitangents.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(planeBitangentBuffer.getMappedRange()).set(plane.bitangents);
    // передаем буфер в управление ГПУ */
    planeBitangentBuffer.unmap();
    plane.bitangentBuffer = planeBitangentBuffer;

    //****************** BUFFER  indexBuffer
    const plane_indexBuffer = device.createBuffer({
      size: plane.index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint32Array(plane_indexBuffer.getMappedRange()).set(plane.index);
    plane_indexBuffer.unmap();
    plane.indexBuffer = plane_indexBuffer;
    
    // *************  uniformBuffer ******************* //
    //** настраиваем конвейер рендера 
    //** настраиваем шейдеры указав исходник,точку входа, данные буферов
    //** arrayStride количество байт на одну вершину */
    //** attributes настриваем локацию формат и отступ от начала  arrayStride */
    //** primitive указываем тип примитива для отрисовки*/
    //** depthStencil настраиваем буффер глубины*/
    const uBiffers = {};
  
    // create uniform buffer and layout
    const uniformBuffer = device.createBuffer({
      size: 64 + 64 + 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  
    uBiffers.uniformBuffer = uniformBuffer;
  
    const fragmentUniformBuffer = device.createBuffer({
      size: 16 + 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  
    uBiffers.fragmentUniformBuffer = fragmentUniformBuffer;
  
    const fragmentUniformBuffer1 = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  
    uBiffers.fragmentUniformBuffer1 = fragmentUniformBuffer1;
  
    const uniformBuffershadow = device.createBuffer({
      size: 64 + 64 + 64 + 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  
    uBiffers.uniformBuffershadow = uniformBuffershadow;
    
    return { model, plane, uBiffers };
  }
  