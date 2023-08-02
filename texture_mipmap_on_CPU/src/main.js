
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
      //let textureColor:vec3<f32> = (textureSampleLevel(textureData, Sampler, vUV, 1)).rgb;
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
      canvas.clientWidth * devicePixelRatio * 0.1,
      canvas.clientHeight * devicePixelRatio * 0.1,
    ];

    //const format = "bgra8unorm";
    const format = navigator.gpu.getPreferredCanvasFormat();  // формат данных в которых храняться пиксели в физическом устройстве 

    //** конфигурируем контекст подключаем логическое устройсво  */
    //** формат вывода */
    //** размер вывода */
    context.configure({
      device: device,
      format: format,
     // size: size,
      compositingAlphaMode : "opaque",
    });


    //---create uniform data
   
    let MODELMATRIX = glMatrix.mat4.create();
    let VIEWMATRIX = glMatrix.mat4.create(); 
    let PROJMATRIX = glMatrix.mat4.create();
    
    glMatrix.mat4.translate(MODELMATRIX,MODELMATRIX,[0,0,0]);
    glMatrix.mat4.lookAt(VIEWMATRIX, [0.0, 0.0, 6.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

    glMatrix.mat4.identity(PROJMATRIX);
    let fovy = 40 * Math.PI / 180;
    glMatrix.mat4.perspective(PROJMATRIX, fovy, canvas.width/ canvas.height, 1, 1000);

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
    
    const kTextureWidth = 16;
    const kTextureHeight = 16;
    const r = [255,   0,   0, 255];  // red
    const o = [255, 125,   0, 255];  // orangw
    const g = [0, 255,   0, 255];  // orangw
    const b = [  0,   0, 255, 255];  // blue
    const w = [ 255, 255, 255, 255];  // white
    const textureData = new Uint8Array([
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,  
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w,
      w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, w, 
    ].flat());

    let mipLevelData = [];
    mipLevelData.push(new Uint8Array([
      g, g,  g, g,  g, g,  g, g,
      g, g,  g, g,  g, g,  g, g,
      g, g,  g, g,  g, g,  g, g,
      g, g,  g, g,  g, g,  g, g,
      g, g,  g, g,  g, g,  g, g,
      g, g,  g, g,  g, g,  g, g,
      g, g,  g, g,  g, g,  g, g,
      g, g,  g, g,  g, g,  g ,g,
      g, g,  g, g,  g, g,  g, g,          
    ].flat()));

    
    mipLevelData.push(new Uint8Array([
      r, r, r, r,
      r, r, r, r,
      r, r, r, r,
      r, r, r, r      
    ].flat()));

    mipLevelData.push(new Uint8Array([
      o, o,
      o, o,      
    ].flat()));

    mipLevelData.push(new Uint8Array([
      b      
    ].flat()));


// math для генерации mipmap
    const lerp = (a, b, t) => a + (b - a) * t;
    const mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
    const bilinearFilter = (tl, tr, bl, br, t1, t2) => {
      const t = mix(tl, tr, t1);
      const b = mix(bl, br, t1);
      return mix(t, b, t2);
    };

    const createNextMipLevelRgba8Unorm = ({data: src, width: srcWidth, height: srcHeight}) => {
      // compute the size of the next mip
      const dstWidth = Math.max(1, srcWidth / 2 | 0);
      const dstHeight = Math.max(1, srcHeight / 2 | 0);
      const dst = new Uint8Array(dstWidth * dstHeight * 4);
  
      const getSrcPixel = (x, y) => {
        const offset = (y * srcWidth + x) * 4;
        return src.subarray(offset, offset + 4);
      };
   

      // for (let y = 0; y < dstHeight; ++y) {
      //   for (let x = 0; x < dstWidth; ++x) {

      //     // compute texcoord of the center of the destination texel
      //     const u = (x + 0.5) / dstWidth;
      //     const v = (y + 0.5) / dstHeight;
  
      //     // compute the same texcoord in the source - 0.5 a pixel
      //     const au = (u * srcWidth - 0.5);
      //     const av = (v * srcHeight - 0.5);
  
      //     // compute the src top left texel coord (not texcoord)
      //     const tx = au | 0;
      //     const ty = av | 0;
  
      //     // compute the mix amounts between pixels
      //     const t1 = au % 1;
      //     const t2 = av % 1;
  
      //     // get the 4 pixels
      //     const tl = getSrcPixel(tx, ty);
      //     const tr = getSrcPixel(tx + 1, ty);
      //     const bl = getSrcPixel(tx, ty + 1);
      //     const br = getSrcPixel(tx + 1, ty + 1);
  
      //     // copy the "sampled" result into the dest.
      //     const dstOffset = (y * dstWidth + x) * 4;
      //     //dst.set(bilinearFilter(tl, tr, bl, br, t1, t2), dstOffset);
      //     dst.set(mipLevelData[mipLevel], dstOffset);
      //   }
      // }
      
     
    
      return { data: dst, width: dstWidth, height: dstHeight };
    };

    const generateMips = (src, srcWidth, srcHeight) => {
      //const srcHeight = src.length / 4 / srcWidth;
    
      // populate with first mip level (base level)
      let mip = { data: src, width: srcWidth, height: srcHeight, };
      const mips = [mip];
  
      // while (mip.width > 1 || mip.height > 1) {
        
      //   mip = createNextMipLevelRgba8Unorm(mip);
      //   mips.push(mip);
      // }
      mip = { data: mipLevelData[0], width: 8, height: 8, };
      mips.push(mip);
      mip = { data: mipLevelData[1], width: 4, height: 4, };
      mips.push(mip);
      mip = { data: mipLevelData[2], width: 2, height: 2, };
      mips.push(mip);
      mip = { data: mipLevelData[3], width: 1, height: 1, };
      mips.push(mip);
     
      return mips;
    };

    const mips = generateMips(textureData, kTextureWidth, kTextureHeight);

    // Создаем sampler с параметрами обработки текстуры
    const sampler = device.createSampler({
      minFilter:'nearest',
      magFilter:'nearest', //['nearest', 'linear'];
      mipmapFilter : "linear", //linear mipmapFilter нужно генерить самому 
      addressModeU: 'repeat', //['repeat', 'clamp-to-edge'];
      addressModeV: 'repeat' 
    });
    
      // Создаем саму текстуру
    // const texture = device.createTexture({
    //   label: 'cheker from Uint8Array',
    //   size:[kTextureWidth,kTextureHeight],
    //   format:'rgba8unorm',
    //   usage: GPUTextureUsage.TEXTURE_BINDING |
    //          GPUTextureUsage.COPY_DST |
    //          GPUTextureUsage.RENDER_ATTACHMENT
    // });

    const texture = device.createTexture({
      label: 'cheker from Uint8Array',
      size: [mips[0].width,mips[0].height],
      format:'rgba8unorm',
      mipLevelCount: mips.length,
      usage:  GPUTextureUsage.TEXTURE_BINDING |
              GPUTextureUsage.COPY_DST |
              GPUTextureUsage.RENDER_ATTACHMENT
    });

    mips.forEach(({data,width,height}, mipLevel)=>{
      device.queue.writeTexture(
        { texture, mipLevel},
        data,
        { bytesPerRow: width * 4 },
        { width: width, height: height },
    );
    });
    //передаем данные о текстуре и данных текстуры в очередь
  //   device.queue.writeTexture(
  //     { texture },
  //     textureData,
  //     { bytesPerRow: kTextureWidth * 4 },
  //     { width: kTextureWidth, height: kTextureHeight },
  // );
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
            resource: texture.createView({baseMipLevel:0, mipLevelCount: 4})
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
      //--------------------------------------------------
     
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