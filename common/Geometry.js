import { Buffer } from "./Buffer.js";

export class Geometry{
    constructor(){
      this.vertices = [];
      this.uvs = [];
      this.normals = [];
      this.tangents = [];
      this.indices = [];

      this.buffers = {
        vertexBuffer: null,
        uvBuffer: null,
        normalBuffer: null,
        indexBuffer: null
      };
      
    }   

    async createBuffers(device){
        const cube_vertex = new Float32Array(this.vertices);
        const cube_uv = new Float32Array(this.uvs);
        const cube_normal = new Float32Array(this.normals);
        const cube_index = new Uint32Array(this.indices);

        //****************** BUFFER  vertexBuffer
        const vertexBuffer = new Buffer(device,'vertexBuffer');  
        vertexBuffer.gpuBuffer = await Buffer.createAttributeBuffer( device, 
                                    cube_vertex,//data 
                                    'vertexGPUBuffer' , //label
                                    GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,//usage
                                    true); //mappedAtCreation
      
        vertexBuffer.setData(cube_vertex)
        this.buffers.vertexBuffer = vertexBuffer.gpuBuffer;

        //****************** BUFFER  uvBuffer
        const uvBuffer = device.createBuffer({
            label: "uvBuffer",
            size: cube_uv.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
            mappedAtCreation: true
        });
        //загружаем данные в буффер */
        new Float32Array(uvBuffer.getMappedRange()).set(cube_uv);
        // передаем буфер в управление ГПУ */
        uvBuffer.unmap();
        this.buffers.uvBuffer = uvBuffer;

        //****************** BUFFER  normalBuffer
        const normalBuffer = device.createBuffer({
            label: "normalBuffer",
            size: cube_normal.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
            mappedAtCreation: true
        });
        //загружаем данные в буффер */
        new Float32Array(normalBuffer.getMappedRange()).set(cube_normal);
        // передаем буфер в управление ГПУ */
        normalBuffer.unmap();
        this.buffers.normalBuffer = normalBuffer;
       
        //****************** BUFFER  indexBuffer
        const indexBuffer = device.createBuffer({
            label: "indexBuffer",
            size: cube_index.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });

        new Uint32Array(indexBuffer.getMappedRange()).set(cube_index);
        indexBuffer.unmap();
        this.buffers.indexBuffer = indexBuffer;
    }

}
 