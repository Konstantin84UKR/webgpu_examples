import { Material } from './Material.js';
//import { basicShaderSrc as phongShader } from '../shaders/phongShader.js';
import { PhongShader } from '../shaders/phongShader.js';
import { Buffer } from '../Buffer.js';

export class PhongMaterial extends Material {

    static _layout = null;

    constructor(device, name = 'PhongMaterial') {
        super();
        this.name = name;
        this.device = device;

         this.uniformBuffer = null; 

        this.diffuseColor = [1.0, 1.0, 1.0, 1.0], // RGBA
        this.specularColor = [1.0, 1.0, 1.0],
        this.shiniess = 32.0,
        this.ambientColor = [0.25, 0.3, 0.35, 1.0], // RGBA           
        this.diffuseTexture = null

        this.cameraUniform = false;
        this.materialUniform = true;
        
        this.shadowMap = true;
        this.softShadow = true;

        this.layout = null;
        this.layoutMap = new Map();
        this.bindGroupDiscription = [];
        this.shadowMapUsing = false;

        this.uniforms = {

            diffuseColor: this.diffuseColor, // RGBA
            specularColor: this.specularColor,
            shiniess: this.shiniess,
            ambientColor: this.ambientColor, // RGBA           
            diffuseTexture: this.diffuseTexture,
            shadowMap: this.shadowMap,
            softShadow: this.softShadow,
            layoutMap: this.layoutMap,
            shadowMapUsing : this.shadowMapUsing
        };
       
        this.setBuffer();

        this.shader = new PhongShader(this.uniforms);
    }

    async setBuffer(){
       await  this.createUniformsBuffer(this.device);
       await  this.updateUniformsBuffer(this.device);
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
       
        const size = 16 + 12 + 4 + 16;  // 16 bytes for diffuseColor, 12 bytes for specularColor, 4 bytes for shiniess  
        const label = 'PhongMaterial Uniforms Buffer';
        const  usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
       
        this.uniformBuffer = await Buffer.createUniformBuffer(device,size,label,usage);;
    }

    async updateUniformsBuffer(device) {

        const diffuseColor = this.uniforms.diffuseColor;
        const specularColor = this.uniforms.specularColor;
        const shiniess = this.uniforms.shiniess;
        const ambientColor = this.uniforms.ambientColor;

        device.queue.writeBuffer(this.uniformBuffer, 0, new Float32Array(diffuseColor));
        device.queue.writeBuffer(this.uniformBuffer, 16, new Float32Array(specularColor));
        device.queue.writeBuffer(this.uniformBuffer, 16 + 12, new Float32Array([shiniess]));
        device.queue.writeBuffer(this.uniformBuffer, 0 + 16 + 12 + 4, new Float32Array(ambientColor));
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

    async createBindGroupLayout(device) {

        let numBinding = -1;
        
        const entries = [];

        if (this.materialUniform) {
            numBinding += 1;
            //this.materialUniform.numBinding = numBinding;

            const numMaterialUniformBinding = {
                binding: numBinding,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }
            }

            entries.push(numMaterialUniformBinding);
            this.layoutMap.set('materialUniform', numBinding);
        }

        if (this.diffuseTexture != null) {

            numBinding += 1;

           // this.diffuseTextureSampler.numBinding = numBinding;
            const diffuseTextureEntriessampler =
            {
                binding: numBinding,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: { type: 'filtering' }
            }

            entries.push(diffuseTextureEntriessampler);
              this.layoutMap.set('diffuseTextureSampler',numBinding);
        }

        if (this.diffuseTexture != null) {

            numBinding += 1;
           // this.diffuseTexture.sampler.numBinding = numBinding;

            const diffuseTextureEntriesview =
            {
                binding: numBinding,
                visibility: GPUShaderStage.FRAGMENT,
                texture: { sampleType: 'float', viewDimension: '2d' }
            }

            entries.push(diffuseTextureEntriesview);
            this.layoutMap.set('diffuseTextureEntriesview', numBinding);
        }

        if (this.cameraUniform) {
            numBinding += 1;

            //this.cameraUniform.numBinding = numBinding;

            const numCameraBinding = {
                binding: numBinding,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }
            }
            entries.push(numCameraBinding);
            this.layoutMap.set('cameraUniform',numBinding);
        }

        this.layout = device.createBindGroupLayout({
            label: 'PhongMaterial Bind Group Layout',
            entries: entries
        });
    }

    async createBindGroup(device) {

        if (!this.layout) {
            await this.createBindGroupLayout(device);
        }


        const entries = [];

        if (this.materialUniform) {
          
            const numMaterialUniformBinding = {
                binding: this.layoutMap.get('materialUniform'),
                resource: {
                    buffer: this.uniformBuffer,
                    offset: 0,
                    size: this.uniformBuffer.size
                }
            }

            entries.push(numMaterialUniformBinding); 
         }

        if (this.diffuseTexture != null) {

            const diffuseTextureEntriessampler =
            {
                binding: this.layoutMap.get('diffuseTextureSampler'),
                resource: this.diffuseTexture?.sampler

            }
           entries.push(diffuseTextureEntriessampler); 
        }

         if (this.diffuseTexture != null) {
            const diffuseTextureEntriesview =
            {
                binding: this.layoutMap.get('diffuseTextureEntriesview'),
                resource: this.diffuseTexture?.view
            }

            
            entries.push(diffuseTextureEntriesview);
         }

        this.bindGroup = device.createBindGroup({
            label: 'PhongMaterial Bind Group',
            // Use the static layout created earlier
            layout: this.layout,
            entries: entries
        });
    }

    async getshaderSrc() {


        this.shader.color = this.uniforms.diffuseColor;
        this.shader.specularColor = this.uniforms.specularColor;
        this.shader.shiniess = this.uniforms.shiniess;
        this.shader.ambientColor = this.uniforms.ambientColor;
        this.shader.diffuseTexture = this.diffuseTexture || null;
        this.shader.shadowMap = this.diffuseTexture || null;
        this.shader.shadowMapUsing = this.shadowMapUsing || false;
        this.shader.softShadow  = this.softShadow;
        
        await this.shader.createShaderSrc();

        return this.shader.shaderSrc;
    }

    async destroy() {
        if (this.uniformBuffer) {
            this.uniformBuffer.destroy();
            this.uniformBuffer = null;
        }
        if (this.bindGroup) {
            this.bindGroup.destroy();
            this.bindGroup = null;
        }
        if (this.shader) {
            await this.shader.destroy();
            this.shader = null;
        }
    }


    
} 