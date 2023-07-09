// Запускаем 32 потока в одном WorkGroupID. Эти потоки имеют доступ к обшей памяти.
// в по ID WorkGroup опредеряем начальный (baseIndex) пиксель с которого будем читать данные с текстуры. 
// Дальше кадым потоком читаем область тестурв размером 4*4 пикселя. 


//  var<workgroup> tile : array<array<vec3<f32>, 128>, 4>;
//  r идем как есть а "C" шагаем через 4 
//
//     1 поток      2 поток       3 поток          32 поток 
// r1 |0 0 0 0|    |0 0 0 0|     |0 0 0 0|        |0 0 0 0|   всего 128 ячейки
// r2 |0 0 0 0|    |0 0 0 0|     |0 0 0 0|   =>   |0 0 0 0|
// r3 |0 0 0 0|    |0 0 0 0|     |0 0 0 0|        |0 0 0 0|
// r4 |0 0 0 0|    |0 0 0 0|     |0 0 0 0|        |0 0 0 0|


//  workgroupBarrier(); // Ждем все 32 потока что бы cформировать общую область памяти с которой будем читать данные для BLUR

// Читаем данные и3 TILE Если онипопадают в область для размытия (TODO)
// тогла Читаем соседние пиксели по горизонтали и делим наколичество пикселей размытия
// так мы получаем усредненый цвет

// Пишем в текстура что получилось.

// На следуюшей итерации меняем X и Y местами
// Размытие идеи уде не по горизонтале, а по вертикале.


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


    const blurParamsBuffer = device.createBuffer({
        size: 8,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    const settings = {
        filterSize: 80,
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
                resource: textureImage.createView(),
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
    //async function animate(time) {

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

    computePass.setBindGroup(1, computeConstants);

    computePass.setBindGroup(0, computeBindGroup0);
    computePass.dispatchWorkgroups(
        Math.ceil(imageBitmap.width / blockDim),
        Math.ceil(imageBitmap.height / 4));
    computePass.setBindGroup(0, computeBindGroup1);

    for (let i = 0; i < settings.iterations - 1; ++i) {

        computePass.dispatchWorkgroups(
            Math.ceil(imageBitmap.width / blockDim),
            Math.ceil(imageBitmap.height / 4));
        computePass.setBindGroup(0, computeBindGroup2);

        computePass.dispatchWorkgroups(
            Math.ceil(imageBitmap.width / blockDim),
            Math.ceil(imageBitmap.height / 4));
    }


    computePass.end();
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
    //    window.requestAnimationFrame(animate);
    //  };
    //  animate(0);
}

webGPU_Start();