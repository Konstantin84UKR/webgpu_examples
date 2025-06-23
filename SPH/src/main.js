import { PARTICLE_COUNT ,SIM_RESOLUTION,
  K, 
  K_NEAR,
  INTERACTION_RADIUS,
  REST_DENSITY,
  VELOCITY_DAMPING
} from './settings.js';

import { initWebGPU } from '../../common/initWebGPU.js';
import { initUniformBuffers } from './initUniformBuffers.js';
import { initBindGroup } from './initBindGroup.js';
import { initPipeline } from './renderPipeline/initPipeline.js';

import { simulationData } from './simulationPipeline/simulationData.js';

//Density
import { initPipeline as simulationPipelineDensity  } from './simulationPipeline/density/initPipeline.js';
import { initBindGroup as initBindGroupDensity } from './simulationPipeline/density/initBindGroup.js';

//Pressure
import { initPipeline as simulationPipelinePressure  } from './simulationPipeline/pressure/initPipeline.js';    
import { initBindGroup as initBindGroupPressure } from './simulationPipeline/pressure/initBindGroup.js';

//worldBoundary
import { initPipeline as simulationPipelinewWorldBoundary  } from './simulationPipeline/worldBoundary/initPipeline.js';    
import { initBindGroup as initBindGroupWorldBoundary } from './simulationPipeline/worldBoundary/initBindGroup.js';

//Velocity
import { initPipeline as simulationPipelineVelocity  } from './simulationPipeline/velocity/initPipeline.js';    
import { initBindGroup as initBindGroupVelocity } from './simulationPipeline/velocity/initBindGroup.js';

//let gpu;
const webGPU_Start = async () => {

    //---------------------------------------------------
    //initWebGPU
    const { device, context, format, canvas, aspect} = await initWebGPU(false);
    //---------------------------------------------------
   
    let simulationDataArr = await simulationData();

    // разрешение симуляции, для отрисовки на канвасе
    SIM_RESOLUTION.width = SIM_RESOLUTION.width * aspect[1];
    const uResolution = new Float32Array([aspect[0],aspect[1], SIM_RESOLUTION.width, SIM_RESOLUTION.height]);
    const {uBiffers} = await initUniformBuffers(device,simulationDataArr,uResolution);
    const {uBindGroup} = await initBindGroup(device,uBiffers);
       
    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 

    const {pipeline : renderPipeline} =  await initPipeline(device,format,uBiffers,uBindGroup);
  

    const {uBindGroup : uBindGroupDensity} = await initBindGroupDensity(device,uBiffers); 
    const {pipelineCompute : pipelineDensity} =  await simulationPipelineDensity(device,uBindGroupDensity, 'pipelineDensity');

    const {uBindGroup : uBindGroupPressure} = await initBindGroupPressure(device,uBiffers); 
    const {pipelineCompute : pipelinePressure} =  await simulationPipelinePressure(device,uBindGroupPressure,'pipelinePressure');

    const {uBindGroup : uBindGroupWorldBoundary} = await initBindGroupWorldBoundary(device,uBiffers); 
    const {pipelineCompute : pipelineWorldBoundary} =  await simulationPipelinewWorldBoundary(device,uBindGroupWorldBoundary,'pipelineWorldBoundary');

    const {uBindGroup : uBindGroupVelocity} = await initBindGroupVelocity(device,uBiffers); 
    const {pipelineCompute : pipelineVelocity} =  await simulationPipelineVelocity(device,uBindGroupVelocity,'pipelineVelocity');
        
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

     dt = Math.min(dt * 0.01, 0.16);

     device.queue.writeBuffer(uBiffers.bufferUniform, 0, new Float32Array([dt]));

     //Encode commands to do the computation
    const encoder = device.createCommandEncoder({
        label: 'doubling encoder',
    });


    for (let index = 0; index < 1; index++) {
         
        const computePassDensity = encoder.beginComputePass({
            label: 'doubling computePassDensity',
        });

    computePassDensity.setPipeline(pipelineDensity);
    computePassDensity.setBindGroup(0, uBindGroupDensity.bindGroupsComputeDensity[(t+0) % 2].bindGroup);
    computePassDensity.setBindGroup(1, uBindGroupDensity.bindGroupUniform);
    computePassDensity.dispatchWorkgroups(Math.ceil(PARTICLE_COUNT / 64));
    computePassDensity.end();

   // encoder.copyBufferToBuffer( uBindGroupDensity.bindGroupsComputeDensity[t % 2].buffer, 0, uBiffers.resultBuffer, 0, uBiffers.density.size);

//    // encoder.copyBufferToBuffer( uBiffers.density, 0, uBiffers.resultBuffer, 0, uBiffers.density.size);
    const computePassPressure = encoder.beginComputePass({
            label: 'doubling computePassPressure',
        });
    
    computePassPressure.setPipeline(pipelinePressure);
    computePassPressure.setBindGroup(0, uBindGroupPressure.bindGroupsComputePressure[(t+0) % 2].bindGroup);
    computePassPressure.setBindGroup(1, uBindGroupPressure.bindGroupUniform);
    computePassPressure.dispatchWorkgroups(Math.ceil(PARTICLE_COUNT / 64));
    computePassPressure.end();   
    



    // const computePassWorldBoundary = encoder.beginComputePass({
    //         label: 'doubling computePassWorldBoundary',
    //     });
    
    // computePassWorldBoundary.setPipeline(pipelineWorldBoundary   );
    // computePassWorldBoundary.setBindGroup(0, uBindGroupWorldBoundary.bindGroupsCompute[(t+1) % 2].bindGroup);
    // computePassWorldBoundary.setBindGroup(1, uBindGroupWorldBoundary.bindGroupUniform);
    // computePassWorldBoundary.dispatchWorkgroups(Math.ceil(PARTICLE_COUNT / 64));
    // computePassWorldBoundary.end(); 

    
   // encoder.copyBufferToBuffer( uBindGroupPressure.bindGroupsComputePressure[t % 2].buffer, 0, uBiffers.resultBuffer, 0, 128);
    //device.queue.submit([encoder.finish()]);

    //  const encoder2 = device.createCommandEncoder({
    //     label: 'doubling encoder2',
    // });
    const computePassVelocity = encoder.beginComputePass({
            label: 'doubling computePassVelocity',
        });
    
    computePassVelocity.setPipeline(pipelineVelocity);
    computePassVelocity.setBindGroup(0, uBindGroupVelocity.bindGroupsComputeVelocity[(t+1) % 2].bindGroup);
    computePassVelocity.setBindGroup(1, uBindGroupVelocity.bindGroupUniform);
    computePassVelocity.dispatchWorkgroups(Math.ceil(PARTICLE_COUNT / 64));
    computePassVelocity.end();    

    //encoder.copyBufferToBuffer( uBiffers.velocity_A, 0, uBiffers.resultBuffer, 0, 128);
    //encoder.copyBufferToBuffer( uBiffers.position_A, 0, uBiffers.resultBuffer, 0, 32);
    
    device.queue.submit([encoder.finish()]);

    const encoder2 = device.createCommandEncoder({
        label: 'doubling encoder',
    });

      const computePassWorldBoundary = encoder2.beginComputePass({
            label: 'doubling computePassWorldBoundary',
        });
    
    computePassWorldBoundary.setPipeline(pipelineWorldBoundary);
    computePassWorldBoundary.setBindGroup(0, uBindGroupWorldBoundary.bindGroupsCompute[(t+1) % 2].bindGroup);
    computePassWorldBoundary.setBindGroup(1, uBindGroupWorldBoundary.bindGroupUniform);
    computePassWorldBoundary.dispatchWorkgroups(Math.ceil(PARTICLE_COUNT / 64));
    computePassWorldBoundary.end(); 

    device.queue.submit([encoder2.finish()]);
    //++t;

//    //Read the results
//     await uBiffers.resultBuffer.mapAsync(GPUMapMode.READ);
//     let result = new Float32Array(uBiffers.resultBuffer.getMappedRange().slice());
//     uBiffers.resultBuffer.unmap();
//     console.log('result', result);
     
   
       
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
    renderPass.setPipeline(renderPipeline); // подключаем наш pipeline
    renderPass.setBindGroup(0,  uBindGroup.bindGroupsCompute[(t+1) % 2].bindGroupRender);
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