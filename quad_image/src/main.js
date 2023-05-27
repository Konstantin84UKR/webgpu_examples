
//let gpu;
const webGPU_Start = async()=>{
 
    // checkWebGPU // 
    if(!navigator.gpu){
       console.log("Your current browser does not support WebGPU!");
       return;
    }
    
    const canvas = document.querySelector('#canvas-webgpu'); // получаем канвас
    const adapter = await navigator.gpu.requestAdapter(); // получаем физическое устройство ГПУ
    const device = await adapter.requestDevice(); // Получаем логическое устройство ГПУ
    const context = canvas.getContext("webgpu"); // Контекст Канваса

    const format = navigator.gpu.getPreferredCanvasFormat(); // формат данных в которых храняться пиксели в физическом устройстве 

    context.configure({     // конфигурируем контекстр указываем логическое устройство и формат хранения данных
        device: device,
        format: format,
        compositingAlphaMode:"opaque",
    });

    // текст шейлеров 
    const wglsShader = {
        vertex:`
      
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

        fragment:`
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
    
            var dx:f32 = 8.0 / 640.0;
            var dy:f32 = 8.0 / 640.0;
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
            primitive:{
               topology: "triangle-list", // что будем рисовать точки - треугольники - линии
            }
        });
        
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
    const texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1], //??
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
    });

    //передаем данные о текстуре и данных текстуры в очередь
    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: texture },
        [imageBitmap.width, imageBitmap.height]);

        const bindGroup = device.createBindGroup({
            layout : pipeline.getBindGroupLayout(0),
            entries : [
                {
                    binding : 0,
                    resource : sampler, 
                },
                {
                    binding : 1,
                    resource : texture.createView(), 
                }
            ]
        });

        const commandEncoder = device.createCommandEncoder(); // 
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
}

webGPU_Start();