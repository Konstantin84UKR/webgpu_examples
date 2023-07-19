import {
  mat4,
} from './wgpu-matrix.module.js';
import { Camera } from '../../common/camera/camera.js';
import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { RectangleGeometry } from '../../common/primitives/RectangleGeometry.js';
import { BoxGeometry } from '../../common/primitives/BoxGeometry.js';
import { CylinderGeometry } from '../../common/primitives/CylinderGeometry.js';

async function loadJSON(result,modelURL) {
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

async function loadTexture(device,url){

  let img = new Image();
  img.src = url; 
  await img.decode();
  
  const imageBitmap = await createImageBitmap(img);


  const texture = device.createTexture({
    size:[imageBitmap.width,imageBitmap.height,1],
    format:'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING |
           GPUTextureUsage.COPY_DST |
           GPUTextureUsage.RENDER_ATTACHMENT
  });

  device.queue.copyExternalImageToTexture(
    {source: imageBitmap},
    {texture: texture},
    [imageBitmap.width,imageBitmap.height]);

  return texture;

}

async function main() {
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
        @location(3) tangent: vec3<f32>, 
        @location(4) bitangent: vec3<f32>) -> Output {
           
            var output: Output;
            output.Position = uniforms.pMatrix * uniforms.vMatrix * uniforms.mMatrix * pos;
            output.fragPosition = (uniforms.mMatrix * pos).xyz;
            output.fragUV = uv * 4.0;
            output.fragNormal  = (uniforms.mMatrix * vec4<f32>(normal,1.0)).xyz; 
                    
              // -----NORMAL --------------------------------
              let norm : vec3<f32>  = normalize((uniforms.mMatrix * vec4<f32>(normal,1.0)).xyz);
              let tang : vec3<f32> = normalize((uniforms.mMatrix * vec4<f32>(tangent,1.0)).xyz);
              let binormal : vec3<f32> = normalize((uniforms.mMatrix * vec4<f32>(bitangent,1.0)).xyz);

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
      const gamma = 2.2; 

      fn FresnelSchlick(cosTheta : f32, F0 : vec3f) -> vec3f {
        return F0 + (vec3f(1) - F0) * pow(1.0 - cosTheta, 5.0);
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

     
      @binding(0) @group(1) var shadowMap : texture_depth_2d;  
      @binding(1) @group(1) var shadowSampler : sampler_comparison;
      //@binding(2) @group(1) var<uniform> test : vec3<f32>;  
    
      @fragment
      fn main(@location(0) fragPosition: vec3<f32>,
       @location(1) fragUV: vec2<f32>, 
       @location(2) fragNormal: vec3<f32>,
       @location(3) shadowPos: vec3<f32>,
       @location(4) fragNor: vec3<f32>,
       @location(5) fragTangent: vec3<f32>,
       @location(6) fragBitangent: vec3<f32>, ) -> @location(0) vec4<f32> {
        
        let specularColor:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
        let sourceDiffuseColor:vec3<f32> = vec3<f32>(10.0, 10.0, 10.0);
        let i = 1.0f;
        
        //BaseColor
        let textureAlbedo:vec3<f32> = (textureSample(textureDataBaseColor, textureSampler, fragUV * i)).rgb;
        let textureBaseColor:vec3<f32> = vec3<f32>(pow(textureAlbedo.r, gamma), 
                                                   pow(textureAlbedo.g, gamma), 
                                                   pow(textureAlbedo.b, gamma));
      
        //Roughness & Metallic & AO
        let texturRoughness:vec3<f32> = (textureSample(textureDataRoughness, textureSampler, fragUV * i)).rgb;
        let texturMetallic:vec3<f32> = (textureSample(textureDataMetallic, textureSampler, fragUV * i)).rgb;
        let texturAO:vec3<f32> = (textureSample(textureDataAO, textureSampler, fragUV * i)).rgb;
                
        //Normal 
        var textureNormal:vec3<f32> = normalize(2.0 * (textureSample(textureDataNormal, textureSampler, fragUV * i)).rgb - 1.0);
        var colorNormal = normalize(vec3<f32>(textureNormal.x, textureNormal.y, textureNormal.z));
        //colorNormal.y *= -1;

        var tbnMatrix : mat3x3<f32> = mat3x3<f32>(
          normalize(fragTangent), 
          normalize(fragBitangent), 
          normalize(fragNor));
    
        colorNormal = normalize(tbnMatrix * colorNormal);
        

        //Shadow
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
      

        // PBR 

        var F0:vec3<f32> = vec3(.04);
        F0 = mix(F0, textureBaseColor, texturMetallic);


        let N:vec3<f32> = normalize(colorNormal.xyz);
        let L:vec3<f32> = normalize((uniforms.lightPosition).xyz - fragPosition.xyz);
        let V:vec3<f32> = normalize((uniforms.eyePosition).xyz - fragPosition.xyz);
        let H:vec3<f32> = normalize(L + V);

        let distance:f32 = length((uniforms.lightPosition).xyz - fragPosition.xyz);
        let attenuation:f32 = 1./(distance*distance);
        let radiance:vec3<f32> = sourceDiffuseColor * 1.0 * 0.8;  // 0.8 u_shininess
      
        // cook-torrance brdf
        let NDF:f32 = DistributionGGX(N,H,texturRoughness.r);
        let G:f32 = GeometrySmith(N,V,L,texturRoughness.r);
        let F:vec3<f32> = FresnelSchlick(max(dot(H,N),0.),F0);  

        let kS:vec3<f32> = F;
        var kD:vec3<f32> = vec3<f32>(1.) - kS;
        kD *= 1.0 - texturMetallic;
        
        let numerator:vec3<f32> = NDF*G*F;
        let denominator:f32 = 4.*max(dot(N,V),0.)*max(dot(N,L),0.);
        let specular:vec3<f32> = numerator / max (denominator,.001);
        
        let NdotL:f32 = max(dot(N,L),0.);
        let ambient:vec3<f32> = vec3<f32>(0.1, 0.2, 0.3) * 0.03; // No PBR
        let Lo:vec3<f32> = (kD * (textureBaseColor * shadow * texturAO )/ PI + (specular * shadow) + ambient) * radiance * NdotL;


        // let diffuse:f32 = 0.8 * max(dot(N, L), 0.0);
        //let specular = pow(max(dot(N, H),0.0),100.0);
        //let ambient:vec3<f32> = vec3<f32>(0.1, 0.1, 0.1);
      
        // let finalColor:vec3<f32> =  textureBaseColor * ( shadow * diffuse + ambient) + (texturMetallic * texturRoughness * specular * shadow); 
                
        
        //let finalColor:vec3<f32> =  colorNormal * 0.5 + 0.5;  //let color = N * 0.5 + 0.5;
        //let finalColor:vec3<f32> =  textureBaseColor ;  //let color = N * 0.5 + 0.5;
        let finalColor:vec3<f32> =  Lo;    
        return vec4<f32>(finalColor, 1.0);
    }
    `,
    };


    //---------------------------------------------------


  //const mesh1 = new BoxGeometry(2,2,2,1,1,1);
  const mesh1 = new SphereGeometry(2);
  //const mesh1 = new RectangleGeometry(4, 4, 2, 2);
  //const mesh1 = new CylinderGeometry(1.0, 1.0, 2, 16, 3, false, 0, Math.PI * 2);
    

  const plane_vertex = new Float32Array(mesh1.vertices);
  const plane_uv = new Float32Array(mesh1.uvs);
  const plane_normal = new Float32Array(mesh1.normals);
  const plane_tangent = new Float32Array(mesh1.tangents);
  const plane_index = new Uint32Array(mesh1.indices);
     
    //const meshGeometry = new SphereGeometry(2, 32, 16, 1, 1, 0, 2);
     //const meshGeometry = new SphereGeometry(1);
    //  const meshGeometry = new BoxGeometry(2, 3, 4, 2, 3, 4);

    //  const cube_vertex = new Float32Array(meshGeometry.vertices);
    //  const cube_uv = new Float32Array(meshGeometry.uvs);
    //  const cube_normal = new Float32Array(meshGeometry.normals);
    //  const cube_tangent = new Float32Array(meshGeometry.tangents);
    //  const cube_index = new Uint32Array(meshGeometry.indices);

  let CUBE = {};
  await loadJSON(CUBE, './res/Model.json');

  let mesh = CUBE.mesh.meshes[0];

  const cube_vertex = new Float32Array(mesh.vertices);
  const cube_uv = new Float32Array(mesh.texturecoords[0]);
  const cube_index = new Uint32Array(mesh.faces.flat());
  const cube_normal = new Float32Array(mesh.normals);
  const cube_tangent = new Float32Array(mesh.tangents);
  const cube_bitangent = new Float32Array(mesh.bitangents);

    //---------------------------------------------------
  
    const canvas = document.getElementById("canvas-webgpu");
    canvas.width = 1200;
    canvas.height = 800;

    // Получаем данные о физическом утсройстве ГПУ
    const adapter = await navigator.gpu.requestAdapter();
    //** Получаем данные о логическом устройсве ГПУ */
    //** Пока не понятно можно ли переключаться между разными физ устройсвами или создавать несколько логический устройств */
    const device = await adapter.requestDevice();
    //** Контектс канваса тут все ясно  */
    const context = canvas.getContext("webgpu");

    const devicePixelRatio = window.devicePixelRatio || 1;
    const size = [
      canvas.clientWidth * devicePixelRatio ,
      canvas.clientHeight * devicePixelRatio ,
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


    //---create uniform data
   
    let MODELMATRIX = mat4.identity();
    let MODELMATRIX_PLANE = mat4.identity();
 
    MODELMATRIX_PLANE = mat4.rotationX(Math.PI *0.5);
  
    let camera = new Camera(canvas);  
        
    //let eyePosition = [10, 10, 10.0]; 
    const lightPosition = new Float32Array([10, 10, 10.0]);//new Float32Array(camera.eye);
    const VIEWMATRIX_SHADOW = mat4.lookAt(lightPosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
    const PROJMATRIX_SHADOW = mat4.ortho(-6, 6, -6, 6, 1, 35);
   
   

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
    const vertexBuffer = device.createBuffer({
      size: cube_vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });  
   
    //загружаем данные в буффер */
    new Float32Array(vertexBuffer.getMappedRange()).set(cube_vertex);
    // передаем буфер в управление ГПУ */
    vertexBuffer.unmap();

    //****************** BUFFER  uvBuffer
    const uvBuffer = device.createBuffer({
      size: cube_uv.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(uvBuffer.getMappedRange()).set(cube_uv);
    // передаем буфер в управление ГПУ */
    uvBuffer.unmap();

   //****************** BUFFER  normalBuffer
    const normalBuffer = device.createBuffer({
      size: cube_normal.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(normalBuffer.getMappedRange()).set(cube_normal);
    // передаем буфер в управление ГПУ */
    normalBuffer.unmap();

    //****************** BUFFER  cubeTangentBuffer
    const cubeTangentBuffer = device.createBuffer({
      size: cube_tangent.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(cubeTangentBuffer.getMappedRange()).set(cube_tangent);
    // передаем буфер в управление ГПУ */
    cubeTangentBuffer.unmap();

    //****************** BUFFER  cubeBitangentlBuffer
    const cubeBitangentlBuffer = device.createBuffer({
      size: plane_tangent.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(cubeBitangentlBuffer.getMappedRange()).set(plane_tangent);
    // передаем буфер в управление ГПУ */
    cubeBitangentlBuffer.unmap();

   //****************** BUFFER  indexBuffer
    const indexBuffer = device.createBuffer({
      size: cube_index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint32Array(indexBuffer.getMappedRange()).set(cube_index);
    indexBuffer.unmap();


    //******************
    // PLANE
    //******************
    const plane_vertexBuffer = device.createBuffer({
      size: plane_vertex.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });

    //загружаем данные в буффер */
    new Float32Array(plane_vertexBuffer.getMappedRange()).set(plane_vertex);
    // передаем буфер в управление ГПУ */
    plane_vertexBuffer.unmap();

    //****************** BUFFER  uvBuffer
    const plane_uvBuffer = device.createBuffer({
      size: plane_uv.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(plane_uvBuffer.getMappedRange()).set(plane_uv);
    // передаем буфер в управление ГПУ */
    plane_uvBuffer.unmap();

    //****************** BUFFER  normalBuffer
    const plane_normalBuffer = device.createBuffer({
      size: plane_normal.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(plane_normalBuffer.getMappedRange()).set(plane_normal);
    // передаем буфер в управление ГПУ */
    plane_normalBuffer.unmap();

    const planeTangentBuffer = device.createBuffer({
      size: plane_tangent.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
    new Float32Array(planeTangentBuffer.getMappedRange()).set(plane_tangent);
    // передаем буфер в управление ГПУ */
    planeTangentBuffer.unmap();

    const planeBitangentBuffer = device.createBuffer({
      size: plane_tangent.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,   //COPY_DST  ХЗ что это
      mappedAtCreation: true
    });
    //загружаем данные в буффер */
  new Float32Array(planeBitangentBuffer.getMappedRange()).set(plane_tangent);
    // передаем буфер в управление ГПУ */
    planeBitangentBuffer.unmap();

    //****************** BUFFER  indexBuffer
    const plane_indexBuffer = device.createBuffer({
      size: plane_index.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint32Array(plane_indexBuffer.getMappedRange()).set(plane_index);
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
        buffers:[
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
      depthStencil:{
        format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
        depthWriteEnabled: true, //вкл\выкл теста глубины 
        depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
    }
    });

    let shadowDepthTexture  = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    }); 

    let shadowDepthView = shadowDepthTexture.createView();

    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: device.createShaderModule({
          code: shader.vertex,
        }),
        entryPoint: "main",
        buffers:[
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
          },
          {
              arrayStride: 12,
              attributes: [{
                  shaderLocation: 4,
                  format: "float32x3",
                  offset: 0
              }]
          }
      ]
      },
      fragment: {
        module: device.createShaderModule({
          code: shader.fragment,
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
      depthStencil:{
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
      size: 16+16,
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
      minFilter:'linear',
      magFilter:'linear',
      mipmapFilter: "linear", //nearest
      addressModeU: 'repeat',
      addressModeV: 'repeat'
    });

    // const texture = device.createTexture({
    //   size:[imageBitmap.width,imageBitmap.height,1],
    //   format:'rgba8unorm',
    //   usage: GPUTextureUsage.TEXTURE_BINDING |
    //          GPUTextureUsage.COPY_DST |
    //          GPUTextureUsage.RENDER_ATTACHMENT
    // });

    // device.queue.copyExternalImageToTexture(
    //   {source: imageBitmap},
    //   {texture: texture},
    //   [imageBitmap.width,imageBitmap.height]);

       //-------------------- TEXTURE ---------------------
    // //Создаем картинку и загрудаем в нее данные из файла
    // https://webgpufundamentals.org/webgpu/lessons/webgpu-textures.html
    // 
//  1) Создаем текстуру из файла картинки 
async function createTextureFromImage(device, url, options) {
  const imgBitmap = await loadImageBitmap(url);
  return createTextureFromSource(device, imgBitmap, options);
}
//  2) загружаем картинку с диска и создаем из нее Bitmap
async function loadImageBitmap(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return await createImageBitmap(blob, { colorSpaceConversion: 'none' });
}
//  3) Создаем текстуру из источника
function createTextureFromSource(device, source, options = {}) {
  const texture = device.createTexture({
    format: 'rgba8unorm',
    mipLevelCount: options.mips ? numMipLevels(source.width, source.height) : 1,
   // mipLevelCount:  1,
    size: [source.width, source.height],
    usage:  GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST | // мы можем писать данные в текстуру
            GPUTextureUsage.RENDER_ATTACHMENT, //// мы можем рендерить в текстуру
  });
  copySourceToTexture(device, texture, source, options);
  return texture;
}
//  4) вычисляем необходимое количество мип урочней
const numMipLevels = (...sizes) =>{
  const maxSize = Math.max(...sizes);
  return 1 + Math.log2(maxSize)|0;
};
//  5) копируем данные из источника в текстуру (отправляем на GPU)
function copySourceToTexture(device, texture, source, {flipY} = {}) {
  device.queue.copyExternalImageToTexture(
    { source, flipY, },
    { texture },
    { width: source.width, height: source.height },
  );

  if (texture.mipLevelCount > 1) {
    generateMips(device, texture);
  }
}

//  6) Генерируем мип уровни
//  основная идея в том что бы нарисовать текстуру в источник ту же текстуру,
//  но следуюший мип уровень.
//  раньше мы всегда рендерили изображение в текстуру созданую констекстом канваса
//  сейчас мы не чего не выводим на канвас, а рендерим в память 
//  в данном случаи в текстуру и ее конкретный мип уровень
const generateMips = (() => {
  let pipeline;
  let sampler;

  return function generateMips(device, texture) {
    if (!pipeline) {
      const module = device.createShaderModule({
        label: 'textured quad shaders for mip level generation',
        code: `
          struct VSOutput {
            @builtin(position) position: vec4f,
            @location(0) texcoord: vec2f,
          };

          @vertex fn vs(
            @builtin(vertex_index) vertexIndex : u32
          ) -> VSOutput {
            var pos = array<vec2f, 6>(

              vec2f( 0.0,  0.0),  // center
              vec2f( 1.0,  0.0),  // right, center
              vec2f( 0.0,  1.0),  // center, top

              // 2st triangle
              vec2f( 0.0,  1.0),  // center, top
              vec2f( 1.0,  0.0),  // right, center
              vec2f( 1.0,  1.0),  // right, top
            );

            var vsOutput: VSOutput;
            let xy = pos[vertexIndex];
            vsOutput.position = vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
            vsOutput.texcoord = vec2f(xy.x, 1.0 - xy.y);
            return vsOutput;
          }

          @group(0) @binding(0) var ourSampler: sampler;
          @group(0) @binding(1) var ourTexture: texture_2d<f32>;

          @fragment fn fs(fsInput: VSOutput) -> @location(0) vec4f {
            return textureSample(ourTexture, ourSampler, fsInput.texcoord);
          }
        `,
      });
      pipeline = device.createRenderPipeline({
        label: 'mip level generator pipeline',
        layout: 'auto',
        vertex: {
          module,
          entryPoint: 'vs',
        },
        fragment: {
          module,
          entryPoint: 'fs',
          targets: [{ format: texture.format }],
        },
      });

      sampler = device.createSampler({
        minFilter: 'linear',
      });
    }

    const encoder = device.createCommandEncoder({
      label: 'mip gen encoder',
    });

    let width = texture.width;
    let height = texture.height;
    let baseMipLevel = 0;
    while (width > 1 || height > 1) {
      width = Math.max(1, width / 2 | 0);
      height = Math.max(1, height / 2 | 0);

      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: sampler },
          { binding: 1, resource: texture.createView({baseMipLevel, mipLevelCount: 1}) },
        ],
      });

      ++baseMipLevel;

      const renderPassDescriptor = {
        label: 'our basic canvas renderPass',
        colorAttachments: [
          {
            view: texture.createView({baseMipLevel, mipLevelCount: 1}),
            clearValue: [0.3, 0.3, 0.3, 1],
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      };

      const pass = encoder.beginRenderPass(renderPassDescriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(6);  // call our vertex shader 6 times
      pass.end();
    }

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
  };
})();

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

// const texture =  await createTextureFromImage(device,'./res/rusted-steel-bl/rusted-steel_albedo.png', {mips: true, flipY: false});
// const texture_NORMAL =  await createTextureFromImage(device,'./res/rusted-steel-bl/rusted-steel_normal-ogl.png', {mips: true, flipY: false});
// const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/rusted-steel-bl/rusted-steel_roughness.png', {mips: true, flipY: false});
// const texture_METALLIC =  await createTextureFromImage(device,'./res/rusted-steel-bl/rusted-steel_metallic.png', {mips: true, flipY: false});
// const texture_AO =  await createTextureFromImage(device,'./res/rusted-steel-bl/rusted-steel_ao.png', {mips: true, flipY: false});

// const texture =  await createTextureFromImage(device,'./res/bamboo-wood-semigloss-bl/bamboo-wood-semigloss-albedo.png', {mips: true, flipY: false});
// const texture_NORMAL =  await createTextureFromImage(device,'./res/bamboo-wood-semigloss-bl/bamboo-wood-semigloss-normal.png', {mips: true, flipY: false});
// const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/bamboo-wood-semigloss-bl/bamboo-wood-semigloss-roughness.png', {mips: true, flipY: false});
// const texture_METALLIC =  await createTextureFromImage(device,'./res/bamboo-wood-semigloss-bl/bamboo-wood-semigloss-metal.png', {mips: true, flipY: false});
// const texture_AO =  await createTextureFromImage(device,'./res/bamboo-wood-semigloss-bl/bamboo-wood-semigloss-ao.png', {mips: true, flipY: false});

const texture =  await createTextureFromImage(device,'./res/worn-factory-siding-bl/worn-factory-siding_albedo.png', {mips: true, flipY: false});
const texture_NORMAL =  await createTextureFromImage(device,'./res/worn-factory-siding-bl/worn-factory-siding_normal-ogl.png', {mips: true, flipY: false});
const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/worn-factory-siding-bl/worn-factory-siding_roughness.png', {mips: true, flipY: false});
const texture_METALLIC =  await createTextureFromImage(device,'./res/worn-factory-siding-bl/worn-factory-siding_metallic.png', {mips: true, flipY: false});
const texture_AO =  await createTextureFromImage(device,'./res/worn-factory-siding-bl/worn-factory-siding_ao.png', {mips: true, flipY: false});


    
//--------------------------------------------------

    // let texture = await loadTexture(device,'./res/pbr2/rough-wet-cobble-albedo.png');
    // let texture_NORMAL = await loadTexture(device,'./res/pbr2/rough-wet-cobble-normal-ogl.png');
    // let texture_ROUGHNESS = await loadTexture(device,'./res/pbr2/rough-wet-cobble-roughness.png');
    // let texture_METALLIC = await loadTexture(device,'./res/pbr2/rough-wet-cobble-metallic.png');
    // let texture_AO = await loadTexture(device,'./res/pbr2/rough-wet-cobble-ao.png');

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
        // ,
        // {
        //   binding: 2,
        //   resource: {
        //   buffer: fragmentUniformBuffer1,
        //   offset: 0,
        //   size: 16  //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
        //   }
        // }          
      ]
  });


    device.queue.writeBuffer(uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffer, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset
    //device.queue.writeBuffer(uniformBuffer, 64+64+64, NORMALMATRIX); // и так дале прибавляем 64 к offset

    device.queue.writeBuffer(fragmentUniformBuffer, 0, new Float32Array(camera.eye));
    device.queue.writeBuffer(fragmentUniformBuffer,16, lightPosition);

    device.queue.writeBuffer(uniformBuffershadow, 0, PROJMATRIX_SHADOW); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(uniformBuffershadow, 64, VIEWMATRIX_SHADOW); // следуюшая записать в буфер с отступом (offset = 64)
    device.queue.writeBuffer(uniformBuffershadow, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset

    //device.queue.writeBuffer(fragmentUniformBuffer1, 0, new Float32Array(1.0,1.0,1.0));


    const renderPassDescription = {
      colorAttachments: [
        {
          view: undefined,
          clearValue: {r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
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
let time_old=0; 
 async function animate(time) {
      
      //-----------------TIME-----------------------------
      //console.log(time);
      let dt=time-time_old;
      time_old=time;
      //--------------------------------------------------
     
      //------------------MATRIX EDIT---------------------
      MODELMATRIX = mat4.rotateY( MODELMATRIX, dt * 0.0001);
      //MODELMATRIX = mat4.rotateX( MODELMATRIX, dt * 0.0002);
      //MODELMATRIX = mat4.rotateZ( MODELMATRIX, dt * 0.0001);
      camera.setDeltaTime(dt);
      //--------------------------------------------------

      device.queue.writeBuffer(uniformBuffer, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
      device.queue.writeBuffer(uniformBuffer, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
      device.queue.writeBuffer(uniformBuffer, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset
      //device.queue.writeBuffer(uniformBuffer, 64+64+64, NORMALMATRIX); // и так дале прибавляем 64 к offset
      device.queue.writeBuffer(uniformBuffershadow, 64+64, MODELMATRIX); // и так дале прибавляем 64 к offset

      device.queue.writeBuffer(fragmentUniformBuffer, 0, camera.eye);
      device.queue.writeBuffer(fragmentUniformBuffer, 16, lightPosition);


      const commandEncoder = device.createCommandEncoder();

      // SHADOW
    
      const renderPassShadow = commandEncoder.beginRenderPass(renderPassDescriptionShadow);
      renderPassShadow.setPipeline(shadowPipeline);
     
      // renderPassShadow.setVertexBuffer(0, vertexBuffer);
      // renderPassShadow.setVertexBuffer(1, uvBuffer);
      // renderPassShadow.setVertexBuffer(2, normalBuffer);
      // renderPassShadow.setVertexBuffer(3, cubeTangentBuffer);
      // renderPassShadow.setVertexBuffer(4, cubeBitangentlBuffer);
      // renderPassShadow.setIndexBuffer(indexBuffer, "uint32");
      // renderPassShadow.setBindGroup(0, shadowGroup);
      // renderPassShadow.drawIndexed(cube_index.length);
      
      
      //device.queue.writeBuffer(uniformBuffershadow, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset

      renderPassShadow.setVertexBuffer(0, plane_vertexBuffer);
      renderPassShadow.setVertexBuffer(1, plane_uvBuffer);
      renderPassShadow.setVertexBuffer(2, plane_normalBuffer);
      renderPassShadow.setVertexBuffer(3, planeTangentBuffer);
      renderPassShadow.setVertexBuffer(4, planeBitangentBuffer);
      renderPassShadow.setIndexBuffer(plane_indexBuffer, "uint32");
      renderPassShadow.setBindGroup(0, shadowGroup);
      renderPassShadow.drawIndexed(plane_index.length);

      renderPassShadow.end();
     // MAIN 
      //device.queue.writeBuffer(uniformBuffershadow, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset
      const textureView = context.getCurrentTexture().createView();
      renderPassDescription.colorAttachments[0].view = textureView;  
    
      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);       
      
      renderPass.setPipeline(pipeline);
     
      // renderPass.setVertexBuffer(0, vertexBuffer);
      // renderPass.setVertexBuffer(1, uvBuffer);
      // renderPass.setVertexBuffer(2, normalBuffer);
      // renderPass.setVertexBuffer(3, cubeTangentBuffer);
      // renderPass.setVertexBuffer(4, cubeBitangentlBuffer);
      // renderPass.setIndexBuffer(indexBuffer, "uint32");
      // renderPass.setBindGroup(0, uniformBindGroup);
      // renderPass.setBindGroup(1, uniformBindGroup1);
      // renderPass.drawIndexed(cube_index.length);
     
     
      //device.queue.writeBuffer(uniformBuffershadow, 64 + 64, MODELMATRIX); // и так дале прибавляем 64 к offset
          
       renderPass.setVertexBuffer(0, plane_vertexBuffer);
       renderPass.setVertexBuffer(1, plane_uvBuffer);
       renderPass.setVertexBuffer(2, plane_normalBuffer);
       renderPass.setVertexBuffer(3, planeTangentBuffer);
       renderPass.setVertexBuffer(4, planeBitangentBuffer);
       renderPass.setIndexBuffer(plane_indexBuffer, "uint32");
       renderPass.setBindGroup(0, uniformBindGroup);
       renderPass.setBindGroup(1, uniformBindGroup1);
       renderPass.drawIndexed(plane_index.length);
       
       renderPass.end();
  
      device.queue.submit([commandEncoder.finish()]);


      window.requestAnimationFrame(animate);
    };
    animate(0);
  }

  main();
