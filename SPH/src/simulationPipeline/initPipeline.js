import { computeShader } from './shaders/shader.js';

export async function initPipeline(device,uBindGroup, label = 'compute pipeline') {
    
    //-------------------------------------------------------------------------------------------------------
    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 
    const pipelineCompute = device.createComputePipeline({
        label: label,
        layout: device.createPipelineLayout({
            label: 'render_bindGroupLayouts ',
            bindGroupLayouts: uBindGroup.layoutArr,
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
 
   