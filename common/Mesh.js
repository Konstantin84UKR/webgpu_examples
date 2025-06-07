import {
  mat4,
} from '../../common/wgpu-matrix.module.js';
import { Object3D } from './object3D.js';

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
      
        const uniformBuffer = device.createBuffer({
        label: 'Mesh Uniform Buffer',
        // size: 64, // 16 * 4 bytes for a 4x4 matrix
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        }); 

        this.uniformBuffer = uniformBuffer;        
    }

    async updateUniformBuffer(device) {
        //this.updateModelMatrix();
        // const worldMatrix = this.worldMatrix;
        // const uniformBuffer = this.uniformBuffer;
        device.queue.writeBuffer(this.uniformBuffer, 0, this.worldMatrix);
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
                buffer: this.uniformBuffer,
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