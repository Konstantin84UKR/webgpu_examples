export async function initWebGPU(debag = false, width = 1600, height = 900) {

    const canvas = document.getElementById("canvas-webgpu");
    if(debag){
      canvas.width = 400;
      canvas.height = 400;
    }else{
      canvas.width = width;
      canvas.height = height;
    }    
  
    const adapter = await navigator.gpu.requestAdapter({powerPreference:"high-performance"});
    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu");
  
    const devicePixelRatio = window.devicePixelRatio || 1;
    const size = [
      canvas.clientWidth * devicePixelRatio,
      canvas.clientHeight * devicePixelRatio,
    ];
  
    const format = navigator.gpu.getPreferredCanvasFormat(); // формат данных в которых храняться пиксели в физическом устройстве //"bgra8unorm"
  
    context.configure({
      device: device,
      format: format,
      size: size,
      compositingAlphaMode: "opaque",  
    }); 

    const aspect = new Float32Array([ 1.0, 1.0]); 
    if(canvas.width > canvas.height){
      aspect[1] = canvas.width/canvas.height; 
    }else{
      aspect[0] = canvas.height/canvas.width; 
    }

  
    return { device, context, format, size, canvas ,aspect}
  }