export class RenderPipeline{
    constructor(device,settings = {}) {
       
        this.device = device;  
        this.material = settings.material || null;
        this.textures = null;
        this.pipelineLayout = settings.pipelineLayout || null;
        this.renderPasses = null;
        
        this.entryPointVertex = 'mainVertex';
        this.entryPointFragment = 'mainFragment';
        
        this.format = settings.format || 'rgba8unorm';
        this.primitiveTopology = settings.primitiveTopology || 'triangle-list';
        this.cullMode = settings.cullMode || 'back';
       
        this.depthStencilFormat = settings.depthStencilFormat || "depth24plus" ; //'depth24plus-stencil8'
        this.depthWriteEnabled = settings.depthWriteEnabled !== undefined ? settings.depthWriteEnabled : true;
        this.depthCompare = settings.depthCompare || 'less';
        this.depthTexture = settings.depthTexture || null;
        this.stencilFront = settings.stencilFront || { compare: 'always', failOp: 'keep', depthFailOp: 'keep', passOp: 'replace' };
       
        this.frontFace = settings.frontFace || 'ccw';
        this.blendEnabled = settings.blendEnabled !== undefined ? settings.blendEnabled : false;
        this.renderers = [];

        this.shaderModule = null;

        this.isShadowMap = false;

        this.createRenderPipeline();
    }

    async createShaderModule() {

        if(this.material.shader.shaderSrc === "") {
            await this.material.getshaderSrc();
        }

        const shaderSrc  = this.material.shader.shaderSrc;

        this.shaderModule =  this.device.createShaderModule({
            code: shaderSrc,
            constants: {
                // ambientColor: 'vec3<f32>(0.9, 0.1, 0.1);', // Цвет окружающего света
            },
        });
    }

    async createRenderPipeline() {

      if (!this.shaderModule) {
        await this.createShaderModule();
      }  
      
      this.pipeline = this.device.createRenderPipeline({
      label: this.material.label + '_Pipeline',
      layout: this.pipelineLayout,
      
      vertex: {
        module: this.shaderModule,
        entryPoint: this.material.shader.vertexEntryPoint,
        buffers: this.material.shader.vertexBuffers
      },
      
      fragment: {
        module: this.shaderModule,
        entryPoint: this.material.shader.fragmentEntryPoint,
        targets: [
          {
            format: this.format,
          },
        ],
      },
      primitive: {
        topology: this.primitiveTopology,//"triangle-list", //"line-list" "point-list"
        //cullMode: 'back',  //'back'  'front'  
        frontFace: this.frontFace //'ccw' //'ccw' 'cw'
      },
      depthStencil:{
        format:  this.depthStencilFormat, //  "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
        depthWriteEnabled: this.depthWriteEnabled, //вкл\выкл теста глубины 
        depthCompare: this.depthCompare //"less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
    }
    });

    return this.pipeline;

    }
}