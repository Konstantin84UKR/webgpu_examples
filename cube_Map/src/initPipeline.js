export async function initPipeline(device,format,shader,cube,uBuffers,texture){

    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
      });

    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code: shader.vertex,
            }),
            entryPoint: "main",
            buffers: [
                {
                    arrayStride: cube.cubeVertexSize,
                    attributes: [{
                        shaderLocation: 0,
                        format: "float32x4",
                        offset: cube.cubePositionOffset
                    },
                    {
                        shaderLocation: 1,
                        format: 'float32x2',
                        offset: cube.cubeUVOffset,
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
            //topology: "point-list",
            cullMode: 'none',
        },
        depthStencil: {
            format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
            depthWriteEnabled: true, //вкл\выкл теста глубины 
            depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
        }
    });
    
    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: uBuffers.uniformBuffer,
            offset: 0,
            size: 256 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
          }
          },
          {
            binding: 1,
            resource: sampler
          },
          {
            binding: 2,
            resource: texture.createView({
              dimension: 'cube',
            }),
          },
        ],
      });
    
      
      pipeline.bindGroup = {};  
      pipeline.bindGroup.uniformBindGroup = uniformBindGroup;

    return {pipeline}
}  

