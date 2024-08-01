import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { RectangleGeometry } from '../../common/primitives/RectangleGeometry.js';
import { gltfLoader ,LoadJSONUsingPromise} from '../../common/gltfLoader.js';
import { createTextureFromImage , createCubeTextureFromImage} from './textureUtils.js';

export async function initResurse(device) {
    //-------------------- MESH --------------------- 
    const plane = {};
    const rectangleGeometry = new RectangleGeometry(10,10,1,1);
   
    plane.vertex = new Float32Array(rectangleGeometry.vertices);
    plane.uv = new Float32Array(rectangleGeometry.uvs);
    plane.normal = new Float32Array(rectangleGeometry.normals);
    plane.index = new Uint32Array(rectangleGeometry.indices);

    
    // model gltf
    let gltf = await LoadJSONUsingPromise('./res/helmet/helmet.gltf');
    const gltfModel = new gltfLoader(device,gltf);
    gltfModel.getMesh();

    const modelBufferData = gltfModel.meshes[0].data;
    const modelForRender = {};
    modelForRender.vertexBuffer = modelBufferData.attribute_POSITION.gpuBufferData;
    modelForRender.uvBuffer = modelBufferData.attribute_TEXCOORD_0.gpuBufferData;
    modelForRender.normalBuffer = modelBufferData.attribute_NORMAL.gpuBufferData;
    modelForRender.tangentBuffer = modelBufferData.attribute_TANGENT.gpuBufferData;
    modelForRender.indexBuffer = modelBufferData.indices_indices.gpuBufferData;
    modelForRender.indexCount =  modelBufferData.indices_indices.indexCount  
  
    const meshSphereGeometry = new SphereGeometry(1,32,64);
    const meshSphere = {};
    meshSphere.vertex = new Float32Array(meshSphereGeometry.vertices);
    meshSphere.index = new Uint32Array(meshSphereGeometry.indices);    
    meshSphere.uv = new Float32Array(meshSphereGeometry.uvs);
    meshSphere.normal = new Float32Array(meshSphereGeometry.normals);
    meshSphere.tangent = new Float32Array(meshSphereGeometry.tangents);
    meshSphere.indexCount =  meshSphere.index.length; 
  
    //-------------------- TEXTURE ---------------------
    let img = new Image();
    img.src = './res/uv.jpg';
    await img.decode();
  
    const imageBitmap = await createImageBitmap(img);
  
    const sampler = device.createSampler({
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: "nearest", //nearest
      addressModeU: 'repeat',
      addressModeV: 'repeat'
    });
  
    const texture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT
    });
  
    device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: texture },
      [imageBitmap.width, imageBitmap.height]);
  


    const texture_ALBEDO =  await createTextureFromImage(device,'./res/plastic/albedo.png', {mips: true, flipY: false});
    const texture_NORMAL =  await createTextureFromImage(device,'./res/plastic/normal.png', {mips: true, flipY: false});
    const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/plastic/roughness.png', {mips: true, flipY: false});
    const texture_METALLIC =  await createTextureFromImage(device,'./res/plastic/metallic.png', {mips: true, flipY: false});
    const texture_AO =  await createTextureFromImage(device,'./res/plastic/ao.png', {mips: true, flipY: false});
    const texture_EMISSIVE =  await createTextureFromImage(device,'./res/helmet/Default_emissive.jpg', {mips: true, flipY: false});

    // const texture_ALBEDO =  await createTextureFromImage(device,'./res/rusted-steel-bl/rusted-steel_albedo.png', {mips: true, flipY: false});
    // const texture_NORMAL =  await createTextureFromImage(device,'./res/rusted-steel-bl/rusted-steel_normal-ogl.png', {mips: true, flipY: false});
    // const texture_ROUGHNESS =  await createTextureFromImage(device,'./res/rusted-steel-bl/rusted-steel_roughness.png', {mips: true, flipY: false});
    // const texture_METALLIC =  await createTextureFromImage(device,'./res/rusted-steel-bl/rusted-steel_metallic.png', {mips: true, flipY: false});
    // const texture_AO =  await createTextureFromImage(device,'./res/rusted-steel-bl/rusted-steel_ao.png', {mips: true, flipY: false});
    // const texture_EMISSIVE =  await createTextureFromImage(device,'./res/helmet/Default_emissive.jpg', {mips: true, flipY: false});

    const samplerPBR = device.createSampler({
      minFilter: 'linear',
      magFilter: 'linear',
      mipmapFilter: "linear", //nearest
      addressModeU: 'repeat',
      addressModeV: 'repeat'
    });  

    //CUBEMAP 
    const sampler_CUBEMAP = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });
    //
    
    const TEXs ={
      texture,
      sampler,
      PBR : {
        texture_ALBEDO,
        texture_NORMAL,
        texture_ROUGHNESS,
        texture_METALLIC,
        texture_AO,
        texture_EMISSIVE,
        samplerPBR

      },
      CUBEMAP : {
        sampler_CUBEMAP,
        
      }
    }  
  
    const MODELs = {
      meshSphere,
      modelForRender,
      plane
    }  

    const RES = {
      TEXs,
      MODELs
    }   


    return {RES}
  }
