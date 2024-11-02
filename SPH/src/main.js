import { PARTICLE_COUNT } from './settings.js';
import {
    mat4, vec3,
  } from '../../common/wgpu-matrix.module.js';

import { initWebGPU } from '../../common/initWebGPU.js';
import { initUniformBuffers } from './initUniformBuffers.js';
import { initBindGroup } from './initBindGroup.js';
import { initPipeline } from './renderPipeline/initPipeline.js';
import { initPipeline as simulationPipeline } from './simulationPipeline/initPipeline.js';
import { simulationData } from './simulationPipeline/simulationData.js';
//let gpu;
const webGPU_Start = async () => {

    //---------------------------------------------------
    //initWebGPU
    const { device, context, format, canvas, aspect} = await initWebGPU(true);
    //---------------------------------------------------

    const numParticles = PARTICLE_COUNT;
    const inputData = new Float32Array(numParticles * 8);
    for (let i = 0; i < numParticles; ++i) {
        inputData[8 * i + 0] = 2 * (Math.random() - 0.5) * 0.9; //pos
        inputData[8 * i + 1] = 2 * (Math.random() - 0.5) * 0.9;
        
        inputData[8 * i + 2] = 2 * (Math.random() - 0.5) * 0.5; //vel
        inputData[8 * i + 3] = 2 * (Math.random() - 0.5) * 0.3;
     
        inputData[8 * i + 4] = Math.random() * 0.00 + 0.01; //scale
        inputData[8 * i + 5] = Math.random() * 0.3; //aline
        inputData[8 * i + 6] = Math.random() * 0.7;
        inputData[8 * i + 7] = Math.random() * 0.3;
    }
    //console.log('Particle Count:', numParticles);

    let simulationDataArr = await simulationData(device,inputData,aspect);

    const {uBiffers} = await initUniformBuffers(device,simulationDataArr,aspect);
    const {uBindGroup} = await initBindGroup(device,uBiffers);
    
     
   
    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 

    const {pipeline} =  await initPipeline(device,format,uBiffers,uBindGroup);
    const {pipelineCompute} =  await simulationPipeline(device,format,uBiffers,uBindGroup);

     
    
    // Animation   
let time_old = 0; 
let t = 0;

async function animate(time) {
     
    //-----------------TIME-----------------------------
    //console.log(time);
     let dt = time - time_old;
     time_old = time;
     //console.log(dt);
     //--------------------------------------------------
     device.queue.writeBuffer(uBiffers.bufferUniform, 0, new Float32Array([dt * 0.001]));

     

     //Encode commands to do the computation
    const encoder = device.createCommandEncoder({
        label: 'doubling encoder',
    });


    for (let index = 0; index < 1; index++) {
              
    
    const computePass = encoder.beginComputePass({
        label: 'doubling compute pass',
    });

    computePass.setPipeline(pipelineCompute);
    computePass.setBindGroup(0, uBindGroup.bindGroupsCompute[t % 2].bindGroup);
    computePass.setBindGroup(1, uBindGroup.bindGroupUniform);
    computePass.dispatchWorkgroups(Math.ceil(numParticles / 64));
    computePass.end();

    encoder.copyBufferToBuffer( uBindGroup.bindGroupsCompute[t % 2].buffer, 0, uBiffers.resultBuffer, 0, uBiffers.resultBuffer.size);

    device.queue.submit([encoder.finish()]);

    ++t;

    //Read the results
    // await uBiffers.resultBuffer.mapAsync(GPUMapMode.READ);
    // let result = new Float32Array(uBiffers.resultBuffer.getMappedRange().slice());
    // uBiffers.resultBuffer.unmap();

    //  console.log('input', inputData);
    //  console.log('result', result);
    
    }
   
       
    // //--------------------------------------------------
    //device.queue.writeBuffer(bufferPosition, 0, result);

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
    renderPass.setBindGroup(0,  uBindGroup.bindGroupsCompute[t % 2].bindGroupRender);
    renderPass.setBindGroup(1,  uBindGroup.bindGroupRender_Uniform);
    renderPass.draw(64, numParticles);
    renderPass.end();

    device.queue.submit([encoderRender.finish()]);
     // ++t;
      window.requestAnimationFrame(animate);
    };
    animate(0);
}

webGPU_Start();