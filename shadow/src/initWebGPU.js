export async function initWebGPU(debag = false) {

    const canvas = document.getElementById("canvas-webgpu");
    if(0){
      canvas.width = 400;
      canvas.height = 400;
    }else{
      canvas.width = 1600;
      canvas.height = 900;
    }    
  
    const adapter = await navigator.gpu.requestAdapter();
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
  
    return { device, context, format, size, canvas }
  }