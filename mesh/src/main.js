
import * as Matrix from "./gl-matrix.js";

async function loadJSON(result,modelURL) {
  var xhr = new XMLHttpRequest();
  //var model;

  xhr.open('GET', modelURL, false);
  xhr.onload = function () {
      if (xhr.status != 200) {

          alert('LOAD' + xhr.status + ': ' + xhr.statusText);
      } else {

         result.mesh = JSON.parse(xhr.responseText);  
         //return  result;     
      }
  }
  xhr.send();
}


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

      fragment: `
      @binding(1) @group(0) var textureSampler : sampler;
      @binding(2) @group(0) var textureData : texture_2d<f32>;

      @fragment
      fn main(@location(0) vUV: vec2<f32>) -> @location(0) vec4<f32> {
      let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, vUV)).rgb;
      return vec4<f32>(textureColor, 1.0);
    }
    `,
    };

    //---------------------------------------------------
    let CUBE = {}; 
    //await loadJSON(CUBE,'./res/cube.json');
    await loadJSON(CUBE,'./res/Model.json');

    let mesh = CUBE.mesh.meshes[0];

     const cube_vertex = new Float32Array(mesh.vertices);
     const cube_uv = new Float32Array(mesh.texturecoords[0]);
     const cube_index = new Uint32Array(mesh.faces.flat());
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
    
    glMatrix.mat4.lookAt(VIEWMATRIX, [0.0, 0.0, 10.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

    glMatrix.mat4.identity(PROJMATRIX);
    let fovy = 40 * Math.PI / 180;
    glMatrix.mat4.perspective(PROJMATRIX, fovy, canvas.width/ canvas.height, 1, 25);

    //****************** BUFFER ********************//
    //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
    //** который будет в будушем загружен в данный буффер */
    //** указываем размер  буффера в байтах */
    //** usage ХЗ */
    //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
    //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */
    const vertexBuffer = device.createBuffer({
      size: cube_vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(vertexBuffer.getMappedRange()).set(cube_vertex);
    // передаем буфер в управление ГПУ */
    vertexBuffer.unmap();

    const uvBuffer = device.createBuffer({
      size: cube_uv.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(uvBuffer.getMappedRange()).set(cube_uv);
    // передаем буфер в управление ГПУ */
    uvBuffer.unmap();


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
              arrayStride: 4*3,
                  attributes: [{
                  shaderLocation: 0,
                  format: "float32x3",
                  offset: 0
                }] 
            },
            {
              arrayStride: 4*2,
                attributes: [{
                shaderLocation: 1,
                format: "float32x2",
                offset: 0
                }] 
            }
      ]     
      
      
      // buffers: [
      //   {
      //     arrayStride: 4*(3+2),
      //         attributes: [{
      //         shaderLocation: 0,
      //         format: "float32x3",
      //         offset: 0
      //       },{
              
      //           shaderLocation: 1,
      //           format: "float32x2",
      //           offset: 12
      //           }         
      //     ] 
      //   }
      //  ]   

      
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
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });   

    //-------------------- TEXTURE ---------------------
    let img = new Image();
    img.src = './res/uv.jpg'; //'./tex/yachik.jpg';
    await img.decode();
    
    const imageBitmap = await createImageBitmap(img);

    const sampler = device.createSampler({
      minFilter:'linear',
      magFilter:'linear',
      mipmapFilter : "nearest", //nearest
      addressModeU: 'repeat',
      addressModeV: 'repeat'
    });

    const texture = device.createTexture({
      size:[imageBitmap.width,imageBitmap.height,1],
      format:'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING |
             GPUTextureUsage.COPY_DST |
             GPUTextureUsage.RENDER_ATTACHMENT
    });

    device.queue.copyExternalImageToTexture(
      {source: imageBitmap},
      {texture: texture},
      [imageBitmap.width,imageBitmap.height]);
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
            resource: texture.createView()
          }
        ]
    });


    device.queue.writeBuffer(uniformBuffer, 0, PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffer, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset

    const depthTexture = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });  

    const renderPassDescription =  {
      colorAttachments: [
        {
          view: undefined, //  Assigned later
         // loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 }, //background color
          storeOp: "store", //ХЗ
          clearValue: {r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
          loadOp: 'clear',       
        },],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthLoadOp :"clear",
          depthClearValue :1.0,
          depthStoreOp: "store",
         // stencilLoadValue: 0,
         // stencilStoreOp: "store"
      }
    };


// Animation   
let time_old=0; 
 async function animate(time) {
      
      //-----------------TIME-----------------------------
      //console.log(time);
      let dt = time-time_old;
      time_old = time;
      //--------------------------------------------------
     
      //------------------MATRIX EDIT---------------------
      glMatrix.mat4.rotateY(MODELMATRIX, MODELMATRIX, dt * 0.001);
      glMatrix.mat4.rotateX(MODELMATRIX, MODELMATRIX, dt * 0.002);
      glMatrix.mat4.rotateZ(MODELMATRIX, MODELMATRIX, dt * 0.001);
      //--------------------------------------------------

      // device.queue.writeBuffer(uniformBuffer, 0, PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
      // device.queue.writeBuffer(uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
      device.queue.writeBuffer(uniformBuffer, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();
      renderPassDescription.colorAttachments[0].view = textureView;
  
      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);


      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setVertexBuffer(1, uvBuffer);
      renderPass.setIndexBuffer(indexBuffer, "uint32");
      renderPass.setBindGroup(0, uniformBindGroup);
      //renderPass.draw(6, 1, 0, 0);
      renderPass.drawIndexed(cube_index.length);
      renderPass.end();
  
      device.queue.submit([commandEncoder.finish()]);


      window.requestAnimationFrame(animate);
    };
    animate(0);
  }

  main();