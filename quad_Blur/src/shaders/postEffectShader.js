export const postEffectShader = {
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
    output.Position = vec4(pos[VertexIndex], 0.0, 1.0);
    output.fragUV =  uv[VertexIndex];

        return output;
    }`,

    fragment: `
        @group(0) @binding(0) var mySampler : sampler;
        @group(0) @binding(1) var myTexture : texture_2d<f32>;

        @fragment
        fn fragment_main(@location(0) fragUV : vec2<f32>) -> @location(0) vec4<f32> {    
        
        var color:vec3<f32> = (textureSample(myTexture, mySampler, fragUV)).rgb;
        
        return  vec4<f32>(color, 1.0);
    }`};