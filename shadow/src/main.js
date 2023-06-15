import {
  mat4,
} from './wgpu-matrix.module.js';

import { Camera } from '../../common/camera/camera.js';

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
    const shaderShadow = {
      vertex: `  
      struct Uniform {
        pMatrix : mat4x4<f32>,
        vMatrix : mat4x4<f32>,
        mMatrix : mat4x4<f32>,      
      };

      @group(0) @binding(0) var<uniform> uniforms : Uniform;
      
      @vertex
        fn main(@location(0) pos: vec4<f32>, @location(1) uv: vec2<f32>, @location(2) normal: vec3<f32>) -> @builtin(position) vec4<f32> {
          return uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
       }`
    };
    
    const shader = {
      vertex: `
      struct Uniform {
       pMatrix : mat4x4<f32>,
       vMatrix : mat4x4<f32>,
       mMatrix : mat4x4<f32>,      
      };
      @binding(0) @group(0) var<uniform> uniforms : Uniform;

      struct UniformLight {
        pMatrix : mat4x4<f32>,
        vMatrix : mat4x4<f32>,
        mMatrix : mat4x4<f32>,      
       };
       @binding(4) @group(0) var<uniform> uniformsLight : UniformLight;
         
      struct Output {
          @builtin(position) Position : vec4<f32>,
          @location(0) fragPosition : vec3<f32>,
          @location(1) fragUV : vec2<f32>,
          @location(2) fragNormal : vec3<f32>,
          @location(3) shadowPos : vec3<f32>          
      };
     

      @vertex
        fn main(@location(0) pos: vec4<f32>, @location(1) uv: vec2<f32>, @location(2) normal: vec3<f32>) -> Output {
           
            var output: Output;
            output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
            output.fragPosition = (uniforms.mMatrix * pos).xyz;
            output.fragUV = uv;
            output.fragNormal  = (uniforms.mMatrix * vec4<f32>(normal,1.0)).xyz; 

            let posFromLight: vec4<f32> = uniformsLight.pMatrix * uniformsLight.vMatrix * uniformsLight.mMatrix * pos;
            // Convert shadowPos XY to (0, 1) to fit texture UV
            output.shadowPos = vec3<f32>(posFromLight.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5), posFromLight.z);

            return output;
        }
    `,

      fragment: `     
      @binding(1) @group(0) var textureSampler : sampler;
      @binding(2) @group(0) var textureData : texture_2d<f32>;   

      struct Uniforms {
        eyePosition : vec4<f32>,
        lightPosition : vec4<f32>,       
      };
      @binding(3) @group(0) var<uniform> uniforms : Uniforms;
     
      @binding(0) @group(1) var shadowMap : texture_depth_2d;  
      @binding(1) @group(1) var shadowSampler : sampler_comparison;
      @binding(2) @group(1) var<uniform> test : vec3<f32>;  
     

      @fragment
      fn main(@location(0) fragPosition: vec3<f32>,
       @location(1) fragUV: vec2<f32>, 
       @location(2) fragNormal: vec3<f32>,
       @location(3) shadowPos: vec3<f32>) -> @location(0) vec4<f32> {
        
        let specularColor:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);

        let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, fragUV)).rgb;
        
        var shadow : f32 = 0.0;
        // apply Percentage-closer filtering (PCF)
        // sample nearest 9 texels to smooth result
        let size = f32(textureDimensions(shadowMap).x);
        for (var y : i32 = -1 ; y <= 1 ; y = y + 1) {
            for (var x : i32 = -1 ; x <= 1 ; x = x + 1) {
                let offset = vec2<f32>(f32(x) / size, f32(y) / size);
                shadow = shadow + textureSampleCompare(
                    shadowMap, 
                    shadowSampler,
                    shadowPos.xy + offset, 
                    shadowPos.z - 0.005  // apply a small bias to avoid acne
                );
            }
        }
        shadow = shadow / 9.0;

      //   shadow = textureSampleCompare(
      //     shadowMap, 
      //     shadowSampler,
      //     shadowPos.xy, 
      //     shadowPos.z - 0.005  // apply a small bias to avoid acne
      // );;

        // let size = f32(textureDimensions(shadowMap).x);
      
        let N:vec3<f32> = normalize(fragNormal.xyz);
        let L:vec3<f32> = normalize((uniforms.lightPosition).xyz - fragPosition.xyz);
        let V:vec3<f32> = normalize((uniforms.eyePosition).xyz - fragPosition.xyz);
        let H:vec3<f32> = normalize(L + V);
      
        let diffuse:f32 = 0.8 * max(dot(N, L), 0.0);
        let specular = pow(max(dot(N, H),0.0),100.0);
        let ambient:vec3<f32> = vec3<f32>(test.x + 0.1, 0.2, 0.2);
      
        let finalColor:vec3<f32> =  textureColor * ( shadow * diffuse + ambient) + (specularColor * specular * shadow); 
        // let finalColor:vec3<f32> =  textureColor * (shadow * ambient); 
             
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

     let plane = CUBE.mesh.meshes[1];
     const plane_vertex = new Float32Array(plane.vertices);
     const plane_uv = new Float32Array(plane.texturecoords[0]);
     const plane_index = new Uint32Array(plane.faces.flat());
     const plane_normal = new Float32Array(plane.normals); 

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
    let MODELMATRIX_PLANE = mat4.identity();
    let VIEWMATRIX = mat4.identity(); 
    let PROJMATRIX = mat4.identity();

    let VIEWMATRIX_SHADOW = mat4.identity(); 
    let PROJMATRIX_SHADOW = mat4.identity();
        
    VIEWMATRIX = mat4.lookAt([0.0, 5.0, 10.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

    PROJMATRIX = mat4.identity();
    let fovy = 40 * Math.PI / 180;
    PROJMATRIX = mat4.perspective(fovy, canvas.width/ canvas.height, 1, 25);

    let camera = new Camera(canvas);
    camera.setPosition([0.0, 5.0, 10.0]);
        
    let eyePosition = [10, 10, 10.0];
    VIEWMATRIX_SHADOW = mat4.lookAt(eyePosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
    PROJMATRIX_SHADOW = mat4.ortho(-6, 6, -6, 6, 1, 35);
   
    let lightPosition = new Float32Array([5.0, 5.0, 5.0]);

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

    //****************** PLANE
    const plane_vertexBuffer = device.createBuffer({
      size: plane_vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });

    //загружаем данные в буффер */
    new Float32Array(plane_vertexBuffer.getMappedRange()).set(plane_vertex);
    // передаем буфер в управление ГПУ */
    plane_vertexBuffer.unmap();

    //****************** BUFFER  uvBuffer
    const plane_uvBuffer = device.createBuffer({
      size: plane_uv.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(plane_uvBuffer.getMappedRange()).set(plane_uv);
    // передаем буфер в управление ГПУ */
    plane_uvBuffer.unmap();

    //****************** BUFFER  normalBuffer
    const plane_normalBuffer = device.createBuffer({
      size: plane_normal.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(plane_normalBuffer.getMappedRange()).set(plane_normal);
    // передаем буфер в управление ГПУ */
    plane_normalBuffer.unmap();

    //****************** BUFFER  indexBuffer
    const plane_indexBuffer = device.createBuffer({
      size: plane_index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint32Array(plane_indexBuffer.getMappedRange()).set(plane_index);
    plane_indexBuffer.unmap();


    //*********************************************//
    //** настраиваем конвейер рендера 
    //** настраиваем шейдеры указав исходник,точку входа, данные буферов
    //** arrayStride количество байт на одну вершину */
    //** attributes настриваем локацию формат и отступ от начала  arrayStride */
    //** primitive указываем тип примитива для отрисовки*/
    //** depthStencil настраиваем буффер глубины*/

    const shadowPipeline = await device.createRenderPipeline({
      label: "shadow piplen",
      layout: "auto",
      vertex: {
        module: device.createShaderModule({
          code: shaderShadow.vertex,
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

    let shadowDepthTexture  = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    }); 

    let shadowDepthView = shadowDepthTexture.createView();

    const pipeline = device.createRenderPipeline({
      layout: 'auto',
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

    const depthTexture = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    }); 

    // create uniform buffer and layout
    const uniformBuffer = device.createBuffer({
        size: 64 + 64 + 64 + 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });   

    const fragmentUniformBuffer = device.createBuffer({
      size: 16+16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const fragmentUniformBuffer1 = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformBuffershadow = device.createBuffer({
      size: 64 + 64 + 64 + 64,
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
    const shadowGroup = device.createBindGroup({
        label: 'Group for shadowPass',
        layout: shadowPipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: {
              buffer: uniformBuffershadow,
              offset: 0,
              size: 64 + 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX +  MODELMATRIX_PLANE // Каждая матрица занимает 64 байта
          }
        }]
    })


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
          },
          {
            binding: 4,
            resource: {
                buffer: uniformBuffershadow,
                offset: 0,
              size: 64 + 64 + 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX + + MODELMATRIX_PLANE// Каждая матрица занимает 64 байта
            }
          }          
        ]
    });

    const uniformBindGroup1 = device.createBindGroup({
      label: 'uniform Bind Group1 ',
      layout: pipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 0,
          resource: shadowDepthView
        },
        { 
          binding: 1,
          resource: device.createSampler({
            compare: 'less',
          })
        },
        {
          binding: 2,
          resource: {
          buffer: fragmentUniformBuffer1,
          offset: 0,
          size: 16  //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
          }
        }          
      ]
  });


    device.queue.writeBuffer(uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffer, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset
    //device.queue.writeBuffer(uniformBuffer, 64+64+64, NORMALMATRIX); // и так дале прибавляем 64 к offset

    device.queue.writeBuffer(fragmentUniformBuffer, 0, new Float32Array(eyePosition));
    device.queue.writeBuffer(fragmentUniformBuffer,16, lightPosition);

    device.queue.writeBuffer(uniformBuffershadow, 0, PROJMATRIX_SHADOW); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffershadow, 64, VIEWMATRIX_SHADOW); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffershadow, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset

    device.queue.writeBuffer(fragmentUniformBuffer1, 0, new Float32Array(1.0,1.0,1.0));


    const renderPassDescription = {
      colorAttachments: [
        {
          view: undefined,
          clearValue: {r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
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

    const renderPassDescriptionShadow = {
      colorAttachments: [],
        depthStencilAttachment: {
          view: shadowDepthView,
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
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
      MODELMATRIX = mat4.rotateY( MODELMATRIX, dt * 0.0002);
      // MODELMATRIX = mat4.rotateX( MODELMATRIX, dt * 0.0002);
      // MODELMATRIX = mat4.rotateZ( MODELMATRIX, dt * 0.0001);

      //--------------------------------------------------

      device.queue.writeBuffer(uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
      device.queue.writeBuffer(uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
      device.queue.writeBuffer(uniformBuffer, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset
      device.queue.writeBuffer(uniformBuffershadow, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset


      const commandEncoder = device.createCommandEncoder();

      // SHADOW
    
      const renderPassShadow = commandEncoder.beginRenderPass(renderPassDescriptionShadow);
      renderPassShadow.setPipeline(shadowPipeline);
      renderPassShadow.setVertexBuffer(0, vertexBuffer);
      renderPassShadow.setVertexBuffer(1, uvBuffer);
      renderPassShadow.setVertexBuffer(2, normalBuffer);
      renderPassShadow.setIndexBuffer(indexBuffer, "uint32");
      renderPassShadow.setBindGroup(0, shadowGroup);
      renderPassShadow.drawIndexed(cube_index.length);
   
      renderPassShadow.setVertexBuffer(0, plane_vertexBuffer);
      renderPassShadow.setVertexBuffer(1, plane_uvBuffer);
      renderPassShadow.setVertexBuffer(2, plane_normalBuffer);
      renderPassShadow.setIndexBuffer(plane_indexBuffer, "uint32");
      renderPassShadow.setBindGroup(0, shadowGroup);
      renderPassShadow.drawIndexed(plane_index.length);

      renderPassShadow.end();
     // MAIN 

      const textureView = context.getCurrentTexture().createView();
      renderPassDescription.colorAttachments[0].view = textureView;  
    
      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);
      

      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setVertexBuffer(1, uvBuffer);
      renderPass.setVertexBuffer(2, normalBuffer);
      renderPass.setIndexBuffer(indexBuffer, "uint32");
      renderPass.setBindGroup(0, uniformBindGroup);
      renderPass.setBindGroup(1, uniformBindGroup1);
      renderPass.drawIndexed(cube_index.length);
    
      renderPass.setVertexBuffer(0, plane_vertexBuffer);
      renderPass.setVertexBuffer(1, plane_uvBuffer);
      renderPass.setVertexBuffer(2, plane_normalBuffer);
      renderPass.setIndexBuffer(plane_indexBuffer, "uint32");
      renderPass.setBindGroup(0, uniformBindGroup);
      renderPass.setBindGroup(1, uniformBindGroup1);
      renderPass.drawIndexed(plane_index.length);
      renderPass.end();
  
      device.queue.submit([commandEncoder.finish()]);


      window.requestAnimationFrame(animate);
    };
    animate(0);
  }

  main();