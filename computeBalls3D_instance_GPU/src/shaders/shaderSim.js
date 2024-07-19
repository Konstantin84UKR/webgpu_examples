export const shaderSim =
    ` 

              struct Particle {
                pos : vec4<f32>,
                //radius : f32,
                posOld : vec4<f32>,
                vel : vec4<f32>,
                //test : f32,
              }
              
              struct Particles {
                 particles : array<Particle>,
              }

              struct Uniforms {
                dTime : f32               
              }

              struct CurrentBall {
                 pos : vec4<f32>,
                 vel : vec4<f32>              
              }
           

              @group(0) @binding(0) var<storage, read> particlesA: Particles;
              @group(0) @binding(1) var<storage, read_write> particlesB: Particles;
              @group(1) @binding(0) var<uniform> uniforms : Uniforms;
              @group(2) @binding(0) var<uniform> currentBall : CurrentBall;
                                      
        
              @compute @workgroup_size(64) fn computeSomething(
                @builtin(global_invocation_id) id: vec3<u32>
              ) {

                if (id.x >= u32(arrayLength(&particlesA.particles))) {
                   return;
                }

                let index = id.x;
                
                var vPos_B1 : vec4<f32>;
                var vVel_B1 : vec4<f32>;
                var vRadius_B1 : f32;

                // if(u32(currentBall.pos.w) == index && particlesA.particles[index].pos.w < 0.0){
                
                //   vPos_B1 = currentBall.pos;
                //   vVel_B1 = currentBall.vel;
                //   vRadius_B1 = 2.0; 
                
                //   }else{
                 
                //   vPos_B1 = particlesA.particles[index].pos;
                //   vRadius_B1 = 2.0;//particlesA.particles[index].radius;
                  
                //   vVel_B1 = particlesA.particles[index].vel;
                  
                //   if(vPos_B1.w <= 0.0){
                //      return;
                //   }
                // }

                vPos_B1 = particlesA.particles[index].pos;
                vRadius_B1 = 2.0;//particlesA.particles[index].radius;
                  
                vVel_B1 = particlesA.particles[index].vel;
                  
                
                var vPosOld_B1 = vPos_B1;
                //var vVel_B1 = particlesA.particles[index].vel; 

                let friction : f32 = 0.99;
                let grav : vec3<f32> = vec3<f32>( 0.0,  0.0, 0.0);
                var newPos_B1 =  vec4<f32>(vPos_B1.xyz + vVel_B1.xyz * uniforms.dTime,f32(index));
                //var newPos_B1 =  vPos_B1;
                var newVel_B1 = vec4<f32>((vVel_B1.xyz + grav) * friction , 1.0);


                // // /////////////////////////////////////////////////////////
                
                var vPos_B2 : vec3<f32>;
                var vVel_B2 : vec3<f32>;
                var vRadius_B2 : f32;

               
                    for (var i = 0u; i < arrayLength(&particlesA.particles); i++) {
                    if (i == index) {
                        continue;
                    }

                    vPos_B2 = particlesA.particles[i].pos.xyz;
                    vRadius_B2 = 2.0;
                    vVel_B2 = particlesA.particles[i].vel.xyz;

                   //let d = distance(newPos_B1.xyz, vPos_B2.xyz);
                    var dir = newPos_B1.xyz - vPos_B2.xyz;
                    let d = length(dir);            
                    
                    if (d == 0.0 || d > (2.0 + 2.0)){
                        continue;
                    }   
                    
                            //     var dir = vPos - posBall2;
                            // var d = length(dir);
                            // dir = normalize(dir);
                                               
                            // var v1 = dot(newVel, dir);
                            // var v2 = dot(velBall2, dir);
                            // var v = (v1 + v2 - (v1 - v2) * 1.0) * 0.5;
               
                            // newVel = vVel + dir * (v - v1);
                                                   
                            // newPos = vPos;
                    
                    dir = normalize(dir);
                    // let corr = ((2.0 + 2.0) - d) / 2.0;                        
                    // let dirCoor = dir * corr;

                    // newPos_B1 = vec4<f32>(vPosOld_B1.xyz,1.0);
                    // vPos_B2 = vPos_B2.xyz - dirCoor.xyz;   
  
                       let v1 =  dot(newVel_B1.xyz,dir);
                       let v2 =  dot(vVel_B2.xyz,dir);

                       let m1 = 1.0;
                       let m2 = 1.0;

                       let newV1 = (v1 + v2 - (v1 - v2) * 0.9) * 0.5;
                      // let newV2 = (m1 * v1 + m2 * v2 - m1 * (v2 - v1) * 0.9) / (m1 + m2);

                      //newVel_B1 = vec4<f32>(newVel_B1.xyz + (dir * (newV1 - v1)), 1.0);
                       newVel_B1 = vec4<f32>(newVel_B1.xyz + dir * 0.001, 1.0) ; 
                      //vVel_B2 = vVel_B2.xyz + (dir * (newV2 - v2)); 
                                                         
                  }              
            
                // ////////////////////////////////////////////////////////
            
                if(newPos_B1.x > (100.0)){
                    newVel_B1.x = newVel_B1.x * -0.95 ;
                    newPos_B1.x = vPosOld_B1.x;
                }

                if(newPos_B1.x < (-100.0)){
                    newVel_B1.x = newVel_B1.x * -0.95 ; 
                    newPos_B1.x = vPosOld_B1.x;
                }

                //

                if(newPos_B1.z > (100.0)){
                    newVel_B1.z = newVel_B1.z * -0.95 ;
                    newPos_B1.z = vPosOld_B1.z;
                }

                if(newPos_B1.z < (-100.0)){
                    newVel_B1.z = newVel_B1.z * -0.95 ; 
                    newPos_B1.z = vPosOld_B1.z;
                }

                //

                if(newPos_B1.y > (100)){
                   newVel_B1.y = newVel_B1.y *-0.95 ;
                   newPos_B1.y = vPosOld_B1.y;
                }
                
                if(newPos_B1.y < (-50)){
                 
                    newVel_B1.y = newVel_B1.y *-0.95 ; 
                    newPos_B1.y = vPosOld_B1.y;
                    if(length(newVel_B1) < 0.001 ){
                      newVel_B1.y = 0.0;
                      newPos_B1.y = -50.0;
                    } 
                }
               
               particlesB.particles[index].pos = newPos_B1; 
               particlesB.particles[index].vel = newVel_B1;   

              }
            `;