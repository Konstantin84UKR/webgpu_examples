
// basic_shader.js
import { mathDefines,cameraStruct, brdfPhong ,lin2rgb,rgb2lin,Light} from './shader_common.js';

export const basicShaderSrc = `
    
    ${mathDefines}
    ${lin2rgb}
    ${rgb2lin}

    ${cameraStruct}

    ${brdfPhong}

    ${Light}
    
    struct UniformMesh {
        mMatrix : mat4x4<f32>,      
      };

    struct PhongMaterialUniform {
       diffuseColor  : vec4<f32>,  
       specularColor : vec3<f32>,
       shiniess      : f32,
       ambientColor  : vec4<f32>,    
    };  
          
    
    @group(0) @binding(0) var<uniform> camera : Camera;
    
    @group(1) @binding(0) var<uniform> uLigth : Light;
    
    @group(2) @binding(0) var<uniform> uniforms : UniformMesh;
    
    @group(3) @binding(0) var<uniform> materialUniform : PhongMaterialUniform;
    @group(3) @binding(1) var textureSampler : sampler;
    @group(3) @binding(2) var textureData : texture_2d<f32>;   
    
    //---Vertex Shader---//       
      struct Output {
          @builtin(position) Position : vec4<f32>,
          @location(0) vPosition : vec4<f32>,
          @location(1) vUV : vec2<f32>,
          @location(2) vNormal : vec4<f32>,
      };

      @vertex
        fn mainVertex(
        @location(0) pos: vec4<f32>, 
        @location(1) uv: vec2<f32>, 
        @location(2) normal: vec3<f32>) -> Output {
           
            var output: Output;
            output.Position = camera.pMatrix * camera.vMatrix * uniforms.mMatrix * pos;
            output.vUV = uv * 1.0;
            output.vNormal   =  uniforms.mMatrix * vec4<f32>(normal,0.0);

            return output;
        }

      //---End Vertex Shader---//

      //---Fragment Shader---//  
      @fragment
      fn mainFragment(@builtin(front_facing) is_front: bool,
      @location(0) vPosition: vec4<f32>, 
      @location(1) vUV: vec2<f32>, 
      @location(2) vNormal:  vec4<f32>) -> @location(0) vec4<f32> {
        

        let shiniess = materialUniform.shiniess;
     
        let flux = 25.0;

        let lightColor:vec3<f32> = uLigth.lightColor.rgb;
        let lightPosition:vec3<f32> = uLigth.lightPosition.xyz;

        let specularColor:vec3<f32> = materialUniform.specularColor.rgb;      
        let ambientColor:vec3<f32> = materialUniform.ambientColor.rgb; // ambient color
                
        let diffuseColor:vec3<f32> = (textureSample(textureData, textureSampler, vUV)).rgb;
        let diffuseColor2:vec3<f32> =  vec3<f32>(0.2, 0.3, 0.4);

      //  let diffuseColor:vec3<f32> =  diffuseColor1 * diffuseColor2; 
              
        let N:vec3<f32> = normalize(vNormal.xyz);
        let L:vec3<f32> = normalize((lightPosition).xyz - vPosition.xyz);
       
        let V:vec3<f32> = normalize((camera.position).xyz - vPosition.xyz);
        let H:vec3<f32> = normalize(L + V);
      
        let diffuse:f32 = 0.8 * max(dot(N, L), 0.0);
        let specular = pow(max(dot(N, H),0.0), shiniess);
        
        // Light 
        var irradiance = 0.0;
        var irradianceLightType = 1.0;
       
        if(uLigth.lightType == 0) { // directional light
          
            irradianceLightType = 1.0;

        }else if(uLigth.lightType == 1) { // point light       
         
            let distlight = distance((lightPosition).xyz, vPosition.xyz); 
            irradianceLightType = (flux / (4.0 * PI * distlight * distlight));   

        }
      
        irradiance += irradianceLightType * max(dot(N,L), 0.0); //   
           
        
        let ambient : vec3<f32> = rgb2lin(diffuseColor.rgb) * rgb2lin(ambientColor.rgb);       

        let brdf = brdfPhong(L,V,H,N, rgb2lin(diffuseColor), rgb2lin(specularColor),shiniess);

        var radiance = brdf * irradiance * rgb2lin(lightColor.rgb) + ambient;
        
       

        if(is_front){
           return vec4<f32>(lin2rgb(radiance), 1.0);
        }else {
           return vec4<f32>(1.0,0.0,0.0, 1.0);
        }   

       //---End Fragment Shader---//  
    }
  `;
