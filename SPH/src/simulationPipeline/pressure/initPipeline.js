import { computeShader } from './shaderPressure.js';

export async function initPipeline(device, uBindGroup) {
    
    //-------------------------------------------------------------------------------------------------------
    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 
    const pipelineCompute = device.createComputePipeline({
        label: 'compute pipeline',
        layout: device.createPipelineLayout({
            label: 'render_bindGroupLayouts ',
            bindGroupLayouts: [uBindGroup.layout.computeBindGroupLayoutPressure, uBindGroup.layout.computeBindGroupLayoutUniform],
        }),
        compute: {
            module: device.createShaderModule({
                code: computeShader.code
            }),
            entryPoint: 'computeSomething',
        },
    });

       return {pipelineCompute};

    }
 
   