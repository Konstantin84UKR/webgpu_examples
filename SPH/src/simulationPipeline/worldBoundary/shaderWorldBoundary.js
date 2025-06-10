export const computeShader = {
    label: 'compute module',
    code: `

          struct Particle {
            pos : vec2<f32>
            // vel : vec2<f32>,
            // radius : vec4<f32>,
          }
          
          struct Particles {
             particles : array<Particle>,
          }

          struct Uniforms {
            dTime : f32
          }
         
          @group(0) @binding(0) var<storage, read> particleA: array<Particle>;
          @group(0) @binding(1) var<storage, read_write> particleB: array<Particle>;
                         
          @group(1) @binding(0) var<uniform> uniforms : Uniforms;
    
          @compute @workgroup_size(64) fn computeSomething(
            @builtin(global_invocation_id) id: vec3<u32>
          ) {
                      
            let index = id.x;
           
            let positionA = particleA[index].pos;
          
            
            var vPosA = positionA;

            if(positionA.x < 10.0) {
              vPosA.x += 0.1 * uniforms.dTime;
            }
            if(positionA.x > 90.0) {
              vPosA.x -= 0.1 * uniforms.dTime;
            }
            if(positionA.y < 10.0) {
              vPosA.y += 0.1 * uniforms.dTime;
            } 
            if(positionA.y > 90.0) {
              vPosA.y -= 0.1 * uniforms.dTime;
            }
            
            particleB[index].pos = vPosA;
           
          }
        `,
};
