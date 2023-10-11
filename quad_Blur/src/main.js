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

// Читаем данные и3 TILE Если они попадают в область для размытия (TODO)
// тогла Читаем соседние пиксели по горизонтали и делим наколичество пикселей размытия
// так мы получаем усредненый цвет

// Пишем в текстура что получилось.

// На следуюшей итерации меняем X и Y местами
// Размытие идеи уде не по горизонтале, а по вертикале.

import { initWebGPU } from '../../common/initWebGPU.js';

import { initResurse } from './initResurse.js';
import { computeShader } from './shaders/computeShader.js';
import { postEffectShader } from './shaders/postEffectShader.js';
import { initPipelineCompute } from './initPipelineCompute.js';
import { initUniformBuffers } from './initUniformBuffers.js';
import { initPostEffectPipeline } from './initPostEffectPipeline.js'

const webGPU_Start = async () => {

    //---------------------------------------------------
    //initWebGPU
    const { device, context, format, canvas} = await initWebGPU(false,900,900);
    //---------------------------------------------------
    //initResurse
    const { textureImage, imageBitmap} = await initResurse(device, format);
    //---------------------------------------------------
    //initBuffers
    const { uBuffers } = await initUniformBuffers(device);  
    //---------------------------------------------------
    //initPipeline
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear'
    })
    
    const blurParamsBuffer = device.createBuffer({
        size: 8,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
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

    const { pipelineCompute } = await initPipelineCompute(device, computeShader, sampler, blurParamsBuffer, uBuffers, textureImage,textures); 
    const { pipeline } = await initPostEffectPipeline(device, format, postEffectShader, sampler, textures);
    //-------------------------------------------------- 
        
    device.queue.writeBuffer(uBuffers.bufferUniform, 0, uBuffers.bufferUniform.data);
  
    const settings = {
        filterSize: 20,
        iterations: 10,
    };

    const tileDim = 128;
    // const batch = [4, 4];
    
    let blockDim = tileDim - (settings.filterSize - 1);
    device.queue.writeBuffer( blurParamsBuffer, 0, new Uint32Array([settings.filterSize, blockDim]));
     
    //--------------------------------------------------
    const commandEncoder = device.createCommandEncoder(); //
    //------------------  COMPUTE-----------------------
    const computePass = commandEncoder.beginComputePass({
        label: 'doubling compute pass',
    });

    computePass.setPipeline(pipelineCompute);

    computePass.setBindGroup(1, pipelineCompute.BindGroup.computeConstants);
    computePass.setBindGroup(0, pipelineCompute.BindGroup.computeBindGroup0);
   
    computePass.dispatchWorkgroups(
        Math.ceil(imageBitmap.width / blockDim),
        Math.ceil(imageBitmap.height / 4));   

    for (let i = 0; i < settings.iterations - 1; ++i) {
        
        computePass.setBindGroup(0, pipelineCompute.BindGroup.computeBindGroup1);

        computePass.dispatchWorkgroups(
            Math.ceil(imageBitmap.width / blockDim),
            Math.ceil(imageBitmap.height / 4));
        
        computePass.setBindGroup(0, pipelineCompute.BindGroup.computeBindGroup2);

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
            storeOp: 'store' 
        }]
    });
    renderPass.setBindGroup(0, pipeline.BindGroup.bindGroup);
    renderPass.setPipeline(pipeline); // подключаем наш pipeline
    renderPass.draw(6);  
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);   
}

webGPU_Start();