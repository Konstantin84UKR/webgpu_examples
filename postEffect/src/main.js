
import {
    mat4,
} from './wgpu-matrix.module.js';

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
        size: [canvas.width, canvas.height]
    })

    ///////////////  **************** MAIN *************

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
          @location(0) vColor : vec4<f32>,
      };

      @vertex
        fn main(@location(0) pos: vec4<f32>, @location(1) color: vec4<f32>) -> Output {
        
            var output: Output;
            output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
            output.vColor = color;

            return output;
        }
    `,

        fragment: `
      @fragment
      fn main(@location(0) vColor: vec4<f32>) -> @location(0) vec4<f32> {
      return vColor;
    }
    `,
    };

    //----------------------------------------------------
    const cube_vertex = new Float32Array([
        -1, -1, -1, 1, 1, 0,  // XYZ  RGB
        1, -1, -1, 1, 1, 0,
        1, 1, -1, 1, 1, 0,
        -1, 1, -1, 1, 1, 0,

        -1, -1, 1, 0, 0, 1,
        1, -1, 1, 0, 0, 1,
        1, 1, 1, 0, 0, 1,
        -1, 1, 1, 0, 0, 1,

        -1, -1, -1, 0, 1, 1,
        -1, 1, -1, 0, 1, 1,
        -1, 1, 1, 0, 1, 1,
        -1, -1, 1, 0, 1, 1,

        1, -1, -1, 1, 0, 0,
        1, 1, -1, 1, 0, 0,
        1, 1, 1, 1, 0, 0,
        1, -1, 1, 1, 0, 0,

        -1, -1, -1, 1, 0, 1,
        -1, -1, 1, 1, 0, 1,
        1, -1, 1, 1, 0, 1,
        1, -1, -1, 1, 0, 1,

        -1, 1, -1, 0, 1, 0,
        -1, 1, 1, 0, 1, 0,
        1, 1, 1, 0, 1, 0,
        1, 1, -1, 0, 1, 0

    ]);

    const cube_index = new Uint32Array([
        0, 1, 2,
        0, 2, 3,

        4, 5, 6,
        4, 6, 7,

        8, 9, 10,
        8, 10, 11,

        12, 13, 14,
        12, 14, 15,

        16, 17, 18,
        16, 18, 19,

        20, 21, 22,
        20, 22, 23

    ]);

    //---create uniform data   
    let MODELMATRIX = mat4.identity();
    let VIEWMATRIX = mat4.lookAt([0.0, 0.0, 10.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);  
    let fovy = 40 * Math.PI / 180;
    let PROJMATRIX = mat4.perspective(fovy, canvas.width / canvas.height, 1, 25);


    //****************** BUFFER ********************//
    //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
    //** который будет в будушем загружен в данный буффер */
    //** указываем размер  буффера в байтах */
    //** usage ХЗ */
    //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
    //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */
    const vertexBuffer = device.createBuffer({
        size: cube_vertex.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST нужен что бы быть назначением записи данных 
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

    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code: wglsShade.vertex,
            }),
            entryPoint: "main",
            buffers: [
                {
                    arrayStride: 4 * (3 + 3),
                    attributes: [{
                        shaderLocation: 0,
                        format: "float32x3",
                        offset: 0
                    },
                    {
                        shaderLocation: 1,
                        format: 'float32x3',
                        offset: 12,
                    }
                    ]
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
                },
            ],
        },
        primitive: {
            topology: "triangle-list",
            //topology: "point-list",
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

    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: {
                buffer: uniformBuffer,
                offset: 0,
                size: 64 + 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
        }]
    });

    //////////////  *************** _PostEffect *******************
    // Просто тестовая текстура
    const textureBLUE = device.createTexture({
        size: [canvas.width, canvas.height],
        format: format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });
    // Данные для тестовой текстуры квадрат 4х4
    const colorBLUE = [0.9 * 255, 0.9 * 255, 0.0 * 255, 1 * 255];
    const colorTextureBLUE = [colorBLUE, colorBLUE, colorBLUE, colorBLUE,
        colorBLUE, colorBLUE, colorBLUE, colorBLUE,
        colorBLUE, colorBLUE, colorBLUE, colorBLUE,
        colorBLUE, colorBLUE, colorBLUE, colorBLUE].flat();
    const dataBLUE = new Uint8Array(colorTextureBLUE);
    // запись данных в тестовую текстуру
    device.queue.writeTexture({ texture: textureBLUE }, dataBLUE, { bytesPerRow: 16 }, { width: 4, height: 4 });


    // Создаем саму текстуру
    const textureRED = device.createTexture({
        size: [canvas.width, canvas.height],
        format: format,
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
    });

    const colorRed = [0.0 * 255, 0.0 * 255, 0.9 * 255, 1.0 * 255];
    const colorTextureRED = [colorRed, colorRed, colorRed, colorRed,
        colorRed, colorRed, colorRed, colorRed,
        colorRed, colorRed, colorRed, colorRed,
        colorRed, colorRed, colorRed, colorRed].flat();
    const dataRed = new Uint8Array(colorTextureRED);
   
    //device.queue.writeTexture({ texture: textureRED }, dataRed, { bytesPerRow: 16 }, { width: 4, height: 4 });

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
            vec2( 0.8,  0.8),  vec2( 0.8, -0.8), vec2(-0.8, -0.8),
            vec2( 0.8,  0.8),  vec2(-0.8, -0.8), vec2(-0.8,  0.8)            
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

            // //PIXELATE
    
            var dx:f32 = 1.0 / 640.0;
            var dy:f32 = 1.0 / 640.0;
            var uv:vec2<f32> = vec2(dx*(floor(fragUV.x/dx)), dy*(floor(fragUV.y/dy)));
            
            var color:vec3<f32> = (textureSample(myTexture, mySampler, uv)).rgb;

               if(fragUV.x < 0.33){
                color = 1.0 - color;
            }else if(fragUV.x < 0.66){
                color = vec3(color.y,color.y,color.y);
            }
            
            return  vec4<f32>(color, 1.0);
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

    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear'
    })

    //Создаем картинку и загрудаем в нее данные из файла
    let img = new Image();
    img.src = './res/ChasivYar3.jpg'; //'./tex/yachik.jpg';
    await img.decode();

    const imageBitmap = await createImageBitmap(img);

    //передаем данные о текстуре и данных текстуры в очередь
    device.queue.copyExternalImageToTexture(
        {
            source: imageBitmap,
            origin: {
                x: 100,
                y: 200
            }
        },
        { texture: textureRED },
        [canvas.width, canvas.height]);

    device.queue.writeTexture({ texture: textureRED, origin: [450, 400, 0]}, dataRed, { bytesPerRow: 16 }, { width: 4, height: 4 });

    const bindGroup_PostEffect = device.createBindGroup({
        layout: pipeline_PostEffect.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: sampler,
            },
            {
                binding: 1,
                resource: textureRED.createView(),
            }
        ]
    });

    /////////  ************  RENDER **********************     

    device.queue.writeBuffer(uniformBuffer, 0, PROJMATRIX); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffer, 64, VIEWMATRIX); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffer, 64 + 64, MODELMATRIX);


    let textureView = context.getCurrentTexture().createView();

    let depthTexture = device.createTexture({
        size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });


    const renderPassDescription = {
        colorAttachments: [
            {
                view: textureView,
                //loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 }, //background color
                clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
                //loadValue: {r: 0.5, g: 0.5, b: 0.5, a: 1.0},
                loadOp: 'clear',
                storeOp: "store", //ХЗ
            },],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            //depthLoadValue: 1.0,
            depthLoadOp: "clear",
            depthClearValue: 1.0,
            depthStoreOp: "store",
            // stencilLoadValue: 0,
            //stencilStoreOp: "store",
            //stencilLoadOp: "clear"
            //tencilClearValue: 
        }
    };

    let time_old = 0;
    function animate(time) {

        //-----------------TIME-----------------------------
        let dt = time - time_old;
        time_old = time;
        //--------------------------------------------------

        //------------------MATRIX EDIT---------------------
        MODELMATRIX = mat4.rotateY(MODELMATRIX, dt * 0.001);
        MODELMATRIX = mat4.rotateX(MODELMATRIX, dt * 0.002);
        MODELMATRIX = mat4.rotateZ(MODELMATRIX, dt * 0.001);
        //--------------------------------------------------
        device.queue.writeBuffer(uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset


        const commandEncoder = device.createCommandEncoder();
        const textureMain = context.getCurrentTexture();
        renderPassDescription.colorAttachments[0].view = textureMain.createView();

        const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

        renderPass.setPipeline(pipeline);
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.setIndexBuffer(indexBuffer, "uint32");
        renderPass.setBindGroup(0, uniformBindGroup);
        renderPass.drawIndexed(cube_index.length);
        renderPass.end();

        ////////////////////////////////

        commandEncoder.copyTextureToTexture(
            {
                texture: textureMain,
                origin: {
                x: 200,
                y: 200,
                z: 0
                }
            },
            {
                texture: textureRED,
                origin: {
                    x: 100,
                    y: 0,
                    z: 0
                }
            },
            [canvas.width * 0.5, canvas.height * 0.3]
        );

        const textureView_PostEffect = context.getCurrentTexture().createView(); // тектура к которой привязан контекст
        const renderPass_PostEffect = commandEncoder.beginRenderPass({  // натсраиваем проход рендера, подключаем текстуру канваса это значать выводлить результат на канвас
            colorAttachments: [{
                view: textureView_PostEffect,
                clearValue: { r: 0.0, g: 0.0, b: 0.5, a: 1.0 },
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