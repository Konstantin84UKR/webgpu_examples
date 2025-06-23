import { computeShader } from './shaderPressure.js';

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
            //bindGroupLayouts: [uBindGroup.layout.computeBindGroupLayoutPressure, uBindGroup.layout.computeBindGroupLayoutUniform],
            bindGroupLayouts: uBindGroup.layoutArr,
        }),
        compute: {
            module: device.createShaderModule({
                code: computeShader.code
            }),
            entryPoint: 'computeSomething',
             constants: {
                        K: K,
                        K_NEAR: K_NEAR,
                        INTERACTION_RADIUS: INTERACTION_RADIUS,
                        REST_DENSITY: REST_DENSITY,           
                  }
        },
    });

       return {pipelineCompute};

    }
 
   