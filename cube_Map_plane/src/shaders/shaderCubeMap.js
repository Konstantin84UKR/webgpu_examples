export const shader = {
  vertex: `
    struct Output {
        @builtin(position) Position : vec4<f32>,
        @location(0) fragUV : vec2<f32>,
        @location(1) fragPosition: vec4<f32>,
    };

    @vertex
      fn main(@builtin(vertex_index) VertexIndex : u32) -> Output {
      
          const pos = array<vec2<f32>, 6>(
              vec2( 1.0,  1.0),  vec2(  1.0, - 1.0), vec2(- 1.0, - 1.0),
              vec2( 1.0,   1.0),  vec2(- 1.0, - 1.0), vec2(- 1.0, 1.0)            
          );
  
          const uv = array(
              vec2( 1.0,  0.0),  vec2( 1.0,  1.0), vec2( 0.0,  1.0),
              vec2( 1.0,  0.0),  vec2( 0.0,  1.0), vec2( 0.0,  0.0)            
          );


          var output: Output;         
          output.Position = vec4(pos[VertexIndex], 1.0, 1.0);
          output.fragUV = uv[VertexIndex];
          output.fragPosition = vec4(pos[VertexIndex], 1.0, 1.0);

          return output;
      }
  `,

  fragment: `
    @group(0) @binding(1) var mySampler: sampler;
    @group(0) @binding(2) var myTexture: texture_cube<f32>;

    struct Uniform {
      inversPVMatrix : mat4x4<f32>,
    };
    @binding(0) @group(0) var<uniform> uniformsInvers : Uniform;
    
    @fragment
    fn main( @location(0) fragUV: vec2<f32>,
              @location(1) fragPosition: vec4<f32>) -> @location(0) vec4<f32> {
   
        var cubemapVec2 = uniformsInvers.inversPVMatrix * fragPosition;
        var cubemapVec = fragPosition;
        var UVvec3 = normalize(cubemapVec2.xyz / cubemapVec2.w);
        return textureSample(myTexture, mySampler, UVvec3);
  }
  `,
};
