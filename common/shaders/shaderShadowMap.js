import {cameraStruct} from './shader_common.js';

export class ShadowShader{
  constructor(params) {
    this.name = 'ShadowShader';
    this.shaderSrc = null;
    this.vertexBuffers = this.setVertexBuffers();
    
   // this.createShaderSrc();
   
  }  
  
  async createShaderSrc() {
    this.shaderSrc = `  

    struct UniformMesh {
        mMatrix : mat4x4<f32>,      
      };

      ${cameraStruct}

      @group(0) @binding(0) var<uniform> uniformsCamera : Camera;

      struct UniformModel {
        mMatrix : mat4x4<f32>,      
      };

      @group(1) @binding(0) var<uniform> uniformMesh : UniformMesh;
      
      @vertex
        fn main(@location(0) pos: vec4<f32>) -> @builtin(position) vec4<f32> {
          return uniformsCamera.pMatrix * uniformsCamera.vMatrix * uniformMesh.mMatrix * pos;
       }`

     return this.shaderSrc;   
  }


  setVertexBuffers(){
     const vertexBuffers = [
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 0,
                        format: "float32x3",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 1,
                        format: "float32x2",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 12,
                    attributes: [{
                        shaderLocation: 2,
                        format: "float32x3",
                        offset: 0
                    }]
                }
            ]
 
            return vertexBuffers
     }
   
}