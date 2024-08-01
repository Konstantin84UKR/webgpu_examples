 ///**  Шейдеры тут все понятно более мение. */  
 export const shaderShadow = {
    vertex: `  
      struct Uniform {
        pMatrix : mat4x4<f32>,
        vMatrix : mat4x4<f32>,
        mMatrix : mat4x4<f32>,      
      };

      @group(0) @binding(0) var<uniform> uniforms : Uniform;
      
      @vertex
        fn main(@location(0) pos: vec4<f32>,
         @location(1) uv: vec2<f32>, 
         @location(2) normal: vec3<f32> 
         ) -> @builtin(position) vec4<f32> {

          return uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
       }`
  };