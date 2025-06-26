import { ShadowMaterial } from '../Materials/ShadowMaterial.js';
import {Camera} from '../camera/camera.js'

export class DirectionalLight {

    static _layout = null;

    constructor(device,lightColor, lightPosition) {
        this.device = device;
        this.lightColor = lightColor || [1.0, 1.0, 1.0, 1.0]; // RGBA=
        this.lightPosition = lightPosition || [0.0, 0.0, 0.0, 1.0]; // XYZ + W  
       
        this.type = new Uint32Array([0]); // 0 - directional, 1 - point, 2 - spot
        this.name = "DirectionalLight";    
        this.shadowMapUsing = false;
        this.cameraShadow = null;
        this.depthTextureView = null;

        this.layout = null;
        this.layoutMap = new Map();
        this.uniformBuffer = null;
        this.bindGroup = null; 
       // this.shadowMapUsing = false; 
        // if (this.shadowMapUsing) {
        //     this.shadowMapMaterial = new ShadowMaterial();
        // }
    }

     /**
     * @param {boolean} value
     */
    // set shadowMapUsing(value){
    //        this.shadowMapUsing = value;
    
    //        if(this._shadowMapUsing){    
    //         // this.createshadowMapMaterial();
    //        }
    
    //     }

    async createshadowMapMaterial(canvas){
           if(this.shadowMapUsing == false){    
             return;
           }

            let cameraShadow = new Camera(canvas);
            cameraShadow.ortho = true;
            cameraShadow.createBuffer(this.device);
            cameraShadow.createBindGroup(this.device);
            cameraShadow.setPosition(this.lightPosition);
            
            cameraShadow.updateBuffer(this.device);          
           
            this.cameraShadow = cameraShadow; 


          const shadowMapParams ={
                     name :"ShadowMaterial for DirectionalLight",
                     depthTexture : null,
                     clientWidth : 512,  //  Потом буду брать из глобальных настроек
                     clientHeight : 512,        
             }      
                    
    
    
           
      this.shadowMapMaterial = new ShadowMaterial(this.device,shadowMapParams); 

      this.depthTexture = this.shadowMapMaterial.depthTexture;
      this.depthTextureView = this.shadowMapMaterial.depthTexture.createView();
    }    

    async createBindGroupLayout(device) {
        if (!device) {
            console.error("Device is not defined");
            return;
        }
        let numBinding = -1;

        const entries = [];
        
        numBinding +=1
        const uniformLigth = {
            binding:numBinding,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {}
        }
        entries.push(uniformLigth);
        this.layoutMap.set('uniformLigth',numBinding);  

       if (this.shadowMapUsing) {

                numBinding +=1;

                const depthTextureView = {
                    binding: numBinding,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'depth',
                    }
                }
                entries.push(depthTextureView);
                this.layoutMap.set('depthTextureView',numBinding);  

                numBinding +=1;
                const comparisonDepth = {
                    binding: numBinding,
                    visibility: GPUShaderStage.FRAGMENT, 
                    sampler: {
                        type: 'comparison',
                    },
                }
                entries.push(comparisonDepth)
                this.layoutMap.set('comparisonDepth',numBinding);  

                numBinding +=1;

                const uniformShadow = {
                    binding: numBinding,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: 'uniform' }
                }

                entries.push(uniformShadow);
                this.layoutMap.set('uniformShadow',numBinding);        
            
        }

        DirectionalLight._layout = device.createBindGroupLayout({
            label: "directionalLight_UniformBuffer_Layout",
            entries: entries,
        });
    }

    async createBindGroup(device) {
        if (!device) {
            console.error("Device is not defined");
            return;
        }

        const entries = [];

        const uniformLigth = {
                    binding: this.layoutMap.get('uniformLigth'),
                    resource: {
                        buffer: this.uniformBuffer,
                        offset: 0,
                        size: this.uniformBuffer.size
                    }
                }  
        entries.push(uniformLigth);        
                

        if (this.shadowMapUsing) {
            
            const depthTextureView = {
                binding:  this.layoutMap.get('depthTextureView'),
                resource: this.depthTextureView
            };
            entries.push(depthTextureView); 
            
            const sampler = device.createSampler({
                    label : 'sampler for shadowMap',
                    compare: 'less',
                })

            const comparisonDepth = {
                binding: this.layoutMap.get('comparisonDepth'),
                resource: sampler
            }
            entries.push(comparisonDepth);

            const uniformShadow = {
                binding: this.layoutMap.get('uniformShadow'),
                resource:{
                        buffer: this.cameraShadow.uniformBuffer,
                        offset: 0,
                        size: this.cameraShadow.uniformBuffer.size
                    }
            }
            entries.push(uniformShadow);
        }        


        this.bindGroup = device.createBindGroup({
            label: "directionalLight_BindGroup",
            layout: DirectionalLight._layout,
            entries: entries
        });
    }

    async createUniformBuffer(device) {
        if (!device) {
            console.error("Device is not defined");
            return;
        }

        this.uniformBuffer = device.createBuffer({
            label: "directionalLight_UniformBuffer",
            size: 64, // 16 * 4 bytes for a 4x4 matrix
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }
}


