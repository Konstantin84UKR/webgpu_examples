
import {
  mat4,
} from './wgpu-matrix.module.js';

class Transform {
    constructor(tMatrix = null, rMatrix = null, sMatrix = null) {
        this.tMatrix = tMatrix || mat4.create();
        this.rMatrix = rMatrix || mat4.create();
        this.sMatrix = sMatrix || mat4.create();
        
    }

    
}