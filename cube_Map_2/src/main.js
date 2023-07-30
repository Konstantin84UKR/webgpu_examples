
import { Camera } from '../../common/camera/camera.js';

import {
  mat4,
} from '../../common/wgpu-matrix.module.js';

async function main() {
    ///**  Шейдеры тут все понятно более мение. */  
    const shader = {
      vertex: `
      struct Uniform {
        pMatrix : mat4x4<f32>,
        vMatrix : mat4x4<f32>,
        mMatrix : mat4x4<f32>,
      };
      @binding(0) @group(0) var<uniform> uniforms : Uniform;
        
      struct Output {
          @builtin(position) Position : vec4<f32>,
          @location(0) fragUV : vec2<f32>,
          @location(1) fragPosition: vec4<f32>,
      };

      @vertex
        fn main(  @location(0) position : vec4<f32>,
                  @location(1) uv : vec2<f32>) -> Output {
                 
            var vMatrixWithOutTranslation : mat4x4<f32> = uniforms.vMatrix;
            vMatrixWithOutTranslation[3] = vec4<f32>(0.0, 0.0, 0.0, 1.0); 


            var output: Output;
            output.Position = uniforms.pMatrix * vMatrixWithOutTranslation * uniforms.mMatrix * position;
            output.fragUV = uv;
            output.fragPosition = position ;

            return output;
        }
    `,

      fragment: `
      @group(0) @binding(1) var mySampler: sampler;
      @group(0) @binding(2) var myTexture: texture_cube<f32>;
      
      @fragment
      fn main( @location(0) fragUV: vec2<f32>,
                @location(1) fragPosition: vec4<f32>) -> @location(0) vec4<f32> {
     
          var cubemapVec = fragPosition.xyz;
          return textureSample(myTexture, mySampler, cubemapVec);
    }
    `,
    };

    //----------------------------------------------------
  const cubeVertexSize = 4 * 10;
  const cubePositionOffset = 0;
  const cubeColorOffset = 4 * 4;
  const cubeUVOffset = 4 * 8;
  const cubeVertexCount = 36;    

  const cubeVertexArray = new Float32Array([
    1, -1, 1, 1,     1, 0, 1, 1,     1, 1,
    -1, -1, 1, 1,    0, 0, 1, 1,     0, 1,
    -1, -1, -1, 1,   0, 0, 0, 1,     0, 0,
    1, -1, -1, 1,    1, 0, 0, 1,     1, 0,
    1, -1, 1, 1,     1, 0, 1, 1,     1, 1,
    -1, -1, -1, 1,   0, 0, 0, 1,     0, 0,

    1, 1, 1, 1,      1, 1, 1, 1,     1, 1,
    1, -1, 1, 1,     1, 0, 1, 1,     0, 1,
    1, -1, -1, 1,    1, 0, 0, 1,     0, 0,
    1, 1, -1, 1,     1, 1, 0, 1,     1, 0,
    1, 1, 1, 1,      1, 1, 1, 1,     1, 1,
    1, -1, -1, 1,    1, 0, 0, 1,     0, 0,

    -1, 1, 1, 1,     0, 1, 1, 1,     1, 1,
    1, 1, 1, 1,      1, 1, 1, 1,     0, 1,
    1, 1, -1, 1,     1, 1, 0, 1,     0, 0,
    -1, 1, -1, 1,    0, 1, 0, 1,     1, 0,
    -1, 1, 1, 1,     0, 1, 1, 1,     1, 1,
    1, 1, -1, 1,     1, 1, 0, 1,     0, 0,

    -1, -1, 1, 1,    0, 0, 1, 1,     1, 1,
    -1, 1, 1, 1,     0, 1, 1, 1,     0, 1,
    -1, 1, -1, 1,    0, 1, 0, 1,     0, 0,
    -1, -1, -1, 1,   0, 0, 0, 1,     1, 0,
    -1, -1, 1, 1,    0, 0, 1, 1,     1, 1,
    -1, 1, -1, 1,    0, 1, 0, 1,     0, 0,

    1, 1, 1, 1,      1, 1, 1, 1,    1, 1,
    -1, 1, 1, 1,     0, 1, 1, 1,    0, 1,
    -1, -1, 1, 1,    0, 0, 1, 1,    0, 0,
    -1, -1, 1, 1,    0, 0, 1, 1,    0, 0,
    1, -1, 1, 1,     1, 0, 1, 1,    1, 0,
    1, 1, 1, 1,      1, 1, 1, 1,    1, 1,

    1, -1, -1, 1,    1, 0, 0, 1,    1, 1,
    -1, -1, -1, 1,   0, 0, 0, 1,    0, 1,
    -1, 1, -1, 1,    0, 1, 0, 1,    0, 0,
    1, 1, -1, 1,     1, 1, 0, 1,    1, 0,
    1, -1, -1, 1,    1, 0, 0, 1,    1, 1,
    -1, 1, -1, 1,    0, 1, 0, 1,    0, 0,
  ]);
  console.log('Vertices:', cubeVertexArray.length);

    //---------------------------------------------------
  
    const canvas = document.getElementById("canvas-webgpu");
    canvas.width = 1200;
    canvas.height = 800;

    // Получаем данные о физическом утсройстве ГПУ
    const adapter = await navigator.gpu.requestAdapter();
    //** Получаем данные о логическом устройсве ГПУ */
    //** Пока не понятно можно ли переключаться между разными физ устройсвами или создавать несколько логический устройств */
    const device = await adapter.requestDevice();
    //** Контектс канваса тут все ясно  */
    const context = canvas.getContext("webgpu");

    const devicePixelRatio = window.devicePixelRatio || 1;
    const size = [
      canvas.clientWidth * devicePixelRatio ,
      canvas.clientHeight * devicePixelRatio ,
    ];

    //const format = "bgra8unorm";
   const format = navigator.gpu.getPreferredCanvasFormat(); // формат данных в которых храняться пиксели в физическом устройстве 

    //** конфигурируем контекст подключаем логическое устройсво  */
    //** формат вывода */
    //** размер вывода */
    context.configure({
      device: device,
      format: format,
      size: size,
      compositingAlphaMode :"opaque",
    });


    //---create uniform data
   
    let MODELMATRIX = mat4.identity();
    let VIEWMATRIX = mat4.identity(); 
    let PROJMATRIX = mat4.identity();
    let VIEWMATRIX_SKYBOX = mat4.identity();

    let camera = new Camera(canvas); 
    
    //glMatrix.mat4.lookAt(VIEWMATRIX, [0.0, 0.0, 0.0], [0.0, 0.0, -1.0], [0.0, 1.0, 0.0]);

    // glMatrix.mat4.identity(PROJMATRIX);
    // let fovy = 40 * Math.PI / 180;
    // glMatrix.mat4.perspective(PROJMATRIX, fovy, canvas.width/ canvas.height, 1, 25);

    //****************** BUFFER ********************//
    //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
    //** который будет в будушем загружен в данный буффер */
    //** указываем размер  буффера в байтах */
    //** usage ХЗ */
    //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
    //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */
    const vertexBuffer = device.createBuffer({
      size: cubeVertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(vertexBuffer.getMappedRange()).set(cubeVertexArray);
    // передаем буфер в управление ГПУ */
    vertexBuffer.unmap();
 

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
        buffers: [
          {
            arrayStride: cubeVertexSize,
            attributes: [{
              shaderLocation: 0,
              format: "float32x4",
              offset: cubePositionOffset
            },
            {
              shaderLocation: 1,
              format: 'float32x2',
              offset: cubeUVOffset,
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
        cullMode: 'none',
      },
      depthStencil:{
        format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
        depthWriteEnabled: true, //вкл\выкл теста глубины 
        depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
    }
    });

    // create uniform buffer and layout
    const uniformBuffer = device.createBuffer({
        size: 256,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });   

    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

      //TEXTURE 
      //Создаем картинку и загрудаем в нее данные из файла
      
      const imgSrcs = [
        './tex/32_32/nx.png',
        './tex/32_32/px.png',
        './tex/32_32/py.png',
        './tex/32_32/ny.png',
        './tex/32_32/pz.png',
        './tex/32_32/nz.png'
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
          size: 256 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
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
          clearValue: {r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
          //loadValue: {r: 0.5, g: 0.5, b: 0.5, a: 1.0},
          loadOp: 'clear',        
          storeOp: "store", //ХЗ
        },],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          //depthLoadValue: 1.0,
          depthLoadOp :"clear",
          depthClearValue :1.0,
          depthStoreOp: "store",
         // stencilLoadValue: 0,
          //stencilStoreOp: "store",
          //stencilLoadOp: "clear"
          //tencilClearValue: 
      }
    };

    MODELMATRIX = mat4.scale( MODELMATRIX, [10.0, 10.0, 10.0]); 

     device.queue.writeBuffer(uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
     device.queue.writeBuffer(uniformBuffer, 64, camera.vMatrixRotOnly); // следуюшая записать в буфер с отступом (offset = 64)
     device.queue.writeBuffer(uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset
 
// Animation   
let time_old=0; 
  function animate(time) {
      
      //-----------------TIME-----------------------------
      //console.log(time);
      let dt=time-time_old;
      time_old=time;
      //--------------------------------------------------
      camera.setDeltaTime(dt);
      // //------------------MATRIX EDIT---------------------
     // MODELMATRIX = mat4.rotateY( MODELMATRIX, dt * 0.0001);
      //MODELMATRIX = mat4.rotateX(MODELMATRIX, dt * 0.0002 * Math.sin(time * 0.001));
    
      // //--------------------------------------------------
      device.queue.writeBuffer(uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
      device.queue.writeBuffer(uniformBuffer, 64, camera.vMatrix);
      device.queue.writeBuffer(uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset
 


      const commandEncoder = device.createCommandEncoder();
      textureView = context.getCurrentTexture().createView();
      renderPassDescription.colorAttachments[0].view = textureView;
 
      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);
      
      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setBindGroup(0, uniformBindGroup);
      renderPass.draw(cubeVertexCount);
      renderPass.end();
  
      device.queue.submit([commandEncoder.finish()]);


      requestAnimationFrame(animate);
    };
    animate(0);
  }

  main();