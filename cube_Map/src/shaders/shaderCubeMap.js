export const shader = {
    vertex: `
    struct Uniform {
      pMatrix : mat4x4<f32>,
      vMatrix : mat4x4<f32>,
      mMatrix : mat4x4<f32>,
    };
    @binding(0) @group(0) var<uniform> uniforms : Uniform;
      
    struct Output {
        @builtin(position) Position : vec4<f32>,
        @location(0) fragUV : vec2<f32>,
        @location(1) fragPosition: vec4<f32>,
    };

    @vertex
      fn main(  @location(0) position : vec4<f32>,
                @location(1) uv : vec2<f32>) -> Output {
      
          var output: Output;
          output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * position;
          output.fragUV = uv;
          output.fragPosition = position ;

          return output;
      }
  `,

    fragment: `
    @group(0) @binding(1) var mySampler: sampler;
    @group(0) @binding(2) var myTexture: texture_cube<f32>;
    
    @fragment
    fn main( @location(0) fragUV: vec2<f32>,
              @location(1) fragPosition: vec4<f32>) -> @location(0) vec4<f32> {
   
        var cubemapVec = fragPosition.xyz;
        return textureSample(myTexture, mySampler, cubemapVec);
  }
  `,
  };
