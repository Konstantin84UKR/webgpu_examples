import {
    vec3,vec4,mat4,
  } from '../../common/wgpu-matrix.module.js';

export class Group{
    
    #matrix = mat4.identity();
    #origin = vec4.create(); 
    constructor(){
      
        this.child = [];
        this.parent = null;

    }

    // set parent(p){
    //     this.parent = p; 
    // } 

    // get parent(){
    //     return this.parent; 
    // }

    set origin(v){
        this.#origin = vec4.create(v[0],v[1],v[2],1); 
        this.upDateMatrix();
    } 

    get origin(){
        return this.#origin; 
    }
 

    get matrix(){
        return this.#matrix; 
    }

    set matrix(m){
        this.#matrix = m; 
       // this.upDateMatrix();
    } 

    childAdd(c){
        this.child.push(c);
    }
    childDel(c){
        this.child = this.child.filter((n) => {return n != c});
    }
    
    upDateMatrix(){
        
        mat4.setTranslation(this.#matrix,this.#origin,this.#matrix); 
    }

    translate(v){
        vec4.add(this.#origin,vec4.create(v[0],v[1],v[2],1),this.#origin); 
        this.upDateMatrix();
    }
}