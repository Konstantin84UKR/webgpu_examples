export const shaderLigthHelpers = {
    vertex: `
    struct Uniform {
     pMatrix : mat4x4<f32>,
     vMatrix : mat4x4<f32>
    };
    @binding(0) @group(0) var<uniform> uniforms : Uniform;

    @binding(1) @group(0) var<storage, read> mMatrix : array<mat4x4<f32>>;
       
    struct Output {
        @builtin(position) Position : vec4<f32>,
        @location(0) @interpolate(flat) instanceColor : u32            
    };

    @vertex
      fn main(  @builtin(instance_index) instanceIndex : u32, 
                @location(0) pos: vec4<f32>) -> Output {
         
          var output: Output;
          output.Position = uniforms.pMatrix * uniforms.vMatrix * mMatrix[instanceIndex] * pos;
          output.instanceColor = instanceIndex;
          return output;
      }
  `,

    fragment: `     
  
    @binding(2) @group(0) var<storage, read> lightColor : array<vec4<f32>,3>;

    @fragment
    fn main(@location(0) @interpolate(flat) instanceColor: u32) -> @location(0) vec4<f32> {
    
      //let finalColor:vec3<f32> =  lightColor[instanceIndex]; 
      return  lightColor[instanceColor];     
  }
  `};