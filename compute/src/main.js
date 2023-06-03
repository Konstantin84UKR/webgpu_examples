
//let gpu;
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

    context.configure({     // конфигурируем контекстр указываем логическое устройство и формат хранения данных
        device: device,
        format: format,
        compositingAlphaMode: "opaque",
    });

    // текст шейлеров 
    const wglsShader = {
        vertex: `
        //@group(0) @binding(0) var<storage, read> data: array<f32>;

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

        fragment: `
            @fragment
            fn fragment_main() -> @location(0) vec4<f32> {
            return vec4<f32>(1.0,0.5,0.0,1.0);
        }`};

    const moduleСompute = device.createShaderModule({
        label: 'compute module',
        code: `
              @group(0) @binding(0) var<storage, read> data: array<f32>;
              @group(0) @binding(1) var<storage, read_write> data1: array<f32>;
        
              @compute @workgroup_size(2) fn computeSomething(
                @builtin(global_invocation_id) id: vec3<u32>
              ) {
                let i = id.x;
                data1[i] = data[i] * 1.0 + f32(i);
              }
            `,
    });

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

    ////////////////////////////////////////////+    
    const pipelineCompute = device.createComputePipeline({
        label: 'compute pipeline',
        layout: 'auto',
        compute: {
            module: moduleСompute,
            entryPoint: 'computeSomething',
        },
    });

    const input = new Float32Array([0, 0, 0, 0, 0]);

    const workBuffer = device.createBuffer({
        label: 'work buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    // Copy our input data to that buffer
    device.queue.writeBuffer(workBuffer, 0, input);

    const workBuffer1 = device.createBuffer({
        label: 'work buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    // Copy our input data to that buffer
    device.queue.writeBuffer(workBuffer1, 0, new Float32Array([10, 10, 10]));

    // create a buffer on the GPU to get a copy of the results
    const resultBuffer = device.createBuffer({
        label: 'result buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST ,
    });

    // Setup a bindGroup to tell the shader which
    // buffer to use for the computation
    const bindGroupCompute = device.createBindGroup({
        label: 'bindGroup for work buffer',
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: workBuffer } },  
            { binding: 1, resource: { buffer: workBuffer1 } },           
        ],
    });

       // Setup a bindGroup to tell the shader which
    // buffer to use for the computation
    const bindGroupCompute1 = device.createBindGroup({
        label: 'bindGroup for work buffer',
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: workBuffer1 } }, 
            { binding: 1, resource: { buffer: workBuffer } },             
        ],
    });

    

    // Animation   
let time_old=0; 
// async function animate(time) {
     
//      //-----------------TIME-----------------------------
//      //console.log(time);
//      let dt = time - time_old;
//      time_old = time;
     //--------------------------------------------------
    
     //------------------MATRIX EDIT---------------------
     
     //--------------------------------------------------

     //Encode commands to do the computation
    const encoder = device.createCommandEncoder({
        label: 'doubling encoder',
    });

    const computePass = encoder.beginComputePass({
        label: 'doubling compute pass',
    });

    computePass.setPipeline(pipelineCompute);
    computePass.setBindGroup(0, bindGroupCompute);
    computePass.dispatchWorkgroups(input.length);
    computePass.end();

    encoder.copyBufferToBuffer(workBuffer1, 0, resultBuffer, 0, resultBuffer.size);
    //encoder.copyBufferToBuffer(workBuffer, 0, workBuffer1, 0, resultBuffer.size);

    device.queue.submit([encoder.finish()]);

    // Read the results
    await resultBuffer.mapAsync(GPUMapMode.READ);
    let result = new Float32Array(resultBuffer.getMappedRange().slice());
    resultBuffer.unmap();

    console.log('input', input);
    console.log('result', result);
   
    
    //Encode commands to do the computation
    const encoder1 = device.createCommandEncoder({
        label: 'doubling encoder',
    });
    const computePass1 = encoder1.beginComputePass({
        label: 'doubling compute pass 2',
    });
    computePass1.setPipeline(pipelineCompute);
    computePass1.setBindGroup(0, bindGroupCompute1);
    computePass1.dispatchWorkgroups(1);
    computePass1.end();

    encoder1.copyBufferToBuffer(workBuffer, 0, resultBuffer, 0, resultBuffer.size);

    device.queue.submit([encoder1.finish()]);

    // Read the results
    await resultBuffer.mapAsync(GPUMapMode.READ);
    result = new Float32Array(resultBuffer.getMappedRange().slice());
    resultBuffer.unmap();

    console.log('input', input);
    console.log('result', result);

    const encoderRender = device.createCommandEncoder({
        label: 'doubling encoder',
    });

    const textureView = context.getCurrentTexture().createView(); // тектура к которой привязан контекст
    const renderPass = encoderRender.beginRenderPass({  // натсраиваем проход рендера, подключаем текстуру канваса это значать выводлить результат на канвас
        colorAttachments: [{
            view: textureView,
            clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store' //хз
        }]
    });
    renderPass.setPipeline(pipeline); // подключаем наш pipeline
    renderPass.draw(3);
    renderPass.end();

    device.queue.submit([encoderRender.finish()]);

//      window.requestAnimationFrame(animate);
//    };
//    animate(0);
}

webGPU_Start();