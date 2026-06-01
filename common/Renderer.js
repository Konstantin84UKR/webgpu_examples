import { initWebGPU } from '../../common/initWebGPU.js';
import { Mesh } from './Mesh.js';
import { Object3D } from './object3D.js';

export class Renderer{
    constructor(device){
        this.device = device;
    }

    static async prerender(scene,camera){

        //await scene.prerender(); // Это просто контейнер тут не создаеться GPU ресурсы,
        // а только вызываються методы для создания GPU ресурсов в сцене
       
        const { device, context, format, canvas } = await initWebGPU(true)
       
        this.device = device;
        this.context = context;
        this.format = format;
        this.canvas = canvas;

        // тут создаються GPU ресурсы для сцены
        // например:

        this.scene = scene;
        this.meshes = scene.meshes;
        this.lights = scene.lights;
        this.objects = scene.objects;
        this.camera = camera;

        


        this.UNIFORM = {};
        this.LAYOUT = {}
        this.ASSETS = {}
        this.PIPELINES = {}

        this.RENDER_SETTINGS = {}




        // тут создаються GPU ресурсы для камеры
        // например:


        // тут создаються GPU ресурсы для рендера сцены
        // например:


        // тут создаються Pipeline , 
        // createShaderModule , 
        // BindGroupLayout , 
        // BindGroup , 
        // Buffers 

    }

    static async render(){
        // тут createCommandEncoder, 
        // beginRenderPass 
        // setPipeline 
        // setVertexBuffer 
        // setBindGroup 
        // drawIndexed 
        // renderPass.end();
        // device.queue.submit([commandEncoder.finish()]);
    }

      static async createBuffers() {
        for (let i = 0; i < this.meshes.length; i++) {
          const mesh = this.meshes[i];
          if (mesh instanceof Mesh) { // Check if mesh is an instance of Mesh
            await mesh.createBuffers(this.device);
            await mesh.createUniformBuffer(this.device);
           // await mesh.createBindGroupLayout(this.device);
            await mesh.createBindGroup(this.device);
          } else {
            console.error("Mesh is not an instance of Mesh");
          }
        }
    
        //LIGHT
        await DirectionalLight.createShadowMapTexArray(this.device,this.lights);   
        await DirectionalLight.createUniformBuffer(this.device,this.lights); 
        await DirectionalLight.createBindGroupLayout(this.device,this.lights);
        await DirectionalLight.createBindGroup(this.device,this.lights); 
        await DirectionalLight.loadDataOnBuffer(this.device,this.lights);
        
        
    
      }    
}