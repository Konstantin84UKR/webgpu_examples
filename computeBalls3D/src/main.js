
import {
  mat4, vec3
} from './wgpu-matrix.module.js';
//console.log(mat4);

import { Camera } from '../../common/camera/camera.js';
console.log(Camera);
import { RectangleGeometry } from '../../common/primitives/RectangleGeometry.js';
import { BoxGeometry } from '../../common/primitives/BoxGeometry.js';
import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { CylinderGeometry } from '../../common/primitives/CylinderGeometry.js';
import { simulation } from './simulation.js';
import { Ray } from './Ray.js';

async function loadJSON(result, modelURL) {
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

async function init(canvas, adapter, device, context) {

  canvas = document.getElementById("canvas-webgpu");
  canvas.width = 480;
  canvas.height = 480;

  // Получаем данные о физическом утсройстве ГПУ
  adapter = await navigator.gpu.requestAdapter();
  device = await adapter.requestDevice();

  context = canvas.getContext("webgpu");

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
  context.configure({
    device: device,
    format: format,
    size: size,
    compositingAlphaMode: "opaque",
  });

  return {
    canvas, adapter, device, context, format
  }

}

function createBufferFromData(device,param){
  
  const vertexBuffer = device.createBuffer({
    size: param.vertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  можно писать в буффер
    mappedAtCreation: true
  });
  //загружаем данные в буффер */
  new Float32Array(vertexBuffer.getMappedRange()).set(param.vertex);
  vertexBuffer.unmap();

  const uvBuffer = device.createBuffer({
    size: param.uv.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST можно писать в буффер
    mappedAtCreation: true
  });
  //загружаем данные в буффер */
  new Float32Array(uvBuffer.getMappedRange()).set(param.uv);
  // передаем буфер в управление ГПУ */
  uvBuffer.unmap();

  const normalBuffer = device.createBuffer({
    label: "normalBuffer",
    size: param.normal.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });
  //загружаем данные в буффер */
  new Float32Array(normalBuffer.getMappedRange()).set(param.normal);
  // передаем буфер в управление ГПУ */
  normalBuffer.unmap();

  const indexBuffer = device.createBuffer({
    size: param.index.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  new Uint32Array(indexBuffer.getMappedRange()).set(param.index);
  indexBuffer.unmap();

  return {
    vertexBuffer, uvBuffer, normalBuffer, indexBuffer
  }

};

async function main() {
  // ---------------- INIT
  let canvas;
  let adapter;
  let device;
  let context;
  let format;

  ({ canvas, adapter, device, context, format } = await init(canvas, adapter, device, context, format));
  //render();

  ///**  Шейдеры тут все понятно более мение. */  
  const shaderMatCap =
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
          @location(2) dNormal : vec3<f32>,
      };

      @vertex
        fn main_vertex(@location(0) pos: vec4<f32>, @location(1) uv: vec2<f32>, @location(2) normal: vec3<f32>) -> Output {
           
            var output: Output;
            output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
            output.vUV = uv;
            output.vNormal = normalize((uniforms.mMatrix * vec4<f32>(normal, 0.0)).xyz); // Normal in model space
            output.dNormal = normal;

            return output;
        }
   
      @binding(1) @group(0) var textureSampler : sampler;
      @binding(2) @group(0) var textureData : texture_2d<f32>;

      @fragment
      fn main_fragment(@builtin(front_facing) is_front: bool,@location(0) vUV: vec2<f32>, @location(1) vNormal: vec3<f32>, @location(2) dNormal: vec3<f32>) -> @location(0) vec4<f32> {
      
      // Move normal to view space
      var muv : vec2<f32> = (uniforms.vMatrix * vec4<f32>(normalize(vNormal), 0.0)).xy * 0.5 + vec2<f32>(0.5, 0.5);
      // read texture inverting Y value
      let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, vec2<f32>(muv.x, 1.0 - muv.y))).rgb;
      //return vec4<f32>(textureColor, 1.0);
      //return vec4<f32>(vNormal, 1.0);

      if(is_front){
        return vec4<f32>(textureColor, 1.0);
      }else{
        return vec4<f32>(1.0, 0.0, 0.0, 1.0);
      }
      
    }`;

  // ---------------- INIT  MESH
  //const meshGeometry = new RectangleGeometry(2,2,1,1);
  //const meshGeometry = new BoxGeometry(4,8,4,1,1,1);
  //const meshGeometry = new SphereGeometry(2);
  //const meshGeometry = new SphereGeometry(2);
  const meshGeometry = new CylinderGeometry();

  const cube_vertex = new Float32Array(meshGeometry.vertices);
  const cube_uv = new Float32Array(meshGeometry.uvs);
  const cube_normal = new Float32Array(meshGeometry.normals);
  const cube_index = new Uint32Array(meshGeometry.indices);

  let MODELMATRIX_meshGeometry = mat4.identity();

  //---------------------------------------------------

  const meshPlane = new BoxGeometry(36, 36, 1, 1, 1,1);

  const plane_vertex = new Float32Array(meshPlane.vertices);
  const plane_uv = new Float32Array(meshPlane.uvs);
  const plane_normal = new Float32Array(meshPlane.normals);
  const plane_index = new Uint32Array(meshPlane.indices);

  let MODELMATRIX_meshPlane = mat4.identity();

  //---------------------------------------------------


  //---create uniform data
  let camera = new Camera(canvas, vec3.create(0.0, 0.0, 100.0), vec3.create(0.0, -0.0, -1.0));

 
  //****************** BUFFER ********************//
  //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
  //** который будет в будушем загружен в данный буффер */
  //** указываем размер  буффера в байтах */
  //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
  //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */

  const sphereByffers = createBufferFromData(device,{
    vertex: cube_vertex, uv: cube_uv, normal: cube_normal, index:cube_index
  });  
  
  const planeByffers = createBufferFromData(device, {
    vertex: plane_vertex, uv: plane_uv, normal: plane_normal, index: plane_index
  });  

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
      module: device.createShaderModule({
        code: shaderMatCap,
      }),
      entryPoint: "main_fragment",
      targets: [
        {
          format: format,
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

  // create uniform buffer and layout
  const uniformBuffer = device.createBuffer({
    size: 64 + 64 + 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  const uniformBuffer_Plane = device.createBuffer({
    size: 64 + 64 + 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  //-------------------- TEXTURE ---------------------
  let img = new Image();
  img.src = './res/green.jpg'; //'./res/matcap8.jpg';
  await img.decode();

  const imageBitmap = await createImageBitmap(img);

  const sampler = device.createSampler({
    minFilter: 'linear',
    magFilter: 'linear',
    mipmapFilter: "nearest", //nearest
    addressModeU: 'repeat',
    addressModeV: 'repeat'
  });

  const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture },
    [imageBitmap.width, imageBitmap.height]);


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

  //--------------------------------------------------
  const uniformBindGroup_Plane = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: uniformBuffer_Plane,
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


  // init BALLS 
  let ball = {
    mass: 1,
    position: vec3.set(-10, 10, 0),
    velosity: vec3.set(0.5, 0.5, 0.5),
    gravity: vec3.set(0, -0.01, 0),
    oldPosition: vec3.set(0, 0, 0),
    radius: 2
  }

  let ball2 = {
    mass: 1,
    position: vec3.set(1, 1, 0),
    velosity: vec3.set(0.5 * Math.random(), 0.5 + Math.random(), -0.5 * Math.random()),
    gravity: vec3.set(0, -0.01, 0),
    oldPosition: vec3.set(0, 0, 0),
    radius: 2
  }

  MODELMATRIX_meshGeometry = mat4.translate(MODELMATRIX_meshGeometry, ball.position);
  MODELMATRIX_meshPlane = mat4.rotateX(MODELMATRIX_meshPlane, Math.PI*-0.5);

  let r = new Ray(camera.eye, camera.front, canvas, camera);
  let p = r.at();
  console.log(p);
  /////////////////////////////////////////////////////////////////////////////////////////////////////////
  device.queue.writeBuffer(uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uniformBuffer, 64 + 64, MODELMATRIX_meshGeometry); // и так дале прибавляем 64 к offset

  device.queue.writeBuffer(uniformBuffer_Plane, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uniformBuffer_Plane, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uniformBuffer_Plane, 64 + 64, MODELMATRIX_meshPlane); // и так дале прибавляем 64 к offset


   // RENDER  SETTINGS
  const depthTexture = device.createTexture({
    size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  });

  const renderPassDescription = {
    colorAttachments: [
      {
        view: undefined, //  Assigned later
        storeOp: "store", //ХЗ
        clearValue: { r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
        loadOp: 'clear',
      },],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthLoadOp: "clear",
      depthClearValue: 1.0,
      depthStoreOp: "store",
      // stencilLoadValue: 0,
      // stencilStoreOp: "store"
    }
  };

  // RENDER   
  let time_old = 0;
  async function animate(time) {

    //-----------------TIME-----------------------------
    //console.log(time);
    let dt = time - time_old;
    time_old = time;
   
    //--------------SIMULATION--------------------------------
    ball = simulation(ball2, dt); 

    // let r = new Ray(camera.eye, camera.front, canvas);
    // r.origin = camera.eye;
    // r.dir = camera.front;
    let p = r.at();
    //console.log(p);
    //------------------MATRIX EDIT---------------------
    MODELMATRIX_meshGeometry = mat4.setTranslation(MODELMATRIX_meshGeometry, p);
    // MODELMATRIX_meshGeometry = mat4.setTranslation(MODELMATRIX_meshGeometry, ball.position);
    // MODELMATRIX_meshGeometry = mat4.rotateY(MODELMATRIX_meshGeometry, Math.PI * 0.0001 * dt );
    //--------------------------------------------------


    camera.setDeltaTime(dt);
    device.queue.writeBuffer(uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffer, 64 + 64, MODELMATRIX_meshGeometry); // и так дале прибавляем 64 к offset

    device.queue.writeBuffer(uniformBuffer_Plane, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffer_Plane, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffer_Plane, 64 + 64, MODELMATRIX_meshPlane); // и так дале прибавляем 64 к offset

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    renderPassDescription.colorAttachments[0].view = textureView;

    const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, sphereByffers.vertexBuffer);
    renderPass.setVertexBuffer(1, sphereByffers.uvBuffer);
    renderPass.setVertexBuffer(2, sphereByffers.normalBuffer);
    renderPass.setIndexBuffer(sphereByffers.indexBuffer, "uint32");
    renderPass.setBindGroup(0, uniformBindGroup);
    renderPass.drawIndexed(cube_index.length);

    renderPass.setVertexBuffer(0, planeByffers.vertexBuffer);
    renderPass.setVertexBuffer(1, planeByffers.uvBuffer);
    renderPass.setVertexBuffer(2, planeByffers.normalBuffer);
    renderPass.setIndexBuffer(planeByffers.indexBuffer, "uint32");
    renderPass.setBindGroup(0, uniformBindGroup_Plane);
    renderPass.drawIndexed(plane_index.length);

    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);

    window.requestAnimationFrame(animate);
  };
  animate(0);

}

main();