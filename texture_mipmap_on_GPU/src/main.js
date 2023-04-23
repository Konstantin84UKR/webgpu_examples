
import * as Matrix from "./gl-matrix.js";

async function main() {
    ///**  Шейдеры тут все понятно более мение. */ 
    //   vUV vec2 вместо vColor vec4
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
          @location(0) vUV : vec2<f32>,
      };

      @vertex
        fn main(@location(0) pos: vec4<f32>, @location(1) uv: vec2<f32>) -> Output {
        
            var output: Output;
            output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
            output.vUV = uv;

            return output;
        }
    `,
      // Добавленны
      // texture_2d - данные самой текстуры
      // sampler - структура параметров обработки данных текстуры
      fragment: `
      @binding(1) @group(0) var Sampler : sampler;
      @binding(2) @group(0) var textureData : texture_2d<f32>;

      @fragment
      fn main(@location(0) vUV: vec2<f32>) -> @location(0) vec4<f32> {
      let textureColor:vec3<f32> = (textureSample(textureData, Sampler, vUV)).rgb;
      return vec4<f32>(textureColor, 1.0);
    }
    `,
    };

    //----------------------------------------------------
    const cube_vertex= new Float32Array([
      -1,-1,-1,    0,0,  // XYZ UV
      1,-1,-1,     1,0,
      1, 1,-1,     1,1,
      -1, 1,-1,    0,1,
  
      -1,-1, 1,    0,0,
      1,-1, 1,     1,0,
      1, 1, 1,     1,1,
      -1, 1, 1,    0,1,
  
      -1,-1,-1,    0,0,
      -1, 1,-1,    1,0,
      -1, 1, 1,    1,1,
      -1,-1, 1,    0,1,
  
      1,-1,-1,     0,0,
      1, 1,-1,     1,0,
      1, 1, 1,     1,1,
      1,-1, 1,     0,1,
  
      -1,-1,-1,    0,0,
      -1,-1, 1,    1,0,
      1,-1, 1,     1,1,
      1,-1,-1,     0,1,
  
      -1, 1,-1,    -0.2,-0.2,
      -1, 1, 1,    1.2,-0.2,
      1, 1, 1,     1.2,1.2,
      1, 1,-1,     -0.2,1.2
  
    ]);

    const cube_index = new Uint32Array([
      0,1,2,
      0,2,3,
  
      4,5,6,
      4,6,7,
  
      8,9,10,
      8,10,11,
  
      12,13,14,
      12,14,15,
  
      16,17,18,
      16,18,19,
  
      20,21,22,
      20,22,23
  
    ]);

    //---------------------------------------------------
  
    const canvas = document.getElementById("canvas-webgpu");
    canvas.width = 640;
    canvas.height = 480;

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
    const format = navigator.gpu.getPreferredCanvasFormat();  // формат данных в которых храняться пиксели в физическом устройстве 

    //** конфигурируем контекст подключаем логическое устройсво  */
    //** формат вывода */
    //** размер вывода */
    context.configure({
      device: device,
      format: format,
      size: size,
      compositingAlphaMode : "opaque",
    });


    //---create uniform data
   
    let MODELMATRIX = glMatrix.mat4.create();
    let VIEWMATRIX = glMatrix.mat4.create(); 
    let PROJMATRIX = glMatrix.mat4.create();
    
    glMatrix.mat4.translate(MODELMATRIX,MODELMATRIX,[0,0,5]);
    glMatrix.mat4.lookAt(VIEWMATRIX, [0.0, 0.0, 10.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

    glMatrix.mat4.identity(PROJMATRIX);
    let fovy = 40 * Math.PI / 180;
    glMatrix.mat4.perspective(PROJMATRIX, fovy, canvas.width/ canvas.height, 1, 50);

    //****************** BUFFER ********************//
    //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
    //** который будет в будушем загружен в данный буффер */
    //** указываем размер  буффера в байтах */
    //** usage ХЗ */
    //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
    //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */
    const vertexBuffer = device.createBuffer({
      size: cube_vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,//COPY_DST позволяет загружать данные
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(vertexBuffer.getMappedRange()).set(cube_vertex);
    // передаем буфер в управление ГПУ */
    vertexBuffer.unmap();

    const indexBuffer = device.createBuffer({
      size: cube_index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint32Array(indexBuffer.getMappedRange()).set(cube_index);
    indexBuffer.unmap();

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
            arrayStride: 4 * (3 + 2),
            attributes: [{
              shaderLocation: 0,
              format: "float32x3",
              offset: 0
            },
            {
              shaderLocation: 1,
              format: 'float32x2',
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
        depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
    }
    });

    // create uniform buffer and layout
    const uniformBuffer = device.createBuffer({
        size: 64 + 64 + 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });   

    //-------------------- TEXTURE ---------------------
    // //Создаем картинку и загрудаем в нее данные из файла
    // https://webgpufundamentals.org/webgpu/lessons/webgpu-textures.html
    // 
//  1) Создаем текстуру из файла картинки 
    async function createTextureFromImage(device, url, options) {
      const imgBitmap = await loadImageBitmap(url);
      return createTextureFromSource(device, imgBitmap, options);
    }
//  2) загружаем картинку с диска и создаем из нее Bitmap
    async function loadImageBitmap(url) {
      const res = await fetch(url);
      const blob = await res.blob();
      return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
    }
//  3) Создаем текстуру из источника
    function createTextureFromSource(device, source, options = {}) {
      const texture = device.createTexture({
        format: 'rgba8unorm',
        mipLevelCount: options.mips ? numMipLevels(source.width, source.height) : 1,
        size: [source.width, source.height],
        usage:  GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST | // мы можем писать данные в текстуру
                GPUTextureUsage.RENDER_ATTACHMENT, //// мы можем рендерить в текстуру
      });
      copySourceToTexture(device, texture, source, options);
      return texture;
    }
//  4) вычисляем необходимое количество мип урочней
    const numMipLevels = (...sizes) =>{
      const maxSize = Math.max(...sizes);
      return 1 + Math.log2(maxSize)|0;
    };
//  5) копируем данные из источника в текстуру (отправляем на GPU)
    function copySourceToTexture(device, texture, source, {flipY} = {}) {
      device.queue.copyExternalImageToTexture(
        { source, flipY, },
        { texture },
        { width: source.width, height: source.height },
      );

      if (texture.mipLevelCount > 1) {
        generateMips(device, texture);
      }
    }

//  6) Генерируем мип уровни
//  основная идея в том что бы нарисовать текстуру в источник ту же текстуру,
//  но следуюший мип уровень.
//  раньше мы всегда рендерили изображение в текстуру созданую констекстом канваса
//  сейчас мы не чего не выводим на канвас, а рендерим в память 
//  в данном случаи в текстуру и ее конкретный мип уровень
    const generateMips = (() => {
      let pipeline;
      let sampler;

      return function generateMips(device, texture) {
        if (!pipeline) {
          const module = device.createShaderModule({
            label: 'textured quad shaders for mip level generation',
            code: `
              struct VSOutput {
                @builtin(position) position: vec4f,
                @location(0) texcoord: vec2f,
              };

              @vertex fn vs(
                @builtin(vertex_index) vertexIndex : u32
              ) -> VSOutput {
                var pos = array<vec2f, 6>(

                  vec2f( 0.0,  0.0),  // center
                  vec2f( 1.0,  0.0),  // right, center
                  vec2f( 0.0,  1.0),  // center, top

                  // 2st triangle
                  vec2f( 0.0,  1.0),  // center, top
                  vec2f( 1.0,  0.0),  // right, center
                  vec2f( 1.0,  1.0),  // right, top
                );

                var vsOutput: VSOutput;
                let xy = pos[vertexIndex];
                vsOutput.position = vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
                vsOutput.texcoord = vec2f(xy.x, 1.0 - xy.y);
                return vsOutput;
              }

              @group(0) @binding(0) var ourSampler: sampler;
              @group(0) @binding(1) var ourTexture: texture_2d<f32>;

              @fragment fn fs(fsInput: VSOutput) -> @location(0) vec4f {
                return textureSample(ourTexture, ourSampler, fsInput.texcoord);
              }
            `,
          });
          pipeline = device.createRenderPipeline({
            label: 'mip level generator pipeline',
            layout: 'auto',
            vertex: {
              module,
              entryPoint: 'vs',
            },
            fragment: {
              module,
              entryPoint: 'fs',
              targets: [{ format: texture.format }],
            },
          });

          sampler = device.createSampler({
            minFilter: 'linear',
          });
        }

        const encoder = device.createCommandEncoder({
          label: 'mip gen encoder',
        });

        let width = texture.width;
        let height = texture.height;
        let baseMipLevel = 0;
        while (width > 1 || height > 1) {
          width = Math.max(1, width / 2 | 0);
          height = Math.max(1, height / 2 | 0);

          const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: sampler },
              { binding: 1, resource: texture.createView({baseMipLevel, mipLevelCount: 1}) },
            ],
          });

          ++baseMipLevel;

          const renderPassDescriptor = {
            label: 'our basic canvas renderPass',
            colorAttachments: [
              {
                view: texture.createView({baseMipLevel, mipLevelCount: 1}),
                clearValue: [0.3, 0.3, 0.3, 1],
                loadOp: 'clear',
                storeOp: 'store',
              },
            ],
          };
   
          const pass = encoder.beginRenderPass(renderPassDescriptor);
          pass.setPipeline(pipeline);
          pass.setBindGroup(0, bindGroup);
          pass.draw(6);  // call our vertex shader 6 times
          pass.end();
        }
   
        const commandBuffer = encoder.finish();
        device.queue.submit([commandBuffer]);
      };
    })();

    // Создаем sampler с параметрами обработки текстуры
    const sampler = device.createSampler({
      minFilter:'linear',
      magFilter:'linear',
      mipmapFilter : "linear", //nearest ???
      addressModeU: 'repeat',
      addressModeV: 'repeat'
    });
    
// Создаем саму текстуру и MipMap на GPU
// 1) Создаем текстуру из файла картинки 
// 2) загружаем картинку с диска и создаем из нее Bitmap 
// 3) Создаем текстуру из источника
// 4) вычисляем необходимое количество мип урочней
// 5) копируем данные из источника в текстуру (отправляем на GPU)
// 6) Генерируем мип уровни
    const texture =  await createTextureFromImage(device,
        './tex/uv.jpg', {mips: true, flipY: false});
//--------------------------------------------------

    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: {
                buffer: uniformBuffer,
                offset: 0,
                size: 64 + 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
          },
          { 
            binding: 1,
            resource: sampler
          },
          {
            binding: 2,
            resource: texture.createView() //  
          }
        ]
    });

    device.queue.writeBuffer(uniformBuffer, 0, PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffer, 64+64, MODELMATRIX); 

    const depthTexture = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });  

    const renderPassDescription = {
      colorAttachments: [
        {
          view: undefined,
          clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
          loadOp: 'clear',
          storeOp: "store", //ХЗ           
        },],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
         // stencilLoadValue: 0,
         // stencilStoreOp: "store"
      }
    };

// Animation   
let time_old=0; 
let angle = 0;
function frame(time) {
      
  //-----------------TIME-----------------------------
  //console.log(time);
      let dt=time-time_old;
      time_old=time;


      //------------------MATRIX EDIT---------------------
      // 
       //console.log(angle);
      // glMatrix.mat4.identity(MODELMATRIX);
       glMatrix.mat4.rotateY(MODELMATRIX, MODELMATRIX, dt * 0.0001);
       glMatrix.mat4.rotateX(MODELMATRIX, MODELMATRIX, dt * 0.0001);
       glMatrix.mat4.rotateZ(MODELMATRIX, MODELMATRIX, dt * 0.0001);
            
       //--------------------------------------------------

      device.queue.writeBuffer(uniformBuffer, 0, PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
      device.queue.writeBuffer(uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
      device.queue.writeBuffer(uniformBuffer, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();

      //renderPassDescription.colorAttachments[0].view = texture.createView({baseMipLevel:0, mipLevelCount: 1});
      renderPassDescription.colorAttachments[0].view = textureView;

      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);
      
      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setIndexBuffer(indexBuffer, "uint32");
      renderPass.setBindGroup(0, uniformBindGroup);
      //renderPass.draw(6, 1, 0, 0);
      renderPass.drawIndexed(cube_index.length);
      renderPass.end();
  
      device.queue.submit([commandEncoder.finish()]);


      window.requestAnimationFrame(frame);
    };
    frame(0);
  }

  main();