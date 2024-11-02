import { computeShader } from './shaders/shader.js';

export async function initPipeline(device, format, uBiffers,uBindGroup) {
    
    //-------------------------------------------------------------------------------------------------------
    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 
    const pipelineCompute = device.createComputePipeline({
        label: 'compute pipeline',
        layout: device.createPipelineLayout({
            label: 'render_bindGroupLayouts ',
            bindGroupLayouts: [uBindGroup.layout.computeBindGroupLayout,uBindGroup.layout.computeBindGroupLayoutUniform],
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
 
   