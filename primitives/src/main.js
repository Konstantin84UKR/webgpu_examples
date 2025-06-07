
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

import { DirectionalLight } from '../../common/Lights/DirectionalLight.js';


async function main() {

   const { device, context, format, canvas} = await initWebGPU(true)
    
   //---------------------------------------------------   
   //---create uniform data   
   
   const scene = new Scene({ device, context, format, canvas});
   
   let camera = new Camera(canvas);
   Camera.createGroupLayout(device);
  
   camera.createBuffer(device);
   camera.createBindGroup(device);
   camera.setPosition([0.0, 0.0, 25.0]);

   scene.setCamera(camera);

  //---DirectionalLight---------------------------------
   const lightPosition = new Float32Array([1.0, 1.0, 2.0]);
   const lightColor = new Float32Array([1.0, 1.0, 1.0]);

   const light1 = new DirectionalLight(lightColor, lightPosition);  
   light1.createBindGroupLayout(device);
   light1.createUniformBuffer(device);
   light1.createBindGroup(device); 


  // Mesh --------------------------------------------------- 
   Mesh.createBindGroupLayout(device);
   const materialPhong = new PhongMaterial(device, 'materialPhong');
   await PhongMaterial.createBindGroupLayout(device);
   materialPhong.setDiffuseColor([0.5, 0.8, 0.5, 1.0]);
   materialPhong.setSpecularColor([1.0, 1.0, 1.0]);
   materialPhong.setShiniess(32.0);
   materialPhong.diffuseTexture =  await materialPhong.createTextureFromImage(device, 'diffuseTexture', 
    {src:'./res/uv.jpg', 
      mips: true, 
      sampler: 
                    {
                      minFilter:'linear',
                      magFilter:'linear', 
                      mipmapFilter : "nearest", 
                      addressModeU: 'repeat', 
                      addressModeV: 'repeat'}
    });  

   materialPhong.createBindGroup(device);

   const meshGeometry = new CylinderGeometry(1.0, 1.0, 3, 16, 8, false, 0, Math.PI * 2);
   const mesh1 = new Mesh(device,meshGeometry,materialPhong);
  
   mesh1.modelMatrix = mat4.translate(mesh1.modelMatrix ,[0 ,0, 0]);  
  
   const meshGeometry2 = new RectangleGeometry(1.0, 1.0, 1, 1);
   const mesh2 = new Mesh(device,meshGeometry2,materialPhong);
 
   mesh2.translate([0, -5, 0]);
   mesh2.rotateX(-Math.PI / 2);
   mesh2.scale([20, 20, 20]);
  
   const meshGeometry3 = new BoxGeometry(2.0, 1.0, 1.0, 1, 1, 1);
   const mesh3 = new Mesh(device, meshGeometry3,materialPhong);
   
   mesh3.translate([-5, 0, 0]);
   mesh3.scale([0.8, 0.8, 0.8]);

   const meshGeometry4 = new SphereGeometry(1.0);
   const mesh4 = new Mesh(device,meshGeometry4, materialPhong);
   
   mesh4.translate([0, 2, 0]);
   mesh4.scale([0.7, 0.7, 0.7]);

   
   const mesh0 = new Object3D();  
   mesh0.translate([8, 2, 0]);
   
   mesh1.addChild(mesh0);
   //mesh2.setParent(mesh0);
   mesh0.addChild(mesh3);
   mesh3.addChild(mesh4);
    
  
   scene.add(mesh0);
   scene.add(mesh1);
   scene.add(mesh2);  
   scene.add(mesh3);
   scene.add(mesh4);

   scene.add(light1);

  //  mesh1.uniformBuffer = await mesh1.createUniformBuffer(device);
  //  mesh2.uniformBuffer = await mesh2.createUniformBuffer(device);
  //  mesh3.uniformBuffer = await mesh3.createUniformBuffer(device);
  //  mesh4.uniformBuffer = await mesh4.createUniformBuffer(device); 

   await scene.prerender(); // Пререндерим сцену, чтобы все буферы были созданы и заполнены
   //mesh3.removeParent(); // Удаляем родителя у mesh3, теперь он не будет отрисовываться
 
   //*********************************************//
   

    device.queue.writeBuffer(light1.uniformBuffer, 0, light1.lightColor); // lightPosition
    device.queue.writeBuffer(light1.uniformBuffer,16, light1.lightPosition); // eyePosition
    device.queue.writeBuffer(light1.uniformBuffer,16 + 12, light1.type); // type

  const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [
          Camera._layout,           //@group(0)
          DirectionalLight._layout, //@group(1) 
          Mesh._layout,             //@group(2)
          PhongMaterial._layout     //@group(3)
        ]
      });


  const pipeline = device.createRenderPipeline({
      label: "Phong Pipeline",
      layout: pipelineLayout,
      vertex: {
        module: device.createShaderModule({
          code: phongShader,
          constants: {
           // ambientColor: 'vec3<f32>(0.9, 0.1, 0.1);', // Цвет окружающего света
          },
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

      //mesh1.uniformBuffer = await mesh1.updateUniformBuffer(device);

      await scene.updateWorldMatrixAllMesh();
      await scene.updateMeshBuffer();
      //--------------------------------------------------

      scene.camera.setDeltaTime(dt);
      scene.camera.updateBuffer(device);
      //scene.updateMeshBuffer(device);
     
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
        
          renderPass.setBindGroup(0, camera.bindGroup);
          renderPass.setBindGroup(1, light1.bindGroup);
          renderPass.setBindGroup(2, mesh.bindGroup);
          renderPass.setBindGroup(3, mesh.material.bindGroup);
        
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