import {
  mat4,vec3
} from './wgpu-matrix.module.js';
import { Camera } from '../../common/camera/camera.js';
import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { RectangleGeometry } from '../../common/primitives/RectangleGeometry.js';
import { BoxGeometry } from '../../common/primitives/BoxGeometry.js';
import { CylinderGeometry } from '../../common/primitives/CylinderGeometry.js';
import { gltfLoader } from '../../common/gltfLoader.js';

import { initCubeMap } from './inutCubeMap.js';
import { createTextureFromImage , createCubeTextureFromImage} from './textureUtils.js';


async function loadJSON(result, modelURL) {
  var xhr = new XMLHttpRequest();
  //var model;

  xhr.open('GET', modelURL, false);
  xhr.onload = function () {
    if (xhr.status != 200) {

      alert('LOAD' + xhr.status + ': ' + xhr.statusText);
    } else {

      result.mesh = JSON.parse(xhr.responseText);
      //return  result;     
    }
  }
  xhr.send();
}

async function loadTexture(device, url) {

  let img = new Image();
  img.src = url;
  await img.decode();

  const imageBitmap = await createImageBitmap(img);


  const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture },
    [imageBitmap.width, imageBitmap.height]);

  return texture;

}

async function LoadJSONUsingPromise(URL) {

  let response = await fetch(URL).then(response=>{
    //console.log(response.json());
    return response.json();
  });
  
  return response;
}

async function main() {
  //---INIT WEBGPU

  const canvas = document.getElementById("canvas-webgpu");
  const scaleCanvas = 1.3;
  canvas.width = 1200 * scaleCanvas * 1.2;
  canvas.height = 800 * scaleCanvas;

  // Получаем данные о физическом утсройстве ГПУ
  const adapter = await navigator.gpu.requestAdapter();
  //** Получаем данные о логическом устройсве ГПУ */
  //** Пока не понятно можно ли переключаться между разными физ устройсвами или создавать несколько логический устройств */
  const device = await adapter.requestDevice();
  //** Контектс канваса тут все ясно  */
  const context = canvas.getContext("webgpu");

  const devicePixelRatio = window.devicePixelRatio || 1;
  const size = [
    canvas.clientWidth * devicePixelRatio,
    canvas.clientHeight * devicePixelRatio,
  ];

  //const format = "bgra8unorm";
  const format = navigator.gpu.getPreferredCanvasFormat(); // формат данных в которых храняться пиксели в физическом устройстве 

  //** конфигурируем контекст подключаем логическое устройсво  */
  //** формат вывода */
  //** размер вывода */
  context.configure({
    device: device,
    format: format,
    size: size,
    compositingAlphaMode: "opaque",

  });


  ///**  Шейдеры тут все понятно более мение. */  
  const shaderShadow = {
    vertex: `  
      struct Uniform {
        pMatrix : mat4x4<f32>,
        vMatrix : mat4x4<f32>,
        mMatrix : mat4x4<f32>,      
      };

      @group(0) @binding(0) var<uniform> uniforms : Uniform;
      
      @vertex
        fn main(@location(0) pos: vec4<f32>,
         @location(1) uv: vec2<f32>, 
         @location(2) normal: vec3<f32> 
         ) -> @builtin(position) vec4<f32> {

          return uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
       }`
  };

  const shaderPBR = {
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
        //let irradiance : f32 = NdotL * 0.0; //NdotL * irradiPerp
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
        let MAX_REFLECTION_LOD : f32 = 4.0;
        let R : vec3<f32> = reflect(-V,N);
        let kS_IBL : vec3<f32> = fresnelSchlickRoughness(NoV,F0, texturRoughness.r);
        var kD_IBL : vec3<f32> = vec3<f32>(1.0) - kS_IBL;
        kD_IBL *= 1.0 - texturMetallic;
        let irradiance_IBL: vec3<f32> = vec3(0.0);
        
        let IBLColor : vec3<f32> = (textureSample(IBLTexture, IBLSampler, N)).rgb;  
        let skyBoxColorPrefilteredColor : vec3<f32> = (textureSampleLevel(skyBoxTexture, skyBoxSampler, N, texturRoughness.r * MAX_REFLECTION_LOD)).rgb;  
       
        let uvLUT : vec2<f32> = vec2<f32>(NoV, texturRoughness.r).rg;
        let brdfLUT : vec2<f32> = (textureSample(brdfLUT, textureSampler, uvLUT)).rg;  
       
        let specular_IBL : vec3<f32> = skyBoxColorPrefilteredColor * (kS_IBL * brdfLUT.x + brdfLUT.y );
        //let specular_IBL : vec3<f32> = IBLColor * (kS_IBL * brdfLUT.x + brdfLUT.y);
        let diffuse_IBL : vec3<f32> = textureBaseColor * IBLColor * kD_IBL;
        let Lo_IBL = (specular_IBL + diffuse_IBL) * texturAO;
       // let Lo_IBL = (specular_IBL + diffuse_IBL);
             
        //-------------------------
        //let finalColor : vec3<f32> = Lo + textureBaseColor * IBLColor * 0.5; //radiance   
        let finalColor : vec3<f32> = texturEmissive * 1.0 + Lo + Lo_IBL * 1.0 ; //radiance       
        return vec4<f32>(lin2rgb(finalColor), 0.5);
        return vec4<f32>(texturRoughness, 1.0);
    }
    `,
  };


  //---------------------------------------------------
 //gltf
 //dog //bunny // monky //Duck
 //let gltf = await LoadJSONUsingPromise('./res/bunny.gltf');
 //let gltf = await LoadJSONUsingPromise('./res/bottle/WaterBottle.gltf');
 //let gltf = await LoadJSONUsingPromise('./res/boombox/boombox.gltf');
 let gltf = await LoadJSONUsingPromise('./res/helmet/helmet.gltf');

 const gltfModel = new gltfLoader(device,gltf);
 console.log(gltfModel.gltf);
 gltfModel.getMesh();

  //const mesh1 = new BoxGeometry(2,2,2,1,1,1);
  const mesh1 = new SphereGeometry(1,64,128);
  //const mesh1 = new RectangleGeometry(4, 4, 2, 2);
  //const mesh1 = new CylinderGeometry(2.0, 2.0, 2, 32, 3, false, 0, Math.PI * 2);


  const meshVertexData = new Float32Array(mesh1.vertices);
  const meshUVData = new Float32Array(mesh1.uvs);
  const meshNormalData = new Float32Array(mesh1.normals);
  const meshTangentData = new Float32Array(mesh1.tangents);
  const meshIndexData = new Uint32Array(mesh1.indices);

  const modelBufferData = gltfModel.meshes[0].data;

  const vertexBufferGLTF = modelBufferData.attribute_POSITION.gpuBufferData;
  const uvBufferGLTF = modelBufferData.attribute_TEXCOORD_0.gpuBufferData;
  const normalBufferGLTF = modelBufferData.attribute_NORMAL.gpuBufferData;
  const tangentBufferGLTF = modelBufferData.attribute_TANGENT.gpuBufferData;
  const indexBufferGLTF = modelBufferData.indices_indices.gpuBufferData;

  //---------------------------------------------------
  //---create uniform data

  let MODELMATRIX = mat4.identity();
  //MODELMATRIX = mat4.translation([0, 0, -2.0]);
  let MODELMATRIX_PLANE = mat4.identity();
  let MODELMATRIX_CUBEMAP = mat4.identity();

  MODELMATRIX_PLANE = mat4.rotationX(Math.PI * 0.5);

  let camera = new Camera(canvas, vec3.create(0.0, 0.0, 3.5));
   
  const lightPosition = [-10, 10, 10.0];//new Float32Array(camera.eye);
  const VIEWMATRIX_SHADOW = mat4.lookAt(lightPosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
  const PROJMATRIX_SHADOW = mat4.ortho(-6, 6, -6, 6, 1, 35);


  //******************
  // CUBEMAP
  //******************
  //const pipelineCubeMap = await initCubeMap(device, context, canvas, format);
   // _CUBEMAP

          ///**  Шейдеры тут все понятно более мение. */  
          const shader_CUBEMAP = {
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
                       
                  var vMatrixWithOutTranslation : mat4x4<f32> = uniforms.vMatrix;
                  vMatrixWithOutTranslation[3] = vec4<f32>(0.0, 0.0, 0.0, 1.0); 
      
      
                  var output: Output;
                  output.Position =  uniforms.pMatrix * vMatrixWithOutTranslation * uniforms.mMatrix * position;;
                  //output.Position = uniforms.pMatrix * vMatrixWithOutTranslation * uniforms.mMatrix * position;
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
                //  return textureSample(myTexture, mySampler, cubemapVec);
                return textureSampleLevel(myTexture, mySampler, cubemapVec, 0);
                // let skyBoxColorPrefilteredColor : vec3<f32> = (textureSampleLevel(skyBoxTexture, skyBoxSampler, N , 3)).rgb;  
                
          }
          `,
          };
      
          //----------------------------------------------------
        const cubeVertexSize = 4 * 10;
        const cubePositionOffset = 0;
        const cubeColorOffset = 4 * 4;
        const cubeUVOffset = 4 * 8;
        const cubeVertexCount = 36;    
      
        const cubeVertexArray_CUBEMAP = new Float32Array([
          1, -1, 1, 1,     1, 0, 1, 1,     1, 1,
          -1, -1, 1, 1,    0, 0, 1, 1,     0, 1,
          -1, -1, -1, 1,   0, 0, 0, 1,     0, 0,
          1, -1, -1, 1,    1, 0, 0, 1,     1, 0,
          1, -1, 1, 1,     1, 0, 1, 1,     1, 1,
          -1, -1, -1, 1,   0, 0, 0, 1,     0, 0,
      
          1, 1, 1, 1,      1, 1, 1, 1,     1, 1,
          1, -1, 1, 1,     1, 0, 1, 1,     0, 1,
          1, -1, -1, 1,    1, 0, 0, 1,     0, 0,
          1, 1, -1, 1,     1, 1, 0, 1,     1, 0,
          1, 1, 1, 1,      1, 1, 1, 1,     1, 1,
          1, -1, -1, 1,    1, 0, 0, 1,     0, 0,
      
          -1, 1, 1, 1,     0, 1, 1, 1,     1, 1,
          1, 1, 1, 1,      1, 1, 1, 1,     0, 1,
          1, 1, -1, 1,     1, 1, 0, 1,     0, 0,
          -1, 1, -1, 1,    0, 1, 0, 1,     1, 0,
          -1, 1, 1, 1,     0, 1, 1, 1,     1, 1,
          1, 1, -1, 1,     1, 1, 0, 1,     0, 0,
      
          -1, -1, 1, 1,    0, 0, 1, 1,     1, 1,
          -1, 1, 1, 1,     0, 1, 1, 1,     0, 1,
          -1, 1, -1, 1,    0, 1, 0, 1,     0, 0,
          -1, -1, -1, 1,   0, 0, 0, 1,     1, 0,
          -1, -1, 1, 1,    0, 0, 1, 1,     1, 1,
          -1, 1, -1, 1,    0, 1, 0, 1,     0, 0,
      
          1, 1, 1, 1,      1, 1, 1, 1,    1, 1,
          -1, 1, 1, 1,     0, 1, 1, 1,    0, 1,
          -1, -1, 1, 1,    0, 0, 1, 1,    0, 0,
          -1, -1, 1, 1,    0, 0, 1, 1,    0, 0,
          1, -1, 1, 1,     1, 0, 1, 1,    1, 0,
          1, 1, 1, 1,      1, 1, 1, 1,    1, 1,
      
          1, -1, -1, 1,    1, 0, 0, 1,    1, 1,
          -1, -1, -1, 1,   0, 0, 0, 1,    0, 1,
          -1, 1, -1, 1,    0, 1, 0, 1,    0, 0,
          1, 1, -1, 1,     1, 1, 0, 1,    1, 0,
          1, -1, -1, 1,    1, 0, 0, 1,    1, 1,
          -1, 1, -1, 1,    0, 1, 0, 1,    0, 0,
        ]);
        console.log('Vertices:', cubeVertexArray_CUBEMAP.length);

        const vertexBuffer_CUBEMAP = device.createBuffer({
            size: cubeVertexArray_CUBEMAP.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
            mappedAtCreation: true
          });
          //загружаем данные в буффер */
          new Float32Array(vertexBuffer_CUBEMAP.getMappedRange()).set(cubeVertexArray_CUBEMAP);
          // передаем буфер в управление ГПУ */
          vertexBuffer_CUBEMAP.unmap();

           //*********************************************//
    //** настраиваем конвейер рендера 
    //** настраиваем шейдеры указав исходник,точку входа, данные буферов
    //** arrayStride количество байт на одну вершину */
    //** attributes настриваем локацию формат и отступ от начала  arrayStride */
    //** primitive указываем тип примитива для отрисовки*/
    //** depthStencil настраиваем буффер глубины*/
    const pipeline_CUBEMAP = device.createRenderPipeline({
        layout: "auto",
        vertex: {
          module: device.createShaderModule({
            code: shader_CUBEMAP.vertex,
          }),
          entryPoint: "main",
          buffers: [
            {
              arrayStride: cubeVertexSize,
              attributes: [{
                shaderLocation: 0,
                format: "float32x4",
                offset: cubePositionOffset
              },
              {
                shaderLocation: 1,
                format: 'float32x2',
                offset: cubeUVOffset,
              }
              ]
            }
          ]
        },
        fragment: {
          module: device.createShaderModule({
            code: shader_CUBEMAP.fragment,
          }),
          entryPoint: "main",
          targets: [
            {
              format: format,
            },
          ],
        },
        primitive: {
          topology: "triangle-list",
          //topology: "line-list",
          cullMode: 'none',
        },
        depthStencil:{
          format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
          depthWriteEnabled: true, //вкл\выкл теста глубины 
          depthCompare: "less-equal" //    
          // "never",
          // "less",
          // "equal",
          // "less-equal",
          // "greater",
          // "not-equal",
          // "greater-equal",
          // "always", //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
      }
      });
  
      // create uniform buffer and layout
      const uniformBuffer_CUBEMAP = device.createBuffer({
          size: 256,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });   
  
      const sampler_CUBEMAP = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
      });
  
        //TEXTURE 
        //Создаем картинку и загрудаем в нее данные из файла
        
        const imgSrcs = [
          './res/tex/forestBlur/nx.png',
          './res/tex/forestBlur/px.png',
          './res/tex/forestBlur/py.png',
          './res/tex/forestBlur/ny.png',
          './res/tex/forestBlur/pz.png',
          './res/tex/forestBlur/nz.png'
        ];

        const imgSrcsSkyBox = [
          './res/tex/forestBlur/MipMaps0/nx.png',
          './res/tex/forestBlur/MipMaps0/px.png',
          './res/tex/forestBlur/MipMaps0/py.png',
          './res/tex/forestBlur/MipMaps0/ny.png',
          './res/tex/forestBlur/MipMaps0/pz.png',
          './res/tex/forestBlur/MipMaps0/nz.png'
        ];

        const imgSrcsSkyBox1 = [
          './res/tex/forestBlur/MipMaps1/nx.png',
          './res/tex/forestBlur/MipMaps1/px.png',
          './res/tex/forestBlur/MipMaps1/py.png',
          './res/tex/forestBlur/MipMaps1/ny.png',
          './res/tex/forestBlur/MipMaps1/pz.png',
          './res/tex/forestBlur/MipMaps1/nz.png'
        ];

        const imgSrcsSkyBox2 = [
          './res/tex/forestBlur/MipMaps2/nx.png',
          './res/tex/forestBlur/MipMaps2/px.png',
          './res/tex/forestBlur/MipMaps2/py.png',
          './res/tex/forestBlur/MipMaps2/ny.png',
          './res/tex/forestBlur/MipMaps2/pz.png',
          './res/tex/forestBlur/MipMaps2/nz.png'
        ];

        const imgSrcsSkyBox3 = [
          './res/tex/forestBlur/MipMaps3/nx.png',
          './res/tex/forestBlur/MipMaps3/px.png',
          './res/tex/forestBlur/MipMaps3/py.png',
          './res/tex/forestBlur/MipMaps3/ny.png',
          './res/tex/forestBlur/MipMaps3/pz.png',
          './res/tex/forestBlur/MipMaps3/nz.png'
        ];

        const imgSrcsSkyBox4 = [
          './res/tex/forestBlur/MipMaps4/nx.png',
          './res/tex/forestBlur/MipMaps4/px.png',
          './res/tex/forestBlur/MipMaps4/py.png',
          './res/tex/forestBlur/MipMaps4/ny.png',
          './res/tex/forestBlur/MipMaps4/pz.png',
          './res/tex/forestBlur/MipMaps4/nz.png'
        ];

        const imgSrcsSkyBox5 = [
          './res/tex/forestBlur/MipMaps5/nx.png',
          './res/tex/forestBlur/MipMaps5/px.png',
          './res/tex/forestBlur/MipMaps5/py.png',
          './res/tex/forestBlur/MipMaps5/ny.png',
          './res/tex/forestBlur/MipMaps5/pz.png',
          './res/tex/forestBlur/MipMaps5/nz.png'
        ];
       
        const promises = imgSrcs.map(async (src) => {
          let img = new Image();
          img.src = src; //'./tex/yachik.jpg';
          await img.decode();
          return await createImageBitmap(img);
        });   
        
        const promisesSkyBox = imgSrcsSkyBox.map(async (src) => {
          let img = new Image();
          img.src = src; //'./tex/yachik.jpg';
          await img.decode();
          return await createImageBitmap(img);
        });  

        const promisesSkyBox1 = imgSrcsSkyBox1.map(async (src) => {
          let img = new Image();
          img.src = src; //'./tex/yachik.jpg';
          await img.decode();
          return await createImageBitmap(img);
        });  

        const promisesSkyBox2 = imgSrcsSkyBox2.map(async (src) => {
          let img = new Image();
          img.src = src; //'./tex/yachik.jpg';
          await img.decode();
          return await createImageBitmap(img);
        });  

        const promisesSkyBox3 = imgSrcsSkyBox3.map(async (src) => {
          let img = new Image();
          img.src = src; //'./tex/yachik.jpg';
          await img.decode();
          return await createImageBitmap(img);
        }); 
        
        const promisesSkyBox4 = imgSrcsSkyBox4.map(async (src) => {
          let img = new Image();
          img.src = src; //'./tex/yachik.jpg';
          await img.decode();
          return await createImageBitmap(img);
        }); 

        const promisesSkyBox5 = imgSrcsSkyBox5.map(async (src) => {
          let img = new Image();
          img.src = src; //'./tex/yachik.jpg';
          await img.decode();
          return await createImageBitmap(img);
        }); 
  
        const imageBitmaps = await Promise.all(promises);
        const imageBitmapsSkyBox = await Promise.all(promisesSkyBox);
        const imageBitmapsSkyBox1 = await Promise.all(promisesSkyBox1); 
        const imageBitmapsSkyBox2 = await Promise.all(promisesSkyBox2); 
        const imageBitmapsSkyBox3 = await Promise.all(promisesSkyBox3); 
        const imageBitmapsSkyBox4 = await Promise.all(promisesSkyBox4); 
        const imageBitmapsSkyBox5 = await Promise.all(promisesSkyBox5);  
      
        // Создаем саму текстуру
        //const texture_CUBEMAP = await createCubeTextureFromImage(device, imgSrcsSkyBox ,{ mips: true, flipY: false });
        const texture_CUBEMAP = device.createTexture({
          size: [imageBitmaps[0].width, imageBitmaps[0].height, 6], //??
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
          dimension: '2d',
        });
          
        //imageBitmapsSkyBox
        //передаем данные о текстуре и данных текстуры в очередь
 
        
          for (let i = 0; i < imageBitmapsSkyBox.length; i++) {
            const imageBitmap = imageBitmaps[i];
            device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: texture_CUBEMAP, origin: [0, 0, i] , mipLevel:0},
            [imageBitmap.width, imageBitmap.height]);
          }
      

      //////////////////////////////////////////////////////////////////
           
      
      const uniformBindGroup_CUBEMAP = device.createBindGroup({
        layout: pipeline_CUBEMAP.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: {
            buffer: uniformBuffer_CUBEMAP,
            offset: 0,
            size: 256 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
          }
          },
          {
            binding: 1,
            resource: sampler_CUBEMAP
          },
          {
            binding: 2,
            resource: texture_CUBEMAP.createView({
              dimension: 'cube',
            }),
          },
        ],
      });
  

   //******************
  // CUBEMAP END 
  //******************


  //****************** BUFFER ********************//
  //** на логическом устойстве  выделяем кусок памяти равный  массиву данных vertexData */
  //** который будет в будушем загружен в данный буффер */
  //** указываем размер  буффера в байтах */
  //** usage ХЗ */
  //** mappedAtCreation если true значить буфер доступен для записи с ЦПУ */
  //** это нужно для того что бы не было гонки между ЦПУ и ГПУ */

  //******************
  // MODEL
  //******************
  //****************** BUFFER  vertexBuffer
  // create uniform buffer and layout
  // const uniformBuffer_CUBEMAP_PBR = device.createBuffer({
  //   size: 256,
  //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  // }); 


  //******************
  // PLANE
  //******************
  const plane_vertexBuffer = device.createBuffer({
    size: meshVertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });

  //загружаем данные в буффер */
  new Float32Array(plane_vertexBuffer.getMappedRange()).set(meshVertexData);
  // передаем буфер в управление ГПУ */
  plane_vertexBuffer.unmap();

  //****************** BUFFER  uvBuffer
  const plane_uvBuffer = device.createBuffer({
    size: meshUVData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });
  //загружаем данные в буффер */
  new Float32Array(plane_uvBuffer.getMappedRange()).set(meshUVData);
  // передаем буфер в управление ГПУ */
  plane_uvBuffer.unmap();

  //****************** BUFFER  normalBuffer
  const plane_normalBuffer = device.createBuffer({
    size: meshNormalData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });
  //загружаем данные в буффер */
  new Float32Array(plane_normalBuffer.getMappedRange()).set(meshNormalData);
  // передаем буфер в управление ГПУ */
  plane_normalBuffer.unmap();

  const planeTangentBuffer = device.createBuffer({
    size: meshTangentData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });
  //загружаем данные в буффер */
  new Float32Array(planeTangentBuffer.getMappedRange()).set(meshTangentData);
  // передаем буфер в управление ГПУ */
  planeTangentBuffer.unmap();

  const planeBitangentBuffer = device.createBuffer({
    size: meshTangentData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
    mappedAtCreation: true
  });
  //загружаем данные в буффер */
  new Float32Array(planeBitangentBuffer.getMappedRange()).set(meshTangentData);
  // передаем буфер в управление ГПУ */
  planeBitangentBuffer.unmap();

  //****************** BUFFER  indexBuffer
  const plane_indexBuffer = device.createBuffer({
    size: meshIndexData.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true
  });

  new Uint32Array(plane_indexBuffer.getMappedRange()).set(meshIndexData);
  plane_indexBuffer.unmap();


  //*********************************************//
  //** настраиваем конвейер рендера 
  //** настраиваем шейдеры указав исходник,точку входа, данные буферов
  //** arrayStride количество байт на одну вершину */
  //** attributes настриваем локацию формат и отступ от начала  arrayStride */
  //** primitive указываем тип примитива для отрисовки*/
  //** depthStencil настраиваем буффер глубины*/

  const shadowPipeline = await device.createRenderPipeline({
    label: "shadow piplen",
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code: shaderShadow.vertex,
      }),
      entryPoint: "main",
      buffers: [
        {
          arrayStride: 12,
          attributes: [{
            shaderLocation: 0,
            format: "float32x3",
            offset: 0
          }]
        },
        {
          arrayStride: 8,
          attributes: [{
            shaderLocation: 1,
            format: "float32x2",
            offset: 0
          }]
        },
        {
          arrayStride: 12,
          attributes: [{
            shaderLocation: 2,
            format: "float32x3",
            offset: 0
          }]
        }
      ]
    },
    primitive: {
      topology: "triangle-list",
      //topology: "point-list",
    },
    depthStencil: {
      format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
      depthWriteEnabled: true, //вкл\выкл теста глубины 
      depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
    }
  });

  let shadowDepthTexture = device.createTexture({
    //size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
    size: [2048, 2048, 1],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
  });

  let shadowDepthView = shadowDepthTexture.createView();

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: shaderPBR.vertex,
      }),
      entryPoint: "main",
      buffers: [
        {
          arrayStride: 12,
          attributes: [{
            shaderLocation: 0,
            format: "float32x3",
            offset: 0
          }]
        },
        {
          arrayStride: 8,
          attributes: [{
            shaderLocation: 1,
            format: "float32x2",
            offset: 0
          }]
        },
        {
          arrayStride: 12,
          attributes: [{
            shaderLocation: 2,
            format: "float32x3",
            offset: 0
          }]
        },

        {
          arrayStride: 12,
          attributes: [{
            shaderLocation: 3,
            format: "float32x3",
            offset: 0
          }]
        }         
      ]
    },
    fragment: {
      module: device.createShaderModule({
        code: shaderPBR.fragment,
      }),
      entryPoint: "main",
      targets: [
        {
          format: format,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
      //topology: "point-list",
      cullMode: 'back',  //'back'  'front'  
      frontFace: 'ccw' //'ccw' 'cw'
    },
    depthStencil: {
      format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
      depthWriteEnabled: true, //вкл\выкл теста глубины 
      depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
    }
  });

  const depthTexture = device.createTexture({
    size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT
  });

  // create uniform buffer and layout
  const uniformBuffer = device.createBuffer({
    size: 64 + 64 + 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  const fragmentUniformBuffer = device.createBuffer({
    size: 16 + 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // const fragmentUniformBuffer1 = device.createBuffer({
  //   size: 16,
  //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  // });

  const uniformBuffershadow = device.createBuffer({
    size: 64 + 64 + 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  //-------------------- TEXTURE ---------------------
  // let img = new Image();
  // img.src = './res/tex2_DIFFUSE.jpg'; //'./tex/yachik.jpg';
  // await img.decode();

  // const imageBitmap = await createImageBitmap(img);

  const sampler = device.createSampler({
    minFilter: 'linear',
    magFilter: 'linear',
    mipmapFilter: "linear", //nearest
    addressModeU: 'repeat',
    addressModeV: 'repeat'
  });
  

  // Создаем саму текстуру и MipMap на GPU
  // 1) Создаем текстуру из файла картинки 
  // 2) загружаем картинку с диска и создаем из нее Bitmap 
  // 3) Создаем текстуру из источника
  // 4) вычисляем необходимое количество мип урочней
  // 5) копируем данные из источника в текстуру (отправляем на GPU)
  // 6) Генерируем мип уровни

  // const texture =  await createTextureFromImage(device,'./res/pbr2/rough-wet-cobble-albedo.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/pbr2/rough-wet-cobble-normal-ogl.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/pbr2/rough-wet-cobble-roughness.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/pbr2/rough-wet-cobble-metallic.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/pbr2/rough-wet-cobble-ao.png', {mips: true, flipY: false});

  // const texture =  await createTextureFromImage(device,'./res/pbr3/copper-rock1-alb.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/pbr3/copper-rock1-normal.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/pbr3/copper-rock1-rough.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/pbr3/copper-rock1-metal.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/pbr3/copper-rock1-ao.png', {mips: true, flipY: false});

  // const texture = await createTextureFromImage(device, './res/rusted-steel-bl/rusted-steel_albedo.png', { mips: true, flipY: false });
  // const texture_NORMAL = await createTextureFromImage(device, './res/rusted-steel-bl/rusted-steel_normal-ogl.png', { mips: true, flipY: false });
  // const texture_ROUGHNESS = await createTextureFromImage(device, './res/rusted-steel-bl/rusted-steel_roughness.png', { mips: true, flipY: false });
  // const texture_METALLIC = await createTextureFromImage(device, './res/rusted-steel-bl/rusted-steel_metallic.png', { mips: true, flipY: false });
  // const texture_AO = await createTextureFromImage(device, './res/rusted-steel-bl/rusted-steel_ao.png', { mips: true, flipY: false });

  // const texture =  await createTextureFromImage(device,'./res/bamboo-wood-semigloss-bl/bamboo-wood-semigloss-albedo.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/bamboo-wood-semigloss-bl/bamboo-wood-semigloss-normal.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/bamboo-wood-semigloss-bl/bamboo-wood-semigloss-roughness.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/bamboo-wood-semigloss-bl/bamboo-wood-semigloss-metal.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/bamboo-wood-semigloss-bl/bamboo-wood-semigloss-ao.png', {mips: true, flipY: false});

  // const texture =  await createTextureFromImage(device,'./res/worn-factory-siding-bl/worn-factory-siding_albedo.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/worn-factory-siding-bl/worn-factory-siding_normal-ogl.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/worn-factory-siding-bl/worn-factory-siding_roughness.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/worn-factory-siding-bl/worn-factory-siding_metallic.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/worn-factory-siding-bl/worn-factory-siding_ao.png', {mips: true, flipY: false});

  // const texture =  await createTextureFromImage(device,'./res/plastic/albedo.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/plastic/normal.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/plastic/roughness.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/plastic/metallic.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/plastic/ao.png', {mips: true, flipY: false});

  // const texture =  await createTextureFromImage(device,'./res/pbr_gold/basecolor_boosted.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/pbr_gold/normal.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/pbr_gold/roughness.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/pbr_gold/metallic.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/pbr_gold/metallic.png', {mips: true, flipY: false});
  
  // const texture =  await createTextureFromImage(device,'./res/pbr_metal1/scuffed-metal1_albedo.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/pbr_metal1/scuffed-metal1_normal-ogl.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/pbr_metal1/scuffed-metal1_roughness.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/pbr_metal1/scuffed-metal1_metallic.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/pbr_metal1/scuffed-metal1_ao.png', {mips: true, flipY: false});
  // const texture_HEIGHT =  await createTextureFromImage(device,'./res/pbr_metal1/scuffed-metal1_height.png', {mips: true, flipY: false});


  // const texture =  await createTextureFromImage(device,'./res/paint_metal/chipped-paint-metal-albedo.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/paint_metal/chipped-paint-metal-normal-ogl.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/paint_metal/chipped-paint-metal-rough2.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/paint_metal/chipped-paint-metal-metal.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/paint_metal/chipped-paint-ao.png', {mips: true, flipY: false});

  // const texture =  await createTextureFromImage(device,'./res/bathroom/bathroomtile2-basecolor.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/bathroom/bathroomtile2-normal-ogl.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/bathroom/bathroomtile2-roughness.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/bathroom/bathroomtile2-metalness.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/bathroom/bathroomtile2-ao.png', {mips: true, flipY: false});
  
  // const texture =  await createTextureFromImage(device,'./res/saloon_floor/saloon-wood-floor_albedo.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/saloon_floor/saloon-wood-floor_normal-ogl.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/saloon_floor/saloon-wood-floor_roughness.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/saloon_floor/saloon-wood-floor_metallic.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/saloon_floor/saloon-wood-floor_ao.png', {mips: true, flipY: false});
  
  // const texture =  await createTextureFromImage(device,'./res/stringy-marble-bl/stringy_marble_albedo.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/stringy-marble-bl/stringy_marble_Normal-ogl.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/stringy-marble-bl/stringy_marble_Roughness.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/stringy-marble-bl/stringy_marble_Metallic.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/stringy-marble-bl/stringy_marble_ao.png', {mips: true, flipY: false});

  // const texture =  await createTextureFromImage(device,'./res/shades-tile-bl/shades-tile_albedo.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/shades-tile-bl/shades-tile_normal-ogl.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/shades-tile-bl/shades-tile_roughness.png', {mips: true, flipY: false});
  //  const texture_METALLIC =  await createTextureFromImage(device,'./res/shades-tile-bl/shades-tile_metallic.png', {mips: true, flipY: false});
  //  const texture_AO =  await createTextureFromImage(device,'./res/shades-tile-bl/shades-tile_ao.png', {mips: true, flipY: false});

  // const texture =  await createTextureFromImage(device,'./res/bottle/WaterBottle_baseColor.png', {mips: true, flipY: false});
  // const texture_NORMAL =  await createTextureFromImage(device,'./res/bottle/WaterBottle_normal.png', {mips: true, flipY: false});
  // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/bottle/WaterBottle_occlusionRoughnessMetallic.png', {mips: true, flipY: false});
  // const texture_METALLIC =  await createTextureFromImage(device,'./res/bottle/WaterBottle_occlusionRoughnessMetallic.png', {mips: true, flipY: false});
  // const texture_AO =  await createTextureFromImage(device,'./res/bottle/WaterBottle_occlusionRoughnessMetallic.png', {mips: true, flipY: false});
  // const texture_EMISSIVE =  await createTextureFromImage(device,'./res/bottle/WaterBottle_emissive.png', {mips: true, flipY: false});

//   const texture =  await createTextureFromImage(device,'./res/boombox/BoomBox_baseColor.png', {mips: true, flipY: false});
//  // const texture =  await createTextureFromImage(device,'./res/uv.jpg', {mips: true, flipY: false});
//   const texture_NORMAL =  await createTextureFromImage(device,'./res/boombox/BoomBox_normal.png', {mips: true, flipY: false});
//   const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/boombox/BoomBox_occlusionRoughnessMetallic.png', {mips: true, flipY: false});
//   const texture_METALLIC =  await createTextureFromImage(device,'./res/boombox/BoomBox_occlusionRoughnessMetallic.png', {mips: true, flipY: false});
//   const texture_AO =  await createTextureFromImage(device,'./res/boombox/BoomBox_occlusionRoughnessMetallic.png', {mips: true, flipY: false});
//   const texture_EMISSIVE =  await createTextureFromImage(device,'./res/boombox/BoomBox_emissive.png', {mips: true, flipY: false});


  const texture =  await createTextureFromImage(device,'./res/helmet/Default_albedo.jpg', {mips: true, flipY: false});
  const texture_NORMAL =  await createTextureFromImage(device,'./res/helmet/Default_normal.jpg', {mips: true, flipY: false});
  const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/helmet/Default_metalRoughness.jpg', {mips: true, flipY: false});
  const texture_METALLIC =  await createTextureFromImage(device,'./res/helmet/Default_metalRoughness.jpg', {mips: true, flipY: false});
  const texture_AO =  await createTextureFromImage(device,'./res/helmet/Default_AO.jpg', {mips: true, flipY: false});
  const texture_EMISSIVE =  await createTextureFromImage(device,'./res/helmet/Default_emissive.jpg', {mips: true, flipY: false});

  //--------------------------------------------------
  const shadowGroup = device.createBindGroup({
    label: 'Group for shadowPass',
    layout: shadowPipeline.getBindGroupLayout(0),
    entries: [{
      binding: 0,
      resource: {
        buffer: uniformBuffershadow,
        offset: 0,
        size: 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
      }
    }]
  })


  const uniformBindGroup = device.createBindGroup({
    label: 'Group for uniformBindGroup',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 0,
          size: 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
        }
      },
      {
        binding: 1,
        resource: sampler
      },
      {
        binding: 2,
        resource: texture.createView()
      },
      {
        binding: 3,
        resource: {
          buffer: fragmentUniformBuffer,
          offset: 0,
          size: 16 + 16 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
        }
      },
      {
        binding: 4,
        resource: {
          buffer: uniformBuffershadow,
          offset: 0,
          size: 64 + 64 + 64  // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
        }
      },
      {
        binding: 5,
        resource: texture_NORMAL.createView()
      },
      {
        binding: 6,
        resource: texture_ROUGHNESS.createView()
      },
      {
        binding: 7,
        resource: texture_METALLIC.createView()
      },
      {
        binding: 8,
        resource: texture_AO.createView()
      },
      {
        binding: 9,
        resource: texture_EMISSIVE.createView()
      }
    ]
  });

  const uniformBindGroup1 = device.createBindGroup({
    label: 'uniform Bind Group1 ',
    layout: pipeline.getBindGroupLayout(1),
    entries: [
      {
        binding: 0,
        resource: shadowDepthView
      },
      {
        binding: 1,
        resource: device.createSampler({
          compare: 'less',
        })
      }            
    ]
  });

  const sampler_CUBEMAP_PBR = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

   // Создаем саму текстуру
   
   //const texture_CUBEMAP_PBR = await createCubeTextureFromImage(device,imgSrcs,{ mips: true, flipY: false });
   const texture_CUBEMAP_PBR = device.createTexture({
    size: [imageBitmapsSkyBox[0].width, imageBitmapsSkyBox[0].height, 6], //??
    format: 'rgba8unorm',
    mipLevelCount: 6,
    usage: GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
    dimension: '2d',
  });

  //передаем данные о текстуре и данных текстуры в очередь
  for (let i = 0; i < imageBitmapsSkyBox.length; i++) {
    const imageBitmap = imageBitmapsSkyBox[i];
    device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture_CUBEMAP_PBR, origin: [0, 0, i], mipLevel: 0},
    [imageBitmap.width, imageBitmap.height]);
  }

  for (let i = 0; i < imageBitmapsSkyBox1.length; i++) {
    const imageBitmap = imageBitmapsSkyBox1[i];
    device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture_CUBEMAP_PBR, origin: [0, 0, i] , mipLevel: 1},
    [imageBitmap.width, imageBitmap.height]);
  }

  for (let i = 0; i < imageBitmapsSkyBox2.length; i++) {
    const imageBitmap = imageBitmapsSkyBox2[i];
    device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture_CUBEMAP_PBR, origin: [0, 0, i] , mipLevel: 2},
    [imageBitmap.width, imageBitmap.height]);
  }

  for (let i = 0; i < imageBitmapsSkyBox3.length; i++) {
    const imageBitmap = imageBitmapsSkyBox3[i];
    device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture_CUBEMAP_PBR, origin: [0, 0, i] , mipLevel: 3},
    [imageBitmap.width, imageBitmap.height]);
  }

  for (let i = 0; i < imageBitmapsSkyBox4.length; i++) {
    const imageBitmap = imageBitmapsSkyBox4[i];
    device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture_CUBEMAP_PBR, origin: [0, 0, i] , mipLevel: 4},
    [imageBitmap.width, imageBitmap.height]);
  }

  for (let i = 0; i < imageBitmapsSkyBox5.length; i++) {
    const imageBitmap = imageBitmapsSkyBox5[i];
    device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture_CUBEMAP_PBR, origin: [0, 0, i] , mipLevel: 5},
    [imageBitmap.width, imageBitmap.height]);
  }

   
  // Создаем саму текстуру // imageBitmaps
     const texture_IBL_PBR = device.createTexture({
      size: [imageBitmaps[0].width, imageBitmaps[0].height, 6], //??
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
      dimension: '2d',
    });
  
  //передаем данные о текстуре и данных текстуры в очередь
  for (let i = 0; i < imageBitmaps.length; i++) {
    const imageBitmap = imageBitmaps[i];
    device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture_IBL_PBR, origin: [0, 0, i] },
    [imageBitmap.width, imageBitmap.height]);
  }



  const uniformBindGroup_IBL_PBR = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(2),
    entries: [
      {
        binding: 0,
        resource: sampler_CUBEMAP_PBR
      },
      {
        binding: 1,
        resource: texture_IBL_PBR.createView({
          dimension: 'cube',
        }),
      },
    ],
  });

  const texture_LUT = await createTextureFromImage(device, './res/LUT.png', { mips: false, flipY: false });


  const uniformBindGroup_CUBEMAP_PBR = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(3),
    entries: [
      {
        binding: 0,
        resource: sampler_CUBEMAP_PBR
      },
      {
        binding: 1,
        resource: texture_CUBEMAP_PBR.createView({
          dimension: 'cube',
        }),
      },      
      {
        binding: 2,
        resource: texture_LUT.createView({
          dimension: '2d',
        }),
      },
    ],
  });


  device.queue.writeBuffer(uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset
  //device.queue.writeBuffer(uniformBuffer, 64+64+64, NORMALMATRIX); // и так дале прибавляем 64 к offset

  device.queue.writeBuffer(fragmentUniformBuffer, 0, new Float32Array(camera.eye));
  device.queue.writeBuffer(fragmentUniformBuffer, 16, new Float32Array(lightPosition.flat(),1.0));

  device.queue.writeBuffer(uniformBuffershadow, 0, PROJMATRIX_SHADOW); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uniformBuffershadow, 64, VIEWMATRIX_SHADOW); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uniformBuffershadow, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset

  MODELMATRIX_CUBEMAP = mat4.scale( MODELMATRIX_CUBEMAP, [10.0, 10.0, 10.0]); 

  device.queue.writeBuffer(uniformBuffer_CUBEMAP, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
  device.queue.writeBuffer(uniformBuffer_CUBEMAP, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
  device.queue.writeBuffer(uniformBuffer_CUBEMAP, 64 + 64, MODELMATRIX_CUBEMAP); // и так дале прибавляем 64 к offset



  const renderPassDescription = {
    colorAttachments: [
      {
        view: undefined,
        clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        loadOp: 'clear',
        storeOp: "store", //ХЗ
      },],
    depthStencilAttachment: {
      view: depthTexture.createView(),
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
      // stencilLoadValue: 0,
      // stencilStoreOp: "store"
    }
  };

  const renderPassDescriptionShadow = {
    colorAttachments: [],
    depthStencilAttachment: {
      view: shadowDepthView,
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    }
  };

    


  // Animation   
  let time_old = 0;
  async function animate(time) {

    //-----------------TIME-----------------------------
    //console.log(time);
    let dt = time - time_old;
    time_old = time;
    //--------------------------------------------------

    //------------------MATRIX EDIT---------------------
     MODELMATRIX = mat4.rotateY(MODELMATRIX, dt * 0.0001);
    //MODELMATRIX = mat4.rotateX( MODELMATRIX, dt * 0.0002);
    //MODELMATRIX = mat4.rotateZ( MODELMATRIX, dt * 0.0001);
    camera.setDeltaTime(dt);
    //--------------------------------------------------

    device.queue.writeBuffer(uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset
    device.queue.writeBuffer(uniformBuffershadow, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset

    const eyes = [camera.eye[0], camera.eye[1], camera.eye[2], 1];
    device.queue.writeBuffer(fragmentUniformBuffer, 0, new Float32Array(eyes));
    device.queue.writeBuffer(fragmentUniformBuffer, 16, new Float32Array(lightPosition.flat(),1.0));

   // MODELMATRIX_CUBEMAP = mat4.scale( MODELMATRIX, [10.0, 10.0, 10.0]); 
    device.queue.writeBuffer(uniformBuffer_CUBEMAP, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffer_CUBEMAP, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffer_CUBEMAP, 64 + 64, MODELMATRIX_CUBEMAP); // и так дале прибавляем 64 к offset
  

    const commandEncoder = device.createCommandEncoder();
    // SHADOW

    const renderPassShadow = commandEncoder.beginRenderPass(renderPassDescriptionShadow);
    renderPassShadow.setPipeline(shadowPipeline);

  

    renderPassShadow.setVertexBuffer(0, vertexBufferGLTF);
    renderPassShadow.setVertexBuffer(1, uvBufferGLTF);
    renderPassShadow.setVertexBuffer(2, normalBufferGLTF);
    renderPassShadow.setVertexBuffer(3, tangentBufferGLTF);
    renderPassShadow.setIndexBuffer(indexBufferGLTF, "uint16");
    renderPassShadow.setBindGroup(0, shadowGroup);
    renderPassShadow.drawIndexed(modelBufferData.indices_indices.indexCount);

    renderPassShadow.end();

    // MAIN 
    const textureView = context.getCurrentTexture().createView();
    renderPassDescription.colorAttachments[0].view = textureView;
    const renderPass = commandEncoder.beginRenderPass(renderPassDescription);

    renderPass.setPipeline(pipeline);

    
    // renderPass.setVertexBuffer(0, plane_vertexBuffer);
    // renderPass.setVertexBuffer(1, plane_uvBuffer);
    // renderPass.setVertexBuffer(2, plane_normalBuffer);
    // renderPass.setVertexBuffer(3, planeTangentBuffer);
    // renderPass.setIndexBuffer(plane_indexBuffer, "uint32");
    // renderPass.setBindGroup(0, uniformBindGroup);
    // renderPass.setBindGroup(1, uniformBindGroup1);
    // renderPass.setBindGroup(2, uniformBindGroup_IBL_PBR);
    // renderPass.setBindGroup(3, uniformBindGroup_CUBEMAP_PBR);
    // renderPass.drawIndexed(meshIndexData.length);

    renderPass.setVertexBuffer(0, vertexBufferGLTF);
    renderPass.setVertexBuffer(1, uvBufferGLTF);
    renderPass.setVertexBuffer(2, normalBufferGLTF);
    renderPass.setVertexBuffer(3, tangentBufferGLTF);
    renderPass.setIndexBuffer(indexBufferGLTF, "uint16");
    renderPass.setBindGroup(0, uniformBindGroup);
    renderPass.setBindGroup(1, uniformBindGroup1);
    renderPass.setBindGroup(2, uniformBindGroup_IBL_PBR);
    renderPass.setBindGroup(3, uniformBindGroup_CUBEMAP_PBR);
    renderPass.drawIndexed(modelBufferData.indices_indices.indexCount);

    // CUBEMAP
    renderPass.setPipeline(pipeline_CUBEMAP);

    renderPass.setVertexBuffer(0, vertexBuffer_CUBEMAP);
    renderPass.setBindGroup(0, uniformBindGroup_CUBEMAP);
    renderPass.draw(cubeVertexCount);

    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);


    window.requestAnimationFrame(animate);
  };
  animate(0);
}

main();