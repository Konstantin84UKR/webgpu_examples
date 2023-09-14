/**gltf
 * Scene
 * nodes
 * meshs
 * accessors
 * bufferViews
 * buffers
 * 
 * buffers_WebGPU
 */



export class gltfLoader {
    //----- static -------------------------------------------------------/


    //------------------------------------------------------------/

    constructor(device, gltf) {
        this.gltf = gltf;
        this.device = device;
        this.scenes = gltf.scenes;
        this.nodes = gltf.nodes;
        this.meshes = gltf.meshes;
        this.accessors = gltf.accessors;
        this.bufferViews = gltf.bufferViews;
        this.buffers = gltf.buffers;

        this.meshBufewrData = [];
    }


    getMesh(){
        this.meshes.forEach(mesh => {
            mesh.data = {};
            mesh.primitives.forEach(primitiv => {
                
                for (var primitivName in primitiv) {
                    if (primitiv.hasOwnProperty(primitivName)) {
                                               
                        if (primitivName === "attributes"){
             
                            for (var attribute in primitiv[primitivName]) {
                                                       
                                const accessorIndex = primitiv['attributes'][attribute];
                                const accessor = this.accessors[accessorIndex];
                                const bufferView = this.bufferViews[accessor.bufferView];
                                const gpuBufferData = this.createVertexBufferForBufferView(bufferView, false);

                                mesh.data['attribute_' + attribute] = {
                                    accessor, gpuBufferData
                                };

                            }

                        } else if (primitivName === "indices") {
                            const accessorIndex = primitiv[primitivName];
                            const accessor = this.accessors[accessorIndex]; 
                            const bufferView = this.bufferViews[accessor.bufferView];
                            const gpuBufferData = this.createVertexBufferForBufferView(bufferView, true);
                            const indexCount = accessor.count;
                            mesh.data['indices_' + primitivName] = {
                                accessor, gpuBufferData, indexCount
                            };
                        }

                    }
                }   

            });
            
        });
    }


    /////////////////////////////////////////////////////////
    createVertexBufferForBufferView(bufferView, INDEX) {
        const buffer = this.getArrayBufferForGltfBuffer(bufferView.buffer);

        if (INDEX == true) {
            const gpuBuffer = this.device.createBuffer({
                size: Math.ceil(bufferView.byteLength / 4) * 4,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });

            const gpuBufferArray = new Uint8Array(gpuBuffer.getMappedRange());
            gpuBufferArray.set(new Uint8Array(buffer, bufferView.byteOffset, bufferView.byteLength));
            gpuBuffer.unmap();

            return gpuBuffer;
        } else {
            const gpuBuffer = this.device.createBuffer({
                size: Math.ceil(bufferView.byteLength / 4) * 4,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });

            const gpuBufferArray = new Uint8Array(gpuBuffer.getMappedRange());
            gpuBufferArray.set(new Uint8Array(buffer, bufferView.byteOffset, bufferView.byteLength));
            gpuBuffer.unmap();

            return gpuBuffer;
        }
    }

    _base64ToArrayBuffer(base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    getArrayBufferForGltfBuffer(bufferIndex) {

        const buffer_STRING = this.gltf.buffers[bufferIndex];
        const bufferRAW = buffer_STRING.uri.split(",");

        const dataBin = this._base64ToArrayBuffer(bufferRAW[1])

        return dataBin;
    }


}

/////////////////////////////////////////////////////////////////////

// export async function LoadJSONUsingPromise(URL) {
//     let promise = new Promise(function (resolve, reject) {
//         let xhr = new XMLHttpRequest();
//         xhr.open("GET", URL, true);
//         xhr.onload = () => resolve(xhr.responseText);
//         xhr.onerror = () => resolve(console.log(xhr.statusText));
//         xhr.send();
//     });
//     return promise;
// }

export async function LoadJSONUsingPromise(URL) {

    let response = await fetch(URL).then(response=>{
      //console.log(response.json());
      return response.json();
    });
    
    return response;
  }

