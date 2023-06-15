
function click(ev, gl, canvas, a_Position) {

    console.log('part_1___  ev.clientX = ' + ev.clientX + "  ev.clientY = " + ev.clientY);

    var x = ev.clientX;
    var y = ev.clientY;

    var rect = ev.target.getBoundingClientRect();

    console.log('part_2___ rect.left = ' + rect.left + "   canvas.width/2 = " + canvas.width / 2);

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = ((canvas.height / 2) - (y - rect.top)) / (canvas.height / 2);

    g_points.push(x);
    g_points.push(y);

    console.log('part_3____ x = ' + x + " y = " + y);

    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_points.length;
    console.log('g_points.length ' + g_points.length);
    for (i = 0; i < len; i += 2) {
        console.log('onmousedown_DRAWING__POINT_' + i / 2 + ' x = ' + g_points[i] + "  y = " + g_points[i + 1]);
        gl.vertexAttrib3f(a_Position, g_points[i], g_points[i + 1], 0.0);
        gl.drawArrays(gl.POINTS, 0, 1);
    }

    console.log('____');

}

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
       
          let a:f32 = 1.0 * 0.01;
          let b:f32 = 0.71 * 0.01;  

          var pos = array<vec2<f32>, 6*4>(
              vec2( 0.0,  0.0), vec2( a, 0.0), vec2(b, b),
              vec2( 0.0,  0.0), vec2(b, b), vec2(0.0,  a),

              vec2( 0.0,  0.0), vec2( 0.0, a), vec2(-b, b),
              vec2( 0.0,  0.0), vec2(-b, b), vec2(-a,  0.0),

              vec2( 0.0,  0.0), vec2( -a, 0.0), vec2(-b, -b),
              vec2( 0.0,  0.0), vec2(-b, -b), vec2(0.0,  -a),

              vec2( 0.0,  0.0), vec2(0.0,  -a), vec2(b, -b),
              vec2( 0.0,  0.0), vec2(b, -b), vec2(a,  0.0),
          );
     
          let positionInstance = data[InstanceIndex].pos; 
          let velInstance = data[InstanceIndex].vel; 
          let lengthVelInstance = length(velInstance) * 50.0;

          var output : VertexOutput;
          output.Position = vec4<f32>(pos[VertexIndex] + positionInstance, 0.0, 1.0);
          output.color = vec3(
            lengthVelInstance * 3.0 , 
            (positionInstance.y * 0.5) + 0.5 * length(velInstance),  
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

              struct Mouse {
                x : f32, 
                y : f32,             
              }


              @group(0) @binding(0) var<storage, read> particlesA: Particles;
              @group(0) @binding(1) var<storage, read_write> particlesB: Particles;
              @group(0) @binding(2) var<uniform> uniforms : Uniforms;
              @group(0) @binding(3) var<uniform> mouse : Mouse;
        
              @compute @workgroup_size(64) fn computeSomething(
                @builtin(global_invocation_id) id: vec3<u32>
              ) {

                if (id.x >= u32(arrayLength(&particlesA.particles))) {
                   return;
                }

                let index = id.x;
                var vPos = particlesA.particles[index].pos;
                var vVel = particlesA.particles[index].vel;
              

                let friction : f32 = 0.999;
                var newPos : vec2<f32> = vPos + vVel * 1.0 * uniforms.dTime;
                var newVel : vec2<f32> = vVel + vec2<f32>(0.0, - 0.000);

                let distanceMouse : f32 =  distance(newPos, vec2<f32>(mouse.x, mouse.y)); 

                //let distanceMouse1 : f32 = distance(vPos, vec2<f32>(0, 0)); 
                
                if(distanceMouse < 0.2) {
                   newVel =  newVel + ((vPos - vec2<f32>(mouse.x, mouse.y)) * 0.005);
                   // newVel =  newVel + vec2<f32>(0.0, 0.001);
                }              

                /////////////////////////////////////////////////////////

                var posNext : vec2<f32>;
                var velNext : vec2<f32>;
               
                for (var i = 0u; i < arrayLength(&particlesA.particles); i++) {
                    if (i == index) {
                        continue;
                    }

                posNext = particlesA.particles[i].pos.xy;
                velNext = particlesA.particles[i].vel.xy;
                    
                    if (distance(posNext, vPos)< .01) {
                       
                       let distanceForce : f32 = distance(posNext, newPos);
                       
                       if(distance(posNext, vPos) > distance(posNext, newPos)){
                            
                            let forceVector1 : vec2<f32> = normalize(vPos - posNext);  
                            let forceVector2 : vec2<f32> = normalize(vVel);  
                           
                            var force : f32 = dot((vVel + forceVector1) ,(vVel));
                            newVel = (forceVector1 + forceVector2) * length(vVel);
                            newPos = vPos;
                            
                            particlesB.particles[index].pos = newPos; 
                            particlesB.particles[index].vel = newVel * friction + vec2<f32>(0.0, - 0.0);

                            //particlesB.particles[i].pos = posNext; 
                            //particlesB.particles[i].vel = vec2<f32>(0.0, 1.0);

                            continue;

                       }                                                                
                    }
                    
                }

                ////////////////////////////////////////////////////////

                if(newPos.x > (0.9)){
                   newPos.x = vPos.x; 
                   newVel.x = vVel.x * -0.95 ;
                   newPos = newPos + newVel;
                }

                if(newPos.x < (-0.9)){
                   newPos.x = vPos.x;
                   newVel.x = vVel.x * -0.95 ; 
                   newPos = newPos + newVel;
                }

                if(newPos.y > (0.9)){
                   newPos.y = vPos.y; 
                   newVel.y = vVel.y *-0.95 ;
                   newPos = newPos + newVel;
                }
                
                if(newPos.y < (-0.9)){
                   newPos.y = vPos.y;
                   newVel.y = vVel.y * -0.95; 
                   newPos = newPos + newVel;
                }
                             

                particlesB.particles[index].pos = newPos; 
                particlesB.particles[index].vel = newVel * friction + vec2<f32>(0.0, - 0.0);
                                
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

    // ------------------ MOUSE -----------------

    const inputMouse = new Float32Array([0,0]);
    const bufferMouse = device.createBuffer({
        label: 'buffer Mouse',
        size: inputMouse.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(bufferMouse, 0, inputMouse);

    let mouse = { x: -2, y: 2 };
    canvas.onmousemove = (event) => {
        mouse.x = (event.layerX / 640) * 2.0 - 1.0;
        mouse.y = ((event.layerY / 640) * 2.0 - 1.0) * -1.0;
    };

    function updateInputParams() {
        device.queue.writeBuffer(bufferMouse, 0, new Float32Array([mouse.x, mouse.y]));
    }
    updateInputParams();    

    //--------------------------------------------

    //const input = new Float32Array([0, 0, 0, 0, 0]);
    const numParticles = 4000;
    const input = new Float32Array(numParticles * 4);
    for (let i = 0; i < numParticles; ++i) {
        input[4 * i + 0] = (Math.random() * (2) - 1) * 0.9;
        input[4 * i + 1] = (Math.random() * (2) - 1) * 0.9;
        input[4 * i + 2] = (Math.random() * (2) - 1) * 0.01;
        input[4 * i + 3] = (Math.random() * (2) - 1) * 0.01;
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
            { binding: 3, resource: { buffer: bufferMouse } },           
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
            { binding: 3, resource: { buffer: bufferMouse } },          
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
    updateInputParams();  
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
    renderPass.draw(6 * 4, numParticles);
    renderPass.end();

    device.queue.submit([encoderRender.finish()]);

      window.requestAnimationFrame(animate);
    };
    animate(0);
}

webGPU_Start();

