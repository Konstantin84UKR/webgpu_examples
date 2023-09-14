import { SphereGeometry } from '../../common/primitives/SphereGeometry.js';

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
  
  
    return { model, plane, texture, sampler ,ligthHelper}
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