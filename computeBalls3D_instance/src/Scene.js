
import {
  mat4, vec3, vec4
} from './wgpu-matrix.module.js';

import { initWebGPU } from '../../common/initWebGPU.js';
import { shaderMatCap } from './shaders/shaderMatCap.js';
import { BoxGeometry } from '../../common/primitives/BoxGeometry.js';
import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { RADIUS, INSTANS_COUNT, DEBAG_INDEX } from './settings.js';
import { createBufferFromData } from './createBufferFromData.js';
import { updateUniformBuffer } from './uniformData.js';
import { simulation } from './simulation.js';
import { Mesh } from './Mesh.js';
import { Ray } from './Ray.js';
import { Camera } from '../../common/camera/camera.js';


export class Scene {
  constructor(physicsScene) {
    this.asset = {}
    this.device = undefined;
    this.context = undefined;
    this.format = undefined;
    this.canvas = undefined;
    this.camera = undefined;
    this.pipelines = [];
    this.physicsScene = physicsScene;
  
    this.UNIFORM = {
      BINDGROUP: {},
    };

    this.RENDER_SETTINGS = {}

    this.time_old = 0;
    this.countRenderBall = 0;
    this.curent_ball = 0;
    this.Ray = undefined;

    this.model = {};
    this.update = this.animate.bind(this);
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

    //---create uniform data
    this.camera = new Camera(this.canvas, vec3.create(0.0, 50.0, 100.0), vec3.create(0.0, -0.3, -1.0));
    this.ray = new Ray(this.camera.eye, this.camera.front, this.canvas, this.camera);
    // ---------------- INIT  MESH       

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

    //pipelines
    this.pipelines.push(await this.createRenderPipeline());




  }

  async createRenderPipeline() {
    const pipeline = this.device.createRenderPipeline({
      label: "pipeline MY",
      layout: "auto",
      vertex: {
        module: this.device.createShaderModule({
          code: shaderMatCap,
        }),
        entryPoint: "main_vertex",
        buffers: [
          {
            arrayStride: 4 * 3,
            attributes: [{
              shaderLocation: 0,
              format: "float32x3",
              offset: 0
            }]
          },
          {
            arrayStride: 4 * 2,
            attributes: [{
              shaderLocation: 1,
              format: "float32x2",
              offset: 0
            }]
          },
          {
            arrayStride: 4 * 3,
            attributes: [{
              shaderLocation: 2,
              format: "float32x3",
              offset: 0
            }]
          }
        ]

      },
      fragment: {
        module: this.device.createShaderModule({
          code: shaderMatCap,
        }),
        entryPoint: "main_fragment",
        targets: [
          {
            format: this.format,
          },
        ],
      },
      primitive: {
        topology: 'triangle-list', //'point-list' 'line-list'  'line-strip' 'triangle-list'  'triangle-strip'   
        //cullMode: 'back',  //'back'  'front'  
        frontFace: 'ccw' //'ccw' 'cw'
      },
      depthStencil: {
        format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
        depthWriteEnabled: true, //вкл\выкл теста глубины 
        depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
      }
    });

    return pipeline;
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

    this.camera.setDeltaTime(dt);
    await updateUniformBuffer(this, this.camera);

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();
    this.renderPassDescription.colorAttachments[0].view = textureView;

    const renderPass = commandEncoder.beginRenderPass(this.renderPassDescription);

    renderPass.setPipeline(this.pipelines[0]);

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