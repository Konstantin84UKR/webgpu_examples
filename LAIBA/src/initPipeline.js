

export async function initPipeline(scene, shaderText) {
  
  //--------------------------------------------------

  // //----------------------------------------------------
  
  for (let i = 0; i < scene.meshes.length; i++) {
    const mesh = scene.meshes[i];
    
    mesh.BINDGROUP.uniformBindGroup0 = scene.device.createBindGroup({
      label: "uniformBindGroup0",
      layout: scene.LAYOUT.phongShader,//scene.pipelines.pipeline_Render.getBindGroupLayout(1),
      entries: [{
        binding: 0,
        resource: {
          buffer: scene.UNIFORM.uniformBufferCamera,
          offset: 0,
          size: (64 + 64) // MODELMATRIX // Каждая матрица занимает 64 байта
        }
      },
      {
        binding: 1,
        resource: {
          buffer: mesh.UNIFORM.uniformMatrix,
          offset: 0,
          size: (64) // MODELMATRIX // Каждая матрица занимает 64 байта
        }
      },
      ]
    });
  

  mesh.BINDGROUP.uniformBindGroup1 = scene.device.createBindGroup({
    label: "phongShaderTextureindGroup",
    layout: scene.LAYOUT.phongShaderTexture,//scene.pipelines.pipeline_Render.getBindGroupLayout(1),
    entries: [
    {
      binding: 0,
      resource: scene.ASSETS.sampler
    },
    {
      binding: 1,
      resource: scene.ASSETS.texture.createView()
    },
    {
      binding: 2,
      resource: {
        buffer: scene.UNIFORM.fragmentUniformBuffer,
        offset: 0,
        size: (16 + 16)  // eyePosition - lightPosition // Каждая матрица занимает 64 байта
      }
    },
    ]
  });
}
  //--------------------------------------------------


  //--------------------------------------------------

  const pipelineLayoutRender = scene.device.createPipelineLayout({
    label: 'render Layouts',
    bindGroupLayouts: [scene.LAYOUT.phongShader, scene.LAYOUT.phongShaderTexture]
  });

  const pipeline = scene.device.createRenderPipeline({
    label: "pipeline for render",
    layout: pipelineLayoutRender,

    vertex: {
      module: scene.device.createShaderModule({
        code: shaderText.vertex,
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
        },
        {
            arrayStride: 8,
            attributes: [{
                shaderLocation: 1,
                format: "float32x2",
                offset: 0
            }]
         },
        {
            arrayStride: 12,
            attributes: [{
                shaderLocation: 2,
                format: "float32x3",
                offset: 0
            }]
        }
    ]
    },
    fragment: {
      module: scene.device.createShaderModule({
        code: shaderText.fragment,
      }),
      entryPoint: "main",
      targets: [
        {
          format: scene.format,
        },
      ],
    },
    primitive: {
      // topology: "line-list", 
      topology: "triangle-list",
      // topology: "point-list",
      // cullMode: 'back',  //'back'  'front'  
      frontFace: 'ccw' //'ccw' 'cw'
    },
    depthStencil:{
      format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
      depthWriteEnabled: true, //вкл\выкл теста глубины 
      depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
  }
  });
  // pipeline.layout = {
  //   cameraLayout : scene.LAYOUT.cameraLayout,
  //   instanseLayout: scene.LAYOUT.instanseLayout}

  // pipeline.BINDGROUPS = {
  //   Camera: scene.UNIFORM.BINDGROUP.uniformBindGroup_Camera,
  //   Ball :  scene.UNIFORM.BINDGROUP.uniformBindGroup_Ball,
  //   Plane:  scene.UNIFORM.BINDGROUP.uniformBindGroup_Plane};

  scene.PIPELINES.pipeline = pipeline;

  return { pipeline };

  }