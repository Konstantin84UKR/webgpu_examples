
// basic_shader.js
import { cameraStruct, brdfPhong ,lin2rgb,rgb2lin} from './shader_common.js';

export const basicShaderSrc = `
    
    ${lin2rgb}
    ${rgb2lin}

    ${cameraStruct}

    ${brdfPhong}

     struct Ligth {
        eyePosition : vec4<f32>,
        lightPosition : vec4<f32>,       
      };
    
    struct Uniform {
        mMatrix : mat4x4<f32>,      
      };
    
    //---Vertex Shader---//  

    @binding(0) @group(0) var<uniform> uniforms : Uniform;
    @binding(4) @group(0) var<uniform> camera : Camera;
         
      struct Output {
          @builtin(position) Position : vec4<f32>,
          @location(0) vPosition : vec4<f32>,
          @location(1) vUV : vec2<f32>,
          @location(2) vNormal : vec4<f32>,
      };

      @vertex
        fn mainVertex(@location(0) pos: vec4<f32>, @location(1) uv: vec2<f32>, @location(2) normal: vec3<f32>) -> Output {
           
            var output: Output;
            output.Position = camera.pMatrix * camera.vMatrix * uniforms.mMatrix * pos;
            output.vUV = uv * 1.0;
            output.vNormal   =  uniforms.mMatrix * vec4<f32>(normal,0.0);

            return output;
        }

      //---End Vertex Shader---//

      //---Fragment Shader---//  

      @binding(1) @group(0) var textureSampler : sampler;
      @binding(2) @group(0) var textureData : texture_2d<f32>;   
    
      @binding(3) @group(0) var<uniform> uLigth : Ligth;

      @fragment
      fn mainFragment(@builtin(front_facing) is_front: bool,@location(0) vPosition: vec4<f32>, @location(1) vUV: vec2<f32>, @location(2) vNormal:  vec4<f32>) -> @location(0) vec4<f32> {
        

        let shiniess = 50.0;
        let flux = 10.0;

        let lightColor:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);

        let specularColor:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
        let ambientColor:vec3<f32> = vec3<f32>(0.3, 0.4, 0.5);
        
        let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, vUV)).rgb;
              
        let N:vec3<f32> = normalize(vNormal.xyz);
        let L:vec3<f32> = normalize((uLigth.lightPosition).xyz - vPosition.xyz);
        let V:vec3<f32> = normalize((uLigth.eyePosition).xyz - vPosition.xyz);
        let H:vec3<f32> = normalize(L + V);
      
        let diffuse:f32 = 0.8 * max(dot(N, L), 0.0);
        let specular = pow(max(dot(N, H),0.0), shiniess);

        //let irradiance = flux / (4.0 * PI * distlight * distlight) * max(dot(N,L), 0.0); // pointLight       
        let irradiance : f32 = 1.0 * max(dot(N, L), 0.0); // sun
              
        let ambient : vec3<f32> = rgb2lin(textureColor.rgb) * rgb2lin(ambientColor.rgb);
        
        let finalColor:vec3<f32> =  textureColor * (diffuse + ambient) + specularColor * specular; 

        let brdf = brdfPhong(L,V,H,N, rgb2lin(textureColor), rgb2lin(specularColor),shiniess);

        var radiance = brdf * irradiance * rgb2lin(lightColor.rgb) + ambient;
        
        if(is_front){
           return vec4<f32>(lin2rgb(radiance), 1.0);
        }else {
           return vec4<f32>(1.0,0.0,0.0, 1.0);
        }   

       //---End Fragment Shader---//  
    }
  `;
