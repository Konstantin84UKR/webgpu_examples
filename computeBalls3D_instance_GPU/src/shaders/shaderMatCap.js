export const shaderMatCap =
    `
      struct UniformCamera {
       pMatrix : mat4x4<f32>,
       vMatrix : mat4x4<f32>       
      };
      struct Uniform {
       mMatrix : mat4x4<f32>,
       color : vec4<f32>
      }; 

      @group(0) @binding(0) var<uniform> uniformsCamera : UniformCamera;
      @group(1) @binding(0) var<storage, read> uniforms : array<Uniform>;
              
      struct Output {
          @builtin(position) Position : vec4<f32>,
          @location(0) vUV : vec2<f32>,
          @location(1) vNormal : vec3<f32>,
          @location(2) dNormal : vec3<f32>,
          @location(3) indexColor : vec4<f32>,
      };

      @vertex
        fn main_vertex(
        @builtin(instance_index) index : u32,
        @location(0) pos: vec4<f32>, 
        @location(1) uv: vec2<f32>,
        @location(2) normal: vec3<f32>) -> Output {
           
            var output: Output;
            output.Position = uniformsCamera.pMatrix * uniformsCamera.vMatrix * uniforms[index].mMatrix * pos;
            output.vUV = uv;
            output.vNormal = normalize((uniforms[index].mMatrix * vec4<f32>(normal, 0.0)).xyz); // Normal in model space
            output.dNormal = normal;
            output.indexColor = uniforms[index].color;
          
            return output;
        }
   
      @group(1) @binding(1) var textureSampler : sampler;
      @group(1) @binding(2) var textureData : texture_2d<f32>;

      @fragment
      fn main_fragment(@builtin(front_facing) is_front: bool, 
      @location(0) vUV: vec2<f32>, 
      @location(1) vNormal: vec3<f32>, 
      @location(2) dNormal: vec3<f32>,
      @location(3) indexColor: vec4<f32>) -> @location(0) vec4<f32> {
      
      // Move normal to view space
      var muv : vec2<f32> = (uniformsCamera.vMatrix * vec4<f32>(normalize(vNormal), 0.0)).xy * 0.5 + vec2<f32>(0.5, 0.5);
      // read texture inverting Y value
      let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, vec2<f32>(muv.x, 1.0 - muv.y))).rgb;
     
      if(is_front){
        return vec4<f32>(textureColor , 1.0) * indexColor;
      }else{
        return vec4<f32>(1.0, 0.0, 0.0, 1.0);
      }
      
    }`;