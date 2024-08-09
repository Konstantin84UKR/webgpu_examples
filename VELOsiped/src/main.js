
import {
  mat4,
  vec3,
} from '../../common/wgpu-matrix.module.js';

import { Camera } from '../../common/camera/camera.js';
import { initWebGPU } from '../../common/initWebGPU.js';

import { RectangleGeometry } from '../../common/primitives/RectangleGeometry.js';
import { BoxGeometry } from '../../common/primitives/BoxGeometry.js';
import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { CylinderGeometry } from '../../common/primitives/CylinderGeometry.js';
import { Mesh } from './Mesh.js';
import { Scene } from './Scene.js';

async function loadJSON(result,modelURL) {
  var xhr = new XMLHttpRequest();
  //var model;

  xhr.open('GET', modelURL, false);
  xhr.onload = function () {
      if (xhr.status != 200) {

          alert('LOAD' + xhr.status + ': ' + xhr.statusText);
      } else {

         result.mesh = JSON.parse(xhr.responseText);  
         //return  result;     
      }
  }
  xhr.send();
}


async function main() {
    ///**  Шейдеры тут все понятно более мение. */  
  

    //---------------------------------------------------
    let CUBE = {}; 
    await loadJSON(CUBE,'./res/Model.json');
    
    let mesh = CUBE.mesh.meshes[0];

    //  const cube_vertex = new Float32Array(mesh.vertices);
    //  const cube_uv = new Float32Array(mesh.texturecoords[0]);
    //  const cube_index = new Uint32Array(mesh.faces.flat());
    //  const cube_normal = new Float32Array(mesh.normals);

   //const meshGeometry = new RectangleGeometry(4, 4, 2, 2);
   const meshBoxGeometry = new BoxGeometry(4, 4, 6, 2, 2, 2);
   //const meshGeometry = new SphereGeometry(2, 16, 8, 1, 1, 0, 2);
   const meshSphereGeometry = new SphereGeometry(1);

  // Usage example
  const radiusTop = 1;
  const radiusBottom = 1;
  const height = 2;
  const radialSegments = 16;
  const heightSegments = 1;
  const openEnded = false;
  const thetaStart = 0;
  const thetaLength = Math.PI * 2;
  const meshCylinderGeometry = new CylinderGeometry(1.0, 1.5, 6, 16, 16, false, 2, Math.PI * 2);

  let Mesh1 = new Mesh(meshCylinderGeometry);
  Mesh1.origin = vec3.set(1,1,-1);
  //const meshGeometry = new BoxGeometry(4, 4, 6, 2, 2, 2);


  let Mesh2 = new Mesh(meshBoxGeometry);
  Mesh2.origin = vec3.set(0,0,-5);

  let Mesh3 = new Mesh(meshSphereGeometry);
  Mesh3.origin = vec3.set(-4,0,0);
  let Mesh4 = new Mesh(meshSphereGeometry);
  Mesh4.origin = vec3.set(4,0,0);
  let Mesh5 = new Mesh(meshSphereGeometry);
  Mesh5.origin = vec3.set(0,0,0);
  //---------------------------------------------------
  //---------------------------------------------------
  //initWebGPU
    const { device, context, format, canvas} = await initWebGPU(true);
  //---create uniform data
       
    let camera = new Camera(canvas);

    let scene = new Scene({ device, context, format, canvas})
    scene.meshes.push(Mesh1);
    scene.meshes.push(Mesh2);
    scene.meshes.push(Mesh3);
    scene.meshes.push(Mesh4);
    scene.meshes.push(Mesh5);
   
    

    
    let lightPosition = new Float32Array([0.0, 1.0, 1.0]);

   

    //*********************************************//
    //** настраиваем конвейер рендера 
    //** настраиваем шейдеры указав исходник,точку входа, данные буферов
    //** arrayStride количество байт на одну вершину */
    //** attributes настриваем локацию формат и отступ от начала  arrayStride */
    //** primitive указываем тип примитива для отрисовки*/
    //** depthStencil настраиваем буффер глубины*/


    //-------------------- TEXTURE ---------------------
    let img = new Image();
    img.src = './res/uv.jpg'; //'./tex/yachik.jpg';
    await img.decode();
    
    const imageBitmap = await createImageBitmap(img);

    scene.ASSETS.sampler = device.createSampler({
      minFilter:'linear',
      magFilter:'linear',
      mipmapFilter : "nearest", //nearest
      addressModeU: 'repeat',
      addressModeV: 'repeat'
    });

    scene.ASSETS.texture = device.createTexture({
      size:[imageBitmap.width,imageBitmap.height,1],
      format:'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING |
             GPUTextureUsage.COPY_DST |
             GPUTextureUsage.RENDER_ATTACHMENT
    });

    device.queue.copyExternalImageToTexture(
      {source: imageBitmap},
      {texture: scene.ASSETS.texture},
      [imageBitmap.width,imageBitmap.height]);


    await scene.create();

    device.queue.writeBuffer(scene.UNIFORM.uniformBufferCamera, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
    device.queue.writeBuffer(scene.UNIFORM.uniformBufferCamera, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
        

    // device.queue.writeBuffer(scene.UNIFORM.fragmentUniformBuffer, 0, new Float32Array(camera.eye));
    // device.queue.writeBuffer(scene.UNIFORM.fragmentUniformBuffer,16, lightPosition);


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
 async function animate(time) {
      
      //-----------------TIME-----------------------------
      //console.log(time);
      let dt=time-time_old;
      time_old=time;
      //--------------------------------------------------
     
      //------------------MATRIX EDIT---------------------
      Mesh1.matrix = mat4.rotateY(Mesh1.matrix, dt * 0.0002);
     
      Mesh1.translate(vec3.set(Math.sin(time * 0.005) * 0.1,  0 ,  0));
      Mesh2.translate(vec3.set(0,  Math.cos(time * 0.005) * 0.1 ,  Math.sin(time * 0.005) * 0.3));
      Mesh3.matrix =  mat4.rotateY(Mesh3.matrix, dt * 0.0002);
      //--------------------------------------------------
      camera.setDeltaTime(dt);
      
      device.queue.writeBuffer(scene.UNIFORM.uniformBufferCamera, 0, camera.pMatrix); // пишем в начало буффера с отступом (offset = 0)
      device.queue.writeBuffer(scene.UNIFORM.uniformBufferCamera, 64, camera.vMatrix); // следуюшая записать в буфер с отступом (offset = 64)
      device.queue.writeBuffer(scene.UNIFORM.fragmentUniformBuffer, 0, new Float32Array(camera.eye));
      console.log("camera.eye" + camera.eye)
      device.queue.writeBuffer(scene.UNIFORM.fragmentUniformBuffer,16, lightPosition);     
    
      const commandEncoder = device.createCommandEncoder(); 
      const textureView = context.getCurrentTexture().createView();
      renderPassDescription.colorAttachments[0].view = textureView;
      const renderPass = commandEncoder.beginRenderPass(renderPassDescription);
      renderPass.setPipeline(scene.PIPELINES.pipeline);
          
      
      for (let i = 0; i < scene.meshes.length; i++) {
          
      const Mesh = scene.meshes[i];
            
        device.queue.writeBuffer(Mesh.UNIFORM.uniformMatrix, 0, Mesh.matrix); // и так дале прибавляем 64 к offset
        
        renderPass.setVertexBuffer(0, Mesh.GPU_Buffers.vertexBuffer);
        renderPass.setVertexBuffer(1,  Mesh.GPU_Buffers.uvBuffer);
        renderPass.setVertexBuffer(2,  Mesh.GPU_Buffers.normalBuffer);
        renderPass.setIndexBuffer(Mesh.GPU_Buffers.indexBuffer, "uint32");
        renderPass.setBindGroup(0, Mesh.BINDGROUP.uniformBindGroup0);
        renderPass.setBindGroup(1, Mesh.BINDGROUP.uniformBindGroup1);
        //renderPass.draw(6, 1, 0, 0);
        renderPass.drawIndexed(Mesh.indexCount); 
       

      }  
     
       
      renderPass.end();   
      device.queue.submit([commandEncoder.finish()]);
      
      window.requestAnimationFrame(animate);
    };
    animate(0);
  }

  main();