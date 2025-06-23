
import {
  mat4,
} from '../../common/wgpu-matrix.module.js';
import { initWebGPU } from '../../common/initWebGPU.js';
import { Camera } from '../../common/camera/camera.js';

import { RectangleGeometry } from '../../common/primitives/RectangleGeometry.js';
import { BoxGeometry } from '../../common/primitives/BoxGeometry.js';
import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { CylinderGeometry } from '../../common/primitives/CylinderGeometry.js';
import { TorusGeometry } from '../../common/primitives/TorusGeometry.js';

import { Mesh } from '../../common/Mesh.js';
import { Object3D } from '../../common/object3D.js';
import { Scene } from '../../common/Scene.js';

import {createTextureAsset, createTextureOnePixel, assets} from '../../common/textureUtils.js';

import { PhongMaterial } from '../../common/Materials/PhongMaterial.js';

import { DirectionalLight } from '../../common/Lights/DirectionalLight.js';

import { mainSIM } from './mainSIM.js'; // Importing mainSIM.js for simulation

import { RenderPipeline } from '../../common/RenderPipeline.js'; // Importing initPhysics.js for physics initialization


async function main() {
  
  // Initialize WebGPU
  // This function sets up the WebGPU context, device, format, and canvas
   const { device, context, format, canvas} = await initWebGPU(false,800,800)
  
   //load static asset ={}
   await createTextureAsset(device, 'diffuseTexture', 
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

    await createTextureAsset(device, 'diffuseTexture1', 
    {src:'./res/webgpu.png', 
      mips: true, 
      sampler: 
                    {
                      minFilter:'linear',
                      magFilter:'linear', 
                      mipmapFilter : "nearest", 
                      addressModeU: 'repeat', 
                      addressModeV: 'repeat'}
    });  

    await createTextureOnePixel(device);  
   
   
   //physics
   const physicsSimulation = new mainSIM();
   console.log(physicsSimulation);
    
    
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
   
   const materialPhong0 = new PhongMaterial(device, 'materialPhong0');
   await PhongMaterial.createBindGroupLayout(device);
   materialPhong0.setDiffuseColor([1.0, 1.0, 1.0, 1.0]);
   materialPhong0.setSpecularColor([1.0, 1.0, 1.0]);
   materialPhong0.setShiniess(128.0);
 
   materialPhong0.diffuseTexture = assets.textures['diffuseTexture'];
   //materialPhong0.diffuseTexture = null; // Disable diffuse texture for now
   materialPhong0.createBindGroup(device);


   const materialPhong1 = new PhongMaterial(device, 'materialPhong1');
   //await PhongMaterial.createBindGroupLayout(device);
   materialPhong1.setDiffuseColor([0.0, 0.0, 1.0, 1.0]);
   materialPhong1.setSpecularColor([1.0, 1.0, 1.0]);
   materialPhong1.setShiniess(128.0);
 
   materialPhong1.diffuseTexture = assets.textures['onePixel'];
   //materialPhong1.diffuseTexture = assets.textures['diffuseTexture'];
   //materialPhong1.diffuseTexture = null; // Disable diffuse texture for now
   materialPhong1.createBindGroup(device);

   const materialPhong2 = new PhongMaterial(device, 'materialPhong1');
   //await PhongMaterial.createBindGroupLayout(device);
   materialPhong2.setDiffuseColor([1.0, 0.5, 0.0, 1.0]);
   materialPhong2.setSpecularColor([1.0, 1.0, 1.0]);
   materialPhong2.setShiniess(16.0);
 
   materialPhong2.diffuseTexture = assets.textures['onePixel'];
   //materialPhong1.diffuseTexture = assets.textures['diffuseTexture'];
   //materialPhong1.diffuseTexture = null; // Disable diffuse texture for now
   materialPhong2.createBindGroup(device);

   const materialPhong3 = new PhongMaterial(device, 'materialPhong1');
   //await PhongMaterial.createBindGroupLayout(device);
   materialPhong3.setDiffuseColor([0.0, 0.9, 0.0, 1.0]);
   materialPhong3.setSpecularColor([1.0, 1.0, 1.0]);
   materialPhong3.setShiniess(128.0);
 
   materialPhong3.diffuseTexture = assets.textures['onePixel'];
   //materialPhong1.diffuseTexture = assets.textures['diffuseTexture'];
   //materialPhong1.diffuseTexture = null; // Disable diffuse texture for now
   materialPhong3.createBindGroup(device);

   const meshSphereGeometry = new SphereGeometry(1.0);
   const meshSphere0 = new Mesh(device,meshSphereGeometry, materialPhong0);
   const meshSphere1 = new Mesh(device,meshSphereGeometry, materialPhong2);
   const meshSphere2 = new Mesh(device,meshSphereGeometry, materialPhong3);

   const beads0 = physicsSimulation.physicsScene.beads[0]; 
   const beads1 = physicsSimulation.physicsScene.beads[1];
   const beads2 = physicsSimulation.physicsScene.beads[2];

   meshSphere0.setScale([beads0.radius, beads0.radius, beads0.radius]);
   meshSphere1.setScale([beads1.radius, beads1.radius, beads1.radius]);
   meshSphere2.setScale([beads2.radius, beads2.radius, beads2.radius]);

  
   const meshCylinderGeometry0 =new CylinderGeometry(0.2, 0.2, 8, 16, 8, false, 0, Math.PI * 2);
   const meshCylinder0 = new Mesh(device, meshCylinderGeometry0, materialPhong1);
   
   meshCylinder0.rotateX(Math.PI / 2);
   meshCylinder0.translate([0, 4, 0]);
   

   const meshCylinderGeometry1 =new CylinderGeometry(0.2, 0.2, 8, 16, 8, false, 0, Math.PI * 2);
   const meshCylinder1 = new Mesh(device,meshCylinderGeometry1, materialPhong1);
   meshCylinder1.rotateX(Math.PI / 2);
   meshCylinder1.translate([0, 4, 0]);

   const meshCylinderGeometry2 =new CylinderGeometry(0.2, 0.2, 8, 16, 8, false, 0, Math.PI * 2);
   const meshCylinder2 = new Mesh(device,meshCylinderGeometry2, materialPhong1);
   meshCylinder2.rotateX(Math.PI / 2);
   meshCylinder2.translate([0, 4, 0]);
 
   const meshTorusGeometry = new TorusGeometry(
    physicsSimulation.physicsScene.wireRadius,
     0.2, 8, 64, 15,2);
   const meshTorus = new Mesh(device,meshTorusGeometry, materialPhong1);
   meshTorus.translate([physicsSimulation.physicsScene.wireCenter.x,physicsSimulation.physicsScene.wireCenter.y, 0]);
   //meshTorus.rotateX(-Math.PI / 2);

   
   const mesh0 = new Object3D();  
   mesh0.addChild(meshCylinder0); 

   const mesh1 = new Object3D();  
   mesh1.addChild(meshCylinder1); 

   const mesh2 = new Object3D();  
   mesh2.addChild(meshCylinder2); 
  
   scene.add(mesh0);
   scene.add(mesh1);
   scene.add(mesh2);  

   //scene.add(mesh3);
   scene.add(meshSphere0);
   scene.add(meshSphere1);
   scene.add(meshSphere2);
   scene.add(meshTorus);

   scene.add(meshCylinder0);
   scene.add(meshCylinder1);
   scene.add(meshCylinder2);


   scene.add(light1);

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

  const pipelineControler = new RenderPipeline(device, {
                                                        material: materialPhong0,
                                                        format: format, 
                                                        pipelineLayout: pipelineLayout}); 

    const depthTexture = device.createTexture({
     // size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
      size: [canvas.clientWidth , canvas.clientHeight , 1],
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
      physicsSimulation.simulate();
      //------------------MATRIX EDIT---------------------
      // mesh3.modelMatrix = mat4.rotateY(mesh3.modelMatrix, dt * -0.0009);
      // mesh3.modelMatrix = mat4.rotateX(mesh4.modelMatrix, dt * -0.0002);
      // mesh4.modelMatrix = mat4.rotateY(mesh3.modelMatrix, dt * 0.0002);

      //mesh0.rotateY( dt * 0.0011);
      //mesh1.rotateZ( dt * 0.0001);
      //mesh2.rotateZ( dt * 0.0002);
      //mesh3.rotateX( dt * 0.0002);
      //meshSphere.rotateY( dt * 0.0004);

      meshSphere0.setPosition([beads0.pos.x, beads0.pos.y, 0]);
      meshSphere1.setPosition([beads1.pos.x, beads1.pos.y, 0]);
      meshSphere2.setPosition([beads2.pos.x, beads2.pos.y, 0]); 

    
      mesh0.lookAt(new Float32Array(meshSphere0.getPosition(), [0, 0, -1]));
      meshSphere0.lookAt(new Float32Array([0, 0, 0], [0, 0, -1]));
     
      mesh1.lookAt(new Float32Array(meshSphere1.getPosition(), [0, 0, -1]));
      meshSphere1.lookAt(new Float32Array([0, 0, 0], [0, 0, -1]));

      //meshSphere2.lookAt(new Float32Array([0, 0, 0], [0, 0, -1]));
      mesh2.lookAt(new Float32Array(meshSphere2.getPosition(), [0, 0, -1]));
      meshSphere2.lookAt(new Float32Array([0, 0, 0], [0, 0, -1]));
      
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
      
      renderPass.setPipeline(pipelineControler.pipeline);
     
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