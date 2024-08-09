import {
    vec3,mat4,
  } from '../../common/wgpu-matrix.module.js';
import { Group } from './Group.js';

export class Mesh extends Group{
       
    constructor(geometry){
        super();
        this.geometry = geometry;
        this.GPU_Buffers = null;

        this.UNIFORM = {};
        this.BINDGROUP = {};
    }
   
}