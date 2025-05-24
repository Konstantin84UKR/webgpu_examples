import { UniformPVM } from './shader_common.js';

export const basicShaderSrc = `  
     ${UniformPVM}

      @group(0) @binding(0) var<uniform> uniforms : UniformPVM;

      struct UniformModel {
        mMatrix : mat4x4<f32>,      
      };

      @group(1) @binding(0) var<uniform> uniformsModel : UniformModel;
      
      @vertex
        fn main(@location(0) pos: vec4<f32>) -> @builtin(position) vec4<f32> {
          return uniforms.pMatrix * uniforms.vMatrix * uniformsModel.mMatrix * pos;
       }`;