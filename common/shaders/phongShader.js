
// basic_shader.js
import { mathDefines,cameraStruct, brdfPhong ,lin2rgb,rgb2lin,Light,Lights,cameraStructShadow} from './shader_common.js';


export  class PhongShader {
  constructor(params) {
    this.name = 'PhongShader';
    this.shaderSrc = "";
    this.color = params.diffuseColor; // RGBA
    this.specularColor = params.specularColor;
    this.vertexBuffers = this.setVertexBuffers();

    this.vertexEntryPoint = `mainVertex`;
    this.fragmentEntryPoint = `mainFragment`;

    this.shiniess = params.shiniess || 32.0; // Default shininess value
    this.ambientColor = params.ambientColor ; // RGBA
    this.diffuseTexture = params.diffuseTexture || null;
     
   // this.createShaderSrc();
    this.shadowMap = params.shadowMap; 
    this.softShadow = params.softShadow;

    this.shadowMapUsing = params.shadowMapUsing;

   //CAMERA
   this.numGroupCamera = 0;
   //Light
   this.numGroupLight = 1;


   this.layoutMap = params.layoutMap;

  }

  async createShaderSrc() {
    
    //let diffuseFlatColor =  `vec3<f32>(${this.color[0].toFixed(1)}, ${this.color[1].toFixed(1)}, ${this.color[2].toFixed(1)});` 
    let diffuseTextureColorBinding =  ``;
    let diffuseTextureColor =  `vec3<f32>(1.0,1.0,1.0)`
    
    if(this.diffuseTexture !== null) {     
     diffuseTextureColorBinding =  ` 
     @group(3) @binding(${this.layoutMap.get('diffuseTextureSampler')}) var textureSampler : sampler;
     @group(3) @binding(${this.layoutMap.get('diffuseTextureEntriesview')}) var textureData : texture_2d<f32>;
      `;

     diffuseTextureColor =  `(textureSample(textureData, textureSampler, vUV)).rgb`;  
    }

    let shadowMapBinding =  ``;
    let shadowMapTexture =  ``;
    let outputShadowPos  =  ``;
    if(this.shadowMapUsing !== false) { 
    shadowMapBinding =  
    `
      //  @group(${this.numGroupLight}) @binding(1) var shadowMap : texture_depth_2d;  
        @group(${this.numGroupLight}) @binding(1) var shadowMaps: texture_depth_2d_array;  
        @group(${this.numGroupLight}) @binding(2) var shadowSampler : sampler_comparison;
       // @group(${this.numGroupLight}) @binding(3) var<uniform> lightCamera : shadowCamera;
        @group(${this.numGroupLight}) @binding(3) var<storage, read> lightCameras : array<shadowCamera>;
    `;

    outputShadowPos = `
       //var shadowPos_array = array<vec3<f32>, NUM_LIGHTS>();
       //var shadowPos_array = vec3<f32>(0.0,0.0,0.0);;
      //  for (var i = 0u; i < NUM_LIGHTS; i++) {
      //     let posFromLight: vec4<f32> = lightCameras[i].pMatrix * lightCameras[i].vMatrix * uniforms.mMatrix * pos;
      //     // Convert shadowPos XY to (0, 1) to fit texture UV
      //     let shadowPos = vec3<f32>(posFromLight.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5), posFromLight.z);
      //     //output.shadowPos = posFromLight.xyz;

      //     shadowPos_array[i] = shadowPos;
      //  }
       output.shadowPos = uniforms.mMatrix * pos;

     `


      if (this.softShadow) {
        shadowMapTexture = ` let size = f32(textureDimensions(shadowMap)); // Размер одного слоя
        for (var y : i32 = -1 ; y <= 1 ; y = y + 1) {
            for (var x : i32 = -1 ; x <= 1 ; x = x + 1) {
               // let size = f32(textureDimensions(shadowMaps[i]).x);
              
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
    `
      } else {
        shadowMapTexture = `

        //let shadowPosShadow : vec4<f32> = shadowPos;
      
        for (var i = 0u; i < NUM_LIGHTS; i++) {
         
          let posFromLight: vec4<f32> = lightCameras[i].pMatrix * lightCameras[i].vMatrix * shadowPos;
          let shadowPosFrag = vec3<f32>(posFromLight.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5), posFromLight.z);
           
        //Жесткие тени   
            shadow = textureSampleCompare(
                  shadowMaps,             // texture_depth_2d_array
                  shadowSampler,          // sampler_comparison
                  shadowPosFrag.xy,       // vec2<f32> - UV
                  //1,            // u32 - уровень мипа
                  i,            // u32 - слой в массиве
                  shadowPosFrag.z - 0.05  // f32 - глубина
            );
        
        }

         shadow = shadow / 1.0; // Average the shadow values from both lights
    
    ` }

    }

    this.shaderSrc =  `
    
    // Phong Shader
    
    ${mathDefines}
    ${lin2rgb}
    ${rgb2lin}

    ${cameraStruct}

    ${cameraStructShadow}

    ${brdfPhong}

    ${Light}

    ${Lights}
    
    struct UniformMesh {
        mMatrix : mat4x4<f32>,      
      };

    struct PhongMaterialUniform {
       diffuseColor  : vec4<f32>,  
       specularColor : vec3<f32>,
       shiniess      : f32,
       ambientColor  : vec4<f32>,    
    };  
         
    
    @group( ${this.numGroupCamera}) @binding(0) var<uniform> camera : Camera;
    
    //@group(${this.numGroupLight}) @binding(0) var<uniform> uLigth : Light;
    
    @group(${this.numGroupLight}) @binding(0) var<storage, read> sceneLights: array<Light>;

    ${shadowMapBinding}
    
    @group(2) @binding(0) var<uniform> uniforms : UniformMesh;
    
    @group(3) @binding(${this.layoutMap.get('materialUniform')}) var<uniform> materialUniform : PhongMaterialUniform;
    
      
    ${diffuseTextureColorBinding}   

    
    
    //---Vertex Shader---//       
      struct Output {
          @builtin(position) Position : vec4<f32>,
          @location(0) vPosition : vec4<f32>,
          @location(1) vUV : vec2<f32>,
          @location(2) vNormal : vec4<f32>,
          @location(3) shadowPos :  vec4<f32>
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

            ${outputShadowPos}   
           
            return output;
        }

      //---End Vertex Shader---//

      //---Fragment Shader---//  
      @fragment
      fn mainFragment(@builtin(front_facing) is_front: bool,
      @location(0) vPosition: vec4<f32>, 
      @location(1) vUV: vec2<f32>, 
      @location(2) vNormal:  vec4<f32>,
      @location(3) shadowPos: vec4<f32>) -> @location(0) vec4<f32> {
        

        let shiniess = materialUniform.shiniess;
        var shadow = 0.0;
     
        let flux = 25.0;
         
        //let uLigth = sceneLights[0u];
        // let lightColor:vec3<f32> = uLigth.lightColor.rgb;
        // let lightPosition:vec3<f32> = uLigth.lightPosition.xyz;

        let specularColor:vec3<f32> = materialUniform.specularColor.rgb;      
        let ambientColor:vec3<f32> = materialUniform.ambientColor.rgb; // ambient color
                
        let diffuseTextureColor:vec3<f32> = ${diffuseTextureColor};
        let diffuseFlatColor:vec3<f32> =  materialUniform.diffuseColor.rgb;

        let diffuseColor:vec3<f32> =  diffuseTextureColor * diffuseFlatColor; 
              
        //////
        let N:vec3<f32> = normalize(vNormal.xyz);

        var radiance = vec3<f32>(0.0,0.0,0.0);

       // var uLigth;
       // var lightColor:vec3<f32>;
        
        for (var i = 0u; i < NUM_LIGHTS; i++) {

            let uLigth = sceneLights[i];
            let lightColor:vec3<f32> = uLigth.lightColor.rgb;
            let lightPosition:vec3<f32> = uLigth.lightPosition.xyz;
            
            let L:vec3<f32> = normalize((lightPosition).xyz - vPosition.xyz);
          
            let V:vec3<f32> = normalize((camera.position).xyz - vPosition.xyz);
            let H:vec3<f32> = normalize(L + V);
          
            let diffuse:f32 = 1.0 * max(dot(N, L), 0.0);
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
            
            ${shadowMapTexture}
            
            // let ambient : vec3<f32> = rgb2lin(diffuseColor.rgb) * rgb2lin(ambientColor.rgb);  
            let ambient : vec3<f32> = vec3<f32>(0.0,0.0,0.0) * rgb2lin(diffuseColor.rgb);      

            let brdf = brdfPhong(L,V,H,N, rgb2lin(diffuseColor), rgb2lin(specularColor),shiniess);

            radiance += brdf * irradiance * rgb2lin(lightColor.rgb) * shadow * uLigth.intensity + ambient;
            
        }

        radiance = lin2rgb(radiance);

        

        if(is_front){
           return vec4<f32>(radiance, 1.0);
        }else {
           return vec4<f32>(1.0,0.0,0.0, 1.0);
        }   

       //---End Fragment Shader---//  
    }
  `

    return this.shaderSrc;
  }

   setVertexBuffers(){
     const vertexBuffers = [
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
 
            return vertexBuffers
     }
}


