import { Mesh } from './Mesh.js';
import { Object3D } from './object3D.js';
import { Camera } from '../../common/camera/camera.js';

export class Scene {
  constructor(renderer) {
    
    this.device = renderer.device;
    this.context = renderer.context;
    this.format = renderer.format;
    this.canvas = renderer.canvas;
    
    this.camera = undefined;
    
    //this.pipelines = {};
    this.meshes = [];
   
    this.UNIFORM = {};
    this.LAYOUT = {}
    this.ASSETS = {}
    this.PIPELINES = {}

    this.RENDER_SETTINGS = {}

    this.time_old = 0;

    // this.countRenderBall = INSTANS_COUNT;
    // this.curent_ball = INSTANS_COUNT;
    // this.Ray = undefined;

    this.model = {};
    this.update = this.animate.bind(this);

    this.t = 0;
    this.inputTime = new Float32Array([0]);
  }

    add(object) {   
      if (object instanceof Object3D  ) { // Check if object is an instance of Object3D
        this.meshes.push(object);
      } else {
        console.error("Object is not an instance of Object");
      } 

    }


    async updateWorldMatrixAllMesh(){
        for (let i = 0; i < this.meshes.length; i++) {
            const mesh = this.meshes[i];
            if (mesh instanceof Object3D) {
            mesh.updateWorldMatrix();
            } else {
            console.error("Mesh is not an instance of Object3D");
            }
        }
    }

    async setCamera(camera) {
        if (camera instanceof Camera) {
            this.camera = camera;
        }
    }

async updateMeshBuffer(){
        for (let i = 0; i < this.meshes.length; i++) {
      const mesh = this.meshes[i];
      if (mesh instanceof Mesh) {
        await mesh.updateUniformBuffer(this.device);
      } else {
       // console.error("Mesh is not an instance of Mesh");
      }
    }
}
  
  async create() {
      

    for (let i = 0; i < this.meshes.length; i++) {
      const mesh = this.meshes[i];

        mesh.GPU_Buffers = await createBufferFromData(this.device, {
          vertices: mesh.geometry.vertices,
          uvs: mesh.geometry.uvs,
          normals: mesh.geometry.normals,
          indices: mesh.geometry.indices
        ,
        label: mesh.label
      });

      mesh.indexCount = mesh.geometry.indices.length;
      

      
    }
 
  
    // await createUniformData(this);
    // await createLayout(this);
    // await initPipeline(this,shader);  
    // //--------------------------------------------------- 
    // //pipelines
    // // const { pipeline : pipeline_Compute } = await initComputePipeline(this, shaderSim);
    // // const { pipeline : pipeline_Render } = await initRenderipeline(this, shaderMatCap);   
   
    // // this.pipelines.pipeline_Render = pipeline_Render;
    // // this.pipelines.pipeline_Compute = pipeline_Compute;
      
  }


  async initRenderSetting() {
    // //---INIT - RENDER SETTINGS
    // this.depthTexture = this.device.createTexture({
    //   size: [this.canvas.clientWidth * devicePixelRatio, this.canvas.clientHeight * devicePixelRatio, 1],
    //   format: "depth24plus",
    //   usage: GPUTextureUsage.RENDER_ATTACHMENT
    // });

    // this.renderPassDescription = {
    //   colorAttachments: [
    //     {
    //       view: undefined, //  Assigned later
    //       storeOp: "store", //ХЗ
    //       clearValue: { r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
    //       loadOp: 'clear',
    //     },],
    //   depthStencilAttachment: {
    //     view: this.depthTexture.createView(),
    //     depthLoadOp: "clear",
    //     depthClearValue: 1.0,
    //     depthStoreOp: "store",
    //     // stencilLoadValue: 0,
    //     // stencilStoreOp: "store"
    //   }
    // };
  }



  async animate(time) {
    

  }
}