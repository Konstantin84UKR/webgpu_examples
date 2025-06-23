import { computeShader } from './shaderDensity.js';

import { SIM_RESOLUTION,
  K, 
  K_NEAR,
  INTERACTION_RADIUS,
  REST_DENSITY,
  VELOCITY_DAMPING } from "../../settings.js";

export async function initPipeline(device, uBindGroup, label = 'compute pipeline') {
    
    //-------------------------------------------------------------------------------------------------------
    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 
    const pipelineCompute = device.createComputePipeline({
        label: label,
        layout: device.createPipelineLayout({
            label: label + '_bindGroupLayouts ',
           // bindGroupLayouts: [uBindGroup.layout.computeBindGroupLayoutDensity],
            bindGroupLayouts: uBindGroup.layoutArr,
        }),
        compute: {
            module: device.createShaderModule({
                code: computeShader.code                
            }),
            entryPoint: 'computeSomething',
            constants: {
            INTERACTION_RADIUS: INTERACTION_RADIUS,
            VELOCITY_DAMPING: VELOCITY_DAMPING           
      },
        },
    });

       return {pipelineCompute};

    }
 
   