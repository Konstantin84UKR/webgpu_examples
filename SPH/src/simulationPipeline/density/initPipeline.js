import { computeShader } from './shaderDensity.js';

export async function initPipeline(device, uBindGroup) {
    
    //-------------------------------------------------------------------------------------------------------
    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 
    const pipelineCompute = device.createComputePipeline({
        label: 'compute pipeline',
        layout: device.createPipelineLayout({
            label: 'render_bindGroupLayouts ',
            bindGroupLayouts: [uBindGroup.layout.computeBindGroupLayoutDensity],
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
 
   