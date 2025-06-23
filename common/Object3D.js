import {
  mat4,
} from '../../common/wgpu-matrix.module.js';
import { vec3 } from '../camera/src/wgpu-matrix.module.js';

export class Object3D {
    constructor() {
       
       this.children = [];
       this.name = "Object3D";
       this.parent = null;
       this.modelMatrix = mat4.identity(); 
       this.worldMatrix = mat4.identity();
       this.scale = vec3.create(1, 1, 1);
       this.positionVec = vec3.create(0, 0, 0);
    }

    addChild(child) {
        if (child instanceof Object3D) {
            child.parent = this;
        } else {
            console.error("child is not an instance of Object3D");
        }
        this.children.push(child);
    }  
    
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            child.parent = null;
        } else {
            console.error("child not found in children array");
        }
    } 

    setParent(parent) {
        if (parent instanceof Object3D) {
            this.parent = parent;
        } else {
            console.error("parent is not an instance of Object3D");
        }
    }

    removeParent() {
        if (this.parent) {
            const index = this.parent.children.indexOf(this);
            if (index > -1) {
                this.parent.children.splice(index, 1);
                this.parent = null;
            } else {
                console.error("this object not found in parent's children array");
            }
        } else {
            console.error("this object has no parent to remove");
        }
    }
    
    updateWorldMatrix() {
        if (this.parent) {
            this.worldMatrix = mat4.identity();
            this.worldMatrix = mat4.multiply(this.worldMatrix, this.parent.worldMatrix);
           // this.worldMatrix = mat4.scale(this.worldMatrix, this.scale);
            this.worldMatrix = mat4.multiply(this.worldMatrix, this.modelMatrix);    
            
            
          

        } else {
            this.worldMatrix = this.modelMatrix;
        }
        for (const child of this.children) {
            child.updateWorldMatrix();
        }
    }

    

    setScale(v) {
        this.scale = vec3.create(v[0], v[1], v[2]);

        this.modelMatrix = mat4.scale(this.modelMatrix, this.scale);
        this.updateWorldMatrix();
    }

    translate(v) {
        this.modelMatrix = mat4.translate(this.modelMatrix, v);
        this.updateWorldMatrix();
    }

    rotate(angle, axis) {
        this.modelMatrix = mat4.rotate(this.modelMatrix, angle, axis);
        this.updateWorldMatrix();
    }

    rotateX(angle) {
        this.modelMatrix = mat4.rotateX(this.modelMatrix, angle);
        this.updateWorldMatrix();
    }

    rotateY(angle) {
        this.modelMatrix = mat4.rotateY(this.modelMatrix, angle);
        this.updateWorldMatrix();
    }

    rotateZ(angle) {
        this.modelMatrix = mat4.rotateZ(this.modelMatrix, angle);
        this.updateWorldMatrix();
    }

    setPosition(v) {
        this.modelMatrix = mat4.setTranslation(this.modelMatrix, v);
        this.updateWorldMatrix();
    }

    getPosition() {
        return mat4.getTranslation(this.modelMatrix);
    }

    lookAt(target, up = [0, 0, 1]) {
        // if (!Array.isArray(target) || target.length !== 3) {
        //     console.error("target must be a 3D vector");
        //     return;
        // }
        up = new Float32Array(up);
        // const direction = vec3.subtract(target, this.getPosition());
        // //const up = [0, 1, 0]; // Assuming a default up vector
        // const right = vec3.cross(direction, up);
        // const newUp = vec3.cross(right, direction);

       



       // const rotMatrix = mat4.cameraAim(this.getPosition(), target, up);
        
        //this.modelMatrix = mat4.cameraAim(this.getPosition(), target, up);
        this.modelMatrix = mat4.aim(this.getPosition(), target, up);
        this.modelMatrix = mat4.scale(this.modelMatrix, this.scale);
        
        //this.updateWorldMatrix();
    }
    



}