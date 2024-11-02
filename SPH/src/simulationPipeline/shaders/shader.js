export const computeShader = {
    label: 'compute module',
    code: `

          struct Particle {
            pos : vec2<f32>,
            vel : vec2<f32>,
            radius : vec4<f32>,
          }
          
          struct Particles {
             particles : array<Particle>,
          }

          struct Uniforms {
            dTime : f32
          }

         fn collisionWithSphere(p : vec2f, v : vec2f, r : vec4f , pOld : vec2f, vOld : vec2f) -> Particle {
           
            var particle : Particle;
            particle.pos = p;
            particle.vel = v;
            particle.radius = r;
            let arrayLengthParticlesA = i32(arrayLength(&particlesA.particles));
           
            for (var i = 0; i < arrayLengthParticlesA; i++) {
               
                let vPos = particlesA.particles[i].pos;
                let vVel = particlesA.particles[i].vel;
                let radiusBall : f32 =  particlesA.particles[i].radius[0];
                var sub : vec2<f32>;
                for (var i = 0; i < 1; i++) {    

                    let dis = distance(particle.pos, vPos);

                    if(dis < (radiusBall + particle.radius.x) ){

                        sub = particle.pos - vPos;
                        //sub = normalize(sub); 
                        
                        var correctTerm : f32 = ((radiusBall + particle.radius.x) - dis) * 1.0;
                        sub = sub *  correctTerm; 

                        particle.pos = particle.pos + sub; 
                        //sub = normalize(sub); 
                        //var velnormal = normalize(particle.vel); 
                        // particle.vel = reflect(particle.vel, sub);
                        // particle.vel = vOld * -1.0;     
                        //var velnormal = normalize(particle.vel);
                       // particle.vel = reflect(particle.vel, sub);
                   }
                }
                //  var velnormal = normalize(particle.vel);
               //particle.vel = reflect(particle.vel, sub);
            }
           


            return particle;
        }
  

        fn collisionWithWalls(p : vec2f, v : vec2f, r : vec4f , pOld : vec2f, vOld : vec2f ) -> Particle {

            var particle : Particle;
            particle.pos = p;
            particle.vel = v;
            particle.radius = r;

            if(p.x > (1.0 - r.x)){
               particle.vel.x = -v.x;
               particle.pos = pOld;//p + particle.vel * uniforms.dTime;
            }
           
            if(p.x < (-1.0 + r.x)){
               particle.vel.x = -v.x; 
               particle.pos = pOld;//p + particle.vel* uniforms.dTime;
            }

            if(p.y > (1.0 - r.x)){
               particle.vel.y = -v.y;
               particle.pos  = pOld;//p + particle.vel* uniforms.dTime;
            }
            
            if(p.y < (-1.0 + r.x)){
               particle.vel.y = -v.y * 0.9;
               particle.pos =  pOld;//p + particle.vel * uniforms.dTime;
               if(length(particle.vel) < r.x){
                 particle.pos.y = -1.0 + r.x;
               }                   
            }

            return particle;
        }

          @group(0) @binding(0) var<storage, read> positionA: vec2<f32>;
          @group(0) @binding(1) var<storage, read_write> positionB: vec2<f32>;

          @group(0) @binding(2) var<storage, read> velocityA: vec2<f32>;
          @group(0) @binding(3) var<storage, read_write> velocityB: vec2<f32>;
                   
          
          @group(1) @binding(0) var<uniform> uniforms : Uniforms;
    
          @compute @workgroup_size(64) fn computeSomething(
            @builtin(global_invocation_id) id: vec3<u32>
          ) {
           
            let arrayLengthParticlesA = u32(arrayLength(&particlesA.particles));
           
            if (id.x >= arrayLengthParticlesA) {
               return;
            }
            
            let index = id.x;
            var particleA = particlesA.particles[index];
            var vPos = particleA.pos;
            var vVel = particleA.vel;
           
            let friction : f32 = 0.99;
            let radiusBall : f32 =  particleA.radius[0];
            let gravity : vec2<f32> =  vec2<f32>(0.0, - 0.01);
            var newPos : vec2<f32> =  vec2<f32>(0.0, - 0.0);
                          
            var newVel = (vVel) * friction + gravity;
            //var newPos = vPos + vVel * uniforms.dTime;
            var test : vec2<f32>= vPos + vVel * uniforms.dTime;
                          
            newPos = vPos + newVel * uniforms.dTime;
      
            var particle = collisionWithSphere(newPos, newVel, particleA.radius, vPos, vVel);    
            particle = collisionWithWalls(particle.pos, particle.vel, particle.radius,vPos, vVel);    
            
            particlesB.particles[index].pos = particle.pos;  
            particlesB.particles[index].vel = particle.vel; 
            
            particlesB.particles[index].radius = particleA.radius; 
                                          
          }
        `,
};
