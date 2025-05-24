import {
  mat4,
} from '../../common/wgpu-matrix.module.js';

export class Object3D {
    constructor() {
       
       this.children = [];
       this.name = "Object3D";
       this.parent = null;
       this.modelMatrix = mat4.identity(); 
       this.worldMatrix = mat4.identity();
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
            this.worldMatrix = mat4.multiply(this.worldMatrix, this.modelMatrix);            
        } else {
            this.worldMatrix = this.modelMatrix;
        }
        for (const child of this.children) {
            child.updateWorldMatrix();
        }
    }

    scale(v) {
        this.modelMatrix = mat4.scale(this.modelMatrix, v);
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

}