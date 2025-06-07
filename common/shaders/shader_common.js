
const GAMMA = 2.2;
const INV_GAMMA = (1 / GAMMA);

// shader_common.js
export const mathDefines = `
  const PI : f32 = ${Math.PI};
  const DEG_TO_RAD : f32 = ${180.0 / Math.PI};
  const INV_GAMMA = ${INV_GAMMA};
  const GAMMA = ${GAMMA};
`;

export const srgbUtils = `
  fn linearToSrgb(color : vec3f) -> vec3f {
    return pow(linear, vec3<f32>(${INV_GAMMA}));
  }
`;

export const cameraStruct = `
    struct Camera {
      pMatrix : mat4x4<f32>,
      vMatrix : mat4x4<f32>,
      position : vec4<f32>   
}`;

export const lin2rgb = `
    fn lin2rgb(lin: vec3<f32>) -> vec3<f32>{
        return pow(lin, vec3<f32>(${INV_GAMMA}));
      }`;

export const rgb2lin = `
    fn rgb2lin(rgb: vec3<f32>) -> vec3<f32>{
        return pow(rgb, vec3<f32>(${GAMMA}));
      }`;

export const UniformPVM = `  
      struct UniformPVM {
        pMatrix : mat4x4<f32>,
        vMatrix : mat4x4<f32>,
        mMatrix : mat4x4<f32>,      
      }`;    

export const brdfPhong = `
   fn brdfPhong(lighDir: vec3<f32>, 
        
        viewDir: vec3<f32>, 
        halfDir: vec3<f32>, 
        normal: vec3<f32>,
        phongDiffuseColor: vec3<f32>,
        phongSpecularColor: vec3<f32>,
        phongShiniess:f32) -> vec3<f32>{
        
        var color : vec3<f32> =  phongDiffuseColor; 
        let specDot : f32 = max(dot(normal, halfDir),0.0);
        color +=  pow(specDot, phongShiniess) * phongSpecularColor;
        return color;  
 }`;

 export const Light = `
   struct Light {   
     lightColor : vec4<f32>,        
     lightPosition : vec3<f32>,
     lightType : u32, // 0 - directional, 1 - point, 2 - spot           
   };`;


