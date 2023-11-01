export const shaderSSAORendering = {
    vertex: `
    struct VertexOutput{
      @builtin(position) Position : vec4<f32>,
      @location(0) fragUV : vec2<f32>,
  }

  @vertex
  fn main(
      @builtin(vertex_index) VertexIndex : u32
  ) -> VertexOutput {
 

  var pos = array<vec2<f32>, 6>(
      vec2( 1.0,  1.0),  vec2( 1.0, -1.0), vec2(-1.0, -1.0),
      vec2( 1.0,  1.0),  vec2(-1.0, -1.0), vec2(-1.0,  1.0)            
  );

  const uv = array(
      vec2( 1.0,  0.0),  vec2( 1.0,  1.0), vec2( 0.0,  1.0),
      vec2( 1.0,  0.0),  vec2( 0.0,  1.0), vec2( 0.0,  0.0)            
  );

      var output : VertexOutput;
      output.Position = vec4(pos[VertexIndex], 0.0, 1.0);
      output.fragUV =  uv[VertexIndex];

      return output;
  }
    `,

    fragment: `     
    
      @group(0) @binding(0) var gBufferNormal: texture_2d<f32>;
      @group(0) @binding(1) var gBufferAlbedo: texture_2d<f32>;
      @group(0) @binding(2) var gBufferDepth: texture_depth_2d;

      struct Uniforms {
        eyePosition : vec4<f32>,
        lightPosition : vec4<f32>,       
      };
      @group(1) @binding(0) var<uniform> uniforms : Uniforms;
   
      @group(1) @binding(1) var<uniform> lightPositionArray : array<vec4<f32>, 3>;
      @group(1) @binding(2) var<uniform> lightColorArray : array<vec4<f32>, 3>;

      struct Camera {
        viewProjectionMatrix : mat4x4<f32>,
        invViewProjectionMatrix : mat4x4<f32>,
       
       };

      @group(2) @binding(0) var<uniform> camera : Camera;

      @group(3) @binding(0) var<storage, read> samples : array<vec4<f32>, 64>;
      @group(3) @binding(1) var<storage, read> ssaoNoise : array<vec4<f32>, 16>;

      const PI : f32 = 3.1415926535897932384626433832795;  

      fn world_from_screen_coord(coord : vec2<f32>, depth_sample: f32) -> vec3<f32> {
        // reconstruct world-space position from the screen coordinate.
        let posClip = vec4(coord.x * 2.0 - 1.0, (1.0 - coord.y) * 2.0 - 1.0, depth_sample, 1.0);
        let posWorldW = camera.invViewProjectionMatrix * posClip;
        let posWorld = posWorldW.xyz / posWorldW.www;
        return posWorld;
      } 
      
    
      fn lin2rgb(lin: vec3<f32>) -> vec3<f32>{
        return pow(lin, vec3<f32>(1.0/2.2));
      } 

      struct GBufferOutput {
        @location(0) ssaoBuffer : vec4<f32>,
      }

      @fragment
      fn main(@builtin(position) coord : vec4<f32>, @location(0) fragUV : vec2<f32>)
       ->  GBufferOutput {
   

        var depth: f32 = textureLoad(
          gBufferDepth,
          vec2<i32>(floor(coord.xy)),
          0
        );

        let normal = textureLoad(
          gBufferNormal,
          vec2<i32>(floor(coord.xy)),
          0
        ).xyz;

        let albedo = textureLoad(
          gBufferAlbedo,
          vec2<i32>(floor(coord.xy)),
          0
        ).xyz;
        
        let specularColor:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
      
        let bufferSize = textureDimensions(gBufferDepth);
        let coordUV = coord.xy / vec2<f32>(bufferSize);
        let fragPosition = world_from_screen_coord(coordUV, depth);
         
        var finalColor:vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
        let N:vec3<f32> = normalize(normal.xyz);
        let V:vec3<f32> = normalize((uniforms.eyePosition).xyz - fragPosition.xyz);

      
        //SSAO
        let fragPos = fragPosition;
        let radius = 0.5;
        let sampleSize = 64.0;
        var occlusion = 0.0;

        let noiseX = u32(((coord.x / 4) - floor(coord.x / 4)) * 4);
        let noiseY = u32(((coord.y / 4) - floor(coord.y / 4)) * 4);
        let randomVec : vec3<f32> =  normalize(ssaoNoise[noiseX + noiseY].xyz);

        for (var i = 0; i < 64; i++) {

          let tangent : vec3<f32> = normalize(randomVec - N * dot(randomVec, N));
          let bitangent : vec3<f32> = cross(N, tangent);
          let TBN : mat3x3<f32> = mat3x3<f32>(tangent, bitangent, N); 

          // get sample position
          //var samplePos = samples[i];  // текуший семпл
          var samplePos = vec4<f32>(TBN * samples[i].xyz, samples[i].w); // переход от касательного пространства к пространству мира
          samplePos = samplePos * radius; // маштабируем семпл
          samplePos = vec4<f32>(fragPos, 1.0) + samplePos; // К текушей позиции в мировом пространстве  добавляем семпл 
          //и получаем положение точки сверки в мировом пространстве

          var offset : vec4<f32> = samplePos;
          offset = camera.viewProjectionMatrix * offset;            // from мировое to clip-space
          offset = vec4<f32>(offset.xyz / offset.www, 1.0);          // perspective divide 
          var offsetClipSpace  = vec2<f32>(offset.x * 0.5 + 0.5, offset.y * -0.5 + 0.5);   // transform to range 0.0 - 1.0  
                    
          let coordSSAO = offsetClipSpace.xy * vec2<f32>(bufferSize); // Получаем значение в диапазоне пикселей текстуры

          //Читаем конкретный пиксель из текстуры
          var depthSSAO: f32 = textureLoad(
            gBufferDepth,
            vec2<i32>(floor(coordSSAO.xy)),
            0
          );

          //получаем позицию для сверки.
          let sampleDepth  = world_from_screen_coord(offsetClipSpace.xy, depthSSAO);
          
          let rangeCheck = smoothstep(0.0, 1.0, radius / abs((samplePos.z + 0.01) - sampleDepth.z));
        
          if((samplePos.z + 0.01) < sampleDepth.z){
              occlusion = (occlusion + 1.0) * rangeCheck;                       
           }
              occlusion = occlusion;  
           }
          occlusion =  (1.0 - (occlusion / 64));

        var output : GBufferOutput;
        output.ssaoBuffer = vec4(occlusion, occlusion, occlusion, 1.0);
            
        return output;     
    }
    `,
  };