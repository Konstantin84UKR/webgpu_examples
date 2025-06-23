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
          @group(0) @binding(2) var<storage, read> velocityBuffer: array<vec2<f32>>;
                         
          @group(1) @binding(0) var<uniform> uniforms : Uniforms;
    
          @compute @workgroup_size(64) fn computeSomething(
            @builtin(global_invocation_id) id: vec3<u32>
          ) {
                      
            let index = id.x;

            let velocity = velocityBuffer[index];
           
            let positionA = particleA[index].pos;                 
            var vPosA = positionA;         
            
            particleB[index].pos = vPosA + velocity;           
          }
        `,
};
