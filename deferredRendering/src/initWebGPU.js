export async function initWebGPU(canvas) {

    // const canvas = document.getElementById("canvas-webgpu");
    // canvas.width = 400;
    // canvas.height = 400;
  
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