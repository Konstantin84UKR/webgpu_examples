import { PARTICLE_COUNT } from '../settings.js';

export async function simulationData() {

    const numParticles = PARTICLE_COUNT; 

   let position = new Float32Array(numParticles * 2);
   let previousPosition = new Float32Array(numParticles * 2);
   let velocity = new Float32Array(numParticles * 8);
   let density = new Float32Array(numParticles * 4);
   let nearDensity = new Float32Array(numParticles * 8);
   let pressure = new Float32Array(numParticles * 8);
   let nearPressure = new Float32Array(numParticles * 8);
   let neighbours = new Float32Array(numParticles * 8);

  
   position = new Float32Array(numParticles * 2);
   for (let i = 0; i < numParticles; ++i) {
        position[8 * i + 0] = 2 * (Math.random() - 0.5) * 0.9; //pos
        position[8 * i + 1] = 2 * (Math.random() - 0.5) * 0.9;      
   }
   
   previousPosition = new Float32Array(numParticles * 2);
    
   velocity = new Float32Array(numParticles * 2);
   for (let i = 0; i < numParticles; ++i) {
    velocity[8 * i + 2] = 2 * (Math.random() - 0.5) * 0.5; //vel
    velocity[8 * i + 3] = 2 * (Math.random() - 0.5) * 0.3;   
   }  


   return {
     position,
     previousPosition,
     velocity
   }

}