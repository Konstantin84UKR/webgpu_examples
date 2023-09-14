export async function initPipeline(device, canvas, format, uBiffers,shaderLigthHelpers){

      
    const forvardRender_UniformBindGroupLayout = device.createBindGroupLayout({
        entries: [
           {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {}
          } ,
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
              type : "read-only-storage"
            }
          },
          {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
              type : "read-only-storage"
            }
          }           
        ],
      });

       
      const forvardRender_uniformBindGroup = device.createBindGroup({
        //layout: pipeline.getBindGroupLayout(0),
        label: 'forvardRender_uniformBindGroup',
        layout: forvardRender_UniformBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: uBiffers.ligthHelper_uniformBuffer,
              offset: 0,
              size: 64 + 64   // PROJMATRIX + VIEWMATRIX  // Каждая матрица занимает 64 байта
            }
          },
          {
            binding: 1,
            resource: {
                buffer: uBiffers.instanceBuffer,               
            }
          },
          {
            binding: 2,
            resource: {
                buffer: uBiffers.instanceColorBuffer,               
            }
          }           
        ]
      });

      const depthTexture = device.createTexture({
        size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });

      const forvardRender_pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [forvardRender_UniformBindGroupLayout]
      });

      ///

      const pipeline = device.createRenderPipeline({
        label: 'forvardRender_pipeline',
        layout: forvardRender_pipelineLayout,
        vertex: {
            module: device.createShaderModule({
              code: shaderLigthHelpers.vertex,
            }),
            entryPoint: "main",
            buffers:[
              {
                  arrayStride: 12,
                  attributes: [{
                      shaderLocation: 0,
                      format: "float32x3",
                      offset: 0
                  }]
              }
          ]
          },
          fragment: {
            module: device.createShaderModule({
              code: shaderLigthHelpers.fragment,
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
        depthStencil: {
          format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus depth32float
          depthWriteEnabled: true, //вкл\выкл теста глубины 
          depthCompare: 'greater' //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
          //depthCompare: 'never' //'less' // greater //greater-equal //less-equal
        }
      });
         
    
      pipeline.BindGroup = {
        forvardRender_uniformBindGroup,
        forvardRender_pipelineLayout
      };    
    
      pipeline.Depth = { depthTexture };
    
      return {pipeline}      
}