
//let gpu;
const webGPU_Start = async () => {

    // checkWebGPU // 
    if (!navigator.gpu) {
        console.log("Your current browser does not support WebGPU!");
        return;
    }
  
    const adapter = await navigator.gpu.requestAdapter(); // получаем физическое устройство ГПУ
    const device = await adapter.requestDevice(); // Получаем логическое устройство ГПУ
 
    const moduleСompute = device.createShaderModule({
        label: 'compute module',
        code: `
              @group(0) @binding(0) var<storage, read> data: array<f32>;
              @group(0) @binding(1) var<storage, read_write> data1: array<f32>;
        
              @compute @workgroup_size(64) fn computeSomething(
                @builtin(global_invocation_id) id: vec3<u32>
              ) {
                
                if (id.x >= u32(arrayLength(&data))) {
                    return;
                }

                let i = id.x;
                data1[i] = data[i] + f32(i);               
              }
            `,
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

    const workBuffer0 = device.createBuffer({
        label: 'work buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    // Copy our input data to that buffer
    device.queue.writeBuffer(workBuffer0, 0, input);

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
    const bindGroupCompute1 = device.createBindGroup({
        label: 'bindGroup for work buffer',
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: workBuffer0 } },  
            { binding: 1, resource: { buffer: workBuffer1 } },           
        ],
    });

       // Setup a bindGroup to tell the shader which
    // buffer to use for the computation
    const bindGroupCompute2 = device.createBindGroup({
        label: 'bindGroup for work buffer',
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: workBuffer1 } }, 
            { binding: 1, resource: { buffer: workBuffer0 } },             
        ],
    });
    

    //Encode commands to do the computation
    const encoder = device.createCommandEncoder({
        label: 'doubling encoder',
    });

    const computePass = encoder.beginComputePass({
        label: 'doubling compute pass',
    });

    computePass.setPipeline(pipelineCompute);
    computePass.setBindGroup(0, bindGroupCompute1);
    computePass.dispatchWorkgroups(1); //5 input.length
    computePass.end();

    encoder.copyBufferToBuffer(workBuffer1, 0, resultBuffer, 0, resultBuffer.size);
   
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
    computePass1.setBindGroup(0, bindGroupCompute2);
    computePass1.dispatchWorkgroups(1);
    computePass1.end();

    encoder1.copyBufferToBuffer(workBuffer0, 0, resultBuffer, 0, resultBuffer.size);

    device.queue.submit([encoder1.finish()]);

    // Read the results
    await resultBuffer.mapAsync(GPUMapMode.READ);
    let result2 = new Float32Array(resultBuffer.getMappedRange().slice());
    resultBuffer.unmap();

    //console.log('input', input);
    console.log('result', result2);
    
    inputOnHTML('input',input);
    inputOnHTML('result', result);
    inputOnHTML('result2', result2);
}

webGPU_Start();

function inputOnHTML(id, input){
        
    const elementInput = document.getElementById(id);
   
    if (elementInput) {      
        elementInput.textContent = '' + id + ' = ' + input;
    }   
}