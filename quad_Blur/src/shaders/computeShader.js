// Этот шейдер размывает входную текстуру в одном направлении, в зависимости от того,
// |перевернуть.значение| равно 0 или 1.
// Это достигается путем запуска (128/4) потоков на рабочую группу для загрузки 128
// текселы в 4 строки общей памяти. Каждый поток загружает
// блок текселей 4 x 4, чтобы использовать преимущества выборки текстур
// аппаратное обеспечение.
// Затем каждый поток вычисляет результат размытия, усредняя значения соседних текселей
// в общей памяти.
// Поскольку мы работаем с подмножеством текстуры, мы не можем вычислить все
// результат, поскольку не все соседи доступны в общей памяти.
// В частности, с тайлами 128 x 128 мы можем только вычислять и записывать
// квадратные блоки размером 128 - (filterSize - 1). Вычисляем количество блоков
// необходимо в Javascript и отправьте эту сумму.

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
        

        //let filterDim : i32 = 20;
        //let blockDim : u32 = 128 - (20 - 1);  // 109

        let filterOffset = (params.filterDim - 1) / 2; // (20 - 1) / 2 = 9.5 =>(9):i32

        let dims = vec2<i32>(textureDimensions(inputTex, 0)); // Разришение текстуры
        // baseIndex  
        let baseIndex = vec2<i32>(WorkGroupID.xy * vec2(params.blockDim, 4) + LocalInvocationID.xy * vec2(4, 1)) - vec2(filterOffset, 0);

      
        //     1 поток      2 поток       3 поток          32 поток 
        //(LocalInvocationID)          X = baseIndex
        // r1 |0 0 0 0|    |0 0 0 0|     |X 0 0 0|        |0 0 0 0|   всего 128 ячейки (WorkGroupID)
        // r2 |0 0 0 0|    |0 0 0 0|     |0 0 0 0|   =>   |0 0 0 0|
        // r3 |0 0 0 0|    |0 0 0 0|     |0 0 0 0|        |0 0 0 0|
        // r4 |0 0 0 0|    |0 0 0 0|     |0 0 0 0|        |0 0 0 0|

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