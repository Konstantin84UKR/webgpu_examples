
import {
  mat4, vec3, vec4
} from '../../common/wgpu-matrix.module.js';;

// import { initWebGPU } from '../../common/initWebGPU.js';

// import { RADIUS, INSTANS_COUNT, DEBAG_INDEX } from './settings.js';
import { createBufferFromData } from './createBufferFromData.js';
import { updateUniformBuffer,createUniformData} from './uniformData.js';
import { initPipeline} from './initPipeline.js';
import { createLayout} from './createLayout.js';

const shader = {
  vertex: `
  struct Camera {
   pMatrix : mat4x4<f32>,
   vMatrix : mat4x4<f32>,
  };

  struct Uniforms {
    mMatrix : mat4x4<f32>,         
  };

  @binding(0) @group(0) var<uniform> camera : Camera;
  @binding(1) @group(0) var<uniform> uniforms : Uniforms;
     
  struct Output {
      @builtin(position) Position : vec4<f32>,
      @location(0) vPosition : vec4<f32>,
      @location(1) vUV : vec2<f32>,
      @location(2) vNormal : vec4<f32>,
  };

  @vertex
    fn main(@location(0) pos: vec4<f32>, @location(1) uv: vec2<f32>, @location(2) normal: vec3<f32>) -> Output {
       
        var output: Output;
        output.Position = camera.pMatrix * camera.vMatrix * uniforms.mMatrix * pos;
        output.vUV = uv * 1.0;
        output.vNormal   =  uniforms.mMatrix * vec4<f32>(normal,1.0);

        return output;
    }
`,

  fragment: `     
  @binding(0) @group(1) var textureSampler : sampler;
  @binding(1) @group(1) var textureData : texture_2d<f32>;   

  struct Uniforms {
    eyePosition : vec4<f32>,
    lightPosition : vec4<f32>,       
  };
  @binding(2) @group(1) var<uniform> uniforms : Uniforms;

  @fragment
  fn main(@builtin(front_facing) is_front: bool,@location(0) vPosition: vec4<f32>, @location(1) vUV: vec2<f32>, @location(2) vNormal:  vec4<f32>) -> @location(0) vec4<f32> {
    
    let specularColor:vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);

    let textureColor:vec3<f32> = (textureSample(textureData, textureSampler, vUV)).rgb;
  
    let N:vec3<f32> = normalize(vNormal.xyz);
    let L:vec3<f32> = normalize((uniforms.lightPosition).xyz - vPosition.xyz);
    let V:vec3<f32> = normalize((uniforms.eyePosition).xyz - vPosition.xyz);
    let H:vec3<f32> = normalize(L + V);
  
    let diffuse:f32 = 1.0 * max(dot(N, L), 0.0);
    let specular = pow(max(dot(N, H),0.0),50.0);
    let ambient:vec3<f32> = vec3<f32>(0.3, 0.4, 0.5);
  
    //var finalColor:vec3<f32> =  textureColor * (diffuse + ambient) + specularColor * specular; 

    var finalColor:vec3<f32> =  textureColor; 

    //finalColor = textureColor; 
    
    if(is_front){
       return vec4<f32>(finalColor, 1.0);
    }else {
       return vec4<f32>(1.0,0.0,0.0, 1.0);
    }   
    
}
`,
};


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
 
  
    await createUniformData(this);
    await createLayout(this);
    await initPipeline(this,shader);  
    //--------------------------------------------------- 
    //pipelines
    // const { pipeline : pipeline_Compute } = await initComputePipeline(this, shaderSim);
    // const { pipeline : pipeline_Render } = await initRenderipeline(this, shaderMatCap);   
   
    // this.pipelines.pipeline_Render = pipeline_Render;
    // this.pipelines.pipeline_Compute = pipeline_Compute;
      
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

    // //-----------------TIME-----------------------------
    // let dt = time - this.time_old;
    // this.time_old = time;
    // this.device.queue.writeBuffer(this.UNIFORM.SIM.bufferUniform, 0, new Float32Array([dt * 0.005]));

    // //--------------SIMULATION--------------------------    
    // // this.physicsScene.HashTable.fillHashTable(this.physicsScene);
    // // this.clearBallColorForDebag();

    // // for (let i = 0; i < INSTANS_COUNT; i++) {

    // //   let ball = simulation(i, dt, this.physicsScene.balls, this);

    // //   this.model.Sphere1.MODELMATRIX = mat4.translate(mat4.identity(), ball.position);
    // //   this.model.Sphere1.MODELMATRIX_ARRAY.set(this.model.Sphere1.MODELMATRIX, (i) * (16 + 4));

    // //   if (i == DEBAG_INDEX) {
    // //     this.model.Sphere1.MODELMATRIX_ARRAY.set(vec4.set(0.0, 0.0, 1.0, 1.0), (i) * (16 + 4) + 16);
    // //   }

    // // }

    // // this.physicsScene.HashTable.clearHashSet();
    // //--------------------------------------------------
    // //SIM Shader
    // this.inputTime[0] = dt;
    // updateSimBuffer(this,this.inputTime);
    // //Encode commands to do the computation
    // const commandEncoder_compute =  this.device.createCommandEncoder({
    //   label: 'doubling encoder',
    // });

    // const computePass = commandEncoder_compute.beginComputePass({
    //   label: 'doubling compute pass',
    // });
    // const computepPipeline =  this.pipelines.pipeline_Compute;
    // computePass.setPipeline(computepPipeline);
    // computePass.setBindGroup(0,computepPipeline.bindGroupsCompute[this.t % 2].bindGroup);
    // computePass.setBindGroup(1,computepPipeline.bindGroupsCompute[2].bindGroupUniform);
    // computePass.setBindGroup(2,computepPipeline.BINDGROUP.bindGroupCurrentBall);
    // computePass.dispatchWorkgroups(Math.ceil(INSTANS_COUNT / 64));
    // computePass.end();

    // commandEncoder_compute.copyBufferToBuffer(computepPipeline.bindGroupsCompute[this.t % 2].buffer, 0, this.UNIFORM.SIM.resultBuffer, 0, this.UNIFORM.SIM.resultBuffer.size);

    // this.device.queue.submit([commandEncoder_compute.finish()]);

    // // Read the results
    // await this.UNIFORM.SIM.resultBuffer.mapAsync(GPUMapMode.READ);
    // let result = new Float32Array(this.UNIFORM.SIM.resultBuffer.getMappedRange().slice());
    // this.UNIFORM.SIM.resultBuffer.unmap();
    // //console.log('result', result);

    // //--------------------------------------------------

    // this.camera.setDeltaTime(dt);
    // await updateUniformBuffer(this, this.camera);

    // const commandEncoder = this.device.createCommandEncoder();
    // const textureView = this.context.getCurrentTexture().createView();
    // this.renderPassDescription.colorAttachments[0].view = textureView;

    // const renderPass = commandEncoder.beginRenderPass(this.renderPassDescription);

    // renderPass.setPipeline(this.pipelines.pipeline_Render);

    // //Sphere1
    // renderPass.setVertexBuffer(0, this.model.Sphere1.sphereByffers.vertexBuffer);
    // renderPass.setVertexBuffer(1, this.model.Sphere1.sphereByffers.uvBuffer);
    // renderPass.setVertexBuffer(2, this.model.Sphere1.sphereByffers.normalBuffer);
    // renderPass.setIndexBuffer(this.model.Sphere1.sphereByffers.indexBuffer, "uint32");
    // renderPass.setBindGroup(0, this.UNIFORM.BINDGROUP.uniformBindGroup_Camera);
    // renderPass.setBindGroup(1, this.UNIFORM.BINDGROUP.uniformBindGroup_Ball);
    // renderPass.setBindGroup(2, computepPipeline.bindGroupsCompute[this.t % 2].bindGroup);
    // renderPass.drawIndexed(this.model.Sphere1.geometry.index.length, this.countRenderBall, 0, 0, 0);

    // // //Plane1
    // // renderPass.setVertexBuffer(0, this.model.Plane1.planeByffers.vertexBuffer);
    // // renderPass.setVertexBuffer(1, this.model.Plane1.planeByffers.uvBuffer);
    // // renderPass.setVertexBuffer(2, this.model.Plane1.planeByffers.normalBuffer);
    // // renderPass.setIndexBuffer(this.model.Plane1.planeByffers.indexBuffer, "uint32");
    // // renderPass.setBindGroup(0, this.UNIFORM.BINDGROUP.uniformBindGroup_Camera);
    // // renderPass.setBindGroup(1, this.UNIFORM.BINDGROUP.uniformBindGroup_Plane);
    // // renderPass.drawIndexed(this.model.Plane1.geometry.index.length);

    // renderPass.end();
    // this.device.queue.submit([commandEncoder.finish()]);

    // ++this.t;

    // window.requestAnimationFrame(this.update);

  }
}