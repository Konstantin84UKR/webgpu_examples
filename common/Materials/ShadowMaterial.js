import { Material } from './Material.js';
import { ShadowShader } from "../shaders/shaderShadowMap.js";
import { Camera } from '../camera/camera.js';


export class ShadowMaterial extends Material {

    static _layout = null;

    constructor(device,params) {
        super();
        this.name = params.name;
        this.device = device;
        this.depthTexture = null;
        this.clientWidth = params.clientWidth;
        this.clientHeight = params.clientHeight;

        this.shader = new ShadowShader();
      
        this.init();
        
    }

    async init(){
        await this.createDepthTexture();
        await this.shader.createShaderSrc(); 
        await this.createShadowPipeline(); 
    }  

    async createDepthTexture(){
        const depthTexture = this.device.createTexture({
            // size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
            size: [this.clientWidth, this.clientHeight, 1],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        }); 

        this.depthTexture = depthTexture;        
    }

    async createShadowPipeline(){

        
        const bindGroupLayout_shadowPipeline = this.device.createBindGroupLayout({
            label: 'bindGroupLayout_shadowPipeline',
            entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {}
            }]
        });

        const pipelineLayout_shadowPipeline = this.device.createPipelineLayout({
                bindGroupLayouts: [Camera._layout, bindGroupLayout_shadowPipeline]
            });


        const shadowPipeline = await this.device.createRenderPipeline({
        label: "shadow piplen",
        //layout: "auto",
        layout: pipelineLayout_shadowPipeline,
        vertex: {
            module: this.device.createShaderModule({
                code: this.shader.shaderSrc,
            }),
            entryPoint: "mainVertex",
            buffers: this.shader.vertexBuffers
        },
        primitive: {
            topology: "triangle-list",           
        },
        depthStencil: {
            format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
            depthWriteEnabled: true, //вкл\выкл теста глубины 
            depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. //greater
        }
    });  

        const renderPassDescriptionShadow = {
            colorAttachments: [],
            depthStencilAttachment: {
                view: this.depthTexture.createView(), // текстура глубины для формирования теней
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            }
        };
       
        this.renderPassDescriptionShadow = renderPassDescriptionShadow;
        this.pipeline = shadowPipeline;
        
    }
}