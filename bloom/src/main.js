
import {
    mat4,
} from './wgpu-matrix.module.js';

async function loadJSON(result, modelURL) {
    var xhr = new XMLHttpRequest();
  
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

const webGPU_Start = async () => {

    // checkWebGPU // 
    if (!navigator.gpu) {
        console.log("Your current browser does not support WebGPU!");
        return;
    }

    const canvas = document.querySelector('#canvas-webgpu'); // получаем канвас
    const adapter = await navigator.gpu.requestAdapter(); // получаем физическое устройство ГПУ
    const device = await adapter.requestDevice(); // Получаем логическое устройство ГПУ
    const context = canvas.getContext("webgpu"); // Контекст Канваса

    const format = navigator.gpu.getPreferredCanvasFormat(); // формат данных в которых храняться пиксели в физическом устройстве 

    context.configure({
        device: device,
        format: format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
        size: [canvas.width, canvas.height],
        alphaMode: 'premultiplied',
    })

    ///

    // ************* LOAD RESOURCE *************
    let CUBE = {};
    await loadJSON(CUBE, './res/Model.json'); //'.../res/Model.json'

    const mesh = CUBE.mesh.meshes[0];
    const cube_vertex = new Float32Array(mesh.vertices);
    const cube_uv = new Float32Array(mesh.texturecoords[0]);
    const cube_index = new Uint32Array(mesh.faces.flat());
    const cube_normal = new Float32Array(mesh.normals);

    // const plane = CUBE.mesh.meshes[1];
    // const plane_vertex = new Float32Array(plane.vertices);
    // const plane_uv = new Float32Array(plane.texturecoords[0]);
    // const plane_index = new Uint32Array(plane.faces.flat());
    // const plane_normal = new Float32Array(plane.normals);

    let img = new Image();
    img.src = './res/uv.jpg'; //'./tex/yachik.jpg';
    await img.decode();
    
    const imageBitmap = await createImageBitmap(img);

    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear'
    })
    
    // ***********************************************
    // ****************** MAIN ***********************
    // ***********************************************
    const wglsShade = {
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

              // Матрицу нормали нужно отдельно передавать
              // Она не должна перемешать поэтому обнулил последний вектор
              var nMatrix : mat4x4<f32> = uniforms.mMatrix;
              nMatrix[3] = vec4<f32>(0.0, 0.0, 0.0, 1.0);  
             
              var output: Output;
              output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
              output.vUV = uv;
              output.vNormal  = nMatrix * vec4<f32>(normal,1.0);
  
              return output;
          }
      `,
  
        fragment: `     
        @binding(1) @group(0) var textureSampler : sampler;
        @binding(2) @group(0) var textureData : texture_2d<f32>;   

        struct GBufferOutput {
            @location(0) color : vec4<f32>,
            @location(1) bloom : vec4<f32>,
        }
  
        struct Uniforms {
          eyePosition : vec4<f32>,
          lightPosition : vec4<f32>,       
        };
        @binding(3) @group(0) var<uniform> uniforms : Uniforms;
  
        @fragment
        fn main(@location(0) vPosition: vec4<f32>, @location(1) vUV: vec2<f32>, @location(2) vNormal:  vec4<f32>) -> GBufferOutput {
          
          let specularColor:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
          let diffuseColor:vec3<f32> = vec3<f32>(10.0, 10.0, 10.0);
  
          let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, vUV)).rgb;
        
          let N:vec3<f32> = normalize(vNormal.xyz);
          let L:vec3<f32> = normalize((uniforms.lightPosition).xyz - vPosition.xyz);
          let V:vec3<f32> = normalize((uniforms.eyePosition).xyz - vPosition.xyz);
          let H:vec3<f32> = normalize(L + V);
        
          let diffuse:f32 = 1.0 * max(dot(N, L), 0.0);
          let specular = pow(max(dot(N, H),0.0),50.0);
          let ambient:vec3<f32> = vec3<f32>(0.1, 0.1, 0.1);

          ///
          let gamma = 2.2f;
                
          // // Алгоритм тональной компрессии Рейнхарда
          // var mapped:vec3<f32> = (diffuseColor * diffuse)  / ((diffuseColor * diffuse) + vec3<f32>(1.0));

          // Экспозиция тональной компрессии
          let exposure = 0.5f;
          var mapped:vec3<f32> =  vec3(1.0) - exp((diffuseColor * diffuse) * -exposure);
        
          // Гамма-коррекция
          mapped = pow(mapped, vec3<f32>(1.0 / gamma));
        
          //let finalColor:vec3<f32> =  textureColor * (mapped + ambient) + specularColor * specular; 
          let finalColor:vec3<f32> =  textureColor * (mapped + ambient) + specularColor * specular; 
               
          let brightness = dot(finalColor.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));

          var output : GBufferOutput;
          output.color = vec4(finalColor, 1.0);
          if(brightness > 1.0f){
            output.bloom = vec4(finalColor, 1.0);
          }else{
            output.bloom = vec4(0.0, 0.0, 0.0, 1.0);
          }
         

          return output;
      }
      `,
      };

    //----------------------------------------------------

    //---create uniform data   
    let MODELMATRIX = mat4.identity();
    let VIEWMATRIX = mat4.lookAt([0.0, 0.0, 10.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);  
    let fovy = 40 * Math.PI / 180;
    let PROJMATRIX = mat4.perspective(fovy, canvas.width / canvas.height, 1, 25);

    let eyePosition = [0.0, 0.0, 1.0];
    let lightPosition = new Float32Array([0.0, 1.0, 1.0]);

    //****************** BUFFER MAIN ********************//
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
            code: wglsShade.vertex,
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
            code: wglsShade.fragment,
          }),
          entryPoint: "main",
          targets: [
            {
              format: format,
            }
            ,{
                format: format,
            }
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

      const gBufferTextureBloom = device.createTexture({
            size: [canvas.width, canvas.height],

            usage: GPUTextureUsage.TEXTURE_BINDING |
                   GPUTextureUsage.COPY_DST |
                   GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,

            format: format,
      });  

      const textureBloomView = gBufferTextureBloom.createView();

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

    
    //---------------------------  COMPUTE  -------------- 
    const moduleСompute = device.createShaderModule({
        label: 'compute module',
        code: `
                         
                    struct Params {
                       filterDim : i32,
                       blockDim : u32,
                    }
        
                    struct Flip {
                       value : u32,
                    }
                    
                      
                    @group(0) @binding(1) var inputTex : texture_2d<f32>;
                    @group(0) @binding(2) var outputTex : texture_storage_2d<rgba8unorm, write>;
                    @group(0) @binding(3) var<uniform> flip : Flip;
        
                    @group(1) @binding(0) var samp : sampler;
                    @group(1) @binding(1) var<uniform> params : Params;
        
                    var<workgroup> tile : array<array<vec3<f32>, 128>, 4>;
               
                
                    @compute @workgroup_size(32,1) fn computeSomething(
                       @builtin(global_invocation_id) id: vec3<u32>,
                       @builtin(workgroup_id) WorkGroupID : vec3<u32>,
                       @builtin(local_invocation_id) LocalInvocationID : vec3<u32>
                    ) {
                    
        
                    //let filterDim : i32 = 80;
                    //let blockDim : u32 = 128 - (80 - 1);
        
                    let filterOffset = (params.filterDim - 1) / 2;
        
                    let dims = vec2<i32>(textureDimensions(inputTex, 0));
                    let baseIndex = vec2<i32>(WorkGroupID.xy * vec2(params.blockDim, 4) + LocalInvocationID.xy * vec2(4, 1)) - vec2(filterOffset, 0);
        
                    //let dims = vec2<u32>(640,640);
        
                    for (var r = 0; r < 4; r++) {
                        for (var c = 0; c < 4; c++) {
                            var loadIndex = baseIndex + vec2(c, r);
                            
                            if (flip.value != 0) {
                                loadIndex = loadIndex.yx;
                            }
                
                            tile[r][4 * LocalInvocationID.x + u32(c)] = textureSampleLevel(
                                inputTex,
                                samp,
                                (vec2<f32>(loadIndex) + vec2<f32>(0.25, 0.25)) / vec2<f32>(dims),
                                0.0
                            ).rgb;
                        }
                    }
        
                    workgroupBarrier();
        
        
                    for (var r = 0; r < 4; r++) {
                        for (var c = 0; c < 4; c++) {
                            var writeIndex = baseIndex + vec2(c, r);
                            
                            if (flip.value != 0) {
                                writeIndex = writeIndex.yx;
                            }
                
                            let center = i32(4 * LocalInvocationID.x) + c;
                            if (center >= filterOffset &&
                                center < 128 - filterOffset &&
                                all(writeIndex < dims)) {
                                    var acc = vec3(0.0, 0.0, 0.0);
                                    for (var f = 0; f < params.filterDim; f++) {
                                        var i = center + f - filterOffset;
                                        acc = acc + (1.0 / f32(params.filterDim)) * tile[r][i];
                                    }
                                    textureStore(outputTex, writeIndex, vec4(acc, 1.0));
                                }
                            }
                        }
                    }
        
        
                    //////////////////////////////////////////////////
                    // TEST 
                    // //let s = WorkGroupID.x;  //vec2<i32>
                    // let i = id.x;
                    // let j = id.y;
                    // var uv:vec2<f32> = vec2(f32(i) / f32(dims.x), f32(j) / f32(dims.y));
                    // var color:vec3<f32> = (textureSampleLevel(inputTex, samp, uv, 0.0)).rgb;
                    
                    // // let x = i; 
                    // // let y = j; 
                    // textureStore(outputTex, vec2<u32>(i,j), vec4( 1.0 - color, 1.0));                                              
                      
                    `,
    });

    const textures = [0, 1].map(() => {
        return device.createTexture({
            size: {
                width: canvas.width,
                height: canvas.height,
            },
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.STORAGE_BINDING |
                GPUTextureUsage.TEXTURE_BINDING,
        });
    });

    const pipelineCompute = device.createComputePipeline({
        label: 'compute pipeline',
        layout: 'auto',
        compute: {
            module: moduleСompute,
            entryPoint: 'computeSomething',
        },
    });

    const inputTime = new Float32Array([1.0]);
    const bufferUniform = device.createBuffer({
        label: 'buffer Position',
        size: inputTime.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(bufferUniform, 0, inputTime);


    const blurParamsBuffer = device.createBuffer({
        size: 8,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    const settings = {
        filterSize: 20,
        iterations: 2,
    };

    const tileDim = 128;
    const batch = [4, 4];

    let blockDim = tileDim - (settings.filterSize - 1);
    device.queue.writeBuffer(
        blurParamsBuffer,
        0,
        new Uint32Array([settings.filterSize, blockDim])
    );

    const computeConstants = device.createBindGroup({
        layout: pipelineCompute.getBindGroupLayout(1),
        entries: [
            {
                binding: 0,
                resource: sampler,
            },
            {
                binding: 1,
                resource: {
                    buffer: blurParamsBuffer,
                },
            },
        ],
    });



    const buffer0 = device.createBuffer({
        size: 4,
        mappedAtCreation: true,
        usage: GPUBufferUsage.UNIFORM,
    });
    new Uint32Array(buffer0.getMappedRange())[0] = 0;
    buffer0.unmap();


    const buffer1 = device.createBuffer({
        size: 4,
        mappedAtCreation: true,
        usage: GPUBufferUsage.UNIFORM,
    });
    new Uint32Array(buffer1.getMappedRange())[0] = 1;
    buffer1.unmap();


    const computeBindGroup0 = device.createBindGroup({
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            {
                binding: 1,
                //resource: textureImage.createView(),
                resource: textureBloomView,
            },
            {
                binding: 2,
                resource: textures[0].createView(),
            },
            {
                binding: 3,
                resource: {
                    buffer: buffer0,
                },
            }
        ],
    });

    const computeBindGroup1 = device.createBindGroup({
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            {
                binding: 1,
                resource: textures[0].createView(),
            },
            {
                binding: 2,
                resource: textures[1].createView(),
            },
            {
                binding: 3,
                resource: {
                    buffer: buffer1,
                },
            }
        ],
    });

    const computeBindGroup2 = device.createBindGroup({
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            {
                binding: 1,
                resource: textures[1].createView(),
            },
            {
                binding: 2,
                resource: textures[0].createView(),
            },
            {
                binding: 3,
                resource: {
                    buffer: buffer0,
                },
            }
        ],
    });

    //-------------------------------------------------------------  
      
    //   ***********************************************
    //   *************** _PostEffect *******************
    //   ***********************************************
    
    // Создаем саму текстуру
    const texturePostEffect = device.createTexture({
        size: [canvas.width, canvas.height],
        format: format,
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
    });

    // текст шейлеров 
    const wglsShader_PostEffect = {
        vertex: `
      
        struct VertexOutput{
            @builtin(position) Position : vec4<f32>,
            @location(0) fragUV : vec2<f32>,
        }

        @vertex
        fn vertex_main(
            @builtin(vertex_index) VertexIndex : u32
        ) -> VertexOutput {
       

        var pos = array<vec2<f32>, 6>(
            vec2( 0.95,  0.95),  vec2( 0.95, -0.95), vec2(-0.95, -0.95),
            vec2( 0.95,  0.95),  vec2(-0.95, -0.95), vec2(-0.95,  0.95)            
        );

        const uv = array(
            vec2( 1.0,  0.0),  vec2( 1.0,  1.0), vec2( 0.0,  1.0),
            vec2( 1.0,  0.0),  vec2( 0.0,  1.0), vec2( 0.0,  0.0)            
        );

        var output : VertexOutput;
        output.Position = vec4(pos[VertexIndex], 0.0, 1.0);
        output.fragUV =  uv[VertexIndex];

            return output;
        }`,

        fragment: `
            @group(0) @binding(0) var mySampler : sampler;
            @group(0) @binding(1) var myTexture : texture_2d<f32>;
            @group(0) @binding(2) var myTextureBloom : texture_2d<f32>;

            @fragment
            fn fragment_main(@location(0) fragUV : vec2<f32>) -> @location(0) vec4<f32> {
                      
            var color:vec3<f32> = (textureSample(myTexture, mySampler, fragUV)).rgb;
            var colorBloom:vec3<f32> = (textureSample(myTextureBloom, mySampler, fragUV)).rgb;
             
            var finalColor:vec3<f32> = vec3<f32>( 
                                                color.x + colorBloom.x,
                                                color.y + colorBloom.y,
                                                color.z + colorBloom.z,
                                                );
           

            // // Экспозиция тональной компрессии
            // let exposure = 1.0f;
            // var mapped:vec3<f32> =  vec3(1.0) - exp(finalColor * -exposure);
          
            // Гамма-коррекция
            // let gamma = 2.2f;
            // mapped = pow(mapped, vec3<f32>(1.0 / gamma));

            return  vec4<f32>(finalColor, 1.0);


        }`};


    const pipeline_PostEffect = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code: wglsShader_PostEffect.vertex
            }),
            entryPoint: "vertex_main"
        },
        fragment: {
            module: device.createShaderModule({
                code: wglsShader_PostEffect.fragment
            }),
            entryPoint: "fragment_main",
            targets: [{
                format: format
            }]
        },
        primitive: {
            topology: "triangle-list", // что будем рисовать точки - треугольники - линии
        }
    });


    const bindGroup_PostEffect = device.createBindGroup({
        layout: pipeline_PostEffect.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: sampler,
            },
            {
                binding: 1,
                resource: texturePostEffect.createView(),
               // resource: textures[1].createView(),
            },
            {
                binding: 2,
                resource: textures[1].createView(),
            }
        ]
    });


    /////////  ************  RENDER **********************     

    device.queue.writeBuffer(uniformBuffer, 0, PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffer, 64 + 64, MODELMATRIX);
   
    device.queue.writeBuffer(fragmentUniformBuffer, 0, new Float32Array(eyePosition));
    device.queue.writeBuffer(fragmentUniformBuffer,16, lightPosition);


    const textureView = context.getCurrentTexture().createView();
   
    const depthTexture = device.createTexture({
        size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });


    const renderPassDescription = {
        colorAttachments: [
            {
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: "store", 
            },
            {
                view: textureBloomView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: "store", 
            }
            ],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthLoadOp: "clear",
            depthClearValue: 1.0,
            depthStoreOp: "store",
        }
    };

    let time_old = 0;
    function animate(time) {

        //-----------------TIME-----------------------------
        let dt = time - time_old;
        time_old = time;
        //--------------------------------------------------

        //------------------MATRIX EDIT---------------------
        MODELMATRIX = mat4.rotateY(MODELMATRIX, dt * 0.0005);
        // MODELMATRIX = mat4.rotateX(MODELMATRIX, dt * 0.002);
        // MODELMATRIX = mat4.rotateZ(MODELMATRIX, dt * 0.001);
        //--------------------------------------------------
        device.queue.writeBuffer(uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset


        const commandEncoder = device.createCommandEncoder();
        const textureMain = context.getCurrentTexture();
        renderPassDescription.colorAttachments[0].view = textureMain.createView();
        renderPassDescription.colorAttachments[1].view = textureBloomView;

        const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

        renderPass.setPipeline(pipeline);
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setVertexBuffer(1, uvBuffer);
        renderPass.setVertexBuffer(2, normalBuffer);
        renderPass.setIndexBuffer(indexBuffer, "uint32");
        renderPass.setBindGroup(0, uniformBindGroup);
        //renderPass.draw(6, 1, 0, 0);
        renderPass.drawIndexed(cube_index.length);
        renderPass.end();

        ////////////////////////////////
        //------------------  COMPUTE-----------------------

    const computePass = commandEncoder.beginComputePass({
        label: 'doubling compute pass',
    });

    computePass.setPipeline(pipelineCompute);

    computePass.setBindGroup(1, computeConstants);

    computePass.setBindGroup(0, computeBindGroup0);
    computePass.dispatchWorkgroups(
        Math.ceil(canvas.width/ blockDim),
        Math.ceil(canvas.height / 4));
    //computePass.setBindGroup(0, computeBindGroup1);

    for (let i = 0; i < settings.iterations - 1; ++i) {
        
        computePass.setBindGroup(0, computeBindGroup1);

        computePass.dispatchWorkgroups(
            Math.ceil(canvas.width / blockDim),
            Math.ceil(canvas.height / 4));
        
        computePass.setBindGroup(0, computeBindGroup2);

        computePass.dispatchWorkgroups(
            Math.ceil(canvas.width / blockDim),
            Math.ceil(canvas.height / 4));
    }


    computePass.end();

    //   ***********************************************
    //   *************** _PostEffect *******************
    //   ***********************************************
        commandEncoder.copyTextureToTexture(
            {
                //texture: gBufferTextureBloom,
                texture: textureMain,
                //texture: textures[0],
                origin: {
                x: 0,
                y: 0,
                z: 0
                }
            },
            {
                texture: texturePostEffect,
                origin: {
                    x: 0,
                    y: 0,
                    z: 0
                }
            },
            [canvas.width, canvas.height]
        );

        const textureView_PostEffect = context.getCurrentTexture().createView(); // тектура к которой привязан контекст
        const renderPass_PostEffect = commandEncoder.beginRenderPass({  // натсраиваем проход рендера, подключаем текстуру канваса это значать выводлить результат на канвас
            colorAttachments: [{
                view: textureView_PostEffect,
                clearValue: { r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store' //хз
            }]
        });
        renderPass_PostEffect.setBindGroup(0, bindGroup_PostEffect);
        renderPass_PostEffect.setPipeline(pipeline_PostEffect); // подключаем наш pipeline
        renderPass_PostEffect.draw(6);
        renderPass_PostEffect.end();

        device.queue.submit([commandEncoder.finish()]);

        device.pushErrorScope("validation");
        device.popErrorScope().then((error) => {
            if (error) {
                // error is a GPUValidationError object instance

                console.error(`An error occurred while creating sampler: ${error.message}`);
            }
        });
        requestAnimationFrame(animate);
    };
    animate(0);
}

webGPU_Start();