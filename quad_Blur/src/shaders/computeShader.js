export const computeShader = {
    compute:`
        struct Params {
           filterDim : i32,
           blockDim : u32,
        }
        struct Flip {
           value : u32,
        }           
          
        @group(0) @binding(1) var inputTex : texture_2d<f32>;
        @group(0) @binding(2) var outputTex : texture_storage_2d<rgba8unorm, write>;
        @group(0) @binding(3) var<uniform> flip : Flip;

        @group(1) @binding(0) var samp : sampler;
        @group(1) @binding(1) var<uniform> params : Params;

        var<workgroup> tile : array<array<vec3<f32>, 128>, 4>;
         
        @compute @workgroup_size(32,1) fn computeSomething(
           @builtin(global_invocation_id) id: vec3<u32>,
           @builtin(workgroup_id) WorkGroupID : vec3<u32>,
           @builtin(local_invocation_id) LocalInvocationID : vec3<u32>
        ) {
        

        //let filterDim : i32 = 80;
        //let blockDim : u32 = 128 - (80 - 1);

        let filterOffset = (params.filterDim - 1) / 2;

        let dims = vec2<i32>(textureDimensions(inputTex, 0));
        let baseIndex = vec2<i32>(WorkGroupID.xy * vec2(params.blockDim, 4) + LocalInvocationID.xy * vec2(4, 1)) - vec2(filterOffset, 0);

        //let dims = vec2<u32>(640,640);

        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
                var loadIndex = baseIndex + vec2(c, r);
                
                if (flip.value != 0) {
                    loadIndex = loadIndex.yx;
                }
    
                tile[r][4 * LocalInvocationID.x + u32(c)] = textureSampleLevel(
                    inputTex,
                    samp,
                    (vec2<f32>(loadIndex) + vec2<f32>(0.25, 0.25)) / vec2<f32>(dims),
                    0.0
                ).rgb;
            }
        }

        workgroupBarrier();


        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
                var writeIndex = baseIndex + vec2(c, r);
                
                if (flip.value != 0) {
                    writeIndex = writeIndex.yx;
                }
    
                let center = i32(4 * LocalInvocationID.x) + c;
                if (center >= filterOffset &&
                    center < 128 - filterOffset &&
                    all(writeIndex < dims)) {
                        var acc = vec3(0.0, 0.0, 0.0);
                        for (var f = 0; f < params.filterDim; f++) {
                            var i = center + f - filterOffset;
                            acc = acc + (1.0 / f32(params.filterDim)) * tile[r][i];
                        }
                        textureStore(outputTex, writeIndex, vec4(acc, 1.0));
                    }
                }
            }
        }


        //////////////////////////////////////////////////
        // TEST 
        // //let s = WorkGroupID.x;  //vec2<i32>
        // let i = id.x;
        // let j = id.y;
        // var uv:vec2<f32> = vec2(f32(i) / f32(dims.x), f32(j) / f32(dims.y));
        // var color:vec3<f32> = (textureSampleLevel(inputTex, samp, uv, 0.0)).rgb;
        
        // // let x = i; 
        // // let y = j; 
        // textureStore(outputTex, vec2<u32>(i,j), vec4( 1.0 - color, 1.0));                                              
          
        ` };