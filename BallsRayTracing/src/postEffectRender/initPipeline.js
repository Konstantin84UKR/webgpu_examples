export async function initPipeline(device, canvas, format, shader,sampleCount) {
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
  
  
    pipeline.BindGroup = {};
    pipeline.depthTexture = depthTexture;
    pipeline.textureView = textureView;
  
    return { pipeline };
  
  }