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

          override VELOCITY_DAMPING : f32 = 1.0;
          override SIM_RESOLUTION_X : f32 = 100.0;  
          override SIM_RESOLUTION_Y : f32 = 100.0;          
         
          @group(0) @binding(0) var<storage, read> positionA: array<Particle>;
          @group(0) @binding(1) var<storage, read> previousPosition: array<vec2<f32>>;
          
          @group(0) @binding(2) var<storage, read_write> velocity: array<vec2<f32>>;
          @group(0) @binding(3) var<storage, read> particleDisplacementBuffer: array<vec2<f32>>;
          
                 
          @group(1) @binding(0) var<uniform> uniforms : Uniforms;
    
          @compute @workgroup_size(64) fn computeSomething(
            @builtin(global_invocation_id) id: vec3<u32>
          ) {
                      
            let index = id.x;
           
            var particleA = positionA[index];
            //var vPosA  = particleA.pos;
           
            var vPosB = previousPosition[index];
            let particleDisplacement = particleDisplacementBuffer[index];
            let vGravity = vec2<f32>(-0.0, -0.0);
             
            var dt = uniforms.dTime;
            if (dt == 0.0) {
              dt = 0.0001; // Prevent division by zero
            }  
              
            // var vPosA = (particleA.pos + vGravity + particleDisplacement)* dt;
            var vPosA = (particleA.pos + vGravity * dt + particleDisplacement* dt);
            //var vPosA = (particleA.pos );
            // Calculate velocity based on the difference between current and previous positions
            var vPosVelocity =  (vPosA - vPosB) * f32( 1.0 / dt);
          
           // var vPosVelocity =  (vPosA - vPosB); // update position;
            
            if(vPosA.x <= 00.0) {
              vPosA.x = 1.0;
              vPosVelocity.x += vPosVelocity.x * -1.0;
            }
            if(vPosA.x >= SIM_RESOLUTION_X) {
              vPosA.x = SIM_RESOLUTION_X - 0.0;
             
              vPosVelocity.x +=  vPosVelocity.x * -1.0;
            }
            if(vPosA.y <= 0.0) {
              vPosA.y = 1.0;
              vPosVelocity.y +=  vPosVelocity.y * -1.0;;
            } 
            if(vPosA.y >= SIM_RESOLUTION_Y) {
              vPosA.y = SIM_RESOLUTION_Y - 0.0;             
              vPosVelocity.y += vPosVelocity.y * -1.0;
            }
       
            if(vPosA.x >= 20.0 && vPosA.x <= 40.0 && vPosA.y >= 10.0 && vPosA.y <= 30.0) {
              vPosA = vPosB;
              vPosVelocity += vPosVelocity * -1.0;
            }
            


           
            //velocity[index] = vGravity * dt;

            velocity[index] = vPosVelocity * dt * f32(VELOCITY_DAMPING); // update velocity
          
          }
        `,
};
