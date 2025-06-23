export const renderShader = {
    vertex: `
    struct Particle {
            pos : vec2<f32>
            // vel : vec2<f32>,
            // radius : vec4<f32>,
            }  

    struct uResolution {
            aspect : vec2<f32>,
            width  : f32,
            height : f32,
            }          
    
   
    @group(1) @binding(0) var<uniform> simResolution: uResolution;
    @group(0) @binding(0) var<storage, read> data:  array<Particle>; 

     struct VertexOutput {
        @builtin(position) Position : vec4<f32>,
        @location(0) color : vec3<f32>          
    }      

    @vertex
    fn vertex_main(
    @builtin(vertex_index) VertexIndex : u32 ,
    @builtin(instance_index) InstanceIndex : u32,
    ) -> VertexOutput{

      //let scale:f32 = data[InstanceIndex].radius[0];
      let scale:f32 = 0.005;
    
      let a:f32 = 1.0 * scale;
      let b:f32 = 0.71 * scale;  
      let c:f32 = 0.923 * scale;  
      let d:f32 = 0.382 * scale;  

      
    var pos = array<vec2<f32>, 6*4*2>(
          vec2( 0.0,  0.0), vec2( a, 0.0), vec2(c, d),
          vec2( 0.0,  0.0), vec2(c, d), vec2(b,  b),

          vec2( 0.0,  0.0), vec2(b,  b), vec2(d,  c),
          vec2( 0.0,  0.0), vec2(d,  c), vec2(0.0,  a),

          vec2( 0.0,  0.0), vec2( 0.0, a), vec2(-d, c),
          vec2( 0.0,  0.0), vec2(-d, c), vec2(-b, b),

          vec2( 0.0,  0.0), vec2(-b, b), vec2(-c, d),
          vec2( 0.0,  0.0), vec2(-c, d), vec2(-a,  0.0),


          vec2( 0.0,  0.0), vec2( -a, 0.0), vec2(-c, -d),
          vec2( 0.0,  0.0), vec2(-c, -d), vec2(-b, -b),

          vec2( 0.0,  0.0), vec2(-b, -b), vec2(-d, -c),
          vec2( 0.0,  0.0), vec2(-d, -c), vec2(0.0, -a),

          vec2( 0.0,  0.0), vec2(0.0, -a), vec2(d, -c),
          vec2( 0.0,  0.0), vec2(d, -c), vec2(b, -b),

          vec2( 0.0,  0.0), vec2(b, -b), vec2(c, -d),
          vec2( 0.0,  0.0), vec2(c, -d), vec2(a, 0.0),

      );

        //let lengthVelInstance = length(data[InstanceIndex].vel) * 1.0;
        
        var output : VertexOutput;

        let aspect = simResolution.width / simResolution.height;

        let VertexAspectScale : vec2<f32> = vec2<f32>(pos[VertexIndex].x * simResolution.aspect.x, 
                                                      pos[VertexIndex].y * simResolution.aspect.y);

        let VertexSimScale : vec2<f32> = vec2<f32>((data[InstanceIndex].pos[0] / simResolution.width),
                                                  (data[InstanceIndex].pos[1] / simResolution.height)) - 0.5; // -0.5 to center the NDC;
        let PaddingSimScale : f32 = 2.0;

        output.Position = vec4<f32>(VertexAspectScale.x + (VertexSimScale.x) * PaddingSimScale, // x
                                    VertexAspectScale.y + (VertexSimScale.y) * PaddingSimScale, // y
                                    0.0, 1.0); // zw  
     

        output.color = vec3(1.0, 0.5, 0.0);

        return output;
    }`,

    fragment: `
        @fragment
        fn fragment_main(@location(0) color : vec3<f32> ) -> @location(0) vec4<f32> {
        return vec4<f32>(color, 1.0);
    }`};