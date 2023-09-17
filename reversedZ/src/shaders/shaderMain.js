export const shaderMain = {
    vertex: `
    struct Uniform {
      pMatrix : mat4x4<f32>,
      vMatrix : mat4x4<f32>,
      mMatrix : mat4x4<f32>,
    };
    @binding(0) @group(0) var<uniform> uniforms : Uniform;
      
    struct Output {
        @builtin(position) Position : vec4<f32>,
        @location(0) vColor : vec4<f32>,
    };

    @vertex
      fn main(@location(0) pos: vec4<f32>, @location(1) color: vec4<f32>) -> Output {
      
          var output: Output;
          output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
          output.vColor = color;

          return output;
      }
  `,

    fragment: `
    @fragment
    fn main(@location(0) vColor: vec4<f32>) -> @location(0) vec4<f32> {
    return vColor;
  }
  `,
  };