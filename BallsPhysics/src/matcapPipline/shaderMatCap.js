export const shaderMatCap = {
    shader: `
    struct Uniform {
     pMatrix : mat4x4<f32>,
     vMatrix : mat4x4<f32>,
    };
    @group(0) @binding(0) var<uniform> uniforms : Uniform;
         
       
    struct Output {
        @builtin(position) Position : vec4<f32>,
        @location(0) vUV : vec2<f32>,
        @location(1) vNormal : vec3<f32>,            
    };

    @group(1) @binding(0) var<storage, read> mMatrix : array<mat4x4<f32>>;
    @group(1) @binding(1) var<storage, read> nMatrix : array<mat4x4<f32>>;
   
    @vertex
      fn main_vertex(@location(0) pos: vec4<f32>, 
      @location(1) uv: vec2<f32>, 
      @location(2) normal: vec3<f32>,
      @builtin(instance_index) index : u32,) -> Output {
         
          var output: Output;
          output.Position = uniforms.pMatrix * uniforms.vMatrix * mMatrix[index] * pos;
          output.vUV = uv;
          output.vNormal = normalize((uniforms.vMatrix * nMatrix[index] * vec4<f32>(normal, 0.0)).xyz); // Normal in model space
          return output;
      }
 
    @group(0) @binding(1) var textureSampler : sampler;
    @group(0) @binding(2) var textureData : texture_2d<f32>;

    @fragment
    fn main_fragment(@location(0) vUV: vec2<f32>, 
    @location(1) vNormal: vec3<f32>) -> @location(0) vec4<f32> {
            
    // Move normal to view space
    var muv : vec2<f32> = (vec4<f32>(normalize(vNormal), 0.0)).xy * 0.49 + vec2<f32>(0.5, 0.5);
    // read texture inverting Y value
    let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, vec2<f32>(muv.x, 1.0 - muv.y))).rgb;
    return vec4<f32>(textureColor, 1.0);
  }`,
  };