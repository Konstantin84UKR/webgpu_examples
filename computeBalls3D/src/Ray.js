
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
        this.t = 30.;
        this.canvas = canvas;
        this.camera = camera;

        this.canvas.addEventListener("mousedown", this.mouseDown.bind(this), false);
        //this.canvas.addEventListener("mousemove", this.mouseDown.bind(this), false);
    }

    at(){
       const d = vec3.scale(this.dir, this.t);
       const p = vec3.add(this.origin, d);
       return  p;
    }

    mouseDown(e) {
        // console.log('mouseDown');
        if (e.which == 1) {
          
            this.origin = this.camera.eye;

            this.dX = 2.0 * (e.layerX) / this.canvas.width - 1.0;
            this.dY = -2.0 * (e.layerY) / this.canvas.height + 1.0;
            //const coords = { x: this.dX, y:this.dY }
                                   
            //let dir = vec4.set(coords.x, coords.y, 0.0,1.0);

            const screenSpaceObject = {x:e.layerX, y:e.layerY};
            const windowSize = {x:this.canvas.width, y:this.canvas.height};
            
            const screenWorldCoords = this.screenToWorld(screenSpaceObject,windowSize,this.camera.vMatrix,this.camera.pMatrix);
            console.log("///////////////////////////");
            console.log("screenWorldCoords");
            console.log(screenWorldCoords);

            // unproject(camera) {
            //     return this.applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld);
            // }

            //.unproject(camera).sub(this.ray.origin).normalize();
            // this.ray.direction.set(coords.x, coords.y, 0.5).unproject(camera).sub(this.ray.origin).normalize();
            
            // let pInverse = mat4.inverse(this.camera.pMatrix); 
            // let vInverse = mat4.inverse(this.camera.vMatrix); 

            // let matrixWorld = this.camera.worldMatrix;
            // //matrixWorld = mat4.translate(matrixWorld, this.camera.eye);

            // //let m = mat4.multiply(pInverse, vInverse);

            // dir = vec4.transformMat4(dir, pInverse);
            // dir = vec4.transformMat4(dir, vInverse);
            //dir = vec4.normalize(dir);
            // //dir = vec3.sub(this.origin,dir);
            //dir = vec3.negate(dir);
            //dir = vec3.set(0.0,0.0,0.0);
            //console.log(dir);
            // dir[0] = dir[0] / dir[3];
            // dir[1] = dir[1] / dir[3];
            // dir[2] = dir[2] / dir[3];

            //dir = vec4.normalize(dir);
            //let dir3 = vec3.sub(vec3.set(screenWorldCoords[0],screenWorldCoords[1],screenWorldCoords[3]), this.camera.eye)
            //let dir3 = vec3.sub(vec3.set(dir[0],dir[1],dir[3]), vec3.set(0.0,0.0,0.0))
            //dir = vec4.set(dir3[0],dir3[1],dir3[2],1.0);
           // dir = vec3.sub(vec3.set(0.0,0.1,-1.0), vec3.set(0.0,0.0,0.0));
            //dir[2] = 0.;
           
            //let vInverse = mat4.identity(); //mat4.clone(this.camera.vMatrix); 
            //vInverse = mat4.translation([2.0,2.0,2.0]);
            // let vInverse = mat4.clone(this.camera.vMatrix); 
            // vInverse[12] = 0 
            // vInverse[13] = 0 
            // vInverse[14] = 0 

           //this.dir = vec4.transformMat4(screenWorldCoords, vInverse);
           // let dir3 = vec3.sub(vec3.set(dir[0],dir[1],dir[3]), vec3.set(0.0,0.0,0.0))
            //this.dir = vec4.normalize(screenWorldCoords);
            this.dir = vec4.normalize(screenWorldCoords);
//        
            console.log("dir");
            console.log(this.dir);
           
            // const planeNormal = vec3.set(0,0,1);
            // const denominator = vec3.dot(planeNormal, this.dir);
            // this.t = - (vec3.dot(this.origin, planeNormal) + 0) / denominator;
            
            //this.dir = vec3.normalize(vec3.set(coords.x, coords.y, -1.0));
            //this.dir = dir;
            
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