function inputOnHTML(id, input) {

    const elementInput = document.getElementById(id);

    if (elementInput) {
        elementInput.textContent = '' + id + ' = ' + input;
    }
}

function sunJS(array) {
    console.time("JS");
    let elementSunJS = 0;
    for (let index = 0; index < array.length; index++) {
        elementSunJS += array[index];
    }
    console.timeLog("JS");

    // console.log('sunJS', elementSunJS);
    inputOnHTML('resultJS', elementSunJS);
}

async function findResultArr(inputLength, workgroupSize) {
    return Math.ceil(inputLength / workgroupSize);
}

async function computePassADD(encoder, pipelineCompute, bindGroupCompute, dispatch) {
    const computePass = encoder.beginComputePass({
        label: 'doubling compute pass',
    });
    computePass.setPipeline(pipelineCompute);
    computePass.setBindGroup(0, bindGroupCompute);
    computePass.dispatchWorkgroups(dispatch); //5 input.length
    computePass.end();
}

async function init() {
    if (!navigator.gpu) {
        console.error("WebGPU не поддерживается.");
        return;
    }

    const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
    }); // получаем физическое устройство ГПУ
    const device = await adapter.requestDevice(); // Получаем логическое устройство ГПУ


    //------------------------------------------------------  
    // Create a buffer on the GPU to hold our input data
    //const arr = [134209536,402644992,671080448,939515904,1207951360,1476386816,0,1]; // Такой пример с Float32Array не работает

    const workgroupSize = 8; // размер workgroup
    const inputDataLength = 1024; // длина входного массива 

    let arr = [];
    for (let i = 0; i <= inputDataLength; i++) {
        arr[i] = Math.ceil(Math.random() * 10);
        // arr[i] = i;
    }

    sunJS(arr); // Суммируем на CPU

    const input = new Uint32Array(arr); // Входной массив
    let arrayLength = new Uint32Array([input.length]); // длина входного массива

    //-------------------------------------------------------
    const moduleCompute = device.createShaderModule({
        label: 'compute module',
        code: `
              struct Uniforms {
                length: u32
              };

              @group(0) @binding(0) var<storage, read> inputData: array<u32>;
              @group(0) @binding(1) var<storage, read_write> partialSums: array<u32>;             
              @group(0) @binding(2) var<uniform> uniforms: Uniforms;
        
              var<workgroup> sharedData: array<u32, ${workgroupSize}>;  // shared memory
                           
              @compute @workgroup_size(${workgroupSize}) fn computeSomething(
                @builtin(workgroup_id) workgroup_id : vec3<u32>,
                @builtin(global_invocation_id) id: vec3<u32>,
                @builtin(local_invocation_index) localIndex: u32
              ) {          
                      
  
                // Каждый поток записывает свой элемент в shared memory
                if (id.x < uniforms.length) {
                    sharedData[localIndex] = inputData[id.x]; // номер локального потока это номер в sharedData номер глобального потока это номер в inputData 
                } else {
                    sharedData[localIndex] = 0u;  // дополняем нулями, если не хватает элементов                  
                }
                              

                workgroupBarrier(); // Ждем, пока все потоки запишут свои данные в shared memory

                // Редукция внутри workgroup (суммируем элементы в группе)
                var offset = ${workgroupSize}u >> 1u; // делим на 2
                while (offset > 0u) {
                  if (localIndex < offset) {
                    // Каждый поток суммирует свой элемент в shared memory
                    sharedData[localIndex] += sharedData[localIndex + offset];
                  }
                  offset >>= 1u;
                  workgroupBarrier(); // Ждем, пока все потоки запишут свои данные в shared memory
                }

                // Первый поток группы записывает частичную сумму
                if (localIndex == 0u) {
                  partialSums[workgroup_id.x] = sharedData[0];   // записываем в выходной массив             
                }               

              }
            `,
    }); // Создаем модуль шейдера

    ////////////////////////////////////////////+ 
    // Create a pipeline to do the computation   
    const pipelineCompute = device.createComputePipeline({
        label: 'compute pipeline',
        layout: 'auto',
        compute: {
            module: moduleCompute,
            entryPoint: 'computeSomething',
        },
    });

    // and a buffer to hold the result of the computation 
    const uniformBuffer = device.createBuffer({
        label: 'uniform Buffer',
        size: arrayLength.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    // The input data is a Float32Array of 5 elements
    device.queue.writeBuffer(uniformBuffer, 0, arrayLength);
    // The result buffer is the same size as the input buffer

    const partialSumsBuffer0 = device.createBuffer({
        label: 'partialSumsBuffer0',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    // Copy our input data to that buffer
    device.queue.writeBuffer(partialSumsBuffer0, 0, input);

    const partialSumsBuffer1 = device.createBuffer({
        label: 'partialSumsBuffer1',
        //size: 4 * sizeResultArr, //4 байта на элемент * (input.length/размер workgroup)
        size: input.byteLength, //4 байта на элемент * (input.length/размер workgroup)
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    // create a buffer on the GPU to get a copy of the results
    const resultBuffer = device.createBuffer({
        label: 'result buffer',
        size: 4, //4 байта на элемент * (input.length/размер workgroup),
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    // Setup a bindGroup to tell the shader which
    // buffer to use for the computation
    const bindGroupCompute0 = device.createBindGroup({
        label: 'bindGroupCompute0',
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: partialSumsBuffer0 } },
            { binding: 1, resource: { buffer: partialSumsBuffer1 } },
            { binding: 2, resource: { buffer: uniformBuffer } },
        ],
    });

    // Setup a bindGroup to tell the shader which
    // buffer to use for the computation
    const bindGroupCompute1 = device.createBindGroup({
        label: 'bindGroupCompute1',
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: partialSumsBuffer1 } },
            { binding: 1, resource: { buffer: partialSumsBuffer0 } },
            { binding: 2, resource: { buffer: uniformBuffer } },
        ],
    });

    //Encode commands to do the computation
    let dispatch = input.length;
    /////////////////////////////////////////////////////////////////////////////
    let i = 0
    let encoder;
    let lengthSrcArray;

    while (dispatch > 1) {

        encoder = device.createCommandEncoder({
            label: 'doubling encoder + ' + i,
        });


        lengthSrcArray = Math.ceil(input.length / Math.pow(workgroupSize, i));
        arrayLength = new Uint32Array([lengthSrcArray]);

        dispatch = Math.ceil(lengthSrcArray / workgroupSize);
        device.queue.writeBuffer(uniformBuffer, 0, arrayLength);


        let bindGroup = i % 2 === 0 ? bindGroupCompute0 : bindGroupCompute1;

        await computePassADD(encoder, pipelineCompute, bindGroup, dispatch);

        let partialSums = i % 2 === 0 ? partialSumsBuffer1 : partialSumsBuffer0;
        if (dispatch == 1) {
            encoder.copyBufferToBuffer(partialSums, 0, resultBuffer, 0, resultBuffer.size); //copyBufferToBuffer
        }
        device.queue.submit([encoder.finish()]);
        i++
    }
    //////////////////////////////////////////////////////////////////////////////  

    // Read the results
    await resultBuffer.mapAsync(GPUMapMode.READ);
    let result = new Uint32Array(resultBuffer.getMappedRange().slice());
    resultBuffer.unmap();

    inputOnHTML('resultGPU', result[0]);
}

init();