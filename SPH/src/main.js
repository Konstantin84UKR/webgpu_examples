import { PARTICLE_COUNT ,SIM_RESOLUTION} from './settings.js';

import { initWebGPU } from '../../common/initWebGPU.js';
import { initUniformBuffers } from './initUniformBuffers.js';
import { initBindGroup } from './initBindGroup.js';
import { initPipeline } from './renderPipeline/initPipeline.js';
import { initPipeline as simulationPipeline } from './simulationPipeline/initPipeline.js';
import { simulationData } from './simulationPipeline/simulationData.js';

//Density
import { initPipeline as simulationPipelineDensity  } from './simulationPipeline/density/initPipeline.js';
import { initBindGroup as initBindGroupDensity } from './simulationPipeline/density/initBindGroup.js';


//Pressure
import { initPipeline as simulationPipelinePressure  } from './simulationPipeline/pressure/initPipeline.js';    
import { initBindGroup as initBindGroupPressure } from './simulationPipeline/pressure/initBindGroup.js';

//let gpu;
const webGPU_Start = async () => {

    //---------------------------------------------------
    //initWebGPU
    const { device, context, format, canvas, aspect} = await initWebGPU(true);
    //---------------------------------------------------
   
    let simulationDataArr = await simulationData();

    // разрешение симуляции, для отрисовки на канвасе
    const uResolution = new Float32Array([aspect[0],aspect[1], SIM_RESOLUTION.width, SIM_RESOLUTION.height]);
    const {uBiffers} = await initUniformBuffers(device,simulationDataArr,uResolution);
    const {uBindGroup} = await initBindGroup(device,uBiffers);
       
    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 

    const {pipeline} =  await initPipeline(device,format,uBiffers,uBindGroup);
    const {pipelineCompute} =  await simulationPipeline(device,format,uBiffers,uBindGroup);

    const {uBindGroup : uBindGroupDensity} = await initBindGroupDensity(device,uBiffers); 
    const {pipelineCompute : pipelineDensity} =  await simulationPipelineDensity(device,uBindGroupDensity);

    const {uBindGroup : uBindGroupPressure} = await initBindGroupPressure(device,uBiffers); 
    const {pipelineCompute : pipelinePressure} =  await simulationPipelinePressure(device,uBindGroupPressure);
        
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
     device.queue.writeBuffer(uBiffers.bufferUniform, 0, new Float32Array([dt * 0.01]));

     //Encode commands to do the computation
    const encoder = device.createCommandEncoder({
        label: 'doubling encoder',
    });


    for (let index = 0; index < 1; index++) {
         
        const computePassDensity = encoder.beginComputePass({
            label: 'doubling computePassDensity',
        });

    computePassDensity.setPipeline(pipelineDensity);
    computePassDensity.setBindGroup(0, uBindGroupDensity.bindGroupsComputeDensity[t % 2].bindGroup);
    computePassDensity.setBindGroup(1, uBindGroupDensity.bindGroupUniform);
    computePassDensity.dispatchWorkgroups(Math.ceil(PARTICLE_COUNT / 64));
    computePassDensity.end();

   // encoder.copyBufferToBuffer( uBiffers.density, 0, uBiffers.resultBuffer, 0, uBiffers.density.size);

//    // encoder.copyBufferToBuffer( uBiffers.density, 0, uBiffers.resultBuffer, 0, uBiffers.density.size);
    const computePassPressure = encoder.beginComputePass({
            label: 'doubling computePassPressure',
        });
    
    computePassPressure.setPipeline(pipelinePressure);
    computePassPressure.setBindGroup(0, uBindGroupPressure.bindGroupsComputePressure[t % 2].bindGroup);
    computePassPressure.setBindGroup(1, uBindGroupPressure.bindGroupUniform);
    computePassPressure.dispatchWorkgroups(Math.ceil(PARTICLE_COUNT / 64));
    computePassPressure.end();    

    
   // encoder.copyBufferToBuffer( uBindGroupPressure.bindGroupsComputePressure[t % 2].buffer, 0, uBiffers.resultBuffer, 0, 128);

     device.queue.submit([encoder.finish()]);

    //++t;

    //Read the results
    // await uBiffers.resultBuffer.mapAsync(GPUMapMode.READ);
    // let result = new Float32Array(uBiffers.resultBuffer.getMappedRange().slice());
    // uBiffers.resultBuffer.unmap();

    // //console.log('input', inputData);
    // console.log('result', result);
    
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
            clearValue: { r: 0.2, g: 0.3, b: 0.4, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store' //хз
        }]
    });
    renderPass.setPipeline(pipeline); // подключаем наш pipeline
    renderPass.setBindGroup(0,  uBindGroup.bindGroupsCompute[t % 2].bindGroupRender);
    renderPass.setBindGroup(1,  uBindGroup.bindGroupRender_Uniform);
    renderPass.draw(48, PARTICLE_COUNT);
    renderPass.end();

    device.queue.submit([encoderRender.finish()]);
      ++t;
      window.requestAnimationFrame(animate);

     } // for
    };
    animate(0);
}

webGPU_Start();