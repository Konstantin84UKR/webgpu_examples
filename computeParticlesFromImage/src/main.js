
async function loadImageData(numParticles) {
    //Создаем картинку и загрудаем в нее данные из файла
    let img = new Image();
    img.src = './res/webgpu.png'; //'./tex/yachik.jpg';
    await img.decode();

    const imageBitmap = await createImageBitmap(img);

    const canvasData = document.createElement('canvas');
    
    canvasData.width = imageBitmap.width;
    canvasData.height = imageBitmap.height;

    const ctx = canvasData.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height);

    const data = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height).data;

    //console.log(data);
    const width = imageBitmap.width;
    const height = imageBitmap.height;
    let pixels = [];
    for (let i = 0; i < data.length; i+=4) {
      
        if(data[i+3] > 0){

            const x = (i / 4) % width; //  
            const y = Math.floor((i / 4) / height);

            pixels.push(
                {   //pos
                    x: (x / width - 0.5) * 2.0, // -1 +1
                    y: (0.5 - y / height) * 2.0,
                    //color
                    r: data[i + 0] / 245, 
                    g: data[i + 1] / 245, 
                    b: data[i + 2] / 245,      
                }
                );
        }        
    } 

    let position = new Float32Array(numParticles * 8);

    for (let index = 0; index < numParticles; index++) {
       
        let randomPixels = pixels[Math.floor(Math.random() * pixels.length)];

        // position[8 * index + 0] = randomPixels.x + (Math.random() - 0.5) * 0.01;
        // position[8 * index + 1] = randomPixels.y + (Math.random() - 0.5) * 0.01;
        position[8 * index + 0] = randomPixels.x ;
        position[8 * index + 1] = randomPixels.y ;
        position[8 * index + 2] = (Math.random() - 0.5) * 0.001;
        position[8 * index + 3] = (Math.random() - 0.5) * 0.001;
        // position[8 * index + 2] = 0;
        // position[8 * index + 3] = 0;
        
        //color
        position[8 * index + 4] = randomPixels.r;
        position[8 * index + 5] = randomPixels.g;
        position[8 * index + 6] = randomPixels.b;
        position[8 * index + 7] = 0.0;
        
    }

    return position;

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
                color : vec3<f32>,
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
       
          let scale:f32 =  0.01;
          let a:f32 = 1.0 * scale;
          let b:f32 = 0.71 * scale;  
          let c:f32 = 0.923 * scale;  
          let d:f32 = 0.382 * scale;  

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
          let colorInstance = data[InstanceIndex].color; 
          let lengthVelInstance = length(velInstance) * 50.0;

          var output : VertexOutput;
          output.Position = vec4<f32>(pos[VertexIndex] + positionInstance, 0.0, 1.0);
       
          output.color = mix(colorInstance, vec3( lengthVelInstance * 100.0 , 0.0, 1.0 - lengthVelInstance * 100.0), lengthVelInstance * 2);  

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
                color : vec3<f32>,
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
              @group(0) @binding(4) var<storage, read> imageData: Particles;
        
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
                var newPos : vec2<f32> = vPos + vVel * uniforms.dTime;
                var newVel : vec2<f32> = vVel;
               
                let distanceMouse : f32 =  distance(newPos, vec2<f32>(mouse.x, mouse.y)); 
                           
                if(distanceMouse < 0.2) {
                   newVel =  newVel + ((vPos - vec2<f32>(mouse.x, mouse.y)) * 0.001);                  
                }    
                
                //Origin
                var fPos = imageData.particles[index].pos;
                var fVel = imageData.particles[index].vel;
                var fColor = imageData.particles[index].color;
                
                var directionFinalyOrigin : vec2<f32> =  normalize(fPos - vPos);  
                var distFinalyOrigin : f32 =  distance(fPos, vPos); 

                if(distFinalyOrigin > 0.01){
                   newVel +=  directionFinalyOrigin * 0.00001;
                }

                /////////////////////////////////////////////////////////

                var posNextBall : vec2<f32>;
                var velNextBall : vec2<f32>;
               
                for (var i = 0u; i < arrayLength(&particlesA.particles); i++) {
                    if (i == index) {
                        continue;
                    }

                posNextBall = particlesA.particles[i].pos.xy;
                velNextBall = particlesA.particles[i].vel.xy;
                
                let distanceToPos : f32 = distance(posNextBall, vPos);
                let distanceTonewPos : f32 = distance(posNextBall, newPos);
                    
                   if (distanceToPos < .01) {
                                           
                       if(distanceToPos > distanceTonewPos){
                   
                            let dir = normalize(vPos - posNextBall);
                            let v1 = dot(newVel, dir);
                                                      
                            newVel = newVel + dir * (-v1  * 0.5);
                            newPos = vPos;

                            continue;
                       }                                                                
                    }
                    
                }

                ////////////////////////////////////////////////////////

                if(newPos.x > (1.0)){
                   newPos.x = vPos.x; 
                   newVel.x = vVel.x * -0.95 ;
                   newPos = newPos + newVel;
                }

                if(newPos.x < (-1.0)){
                   newPos.x = vPos.x;
                   newVel.x = vVel.x * -0.95 ; 
                   newPos = newPos + newVel;
                }

                if(newPos.y > (1.0)){
                   newPos.y = vPos.y; 
                   newVel.y = vVel.y *-0.95 ;
                   newPos = newPos + newVel;
                }
                
                if(newPos.y < (-1.0)){
                   newPos.y = vPos.y;
                   newVel.y = vVel.y * -0.95; 
                   newPos = newPos + newVel;
                }
                             

                particlesB.particles[index].pos = newPos; 
                particlesB.particles[index].vel = newVel * friction + vec2<f32>(0.0, - 0.0);
                particlesB.particles[index].color = fColor;
                                
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
    const numParticles = 4000;
    const input = await loadImageData(numParticles);
    
    // const input = new Float32Array(numParticles * 4);
    // for (let i = 0; i < numParticles; ++i) {
    //     input[4 * i + 0] = (Math.random() * (2) - 1) * 0.9;
    //     input[4 * i + 1] = (Math.random() * (2) - 1) * 0.9;
    //     input[4 * i + 2] = (Math.random() * (2) - 1) * 0.01;
    //     input[4 * i + 3] = (Math.random() * (2) - 1) * 0.01;
    // }
    console.log('Particle Count:', numParticles);
    //console.log('input', input);

    const imageBuffer = device.createBuffer({
        label: 'image Buffer',
        size: input.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(imageBuffer, 0, input);

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
            { binding: 4, resource: { buffer: imageBuffer } },           
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
            { binding: 4, resource: { buffer: imageBuffer } },         
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
            clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
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

