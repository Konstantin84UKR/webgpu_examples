

export const shaderPBR = {
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
        
     @binding(9) @group(0) var textureDataHeight : texture_2d<f32>; 
     @binding(1) @group(1) var shadowSampler : sampler_comparison;
 

      struct Output {
          @builtin(position) Position : vec4<f32>,
          @location(0) fragPosition : vec3<f32>,
          @location(1) fragUV : vec2<f32>,
          @location(2) fragNormal : vec3<f32>,
          @location(3) shadowPos : vec3<f32>,
          @location(4) fragNor : vec3<f32>,
          @location(5) fragTangent : vec3<f32>, 
          @location(6) fragBitangent : vec3<f32>         
      };
     

      @vertex
        fn main(@location(0) pos: vec4<f32>, 
        @location(1) uv: vec2<f32>, 
        @location(2) normal: vec3<f32>, 
        @location(3) tangent: vec3<f32>) -> Output {
           
            var output: Output;
            output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
            output.fragPosition = (uniforms.mMatrix * pos).xyz;
            output.fragUV = vec2<f32>(uv.x, uv.y);
            output.fragNormal  = (uniforms.mMatrix * vec4<f32>(normal,1.0)).xyz; 
                    
              // -----NORMAL --------------------------------
              let norm : vec3<f32>  = normalize((uniforms.mMatrix * vec4<f32>(normal,0.0)).xyz);
              let tang : vec3<f32> = normalize((uniforms.mMatrix * vec4<f32>(tangent,0.0)).xyz);
             // let binormal : vec3<f32> = normalize((uniforms.mMatrix * vec4<f32>(bitangent,0.0)).xyz);

              output.fragNor  = norm; 
              output.fragTangent  = tang; 
              output.fragBitangent  =  normalize(cross(norm,tang)); 
          

            let posFromLight: vec4<f32> = uniformsLight.pMatrix * uniformsLight.vMatrix * uniformsLight.mMatrix * pos;
            // Convert shadowPos XY to (0, 1) to fit texture UV
            output.shadowPos = vec3<f32>(posFromLight.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5), posFromLight.z);

            return output;
        }
    `,

    fragment: ` 
      
      const PI = 3.14159265359; 
      const RECIPROCAL_PI = 0.3183098861837907;
      const RECIPROCAL_2PI = 0.15915494309189535;      
      const gamma = 2.2; 

      fn rgb2lin(rgb: vec3f)-> vec3f{ // sRGB to linear approximation
        return pow(rgb, vec3f(2.2));
      }
      
      fn lin2rgb(lin: vec3f)-> vec3f { // linear to sRGB approximation
        return pow(lin, vec3f(1.0 / 2.2));
      }

      fn FresnelSchlick(cosTheta : f32, F0 : vec3f) -> vec3f {
        return F0 + (vec3f(1) - F0) * pow(1.0 - cosTheta, 5.0);
      }

      fn fresnelSchlickRoughness(cosTheta : f32, F0 : vec3f, roughness : f32)-> vec3f {
        return F0 + (max(vec3f(1.0 - roughness),F0) - F0) * pow(1.0 - cosTheta, 5.0);
      }
  
      fn DistributionGGX(N : vec3f, H : vec3f, roughness : f32) -> f32 {
        let a      = roughness*roughness;
        let a2     = a*a;
        let NdotH  = max(dot(N, H), 0);
        let NdotH2 = NdotH*NdotH;
  
        let num    = a2;
        let denom  = (NdotH2 * (a2 - 1) + 1);
  
        return num / (PI * denom * denom);
      }
  
      fn GeometrySchlickGGX(NdotV : f32, roughness : f32) -> f32 {
        let r = roughness + 1;
        let k = (r*r) / 8;
  
        let num   = NdotV;
        let denom = NdotV * (1 - k) + k;
  
        return num / denom;
      }
  
      fn GeometrySmith(N : vec3f, V : vec3f, L : vec3f, roughness : f32) -> f32 {
        let NdotV = max(dot(N, V), 0);
        let NdotL = max(dot(N, L), 0);
        let ggx2  = GeometrySchlickGGX(NdotV, roughness);
        let ggx1  = GeometrySchlickGGX(NdotL, roughness);
  
        return ggx1 * ggx2;
      }

      
      
      struct Uniforms {
        eyePosition : vec4<f32>,
        lightPosition : vec4<f32>,       
      };
      
      @binding(1) @group(0) var textureSampler : sampler;
      @binding(2) @group(0) var textureDataBaseColor : texture_2d<f32>; 
      @binding(3) @group(0) var <uniform> uniforms : Uniforms;  
      @binding(5) @group(0) var textureDataNormal : texture_2d<f32>;  
      @binding(6) @group(0) var textureDataRoughness : texture_2d<f32>; 
      @binding(7) @group(0) var textureDataMetallic : texture_2d<f32>;  
      @binding(8) @group(0) var textureDataAO : texture_2d<f32>; 
      @binding(9) @group(0) var textureDataEmissive : texture_2d<f32>; 

     
      @binding(0) @group(1) var shadowMap : texture_depth_2d;  
      @binding(1) @group(1) var shadowSampler : sampler_comparison;
      
      @group(2) @binding(0) var IBLSampler: sampler;
      @group(2) @binding(1) var IBLTexture: texture_cube<f32>;

      @group(3) @binding(0) var skyBoxSampler: sampler;
      @group(3) @binding(1) var skyBoxTexture: texture_cube<f32>;
      @group(3) @binding(2) var brdfLUT: texture_2d<f32>;
    
      @fragment
      fn main(@location(0) fragPosition: vec3<f32>,
       @location(1) fragUV: vec2<f32>, 
       @location(2) fragNormal: vec3<f32>,
       @location(3) shadowPos: vec3<f32>,
       @location(4) fragNor: vec3<f32>,
       @location(5) fragTangent: vec3<f32>,
       @location(6) fragBitangent: vec3<f32>, ) -> @location(0) vec4<f32> {
        
        let specularColor:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
        let sourceDiffuseColor:vec3<f32> = vec3<f32>(5.0, 5.0, 5.0);
        let i = 1.0f;
        let reflectance:f32 = 1.0;
        
        //BaseColor
        let textureAlbedo:vec3<f32> = (textureSample(textureDataBaseColor, textureSampler, fragUV * i)).rgb;
        let textureBaseColor:vec3<f32> = rgb2lin(textureAlbedo);
      
        //Roughness & Metallic & AO
        let texturRoughness:vec3<f32> = vec3<f32>((textureSample(textureDataRoughness, textureSampler, fragUV * i)).g );
        //let texturRoughness:vec3<f32> = rgb2lin(texturRoughnessColor);
      
        let texturMetallic:vec3<f32> = vec3<f32>((textureSample(textureDataMetallic, textureSampler, fragUV * i)).b);
       // let texturMetallic:vec3<f32> = rgb2lin(texturMetallicColor);

        let texturAO:vec3<f32> = vec3<f32>((textureSample(textureDataAO, textureSampler, fragUV * i)).r);
       
        let texturEmissiveColor:vec3<f32> = (textureSample(textureDataEmissive, textureSampler, fragUV * i)).rgb;
        let texturEmissive:vec3<f32> = rgb2lin(texturEmissiveColor);
                
        //Normal 
        var textureNormalTest:vec3<f32> = normalize((textureSample(textureDataNormal, textureSampler, fragUV * i)).rgb);
        var textureNormal:vec3<f32> = normalize(2.0 * (textureSample(textureDataNormal, textureSampler, fragUV * i)).rgb - 1.0);
        var colorNormalTangentSpace:vec3<f32> = normalize(vec3<f32>(textureNormal.x, textureNormal.y, textureNormal.z));
        //colorNormal.y *= -1;

        var tbnMatrix : mat3x3<f32> = mat3x3<f32>(
          normalize(fragTangent), 
          normalize(fragBitangent), 
          normalize(fragNor));
    
          var colorNormal:vec3<f32> = normalize(tbnMatrix * colorNormalTangentSpace);
        

        // --- Shadow -------------------------------------------------------
        var shadow : f32 = 0.0;
        // apply Percentage-closer filtering (PCF)
        // sample nearest 9 texels to smooth result
        let size = f32(textureDimensions(shadowMap).x);
        for (var y : i32 = -1 ; y <= 1 ; y = y + 1) {
            for (var x : i32 = -1 ; x <= 1 ; x = x + 1) {
                let offset = vec2<f32>(f32(x) / size, f32(y) / size);
                shadow = shadow + textureSampleCompare(
                    shadowMap, 
                    shadowSampler,
                    shadowPos.xy + offset, 
                    shadowPos.z - 0.005  // apply a small bias to avoid acne
                );
            }
        }
        shadow = shadow / 9.0;

        // shadow = textureSampleCompare(
        //   shadowMap, 
        //   shadowSampler,
        //   shadowPos.xy, 
        //   shadowPos.z - 0.005  // apply a small bias to avoid acne
        // );
      

        // --- PBR -----------------------------------------------------------
        let N:vec3<f32> = normalize(colorNormal.xyz);
        let L:vec3<f32> = normalize((uniforms.lightPosition).xyz - fragPosition.xyz);
        let V:vec3<f32> = normalize((uniforms.eyePosition).xyz - fragPosition.xyz);
      
        let distance:f32 = length((uniforms.lightPosition).xyz - fragPosition.xyz);
        let attenuation:f32 = 1./(distance*distance);
        let radiance:vec3<f32> = sourceDiffuseColor * 1.0;  //       
        
        let NdotL:f32 = max(dot(N,L),0.);                 
        //let irradiance : f32 = NdotL * 1.0; //NdotL * irradiPerp
        let lightColor : vec3<f32> = sourceDiffuseColor;  
       
        // --- BRDF ----------------------------------------------------------
        let H : vec3<f32> = normalize(L + V);
        let NoV : f32  = clamp(dot(N, V), 0.0, 1.0);
        let NoL : f32  = clamp(dot(N, L), 0.0, 1.0);
        let NoH : f32 = clamp(dot(N, H), 0.0, 1.0);
        let VoH : f32  = clamp(dot(V, H), 0.0, 1.0);

        var F0:vec3<f32> = vec3(0.04);
        F0 = mix(F0, textureBaseColor, texturMetallic);

        // var F0:vec3<f32> = vec3(0.16 * (reflectance * reflectance));
        // F0 = mix(F0, textureBaseColor, texturMetallic);

        // cook-torrance brdf
        let F:vec3<f32> = FresnelSchlick(NoH,F0);  
        let G:f32 = GeometrySmith(N,V,L,texturRoughness.r);
        let NDF:f32 = DistributionGGX(N,H,texturRoughness.r);

        let numerator:vec3<f32> = F*G*NDF;
        let denominator:f32 = 4. * max(dot(N,V),0.001)*max(dot(N,L),0.001);
        let specular:vec3<f32> = numerator / max (denominator,.001);           

        let kS:vec3<f32> = F;
        var kD:vec3<f32> = vec3<f32>(1.) - kS;
        kD *= 1.0 - texturMetallic; 

        let brdf : vec3<f32> = (kD * (textureBaseColor * shadow * texturAO ) / PI + (specular * shadow));
        // irradiance contribution from directional light  
        let Lo : vec3<f32> = brdf * radiance * NdotL;

       
        //---IBL -----------------
        let MAX_REFLECTION_LOD : f32 = 5.0;
        let R : vec3<f32> = reflect(-V,N);
        let kS_IBL : vec3<f32> = fresnelSchlickRoughness(NoV,F0, texturRoughness.r);
        var kD_IBL : vec3<f32> = vec3<f32>(1.0) - kS_IBL;
        kD_IBL *= 1.0 - texturMetallic;
        
               
        let IBLColor : vec3<f32> = (textureSample(IBLTexture, IBLSampler, N)).rgb;  
        let skyBoxColorPrefilteredColor : vec3<f32> = (textureSampleLevel(skyBoxTexture, skyBoxSampler, N, (1.0 - texturRoughness.r) * MAX_REFLECTION_LOD)).rgb;  
        let skyBoxColorPrefilteredColor2 : vec3<f32> = (textureSampleLevel(IBLTexture, IBLSampler, N, 5.0)).rgb;  
       

        let uvLUT : vec2<f32> = vec2<f32>(NoV, texturRoughness.r).rg;
        let brdfLUT : vec2<f32> = (textureSample(brdfLUT, textureSampler, uvLUT)).rg;  
       
        let specular_IBL : vec3<f32> = skyBoxColorPrefilteredColor * (kS_IBL * brdfLUT.x + brdfLUT.y + 0.0);
            
        let diffuse_IBL : vec3<f32> = textureBaseColor * skyBoxColorPrefilteredColor * kD_IBL;
        let Lo_IBL = (specular_IBL + diffuse_IBL) * texturAO;
        
             
        //-------------------------
        let finalColor : vec3<f32> = texturEmissive * 0.0 + Lo * 0.0 + Lo_IBL * 1.0 ; //radiance          
        return vec4<f32>(lin2rgb(finalColor), 0.5);
        // return vec4<f32>(texturRoughness, 1.0);
    }
    `,
  };
