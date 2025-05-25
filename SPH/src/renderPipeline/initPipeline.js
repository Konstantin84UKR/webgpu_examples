import { renderShader } from './shaders/shader.js';

export async function initPipeline(device, format, uBiffers, uBindGroup) {
    
    //-------------------------------------------------------------------------------------------------------
    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 
        const pipeline = device.createRenderPipeline({
            label: 'render_pipeline',
            layout: device.createPipelineLayout({
                label: 'render_bindGroupLayouts ',
                //bindGroupLayouts: [uBindGroup.layout.renderBindGroupLayout, uBindGroup.layout.renderBindGroupLayout_Uniform],
                bindGroupLayouts: [ uBindGroup.layout.renderBindGroupLayout, 
                                    uBindGroup.layout.renderBindGroupLayout_Uniform],
            }),
            vertex: {
                module: device.createShaderModule({
                    code: renderShader.vertex
                }),
                entryPoint: "vertex_main"
            },
            fragment: {
                module: device.createShaderModule({
                    code: renderShader.fragment
                }),
                entryPoint: "fragment_main",
                targets: [{
                    format: format
                }]
            },
            primitive: {
                topology: "triangle-list", // что будем рисовать точки - треугольники - линии "line-list","triangle-list"
            }
        });

       return {pipeline};

    }
 
   