
import {
  mat4, vec3,
} from './wgpu-matrix.module.js';

import { Camera } from '../../common/camera/camera.js';
import { initWebGPU } from './initWebGPU.js';
import { shaderPostEffect } from './shaders/shaderPostEffect.js';
import { shadergBufferPass } from './shaders/shadergBufferPass.js';
import { shaderDeferredRendering } from './shaders/shaderDeferredRendering.js';
import { initResurse } from './initResurse.js';
import { initPostEffect } from './initPostEffect.js';



async function initBuffers(device, model, plane) {
  //****************** BUFFER ********************//
  //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
  //** который будет в будушем загружен в данный буффер */
  //** указываем размер  буффера в байтах */
  //** usage ХЗ */
  //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
  //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */
  //****************** BUFFER  vertexBuffer
  const vertexBuffer = device.createBuffer({
    size: model.vertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });

  //загружаем данные в буффер */
  new Float32Array(vertexBuffer.getMappedRange()).set(model.vertex);
  // передаем буфер в управление ГПУ */
  vertexBuffer.unmap();

  model.vertexBuffer = vertexBuffer;

  //****************** BUFFER  uvBuffer
  const uvBuffer = device.createBuffer({
    size: model.uv.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });
  //загружаем данные в буффер */
  new Float32Array(uvBuffer.getMappedRange()).set(model.uv);
  // передаем буфер в управление ГПУ */
  uvBuffer.unmap();

  model.uvBuffer = uvBuffer;

  //****************** BUFFER  normalBuffer
  const normalBuffer = device.createBuffer({
    size: model.normal.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });
  //загружаем данные в буффер */
  new Float32Array(normalBuffer.getMappedRange()).set(model.normal);
  // передаем буфер в управление ГПУ */
  normalBuffer.unmap();

  model.normalBuffer = normalBuffer;

  //****************** BUFFER  indexBuffer
  const indexBuffer = device.createBuffer({
    size: model.index.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  new Uint32Array(indexBuffer.getMappedRange()).set(model.index);
  indexBuffer.unmap();

  model.indexBuffer = indexBuffer;

  //****************** PLANE
  const plane_vertexBuffer = device.createBuffer({
    size: plane.vertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });

  //загружаем данные в буффер */
  new Float32Array(plane_vertexBuffer.getMappedRange()).set(plane.vertex);
  // передаем буфер в управление ГПУ */
  plane_vertexBuffer.unmap();

  plane.plane_vertexBuffer = plane_vertexBuffer;

  //****************** BUFFER  uvBuffer
  const plane_uvBuffer = device.createBuffer({
    size: plane.uv.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });
  //загружаем данные в буффер */
  new Float32Array(plane_uvBuffer.getMappedRange()).set(plane.uv);
  // передаем буфер в управление ГПУ */
  plane_uvBuffer.unmap();

  plane.plane_uvBuffer = plane_uvBuffer;

  //****************** BUFFER  normalBuffer
  const plane_normalBuffer = device.createBuffer({
    size: plane.normal.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });
  //загружаем данные в буффер */
  new Float32Array(plane_normalBuffer.getMappedRange()).set(plane.normal);
  // передаем буфер в управление ГПУ */
  plane_normalBuffer.unmap();

  plane.plane_normalBuffer = plane_normalBuffer;

  //****************** BUFFER  indexBuffer
  const plane_indexBuffer = device.createBuffer({
    size: plane.index.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  new Uint32Array(plane_indexBuffer.getMappedRange()).set(plane.index);
  plane_indexBuffer.unmap();

  plane.plane_indexBuffer = plane_indexBuffer;
  //*********************************************//
  //** настраиваем конвейер рендера 
  //** настраиваем шейдеры указав исходник,точку входа, данные буферов
  //** arrayStride количество байт на одну вершину */
  //** attributes настриваем локацию формат и отступ от начала  arrayStride */
  //** primitive указываем тип примитива для отрисовки*/
  //** depthStencil настраиваем буффер глубины*/

  const uBiffers = {};

  // create uniform buffer and layout
  const uniformBuffer = device.createBuffer({
    size: 64 + 64 + 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  uBiffers.uniformBuffer = uniformBuffer;

  const fragmentUniformBuffer = device.createBuffer({
    size: 16 + 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  uBiffers.fragmentUniformBuffer = fragmentUniformBuffer;

  const fragmentUniformBuffer1 = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  uBiffers.fragmentUniformBuffer1 = fragmentUniformBuffer1;

  const uniformBuffershadow = device.createBuffer({
    size: 64 + 64 + 64 + 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  uBiffers.uniformBuffershadow = uniformBuffershadow;

  const uniformBufferModel = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  uBiffers.uniformBufferModel = uniformBufferModel;

  const uniformBufferModel_2 = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  uBiffers.uniformBufferModel_2 = uniformBufferModel_2;

  const uniformBufferCamera = device.createBuffer({
    size: 64 * 2,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  uBiffers.uniformBufferCamera = uniformBufferCamera;


  return { model, plane, uBiffers };
}

async function initPipeline(device, canvas, format, uBiffers, shader, texture, sampler) {


  // //shadowPipeline

  // TODO

  /////////////////////////////////////////////////////////////////////////////////////////////////////////

  // gBufferPipeline

  const bindGroupLayout_0_pipeline = device.createBindGroupLayout({
    label: 'bindGroupLayout_0_pipeline ',
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: {}
    }, {
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: {}
    }, {
      binding: 2,
      visibility: GPUShaderStage.FRAGMENT,
      texture: {}
    }, {
      binding: 3,
      visibility: GPUShaderStage.FRAGMENT,
      buffer: {}
    }, {
      binding: 4,
      visibility: GPUShaderStage.VERTEX,
      buffer: {}
    }]
  });

  const uniformBindGroup = device.createBindGroup({
    //layout: pipeline.getBindGroupLayout(0),
    label: 'uniformBindGroup ',
    layout: bindGroupLayout_0_pipeline,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uBiffers.uniformBuffer,
          offset: 0,
          size: 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
        }
      },
      {
        binding: 1,
        resource: sampler
      },
      {
        binding: 2,
        resource: texture.createView()
      },
      {
        binding: 3,
        resource: {
          buffer: uBiffers.fragmentUniformBuffer,
          offset: 0,
          size: 16 + 16 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
        }
      },
      {
        binding: 4,
        resource: {
          buffer: uBiffers.uniformBuffershadow,
          offset: 0,
          size: 64 + 64 + 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX + + MODELMATRIX_PLANE// Каждая матрица занимает 64 байта
        }
      }
    ]
  });

  const bindGroupLayout_2_pipeline = device.createBindGroupLayout({
    label: 'bindGroupLayout_2_pipeline ',
    entries: [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: {
        type: 'uniform'
      }
    }]
  });

  const uniformBindGroup2 = device.createBindGroup({
    label: 'uniformBindGroup2 ',
    //layout: pipeline.getBindGroupLayout(1),
    layout: bindGroupLayout_2_pipeline,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uBiffers.uniformBufferModel,
          offset: 0,
          size: 64  //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
        }
      }
    ]
  });

  const uniformBindGroup2_1 = device.createBindGroup({
    label: 'uniformBindGroup2_1 ',
    //layout: pipeline.getBindGroupLayout(1),
    layout: bindGroupLayout_2_pipeline,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uBiffers.uniformBufferModel_2,
          offset: 0,
          size: 64  //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
        }
      }
    ]
  });

  // GBuffer texture render targets
  const gBufferTexture2DFloat16 = device.createTexture({
    size: [canvas.width, canvas.height],
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    format: 'rgba16float',
  });
  const gBufferTextureAlbedo = device.createTexture({
    size: [canvas.width, canvas.height],
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    format: 'bgra8unorm',  // 'bgra8unorm'
  });
 
  // Эта теневая текстура для обычного теста глубины при рендере сцены.
  const depthTexture = device.createTexture({
    size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
  });


  const gBufferTexture = [
    gBufferTexture2DFloat16,
    gBufferTextureAlbedo,
    depthTexture,
  ];

  const pipelineLayout_pipeline = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout_0_pipeline, bindGroupLayout_2_pipeline]
  });

  const pipelineGBuffer = device.createRenderPipeline({
    label: 'pipeline ',
    layout: pipelineLayout_pipeline,
    vertex: {
      module: device.createShaderModule({
        code: shader.vertex,
      }),
      entryPoint: "main",
      buffers: [
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
      module: device.createShaderModule({
        code: shader.fragment,
      }),
      entryPoint: "main",
      targets: [
      {
        format: format,
      },
      {
        format: 'rgba16float',
      },
      {
        format: format,
      }
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
      //depthCompare: 'never' //'less' // greater
    }
  });

 

  pipelineGBuffer.BindGroup = {
    bindGroupLayout_0_pipeline,
    uniformBindGroup,
    bindGroupLayout_2_pipeline,
    uniformBindGroup2,
    uniformBindGroup2_1,
    pipelineLayout_pipeline
  };


  pipelineGBuffer.Depth = { depthTexture };

  pipelineGBuffer.gBufferTexture = gBufferTexture;

  //-------------------------------------------------------------------------------------------------------

  const gBufferTexturesBindGroupLayout = device.createBindGroupLayout({
    label: 'gBufferTexturesBindGroupLayout ',
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {
          sampleType: 'unfilterable-float',
        },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {
          sampleType: 'unfilterable-float',
        },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {
          sampleType: 'depth',
        },
      },
    ],
  });

  const gBufferTexturesBindGroup = device.createBindGroup({
    label: 'gBufferTexturesBindGroup ',
    layout: gBufferTexturesBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: gBufferTexture[0].createView() // normal
      },
      {
        binding: 1,
        resource: gBufferTexture[1].createView() // albedo
      },
      {
        binding: 2,
        resource: gBufferTexture[2].createView() // depth
      }
    ]
  });
  
  const gBufferUniformBindGroupLayout = device.createBindGroupLayout({
    entries: [
       {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {}
      },
    ],
  });

  const gBufferUniformBindGroup = device.createBindGroup({
    label: 'gBufferTexturesBindGroup ',
    layout: gBufferUniformBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uBiffers.fragmentUniformBuffer,
          offset: 0,
          //size: 16 + 16 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>; 
          size: 32 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
        }
      }
    ]
  });


  const gBufferCameraBindGroupLayout = device.createBindGroupLayout({
    label: 'gBufferCameraBindGroupLayout ',
    entries: [
       {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {}
      },
    ],
  });


  const gBufferCameraBindGroup = device.createBindGroup({
    label: 'gBufferCameraBindGroup ',
    layout: gBufferCameraBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uBiffers.uniformBufferCamera,
          offset: 0,
          size: 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
        }
      }
    ]
  });
  

  const pipeline = device.createRenderPipeline({
    label: 'pipeline2 ',
    layout: device.createPipelineLayout({
      label: 'gBuffer bindGroupLayouts ',
      bindGroupLayouts: [
        gBufferTexturesBindGroupLayout,
        gBufferUniformBindGroupLayout,
        gBufferCameraBindGroupLayout],
    }),
    vertex: {
      module: device.createShaderModule({
        code: shaderDeferredRendering.vertex
      }),
      entryPoint: "main"
    },
    fragment: {
      module: device.createShaderModule({
        code: shaderDeferredRendering.fragment
      }),
      entryPoint: "main",
      targets: [{
        format: format
      }]
    },
    primitive: {
      topology: "triangle-list", // что будем рисовать точки - треугольники - линии
    },
    // depthStencil: {
    //   format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus depth32float
    //   depthWriteEnabled: true, //вкл\выкл теста глубины 
    //   depthCompare: 'less' //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
    //   //depthCompare: 'never' //'less' // greater
    // }
  });

  pipeline.BindGroup = {
    gBufferTexturesBindGroup,
    gBufferUniformBindGroup,
    gBufferCameraBindGroup
  }

    // Эта теневая текстура для обычного теста глубины при рендере сцены.
    const depthTexture2 = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    pipeline.depthTexture = depthTexture2;

  return { pipelineGBuffer , pipeline};
}

async function main() {

  const canvas = document.getElementById("canvas-webgpu");
  canvas.width = 1200;
  canvas.height = 800;

  const { device, context, format, size,} = await initWebGPU(canvas);
  //---------------------------------------------------
  const { model, plane, texture, sampler } = await initResurse(device);
  //---------------------------------------------------
  const { uBiffers } = await initBuffers(device, model, plane);
  //---------------------------------------------------

  let MODELMATRIX = mat4.identity();
  let MODELMATRIX_PLANE = mat4.identity();
  let VIEWMATRIX = mat4.identity();
  let PROJMATRIX = mat4.identity();

  let VIEWMATRIX_SHADOW = mat4.identity();
  let PROJMATRIX_SHADOW = mat4.identity();

  VIEWMATRIX = mat4.lookAt([0.0, 5.0, 10.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

  PROJMATRIX = mat4.identity();
  let fovy = 40 * Math.PI / 180;
  PROJMATRIX = mat4.perspective(fovy, canvas.width / canvas.height, 1, 25);

  let camera = new Camera(canvas);
  camera.setPosition([0.0, 5.0, 8.0]);
  camera.setLook([0.0, -0.5, -1.0])

  let eyePosition = [10, 10, 10.0];
  VIEWMATRIX_SHADOW = mat4.lookAt(eyePosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
  PROJMATRIX_SHADOW = mat4.ortho(-6, 6, -6, 6, 1, 35);

  let lightPosition = new Float32Array([5.0, 5.0, 5.0]);

  const depthRangeRemapMatrix = mat4.identity();
  depthRangeRemapMatrix[10] = -1;
  depthRangeRemapMatrix[14] = 1;

  /////////////////////////////////////////////////////////////////////////////////////////////////////////

  const { pipelineGBuffer, pipeline } = await initPipeline(device, canvas, format, uBiffers, shadergBufferPass, texture, sampler);

  //Создать tекстуру для Рендера
  // Создаем саму текстуру
  const textureMainScene = device.createTexture({
    size: [canvas.width, canvas.height],
    format: format,
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  const renderGBufferPassDescription = {
    colorAttachments: [   
      {
        view: textureMainScene.createView(),

        clearValue: { r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
      {
        view: pipelineGBuffer.gBufferTexture[0].createView(),

        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
      {
        view: pipelineGBuffer.gBufferTexture[1].createView(),

        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      }
     // ,  
    
    ],

    depthStencilAttachment: {
      view: pipelineGBuffer.Depth.depthTexture.createView(),  // "Обычная" текстура глубины
      depthClearValue: 0.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
      // stencilLoadValue: 0,
      // stencilStoreOp: "store"
    }
  };

  //------
  const textureMainScene2 = device.createTexture({
    size: [canvas.width, canvas.height],
    format: format,
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  const renderPassDescription2 = {
    colorAttachments: [   
      {
        view: textureMainScene2.createView(),

        clearValue: { r: 0.3, g: 0.4, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      }    
    ],

    // depthStencilAttachment: {
    //   view: pipeline.depthTexture.createView(),  // "Обычная" текстура глубины
    //   depthClearValue: 0.0,
    //   depthLoadOp: 'clear',
    //   depthStoreOp: 'store',
    //   // stencilLoadValue: 0,
    //   // stencilStoreOp: "store"
    // }
  };

  const { pipeline_PostEffect } = await initPostEffect(device, canvas, format, shaderPostEffect, textureMainScene2, sampler);
  //-------------------------------------------------------------------------------------------------------

  device.queue.writeBuffer(uBiffers.uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)

  MODELMATRIX = mat4.translate(MODELMATRIX, vec3.set(0, 1.5, 0));

  device.queue.writeBuffer(uBiffers.uniformBufferModel, 0, MODELMATRIX); // и так дале прибавляем 64 к offset
  device.queue.writeBuffer(uBiffers.uniformBufferModel_2, 0, MODELMATRIX_PLANE); // и так дале прибавляем 64 к offset


  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array(camera.eye));
  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 16, lightPosition);

  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 0, PROJMATRIX_SHADOW); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uBiffers.uniformBuffershadow, 64, VIEWMATRIX_SHADOW); // следуюшая записать в буфер с отступом (offset = 64)

  device.queue.writeBuffer(uBiffers.fragmentUniformBuffer1, 0, new Float32Array(1.0, 1.0, 1.0));


  // Animation   
  let time_old = 0;
  async function animate(time) {

    //-----------------TIME-----------------------------
    //console.log(time);
    let dt = time - time_old;
    time_old = time;

    //--------------------------------------------------
    camera.setDeltaTime(dt);
    //------------------MATRIX EDIT---------------------
    MODELMATRIX = mat4.rotateY(MODELMATRIX, dt * 0.0002);
    // MODELMATRIX = mat4.rotateX( MODELMATRIX, dt * 0.0002);
    // MODELMATRIX = mat4.rotateZ( MODELMATRIX, dt * 0.0001);

    //--------------------------------------------------
    const reversZpMatrix = mat4.multiply(depthRangeRemapMatrix, camera.pMatrix);
    device.queue.writeBuffer(uBiffers.uniformBuffer, 0, reversZpMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uBiffers.uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)

    device.queue.writeBuffer(uBiffers.uniformBufferModel, 0, MODELMATRIX); // и так дале прибавляем 64 к offset
    device.queue.writeBuffer(uBiffers.fragmentUniformBuffer, 0, new Float32Array(camera.eye));

    const cameraViewProj =  mat4.multiply(reversZpMatrix, camera.vMatrix);
    const cameraInvViewProj = mat4.invert(cameraViewProj);
    device.queue.writeBuffer(uBiffers.uniformBufferCamera, 0, cameraViewProj);
    device.queue.writeBuffer(uBiffers.uniformBufferCamera, 64, cameraInvViewProj);


    const commandEncoder = device.createCommandEncoder();

    // SHADOW
    //TODO


    // MAIN 
    // const textureView = context.getCurrentTexture().createView();
    // renderPassDescription.colorAttachments[0].view = textureView;

    const renderGBufferPass = commandEncoder.beginRenderPass(renderGBufferPassDescription);

    renderGBufferPass.setPipeline(pipelineGBuffer);
    renderGBufferPass.setVertexBuffer(0, model.vertexBuffer);
    renderGBufferPass.setVertexBuffer(1, model.uvBuffer);
    renderGBufferPass.setVertexBuffer(2, model.normalBuffer);
    renderGBufferPass.setIndexBuffer(model.indexBuffer, "uint32");
    renderGBufferPass.setBindGroup(0, pipelineGBuffer.BindGroup.uniformBindGroup);
    //renderGBufferPassss.setBindGroup(1, pipeline.BindGroup.uniformBindGroup1);
    renderGBufferPass.setBindGroup(1, pipelineGBuffer.BindGroup.uniformBindGroup2);
    renderGBufferPass.drawIndexed(model.index.length);
    renderGBufferPass.setVertexBuffer(0, plane.plane_vertexBuffer);
    renderGBufferPass.setVertexBuffer(1, plane.plane_uvBuffer);
    renderGBufferPass.setVertexBuffer(2, plane.plane_normalBuffer);
    renderGBufferPass.setIndexBuffer(plane.plane_indexBuffer, "uint32");
    renderGBufferPass.setBindGroup(0, pipelineGBuffer.BindGroup.uniformBindGroup);
    //renderGBufferPassss.setBindGroup(1, pipeline.BindGroup.uniformBindGroup1);
    renderGBufferPass.setBindGroup(1, pipelineGBuffer.BindGroup.uniformBindGroup2_1);
    renderGBufferPass.drawIndexed(plane.index.length);
    renderGBufferPass.end();


    //RENDER 

    const renderPass = commandEncoder.beginRenderPass(renderPassDescription2);

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, pipeline.BindGroup.gBufferTexturesBindGroup);
    renderPass.setBindGroup(1, pipeline.BindGroup.gBufferUniformBindGroup);
    renderPass.setBindGroup(2, pipeline.BindGroup.gBufferCameraBindGroup);
    renderPass.draw(6);
    renderPass.end();


    // _PostEffect 
    const textureView_PostEffect = context.getCurrentTexture().createView(); // тектура к которой привязан контекст
    const renderPass_PostEffect = commandEncoder.beginRenderPass({  // натсраиваем проход рендера, подключаем текстуру канваса это значать выводлить результат на канвас
      colorAttachments: [{
        view: textureView_PostEffect,
        clearValue: { r: 0.3, g: 0.4, b: 0.4, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store' //хз
      }]
    });
    renderPass_PostEffect.setBindGroup(0, pipeline_PostEffect.BindGroup.bindGroup_PostEffect);
    renderPass_PostEffect.setPipeline(pipeline_PostEffect); // подключаем наш pipeline
    renderPass_PostEffect.draw(6);
    renderPass_PostEffect.end();

    device.queue.submit([commandEncoder.finish()]);


    window.requestAnimationFrame(animate);
  };
  animate(0);
}

main();