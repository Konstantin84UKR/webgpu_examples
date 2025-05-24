import {
  mat4,
} from '../../common/wgpu-matrix.module.js';
import { Object3D } from './object3D.js';

export class Mesh extends Object3D {
    constructor(geometry, material) {
        super();
        this.name = "Mesh";   
        this.geometry = geometry;
        this.material = material;       
        this.boundingBox = null;
        this.uniformBuffer = null;
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

    createBuffers(device) {       
        this.geometry.createBuffers(device);
        //this.material.createBuffers(device);
    }
    
    async createUniformBuffer(device) {
      
        const uniformBuffer = device.createBuffer({
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

}  