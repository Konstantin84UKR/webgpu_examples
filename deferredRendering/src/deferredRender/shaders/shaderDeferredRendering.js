export const shaderDeferredRendering = {
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
   
      @group(1) @binding(1) var<uniform> lightPositionArray : array<vec4<f32>, 5>;
      @group(1) @binding(2) var<uniform> lightColorArray : array<vec4<f32>, 5>;

      struct Camera {
        viewProjectionMatrix : mat4x4<f32>,
        invViewProjectionMatrix : mat4x4<f32>,
       
       };

      @group(2) @binding(0) var<uniform> camera : Camera;

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

      @fragment
      fn main(@builtin(position) coord : vec4<f32>, @location(0) fragUV : vec2<f32>)
       ->  @location(0) vec4<f32> {
   

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

        for (var i = 0; i < 5; i++) {
            
        
            let N:vec3<f32> = normalize(normal.xyz);
            let L:vec3<f32> = normalize((lightPositionArray[i]).xyz - fragPosition.xyz);
            let V:vec3<f32> = normalize((uniforms.eyePosition).xyz - fragPosition.xyz);
            let H:vec3<f32> = normalize(L + V);

            // let incident:vec3<f32> = (lightPositionArray[i]).xyz - fragPosition.xyz;
            // let dist:f32 = length(incident);
            // var light = dot(normal, incident/dist);
            // light *= smoothstep(0., light, dist);

            let distlight = distance(lightPositionArray[i].xyz, fragPosition.xyz); 
            let distlightPower = 5.0 / (4.0 * PI * distlight * distlight);
            let diffuse = distlightPower * max(dot(N,L), 0.0); // pointLight       
            //let irradiance : f32 = 1.0 * max(dot(N, L), 0.0); // sun
            let specular = pow(max(dot(N, H),0.0), 50.0) * .5 * distlightPower; //0.9 Просто уменьшаю яркость блика
            //let specular = 0.0;
            let ambient:vec3<f32> = vec3<f32>(0.00, 0.00, 0.00);
      
            finalColor += albedo * ((lightColorArray[i].rgb * diffuse) + ambient) + (specularColor * specular ); 
           
        }
        
        return vec4<f32>(finalColor, 1.0);     
    }
    `,
  };