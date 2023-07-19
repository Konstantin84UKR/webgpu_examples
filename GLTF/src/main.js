
import {
  mat4,
} from './wgpu-matrix.module.js';
console.log(mat4);

import { gltfLoader } from './gltfLoader.js';

console.log(gltfLoader);



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

async function LoadJSONUsingPromise(URL) {

  let response = await fetch(URL).then(response=>{
    return response.json();
  });
  
  return response;
}

// function _base64ToArrayBuffer(base64) {
//   var binary_string = window.atob(base64);
//   var len = binary_string.length;
//   var bytes = new Uint8Array(len);
//   for (var i = 0; i < len; i++) {
//     bytes[i] = binary_string.charCodeAt(i);
//   }
//   return bytes.buffer;
// }

// function getArrayBufferForGltfBuffer(gltf, bufferIndex){
    
//   const buffer_STRING = gltf.buffers[bufferIndex];
//   const bufferRAW = buffer_STRING.uri.split(",");

//   const dataBin = _base64ToArrayBuffer(bufferRAW[1])
  
//   return dataBin;
// }

// function createVertexBufferForBufferView(device, gltf, bufferView, IND ) {
//   const buffer = getArrayBufferForGltfBuffer(gltf,bufferView.buffer);

//   if (IND == false ){
//       const gpuBuffer = device.createBuffer({
//       size: Math.ceil(bufferView.byteLength / 4) * 4,
//       usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
//       mappedAtCreation: true,
//     });

//     const gpuBufferArray = new Uint8Array(gpuBuffer.getMappedRange());
//     gpuBufferArray.set(new Uint8Array(buffer, bufferView.byteOffset, bufferView.byteLength));
//     gpuBuffer.unmap()

//     return gpuBuffer;
//   }else{
//     const gpuBuffer = device.createBuffer({
//     size: Math.ceil(bufferView.byteLength/4)*4,
//     usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
//     mappedAtCreation: true,
//   });

//     const gpuBufferArray = new Uint8Array(gpuBuffer.getMappedRange());
//     gpuBufferArray.set(new Uint8Array(buffer, bufferView.byteOffset, bufferView.byteLength));
//     gpuBuffer.unmap()

//     return gpuBuffer;
//   }


// }


async function main() {

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
    canvas.clientWidth * devicePixelRatio,
    canvas.clientHeight * devicePixelRatio,
  ];



  //const format = "bgra8unorm";
  const format = navigator.gpu.getPreferredCanvasFormat();  // формат данных в которых храняться пиксели в физическом устройстве 

  //** конфигурируем контекст подключаем логическое устройсво  */
  //** формат вывода */
  //** размер вывода */
  const sampleCount = 4;
  context.configure({
    device: device,
    format: format,
    size: size,
    compositingAlphaMode: "opaque",
  });

    ///**  Шейдеры тут все понятно более мение. */  
    const shader = 
       `
      struct Uniform {
       pMatrix : mat4x4<f32>,
       vMatrix : mat4x4<f32>,
       mMatrix : mat4x4<f32>,
      };
      @binding(0) @group(0) var<uniform> uniforms : Uniform;
         
      struct Output {
          @builtin(position) Position : vec4<f32>,
          @location(0) vUV : vec2<f32>,
          @location(1) vNormal : vec3<f32>,
      };

      @vertex
        fn main_vertex(@location(0) pos: vec4<f32>, @location(1) uv: vec2<f32>, @location(2) normal: vec3<f32>) -> Output {
           
            var output: Output;
            output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
            output.vUV = uv;
            output.vNormal = normalize((uniforms.mMatrix * vec4<f32>(normal, 0.0)).xyz); // Normal in model space

            return output;
        }
   
      @binding(1) @group(0) var textureSampler : sampler;
      @binding(2) @group(0) var textureData : texture_2d<f32>;

      @fragment
      fn main_fragment(@location(0) vUV: vec2<f32>, @location(1) vNormal: vec3<f32>) -> @location(0) vec4<f32> {
      
      // Move normal to view space
      var muv : vec2<f32> = (uniforms.vMatrix * vec4<f32>(normalize(vNormal), 0.0)).xy * 0.5 + vec2<f32>(0.5, 0.5);
      // read texture inverting Y value
      let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, vec2<f32>(muv.x, 1.0 - muv.y))).rgb;
      return vec4<f32>(textureColor, 1.0);
    }`;


    //gltf
    let gltf = await LoadJSONUsingPromise('./res/dog.gltf');
    //gltf = JSON.parse(gltf);
    
    const gltfModel = new gltfLoader(device,gltf);
    console.log(gltfModel.gltf);


    gltfModel.getMesh();
    
      
    
   

    //---------------------------------------------------
    let CUBE = {}; 
    //await loadJSON(CUBE,'./res/cube.json');
    //await loadJSON(CUBE,'./res/Model.json');
    //await loadJSON(CUBE,'./res/teapot.json');

    //let mesh = CUBE.mesh.meshes[0];

    //  const cube_vertex = new Float32Array(mesh.vertices);
    //  const cube_uv = new Float32Array(mesh.texturecoords[0]);
    //  const cube_normal = new Float32Array(mesh.normals);
    //  const cube_index = new Uint32Array(mesh.faces.flat());
    //---------------------------------------------------



  
   


    //---create uniform data
   
    let MODELMATRIX = mat4.identity();
    let VIEWMATRIX = mat4.identity(); 
    let PROJMATRIX = mat4.identity();
    
    VIEWMATRIX = mat4.lookAt([0.0, 0.0, 10.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
  
    let fovy = 40 * Math.PI / 180;
    PROJMATRIX = mat4.perspective(fovy, canvas.width/ canvas.height, 1, 500);

    //****************** BUFFER ********************//
    //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
    //** который будет в будушем загружен в данный буффер */
    //** указываем размер  буффера в байтах */
    //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
    //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */
    
    const modelBufferData = gltfModel.meshes[0].data;

    let vertexBuffer = modelBufferData.attribute_POSITION.gpuBufferData;
    let uvBuffer = modelBufferData.attribute_TEXCOORD_0.gpuBufferData;
    let normalBuffer = modelBufferData.attribute_NORMAL.gpuBufferData;
    let indexBuffer = modelBufferData.indices_indices.gpuBufferData;

    //*********************************************//
    //** настраиваем конвейер рендера 
    //** настраиваем шейдеры указав исходник,точку входа, данные буферов
    //** arrayStride количество байт на одну вершину */
    //** attributes настриваем локацию формат и отступ от начала  arrayStride */
    //** primitive указываем тип примитива для отрисовки*/
    //** depthStencil настраиваем буффер глубины*/
    const pipeline = device.createRenderPipeline({
      label: "pipeline main",
      layout: "auto",
      vertex: {
        module: device.createShaderModule({
          code: shader,
        }),
        entryPoint: "main_vertex",
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
            },
            {
              arrayStride: 4*3,
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
          code: shader,
        }),
        entryPoint: "main_fragment",
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
      multisample: {
        count: sampleCount,
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
    img.src = './res/green.jpg'; //'./res/matcap8.jpg';
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
      sampleCount,
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });  
  
    const textureMSAA = device.createTexture({
      size: [canvas.width, canvas.height],
      sampleCount,
      format: format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const textureView = textureMSAA.createView();

    const renderPassDescription =  {
      colorAttachments: [
        {
          view: textureView, //  Assigned later
          resolveTarget: undefined,
          storeOp: "store", //ХЗ
          clearValue: {r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
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
      let dt = time - time_old;
      time_old = time;
      //--------------------------------------------------
     
      //------------------MATRIX EDIT---------------------
      MODELMATRIX = mat4.rotateY( MODELMATRIX, dt * 0.0002);
      MODELMATRIX = mat4.rotateX( MODELMATRIX, dt * 0.0001);
      MODELMATRIX = mat4.rotateZ( MODELMATRIX, dt * 0.0001);
      //--------------------------------------------------

      // device.queue.writeBuffer(uniformBuffer, 0, PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
      // device.queue.writeBuffer(uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
      device.queue.writeBuffer(uniformBuffer, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset

      const commandEncoder = device.createCommandEncoder();
         
      renderPassDescription.colorAttachments[0].resolveTarget = context.getCurrentTexture().createView();
  
      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setVertexBuffer(1, uvBuffer);
      renderPass.setVertexBuffer(2, normalBuffer);
      renderPass.setIndexBuffer(indexBuffer, "uint16");
      renderPass.setBindGroup(0, uniformBindGroup);
     
   renderPass.drawIndexed(modelBufferData.indices_indices.indexCount); //47232
      renderPass.end();
  
      device.queue.submit([commandEncoder.finish()]);


      window.requestAnimationFrame(animate);
    };
    animate(0);
  }

  main();


