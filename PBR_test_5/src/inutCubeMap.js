import { shader } from "./pipelineCubeMap/shader.js";

export async function initCubeMap(device,context,canvas,format,uBiffers){

  const cubeVertexSize = 4 * 10;
        const cubePositionOffset = 0;
        const cubeColorOffset = 4 * 4;
        const cubeUVOffset = 4 * 8;
        const cubeVertexCount = 36;  


    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: device.createShaderModule({
          code: shader.vertex,
        }),
        entryPoint: "main",
        buffers: [
          {
            arrayStride: cubeVertexSize,
            attributes: [{
              shaderLocation: 0,
              format: "float32x4",
              offset: cubePositionOffset
            },
            {
              shaderLocation: 1,
              format: 'float32x2',
              offset: cubeUVOffset,
            }
            ]
          }
        ]
      },
      fragment: {
        module: device.createShaderModule({
          code: shader.fragment,
        }),
        entryPoint: "main",
        targets: [
          {
            format: format,
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        //topology: "line-list",
        cullMode: 'none',
      },
      depthStencil:{
        format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
        depthWriteEnabled: true, //вкл\выкл теста глубины 
        depthCompare: "less-equal" //    
        // "never",
        // "less",
        // "equal",
        // "less-equal",
        // "greater",
        // "not-equal",
        // "greater-equal",
        // "always", //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
    }
    });

    
    const cubeVertexArray_CUBEMAP = new Float32Array([
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
    console.log('Vertices:', cubeVertexArray_CUBEMAP.length);

    const vertexBuffer = device.createBuffer({
        size: cubeVertexArray_CUBEMAP.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
        mappedAtCreation: true
      });
      //загружаем данные в буффер */
      new Float32Array(vertexBuffer.getMappedRange()).set(cubeVertexArray_CUBEMAP);
      // передаем буфер в управление ГПУ */
      vertexBuffer.unmap();


    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    const sampler_CUBEMAP = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

         
      const dataPipeline = {
        // uniformBuffer,
        // //renderPassDescription,
        // uniformBindGroup,
        // //textureView,
        // texture,
        // depthTexture,
        sampler_CUBEMAP,
        //uniformBindGroup_CUBEMAP ,
        vertexBuffer
        }

      return {pipeline, dataPipeline}

}