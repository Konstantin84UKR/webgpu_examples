import { Material } from './Material.js';
import { basicShaderSrc as phongShader } from '../shaders/phongShader.js';

export class PhongMaterial extends Material {
    constructor(name = 'PhongMaterial') {
        super();
        this.name = name;
        this.shader = phongShader;
        this.uniforms = {
            phongDiffuseColor: [1.0, 1.0, 1.0],
            phongSpecularColor: [1.0, 1.0, 1.0],
            phongShiniess: 32.0
        };
        
    }

    setDiffuseColor(color) {
        this.uniforms.phongDiffuseColor = color;
    }

    setSpecularColor(color) {
        this.uniforms.phongSpecularColor = color;
    }

    setShiniess(shiniess) {
        this.uniforms.phongShiniess = shiniess;
    }
} 