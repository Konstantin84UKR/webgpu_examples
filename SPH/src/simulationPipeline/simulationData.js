import { PARTICLE_COUNT , SIM_RESOLUTION} from '../settings.js';

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

  
   
   for (let i = 0; i < numParticles; ++i) {
        position[2 * i + 0] = (Math.random()) * 1.0 * SIM_RESOLUTION.width; //pos
        position[2 * i + 1] = (Math.random()) * 1.0 * SIM_RESOLUTION.height;      
   }
   
   //previousPosition = new Float32Array(numParticles * 2);
    
   
   for (let i = 0; i < numParticles; ++i) {
    velocity[2 * i + 2] = 2 * (Math.random() - 0.5) * 0.5; //vel
    velocity[2 * i + 3] = 2 * (Math.random() - 0.5) * 0.3;   
   }  


   return {
     position,
     previousPosition,
     velocity
   }

}