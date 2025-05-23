
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
        @vertex
        fn vertex_main(
        @builtin(vertex_index) VertexIndex : u32
        ) -> @builtin(position) vec4<f32> {
        var pos = array<vec2<f32>, 3>(
            vec2(0.0, 0.5),
            vec2(-0.5, -0.5),
            vec2(0.5, -0.5)
        );

            return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
        }`,

        fragment:`
            @fragment
            fn fragment_main() -> @location(0) vec4<f32> {
            return vec4<f32>(1.0,0.5,0.0,1.0);
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
        renderPass.setPipeline(pipeline); // подключаем наш pipeline
        renderPass.draw(3); 
      
        // renderPass.draw(3, 1, 0, 0); 
        // undefined draw(GPUSize32 vertexCount, optional GPUSize32 instanceCount = 1,
        // optional GPUSize32 firstVertex = 0, optional GPUSize32 firstInstance = 0);

        renderPass.end();
    
        device.queue.submit([commandEncoder.finish()]);
}

webGPU_Start();