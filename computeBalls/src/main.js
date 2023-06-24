
//let gpu;
const webGPU_Start = async () => {

    // checkWebGPU // 
    if (!navigator.gpu) {
        console.log("Your current browser does not support WebGPU!");
        return;
    }

    const canvas = document.querySelector('#canvas-webgpu'); // получаем канвас
    const adapter = await navigator.gpu.requestAdapter(); // получаем физическое устройство ГПУ
    const device = await adapter.requestDevice(); // Получаем логическое устройство ГПУ
    const context = canvas.getContext("webgpu"); // Контекст Канваса

    const format = navigator.gpu.getPreferredCanvasFormat(); // формат данных в которых храняться пиксели в физическом устройстве 

    context.configure({     // конфигурируем контекстр указываем логическое устройство и формат хранения данных
        device: device,
        format: format,
        compositingAlphaMode: "opaque",
    });

    // текст шейлеров 
    const wglsShader = 
        `
        struct Particle {
                pos : vec2<f32>,
                vel : vec2<f32>,
        }

        @group(0) @binding(0) var<storage, read> data: array<Particle>;

        struct VertexOutput {
          @builtin(position) Position : vec4<f32>,
          @location(0) color : vec3<f32>          
        }

        @vertex
        fn vertex_main(
        @builtin(vertex_index) VertexIndex : u32 ,
        @builtin(instance_index) InstanceIndex : u32,
        ) -> VertexOutput {
       
          let scaleBall:f32 = 0.05; 
          let a:f32 = 1.0 * scaleBall;
          let b:f32 = 0.71 * scaleBall;  
          let c:f32 = 0.923 * scaleBall;  
          let d:f32 = 0.382 * scaleBall;  

        var pos = array<vec2<f32>, 6*4*2>(
              vec2( 0.0,  0.0), vec2( a, 0.0), vec2(c, d),
              vec2( 0.0,  0.0), vec2(c, d), vec2(b,  b),

              vec2( 0.0,  0.0), vec2(b,  b), vec2(d,  c),
              vec2( 0.0,  0.0), vec2(d,  c), vec2(0.0,  a),

              vec2( 0.0,  0.0), vec2( 0.0, a), vec2(-d, c),
              vec2( 0.0,  0.0), vec2(-d, c), vec2(-b, b),

              vec2( 0.0,  0.0), vec2(-b, b), vec2(-c, d),
              vec2( 0.0,  0.0), vec2(-c, d), vec2(-a,  0.0),


              vec2( 0.0,  0.0), vec2( -a, 0.0), vec2(-c, -d),
              vec2( 0.0,  0.0), vec2(-c, -d), vec2(-b, -b),

              vec2( 0.0,  0.0), vec2(-b, -b), vec2(-d, -c),
              vec2( 0.0,  0.0), vec2(-d, -c), vec2(0.0, -a),

              vec2( 0.0,  0.0), vec2(0.0, -a), vec2(d, -c),
              vec2( 0.0,  0.0), vec2(d, -c), vec2(b, -b),

              vec2( 0.0,  0.0), vec2(b, -b), vec2(c, -d),
              vec2( 0.0,  0.0), vec2(c, -d), vec2(a, 0.0),

          );
     
          let positionInstance = data[InstanceIndex].pos; 
          let velInstance = data[InstanceIndex].vel; 
          let lengthVelInstance = length(velInstance) * 50.0;

          var output : VertexOutput;
          output.Position = vec4<f32>(pos[VertexIndex] + positionInstance, 0.0, 1.0);
          output.color = vec3(
            lengthVelInstance * 3.0 , 
            positionInstance.x * lengthVelInstance,  
            1.0 - lengthVelInstance * 3.0);
          return output;
        }
        
        @fragment
            fn fragment_main(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
            return vec4<f32>(color,1.0);
        }`;

    const moduleСompute = device.createShaderModule({
        label: 'compute module',
        code: `

              struct Particle {
                pos : vec2<f32>,
                vel : vec2<f32>,
              }
              
              struct Particles {
                 particles : array<Particle>,
              }

              struct Uniforms {
                dTime : f32
              }

              @group(0) @binding(0) var<storage, read> particlesA: Particles;
              @group(0) @binding(1) var<storage, read_write> particlesB: Particles;
              @group(0) @binding(2) var<uniform> uniforms : Uniforms;
        
              @compute @workgroup_size(64) fn computeSomething(
                @builtin(global_invocation_id) id: vec3<u32>
              ) {

                if (id.x >= u32(arrayLength(&particlesA.particles))) {
                   return;
                }

                let index = id.x;
                var vPos = particlesA.particles[index].pos;
                var vVel = particlesA.particles[index].vel;

                let friction : f32 = 0.99;
                var newPos = vPos + vVel * 1.0 * uniforms.dTime;
                var newVel = vVel * friction + vec2<f32>(0.0, -0.000);
                
                /////////////////////////////////////////////////////////
                
                var posBall2 : vec2<f32>;
                var velBall2 : vec2<f32>;
                

               
                    for (var i = 0u; i < arrayLength(&particlesA.particles); i++) {
                    if (i == index) {
                        continue;
                    }

                    posBall2 = particlesA.particles[i].pos.xy;
                    velBall2 = particlesA.particles[i].vel.xy;
                    
                    if (distance(posBall2, vPos) < .1) {
                       
                      if(distance(posBall2, vPos) > distance(posBall2, newPos)){
                                               
                            
                            var dir = vPos - posBall2;
                            var d = length(dir);
                            dir = normalize(dir);
                                               
                            var v1 = dot(newVel, dir);
                            var v2 = dot(velBall2, dir);
                            var v = (v1 + v2 - (v1 - v2) * 1.0) * 0.5;
               
                            newVel = vVel + dir * (v - v1);
                                                   
                            newPos = vPos;
                            
                      }                                                                
                    }
                    
                 } 
               
               

                ////////////////////////////////////////////////////////

                if(newPos.x > (0.9)){
                  
                   newVel.x = vVel.x * -0.95 ;
                   newPos = newPos + newVel;
                }

                if(newPos.x < (-0.9)){
                
                   newVel.x = vVel.x * -0.95 ; 
                   newPos = newPos + newVel;
                }

                if(newPos.y > (0.9)){
                
                   newVel.y = vVel.y *-0.95 ;
                   newPos = newPos + newVel;
                }
                
                if(newPos.y < (-0.95)){
                 
                   newVel.y = vVel.y * -0.95; 
                   newPos = newPos + newVel;
                   if(length(newVel) < 0.001 ){
                     newPos.y = -0.95;
                     newVel.y = 0.0;
                   } 
                }
                particlesB.particles[index].pos = newPos; 
                particlesB.particles[index].vel = newVel + vec2<f32>(0.0, -0.000); 
                                               
              }
            `,
    });

    // настраеваем объект pipeline
    // указываем текст шейдеров и точку входа в программу
    // 
    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code: wglsShader
            }),
            entryPoint: "vertex_main"
        },
        fragment: {
            module: device.createShaderModule({
                code: wglsShader
            }),
            entryPoint: "fragment_main",
            targets: [{
                format: format
            }]
        },
        primitive: {
            topology: "triangle-list", // что будем рисовать точки - треугольники - линии
        }
    });

    ////////////////////////////////////////////+    
    const pipelineCompute = device.createComputePipeline({
        label: 'compute pipeline',
        layout: 'auto',
        compute: {
            module: moduleСompute,
            entryPoint: 'computeSomething',
        },
    });

    const inputTime = new Float32Array([0]);
    const bufferUniform = device.createBuffer({
        label: 'buffer Position',
        size: inputTime.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(bufferUniform, 0, inputTime);
    //const input = new Float32Array([0, 0, 0, 0, 0]);
    const numParticles = 50;
    const input = new Float32Array(numParticles * 4);
    for (let i = 0; i < numParticles; ++i) {
        input[4 * i + 0] = (Math.random() * (2) - 1) * 0.5;
        input[4 * i + 1] = (Math.random() * (2) - 1) * 0.5;
        input[4 * i + 2] = (Math.random() * (2) - 1) * 0.1;
        input[4 * i + 3] = (Math.random() * (2) - 1) * 0.1; //(Math.random() * (2) - 1) * 0.1
    }
    console.log('Particle Count:', numParticles);
    //console.log('input', input);

    const workBuffer_A = device.createBuffer({
        label: 'work buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    // Copy our input data to that buffer
    device.queue.writeBuffer(workBuffer_A, 0, input);

    const workBuffer_B = device.createBuffer({
        label: 'work buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    // Copy our input data to that buffer
    device.queue.writeBuffer(workBuffer_B, 0, input);

    // create a buffer on the GPU to get a copy of the results
    const resultBuffer = device.createBuffer({
        label: 'result buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST ,
    });

    // Setup a bindGroup to tell the shader which
    // buffer to use for the computation
    const bindGroupCompute_A = device.createBindGroup({
        label: 'bindGroup for work buffer A',
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: workBuffer_A } },  
            { binding: 1, resource: { buffer: workBuffer_B } }, 
            { binding: 2, resource: { buffer: bufferUniform } },           
        ],
    });

       // Setup a bindGroup to tell the shader which
    // buffer to use for the computation
    const bindGroupCompute_B = device.createBindGroup({
        label: 'bindGroup for work buffer B',
        layout: pipelineCompute.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: workBuffer_B } }, 
            { binding: 1, resource: { buffer: workBuffer_A } },
            { binding: 2, resource: { buffer: bufferUniform } },              
        ],
    });
    
 
    //-------------------------------------------------------------

    const bufferPosition = device.createBuffer({
        label: 'buffer Position',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(bufferPosition, 0, input);

    const bindGroupRender_A = device.createBindGroup({
        label: 'bindGroup for bindGroupRender',
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: workBuffer_B } },            
        ],
    });

    const bindGroupRender_B = device.createBindGroup({
        label: 'bindGroup for bindGroupRender',
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: workBuffer_A } },
        ],
    });


    const bindGroupsCompute = [
        {
            bindGroup: bindGroupCompute_A,
            buffer: workBuffer_B,
            bindGroupRender: bindGroupRender_A
        },
        {
            bindGroup: bindGroupCompute_B,
            buffer: workBuffer_A,
            bindGroupRender: bindGroupRender_B
        }];
   


    // Animation   
let time_old = 0; 
let t = 0;
async function animate(time) {
     
//      //-----------------TIME-----------------------------
    //console.log(time);
     let dt = time - time_old;
     time_old = time;
    //console.log(dt);
     //--------------------------------------------------
    device.queue.writeBuffer(bufferUniform, 0, new Float32Array([1.0]));
     //------------------MATRIX EDIT---------------------
     
     //--------------------------------------------------
    

     //Encode commands to do the computation
    const encoder = device.createCommandEncoder({
        label: 'doubling encoder',
    });

    const computePass = encoder.beginComputePass({
        label: 'doubling compute pass',
    });

    computePass.setPipeline(pipelineCompute);
    computePass.setBindGroup(0, bindGroupsCompute[t % 2].bindGroup);
    computePass.dispatchWorkgroups(Math.ceil(numParticles / 64));
    computePass.end();

    encoder.copyBufferToBuffer(bindGroupsCompute[t % 2].buffer, 0, resultBuffer, 0, resultBuffer.size);

    device.queue.submit([encoder.finish()]);

    // Read the results
    await resultBuffer.mapAsync(GPUMapMode.READ);
    let result = new Float32Array(resultBuffer.getMappedRange().slice());
    resultBuffer.unmap();

    //console.log('input', input);
    // console.log('result', result);
     
    ++t;
    // //--------------------------------------------------
    //device.queue.writeBuffer(bufferPosition, 0, result);

    const encoderRender = device.createCommandEncoder({
        label: 'doubling encoder',
    });

    const textureView = context.getCurrentTexture().createView(); // тектура к которой привязан контекст
    const renderPass = encoderRender.beginRenderPass({  // натсраиваем проход рендера, подключаем текстуру канваса это значать выводлить результат на канвас
        colorAttachments: [{
            view: textureView,
            clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store' //хз
        }]
    });
    renderPass.setPipeline(pipeline); // подключаем наш pipeline
    renderPass.setBindGroup(0, bindGroupsCompute[t % 2].bindGroupRender);
    renderPass.draw(6 * 4 * 2, numParticles);
    renderPass.end();

    device.queue.submit([encoderRender.finish()]);

      window.requestAnimationFrame(animate);
    };
    animate(0);
}

webGPU_Start();