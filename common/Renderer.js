export class Renderer{
    constructor(device){
        this.device = device;
    }

    async prerender(scene,camera){

        await scene.prerender();

        // тут создаються Pipeline , 
        // createShaderModule , 
        // BindGroupLayout , 
        // BindGroup , 
        // Buffers 

    }

    async render(){
        // тут createCommandEncoder, 
        // beginRenderPass 
        // setPipeline 
        // setVertexBuffer 
        // setBindGroup 
        // drawIndexed 
        // renderPass.end();
        // device.queue.submit([commandEncoder.finish()]);
    }


    
}