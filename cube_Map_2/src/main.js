import {
  mat4,
} from '../../common/wgpu-matrix.module.js';

import { Camera } from '../../common/camera/camera.js';
import { initWebGPU } from '../../common/initWebGPU.js';

async function main() {
  ///**  Шейдеры тут все понятно более мение. */  
  const shader = {
    vertex: `
      struct Output {
          @builtin(position) Position : vec4<f32>,
          @location(0) fragUV : vec2<f32>,
          @location(1) fragPosition: vec4<f32>,
      };

      @vertex
        fn main(@builtin(vertex_index) VertexIndex : u32) -> Output {
        
            const pos = array<vec2<f32>, 6>(
                vec2( 1.0,  1.0),  vec2(  1.0, - 1.0), vec2(- 1.0, - 1.0),
                vec2( 1.0,   1.0),  vec2(- 1.0, - 1.0), vec2(- 1.0, 1.0)            
            );
    
            const uv = array(
                vec2( 1.0,  0.0),  vec2( 1.0,  1.0), vec2( 0.0,  1.0),
                vec2( 1.0,  0.0),  vec2( 0.0,  1.0), vec2( 0.0,  0.0)            
            );


            var output: Output;         
            output.Position = vec4(pos[VertexIndex], 1.0, 1.0);
            output.fragUV = uv[VertexIndex];
            output.fragPosition = vec4(pos[VertexIndex], 1.0, 1.0);

            return output;
        }
    `,

    fragment: `
      @group(0) @binding(1) var mySampler: sampler;
      @group(0) @binding(2) var myTexture: texture_cube<f32>;

      struct Uniform {
        inversPVMatrix : mat4x4<f32>,
      };
      @binding(0) @group(0) var<uniform> uniformsInvers : Uniform;
      
      @fragment
      fn main( @location(0) fragUV: vec2<f32>,
                @location(1) fragPosition: vec4<f32>) -> @location(0) vec4<f32> {
     
          var cubemapVec2 = uniformsInvers.inversPVMatrix * fragPosition;
          var cubemapVec = fragPosition;
          var UVvec3 = normalize(cubemapVec2.xyz / cubemapVec2.w);
          return textureSample(myTexture, mySampler, UVvec3);
    }
    `,
  };

  //---------------------------------------------------
  // -- initWebGPU -- //
  const { device, context, format, size, canvas } = await initWebGPU();

  //---create uniform data
  let INVERSE_PV_MATRIX = mat4.identity();
  let camera = new Camera(canvas);

  //*********************************************//
  //** настраиваем конвейер рендера 
  //** настраиваем шейдеры указав исходник,точку входа, данные буферов
  //** arrayStride количество байт на одну вершину */
  //** attributes настриваем локацию формат и отступ от начала  arrayStride */
  //** primitive указываем тип примитива для отрисовки*/
  //** depthStencil настраиваем буффер глубины*/
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

  // create uniform buffer and layout
  const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  //TEXTURE 
  //Создаем картинку и загрудаем в нее данные из файла

  const imgSrcs = [
    './tex/nx.png',
    './tex/px.png',
    './tex/py.png',
    './tex/ny.png',
    './tex/pz.png',
    './tex/nz.png'
  ];

  const promises = imgSrcs.map(async (src) => {
    let img = new Image();
    img.src = src; //'./tex/yachik.jpg';
    await img.decode();
    return await createImageBitmap(img);
  });

  const imageBitmaps = await Promise.all(promises);

  // Создаем саму текстуру
  const texture = device.createTexture({
    size: [imageBitmaps[0].width, imageBitmaps[0].height, 6], //??
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
    dimension: '2d',
  });

  //передаем данные о текстуре и данных текстуры в очередь
  for (let i = 0; i < imageBitmaps.length; i++) {
    const imageBitmap = imageBitmaps[i];
    device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: texture, origin: [0, 0, i] },
      [imageBitmap.width, imageBitmap.height]);
  }


  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: uniformBuffer,
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

  let textureView = context.getCurrentTexture().createView();

  let depthTexture = device.createTexture({
    size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  });


  const renderPassDescription = {
    colorAttachments: [
      {
        view: textureView,
        //loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 }, //background color
        clearValue: { r: 0.0, g: 0.5, b: 0.3, a: 1.0 },
        //loadValue: {r: 0.5, g: 0.5, b: 0.5, a: 1.0},
        loadOp: 'clear',
        storeOp: "store", //ХЗ
      },],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      //depthLoadValue: 1.0,
      depthLoadOp: "clear",
      depthClearValue: 1.0,
      depthStoreOp: "store",
      // stencilLoadValue: 0,
      //stencilStoreOp: "store",
      //stencilLoadOp: "clear"
      //tencilClearValue: 
    }
  };


  mat4.mul(camera.pMatrix, camera.vMatrix, INVERSE_PV_MATRIX)
  device.queue.writeBuffer(uniformBuffer, 0, mat4.inverse(INVERSE_PV_MATRIX, INVERSE_PV_MATRIX)); // и так дале прибавляем 64 к offset

  // Animation   
  let time_old = 0;
  function animate(time) {

    //-----------------TIME-----------------------------
    //console.log(time);
    let dt = time - time_old;
    time_old = time;
    //--------------------------------------------------
    camera.setDeltaTime(dt);
    //------------------MATRIX EDIT---------------------
    mat4.mul(camera.pMatrix, camera.vMatrix, INVERSE_PV_MATRIX)
    device.queue.writeBuffer(uniformBuffer, 0, mat4.inverse(INVERSE_PV_MATRIX, INVERSE_PV_MATRIX)); // и так дале прибавляем 64 к offset

    const commandEncoder = device.createCommandEncoder();
    textureView = context.getCurrentTexture().createView();
    renderPassDescription.colorAttachments[0].view = textureView;

    const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, uniformBindGroup);
    renderPass.draw(6);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(animate);
  };
  animate(0);
}

main();