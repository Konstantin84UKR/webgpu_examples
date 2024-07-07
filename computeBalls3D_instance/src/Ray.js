
import {
    mat4, vec3, vec4
} from './wgpu-matrix.module.js';

// Ray   r = o + td;

// -dot(отправная точка луча - позиция нормаля, нормаль) / dot(вектор луча, нормаль)

// T = -dot(a - b, n) / dot(v, n)
// const denominator = plane.normal.dot(this.direction);
// const t = - (this.origin.dot(plane.normal) + plane.constant) / denominator;

// unproject(camera) {

//     return this.applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld);

// }

// this.ray.origin.setFromMatrixPosition(camera.matrixWorld);
// this.ray.direction.set(coords.x, coords.y, 0.5).unproject(camera).sub(this.ray.origin).normalize();
// this.camera = camera;

export class Ray{
    constructor(origin, dir, canvas, camera){
        this.origin = origin;
        this.dir = camera.front;//vec3.normalize(dir);
        this.t = 60.;
        this.canvas = canvas;
        this.camera = camera;

        //this.canvas.addEventListener("mousedown", this.mouseDown.bind(this), false);
        //this.canvas.addEventListener("mousemove", this.mouseDown.bind(this), false);
    }

    at(t){
       const d = vec3.scale(this.dir,t);
       const p = vec3.add(this.origin, d);
       return  p;
    }

    mouseDown(e) {
        // console.log('mouseDown');
        if (e.which == 1) {
          
            this.origin = this.camera.eye;

           
            const screenSpaceObject = {x:e.layerX, y:e.layerY};
            const windowSize = {x:this.canvas.width, y:this.canvas.height};
            
            const screenWorldCoords = this.screenToWorld(screenSpaceObject,windowSize,this.camera.vMatrix,this.camera.pMatrix);
            // console.log("///////////////////////////");
            // console.log("screenWorldCoords");
            // console.log(screenWorldCoords);

            
            this.dir = vec4.normalize(screenWorldCoords);
      
            // console.log("dir");
            // console.log("x = " +  this.dir[0] + " y = " +  this.dir[1] +  " z = " +  this.dir[2]);
            
            e.preventDefault();
            return false;
        }

    }

   screenToWorld(screenSpaceObject, windowSize, view, projection) {
        const x =  2.0 * screenSpaceObject.x / windowSize.x - 1.0;
        const y = -2.0 * screenSpaceObject.y / windowSize.y + 1.0;       
    
        //const viewProjectionInverse = mat4.inverse(mat4.multiply(projection, view)); // mat4.multiply(pInverse, vInverse); projection * view
        const projectionInverse = mat4.inverse(projection);
        let viewInverse = mat4.inverse(view);
       
        viewInverse[12] = 0; 
        viewInverse[13] = 0; 
        viewInverse[14] = 0; 
        
        const viewProjectionInverse = mat4.multiply(viewInverse, projectionInverse);
        const worldSpacePosition = vec4.set(x, y, 0.0, 1.0);
    
        return vec4.transformMat4(worldSpacePosition, viewProjectionInverse); //vec4.transformMat4(dir, pInverse); viewProjectionInverse * worldSpacePosition
    }
}