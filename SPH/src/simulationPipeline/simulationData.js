import { PARTICLE_COUNT , SIM_RESOLUTION} from '../settings.js';

export async function simulationData() {

  const numParticles = PARTICLE_COUNT;

  let position = new Float32Array(numParticles * 2);
  let previousPosition = new Float32Array(numParticles * 2);
  let velocity = new Float32Array(numParticles * 8);
  let density = new Float32Array(numParticles * 1);
  let nearDensity = new Float32Array(numParticles * 1);
  let pressure = new Float32Array(numParticles * 1);
  let nearPressure = new Float32Array(numParticles * 1);
  let neighbours = new Float32Array(numParticles * 8);



  for (let i = 0; i < numParticles; ++i) {
    position[2 * i + 0] = (Math.random()) * 1.0 * SIM_RESOLUTION.width; //pos
    position[2 * i + 1] = (Math.random()) * 1.0 * SIM_RESOLUTION.height;
  }

  previousPosition = new Float32Array(numParticles * 2);


  for (let i = 0; i < numParticles; ++i) {
    velocity[2 * i + 0] = 2 * (Math.random() - 0.5) * 0.5; //vel
    velocity[2 * i + 1] = 2 * (Math.random() - 0.5) * 0.5;
  }

  for (let i = 0; i < numParticles; ++i) {
    density[i] = 0.0; //density
  }

  for (let i = 0; i < numParticles; ++i) {
    nearDensity[i] = 0.0; //nearDensity
  }


  return {
    position,
    previousPosition,
    velocity,
    density,
    nearDensity,
    pressure,
    nearPressure,
  }

}