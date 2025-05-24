
import {
  mat4,
} from '../../common/wgpu-matrix.module.js';
import { initWebGPU } from '../../common/initWebGPU.js';
import { Camera } from '../../common/camera/camera.js';

import { RectangleGeometry } from '../../common/primitives/RectangleGeometry.js';
import { BoxGeometry } from '../../common/primitives/BoxGeometry.js';
import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { CylinderGeometry } from '../../common/primitives/CylinderGeometry.js';

import { Mesh } from '../../common/Mesh.js';
import { Object3D } from '../../common/object3D.js';
import { Scene } from '../../common/Scene.js';

import {createTextureFromImage} from '../../common/textureUtils.js';

import { basicShaderSrc as phongShader } from '../../common/shaders/phongShader.js';

import { PhongMaterial } from '../../common/Materials/PhongMaterial.js';


async function main() {

   const { device, context, format, canvas} = await initWebGPU(true);
    
  // Mesh --------------------------------------------------- 
   const meshGeometry = new CylinderGeometry(1.0, 1.0, 3, 16, 8, false, 0, Math.PI * 2);
   const mesh1 = new Mesh(meshGeometry);
   mesh1.createBuffers(device);
   mesh1.createUniformBuffer(device);
   mesh1.modelMatrix = mat4.translate(mesh1.modelMatrix ,[0 ,0, 0]);  
 
   const meshGeometry2 = new RectangleGeometry(1.0, 1.0, 1, 1);
   const mesh2 = new Mesh(meshGeometry2);
   mesh2.createBuffers(device);
   mesh2.createUniformBuffer(device);

   mesh2.translate([0, -5, 0]);
   mesh2.rotateX(-Math.PI / 2);
   mesh2.scale([20, 20, 20]);
  
   const meshGeometry3 = new BoxGeometry(2.0, 1.0, 1.0, 1, 1, 1);
   const mesh3 = new Mesh(meshGeometry3);
   mesh3.createBuffers(device);
   mesh3.createUniformBuffer(device);
   mesh3.translate([-5, 0, 0]);
   mesh3.scale([0.8, 0.8, 0.8]);

   const meshGeometry4 = new SphereGeometry(1.0);
   const materialPhong = new PhongMaterial();
   const mesh4 = new Mesh(meshGeometry4, materialPhong);
   mesh4.createBuffers(device);
   mesh4.createUniformBuffer(device);
   mesh4.translate([0, 2, 0]);
   mesh4.scale([0.7, 0.7, 0.7]);

   
   const mesh0 = new Object3D();  
   mesh0.translate([8, 2, 0]);
  
    
   mesh1.addChild(mesh0);
   //mesh2.setParent(mesh0);
   mesh0.addChild(mesh3);
   mesh3.addChild(mesh4);
   
   //Scene----------------------------------------------------
   
   const scene = new Scene({ device, context, format, canvas});
   scene.add(mesh0);
   scene.add(mesh1);
   scene.add(mesh2);  
   scene.add(mesh3);
   scene.add(mesh4);

   //mesh3.removeParent(); // Удаляем родителя у mesh3, теперь он не будет отрисовываться
   //---------------------------------------------------   
   //---create uniform data   
  
   let camera = new Camera(canvas);
   camera.setPosition([0.0, 0.0, 25.0]);
   camera.createBuffer(device);

   scene.setCamera(camera);
   let lightPosition = new Float32Array([1.0, 1.0, 2.0]);

   //*********************************************//


   const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: device.createShaderModule({
          code: phongShader,
        }),
        entryPoint: "mainVertex",
        buffers:[
          {
              arrayStride: 12,
              attributes: [{
                  shaderLocation: 0,
                  format: "float32x3",
                  offset: 0
              }]
          },
          {
              arrayStride: 8,
              attributes: [{
                  shaderLocation: 1,
                  format: "float32x2",
                  offset: 0
              }]
           },
          {
              arrayStride: 12,
              attributes: [{
                  shaderLocation: 2,
                  format: "float32x3",
                  offset: 0
              }]
          }
      ]
      },
      fragment: {
        module: device.createShaderModule({
          code: phongShader,
        }),
        entryPoint: "mainFragment",
        targets: [
          {
            format: format,
          },
        ],
      },
      primitive: {
        //topology: "line-list", 
        topology: "triangle-list",
        //topology: "point-list",
        //cullMode: 'back',  //'back'  'front'  
        frontFace: 'ccw' //'ccw' 'cw'
      },
      depthStencil:{
        format: "depth24plus",// Формат текстуры теста глубины  depth16unorm depth24plus
        depthWriteEnabled: true, //вкл\выкл теста глубины 
        depthCompare: "less" //Предоставленное значение проходит сравнительный тест, если оно меньше выборочного значения. 
    }
    });

    const fragmentUniformBuffer = device.createBuffer({
      size: 16+16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // //-------------------- TEXTURE ---------------------
    const sampler = device.createSampler({
      minFilter:'linear',
      magFilter:'linear',
      mipmapFilter : "nearest", //nearest
      addressModeU: 'repeat',
      addressModeV: 'repeat'
    });

    const texture = await createTextureFromImage(device, './res/uv.jpg',{mips:true});  
    //--------------------------------------------------
    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
                buffer: mesh1.uniformBuffer,
                offset: 0,
                size: 64    // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
          },
          {
            binding: 4,
            resource: {
                buffer: camera.cameraBuffer,
                offset: 0,
                size: 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
          },
          { 
            binding: 1,
            resource: sampler
          },

          {
            binding: 2,
            resource: texture.createView()
          },          
          {
            binding: 3,
            resource: {
                buffer: fragmentUniformBuffer,
                offset: 0,
                size: 16 + 16 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
            }
          }
        ]
    });

    //--------------------------------------------------
    const uniformBindGroup2 = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
                buffer: mesh2.uniformBuffer,
                offset: 0,
                size: 64   // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
          },
          {
            binding: 4,
            resource: {
                buffer: camera.cameraBuffer,
                offset: 0,
                size: 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
          },
          { 
            binding: 1,
            resource: sampler
          },

          {
            binding: 2,
            resource: texture.createView()
          },          
          {
            binding: 3,
            resource: {
                buffer: fragmentUniformBuffer,
                offset: 0,
                size: 16 + 16 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
            }
          }
        ]
    });

     //--------------------------------------------------
    const uniformBindGroup3 = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
                buffer: mesh3.uniformBuffer,
                offset: 0,
                size: 64   // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
          },
          {
            binding: 4,
            resource: {
                buffer: camera.cameraBuffer,
                offset: 0,
                size: 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
          },
          { 
            binding: 1,
            resource: sampler
          },

          {
            binding: 2,
            resource: texture.createView()
          },          
          {
            binding: 3,
            resource: {
                buffer: fragmentUniformBuffer,
                offset: 0,
                size: 16 + 16 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
            }
          }
        ]
    });

      //--------------------------------------------------
    const uniformBindGroup4 = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: {
                buffer: mesh4.uniformBuffer,
                offset: 0,
                size: 64   // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
          },
          {
            binding: 4,
            resource: {
                buffer: camera.cameraBuffer,
                offset: 0,
                size: 64 + 64 // PROJMATRIX + VIEWMATRIX + MODELMATRIX // Каждая матрица занимает 64 байта
            }
          },
          { 
            binding: 1,
            resource: sampler
          },

          {
            binding: 2,
            resource: texture.createView()
          },          
          {
            binding: 3,
            resource: {
                buffer: fragmentUniformBuffer,
                offset: 0,
                size: 16 + 16 //   lightPosition : vec4<f32>;    eyePosition : vec4<f32>;   
            }
          }
        ]
    });

    mesh1.uniformBindGroup = uniformBindGroup;
    mesh2.uniformBindGroup = uniformBindGroup2;
    mesh3.uniformBindGroup = uniformBindGroup3;
    mesh4.uniformBindGroup = uniformBindGroup4;

    device.queue.writeBuffer(fragmentUniformBuffer, 0, new Float32Array(camera.eye));
    device.queue.writeBuffer(fragmentUniformBuffer,16, lightPosition);


    const depthTexture = device.createTexture({
      size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });  

    const renderPassDescription = {
      colorAttachments: [
        {
          view: undefined,
          clearValue: { r: 0.3, g: 0.4, b: 0.5, a: 1.0 },
          loadOp: 'clear',
          storeOp: "store", //ХЗ
        },],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
         // stencilLoadValue: 0,
         // stencilStoreOp: "store"
      }
    };


// Animation   
let time_old=0; 
 async function renderLoop(time) {
      
      //-----------------TIME-----------------------------
      //console.log(time);
      let dt=time-time_old;
      time_old=time;
      //--------------------------------------------------
     
      //------------------MATRIX EDIT---------------------
      // mesh3.modelMatrix = mat4.rotateY(mesh3.modelMatrix, dt * -0.0009);
      // mesh3.modelMatrix = mat4.rotateX(mesh4.modelMatrix, dt * -0.0002);
      // mesh4.modelMatrix = mat4.rotateY(mesh3.modelMatrix, dt * 0.0002);

      //mesh0.rotateY( dt * 0.0011);
      mesh1.rotateZ( dt * 0.0001);
      //mesh2.rotateZ( dt * 0.0002);
      mesh3.rotateX( dt * 0.0002);
      mesh4.rotateY( dt * 0.0004);
     

      scene.updateWorldMatrixAllMesh();
      //--------------------------------------------------

      scene.camera.setDeltaTime(dt);
      scene.camera.updateBuffer(device);
      scene.updateMeshBuffer(device);
    
     
      const commandEncoder = device.createCommandEncoder();
      const textureView = context.getCurrentTexture().createView();
      renderPassDescription.colorAttachments[0].view = textureView;
  
      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);
      
      renderPass.setPipeline(pipeline);
     
      scene.meshes.forEach((mesh) => {
        



        if (mesh instanceof Mesh && mesh.geometry.buffers.vertexBuffer && mesh.geometry.buffers.indexBuffer) {
          renderPass.setVertexBuffer(0, mesh.geometry.buffers.vertexBuffer);
          renderPass.setVertexBuffer(1, mesh.geometry.buffers.uvBuffer);
          renderPass.setVertexBuffer(2, mesh.geometry.buffers.normalBuffer);
          renderPass.setIndexBuffer(mesh.geometry.buffers.indexBuffer, "uint32");
          renderPass.setBindGroup(0, mesh.uniformBindGroup);
          renderPass.drawIndexed(mesh.geometry.indices.length);
        }

      });

      renderPass.end();
  
      device.queue.submit([commandEncoder.finish()]);

      window.requestAnimationFrame(renderLoop);
    };
    renderLoop(0);
  }

  main();