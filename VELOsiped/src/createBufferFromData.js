export async function createBufferFromData(device,param){
  
    const INDEX = true;
    const VERTEX = false;

    const vertexBuffer = await createBuffer(device, new Float32Array(param.vertices), GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, param.label + "_vertexBuffer", VERTEX );
    const uvBuffer = await createBuffer(device,      new Float32Array(param.uvs),     GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, param.label + "_uvBuffer",     VERTEX );
    const normalBuffer = await createBuffer(device,  new Float32Array(param.normals), GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, param.label + "_normalBuffer", VERTEX );
    const indexBuffer = await createBuffer(device,  new Uint32Array(param.indices) , GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,  param.label + "_indexBuffer" , INDEX );
  
    return {
      vertexBuffer, uvBuffer, normalBuffer, indexBuffer 
    }
  
  };


async function  createBuffer(device, data, usage ,label ,INDEX){
      
    const buffer = device.createBuffer({
        label: label,
        size: data.byteLength,
        usage: usage,   //COPY_DST  можно писать в буффер
        mappedAtCreation: true
      });
      //загружаем данные в буффер */
      if(INDEX){
        new Uint32Array(buffer.getMappedRange()).set(data);       
      }else{
        new Float32Array(buffer.getMappedRange()).set(data);      
      }
      
      buffer.unmap();

      return buffer
} 
