import {
    mat4, vec3
} from './wgpu-matrix.module.js';

export class Ball{
    constructor(radius, mass, position, velocity,id){
        this.radius = radius;
        this.mass = mass;
        this.position = vec3.clone(position); 
        this.oldPosition =  vec3.clone(position); ;
        this.velocity =  vec3.clone(velocity); ;
       
        this.marker = false;
        this.bounce = - 0.9;
        this.id = id;
        this.activ = false;
    }
    simulate(dt, gravity) {
        // this.vel.add(gravity, dt);
        // this.pos.add(this.vel, dt);          
    }
} 


