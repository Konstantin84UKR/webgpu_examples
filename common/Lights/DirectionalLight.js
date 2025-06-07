export class DirectionalLight {

    static _layout = null;

    constructor(lightColor, lightPosition) {
        this.lightColor = lightColor || [1.0, 1.0, 1.0, 1.0]; // RGBA=
        this.lightPosition = lightPosition || [0.0, 0.0, 0.0, 1.0]; // XYZ + W  
        this.uniformBuffer = null;
        this.bindGroup = null;  
        this.type = new Uint32Array([0]); // 0 - directional, 1 - point, 2 - spot
        this.name = "DirectionalLight";     
    }

    async createBindGroupLayout(device) {
        if (!device) {
            console.error("Device is not defined");
            return;
        }

        DirectionalLight._layout = device.createBindGroupLayout({
            label: "directionalLight_UniformBuffer_Layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {}
                }
            ],
        });
    }

    async createBindGroup(device) {
        if (!device) {
            console.error("Device is not defined");
            return;
        }

        this.bindGroup = device.createBindGroup({
            label: "directionalLight_BindGroup",
            layout: DirectionalLight._layout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer,
                        offset: 0,
                        size: this.uniformBuffer.size
                    }
                }
            ]
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


