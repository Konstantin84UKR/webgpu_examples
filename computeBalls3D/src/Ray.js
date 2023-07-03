
import {
    mat4, vec3
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
        this.origin = camera.eye;
        this.dir = camera.front;//vec3.normalize(dir);
        this.t = 100.;
        this.canvas = canvas;
        this.camera = camera;

        this.canvas.addEventListener("mousedown", this.mouseDown.bind(this), false);
    }

    at(){
       const d = vec3.scale(this.dir, this.t);
       const p = vec3.add(this.origin, d);
       return  p;
    }

    mouseDown(e) {
        // console.log('mouseDown');
        if (e.which == 1) {
           
            this.dX = 2.0 * ((e.pageX) / this.canvas.width - 0.5);
            this.dY = -2.0 * ((e.pageY) / this.canvas.height - 0.5);
            const coords = { x: this.dX, y:this.dY }
                                   
            let dir = vec3.set(coords.x, coords.y, 1);

            // unproject(camera) {
            //     return this.applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld);
            // }

            //.unproject(camera).sub(this.ray.origin).normalize();
            // this.ray.direction.set(coords.x, coords.y, 0.5).unproject(camera).sub(this.ray.origin).normalize();
            
            let pInverse = mat4.inverse(this.camera.pMatrix); 
            let vInverse = mat4.inverse(this.camera.vMatrix); 

            let matrixWorld = this.camera.worldMatrix;
            //matrixWorld = mat4.translate(matrixWorld, this.camera.eye);

            //let m = mat4.multiply(pInverse, vInverse);

            dir = vec3.transformMat4(dir, pInverse);
            dir = vec3.normalize(dir);
            // //dir = vec3.sub(this.origin,dir);
            //dir = vec3.negate(dir);
            dir = vec3.sub(dir, this.camera.eye);
            //this.dir = vec3.normalize(dir);
//            this.dir = dir;  
            //this.at();
           
           
            // const planeNormal = vec3.set(0,0,1);
            // const denominator = vec3.dot(planeNormal, this.dir);
            // this.t = - (vec3.dot(this.origin, planeNormal) + 0) / denominator;
            
            this.dir = vec3.normalize(vec3.set(coords.x, coords.y,-1.0));
            
            e.preventDefault();
            return false;
        }

    }
}