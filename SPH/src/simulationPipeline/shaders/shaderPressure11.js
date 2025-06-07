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

          const K: f32 = 0.5;
          const K_NEAR: f32 = 1.0;
          const INTERACTION_RADIUS: f32 = 25.0;
          const REST_DENSITY : f32 = 3.0;


      //    fn collisionWithSphere(p : vec2f, v : vec2f, r : vec4f , pOld : vec2f, vOld : vec2f) -> Particle {
           
      //       var particle : Particle;
      //       particle.pos = p;
      //       particle.vel = v;
      //       particle.radius = r;
      //       let arrayLengthParticlesA = i32(arrayLength(&particlesA.particles));
           
      //       for (var i = 0; i < arrayLengthParticlesA; i++) {
               
      //           let vPos = particlesA.particles[i].pos;
      //           let vVel = particlesA.particles[i].vel;
      //           let radiusBall : f32 =  particlesA.particles[i].radius[0];
      //           var sub : vec2<f32>;
      //           for (var i = 0; i < 1; i++) {    

      //               let dis = distance(particle.pos, vPos);

      //               if(dis < (radiusBall + particle.radius.x) ){

      //                   sub = particle.pos - vPos;
      //                   //sub = normalize(sub); 
                        
      //                   var correctTerm : f32 = ((radiusBall + particle.radius.x) - dis) * 1.0;
      //                   sub = sub *  correctTerm; 

      //                   particle.pos = particle.pos + sub; 
      //                   //sub = normalize(sub); 
      //                   //var velnormal = normalize(particle.vel); 
      //                   // particle.vel = reflect(particle.vel, sub);
      //                   // particle.vel = vOld * -1.0;     
      //                   //var velnormal = normalize(particle.vel);
      //                  // particle.vel = reflect(particle.vel, sub);
      //              }
      //           }
      //           //  var velnormal = normalize(particle.vel);
      //          //particle.vel = reflect(particle.vel, sub);
      //       }
           


      //       return particle;
      //   }
  

      //   fn collisionWithWalls(p : vec2f, v : vec2f, r : vec4f , pOld : vec2f, vOld : vec2f ) -> Particle {

      //       var particle : Particle;
      //       particle.pos = p;
      //       particle.vel = v;
      //       particle.radius = r;

      //       if(p.x > (1.0 - r.x)){
      //          particle.vel.x = -v.x;
      //          particle.pos = pOld;//p + particle.vel * uniforms.dTime;
      //       }
           
      //       if(p.x < (-1.0 + r.x)){
      //          particle.vel.x = -v.x; 
      //          particle.pos = pOld;//p + particle.vel* uniforms.dTime;
      //       }

      //       if(p.y > (1.0 - r.x)){
      //          particle.vel.y = -v.y;
      //          particle.pos  = pOld;//p + particle.vel* uniforms.dTime;
      //       }
            
      //       if(p.y < (-1.0 + r.x)){
      //          particle.vel.y = -v.y * 0.9;
      //          particle.pos =  pOld;//p + particle.vel * uniforms.dTime;
      //          if(length(particle.vel) < r.x){
      //            particle.pos.y = -1.0 + r.x;
      //          }                   
      //       }

      //       return particle;
      //   }

          @group(0) @binding(0) var<storage, read> positionA: array<Particle>;
          @group(0) @binding(1) var<storage, read_write> positionB: array<Particle>;

          @group(0) @binding(2) var<storage, read> previousPositionA: array<Particle>;
          @group(0) @binding(3) var<storage, read_write> previousPositionB: array<Particle>;

          @group(0) @binding(4) var<storage, read> velocityA: vec2<f32>;
          @group(0) @binding(5) var<storage, read_write> velocityB: vec2<f32>;

          @group(0) @binding(6) var<storage, read_write> densityBuffer: array<f32>;
          @group(0) @binding(7) var<storage, read_write> densityNearBuffer: array<f32>;
                   
          
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
            var newPos = vPos;
            var vVel = velocityA[index];
            
            previousPositionB[index].pos = particleA.pos;
          
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
            }


            
            workgroupBarrier();   

            var pressure = K * (density - REST_DENSITY);
            var pressureNear = K_NEAR * densityNear;
            var particleADisplacement = vec2<f32>(0.0, - 0.0);
           

              for (var j = 0u; j < arrayLengthParticlesA; j++) {
                let particleB = positionA[j].pos;
                
                // if (j == index) {
                //    continue;
                // }

                var rij = particleB - vPos; 
                var rijLength = distance(particleB, vPos); 
                let q = rijLength/INTERACTION_RADIUS;

                if(q < 1){

                    rij = normalize(rij);
                   
                    let displacementTerm =  (uniforms.dTime * uniforms.dTime) * (pressure * (1-q) + pressureNear * (1-q) * (1-q) );
                    let D = rij * displacementTerm;

                    //particleB.position = Vector2.Add(particleB.position, Vector2.Scale(D,0.5));
                    particleADisplacement = particleADisplacement - (D *0.5);
                }

                workgroupBarrier();   
                newPos = vPos + particleADisplacement*0.001;    
            }

            









            let friction : f32 = 0.99;
            // let radiusBall : f32 =  particleA.radius[0];
            let gravity : vec2<f32> =  vec2<f32>(0.0, - 0.1);
            //var newPos : vec2<f32> =  vec2<f32>(0.0, - 0.0);
                          
            // var newVel = (vVel) * friction + gravity;
            //var newPos = vPos + vVel * uniforms.dTime;
            // var test : vec2<f32>= vPos + vVel * uniforms.dTime;
                          
            //newPos = vPos + gravity * uniforms.dTime;
      
            //  var particle = collisionWithSphere(newPos, newVel, particleA.radius, vPos, vVel);    
            //particle = collisionWithWalls(particle.pos, particle.vel, particle.radius,vPos, vVel);    
            
            positionB[index].pos = positionA[index].pos;  

            densityBuffer[index] = density;
            densityNearBuffer[index] = densityNear;

           // particlesB.particles[index].vel = particle.vel; 
            
           //particlesB.particles[index].radius = particleA.radius; 
                                          
          }
        `,
};
