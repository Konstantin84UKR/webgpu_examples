import { computeShader } from './shaderVelocity.js';

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
            label: 'render_bindGroupLayouts ',
           // bindGroupLayouts: [uBindGroup.layout.computeBindGroupLayoutVelocity, uBindGroup.layout.computeBindGroupLayoutUniform],
            bindGroupLayouts: uBindGroup.layoutArr,
            
        }),
        compute: {
            module: device.createShaderModule({
                code: computeShader.code
            }),
            entryPoint: 'computeSomething',
            constants: {
                VELOCITY_DAMPING: VELOCITY_DAMPING,
                SIM_RESOLUTION_X: SIM_RESOLUTION.width,   
                SIM_RESOLUTION_Y: SIM_RESOLUTION.height        
            }
        },
    });

       return {pipelineCompute};

    }
 
   