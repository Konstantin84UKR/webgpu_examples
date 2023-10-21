export async function initPipeline(device,format,shader,uBuffers,texture,sampleCount){

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
          buffers: []
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
        multisample: {
          count: sampleCount,
        },
        depthStencil: {
          format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
          depthWriteEnabled: true, //вкл\выкл теста глубины 
          depthCompare: "always" //always  less-equal//Предоставленное значение проходит сравнительный тест, если оно меньше или равно выборочному значению. 
        }
      });
    
      const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: uBuffers.uniformBufferInvMatrix,
            offset: 0,
            size: 64 // PROJVIEW MATRIX INVERS// Каждая матрица занимает 64 байта
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
    
      
      pipeline.BindGroup = {};  
      pipeline.BindGroup.uniformBindGroup = uniformBindGroup;

    return {pipeline}
}  

