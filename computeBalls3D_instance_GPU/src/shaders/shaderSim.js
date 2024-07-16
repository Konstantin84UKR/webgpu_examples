export const shaderSim =
    ` 

              struct Particle {
                pos : vec4<f32>,
                posOld : vec4<f32>,
                vel : vec4<f32>,
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

                // if (id.x >= u32(arrayLength(&particlesA.particles))) {
                //    return;
                // }

                let index = id.x;
                var vPos = particlesA.particles[index].pos;
                var vPosOld = particlesA.particles[index].posOld;
                var vVel = particlesA.particles[index].vel;              

                let friction : f32 = 0.99;
                var newPos : vec4<f32> = vPos + vec4<f32>(0.1,0.1,0.1,0.0);
                var newPosOld : vec4<f32> = newPos + vec4<f32>(0.1,0.1,0.1,0.0);
                var newVel : vec4<f32> = vVel + vec4<f32>(0.1,0.1,0.1,0.0);
         
                particlesB.particles[index].pos = newPos; 
                particlesB.particles[index].posOld = newPosOld; 
                particlesB.particles[index].vel = newVel;

              }
            `;