export async function initPipeline(device, canvas, format, shaderMatCap, sampleCount,sampler,texture,instance_count,uBuffers) {
  
  
    const pipeline = device.createRenderPipeline({
        label: "pipeline main",
        layout: "auto",
        vertex: {
          module: device.createShaderModule({
            code: shaderMatCap.shader,
          }),
          entryPoint: "main_vertex",
          buffers: [
              {
                arrayStride: 4*3,
                    attributes: [{
                    shaderLocation: 0,
                    format: "float32x3",
                    offset: 0
                  }] 
              },
              {
                arrayStride: 4*2,
                  attributes: [{
                  shaderLocation: 1,
                  format: "float32x2",
                  offset: 0
                  }] 
              },
              {
                arrayStride: 4*3,
                  attributes: [{
                  shaderLocation: 2,
                  format: "float32x3",
                  offset: 0
                  }] 
              }
        ]     
            
      },
        fragment: {
          module: device.createShaderModule({
            code: shaderMatCap.shader,
          }),
          entryPoint: "main_fragment",
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
        multisample: {
          count: sampleCount,
        },
        depthStencil:{
          format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
          depthWriteEnabled: true, //вкл\выкл теста глубины 
          depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
      }
      });

     //--------------------------------------------------
        const uniformBindGroup = device.createBindGroup({
            label : "uniformBindGroup",
            layout: pipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: {
                    buffer: uBuffers.uniformBufferMatrix,
                    offset: 0,
                    size: 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX + NORMALMATRIX// Каждая матрица занимает 64 байта
                }
              },
              { 
                binding: 1,
                resource: sampler
              },
              {
                binding: 2,
                resource: texture.createView()
              }
            ]
        }); 
        
        const uniformInstansBindGroup = device.createBindGroup({
          label : "uniformInstansBindGroup",
          layout: pipeline.getBindGroupLayout(1),
          entries: [{
              binding: 0,
              resource: {
                  buffer: uBuffers.instanceBuffer,
                  offset: 0,
                  size: (64) * instance_count// PROJMATRIX + VIEWMATRIX + MODELMATRIX + NORMALMATRIX// Каждая матрица занимает 64 байта
              }
            },
            {
              binding: 1,
              resource: {
                  buffer: uBuffers.instanceNormalBuffer,
                  offset: 0,
                  size: (64) * instance_count// PROJMATRIX + VIEWMATRIX + MODELMATRIX + NORMALMATRIX// Каждая матрица занимает 64 байта
              }
            }
          ]
      }); 
          

  
    pipeline.BindGroup = {
        uniformBindGroup,
        uniformInstansBindGroup     
    }
    
     const depthTexture = device.createTexture({
        size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        sampleCount,
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });  
    
      const textureMSAA = device.createTexture({
        size: [canvas.width, canvas.height],
        sampleCount,
        format: format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      const textureView = textureMSAA.createView();
  
      pipeline.depthTexture = depthTexture;
      pipeline.textureView = textureView;
  
    return {pipeline};
  }