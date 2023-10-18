export async function initPipeline(device, canvas, format, shader,sampleCount,instance_count,uBuffers) {
    //   ***********************************************
    //   *************** _PostEffect *******************
    //   ***********************************************
     
 
    const pipeline = device.createRenderPipeline({
      label: "pipeline_PostEffect",
      layout: "auto",
      vertex: {
        module: device.createShaderModule({
          code: shader.vertex
        }),
        entryPoint: "vertex_main"
      },
      fragment: {
        module: device.createShaderModule({
          code: shader.fragment
        }),
        entryPoint: "fragment_main",
        targets: [{
          format: format
        }
      ]
      },
      multisample: {
        count: sampleCount,
      },
      primitive: {
        topology: "triangle-list", // что будем рисовать точки - треугольники - линии
      },
      depthStencil: {
        format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus depth32float
        depthWriteEnabled: false, //вкл\выкл теста глубины 
        depthCompare: 'always' //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
        //depthCompare: 'never' //'less' // greater 'never' //'less' // greater //greater-equal //less-equal "always"
      }
    });
    
    const uniformBindGroup = device.createBindGroup({
      label : "uniformBindGroup",
      layout: pipeline.getBindGroupLayout(0),
      entries: [{
          binding: 0,
          resource: {
              buffer: uBuffers.uniformBufferMatrix,
              offset: 0,
              size: 64 + 64 // PROJMATRIX + VIEWMATRIX 
          }
        },
        {
          binding: 1,
          resource: {
              buffer: uBuffers.uniformBufferInversMatrix,
              offset: 0,
              size: 64 + 64 // PROJMATRIX + VIEWMATRIX 
          }
        },
        {
          binding: 2,
          resource: {
              buffer: uBuffers.uniformCommon,
              offset: 0,
              size: 16 // cameraPosition 
          }
        }         
      ]
  }); 

  const uniformInstansPosition = device.createBindGroup({
    label : "uniformInstansPosition_RT",
    layout: pipeline.getBindGroupLayout(1),
    entries: [{
      binding: 0,
      resource: {
          buffer: uBuffers.instanceBufferPosition,
          offset: 0,
          size: (16) * instance_count// PROJMATRIX + VIEWMATRIX + MODELMATRIX + NORMALMATRIX// Каждая матрица занимает 64 байта
      }
    },    
    {
        binding: 1,
        resource: {
            buffer: uBuffers.instanceBufferRadius,
            offset: 0,
            size: (4) * instance_count// PROJMATRIX + VIEWMATRIX + MODELMATRIX + NORMALMATRIX// Каждая матрица занимает 64 байта
        }
    }
    
  ]
}); 




    const depthTexture = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],    
      sampleCount, 
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });  
  
    const texture = device.createTexture({
      size: [canvas.width, canvas.height],  
      sampleCount,  
      format: format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const textureView = texture.createView();   
  
    pipeline.BindGroup = {
      uniformBindGroup,
      uniformInstansPosition
    };
   
    pipeline.depthTexture = depthTexture;
    pipeline.textureView = textureView;
  
    return { pipeline };
  
  }