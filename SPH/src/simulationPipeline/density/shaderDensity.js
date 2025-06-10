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

          // const K: f32 = 0.5;
          // const K_NEAR: f32 = 1.0;
          const INTERACTION_RADIUS: f32 = 20.0;
         // const REST_DENSITY : f32 = 3.0;

         const VELOCITY_DAMPING : f32 = 1.0;
      

          @group(0) @binding(0) var<storage, read> positionA: array<Particle>;

          @group(0) @binding(1) var<storage, read_write> densityBuffer: array<f32>;
          @group(0) @binding(2) var<storage, read_write> densityNearBuffer: array<f32>;

          @group(0) @binding(3) var<storage, read_write> previousPosition: array<Particle>;

          @group(0) @binding(4) var<storage, read> velocity: array<vec2<f32>>;
          @group(0) @binding(5) var<storage, read_write> positionB: array<Particle>; 
                   
          
          //@group(1) @binding(0) var<uniform> uniforms : Uniforms;
    
          @compute @workgroup_size(64) fn computeSomething(
            @builtin(global_invocation_id) id: vec3<u32>
          ) {
           
            let arrayLengthParticlesA = u32(arrayLength(&positionA));
           
            // if (id.x >= arrayLengthParticlesA) {
            //    return;
            // }
            
            let index = id.x;
            var particleA = positionA[index];
            var vPos = particleA.pos;
            
            previousPosition[index].pos = vPos; // save previous position
            
            //var newPos = vPos;   
            
            var test = 1.1; // for debug
          
            workgroupBarrier();   

            var density = 0.0;
            var densityNear = 0.0;

              for (var i = 0u; i < arrayLengthParticlesA; i++) {
                    // if (i == index) {
                    //     continue;
                    // }

                let posNeigbourBall = positionA[i].pos;               
               
                var rij = posNeigbourBall - vPos; 
                let rijLength : f32 = distance(posNeigbourBall, vPos);
                let q = rijLength/INTERACTION_RADIUS;

                if(q < 1){
                    let oneMinusQ = (1-q);
                    density += oneMinusQ*oneMinusQ;
                    densityNear += oneMinusQ*oneMinusQ*oneMinusQ;
                }    
                    
                test = 1.2;
            }

            
            workgroupBarrier();           
          
            densityBuffer[index] = density;
            densityNearBuffer[index] = densityNear; 

            //this.particles[i].position = Vector2.Add(this.particles[i].position,  Vector2.Scale(this.particles[i].velocity, dt * this.VELOCITY_DAMPING));
             
            //positionB[index].pos = vPos + (velocity[index] * f32(VELOCITY_DAMPING)); // update position

            positionB[index].pos =  (velocity[index] * f32(VELOCITY_DAMPING)); // update position
          }
        `,
};
