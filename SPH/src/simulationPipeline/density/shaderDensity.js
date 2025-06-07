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
      

          @group(0) @binding(0) var<storage, read> positionA: array<Particle>;

          @group(0) @binding(1) var<storage, read_write> densityBuffer: array<f32>;
          @group(0) @binding(2) var<storage, read_write> densityNearBuffer: array<f32>;
                   
          
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
            var newPos = vPos;   
            
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
                                          
          }
        `,
};
