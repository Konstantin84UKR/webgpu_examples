export async function initPipeline(device, canvas, format, uBiffers, shader, textures, sampler, shaderShadow) {

    // -- 1) Создаем Layout
    // -- 2) Создаем BindGroup согласно Layout
    // -- 3) Добавляем Layout в массив createPipelineLayout
    // -- 4) создаем Pipeline 

    // ************* shadowPipeline *************** //
    //--------------------------------------------------
    const shadowPipeline = await device.createRenderPipeline({
        label: "shadow piplen",
        layout: "auto",
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
            depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
        }
    });

    let shadowDepthTexture = device.createTexture({
        size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });

    let shadowDepthView = shadowDepthTexture.createView();

    const shadowGroup0 = device.createBindGroup({
        label: 'Group for shadowPass',
        layout: shadowPipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: {
                buffer: uBiffers.uniformBuffershadow,
                offset: 0,
                size: 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
        }]
    })

    const shadowPipelineGroup = {
        pipeline: shadowPipeline,
        depthTexture: shadowDepthTexture,
        depthView: shadowDepthView,
        bindGroup: {
            shadowGroup0,
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



    const pipeline = device.createRenderPipeline({
        layout: 'auto',
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
                },

                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 3,
                        format: "float32x3",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 4,
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
            format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
            depthWriteEnabled: true, //вкл\выкл теста глубины 
            depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
        }
    });

    const depthTexture = device.createTexture({
        size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });



    const uniformBindGroup0 = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
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
                resource: textures.texture_DIFFUSE.createView()
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
                    size: 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
                }
            },
            {
                binding: 5,
                resource: textures.texture_NORMAL.createView()
            },
            {
                binding: 6,
                resource: textures.texture_SPECULAR.createView()
            }
        ]
    });

    const uniformBindGroup1 = device.createBindGroup({
        label: 'uniform Bind Group1 ',
        layout: pipeline.getBindGroupLayout(1),
        entries: [
            {
                binding: 0,
                resource: shadowDepthView
            },
            {
                binding: 1,
                resource: device.createSampler({
                    compare: 'less',
                })
            },
            {
                binding: 2,
                resource: {
                    buffer: uBiffers.fragmentUniformBuffer1,
                    offset: 0,
                    size: 16  //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
                }
            }
        ]
    });


    const pipelineMainGroup = {
        pipeline: pipeline,
        depthTexture: depthTexture,
        depthView: depthTexture.createView(),
        bindGroup: {
            uniformBindGroup0,
            uniformBindGroup1,
        }
    }

    return { shadowPipelineGroup, pipelineMainGroup }
}