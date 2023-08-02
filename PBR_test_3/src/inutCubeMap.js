export async function initCubeMap(device,context,canvas,format){
        ///**  Шейдеры тут все понятно более мение. */  
        const shader = {
            vertex: `
            struct Uniform {
              pMatrix : mat4x4<f32>,
              vMatrix : mat4x4<f32>,
              mMatrix : mat4x4<f32>,
            };
            @binding(0) @group(0) var<uniform> uniforms : Uniform;
              
            struct Output {
                @builtin(position) Position : vec4<f32>,
                @location(0) fragUV : vec2<f32>,
                @location(1) fragPosition: vec4<f32>,
            };
      
            @vertex
              fn main(  @location(0) position : vec4<f32>,
                        @location(1) uv : vec2<f32>) -> Output {
                       
                   var vMatrixWithOutTranslation : mat4x4<f32> = uniforms.vMatrix;
                   vMatrixWithOutTranslation[2] = vec4<f32>(0.0, 0.0, 0.0, 1.0); 
      
      
                  var output: Output;
                  //output.Position = uniforms.pMatrix * vMatrixWithOutTranslation * uniforms.mMatrix * position;
                  output.Position =  position;
                  output.fragUV = uv;
                  output.fragPosition = position ;
      
                  return output;
              }
          `,
      
            fragment: `
            @group(0) @binding(1) var mySampler: sampler;
            @group(0) @binding(2) var myTexture: texture_cube<f32>;
            
            @fragment
            fn main( @location(0) fragUV: vec2<f32>,
                      @location(1) fragPosition: vec4<f32>) -> @location(0) vec4<f32> {
           
                var cubemapVec = fragPosition.xyz;
                return textureSample(myTexture, mySampler, cubemapVec);
          }
          `,
          };
      
          //----------------------------------------------------
        const cubeVertexSize = 4 * 10;
        const cubePositionOffset = 0;
        const cubeColorOffset = 4 * 4;
        const cubeUVOffset = 4 * 8;
        const cubeVertexCount = 36;    
      
        const cubeVertexArray = new Float32Array([
          1, -1, 1, 1,     1, 0, 1, 1,     1, 1,
          -1, -1, 1, 1,    0, 0, 1, 1,     0, 1,
          -1, -1, -1, 1,   0, 0, 0, 1,     0, 0,
          1, -1, -1, 1,    1, 0, 0, 1,     1, 0,
          1, -1, 1, 1,     1, 0, 1, 1,     1, 1,
          -1, -1, -1, 1,   0, 0, 0, 1,     0, 0,
      
          1, 1, 1, 1,      1, 1, 1, 1,     1, 1,
          1, -1, 1, 1,     1, 0, 1, 1,     0, 1,
          1, -1, -1, 1,    1, 0, 0, 1,     0, 0,
          1, 1, -1, 1,     1, 1, 0, 1,     1, 0,
          1, 1, 1, 1,      1, 1, 1, 1,     1, 1,
          1, -1, -1, 1,    1, 0, 0, 1,     0, 0,
      
          -1, 1, 1, 1,     0, 1, 1, 1,     1, 1,
          1, 1, 1, 1,      1, 1, 1, 1,     0, 1,
          1, 1, -1, 1,     1, 1, 0, 1,     0, 0,
          -1, 1, -1, 1,    0, 1, 0, 1,     1, 0,
          -1, 1, 1, 1,     0, 1, 1, 1,     1, 1,
          1, 1, -1, 1,     1, 1, 0, 1,     0, 0,
      
          -1, -1, 1, 1,    0, 0, 1, 1,     1, 1,
          -1, 1, 1, 1,     0, 1, 1, 1,     0, 1,
          -1, 1, -1, 1,    0, 1, 0, 1,     0, 0,
          -1, -1, -1, 1,   0, 0, 0, 1,     1, 0,
          -1, -1, 1, 1,    0, 0, 1, 1,     1, 1,
          -1, 1, -1, 1,    0, 1, 0, 1,     0, 0,
      
          1, 1, 1, 1,      1, 1, 1, 1,    1, 1,
          -1, 1, 1, 1,     0, 1, 1, 1,    0, 1,
          -1, -1, 1, 1,    0, 0, 1, 1,    0, 0,
          -1, -1, 1, 1,    0, 0, 1, 1,    0, 0,
          1, -1, 1, 1,     1, 0, 1, 1,    1, 0,
          1, 1, 1, 1,      1, 1, 1, 1,    1, 1,
      
          1, -1, -1, 1,    1, 0, 0, 1,    1, 1,
          -1, -1, -1, 1,   0, 0, 0, 1,    0, 1,
          -1, 1, -1, 1,    0, 1, 0, 1,    0, 0,
          1, 1, -1, 1,     1, 1, 0, 1,    1, 0,
          1, -1, -1, 1,    1, 0, 0, 1,    1, 1,
          -1, 1, -1, 1,    0, 1, 0, 1,    0, 0,
        ]);
        console.log('Vertices:', cubeVertexArray.length);

        const vertexBuffer = device.createBuffer({
            size: cubeVertexArray.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
            mappedAtCreation: true
          });
          //загружаем данные в буффер */
          new Float32Array(vertexBuffer.getMappedRange()).set(cubeVertexArray);
          // передаем буфер в управление ГПУ */
          vertexBuffer.unmap();

           //*********************************************//
    //** настраиваем конвейер рендера 
    //** настраиваем шейдеры указав исходник,точку входа, данные буферов
    //** arrayStride количество байт на одну вершину */
    //** attributes настриваем локацию формат и отступ от начала  arrayStride */
    //** primitive указываем тип примитива для отрисовки*/
    //** depthStencil настраиваем буффер глубины*/
    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
          module: device.createShaderModule({
            code: shader.vertex,
          }),
          entryPoint: "main",
          buffers: [
            {
              arrayStride: cubeVertexSize,
              attributes: [{
                shaderLocation: 0,
                format: "float32x4",
                offset: cubePositionOffset
              },
              {
                shaderLocation: 1,
                format: 'float32x2',
                offset: cubeUVOffset,
              }
              ]
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
          cullMode: 'none',
        },
        depthStencil:{
          format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
          depthWriteEnabled: true, //вкл\выкл теста глубины 
          depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
      }
      });
  
      // create uniform buffer and layout
      const uniformBuffer = device.createBuffer({
          size: 256,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });   
  
      const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
      });
  
        //TEXTURE 
        //Создаем картинку и загрудаем в нее данные из файла
        
        const imgSrcs = [
          './res/tex/32_32/nx.png',
          './res/tex/32_32/px.png',
          './res/tex/32_32/py.png',
          './res/tex/32_32/ny.png',
          './res/tex/32_32/pz.png',
          './res/tex/32_32/nz.png'
        ];

      
       
        const promises = imgSrcs.map(async (src) => {
          let img = new Image();
          img.src = src; //'./tex/yachik.jpg';
          await img.decode();
          return await createImageBitmap(img);
        });      
  
        const imageBitmaps = await Promise.all(promises);
  
        // Создаем саму текстуру
        const texture = device.createTexture({
          size: [imageBitmaps[0].width, imageBitmaps[0].height, 6], //??
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
          dimension: '2d',
        });
        
        //передаем данные о текстуре и данных текстуры в очередь
        for (let i = 0; i < imageBitmaps.length; i++) {
          const imageBitmap = imageBitmaps[i];
          device.queue.copyExternalImageToTexture(
          { source: imageBitmap },
          { texture: texture, origin: [0, 0, i] },
          [imageBitmap.width, imageBitmap.height]);
        }
      
      
      const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: uniformBuffer,
            offset: 0,
            size: 256 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
          }
          },
          {
            binding: 1,
            resource: sampler
          },
          {
            binding: 2,
            resource: texture.createView({
              dimension: 'cube',
            }),
          },
        ],
      });
  
      //let textureView = context.getCurrentTexture().createView();
      
      let depthTexture = device.createTexture({
        size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      }); 
      
     
      const dataPipeline = {
        uniformBuffer,
        //renderPassDescription,
        uniformBindGroup,
        //textureView,
        texture,
        depthTexture,
        sampler,
        cubeVertexCount ,
        vertexBuffer
        }

      return {pipeline, dataPipeline}

}