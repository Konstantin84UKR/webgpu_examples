import { shaderPBR } from './shaderPBR.js';

export async function initPipeline(device, context, canvas, format,uBiffers,shadowPipeline,RES,texture_CUBE){

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
          module: device.createShaderModule({
            code: shaderPBR.vertex,
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
            }         
          ]
        },
        fragment: {
          module: device.createShaderModule({
            code: shaderPBR.fragment,
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
          cullMode: 'back',  //'back'  'front'  
          frontFace: 'ccw' //'ccw' 'cw'
        },
        depthStencil: {
          format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
          depthWriteEnabled: true, //вкл\выкл теста глубины 
          depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
        }
      });

      const uniformBindGroup = device.createBindGroup({
        label: 'Group for uniformBindGroup',
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
            resource: RES.TEXs.PBR.samplerPBR
          },
          {
            binding: 2,
            resource: RES.TEXs.PBR.texture_ALBEDO.createView()
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
            resource: RES.TEXs.PBR.texture_NORMAL.createView()
          },
          {
            binding: 6,
            resource: RES.TEXs.PBR.texture_ROUGHNESS.createView()
          },
          {
            binding: 7,
            resource: RES.TEXs.PBR.texture_METALLIC.createView()
          },
          {
            binding: 8,
            resource: RES.TEXs.PBR.texture_AO.createView()
          },
          {
            binding: 9,
            resource: RES.TEXs.PBR.texture_EMISSIVE.createView()
          }
        ]
      });
    
      const uniformBindGroup1 = device.createBindGroup({
        label: 'uniform Bind Group1 ',
        layout: pipeline.getBindGroupLayout(1),
        entries: [
          {
            binding: 0,
            resource: shadowPipeline.dataPipeline.shadowDepthView
          },
          {
            binding: 1,
            resource: device.createSampler({
              compare: 'less',
            })
          }            
        ]
      });

      const sampler_CUBEMAP_PBR = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
      });

      const depthTexture = device.createTexture({
        size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });

      const uniformBindGroup_CUBEMAP_PBR = device.createBindGroup({
        layout:  pipeline.getBindGroupLayout(3),
        entries: [
          {
            binding: 0,
            resource: texture_CUBE.sampler_CUBEMAP_PBR
          },
          {
            binding: 1,
            resource: texture_CUBE.texture_CUBEMAP_PBR.createView({
              dimension: 'cube',
            }),
          },      
          {
            binding: 2,
            resource: texture_CUBE.texture_LUT.createView({
              dimension: '2d',
            }),
          },
        ],
      }); 

       // Создаем саму текстуру
  const uniformBindGroup_IBL_PBR = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(2),
    entries: [
      {
        binding: 0,
        resource: sampler_CUBEMAP_PBR
      },
      {
        binding: 1,
        resource: texture_CUBE.texture_IBL_PBR.createView({
          dimension: 'cube',
        }),
      },
    ],
  });

     //////////////////////////////////////////////
     let dataPipeline = {
        uniformBindGroup,
        uniformBindGroup1,
        depthTexture,
        sampler_CUBEMAP_PBR,
        uniformBindGroup_CUBEMAP_PBR,
        uniformBindGroup_IBL_PBR
      }
      

      return {pipeline,dataPipeline}
}