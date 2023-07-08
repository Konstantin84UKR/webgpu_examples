// import {
//     mat4,
// } from '../../common/wgpu-matrix.module.js';



//let gpu;
const webGPU_Start = async () => {

    // checkWebGPU // 
    if (!navigator.gpu) {
        console.log("Your current browser does not support WebGPU!");
        return;
    }
    //------------------------------ INIT -----------------
    const canvas = document.querySelector('#canvas-webgpu'); // получаем канвас
    const adapter = await navigator.gpu.requestAdapter(); // получаем физическое устройство ГПУ
    const device = await adapter.requestDevice(); // Получаем логическое устройство ГПУ
    const context = canvas.getContext("webgpu"); // Контекст Канваса

    const format = navigator.gpu.getPreferredCanvasFormat(); // формат данных в которых храняться пиксели в физическом устройстве 

    context.configure({     // конфигурируем контекстр указываем логическое устройство и формат хранения данных
        device: device,
        format: format,
        compositingAlphaMode: "opaque",
    });


    //------------------------- LOAD RESURSE -------------
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear'
    })

    //Создаем картинку и загрудаем в нее данные из файла
    let img = new Image();
    img.src = './res/ChasivYar5.jpg'; //'./tex/yachik.jpg';
    await img.decode();

    const imageBitmap = await createImageBitmap(img);

    // Создаем саму текстуру
    const textureImage = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1], //??
        format: format, 
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
    });

    //передаем данные о текстуре и данных текстуры в очередь
    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: textureImage },
        [imageBitmap.width, imageBitmap.height]);


    //---------------------------  COMPUTE  -------------- 
    const moduleСompute = device.createShaderModule({
        label: 'compute module',
        code: `

            //   struct Particle {
            //     pos : vec2<f32>,
            //     vel : vec2<f32>,
            //     radius : vec4<f32>,
            //   }
              
            //   struct Particles {
            //      particles : array<Particle>,
            //   }

            //   struct Uniforms {
            //     dTime : f32
            //   }

            //   @group(0) @binding(0) var<storage, read> particlesA: Particles;
            //   @group(0) @binding(1) var<storage, read_write> particlesB: Particles;
            //   @group(0) @binding(2) var<uniform> uniforms : Uniforms;              
              
              @group(0) @binding(1) var inputTex : texture_2d<f32>;
              @group(0) @binding(2) var outputTex : texture_storage_2d<rgba8unorm, write>;
              @group(0) @binding(3) var samp : sampler;

              var<workgroup> tile : array<array<vec3<f32>, 128>, 4>;
        
              @compute @workgroup_size(32) fn computeSomething(
                @builtin(global_invocation_id) id: vec3<u32>,
                @builtin(workgroup_id) WorkGroupID : vec3<u32>,
              ) {

                // if (id.x >= u32(arrayLength(&particlesA.particles))) {
                //    return;
                // }
                let dims = vec2<u32>(textureDimensions(inputTex, 0));
                // let baseIndex = vec2<i32>(WorkGroupID.xy * vec2(params.blockDim, 4) +
                //                   LocalInvocationID.xy * vec2(4, 1))
                //       - vec2(filterOffset, 0);
                //let dims = vec2<u32>(640,640);

                //let s = WorkGroupID.x;  //vec2<i32>
                let i = id.x;
                let j = id.y;

                var uv:vec2<f32> = vec2(f32(i) / f32(dims.x), f32(j) / f32(dims.y));
                var color:vec3<f32> = (textureSampleLevel(inputTex, samp, uv, 0.0)).rgb;

                let s = WorkGroupID.x;  //vec2<i32>
                // let i = id.x;
                // let j = id.y;
                let x = i; //u32((i / 640) * 640);
                let y = j; //u32(floor(f32(i) / f32(dims.y)));

                textureStore(outputTex, vec2<u32>(x,y), vec4( 1.0 - color, 1.0));

              
                /////////////////////////////////////////////////////////////////////////////////////////////////
              
                // let index = id.x;
                // var vPos = particlesA.particles[index].pos;
                // var vVel = particlesA.particles[index].vel;
                
                                            
                // particlesB.particles[index].pos = vPos;  
                // particlesB.particles[index].vel = vVel; 
                // particlesB.particles[index].radius = particlesA.particles[index].radius * uniforms.dTime * color.r; 
                                              
              }
            `,
    });    

    const textures = [0, 1].map(() => {
        return device.createTexture({
            size: {
                width: imageBitmap.width,
                height: imageBitmap.height,
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


  
    
 
   
    
    const computeBindGroup0 = device.createBindGroup({
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            {
                binding: 1,
                resource: textureImage.createView(),
            },
            {
                binding: 2,
                resource: textures[0].createView(),
            },            
            {
                binding: 3,
                resource: sampler,
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
                resource: sampler,
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
                resource: sampler,
            }
        ],
    });
    

    //-------------------------------------------------------------
    

    /////////////////////////////////////////////////////////////////
    // текст шейлеров 
   const wglsShader = {
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
            vec2( 1.0,  1.0),  vec2( 1.0, -1.0), vec2(-1.0, -1.0),
            vec2( 1.0,  1.0),  vec2(-1.0, -1.0), vec2(-1.0,  1.0)            
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

            @fragment
            fn fragment_main(@location(0) fragUV : vec2<f32>) -> @location(0) vec4<f32> {
                      
            //var color:vec3<f32> = (textureSample(myTexture, mySampler, fragUV)).rgb;
           
            // if(fragUV.x < 0.33){
            //     color = 1.0 - color;
            // }else if(fragUV.x < 0.66){
            //     color = vec3(color.y,color.y,color.y);
            // }

            //PIXELATE
    
            var dx:f32 = 1.0 / 640.0;
            var dy:f32 = 1.0 / 640.0;
            var uv:vec2<f32> = vec2(dx*(floor(fragUV.x/dx)), dy*(floor(fragUV.y/dy)));
            
            var color:vec3<f32> = (textureSample(myTexture, mySampler, uv)).rgb;
            
            return  vec4<f32>(color, 1.0);
        }`};


    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 
    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code: wglsShader.vertex
            }),
            entryPoint: "vertex_main"
        },
        fragment: {
            module: device.createShaderModule({
                code: wglsShader.fragment
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


    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: sampler,
            },
            {
                binding: 1,
                resource: textures[0].createView(), //  textureImage // textures[0]
            }
        ]
    });


    //////////////////////////------ Animation -----------------------  
    let time_old = 0;
    let t = 0;
    async function animate(time) {

        //-----------------TIME-----------------------------
        //console.log(time);
        // let dt = time - time_old;
        // time_old = time;
        //console.log(dt);
        //--------------------------------------------------
        const commandEncoder = device.createCommandEncoder(); //
        //------------------  COMPUTE-----------------------

        const computePass = commandEncoder.beginComputePass({
            label: 'doubling compute pass',
        });

        computePass.setPipeline(pipelineCompute);
      //  computePass.setBindGroup(0, bindGroupsCompute[t % 2].bindGroup);
        computePass.setBindGroup(0,computeBindGroup0);
        computePass.dispatchWorkgroups(512);
        computePass.setBindGroup(0, computeBindGroup1);
        computePass.dispatchWorkgroups(512);
        computePass.setBindGroup(0, computeBindGroup2);
        computePass.dispatchWorkgroups(512);

        computePass.end();
        t++;
        
        //------------------  RENDER -----------------------
        const textureView = context.getCurrentTexture().createView(); // тектура к которой привязан контекст
        const renderPass = commandEncoder.beginRenderPass({  // натсраиваем проход рендера, подключаем текстуру канваса это значать выводлить результат на канвас
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store' //хз
            }]
        });
        renderPass.setBindGroup(0, bindGroup);
        renderPass.setPipeline(pipeline); // подключаем наш pipeline
        renderPass.draw(6);

        // renderPass.draw(3, 1, 0, 0); 
        // undefined draw(GPUSize32 vertexCount, optional GPUSize32 instanceCount = 1,
        // optional GPUSize32 firstVertex = 0, optional GPUSize32 firstInstance = 0);

        renderPass.end();

        device.queue.submit([commandEncoder.finish()]);
        window.requestAnimationFrame(animate);
    };
    animate(0);
}

webGPU_Start();