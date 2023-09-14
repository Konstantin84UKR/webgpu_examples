import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';
import { RectangleGeometry } from '../../common/primitives/RectangleGeometry.js';
import { gltfLoader ,LoadJSONUsingPromise} from '../../common/gltfLoader.js';

export async function initResurse(device) {
    //-------------------- MESH --------------------- 
    let CUBE = {};
    await loadJSON(CUBE, './res/Model.json');
  
    const mesh0 = CUBE.mesh.meshes[0];
    const model = {};
    model.vertex = new Float32Array(mesh0.vertices);
    model.uv = new Float32Array(mesh0.texturecoords[0]);
    model.index = new Uint32Array(mesh0.faces.flat());
    model.normal = new Float32Array(mesh0.normals);
  
    const mesh1 = CUBE.mesh.meshes[1];
    const plane = {};
    plane.vertex = new Float32Array(mesh1.vertices);
    plane.uv = new Float32Array(mesh1.texturecoords[0]);
    plane.index = new Uint32Array(mesh1.faces.flat());
    plane.normal = new Float32Array(mesh1.normals);

    const rectangleGeometry = new RectangleGeometry(10,10,1,1);
   
    plane.vertex = new Float32Array(rectangleGeometry.vertices);
    plane.uv = new Float32Array(rectangleGeometry.uvs);
    plane.normal = new Float32Array(rectangleGeometry.normals);
    plane.index = new Uint32Array(rectangleGeometry.indices);


    // BUNNY
    let gltf = await LoadJSONUsingPromise('./res/bunny.gltf');

    const gltfModel = new gltfLoader(device,gltf);
    //console.log(gltfModel.gltf);
    gltfModel.getMesh();

    const modelBufferData = gltfModel.meshes[0].data;
    const bunny = {};
    bunny.vertexBuffer = modelBufferData.attribute_POSITION.gpuBufferData;
    bunny.uvBuffer = modelBufferData.attribute_TEXCOORD_0.gpuBufferData;
    bunny.normalBuffer = modelBufferData.attribute_NORMAL.gpuBufferData;
    //const bunny = modelBufferData.attribute_TANGENT.gpuBufferData;
    bunny.indexBuffer = modelBufferData.indices_indices.gpuBufferData;
    bunny.indexCount =  modelBufferData.indices_indices.indexCount
  
  
    const meshSphereGeometry = new SphereGeometry(0.1, 32, 16);
    const ligthHelper = {};
    ligthHelper.vertex = new Float32Array(meshSphereGeometry.vertices);
    ligthHelper.index = new Uint32Array(meshSphereGeometry.indices);
    //-------------------- TEXTURE ---------------------
    let img = new Image();
   // img.src = './res/uv.jpg'; //'./tex/yachik.jpg'; //paper
    img.src = './res/uv.jpg'; //'./tex/yachik.jpg';
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
  
  
    return { model, plane, texture, sampler ,ligthHelper,bunny}
  }

  async function loadJSON(result, modelURL) {
    var xhr = new XMLHttpRequest();
  
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