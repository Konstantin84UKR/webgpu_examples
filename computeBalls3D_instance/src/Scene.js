
import {
    mat4, vec3 , vec4
  } from './wgpu-matrix.module.js';

import { initWebGPU } from '../../common/initWebGPU.js';
import { shaderMatCap } from './shaders/shaderMatCap.js';
import { BoxGeometry } from '../../common/primitives/BoxGeometry.js';
import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { RADIUS , INSTANS_COUNT,DEBAG_INDEX } from './settings.js';
import { createBufferFromData } from './createBufferFromData.js';
import { createUniformData, updateUniformBuffer } from './uniformData.js';


export class Scene{
    constructor(){
        this.asset = {}
        this.device = undefined;
        this.context = undefined;
        this.format = undefined;
        this.canvas = undefined;
        this.pipelines = [];
        this.UNIFORM = {
            BINDGROUP:{},
        };
        this.RENDER_SETTINGS = {}



        this.model = {};
    }

    async preloader(){
        //LOAD;  
        let img = new Image();
        img.src = './res/green.jpg'; //'./res/matcap8.jpg';
        await img.decode();
        
        const imageBitmap = await createImageBitmap(img);

        this.asset.imageBitmap = imageBitmap;

    }
    async create(){
        
        //INIT
        const { device, context, format, canvas} = await initWebGPU(false);
        this.device = device;
        this.context = context;
        this.format = format;
        this.canvas = canvas;


        // ---------------- INIT  MESH       
        const meshGeometry = new SphereGeometry(RADIUS);
        this.model.Sphere1 = await this.initMeshArray(meshGeometry);      
        this.model.Sphere1.MODELMATRIX_meshGeometry = mat4.identity();
        this.model.Sphere1.MODELMATRIX_ARRAY = new Float32Array(INSTANS_COUNT * (4 * 4 + 4));

        this.model.Sphere1.sphereByffers = await createBufferFromData(this.device,{
            vertex: this.model.Sphere1.vertex,
            uv:this.model.Sphere1.uv,
            normal: this.model.Sphere1.normal,
            index:this.model.Sphere1.index,
            label: "Sphere1"
          });  

          for (let i = 0; i <  INSTANS_COUNT ; i++) {
            this.model.Sphere1.MODELMATRIX_meshGeometry = mat4.identity();
            this.model.Sphere1.MODELMATRIX_meshGeometry = mat4.translate(this.model.Sphere1.MODELMATRIX_meshGeometry, this.balls[i].position); 
            //this.model.Sphere1.MODELMATRIX_ARRAY.set(this.model.Sphere1.MODELMATRIX_meshGeometry, (i) * 16);  
            this.model.Sphere1.MODELMATRIX_ARRAY.set(this.model.Sphere1.MODELMATRIX_meshGeometry, (i) * (16 + 4) );  
            this.model.Sphere1.MODELMATRIX_ARRAY.set(vec4.set(0.5,0.5,0.5,0.5), (i) * (16 + 4) + 16);  
        }  
      
        //---------------------------------------------------
        const meshPlane = new BoxGeometry(1, 1, 1, 1, 1, 1);
        this.model.Plane1 = await this.initMeshArray(meshPlane);      
        this.model.Plane1.MODELMATRIX_meshPlane = mat4.identity();

        this.model.Plane1.planeByffers =  await createBufferFromData(this.device, {
            vertex: this.model.Plane1.vertex, 
            uv: this.model.Plane1.uv, 
            normal: this.model.Plane1.normal, 
            index: this.model.Plane1.index,
            label: "Plane1"
          });

           
          //this.model.Plane1.MODELMATRIX_meshPlane = mat4.translate(this.model.Plane1.MODELMATRIX_meshPlane,  vec3.set(0, 0, -25));
          //this.model.Plane1.MODELMATRIX_meshPlane = mat4.rotateX(this.model.Plane1.MODELMATRIX_meshPlane, Math.PI*-0.5);
          this.model.Plane1.MODELMATRIX_meshPlane = mat4.scale(this.model.Plane1.MODELMATRIX_meshPlane, vec3.set(50,0.1,50)); 
        //---------------------------------------------------
       
        //pipelines
        this.pipelines.push(await this.createRenderPipeline());
        // create uniform buffer and layout
        // create uniform buffer and layout
        // await createUniformData(this);
        // await updateUniformBuffer(this,camera);
        //INIT - RENDER SETTINGS  
        
        // INIT - RENDER SETTINGS
        // this.RENDER_SETTINGS.depthTexture = this.device.createTexture({
        //     size: [this.canvas.clientWidth * devicePixelRatio, this.canvas.clientHeight * devicePixelRatio, 1],
        //     format: "depth24plus",
        //     usage: GPUTextureUsage.RENDER_ATTACHMENT
        // });
    }
    
    async update(){
      
    }
    //----- UTIL
    async initMeshArray(mesh){
        const vertex = new Float32Array(mesh.vertices);
        const uv = new Float32Array(mesh.uvs);
        const normal = new Float32Array(mesh.normals);
        const index = new Uint32Array(mesh.indices);  

        return {vertex, uv, normal, index}
    }

    async createRenderPipeline(){
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

    async updateDebagColor(balls,color){
      for (let i = 0; i <  balls.length ; i++) {    
        let ball = balls[i]
        if(ball.id != DEBAG_INDEX){
          this.model.Sphere1.MODELMATRIX_ARRAY.set(color, (ball.id) * (16 + 4) + 16);  
        }
       // this.model.Sphere1.MODELMATRIX_ARRAY.set(color, (ball.id) * (16 + 4) + 16);  
      
           
      }
  
    }

}