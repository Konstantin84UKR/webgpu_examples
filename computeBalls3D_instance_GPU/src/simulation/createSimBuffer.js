export async function createSimBuffer(scene){
  
  //--------------------------------------------------
  //SIM

 // scene.inputTime = new Float32Array([0]);
  scene.UNIFORM.SIM.bufferUniform = scene.device.createBuffer({
      label: 'bufferUniform',
      size: scene.inputTime.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  scene.UNIFORM.SIM.workBuffer_A = scene.device.createBuffer({
    label: 'work buffer A',
    size: scene.dataForBufferSim.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });


  scene.UNIFORM.SIM.workBuffer_B = scene.device.createBuffer({
    label: 'work buffer B',
    size: scene.dataForBufferSim.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });

  // create a buffer on the GPU to get a copy of the results
  scene.UNIFORM.SIM.resultBuffer = scene.device.createBuffer({
    label: 'result buffer',
    size: scene.dataForBufferSim.byteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  scene.UNIFORM.SIM.bufferCurrentBall = scene.device.createBuffer({
    label: 'currentBall',
    size: scene.dataForCurrentBall.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

}


export async function initSimBuffer(scene,data){
    // Copy our input data to that buffer
    scene.device.queue.writeBuffer(scene.UNIFORM.SIM.workBuffer_A, 0, data);
    scene.device.queue.writeBuffer(scene.UNIFORM.SIM.workBuffer_B, 0, data);
    scene.device.queue.writeBuffer(scene.UNIFORM.SIM.bufferUniform, 0, new Float32Array([0]));
    scene.device.queue.writeBuffer(scene.UNIFORM.SIM.bufferCurrentBall, 0, new Float32Array(8));
 }

 export async function updateSimBuffer(scene,uTime){
  // Copy our input data to that buffer
   scene.device.queue.writeBuffer(scene.UNIFORM.SIM.bufferUniform, 0, uTime);
   scene.device.queue.writeBuffer(scene.UNIFORM.SIM.bufferCurrentBall, 0, scene.dataForCurrentBall);
}
   