export async function initBuffers(device, model, plane,ligthHelper) {
    //****************** BUFFER ********************//
    //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
    //** который будет в будушем загружен в данный буффер */
    //** указываем размер  буффера в байтах */
    //** usage ХЗ */
    //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
    //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */
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
  
    //****************** BUFFER  indexBuffer
    const indexBuffer = device.createBuffer({
      size: model.index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
  
    new Uint32Array(indexBuffer.getMappedRange()).set(model.index);
    indexBuffer.unmap();
  
    model.indexBuffer = indexBuffer;
  
    //****************** PLANE
    const plane_vertexBuffer = device.createBuffer({
      size: plane.vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
  
    //загружаем данные в буффер */
    new Float32Array(plane_vertexBuffer.getMappedRange()).set(plane.vertex);
    // передаем буфер в управление ГПУ */
    plane_vertexBuffer.unmap();
  
    plane.plane_vertexBuffer = plane_vertexBuffer;
  
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
  
    plane.plane_uvBuffer = plane_uvBuffer;
  
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
  
    plane.plane_normalBuffer = plane_normalBuffer;
  
    //****************** BUFFER  indexBuffer
    const plane_indexBuffer = device.createBuffer({
      size: plane.index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
  
    new Uint32Array(plane_indexBuffer.getMappedRange()).set(plane.index);
    plane_indexBuffer.unmap();
  
    plane.plane_indexBuffer = plane_indexBuffer;

    //****************** ligthHelper ***************
    
    const ligthHelper_vertexBuffer = device.createBuffer({
      size: ligthHelper.vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });  
     //загружаем данные в буффер */
     new Float32Array(ligthHelper_vertexBuffer.getMappedRange()).set(ligthHelper.vertex);
     // передаем буфер в управление ГПУ */
     ligthHelper_vertexBuffer.unmap();
     ligthHelper.ligthHelper_vertexBuffer = ligthHelper_vertexBuffer;
    
     //****************** BUFFER  indexBuffer
    const ligthHelper_indexBuffer = device.createBuffer({
      size: ligthHelper.index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint32Array(ligthHelper_indexBuffer.getMappedRange()).set(ligthHelper.index);
    ligthHelper_indexBuffer.unmap();
    ligthHelper.ligthHelper_indexBuffer = ligthHelper_indexBuffer;
    

    //*********************************************//
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
  
    const uniformBufferModel = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  
    uBiffers.uniformBufferModel = uniformBufferModel;
  
    const uniformBufferModel_2 = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  
    uBiffers.uniformBufferModel_2 = uniformBufferModel_2;
  
    const uniformBufferCamera = device.createBuffer({
      size: 64 * 2,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
  
    uBiffers.uniformBufferCamera = uniformBufferCamera;

        // create uniform buffer and layout
    const ligthHelper_uniformBuffer = device.createBuffer({
          size: 64 + 64,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }); 
    uBiffers.ligthHelper_uniformBuffer = ligthHelper_uniformBuffer;


    const fragmentUniformLightPositionBuffer = device.createBuffer({
      size: 16 + 16 + 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }); 
    uBiffers.fragmentUniformLightPositionBuffer = fragmentUniformLightPositionBuffer;

    const fragmentUniformLightColorBuffer = device.createBuffer({
      size: 16 + 16 + 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }); 
    uBiffers.fragmentUniformLightColorBuffer = fragmentUniformLightColorBuffer;

    const instanceBuffer = device.createBuffer({
      label : "instanceBuffer",
      size : 64 * 3, // три Light
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    uBiffers.instanceBuffer = instanceBuffer;

    const instanceColorBuffer = device.createBuffer({
      label : "instanceBuffer",
      size : 16 * 3, // три Light
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    uBiffers.instanceColorBuffer = instanceColorBuffer;
  
    return { uBiffers };
  }