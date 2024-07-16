import { INSTANS_COUNT } from '../settings.js';

export async function initPipeline( scene, shaderMatCap) {
  
  //--------------------------------------------------

  scene.LAYOUT.cameraLayout = scene.device.createBindGroupLayout({
    label: 'cameraLayout',
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT ,
        buffer: {},
      }
    ],
  });

  scene.UNIFORM.BINDGROUP.uniformBindGroup_Camera = scene.device.createBindGroup({
    label: "uniformBindGroup_Camera",
    layout: scene.LAYOUT.cameraLayout, //scene.pipelines.pipeline_Render.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: scene.UNIFORM.uniformBufferCamera,
        offset: 0,
        size: 64 + 64 // PROJMATRIX + VIEWMATRIX // Каждая матрица занимает 64 байта
      }
    }]
  });


  // //----------------------------------------------------
  scene.LAYOUT.instanseLayout = scene.device.createBindGroupLayout({
    label: 'instanseLayout',
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {},
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {},
      },
    ],
  });  


  scene.UNIFORM.BINDGROUP.uniformBindGroup_Ball = scene.device.createBindGroup({
    label: "uniformBindGroup_Ball",
    layout: scene.LAYOUT.instanseLayout,//scene.pipelines.pipeline_Render.getBindGroupLayout(1),
    entries: [{
      binding: 0,
      resource: {
        buffer: scene.UNIFORM.uniformBufferBall,
        offset: 0,
        size: (64 + 16) * INSTANS_COUNT // MODELMATRIX // Каждая матрица занимает 64 байта
      }
    },
    {
      binding: 1,
      resource: scene.UNIFORM.sampler
    },
    {
      binding: 2,
      resource: scene.UNIFORM.texture.createView()
    }
    ]
  });

  //--------------------------------------------------
  scene.UNIFORM.BINDGROUP.uniformBindGroup_Plane = scene.device.createBindGroup({
    label: "uniformBindGroup_Plane",
    layout: scene.LAYOUT.instanseLayout, //scene.pipelines.pipeline_Render.getBindGroupLayout(1),
    entries: [{
      binding: 0,
      resource: {
        buffer: scene.UNIFORM.uniformBuffer_Plane,
        offset: 0,
        size: 80 // MODELMATRIX // Каждая матрица занимает 64 байта + 16 offset
      }
    },
    {
      binding: 1,
      resource: scene.UNIFORM.sampler
    },
    {
      binding: 2,
      resource: scene.UNIFORM.texture.createView()
    }
    ]
  });


  //--------------------------------------------------

  const pipelineLayoutRender = scene.device.createPipelineLayout({
    label: 'render Layouts',
    bindGroupLayouts: [scene.LAYOUT.cameraLayout, scene.LAYOUT.instanseLayout]
  });

  const pipeline = scene.device.createRenderPipeline({
    label: "pipeline for render",
    layout: pipelineLayoutRender,

    vertex: {
      module: scene.device.createShaderModule({
        code: shaderMatCap,
      }),
      entryPoint: "main_vertex",
      buffers: [
        {
          arrayStride: 4 * 3,
          attributes: [{
            shaderLocation: 0,
            format: "float32x3",
            offset: 0
          }]
        },
        {
          arrayStride: 4 * 2,
          attributes: [{
            shaderLocation: 1,
            format: "float32x2",
            offset: 0
          }]
        },
        {
          arrayStride: 4 * 3,
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
        code: shaderMatCap,
      }),
      entryPoint: "main_fragment",
      targets: [
        {
          format: scene.format,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list', //'point-list' 'line-list'  'line-strip' 'triangle-list'  'triangle-strip'   
      //cullMode: 'back',  //'back'  'front'  
      frontFace: 'ccw' //'ccw' 'cw'
    },
    depthStencil: {
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

  return { pipeline };

  }