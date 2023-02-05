async function main() {
    ///**  Шейдеры тут все понятно более мение. */  
    const shader = {
      vertex: `
      
      struct Output {
        @builtin(position) Position : vec4<f32>,
        @location(0) vColor : vec4<f32>,
      };

      @vertex
        fn main(@location(0)  pos: vec4<f32>, @location(1)  color: vec4<f32>) -> Output {
           
            var output: Output;
            output.Position = pos;
            output.vColor = color;

            return output;
        }
    `,

      fragment: `
    @fragment
    fn main(@location(0)  vColor: vec4<f32>) -> @location(0)  vec4<f32> {
        return vColor;
    }
    `,
    };

   
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
    const format = navigator.gpu.getPreferredCanvasFormat();// формат данных в которых храняться пиксели в физическом устройстве 

    //** конфигурируем контекст подключаем логическое устройсво  */
    //** формат вывода */
    //** размер вывода */
    context.configure({
      device: device,
      format: format,
      size: size,
      compositingAlphaMode : "opaque",
    });

    // const vertexData = new Float32Array([
    //      -0.5, -0.5,  // vertex a
    //       0.5, -0.5,  // vertex b
    //      -0.5,  0.5,  // vertex d
    //      -0.5,  0.5,  // vertex d
    //       0.5, -0.5,  // vertex b
    //       0.5,  0.5,  // vertex c
    //  ]);

    //  const colorData = new Float32Array([
    //       1, 0, 0,    // vertex a: red
    //       0, 1, 0,    // vertex b: green
    //       1, 1, 0,    // vertex d: yellow
    //       1, 1, 0,    // vertex d: yellow
    //       0, 1, 0,    // vertex b: green
    //       0, 0, 1     // vertex c: blue
    //   ]);

    const vertexData = new Float32Array([
      //position    //color
      -0.5, -0.5, 1, 0, 0,  // vertex a, index = 0
      0.5, -0.5, 0, 1, 0,  // vertex b, index = 1
      0.5, 0.5, 0, 0, 1,  // vertex c, index = 2  
      -0.5, 0.5, 1, 1, 0   // vertex d, index = 3        
    ]);

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
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
    // передаем буфер в управление ГПУ */
    vertexBuffer.unmap();

    // const colorBuffer = device.createBuffer({
    //     size: colorData.byteLength,
    //     usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    //     mappedAtCreation: true
    // });

    // new Float32Array(colorBuffer.getMappedRange()).set(colorData);
    // colorBuffer.unmap();

    const indexData = new Uint32Array([0, 1, 3, 3, 1, 2]);

    const indexBuffer = device.createBuffer({
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint32Array(indexBuffer.getMappedRange()).set(indexData);
    indexBuffer.unmap();

    //*********************************************//
    //** настраиваем конвейер рендера 
    //** настраиваем шейдеры указав исходник,точку входа, данные буферов
    //** arrayStride количество байт на одну вершину */
    //** attributes настриваем локацию формат и отступ от начала  arrayStride */
    //** primitive указываем тип примитива для отрисовки*/
    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: device.createShaderModule({
          code: shader.vertex,
        }),
        entryPoint: "main",
        buffers: [
          {
            arrayStride: 4 * (2 + 3),
            attributes: [{
              shaderLocation: 0,
              format: "float32x2",
              offset: 0
            },
            {
              shaderLocation: 1,
              format: 'float32x3',
              offset: 8,
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
    });


    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
          loadOp: 'clear',
          storeOp: "store", //ХЗ
        },
      ],
    });

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    //renderPass.setVertexBuffer(1, colorBuffer);
    renderPass.setIndexBuffer(indexBuffer, "uint32")
    //renderPass.draw(6, 1, 0, 0);
    renderPass.drawIndexed(6);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  main();