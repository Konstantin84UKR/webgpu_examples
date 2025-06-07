import { Material } from './Material.js';
import { basicShaderSrc as phongShader } from '../shaders/phongShader.js';


export class PhongMaterial extends Material {
    
    static _layout = null;
    
    constructor(device, name = 'PhongMaterial') {
        super();
        this.name = name;
        this.shader = phongShader;
        this.uniforms = {
            diffuseColor: [1.0, 1.0, 1.0, 1.0], // RGBA
            specularColor: [1.0, 1.0, 1.0],
            shiniess: 32.0,
            ambientColor: [0.1, 0.1, 0.1, 1.0], // RGBA
           
            diffuseTexture: null
        };
        this.uniformBuffer = null;
        this.device = device;

        this.createUniformsBuffer(this.device);
        this.updateUniformsBuffer(this.device);
    }

    setDiffuseColor(color) {
        this.uniforms.diffuseColor = color;
        this.updateUniformsBuffer(this.device);
    }

    setSpecularColor(color) {
        this.uniforms.specularColor = color;
        this.updateUniformsBuffer(this.device);
    }

    setShiniess(shiniess) {
        this.uniforms.shiniess = shiniess;
        this.updateUniformsBuffer(this.device);
    }

    async createUniformsBuffer(device) {
        const uniformBuffer = device.createBuffer({
        size: 16+ 12 + 4 + 16, // 16 bytes for diffuseColor, 12 bytes for specularColor, 4 bytes for shiniess
        label: 'PhongMaterial Uniforms Buffer',        
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        }); 

        this.uniformBuffer = uniformBuffer;   
    }

    async updateUniformsBuffer(device) {
        const diffuseColor = this.uniforms.diffuseColor;
       
        const specularColor = this.uniforms.specularColor;
        const shiniess = this.uniforms.shiniess ;
       
        const ambientColor = this.uniforms.ambientColor ;
        

        device.queue.writeBuffer(this.uniformBuffer, 0, new Float32Array(diffuseColor));
        device.queue.writeBuffer(this.uniformBuffer, 16, new Float32Array(specularColor));
        device.queue.writeBuffer(this.uniformBuffer, 16+12, new Float32Array([shiniess]));  
        device.queue.writeBuffer(this.uniformBuffer, 0+16+12+4, new Float32Array(ambientColor));      
    }


    static async createBindGroupLayout(device){

        const entries = [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: 'filtering' }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: 'float', viewDimension: '2d' }
                }
            ]


        PhongMaterial._layout = device.createBindGroupLayout({
            label: 'PhongMaterial Bind Group Layout',
            entries: entries
        });
    }


    createBindGroup(device) {

         const entries = [   
          {
            binding: 0,
            resource:{
                buffer: this.uniformBuffer,
                offset: 0,
                size: this.uniformBuffer.size   
            }
          },
          { 
            binding: 1,
            resource: this.textures['diffuseTexture']?.sampler
            
          },
          {
            binding: 2,
            resource: this.textures['diffuseTexture']?.view
          }          
        ]


        this.bindGroup = device.createBindGroup({
        label: 'PhongMaterial Bind Group',
        // Use the static layout created earlier
        layout: PhongMaterial._layout,
        entries: entries
    });
    }
} 