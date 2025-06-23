export class Buffer{
    
    static async createUniformBuffer(
        device, 
        size, 
        label = 'Mesh Uniform Buffer' , 
        usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    ) {
      
        const uniformBuffer = device.createBuffer({
        label: label,
        size: size,
        usage: usage
        }); 

        return uniformBuffer;        
    }

      static async createAttributeBuffer(
        device, 
        data, 
        label = 'Mesh Attribute Buffer' , 
        usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation
    ) {
      
         const attributeGPUBuffer = device.createBuffer({
            label: label,
            size: data.byteLength,
            usage: usage,   //COPY_DST  ХЗ что это
            mappedAtCreation: mappedAtCreation
        });

        return attributeGPUBuffer;        
    }

    
       
    constructor(device,label){
        this.label = label;
        this.device = device;
        this.gpuBuffer = null;
    }


    async updateBuffer(
        data, 
        offset
    ) {
      
        this.device.queue.writeBuffer(this.gpuBuffer, offset, data);         
    }

    async setData(data){
        
        new Float32Array(this.gpuBuffer.getMappedRange()).set(data);
        // передаем буфер в управление ГПУ */
        this.gpuBuffer.unmap();
    }
   
}