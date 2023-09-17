export async function initPipeline(device,format,uBuffers,shader){
   
    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
          module: device.createShaderModule({
            code: shader.vertex,
          }),
          entryPoint: "main",
          buffers: [
            {
              arrayStride: 4 * (3 + 3),
              attributes: [{
                shaderLocation: 0,
                format: "float32x3",
                offset: 0
              },
              {
                shaderLocation: 1,
                format: 'float32x3',
                offset: 12,
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
        },
        depthStencil:{
          format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
          depthWriteEnabled: true, //вкл\выкл теста глубины 
          //depthCompare: 'greater', // STEP 2
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
                size: 64 + 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
        }]
    });
      
    pipeline.BindGroup = {uniformBindGroup} 
    
    return {pipeline}
}