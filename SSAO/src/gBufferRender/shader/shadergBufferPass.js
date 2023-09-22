export const shadergBufferPass = {
    vertex: `
    struct Uniform {
     pMatrix : mat4x4<f32>,
     vMatrix : mat4x4<f32>,
     mMatrix : mat4x4<f32>,      
    };
    @binding(0) @group(0) var<uniform> uniforms : Uniform;

    struct UniformLight {
      pMatrix : mat4x4<f32>,
      vMatrix : mat4x4<f32>,
      mMatrix : mat4x4<f32>,      
     };
     @binding(4) @group(0) var<uniform> uniformsLight : UniformLight;

     struct UniformModel {
        mMatrix : mat4x4<f32>,      
     };

     @binding(0) @group(1) var<uniform> uniformsModel : UniformModel;
       
    struct Output {
        @builtin(position) Position : vec4<f32>,
        @location(0) fragPosition : vec3<f32>,
        @location(1) fragUV : vec2<f32>,
        @location(2) fragNormal : vec3<f32>,             
    };
   

    @vertex
      fn main(@location(0) pos: vec4<f32>, @location(1) uv: vec2<f32>, @location(2) normal: vec3<f32>) -> Output {
         
          // Матрицу нормали нужно отдельно передавать
          // Она не должна перемешать поэтому обнулил последний вектор
          var nMatrix : mat4x4<f32> = uniformsModel.mMatrix;
          nMatrix[3] = vec4<f32>(0.0, 0.0, 0.0, 1.0); 

          var output: Output;
          output.Position = uniforms.pMatrix * uniforms.vMatrix * uniformsModel.mMatrix * pos;         

          output.fragPosition = (uniformsModel.mMatrix * pos).xyz;
          output.fragUV = uv;
          output.fragNormal  = (nMatrix * vec4<f32>(normal,1.0)).xyz; 

          return output;
      }
  `,

  fragment: `     
    @group(0) @binding(1) var textureSampler : sampler;
    @group(0) @binding(2) var textureData : texture_2d<f32>;   

    struct Uniforms {
      eyePosition : vec4<f32>,
      lightPosition : vec4<f32>,       
    };
    @group(0) @binding(3) var<uniform> uniforms : Uniforms;

    struct GBufferOutput {
      @location(0) color1 : vec4<f32>,
      @location(1) normal : vec4<f32>,
    }
      

    @fragment
    fn main(@location(0) fragPosition: vec3<f32>,
     @location(1) fragUV: vec2<f32>, 
     @location(2) fragNormal: vec3<f32>,    
     ) -> GBufferOutput {
      
      let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, fragUV)).rgb;
      let N:vec3<f32> = normalize(fragNormal.xyz);
     
      var output : GBufferOutput;
      output.normal = vec4(N, 1.0);
      output.color1 = vec4(textureColor, 1.0);
           
      return output;
  }
  `,
  };
