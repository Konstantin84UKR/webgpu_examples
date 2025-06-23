import {
  mat4,
} from '../../common/wgpu-matrix.module.js';
import { Object3D } from './object3D.js';
import { Buffer } from './Buffer.js';

export class Mesh extends Object3D {

static _layout = null;
//static createBindGroupLayout

    constructor(device,geometry, material) {
        super();

        this.device = device; 
        this.name = "Mesh";   
        this.geometry = geometry;
        this.material = material;       
        this.boundingBox = null;
        this.uniformBuffer = null;
        this.buffer = null;
        //this.createBindGroupLayout(this.device);

    }

    setTransform(transform) {
       // this.transform = transform;
    }

    getTransform() {
       // return this.transform;
    }

    setBoundingBox(boundingBox) {
        this.boundingBox = boundingBox;
    }

    getBoundingBox() {
        return this.boundingBox;
    }

    async createBuffers(device) {       
        await this.geometry.createBuffers(device);
        //this.material.createBuffers(device);
    }
    
    async createUniformBuffer(device) {

          this.buffer = new Buffer(device,'Mesh Uniform Buffer');  
          this.buffer.gpuBuffer = await Buffer.createUniformBuffer(device,64,'Mesh GPU Buffer',GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);  

          //this.uniformBuffer = this.buffer.gpuBuffer;       
    } 

    async updateUniformBuffer() {
         this.buffer.updateBuffer(this.worldMatrix,0);
    }

    static async createBindGroupLayout(device) {
       
        const entries = [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: 'uniform' }
                }
            ]


        Mesh._layout = device.createBindGroupLayout({
            label: 'MESH Bind Group Layout',
            entries: entries
        });
    }

    async createBindGroup(device) {
      
       const entries = [
          // Добавляем буфер с uniform данными для mesh4
          // Этот буфер будет содержать данные о позиции и цвете источника света
          {
            binding: 0,
            resource: {
                buffer: this.buffer.gpuBuffer,
                offset: 0,
                size: 64   // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
          }  
         ]
      
       const uniformBindGroup = device.createBindGroup({
       label: "MESH uniformBindGroup",
       layout: Mesh._layout,
        entries: entries
    });

        this.bindGroup = uniformBindGroup;	
    }

}  