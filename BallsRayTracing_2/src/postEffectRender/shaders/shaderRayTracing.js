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
        output.Position = vec4(pos[VertexIndex], 1.0, 1.0);
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
          @group(1) @binding(2) var<uniform> iCount : i32;

          @group(2) @binding(0) var mySampler: sampler;
          @group(2) @binding(1) var myTexture: texture_cube<f32>;
           
          fn sphIntersect( ro : vec4<f32>, rdir : vec4<f32>, ce : vec4<f32>, ra:f32) -> f32 {
            var oc : vec4<f32>  = ce - ro;  
            var rd : vec4<f32>  = normalize(rdir);
            var t : f32 = dot(oc, rd);
            var qc: vec4<f32> = ro + t * rd;
           
            var a : f32 = t * t; // 18.5
            var c : f32 = dot( oc, oc ); // 25.0
            var b : f32 = c - a;
            var ra_ra : f32 = ra*ra;
            
            var f : f32 = ra_ra - b;
            f = sqrt( f );
            //---------------------------
            //if(sqrt( b ) > ra){
            if( b >= ra_ra ){  
              return 1e09;
            }  
            return t - f;
          }
       
        
          struct Ray{
            ori : vec4<f32>,
            dir : vec4<f32>,
            power : f32
          }

          struct TraceResult{
            one : Ray,
            two : Ray,
            ok  : i32
          }

          const noRay : Ray = Ray(vec4<f32>(0.),vec4<f32>(0.), 0.);

          fn rayTrace(r : Ray) -> TraceResult {
            
            if (r.power == 0.) {
              var output : TraceResult;
              output.one = noRay;
              output.two = noRay;
              output.ok  = 0;
  
              return output;   
            }

            ///////////////////////////////////
            var t:f32 = 0.0; 
            var minD:f32 = 1000.0; 
            var minPos: vec4<f32> = vec4<f32>(0.0);
            var indexSph: i32 = -1;
  
            var ra: f32 = 0.0;
            var iC = iCount;
            //Перебираем все сферы и ищем самую ближнюю сферу
            for (var i = 0; i < iC; i++) {
             
              t = sphIntersect(r.ori, r.dir, instansPosition[i], instansRadius[i]);
              if(t < minD && t > 0.0) {
                minD = t;
                indexSph = i;    
              }             
            } 
          
            if (minD > 999.0){ 
              var output : TraceResult;
              output.one = r;
              output.two = noRay;
              output.ok  = 0;
  
              return output;           
            }  
            var posSph: vec4<f32> = instansPosition[indexSph];
            var radiusSph:f32 = instansRadius[indexSph];
            
            //Рисуем самую ближнюю сферу 

            let opticalDensity:f32 = 1.5;
            //-- IN HIT       
            var hit: vec4<f32> = r.ori + minD * r.dir;
            var N: vec4<f32> = normalize(hit - posSph);
  
            var dirReflect: vec4<f32> =  reflect(r.dir,N);
            var dirRefract: vec4<f32> =  refract(r.dir,N,1.0/opticalDensity);

            //Fresnel
            let R0 : f32 = (opticalDensity - 1.0) / (opticalDensity + 1.0) *  (opticalDensity - 1.0) / (opticalDensity + 1.0);
            var reflectPower: f32 = R0 + (1.0 - R0) * pow(1.0 - abs(dot(r.dir,N)) ,5.0);
           
            //-- OUT HIT
            var outOrigin: vec4<f32> = hit + dirRefract * 10.0;
            var tOut:f32 = sphIntersect(outOrigin, -dirRefract, posSph, radiusSph);
            var outHit: vec4<f32> = outOrigin - tOut * dirRefract;
            var outN: vec4<f32> = normalize(posSph - outHit);
            var outDirRefract: vec4<f32> = refract(dirRefract,outN, opticalDensity / 1.0);
            
           
            if(dot(outDirRefract,outDirRefract) == 0.0){
              reflectPower = 1.0;
            }
            
            var refractPower: f32 = 1.0 - reflectPower;
           
            var decay: f32  = exp(-0.2 * distance(hit, outHit));

            let one : Ray = Ray(hit, dirReflect, reflectPower * r.power * 0.6);
            let two : Ray = Ray(outHit, outDirRefract, refractPower * r.power * 0.6 * decay);
           
            ///////////////////////////////////
            var output : TraceResult;
            output.one = one;
            output.two = two;
            output.ok  = 1;

            return output;
          }
        
   

          @fragment
          fn fragment_main(@builtin(position) coord : vec4<f32>, @location(0) fragUV : vec2<f32>) -> @location(0) vec4<f32> {
          
          var ro : vec4<f32> = vec4(cameraPosition, 1.0);
                  
          var color: vec4<f32> = vec4(fragUV.x * 2.0 - 1.0, 1.0 - fragUV.y * 2.0, 1.0, 1.0); // тут в z должна быть 1,0   
          var test: vec4<f32> = uMatrix.pMatrix * uMatrix.vMatrix * color; // Это удалить потом
            
          var targetPoint: vec4<f32> = uiMatrix.viMatrix * uiMatrix.piMatrix * color;
          var rd: vec4<f32> = normalize(vec4(targetPoint.xyz/targetPoint.w - ro.xyz,1.0));
                    
         

          var r:Ray = Ray(ro, rd, 1.0);
          let res: TraceResult = rayTrace(r);

          //-------------------------------shadow ----------------------------------------------//
          var ligthPos : vec4<f32> = vec4(25.0 , 50.0, 50.0, 1.0);
          var pointPos : vec4<f32> = res.one.ori;
          var pointDir : vec4<f32> = normalize(ligthPos - pointPos);
          
          var rLigth:Ray = Ray(pointPos - pointDir * 0.01, pointDir, 1.0);
          let resLigth: TraceResult = rayTrace(rLigth);   
              
          var shadow : f32 = 0.3; 
          if (resLigth.ok != 1){ 
            shadow = 1.0;        
          } 
        
          ///////////////////////////////////////////////////////////////////////////////////////


          // var colorReflect : vec4<f32> = textureSample(myTexture, mySampler, res.one.dir.xyz);
          // var colorRefract : vec4<f32> = textureSample(myTexture, mySampler, res.two.dir.xyz);
         
          //var colorFinal : vec4<f32>  = colorReflect * res.one.power + colorRefract * res.two.power;

          if (res.ok != 1){
            discard;
          }

          let res11: TraceResult = rayTrace(res.one);
          let res12: TraceResult = rayTrace(res.two);

          let res21: TraceResult = rayTrace(res11.one);
          let res22: TraceResult = rayTrace(res12.two);

          let res31: TraceResult = rayTrace(res21.one);
          let res32: TraceResult = rayTrace(res22.two);
         
          var green : vec4<f32> = vec4(0.0 , 1.0, 0.0, 1.0);
          var blue : vec4<f32> = vec4(0.0 ,0.5, 1.0, 1.0);
          var orange : vec4<f32> = vec4(1.0 ,0.5, 0.0, 1.0);
          var black : vec4<f32> = vec4(0.0 ,0.0, 0.0, 1.0);
        

          var colorFinal : vec4<f32>  =
          
          textureSample(myTexture, mySampler, res11.one.dir.xyz)  * res11.one.power * green +    
          textureSample(myTexture, mySampler, res11.two.dir.xyz)  * res11.two.power +

          textureSample(myTexture, mySampler, res12.one.dir.xyz) * res12.one.power + 
          textureSample(myTexture, mySampler, res12.two.dir.xyz) * res12.two.power +

          textureSample(myTexture, mySampler, res21.one.dir.xyz) * res21.one.power +  
          textureSample(myTexture, mySampler, res21.two.dir.xyz) * res21.two.power;

          // textureSample(myTexture, mySampler, res22.one.dir.xyz) * res22.one.power  +  
          // textureSample(myTexture, mySampler, res22.two.dir.xyz) * res22.two.power  + 

          // textureSample(myTexture, mySampler, res31.one.dir.xyz) * res31.one.power  +  
          // textureSample(myTexture, mySampler, res31.two.dir.xyz) * res31.two.power  + 

          // textureSample(myTexture, mySampler, res32.one.dir.xyz) * res32.one.power  +  
          // textureSample(myTexture, mySampler, res32.two.dir.xyz) * res32.two.power * 0.3; 

          colorFinal = colorFinal * shadow;
       
          
          
          //////////////////////////////////////////////////////////////////////////////////

          const gamma: f32 = 2.2;
          // exposure tone mapping
          var mapped : vec4<f32> = vec4(1.0) - exp(-colorFinal * 1.0);
          // gamma correction 
          mapped = pow(mapped, vec4(1.0 / gamma));
   

          return mapped;

       }`};