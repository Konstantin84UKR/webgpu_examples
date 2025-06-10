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
         
          @group(0) @binding(0) var<storage, read> positionA: array<Particle>;
          @group(0) @binding(1) var<storage, read> previousPosition: array<vec2<f32>>;
          
          @group(0) @binding(2) var<storage, read_write> velocity: array<vec2<f32>>;
        
                 
          @group(1) @binding(0) var<uniform> uniforms : Uniforms;
    
          @compute @workgroup_size(64) fn computeSomething(
            @builtin(global_invocation_id) id: vec3<u32>
          ) {
                      
            let index = id.x;
           
            var particleA = positionA[index];
            var vPosA = particleA.pos;
           
            var vPosB = previousPosition[index];
             
            var dt = uniforms.dTime;
            if (dt == 0.0) {
              dt = 0.0001; // Prevent division by zero
            }           
            velocity[index]= (vPosA - vPosB) * f32(1.0/dt);
           
          }
        `,
};
