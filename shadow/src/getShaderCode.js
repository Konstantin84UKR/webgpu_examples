export async function getShaderCode(){

  ///**  Шейдеры тут все понятно более мение. */  
  const shaderShadow = {
    vertex: `  
      struct Uniform {
        pMatrix : mat4x4<f32>,
        vMatrix : mat4x4<f32>,
        mMatrix : mat4x4<f32>,      
      };

      @group(0) @binding(0) var<uniform> uniforms : Uniform;

      struct UniformModel {
        mMatrix : mat4x4<f32>,      
      };

      @group(1) @binding(0) var<uniform> uniformsModel : UniformModel;
      
      @vertex
        fn main(@location(0) pos: vec4<f32>, @location(1) uv: vec2<f32>, @location(2) normal: vec3<f32>) -> @builtin(position) vec4<f32> {
          return uniforms.pMatrix * uniforms.vMatrix * uniformsModel.mMatrix * pos;
       }`
  };

  const shader = {
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

       @binding(0) @group(2) var<uniform> uniformsModel : UniformModel;
         
      struct Output {
          @builtin(position) Position : vec4<f32>,
          @location(0) fragPosition : vec3<f32>,
          @location(1) fragUV : vec2<f32>,
          @location(2) fragNormal : vec3<f32>,
          @location(3) shadowPos : vec3<f32>          
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

            let posFromLight: vec4<f32> = uniformsLight.pMatrix * uniformsLight.vMatrix * uniformsModel.mMatrix * pos;
            // Convert shadowPos XY to (0, 1) to fit texture UV
            output.shadowPos = vec3<f32>(posFromLight.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5), posFromLight.z);

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
     
      @group(1) @binding(0) var shadowMap : texture_depth_2d;  
      @group(1) @binding(1) var shadowSampler : sampler_comparison;
           

      @fragment
      fn main(@location(0) fragPosition: vec3<f32>,
       @location(1) fragUV: vec2<f32>, 
       @location(2) fragNormal: vec3<f32>,
       @location(3) shadowPos: vec3<f32>) -> @location(0) vec4<f32> {
        
        let specularColor:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
        let diffuseColor:vec3<f32> = vec3<f32>(2.0, 2.0, 1.0);

        let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, fragUV)).rgb;
        
        var shadow : f32 = 0.0;
        // apply Percentage-closer filtering (PCF)
        // sample nearest 9 texels to smooth result

        // выбираем 3*3 пикселей из текстуры глубины вокруг текуший координат тени.
        // полученый результат делем на 9 что бы получить усредненый цвет.

        let size = f32(textureDimensions(shadowMap).x);
        for (var y : i32 = -1 ; y <= 1 ; y = y + 1) {
            for (var x : i32 = -1 ; x <= 1 ; x = x + 1) {
                let offset = vec2<f32>(f32(x) / size, f32(y) / size);
                shadow = shadow + textureSampleCompare(
                    shadowMap, 
                    shadowSampler,
                    shadowPos.xy + offset, 
                    shadowPos.z - 0.007  // apply a small bias to avoid acne
                );
            }
        }
        shadow = shadow / 9.0;

        // Жесткие тени   
        //   shadow = textureSampleCompare(
        //     shadowMap, 
        //     shadowSampler,
        //     shadowPos.xy, 
        //     shadowPos.z - 0.005  // apply a small bias to avoid acne
        // );

        // let size = f32(textureDimensions(shadowMap).x);
      
        let N:vec3<f32> = normalize(fragNormal.xyz);
        let L:vec3<f32> = normalize((uniforms.lightPosition).xyz - fragPosition.xyz);
        let V:vec3<f32> = normalize((uniforms.eyePosition).xyz - fragPosition.xyz);
        let H:vec3<f32> = normalize(L + V);
      
        let diffuse:f32 = 1.0 * max(dot(N, L), 0.0);
        let specular = pow(max(dot(N, H),0.0),100.0);
        let ambient:vec3<f32> = vec3<f32>(0.1, 0.2, 0.3);

        ///
        let gamma = 2.2f;
             
        // // Алгоритм тональной компрессии Рейнхарда
        // var mapped:vec3<f32> = (diffuseColor * diffuse)  / ((diffuseColor * diffuse) + vec3<f32>(1.0));

        // Экспозиция тональной компрессии
        let exposure = 0.5f;
        var mapped:vec3<f32> =  vec3(1.0) - exp((diffuseColor * diffuse) * -exposure);
     
        // Гамма-коррекция
        mapped = pow(mapped, vec3<f32>(1.0 / gamma));


      
        let finalColor:vec3<f32> =  textureColor * ( shadow * mapped + ambient) + (specularColor * specular * shadow); 
       // let finalColor:vec3<f32> =    ( shadow * (diffuseColor * diffuse) + ambient) + (specularColor * specular * shadow); 
       // let finalColor:vec3<f32> =  textureColor * ( shadow * diffuse + ambient) + (specularColor * specular * shadow);  
             
        return vec4<f32>(finalColor, 1.0);
    }
    `,
  };

  return {shaderShadow,shader}
}