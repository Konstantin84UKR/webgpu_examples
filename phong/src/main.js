import {
  mat4, vec3,
} from './wgpu-matrix.module.js';
import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';

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
          @location(0) vPosition : vec4<f32>,
          @location(1) vUV : vec2<f32>,
          @location(2) vNormal : vec4<f32>,
      };

      @vertex
        fn main(@location(0) pos: vec4<f32>, @location(1) uv: vec2<f32>, @location(2) normal: vec3<f32>) -> Output {
           
            var output: Output;
            output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
            output.vPosition = uniforms.mMatrix * pos;
            output.vUV = uv;
            output.vNormal   =  uniforms.mMatrix * vec4<f32>(normal,1.0);

            return output;
        }
    `,

      fragment: `     
      @binding(1) @group(0) var textureSampler : sampler;
      @binding(2) @group(0) var textureData : texture_2d<f32>;   

      const PI : f32 = 3.1415926535897932384626433832795;  

      struct Uniforms {
        eyePosition : vec4<f32>,
        lightPosition : vec4<f32>,       
      };
      @binding(3) @group(0) var<uniform> uniforms : Uniforms;

      fn lin2rgb(lin: vec3<f32>) -> vec3<f32>{
        return pow(lin, vec3<f32>(1.0/2.2));
      }

      fn rgb2lin(rgb: vec3<f32>) -> vec3<f32>{
        return pow(rgb, vec3<f32>(2.2));
      }
    
      fn brdfPhong(lighDir: vec3<f32>, 
        viewDir: vec3<f32>, 
        halfDir: vec3<f32>, 
        normal: vec3<f32>,
        phongDiffuseColor: vec3<f32>,
        phongSpecularColor: vec3<f32>,
        phongShiniess:f32) -> vec3<f32>{
        
        var color : vec3<f32> =  phongDiffuseColor; 
        let specDot : f32 = max(dot(normal, halfDir),0.0);
        color +=  pow(specDot, phongShiniess) * phongSpecularColor;
        return color;  
      }

      fn modifiedPhongBRDF(lighDir: vec3<f32>, 
        viewDir: vec3<f32>, 
        halfDir: vec3<f32>, 
        normal: vec3<f32>,
        phongDiffuseColor: vec3<f32>,
        phongSpecularColor: vec3<f32>,
        phongShininess:f32) -> vec3<f32>{
        
        var color : vec3<f32> =  phongDiffuseColor / PI; 
        let specDot : f32 = max(dot(normal, halfDir),0.0);
        let normalization = (phongShininess + 2.0) / (2.0 * PI);
        color +=  pow(specDot, phongShininess) * normalization * phongSpecularColor;
        return color;  
      }
      
      @fragment
      fn main(@location(0) vPosition: vec4<f32>, @location(1) vUV: vec2<f32>, @location(2) vNormal:  vec4<f32>) -> @location(0) vec4<f32> {
        
        let specularColor:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
        let diffuseColor:vec3<f32> = vec3<f32>(0.25, 0.5, 0.2);
        let lightColor:vec3<f32> = vec3<f32>(0.6, 0.7, 0.8);
        let ambientColor:vec3<f32> = vec3<f32>(0.1, 0.1, 0.15);
        let shiniess = 100.0;
        let flux = 10.0;

        let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, vUV)).rgb;
      
        let N:vec3<f32> = normalize(vNormal.xyz);
        let L:vec3<f32> = normalize((uniforms.lightPosition).xyz - vPosition.xyz);
        let V:vec3<f32> = normalize((uniforms.eyePosition).xyz - vPosition.xyz);
        let H:vec3<f32> = normalize(L + V);
           

        let distlight = distance((uniforms.lightPosition).xyz, vPosition.xyz);     
        let R = length((uniforms.lightPosition).xyz - vPosition.xyz);               
    
        let ambient : vec3<f32> = rgb2lin(textureColor.rgb) * rgb2lin(ambientColor.rgb);

        let irradiance = flux / (4.0 * PI * distlight * distlight) * max(dot(N,L), 0.0); // pointLight       
        //let irradiance : f32 = 1.0 * max(dot(N, L), 0.0); // sun

        let brdf = brdfPhong(L,V,H,N, rgb2lin(textureColor), rgb2lin(specularColor),shiniess);

        var radiance = brdf * irradiance * rgb2lin(lightColor.rgb) + ambient;

        let finalColor:vec3<f32> =  vec3<f32>(L.x,L.y,L.z); 
       
        //return vec4<f32>(finalColor, 1.0);            
        return vec4<f32>(lin2rgb(radiance), 1.0);
    }
    `,
    };


    const shaderForLigth = {
      vertex: `
      struct Uniform {
       pMatrix : mat4x4<f32>,
       vMatrix : mat4x4<f32>,
       mMatrix : mat4x4<f32>,      
      };
      @binding(0) @group(0) var<uniform> uniforms : Uniform;
         
      struct Output {
          @builtin(position) Position : vec4<f32>         
      };

      @vertex
        fn main(@location(0) pos: vec4<f32>) -> Output {
           
            var output: Output;
            output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
            return output;
        }
    `,

      fragment: `     
    
      @fragment
      fn main() -> @location(0) vec4<f32> {
      
        let finalColor:vec3<f32> =  vec3<f32>(0.9,0.9,0.9); 
        return vec4<f32>(finalColor, 1.0);            
       
    }
    `,
    };
    
    //---------------------------------------------------
    let CUBE = {}; 
    await loadJSON(CUBE,'./res/Model.json');
    
    let mesh = CUBE.mesh.meshes[0];

    const cube_vertex = new Float32Array(mesh.vertices);
    const cube_uv = new Float32Array(mesh.texturecoords[0]);
    const cube_index = new Uint32Array(mesh.faces.flat());
    const cube_normal = new Float32Array(mesh.normals);
   
    const meshSphereGeometry = new SphereGeometry(0.1, 16, 8);
    const sphere_vertex = new Float32Array(meshSphereGeometry.vertices);
    const sphere_index = new Uint32Array(meshSphereGeometry.indices);

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
      compositingAlphaMode: "opaque",

    });


    //---create uniform data
   
    let MODELMATRIX = mat4.identity();
    let VIEWMATRIX = mat4.identity(); 
    let PROJMATRIX = mat4.identity();
    let sphere_MODELMATRIX = mat4.identity();
  
    let eyePosition = [0.0, 1.0, 10.0];
    
    VIEWMATRIX =  mat4.lookAt(eyePosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

    let fovy = 40 * Math.PI / 180;
    PROJMATRIX = mat4.perspective(fovy, canvas.width/ canvas.height, 1, 25);

    let lightPosition = new Float32Array([0.0, 0.0, 1.0, 1.0]);

    //****************** BUFFER ********************//
    //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
    //** который будет в будушем загружен в данный буффер */
    //** указываем размер  буффера в байтах */
    //** usage ХЗ */
    //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
    //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */
    //****************** BUFFER  vertexBuffer
    const vertexBuffer = device.createBuffer({
      size: cube_vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });  
   
    //загружаем данные в буффер */
    new Float32Array(vertexBuffer.getMappedRange()).set(cube_vertex);
    // передаем буфер в управление ГПУ */
    vertexBuffer.unmap();

    //****************** BUFFER  uvBuffer
    const uvBuffer = device.createBuffer({
      size: cube_uv.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(uvBuffer.getMappedRange()).set(cube_uv);
    // передаем буфер в управление ГПУ */
    uvBuffer.unmap();

   //****************** BUFFER  normalBuffer
    const normalBuffer = device.createBuffer({
      size: cube_normal.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(normalBuffer.getMappedRange()).set(cube_normal);
    // передаем буфер в управление ГПУ */
    normalBuffer.unmap();

   //****************** BUFFER  indexBuffer
    const indexBuffer = device.createBuffer({
      size: cube_index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint32Array(indexBuffer.getMappedRange()).set(cube_index);
    indexBuffer.unmap();

    //****************** BUFFER  SphereGeometry ***************************************
    //****************** BUFFER  vertexBuffer
     const sphere_vertexBuffer = device.createBuffer({
      size: sphere_vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });  
     //загружаем данные в буффер */
     new Float32Array(sphere_vertexBuffer.getMappedRange()).set(sphere_vertex);
     // передаем буфер в управление ГПУ */
     sphere_vertexBuffer.unmap();
    //****************** BUFFER  indexBuffer
    const sphere_indexBuffer = device.createBuffer({
      size: sphere_index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint32Array(sphere_indexBuffer.getMappedRange()).set(sphere_index);
    sphere_indexBuffer.unmap();

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

    const fragmentUniformBuffer = device.createBuffer({
      size: 16+16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    //----------------- Sphere -------------------
    const pipelineSphere = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: device.createShaderModule({
          code: shaderForLigth.vertex,
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
          }
      ]
      },
      fragment: {
        module: device.createShaderModule({
          code: shaderForLigth.fragment,
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
    const sphere_uniformBuffer = device.createBuffer({
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
        entries: [
          {
            binding: 0,
            resource: {
                buffer: uniformBuffer,
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
                buffer: fragmentUniformBuffer,
                offset: 0,
                size: 16 + 16 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
            }
          }
        ]
    });

    const sphere_uniformBindGroup = device.createBindGroup({
      layout: pipelineSphere.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
              buffer: sphere_uniformBuffer,
              offset: 0,
              size: 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
          }
        }
      ]
  });



    device.queue.writeBuffer(uniformBuffer, 0, PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffer, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset
    //device.queue.writeBuffer(uniformBuffer, 64+64+64, NORMALMATRIX); // и так дале прибавляем 64 к offset

    device.queue.writeBuffer(fragmentUniformBuffer, 0, new Float32Array(eyePosition,1.0));
    device.queue.writeBuffer(fragmentUniformBuffer,16, lightPosition);

    device.queue.writeBuffer(sphere_uniformBuffer, 0, PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(sphere_uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
    sphere_MODELMATRIX = mat4.translate(sphere_MODELMATRIX,lightPosition);
    device.queue.writeBuffer(sphere_uniformBuffer, 64+64, sphere_MODELMATRIX); // и так дале прибавляем 64 к offset


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
 async function animate(time) {
      
      //-----------------TIME-----------------------------
      //console.log(time);
      let dt=time-time_old;
      time_old=time;
      //--------------------------------------------------
     
      //------------------MATRIX EDIT---------------------
      // MODELMATRIX = mat4.rotateX(MODELMATRIX, dt * 0.0002);
      // MODELMATRIX = mat4.rotateX(MODELMATRIX, dt * 0.0002);
      // MODELMATRIX = mat4.rotateZ(MODELMATRIX, dt * 0.0002);
            
      // glMatrix.mat4.identity(NORMALMATRIX);
      // glMatrix.mat4.invert(NORMALMATRIX,MODELMATRIX);
      // glMatrix.mat4.transpose(NORMALMATRIX,NORMALMATRIX);
      lightPosition[0] = (Math.sin(time * 0.001) - 0.0) * 4.0; 
      //lightPosition[1] = (Math.sin(time * 0.001) - 0.5) * 2.0; 
      //lightPosition[0] = 0;
      mat4.identity(sphere_MODELMATRIX,sphere_MODELMATRIX);
      sphere_MODELMATRIX = mat4.translate(sphere_MODELMATRIX, lightPosition);
      //--------------------------------------------------

      // device.queue.writeBuffer(uniformBuffer, 0, PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
      // device.queue.writeBuffer(uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
      device.queue.writeBuffer(uniformBuffer, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset
     //device.queue.writeBuffer(uniformBuffer, 64+64+64, NORMALMATRIX); // и так дале прибавляем 64 к offset
      device.queue.writeBuffer(fragmentUniformBuffer,16, lightPosition);
      device.queue.writeBuffer(sphere_uniformBuffer, 64+64, sphere_MODELMATRIX); // и так дале прибавляем 64 к offset


      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();
      renderPassDescription.colorAttachments[0].view = textureView;
  
      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);
      
      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setVertexBuffer(1, uvBuffer);
      renderPass.setVertexBuffer(2, normalBuffer);
      renderPass.setIndexBuffer(indexBuffer, "uint32");
      renderPass.setBindGroup(0, uniformBindGroup);
      renderPass.drawIndexed(cube_index.length);
      //renderPass.end();

      renderPass.setPipeline(pipelineSphere);
      renderPass.setVertexBuffer(0, sphere_vertexBuffer);
      renderPass.setIndexBuffer(sphere_indexBuffer, "uint32");
      renderPass.setBindGroup(0, sphere_uniformBindGroup);
      renderPass.drawIndexed(sphere_index.length);
      renderPass.end();
  
      device.queue.submit([commandEncoder.finish()]);


      window.requestAnimationFrame(animate);
    };
    animate(0);
  }

  main();