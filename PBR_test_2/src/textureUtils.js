//-------------------- TEXTURE ---------------------
  // //Создаем картинку и загрудаем в нее данные из файла
  // https://webgpufundamentals.org/webgpu/lessons/webgpu-textures.html
  // 
  //  1) Создаем текстуру из файла картинки 
  export async function createTextureFromImage(device, url, options) {
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
      usage: GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST | // мы можем писать данные в текстуру
        GPUTextureUsage.RENDER_ATTACHMENT, //// мы можем рендерить в текстуру
    });
    copySourceToTexture(device, texture, source, options);
    return texture;
  }
  //  4) вычисляем необходимое количество мип урочней
  const numMipLevels = (...sizes) => {
    const maxSize = Math.max(...sizes);
    return 1 + Math.log2(maxSize) | 0;
  };
  //  5) копируем данные из источника в текстуру (отправляем на GPU)
  function copySourceToTexture(device, texture, source, { flipY } = {}) {
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
            { binding: 1, resource: texture.createView({ baseMipLevel, mipLevelCount: 1 }) },
          ],
        });

        ++baseMipLevel;

        const renderPassDescriptor = {
          label: 'our basic canvas renderPass',
          colorAttachments: [
            {
              view: texture.createView({ baseMipLevel, mipLevelCount: 1 }),
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
