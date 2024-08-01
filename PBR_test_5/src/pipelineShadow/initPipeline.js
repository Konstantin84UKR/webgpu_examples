import {shaderShadow} from './shader.js'

 export async function initPipeline(device,uBiffers){

    const pipeline = await device.createRenderPipeline({
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
        //size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        size: [2048, 2048, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
      });
    
      let shadowDepthView = shadowDepthTexture.createView();
    
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
          }            
        ]
      });

      const shadowGroup = device.createBindGroup({
        label: 'Group for shadowPass',
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: uBiffers.uniformBuffershadow,
            offset: 0,
            size: 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
          }
        }]
      })

     
      //////////////////////////////////////////////
      let dataPipeline = {
        shadowDepthTexture,
        shadowDepthView,
        uniformBindGroup1,
        shadowGroup,
      }
      

      return {pipeline,dataPipeline}
 }