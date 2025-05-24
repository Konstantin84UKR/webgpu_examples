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
}