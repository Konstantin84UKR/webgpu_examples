
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

import { createTextureFromImage, assets, createTextureAsset } from '../../common/textureUtils.js';

import { PhongMaterial } from '../../common/Materials/PhongMaterial.js';

import { DirectionalLight } from '../../common/Lights/DirectionalLight.js';

import { RenderPipeline } from '../../common/RenderPipeline.js'; // Importing initPhysics.js for physics initialization
import { ShadowShader } from '../../common/shaders/shaderShadowMap.js';


async function main() {

  const { device, context, format, canvas } = await initWebGPU(true)

  //--LOAD ASSET--

  await createTextureAsset(device, 'diffuseTexture',
    {
      src: './res/uv.jpg',
      mips: true,
      sampler:
      {
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: "nearest",
        addressModeU: 'repeat',
        addressModeV: 'repeat'
      }
    });


  //---------------------------------------------------   
  //---create uniform data   

  const scene = new Scene({ device, context, format, canvas });

  let camera = new Camera(canvas);
  Camera.createGroupLayout(device);

  camera.createBuffer(device);
  camera.createBindGroup(device);
  camera.setPosition([0.0, 5.0, 25.0]);

  scene.setCamera(camera);
 
  //---DirectionalLight---------------------------------
  const lightPosition = new Float32Array([20.0, 30.0, 0.0]);
  const lightColor = new Float32Array([1.0, 1.0, 1.0]);

  const light1 = new DirectionalLight(device, lightColor, lightPosition);
  light1.intensity = 1.0;
  
  light1.shadowMapUsing = true;
  //await light1.createshadowMapMaterial(canvas);
 

  // await light1.createBindGroupLayout(device);
  await light1.createUniformBuffer(device);
  // await light1.createBindGroup(device);

  
  const lightPosition2 = new Float32Array([0.0, 20.0, 0.0]);
  const lightColor2 = new Float32Array([1.0, 1.0, 1.0]);
  const light2 = new DirectionalLight(device, lightColor2, lightPosition2);
  light2.intensity = 1.0;
  light2.shadowMapUsing = true;
  //await light2.createshadowMapMaterial(canvas);
 

  // await light2.createBindGroupLayout(device);
  // await light2.createUniformBuffer(device);
  // await light2.createBindGroup(device);

  // Mesh --------------------------------------------------- 
  Mesh.createBindGroupLayout(device);
  const materialPhong = new PhongMaterial(device, 'materialPhong');
  await PhongMaterial.createBindGroupLayout(device);
  //materialPhong.setDiffuseColor([0.5, 0.8, 0.5, 1.0]);
  materialPhong.setSpecularColor([1.0, 1.0, 1.0]);
  materialPhong.setShiniess(32.0);
  materialPhong.diffuseTexture = assets.textures.diffuseTexture;
  materialPhong.shadowMapUsing = true;
  materialPhong.softShadow = false;
  materialPhong.createBindGroup(device);



  const meshGeometry = new CylinderGeometry(1.0, 1.0, 3, 16, 8, false, 0, Math.PI * 2);
  //const meshGeometry = new TorusGeometry(5.0, 1.0, 32, 32);
  const mesh1 = new Mesh(device, meshGeometry, materialPhong);

  mesh1.modelMatrix = mat4.translate(mesh1.modelMatrix, [0, 0, 0]);

  const meshGeometry2 = new RectangleGeometry(3.0, 3.0, 1, 1);
  const mesh2 = new Mesh(device, meshGeometry2, materialPhong);

  mesh2.translate([0, -5, 0]);
  mesh2.rotateX(-Math.PI / 2);
  mesh2.setScale([20, 20, 20]);

  const meshGeometry3 = new BoxGeometry(6.0, 1.0, 1.0, 1, 1, 1);
  const mesh3 = new Mesh(device, meshGeometry3, materialPhong);

  mesh3.translate([-5, 0, 0]);
  mesh3.setScale([0.8, 0.8, 0.8]);

  const meshGeometry4 = new SphereGeometry(1.0);
  const mesh4 = new Mesh(device, meshGeometry4, materialPhong);

  mesh4.translate([0, 2, 0]);
  mesh4.setScale([0.7, 0.7, 0.7]);

  const meshTorusGeometry = new TorusGeometry(10.0, 2.0, 32, 32, 10);
  const meshTorus = new Mesh(device, meshTorusGeometry, materialPhong);
  meshTorus.translate([0, -2, -10]);
  //meshTorus.rotateX(-Math.PI / 2);


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
  scene.add(meshTorus);

  scene.add(light1);
  scene.add(light2);
  //scene.add(light1);

  await scene.prerender(); // Пререндерим сцену, чтобы все буферы были созданы и заполнены
  //mesh3.removeParent(); // Удаляем родителя у mesh3, теперь он не будет отрисовываться

  //*********************************************//


  // device.queue.writeBuffer(light1.uniformBuffer, 0, light1.lightColor); // lightPosition
  // device.queue.writeBuffer(light1.uniformBuffer, 16, light1.lightPosition); // eyePosition
  // device.queue.writeBuffer(light1.uniformBuffer, 16 + 12, light1.type); // type

  // device.queue.writeBuffer(light1.uniformBuffer, 0, scene.lights[0].lightColor); // lightPosition
  // device.queue.writeBuffer(light1.uniformBuffer, 12, new Float32Array([1.0])); // lightPosition
  // device.queue.writeBuffer(light1.uniformBuffer, 16, scene.lights[0].lightPosition); // eyePosition
  // device.queue.writeBuffer(light1.uniformBuffer, 16 + 12, scene.lights[0].type); // type

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [
      Camera._layout,           //@group(0)
      DirectionalLight._layout_for_array, //@group(1) 
      Mesh._layout,             //@group(2)
      materialPhong.layout      //@group(3)
    ]
  });

  const pipelineControler = new RenderPipeline(device, {
    material: materialPhong,
    format: format,
    pipelineLayout: pipelineLayout,
    constants: {
      NUM_LIGHTS: scene.lights.length, // Количество источников света
  }
});
                                                  

  const depthTexture = device.createTexture({
    // size: [canvas.clientWidth * devicePixelRatio, canvas.clientHeight * devicePixelRatio, 1],
    size: [canvas.clientWidth, canvas.clientHeight, 1],
    format: "depth32float", // Используем формат depth32float для большей точности
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
  let time_old = 0;
  async function renderLoop(time) {

    //-----------------TIME-----------------------------
    //console.log(time);
    let dt = time - time_old;
    time_old = time;
    //--------------------------------------------------

    //------------------MATRIX EDIT---------------------
   
    //mesh0.rotateY( dt * 0.0011);
    mesh1.rotateZ(dt * 0.0005);
    //mesh2.rotateZ( dt * 0.0002);
    mesh3.rotateX(dt * 0.0002);
    mesh4.rotateY(dt * 0.0004);

    //mesh1.uniformBuffer = await mesh1.updateUniformBuffer(device);

    await scene.updateWorldMatrixAllMesh();
    await scene.updateMeshBuffer();
    //--------------------------------------------------

    scene.camera.setDeltaTime(dt);
    scene.camera.updateBuffer(device);

    const commandEncoder = device.createCommandEncoder();
    //-----------------SHADOW_MAP-----------------------

    // Создаем тени для каждого источника света, который использует тени
    
  
    scene.lights.forEach((light,index) => {

      if (!light.shadowMapUsing){
        return
      } 

            const renderPassDescriptionShadow = {
            colorAttachments: [],
            depthStencilAttachment: {
                view: DirectionalLight._shadowMapTexArray.createView({ baseArrayLayer: index, arrayLayerCount: 1 }), // текстура глубины для формирования теней
                //view: DirectionalLight._shadowMapTexArray.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            }
        };


    const renderPassShadow = commandEncoder.beginRenderPass(renderPassDescriptionShadow);    
    
    //const renderPassShadow = commandEncoder.beginRenderPass(light1.shadowMapMaterial.renderPassDescriptionShadow);
    renderPassShadow.setPipeline(light2.shadowMapMaterial.pipeline);
   
      if (light instanceof DirectionalLight && light.shadowMapUsing) {
        scene.meshes.forEach((mesh) => {
          if (mesh instanceof Mesh && mesh.geometry.buffers.vertexBuffer && mesh.geometry.buffers.indexBuffer) {

            renderPassShadow.setVertexBuffer(0, mesh.geometry.buffers.vertexBuffer);
            renderPassShadow.setVertexBuffer(1, mesh.geometry.buffers.uvBuffer);
            renderPassShadow.setVertexBuffer(2, mesh.geometry.buffers.normalBuffer);
            renderPassShadow.setIndexBuffer(mesh.geometry.buffers.indexBuffer, "uint32");

            renderPassShadow.setBindGroup(0, light.cameraShadow.bindGroup);          
            renderPassShadow.setBindGroup(1, mesh.bindGroup);           

            renderPassShadow.drawIndexed(mesh.geometry.indices.length);                
          }
        });
      }

      renderPassShadow.end();
    });



   
    //-----------------RENDER------------------------- 
    //const commandEncoder = device.createCommandEncoder();
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
        renderPass.setBindGroup(1, DirectionalLight._bindGroup);
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