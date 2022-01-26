
import * as Matrix from "./gl-matrix.js";

async function main() {
    ///**  Шейдеры тут се понятно более мение. */  
    const shader = {
      vertex: `
      struct Uniform {
       mvpMatrix : mat4x4<f32>;
      };
      @binding(0) @group(0) var<uniform> uniforms : Uniform;
         
      struct Output {
          @builtin(position) Position : vec4<f32>;
          @location(0) vColor : vec4<f32>;
      };

      @stage(vertex)
        fn main(@location(0) pos: vec4<f32>, @location(1) color: vec4<f32>) -> Output {
           
            var output: Output;
            output.Position = uniforms.mvpMatrix * pos;
            output.vColor = color;

            return output;
        }
    `,

      fragment: `
      @stage(fragment)
      fn main(@location(0) vColor: vec4<f32>) -> @location(0) vec4<f32> {
      return vColor;
    }
    `,
    };

    //----------------------------------------------------
    const cube_vertex= new Float32Array([
      -1,-1,-1,     1,1,0,
      1,-1,-1,     1,1,0,
      1, 1,-1,     1,1,0,
      -1, 1,-1,     1,1,0,
  
      -1,-1, 1,     0,0,1,
      1,-1, 1,     0,0,1,
      1, 1, 1,     0,0,1,
      -1, 1, 1,     0,0,1,
  
      -1,-1,-1,     0,1,1,
      -1, 1,-1,     0,1,1,
      -1, 1, 1,     0,1,1,
      -1,-1, 1,     0,1,1,
  
      1,-1,-1,     1,0,0,
      1, 1,-1,     1,0,0,
      1, 1, 1,     1,0,0,
      1,-1, 1,     1,0,0,
  
      -1,-1,-1,     1,0,1,
      -1,-1, 1,     1,0,1,
      1,-1, 1,     1,0,1,
      1,-1,-1,     1,0,1,
  
      -1, 1,-1,     0,1,0,
      -1, 1, 1,     0,1,0,
      1, 1, 1,     0,1,0,
      1, 1,-1,     0,1,0
  
    ]);

    const cube_index = new Uint32Array([
      0,1,2,
      0,2,3,
  
      4,5,6,
      4,6,7,
  
      8,9,10,
      8,10,11,
  
      12,13,14,
      12,14,15,
  
      16,17,18,
      16,18,19,
  
      20,21,22,
      20,22,23
  
    ]);

    //---------------------------------------------------
  
    const canvas = document.getElementById("canvas-webgpu");
    canvas.width = 640;
    canvas.height = 480;

    // Получаем данные о физическом утсройстве ГПУ
    const adapter = await navigator.gpu.requestAdapter();
    //** Получаем данные о логическом устройсве ГПУ */
    //** Пока не понятно можно ли переключаться между разными физ устройсвами или создавать несколько логический устройств */
    const device = await adapter.requestDevice();
    //** Контектс канваса тут все ясно  */
    const context = canvas.getContext("webgpu");

    const devicePixelRatio = window.devicePixelRatio || 1;
    const size = [
      canvas.clientWidth * devicePixelRatio ,
      canvas.clientHeight * devicePixelRatio ,
    ];

    //const format = "bgra8unorm";
    const format = context.getPreferredFormat(adapter); // формат данных в которых храняться пиксели в физическом устройстве 

    //** конфигурируем контекст подключаем логическое устройсво  */
    //** формат вывода */
    //** размер вывода */
    context.configure({
      device: device,
      format: format,
      size: size
    });


    //---create uniform data
   
    let MODELMATRIX = glMatrix.mat4.create();
    let VIEWMATRIX = glMatrix.mat4.create(); 
    let PROJMATRIX = glMatrix.mat4.create();
    let MVP_MATRIX = glMatrix.mat4.create();
    glMatrix.mat4.lookAt(VIEWMATRIX, [0.0, 0.0, 10.0], [0.0, 1.0, 0.0], [0.0, 1.0, 0.0]);

    glMatrix.mat4.identity(PROJMATRIX);
    let fovy = 40 * Math.PI / 180;
    glMatrix.mat4.perspective(PROJMATRIX, fovy, canvas.width/ canvas.height, 1, 25);

    glMatrix.mat4.mul(VIEWMATRIX,VIEWMATRIX,MODELMATRIX);
    glMatrix.mat4.mul(MVP_MATRIX,PROJMATRIX,VIEWMATRIX);
   
    // const vertexBuffer = CreateGPUBuffer(device, vertexData);
    // const colorBuffer = CreateGPUBuffer(device, colorData);

    //****************** BUFFER ********************//
    //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
    //** который будет в будушем загружен в данный буффер */
    //** указываем размер  буффера в байтах */
    //** usage ХЗ */
    //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
    //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */
    const vertexBuffer = device.createBuffer({
      size: cube_vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(vertexBuffer.getMappedRange()).set(cube_vertex);
    // передаем буфер в управление ГПУ */
    vertexBuffer.unmap();

    const indexBuffer = device.createBuffer({
      size: cube_index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint32Array(indexBuffer.getMappedRange()).set(cube_index);
    indexBuffer.unmap();

    //*********************************************//
    //** настраиваем конвейер рендера 
    //** настраиваем шейдеры указав исходник,точку входа, данные буферов
    //** arrayStride количество байт на одну вершину */
    //** attributes настриваем локацию формат и отступ от начала  arrayStride */
    //** primitive указываем тип примитива для отрисовки*/
    const pipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: shader.vertex,
        }),
        entryPoint: "main",
        buffers: [
          {
            arrayStride: 4 * (3 + 3),
            attributes: [{
              shaderLocation: 0,
              format: "float32x3",
              offset: 0
            },
            {
              shaderLocation: 1,
              format: 'float32x3',
              offset: 12,
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
      },
      depthStencil:{
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less"
    }
    });

    // create uniform buffer and layout
    const uniformBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });   

    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: {
                buffer: uniformBuffer,
                offset: 0,
                size: 64
            }
        }]
    });
 
// Animation    
  const animate = function (time) {
    
    console.log(time);
      
      //------------------MATRIX EDIT------------------------
      glMatrix.mat4.identity(MODELMATRIX);
      glMatrix.mat4.rotateY(MODELMATRIX, MODELMATRIX, time * 0.001);
      glMatrix.mat4.rotateX(MODELMATRIX, MODELMATRIX, time * 0.001);

      glMatrix.mat4.lookAt(VIEWMATRIX, [0.0, 0.0, 10.0], [0.0, 1.0, 0.0], [0.0, 1.0, 0.0]);
      glMatrix.mat4.mul(VIEWMATRIX,VIEWMATRIX,MODELMATRIX);
      glMatrix.mat4.perspective(PROJMATRIX, fovy, canvas.width/ canvas.height, 1, 25);
      glMatrix.mat4.mul(MVP_MATRIX,PROJMATRIX,VIEWMATRIX);
      //--------------------------------------------------

      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();
      const depthTexture = device.createTexture({
        size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });  
  
      const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 }, //background color
            storeOp: "store", //ХЗ
          },],
          depthStencilAttachment: {
            view: depthTexture.createView(),
            depthLoadValue: 1.0,
            depthStoreOp: "store",
            stencilLoadValue: 0,
            stencilStoreOp: "store"
        }
      });

      device.queue.writeBuffer(uniformBuffer, 0, MVP_MATRIX); 

      renderPass.setPipeline(pipeline);
      renderPass.setVertexBuffer(0, vertexBuffer);
      renderPass.setIndexBuffer(indexBuffer, "uint32");
      renderPass.setBindGroup(0, uniformBindGroup);
      //renderPass.draw(6, 1, 0, 0);
      renderPass.drawIndexed(cube_index.length);
      renderPass.endPass();
  
      device.queue.submit([commandEncoder.finish()]);


      window.requestAnimationFrame(animate);
    };
    animate(0);
  }

  main();