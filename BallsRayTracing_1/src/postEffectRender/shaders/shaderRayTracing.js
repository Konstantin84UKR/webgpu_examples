export const shaderRayTracing = {
    vertex: `
    
      struct VertexOutput{
          @builtin(position) Position : vec4<f32>,
          @location(0) fragUV : vec2<f32>,
      }

      @vertex
      fn vertex_main(
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
        output.Position = vec4(pos[VertexIndex], 0.1, 1.0);
        output.fragUV =  uv[VertexIndex];

        return output;
      }`,

    fragment: `

          struct Uniform {
            pMatrix : mat4x4<f32>,
            vMatrix : mat4x4<f32>,
          };
          @group(0) @binding(0) var<uniform> uMatrix : Uniform;        
          
          struct iUniform {
            piMatrix : mat4x4<f32>,
            viMatrix : mat4x4<f32>,
          };
          @group(0) @binding(1) var<uniform> uiMatrix : iUniform;
          @group(0) @binding(2) var<uniform> cameraPosition : vec3<f32>;  

          @group(1) @binding(0) var<storage, read> instansPosition : array<vec4<f32>>;
          @group(1) @binding(1) var<storage, read> instansRadius : array<f32>;
           
          fn sphIntersect( ro : vec4<f32>, rdir : vec4<f32>, ce : vec4<f32>, ra:f32) -> f32 {
            var oc : vec4<f32>  = ce - ro;  
            var rd : vec4<f32>  = normalize(rdir);

            // var b : f32 = dot( oc, rd );
            // var c : f32 = dot( oc, oc ) - ra*ra;
            // var h : f32 = b*b - c;
           
            // if( h < 0.0 ) return -1.0; // no intersection
            // h = sqrt( h );
            // return  -b-h;

            var t : f32 = dot(oc, rd);
            var qc: vec4<f32> = ro + t * rd;
            // var q : f32 = dot( oc, oc ) - ra*ra;
            var a : f32 = t * t; // 18.5
            var c : f32 = dot( oc, oc ); // 25.0
            var b : f32 = c - a;
            
            var f : f32 = ra*ra - b;
            f = sqrt( f );
            //---------------------------
            if(sqrt( b ) > ra){
              return 1e09;
            }  


            return t - f;
          }

          // // sphere of size ra centered at point ce
          // vec2 sphIntersect( in vec3 ro, in vec3 rd, in vec3 ce, float ra )
          // {
          //     vec3 oc = ro - ce;
          //     float b = dot( oc, rd );
          //     float c = dot( oc, oc ) - ra*ra;
          //     float h = b*b - c;
          //     if( h<0.0 ) return vec2(-1.0); // no intersection
          //     h = sqrt( h );
          //     return vec2( -b-h, -b+h );
          // }
        
          // struct Ray{
          //   ori : vec4<f32>,
          //   dir : vec4<f32>,
          //   power : f32
          // }

          // struct TraceResult{
          //   one : Ray,
          //   two : Ray,
          //   ok  : bool
          // }

          // const noRay = Ray(vec4<f32>(0.),vec4<f32>(0.), 0.);
   

          @fragment
          fn fragment_main(@builtin(position) coord : vec4<f32>, @location(0) fragUV : vec2<f32>) -> @location(0) vec4<f32> {
          
          var ro : vec4<f32> = vec4(cameraPosition, 1.0);
                  
          var color: vec4<f32> = vec4(fragUV.x * 2.0 - 1.0, 1.0 - fragUV.y * 2.0, 1.0, 1.0); // тут в z должна быть 1,0   
          var test: vec4<f32> = uMatrix.pMatrix * uMatrix.vMatrix * color; // Это удалить потом
            
          var targetPoint: vec4<f32> = uiMatrix.viMatrix * uiMatrix.piMatrix * color;
          var rd: vec4<f32> = normalize(vec4(targetPoint.xyz/targetPoint.w - ro.xyz,1.0));
          //rd = vec4(rd.x,rd.y,-rd.z,1.0);

          var color1: vec4<f32> = vec4(0.2, 0.4, 0.8, 1.0);
          var color2: vec4<f32> = vec4(1.0, 1.0, 1.0, 1.0);  
          
          var color3: vec4<f32> = mix(color1,color2,rd.y);

          var t:f32 = 0.0; 
          var minD:f32 = 1000.0; 
          var minPos: vec4<f32> = vec4<f32>(0.0);
          var ra: f32 = 0.0;
          
          //Перебираем все сферы и ищем самую ближнюю сферу
          for (var i = 0; i < 6; i++) {
           
            t = sphIntersect(ro, rd, instansPosition[i], instansRadius[i]);
            if(t < minD && t > 0.0) {
              minD = t;
              minPos = instansPosition[i];
              ra = instansRadius[i];
            }             
          } 
        
          if (minD > 999.0){ 
             discard;
          }   
          //Рисуем самую ближнюю сферу         
          var hit: vec4<f32> = ro + minD * rd;
          var n: vec4<f32> = normalize(hit - minPos);

          return n;

       }`};