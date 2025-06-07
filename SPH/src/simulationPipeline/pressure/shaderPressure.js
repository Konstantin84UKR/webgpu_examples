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

          const K: f32 = 0.1;
          const K_NEAR: f32 = 0.3;
          const INTERACTION_RADIUS: f32 = 20.0;
          const REST_DENSITY : f32 = 30.0;
      

         
          @group(0) @binding(0) var<storage, read> positionA: array<Particle>;
          @group(0) @binding(1) var<storage, read_write> positionB: array<Particle>;
          
          @group(0) @binding(2) var<storage, read> densityBuffer: array<f32>;
          @group(0) @binding(3) var<storage, read> densityNearBuffer: array<f32>;

          // @group(0) @binding(4) var<storage, read_write> pressureBuffer: array<f32>;
          // @group(0) @binding(5) var<storage, read_write> pressureNearBuffer: array<f32>;
                 
          @group(1) @binding(0) var<uniform> uniforms : Uniforms;
    
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

            let density = densityBuffer[index];
            let densityNear = densityNearBuffer[index];       
          
            workgroupBarrier();   

            var pressure = K * (density - REST_DENSITY);
            var pressureNear = K_NEAR * densityNear;
            var particleADisplacement : vec2<f32> = vec2<f32>(0.0, 0.0);
           

              for (var j = 0u; j < arrayLengthParticlesA; j++) {
                let particleB = positionA[j].pos;
                
                // if (j == index) {
                //    continue;
                // }

                var rij = particleB - vPos; 
                var rijLength : f32 = f32(distance(particleB, vPos)); 
                let q : f32= f32(rijLength)/f32(INTERACTION_RADIUS);

                      if(rijLength > 0.0001 && q < 1.0f) {

                          let rij2 = normalize(rij);
                          let OneMinusQ = (1-q);
                          let OneMinusQpow2 = OneMinusQ * OneMinusQ;
                         
                          let displacementTerm = (uniforms.dTime * uniforms.dTime) * (pressure * OneMinusQ + pressureNear * OneMinusQpow2 );
                          let D : vec2<f32> = rij2 * displacementTerm;

                        
                           particleADisplacement = particleADisplacement - (D * 0.5);
                           //particleADisplacement = vec2<f32>(OneMinusQ, OneMinusQpow2);
                         
                      }
                                         
             }
            
            workgroupBarrier(); 
            
            positionB[index].pos = positionA[index].pos + particleADisplacement * uniforms.dTime;

          }
        `,
};
