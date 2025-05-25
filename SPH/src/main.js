import { PARTICLE_COUNT ,SIM_RESOLUTION} from './settings.js';

import { initWebGPU } from '../../common/initWebGPU.js';
import { initUniformBuffers } from './initUniformBuffers.js';
import { initBindGroup } from './initBindGroup.js';
import { initPipeline } from './renderPipeline/initPipeline.js';
//import { initPipeline as simulationPipeline } from './simulationPipeline/initPipeline.js';
import { simulationData } from './simulationPipeline/simulationData.js';

//let gpu;
const webGPU_Start = async () => {

    //---------------------------------------------------
    //initWebGPU
    const { device, context, format, canvas, aspect} = await initWebGPU(true);
    //---------------------------------------------------

    const numParticles = PARTICLE_COUNT;

   
    let simulationDataArr = await simulationData();

    // разрешение симуляции, для отрисовки на канвасе
    const uResolution = new Float32Array([aspect[0],aspect[1], SIM_RESOLUTION.width, SIM_RESOLUTION.height]);
    const {uBiffers} = await initUniformBuffers(device,simulationDataArr,uResolution);
    const {uBindGroup} = await initBindGroup(device,uBiffers);
    
     
   
    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 

    const {pipeline} =  await initPipeline(device,format,uBiffers,uBindGroup);
    //const {pipelineCompute} =  await simulationPipeline(device,format,uBiffers,uBindGroup);

     
    
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

     

    //  //Encode commands to do the computation
    // const encoder = device.createCommandEncoder({
    //     label: 'doubling encoder',
    // });


    // for (let index = 0; index < 1; index++) {
              
    
    // const computePass = encoder.beginComputePass({
    //     label: 'doubling compute pass',
    // });

    // computePass.setPipeline(pipelineCompute);
    // computePass.setBindGroup(0, uBindGroup.bindGroupsCompute[t % 2].bindGroup);
    // computePass.setBindGroup(1, uBindGroup.bindGroupUniform);
    // computePass.dispatchWorkgroups(Math.ceil(numParticles / 64));
    // computePass.end();

    // encoder.copyBufferToBuffer( uBindGroup.bindGroupsCompute[t % 2].buffer, 0, uBiffers.resultBuffer, 0, uBiffers.resultBuffer.size);

    // device.queue.submit([encoder.finish()]);

    // ++t;

    // //Read the results
    // // await uBiffers.resultBuffer.mapAsync(GPUMapMode.READ);
    // // let result = new Float32Array(uBiffers.resultBuffer.getMappedRange().slice());
    // // uBiffers.resultBuffer.unmap();

    // //  console.log('input', inputData);
    // //  console.log('result', result);
    
    // }
   
       
    // //--------------------------------------------------
    //device.queue.writeBuffer(bufferPosition, 0, result);

    const encoderRender = device.createCommandEncoder({
        label: 'doubling encoder',
    });

    const textureView = context.getCurrentTexture().createView(); // тектура к которой привязан контекст
    const renderPass = encoderRender.beginRenderPass({  // натсраиваем проход рендера, подключаем текстуру канваса это значать выводлить результат на канвас
        colorAttachments: [{
            view: textureView,
            clearValue: { r: 0.2, g: 0.2, b: 0.2, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store' //хз
        }]
    });
    renderPass.setPipeline(pipeline); // подключаем наш pipeline
    renderPass.setBindGroup(0,  uBindGroup.bindGroupRender_A);
    renderPass.setBindGroup(1,  uBindGroup.bindGroupRender_Uniform);
    renderPass.draw(48, numParticles);
    renderPass.end();

    device.queue.submit([encoderRender.finish()]);
     // ++t;
      window.requestAnimationFrame(animate);
    };
    animate(0);
}

webGPU_Start();