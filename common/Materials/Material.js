import {createTextureFromImage} from '../textureUtils.js';

export class Material {
    constructor(shader, uniforms = {}, textures = {}, name = 'default') {
        this.name = name;
        this.shader = shader;
        this.uniforms = uniforms;
        this.textures = textures;
    }

    setUniform(name, value) {
        this.uniforms[name] = value;
    }

    setTexture(name, texture) {
        this.textures[name] = texture;
    }

    getUniform(name) {
        return this.uniforms[name];
    }

    getTexture(name) {
        return this.textures[name];
    }

    async createTextureFromImage(device, name, param) { 
      
            this.textures[name] = await createTextureFromImage(device, param.src,{mips:param.mips ? param.mips : false,});
            this.textures[name].view = this.textures[name].createView();
            this.textures[name].sampler = device.createSampler({
                minFilter: param.sampler && param.sampler.minFilter ? param.sampler.minFilter : 'linear',
                magFilter: param.sampler && param.sampler.magFilter ? param.sampler.magFilter : 'linear',
                
                mipmapFilter: param.sampler && param.sampler.mipmapFilter ? param.sampler.mipmapFilter : 'nearest',  //nearest
                addressModeU: param.sampler && param.sampler.addressModeU ? param.sampler.addressModeU : 'repeat',
                addressModeV: param.sampler && param.sampler.addressModeV ? param.sampler.addressModeV : 'repeat',
            });

        
    }  
}