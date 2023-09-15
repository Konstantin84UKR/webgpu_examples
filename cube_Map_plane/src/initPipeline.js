export async function initPipeline(device,format,shader,uBuffers,texture){

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
        depthStencil: {
          format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
          depthWriteEnabled: true, //вкл\выкл теста глубины 
          depthCompare: "less-equal" //Предоставленное значение проходит сравнительный тест, если оно меньше или равно выборочному значению. 
        }
      });
    
      const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: uBuffers.uniformBuffer,
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
    
      
      pipeline.bindGroup = {};  
      pipeline.bindGroup.uniformBindGroup = uniformBindGroup;

    return {pipeline}
}  

