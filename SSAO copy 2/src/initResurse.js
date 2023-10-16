import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { RectangleGeometry } from '../../common/primitives/RectangleGeometry.js';
import { BoxGeometry } from '../../common/primitives/BoxGeometry.js';
import { gltfLoader ,LoadJSONUsingPromise} from '../../common/gltfLoader.js';

export async function initResurse(device) {
    //-------------------- MESH --------------------- 
    const plane = {};
    const rectangleGeometry = new RectangleGeometry(10,10,1,1);
   
    plane.vertex = new Float32Array(rectangleGeometry.vertices);
    plane.uv = new Float32Array(rectangleGeometry.uvs);
    plane.normal = new Float32Array(rectangleGeometry.normals);
    plane.index = new Uint32Array(rectangleGeometry.indices);

    // BUNNY
    let gltf = await LoadJSONUsingPromise('./res/bunny.gltf');
    const gltfModel = new gltfLoader(device,gltf);
    gltfModel.getMesh();

    const modelBufferData = gltfModel.meshes[0].data;
    const bunny = {};
    bunny.vertexBuffer = modelBufferData.attribute_POSITION.gpuBufferData;
    bunny.uvBuffer = modelBufferData.attribute_TEXCOORD_0.gpuBufferData;
    bunny.normalBuffer = modelBufferData.attribute_NORMAL.gpuBufferData;
    bunny.indexBuffer = modelBufferData.indices_indices.gpuBufferData;
    bunny.indexCount =  modelBufferData.indices_indices.indexCount  
  
    const meshSphereGeometry = new SphereGeometry(0.1, 32, 16);
    const ligthHelper = {};
    ligthHelper.vertex = new Float32Array(meshSphereGeometry.vertices);
    ligthHelper.index = new Uint32Array(meshSphereGeometry.indices);    
    ligthHelper.uv = new Float32Array(meshSphereGeometry.uvs);
    ligthHelper.normal = new Float32Array(meshSphereGeometry.normals);

    const meshBoxGeometry = new BoxGeometry(1, 1, 1, 1, 1, 1);
    const box = {};
    box.vertex = new Float32Array(meshBoxGeometry.vertices);
    box.index = new Uint32Array(meshBoxGeometry.indices);    
    box.uv = new Float32Array(meshBoxGeometry.uvs);
    box.normal = new Float32Array(meshBoxGeometry.normals);

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
  
  
    return { plane, texture, sampler , ligthHelper, bunny, box}
  }
