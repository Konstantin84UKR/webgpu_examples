import {
    mat4, vec3 , vec4
  } from './wgpu-matrix.module.js';
  //import { createBufferFromData } from './createBufferFromData.js';  

export class Mesh{
    constructor(label, geometryData,INSTANS_COUNT = undefined,INSTANS_STRIDE = 1){
        
        this.label = label;
        this.geometryData = geometryData;
        this.geometry = {};

        this.initMeshArray(this.geometryData);

        this.MODELMATRIX = mat4.identity();
        if(INSTANS_COUNT!==undefined){
            this.MODELMATRIX_ARRAY = new Float32Array(INSTANS_COUNT * INSTANS_STRIDE);  
        }  
    };
     
    async initMeshArray(geometryData){
        this.geometry.vertex = new Float32Array(geometryData.vertices);
        this.geometry.uv = new Float32Array(geometryData.uvs);
        this.geometry.normal = new Float32Array(geometryData.normals);
        this.geometry.index = new Uint32Array(geometryData.indices);  
      
    }
}