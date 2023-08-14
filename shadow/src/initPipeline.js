export async function initPipeline(device, canvas, format, uBiffers, shader, texture, sampler, shaderShadow) {

    // -- 1) Создаем Layout
    // -- 2) Создаем BindGroup согласно Layout
    // -- 3) Добавляем Layout в массив createPipelineLayout
    // -- 4) создаем Pipeline 

    // ************* shadowPipeline *************** //

    const bindGroupLayout_0_shadowPipeline = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {}
        }]
    });

    const bindGroupLayout_1_shadowPipeline = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {}
        }]
    });

    const shadowGroup0 = device.createBindGroup({
        label: 'Group for shadowPass',
        //layout: shadowPipeline.getBindGroupLayout(0),
        layout: bindGroupLayout_0_shadowPipeline,
        entries: [{
            binding: 0,
            resource: {
                buffer: uBiffers.uniformBuffershadow,
                offset: 0,
                size: 64 + 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX +  MODELMATRIX_PLANE // Каждая матрица занимает 64 байта
            }
        }]
    })

    const shadowGroup1 = device.createBindGroup({
        label: 'Group for shadowPass',
        //layout: shadowPipeline.getBindGroupLayout(0),
        layout: bindGroupLayout_1_shadowPipeline,
        entries: [{
            binding: 0,
            resource: {
                buffer: uBiffers.uniformBufferModel,
                offset: 0,
                size: 64  //  MODELMATRIX // Каждая матрица занимает 64 байта
            }
        }]
    })

    const shadowGroup2 = device.createBindGroup({
        label: 'Group for shadowPass',
        //layout: shadowPipeline.getBindGroupLayout(0),
        layout: bindGroupLayout_1_shadowPipeline,
        entries: [{
            binding: 0,
            resource: {
                buffer: uBiffers.uniformBufferModel_2,
                offset: 0,
                size: 64  //  MODELMATRIX // Каждая матрица занимает 64 байта
            }
        }]
    })

    const pipelineLayout_shadowPipeline = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout_0_shadowPipeline, bindGroupLayout_1_shadowPipeline]
    });

    const shadowPipeline = await device.createRenderPipeline({
        label: "shadow piplen",
        //layout: "auto",
        layout: pipelineLayout_shadowPipeline,
        vertex: {
            module: device.createShaderModule({
                code: shaderShadow.vertex,
            }),
            entryPoint: "main",
            buffers: [
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 0,
                        format: "float32x3",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 1,
                        format: "float32x2",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 2,
                        format: "float32x3",
                        offset: 0
                    }]
                }
            ]
        },
        primitive: {
            topology: "triangle-list",
            //topology: "point-list",
        },
        depthStencil: {
            format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
            depthWriteEnabled: true, //вкл\выкл теста глубины 
            depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. //greater
        }
    });

    // Создаем текстуру глубины, для рендера от лица источника света. 
    // Эта текстура будет использована для теста глубины при формировании тени.
    let shadowDepthTexture = device.createTexture({
        //size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        size: [512, 512, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });

    let shadowDepthView = shadowDepthTexture.createView();

    const shadowPipelineGroup = {
        pipeline: shadowPipeline,
        depthTexture: shadowDepthTexture,
        depthView: shadowDepthView,
        bindGroup: {
            shadowGroup0,
            shadowGroup1,
            shadowGroup2
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////

     // ************* Pipeline Main *************** //
    //** настраиваем конвейер рендера 
    //** настраиваем шейдеры указав исходник,точку входа, данные буферов
    //** arrayStride количество байт на одну вершину */
    //** attributes настриваем локацию формат и отступ от начала  arrayStride */
    //** primitive указываем тип примитива для отрисовки*/
    //** depthStencil настраиваем буффер глубины*/

    // Создаем текстуру глубины, для рендера от лица источника света. 
    // Эта текстура будет использована для теста глубины при формировании тени.

    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    const bindGroupLayout_0_pipeline = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {}
        }, {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {}
        }, {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {}
        }, {
            binding: 3,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {}
        }, {
            binding: 4,
            visibility: GPUShaderStage.VERTEX,
            buffer: {}
        }]
    });


    const uniformBindGroup0 = device.createBindGroup({
        //layout: pipeline.getBindGroupLayout(0),
        layout: bindGroupLayout_0_pipeline,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uBiffers.uniformBuffer,
                    offset: 0,
                    size: 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
                }
            },
            {
                binding: 1,
                resource: sampler
            },
            {
                binding: 2,
                resource: texture.createView()
            },
            {
                binding: 3,
                resource: {
                    buffer: uBiffers.fragmentUniformBuffer,
                    offset: 0,
                    size: 16 + 16 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
                }
            },
            {
                binding: 4,
                resource: {
                    buffer: uBiffers.uniformBuffershadow,
                    offset: 0,
                    size: 64 + 64 + 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX + + MODELMATRIX_PLANE// Каждая матрица занимает 64 байта
                }
            }
        ]
    });

    const bindGroupLayout_1_pipeline = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {
                sampleType: 'depth',
            }
        }, {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {
                type: 'comparison',
            },
        }]
    });

    const uniformBindGroup1 = device.createBindGroup({
        label: 'uniform Bind Group1 ',
        //layout: pipeline.getBindGroupLayout(1),
        layout: bindGroupLayout_1_pipeline,
        entries: [
            {
                binding: 0,
                resource: shadowPipelineGroup.depthView
            },
            {
                binding: 1,
                resource: device.createSampler({
                    compare: 'less',
                })
            }
        ]
    });


    const bindGroupLayout_2_pipeline = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
                type: 'uniform'
            }
        }]
    });

    const uniformBindGroup2 = device.createBindGroup({
        label: 'uniform Bind Group2 ',
        //layout: pipeline.getBindGroupLayout(1),
        layout: bindGroupLayout_2_pipeline,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uBiffers.uniformBufferModel,
                    offset: 0,
                    size: 64  //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
                }
            }
        ]
    });

    const uniformBindGroup2_1 = device.createBindGroup({
        label: 'uniform Bind Group2 ',
        //layout: pipeline.getBindGroupLayout(1),
        layout: bindGroupLayout_2_pipeline,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uBiffers.uniformBufferModel_2,
                    offset: 0,
                    size: 64  //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
                }
            }
        ]
    });


    const pipelineLayout_pipeline = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout_0_pipeline, bindGroupLayout_1_pipeline, bindGroupLayout_2_pipeline]
    });

    const pipeline = device.createRenderPipeline({
        //layout: 'auto',
        layout: pipelineLayout_pipeline,
        vertex: {
            module: device.createShaderModule({
                code: shader.vertex,
            }),
            entryPoint: "main",
            buffers: [
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 0,
                        format: "float32x3",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 1,
                        format: "float32x2",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 2,
                        format: "float32x3",
                        offset: 0
                    }]
                }
            ]
        },
        fragment: {
            module: device.createShaderModule({
                code: shader.fragment,
            }),
            entryPoint: "main",
            targets: [
                {
                    format: format,
                },
            ],
        },
        primitive: {
            topology: "triangle-list",
            //topology: "point-list",
        },
        depthStencil: {
            format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus depth32float
            depthWriteEnabled: true, //вкл\выкл теста глубины 
            depthCompare: 'greater' //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
            //depthCompare: 'never' //'less' // greater
        }
    });

    // Эта теневая текстура для обычного теста глубины при рендере сцены.
    const depthTexture = device.createTexture({
        size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    const pipelineMainGroup = {
        pipeline: pipeline,
        depthTexture: depthTexture,
        depthView: depthTexture.createView(),
        bindGroup: {
            uniformBindGroup0,
            uniformBindGroup1,
            uniformBindGroup2,
            uniformBindGroup2_1
        }
    }

    return { shadowPipelineGroup, pipelineMainGroup }
}