import {
    vec3,vec4,mat4,
  } from '../../common/wgpu-matrix.module.js';

export class Group{
    
    #matrix = mat4.identity();
    #matrixLocal = mat4.identity();
    #origin = vec4.create(); 
    #parent = null;

    constructor(){
      
        this.child = [];
       
    }

    set parent(p){
        this.#parent = p; 
    } 

    get parent(){
        return this.#parent; 
    }

    set origin(v){
        this.#origin = vec4.create(v[0],v[1],v[2],1);
       // mat4.setTranslation(this.#matrix,this.#origin,this.#matrix);  
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

    get matrixLocal(){
        return this.#matrixLocal; 
    }

    set matrixLocal(m){
        this.#matrixLocal = m; 
       // this.upDateMatrix();
    } 

    childAdd(c){
        this.child.push(c);
    }
    childDel(c){
        this.child = this.child.filter((n) => {return n != c});
    }
    
    upDateMatrix(){        
     
        mat4.setTranslation(this.#matrixLocal, this.#origin, this.#matrixLocal); 
        mat4.mul(mat4.identity() , this.#matrixLocal , this.#matrix)
    
        if(this.#parent !== null){
           mat4.mul(this.#parent.matrix , this.#matrix , this.#matrix);  
        }
                     
    }

    translate(vx,vy,vz){
        vec4.add(this.#origin,vec4.create(vx,vy,vz,1),this.#origin); 
       // mat4.setTranslation(this.#matrixLocal,this.#origin,this.#matrixLocal); 
    }

    rotateX(r){

        mat4.rotateX(this.#matrixLocal, r ,this.#matrixLocal);   
    }
    rotateY(r){
        mat4.rotateY(this.#matrixLocal, r ,this.#matrixLocal);   
    }
    rotateZ(r){
        let m = mat4.identity();
        //mat4.setTranslation(m, this.#origin, m); 
        mat4.rotateZ(m, r , this.#matrixLocal);   
    }
}