
import {
  mat4, vec3, vec4
} from './wgpu-matrix.module.js';

import { initWebGPU } from '../../common/initWebGPU.js';

import { shaderMatCap } from './shaders/shaderMatCap.js';
import { shaderSim } from './shaders/shaderSim.js';

import { BoxGeometry } from '../../common/primitives/BoxGeometry.js';
import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { RADIUS, INSTANS_COUNT, DEBAG_INDEX } from './settings.js';
import { createBufferFromData } from './createBufferFromData.js';
import { updateUniformBuffer,createUniformData } from './uniformData.js';
import { simulation } from './simulation.js';
import { Mesh } from './Mesh.js';
import { Ray } from './Ray.js';
import { Camera } from '../../common/camera/camera.js';

import { initPipeline as initComputePipeline } from './simulation/initPipeline.js';
import { initPipeline as initRenderipeline } from './renderPipeline/initPipeline.js';

import { createSimBuffer , initSimBuffer} from './simulation/createSimBuffer.js';



export class Scene {
  constructor(physicsScene) {
    this.asset = {}
    this.device = undefined;
    this.context = undefined;
    this.format = undefined;
    this.canvas = undefined;
    this.camera = undefined;
    this.pipelines = {};
    this.physicsScene = physicsScene;
  
    this.UNIFORM = {
      BINDGROUP: {},
      SIM: {},
    };
    this.LAYOUT = {}

    this.RENDER_SETTINGS = {}

    this.time_old = 0;
    this.countRenderBall = 0;
    this.curent_ball = 0;
    this.Ray = undefined;

    this.model = {};
    this.update = this.animate.bind(this);

    this.t = 0;
  }

  async preloader() {
    //LOAD;  
    let img = new Image();
    img.src = './res/green.jpg'; //'./res/matcap8.jpg';
    await img.decode();

    const imageBitmap = await createImageBitmap(img);

    this.asset.imageBitmap = imageBitmap;

  }
  
  async create() {

    //INIT
    const { device, context, format, canvas } = await initWebGPU(false);
    this.device = device;
    this.context = context;
    this.format = format;
    this.canvas = canvas;

    //---------------------------------------------------
    //Uniform
    this.camera = new Camera(this.canvas, vec3.create(0.0, 50.0, 100.0), vec3.create(0.0, -0.3, -1.0));
    this.ray = new Ray(this.camera.eye, this.camera.front, this.canvas, this.camera);
    await createUniformData(this);
    //---------------------------------------------------
    //MESH       

    const meshGeometry = new SphereGeometry(RADIUS);
    this.model.Sphere1 = new Mesh("Sphere1", meshGeometry, INSTANS_COUNT, (4 * 4 + 4))

    this.model.Sphere1.sphereByffers = await createBufferFromData(this.device, {
      vertex: this.model.Sphere1.geometry.vertex,
      uv: this.model.Sphere1.geometry.uv,
      normal: this.model.Sphere1.geometry.normal,
      index: this.model.Sphere1.geometry.index,
      label: this.model.Sphere1.label
    });

    for (let i = 0; i < INSTANS_COUNT; i++) {
      this.model.Sphere1.MODELMATRIX = mat4.identity();
      this.model.Sphere1.MODELMATRIX = mat4.translate(this.model.Sphere1.MODELMATRIX, this.physicsScene.balls[i].position);
      this.model.Sphere1.MODELMATRIX_ARRAY.set(this.model.Sphere1.MODELMATRIX, (i) * (16 + 4));
      this.model.Sphere1.MODELMATRIX_ARRAY.set(vec4.set(0.5, 0.5, 0.5, 0.5), (i) * (16 + 4) + 16);
    }

    //---------------------------------------------------
    const meshPlane = new BoxGeometry(1, 1, 1, 1, 1, 1);
    this.model.Plane1 = new Mesh("Plane1", meshPlane);

    this.model.Plane1.planeByffers = await createBufferFromData(this.device, {
      vertex: this.model.Plane1.geometry.vertex,
      uv: this.model.Plane1.geometry.uv,
      normal: this.model.Plane1.geometry.normal,
      index: this.model.Plane1.geometry.index,
      label: this.model.Plane1.label
    });

    this.model.Plane1.MODELMATRIX = mat4.scale(this.model.Plane1.MODELMATRIX, vec3.set(50, 0.1, 50));
    
    //---------------------------------------------------
    // SIM
    this.dataForBufferSim = new Float32Array(INSTANS_COUNT * (4+4+4))  //Pos - PosOLD - Vel
    for (let i = 0; i < INSTANS_COUNT; i++) {

        const ball = this.physicsScene.balls[i];
        const indexCurrentBall = 4*4*4 * i ;
        const offsetPos = 0;
        const offsetPosOld = 4;
        const offsetVel = 4+4;
        //Pos
        this.dataForBufferSim[indexCurrentBall + 0 + offsetPos] = 1;
        this.dataForBufferSim[indexCurrentBall + 1 + offsetPos] = 2;
        this.dataForBufferSim[indexCurrentBall + 2 + offsetPos] = 3;
        this.dataForBufferSim[indexCurrentBall + 3 + offsetPos] = 100.1; //offset

        //PosOLD
        this.dataForBufferSim[indexCurrentBall + 0 + offsetPosOld] = 5;
        this.dataForBufferSim[indexCurrentBall + 1 + offsetPosOld] = 6;
        this.dataForBufferSim[indexCurrentBall + 2 + offsetPosOld] = 7;
        this.dataForBufferSim[indexCurrentBall + 3 + offsetPosOld] = 200.2; //offset

        //Vel
        this.dataForBufferSim[indexCurrentBall + 0 + offsetVel] = 9;
        this.dataForBufferSim[indexCurrentBall + 1 + offsetVel] = 10;
        this.dataForBufferSim[indexCurrentBall + 2 + offsetVel] = 11;
        this.dataForBufferSim[indexCurrentBall + 3 + offsetVel] = 300.3; //offset
    }
     
    await createSimBuffer(this);
    await initSimBuffer(this,this.dataForBufferSim); 
       
    //--------------------------------------------------- 
    //pipelines
    const { pipeline : pipeline_Compute } = await initComputePipeline(this, shaderSim);
    const { pipeline : pipeline_Render } = await initRenderipeline(this, shaderMatCap);   
   
    this.pipelines.pipeline_Render = pipeline_Render;
    this.pipelines.pipeline_Compute = pipeline_Compute;
      
  }


  async updateDebagColor(balls, color) {
    for (let i = 0; i < balls.length; i++) {
      let ball = balls[i]
      if (ball.id != DEBAG_INDEX) {
        this.model.Sphere1.MODELMATRIX_ARRAY.set(color, (ball.id) * (16 + 4) + 16);
      }
    }
  }

  async initRenderSetting() {
    //---INIT - RENDER SETTINGS
    this.depthTexture = this.device.createTexture({
      size: [this.canvas.clientWidth * devicePixelRatio, this.canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });

    this.renderPassDescription = {
      colorAttachments: [
        {
          view: undefined, //  Assigned later
          storeOp: "store", //ХЗ
          clearValue: { r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
          loadOp: 'clear',
        },],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthLoadOp: "clear",
        depthClearValue: 1.0,
        depthStoreOp: "store",
        // stencilLoadValue: 0,
        // stencilStoreOp: "store"
      }
    };
  }

  clearBallColorForDebag() {
    for (let i = 0; i < this.physicsScene.balls.length; i++) {
      this.model.Sphere1.MODELMATRIX_ARRAY.set(vec4.set(1.0, 1.0, 1.0, 1.0), (i) * (16 + 4) + 16);
    }
  }

  async animate(time) {

    //-----------------TIME-----------------------------
    let dt = time - this.time_old;
    this.time_old = time;
    this.device.queue.writeBuffer(this.UNIFORM.SIM.bufferUniform, 0, new Float32Array([dt * 0.005]));

    //--------------SIMULATION--------------------------    
    this.physicsScene.HashTable.fillHashTable(this.physicsScene);
    this.clearBallColorForDebag();

    for (let i = 0; i < INSTANS_COUNT; i++) {

      let ball = simulation(i, dt, this.physicsScene.balls, this);

      this.model.Sphere1.MODELMATRIX = mat4.translate(mat4.identity(), ball.position);
      this.model.Sphere1.MODELMATRIX_ARRAY.set(this.model.Sphere1.MODELMATRIX, (i) * (16 + 4));

      if (i == DEBAG_INDEX) {
        this.model.Sphere1.MODELMATRIX_ARRAY.set(vec4.set(0.0, 0.0, 1.0, 1.0), (i) * (16 + 4) + 16);
      }

    }

    this.physicsScene.HashTable.clearHashSet();
    //--------------------------------------------------
    //SIM Shader

    //Encode commands to do the computation
    const commandEncoder_compute =  this.device.createCommandEncoder({
      label: 'doubling encoder',
    });

    const computePass = commandEncoder_compute.beginComputePass({
      label: 'doubling compute pass',
    });
    const computepPipeline =  this.pipelines.pipeline_Compute;
    computePass.setPipeline(computepPipeline);
    computePass.setBindGroup(0,computepPipeline.bindGroupsCompute[this.t % 2].bindGroup);
    computePass.dispatchWorkgroups(Math.ceil(INSTANS_COUNT / 64));
    computePass.end();

    commandEncoder_compute.copyBufferToBuffer(computepPipeline.bindGroupsCompute[this.t % 2].buffer, 0, this.UNIFORM.SIM.resultBuffer, 0, this.UNIFORM.SIM.resultBuffer.size);

    this.device.queue.submit([commandEncoder_compute.finish()]);

    // Read the results
    await this.UNIFORM.SIM.resultBuffer.mapAsync(GPUMapMode.READ);
    let result = new Float32Array(this.UNIFORM.SIM.resultBuffer.getMappedRange().slice());
    this.UNIFORM.SIM.resultBuffer.unmap();
    //console.log('result', result);

    //--------------------------------------------------

    this.camera.setDeltaTime(dt);
    await updateUniformBuffer(this, this.camera);

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();
    this.renderPassDescription.colorAttachments[0].view = textureView;

    const renderPass = commandEncoder.beginRenderPass(this.renderPassDescription);

    renderPass.setPipeline(this.pipelines.pipeline_Render);

    //Sphere1
    renderPass.setVertexBuffer(0, this.model.Sphere1.sphereByffers.vertexBuffer);
    renderPass.setVertexBuffer(1, this.model.Sphere1.sphereByffers.uvBuffer);
    renderPass.setVertexBuffer(2, this.model.Sphere1.sphereByffers.normalBuffer);
    renderPass.setIndexBuffer(this.model.Sphere1.sphereByffers.indexBuffer, "uint32");
    renderPass.setBindGroup(0, this.UNIFORM.BINDGROUP.uniformBindGroup_Camera);
    renderPass.setBindGroup(1, this.UNIFORM.BINDGROUP.uniformBindGroup_Ball);
    renderPass.drawIndexed(this.model.Sphere1.geometry.index.length, this.countRenderBall, 0, 0, 0);

    //Plane1
    renderPass.setVertexBuffer(0, this.model.Plane1.planeByffers.vertexBuffer);
    renderPass.setVertexBuffer(1, this.model.Plane1.planeByffers.uvBuffer);
    renderPass.setVertexBuffer(2, this.model.Plane1.planeByffers.normalBuffer);
    renderPass.setIndexBuffer(this.model.Plane1.planeByffers.indexBuffer, "uint32");
    renderPass.setBindGroup(0, this.UNIFORM.BINDGROUP.uniformBindGroup_Camera);
    renderPass.setBindGroup(1, this.UNIFORM.BINDGROUP.uniformBindGroup_Plane);
    renderPass.drawIndexed(this.model.Plane1.geometry.index.length);

    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);

    window.requestAnimationFrame(this.update);

  }
}