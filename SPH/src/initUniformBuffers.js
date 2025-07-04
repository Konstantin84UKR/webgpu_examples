
import { SIM_RESOLUTION,
  K, 
  K_NEAR,
  INTERACTION_RADIUS,
  REST_DENSITY,
  VELOCITY_DAMPING } from "./settings.js";

export async function initUniformBuffers(device, inputData, uResolution,se) {

  const uBiffers = {};
  // create uniform buffer and layout
  const inputUniform = new Float32Array([1.0]);
  const bufferUniform = device.createBuffer({
    label: 'buffer Position',
    size: inputUniform.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  uBiffers.bufferUniform = bufferUniform;

  //****************************************//
  //Position
  const position_A = initBufferForCompute(device,'position_A', inputData.position);
  uBiffers.position_A = position_A;

  const position_B = initBufferForCompute(device,'position_B', inputData.position);
  uBiffers.position_B = position_B;

  //Previous position
  const previousPosition_A = initBufferForCompute(device,'previousPosition_A', inputData.previousPosition);
  uBiffers.previousPosition_A = previousPosition_A;

  const previousPosition_B = initBufferForCompute(device,'previousPosition_B', inputData.previousPosition);
  uBiffers.previousPosition_B = previousPosition_B;

  //velocity
  const velocity_A = initBufferForCompute(device,'velocity_A', inputData.velocity);
  uBiffers.velocity_A = velocity_A;

  const velocity_B = initBufferForCompute(device,'velocity_B', inputData.velocity);
  uBiffers.velocity_B = velocity_B;

   //density
  const density = initBufferForCompute(device,'density', inputData.density);
  uBiffers.density = density;

  const nearDensity = initBufferForCompute(device,'nearDensity', inputData.nearDensity);
  uBiffers.nearDensity = nearDensity;

  //pressure
  const pressure = initBufferForCompute(device,'density', inputData.pressure);
  uBiffers.pressure = pressure;

  const nearPressure = initBufferForCompute(device,'nearDensity', inputData.nearPressure);
  uBiffers.nearPressure = nearPressure;


  //  //velocity
  // const velocity_A = initBufferForCompute(device,'velocity_A', inputData.velocity);
  // uBiffers.velocity_A = velocity_A;

  // const velocity_B = initBufferForCompute(device,'velocity_B', inputData.velocity);
  // uBiffers.velocity_B = velocity_B;

  const particleDisplacement = initBufferForCompute(device,'velocity_B', inputData.particleDisplacement);
  uBiffers.particleDisplacement = particleDisplacement;
  

  //****************************************//
  const resultBuffer = device.createBuffer({
    label: 'result buffer',
    size: inputData.position.byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
  uBiffers.resultBuffer = resultBuffer;


  // create uniform buffer and layout

  const bufferUniform_render = device.createBuffer({
    label: 'buffer uResolution',
    size: uResolution.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  uBiffers.bufferUniform_render = bufferUniform_render;
  device.queue.writeBuffer(bufferUniform_render, 0, uResolution);

  return { uBiffers };
}


function initBufferForCompute(device,label,inputData){
  const _buffer = device.createBuffer({
    label: label,
    size: inputData.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    //usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(_buffer, 0, inputData); 

  return _buffer;
}