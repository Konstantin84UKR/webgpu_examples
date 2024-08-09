export async function createLayout(scene){
   
   
    scene.LAYOUT.cameraLayout = scene.device.createBindGroupLayout({
        label: 'cameraLayout',
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {},
          }
        ],
      });

      scene.LAYOUT.phongShader = scene.device.createBindGroupLayout({
        label: 'phongShaderLayout',
        entries: [
          {
                binding: 0,
                visibility: GPUShaderStage.VERTEX ,
                buffer: {},
           },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            buffer: {},
          }
        ],
      });  
      
      
      scene.LAYOUT.phongShaderTexture = scene.device.createBindGroupLayout({
        label: 'phongShaderTextureLayout',
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {},
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {},
          },
          {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {},
          }
        ],
      });  
}