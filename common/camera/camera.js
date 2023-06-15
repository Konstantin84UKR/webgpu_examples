import {
    mat4, vec3, quat
} from '../../camera/src/wgpu-matrix.module.js';

export class Camera {
    constructor(canvas) {
        this.canvas = canvas;

        this.speedCamera = 0.5;
      
       
        this.fovy = 40 * Math.PI / 180;
        this.eye = vec3.create(0.0, 0.0, 10.0); //Traditional X,Y,Z 3d position
        this.look = vec3.create(0.0, 0.0, -1.0);
              
         
       
        this.front = vec3.create(0.0, 0.0, -1.0);        	//How much to scale a mesh. Having a 1 means no scaling is done.
        this.up = vec3.create(0.0, 1.0, 0.0); 	//Hold rotation values based on degrees, Object will translate it to radians
        this.right = vec3.create(1.0, 0.0, 0.0);;
        this.upWorld = vec3.create(0.0, 1.0, 0.0); 
        this.look = vec3.create(0.0, 0.0, -1.0); 

        this.q = quat.identity(); 

        this.sensitivity = 0.5;
        this.yaw = 0.0;
        this.pitch = 0.0;//-90.0*Math.PI/180;

        this.m = mat4.create();            // m = new mat4
        mat4.identity(this.m);   
        this.axis = vec3.create(0.0, 0.0, 0.0); 

       
        // this.sensitivity = 0.5;

        this.drag = false;
        this.old_x = 0.0;
        this.old_y = 0.0;
        this.dX = 0.0;
        this.dY = 0.0;


        // this.lookAt();

        window.addEventListener("keydown", this.onkeydown.bind(this), false);
        window.addEventListener("keypress", this.onkeypress.bind(this), false);
        window.addEventListener("keyup", this.onkeyup.bind(this), false);

        this.canvas.addEventListener("mousedown", this.mouseDown.bind(this), false);
        this.canvas.addEventListener("mouseout", this.mouseOut.bind(this), false);
        this.canvas.addEventListener("mousemove", this.mouseMove.bind(this), false);
        this.canvas.addEventListener("mouseup", this.mouseUp.bind(this), false);

        this.update();
    }

    setPosition(v){
        this.eye = vec3.create(v[0], v[1], v[2]);
        //this.look = vec3.create(v[0], v[1], v[2]);
      
        this.update();
    }

    lookAt() {
        // glMatrix.vec3.add(this.look, this.front, this.eye);
        // //glMatrix.vec3.normalize(this.look,this.look); 
        // glMatrix.mat4.lookAt(this.vMatrix, this.eye, this.look, this.up);        
    }

    update() {

        this.pMatrix = mat4.perspective(this.fovy, this.canvas.width / this.canvas.height, 1, 25);
        this.vMatrix = mat4.lookAt(this.eye, this.look, this.upWorld); 
       
       // this.front = mat4.getAxis(this.vMatrix, 2);
        //this.updateCameraVectors();
       

    }

    updateCameraVectors() {
        // let frontTemp = glMatrix.vec3.create();
        // frontTemp[0] = Math.cos(this.yaw) * Math.cos(this.pitch);
        // frontTemp[1] = Math.sin(this.pitch);
        // frontTemp[2] = Math.sin(this.yaw) * Math.cos(this.pitch);
        // glMatrix.vec3.negate(frontTemp, frontTemp);
        // glMatrix.vec3.normalize(this.front, frontTemp);

        // glMatrix.mat4.identity(this.transformMatFront);

        // glMatrix.vec3.cross(this.right, this.front, this.upWorld);
        // glMatrix.vec3.cross(this.up, this.right, this.front);
       
        this.front = vec3.clone(this.axis);
        this.front = vec3.normalize(this.front);
             
        this.look = vec3.add(this.eye, this.front);

        this.right = vec3.cross(this.front, this.upWorld);
        this.right = vec3.normalize(this.right);
       
        this.up = vec3.cross(this.front, this.right);
        this.up = vec3.normalize(this.up);


    }


    translate_eye(key) {
        let temp = vec3.create(0,0,0);
        switch (key) {
            case "W":
                temp = vec3.clone(this.front);              
                break;
            case "S":
                temp = vec3.clone(this.front);
                temp = vec3.negate(temp);
                break;
            case "A":
                temp = vec3.cross(this.up, this.front);
                temp = vec3.normalize(temp);
                temp = vec3.negate(temp);
                break;
            case "D":
                temp = vec3.cross(this.up, this.front);
                temp = vec3.normalize(temp);
                //temp = vec3.negate(temp);
                break;
            default:
                this.eye = vec3.add(this.eye, temp);
            break;
        }
        temp = vec3.scale(temp, this.speedCamera);
        this.eye = vec3.add(this.eye, temp);
        this.look = vec3.add(this.look, temp);
      
        this.update();
    }

    onkeydown(e) {

        // if (e.key === "w") { this.translate_eye('W')}
        // if (e.key === "s") { this.translate_eye('S')}
        // if (e.key === "a") { this.translate_eye('A')}
        // if (e.key === "d") { this.translate_eye('D')}

    };

    onkeypress(e) {

        if (e.key === "w") { this.translate_eye('W') }
        if (e.key === "s") { this.translate_eye('S') }
        if (e.key === "a") { this.translate_eye('A') }
        if (e.key === "d") { this.translate_eye('D') }

    }; 

    onkeyup(e) {
    }
   

    mouseDown(e) {
        // console.log('mouseDown');
         if(e.which == 2){
             this.drag = true;
             this.old_x = e.pageX, this.old_y = e.pageY;
             e.preventDefault();
             return false;
         }
       
    }

    mouseUp(e) {
        if (e.which == 2) {
            this.drag = false;
        }
    }

    mouseMove(e) {
        if (!this.drag) {
            return false;
        } else {

            this.dX = ((e.pageX - this.old_x) * 2 * Math.PI / this.canvas.width) * 0.5;
            this.dY = ((e.pageY - this.old_y) * 2 * Math.PI / this.canvas.height) * 0.5;
            this.old_x = e.pageX;
            this.old_y = e.pageY;

            // this.updateCameraVectors();
            this.upDateRotate();
            this.updateCameraVectors();
            this.update();

            e.preventDefault();
        }
        e.preventDefault();
    }

    mouseOut(e) {
        //this.drag = false;
    }



    upDateRotate() {
        // glMatrix.mat4.rotate(this.transformMatFront, this.transformMatFront, -this.dX, this.up);
        // glMatrix.mat4.rotate(this.transformMatFront, this.transformMatFront, -this.dY, this.right);
        // glMatrix.vec3.transformMat4(this.front, this.front, this.transformMatFront);

        // const m = mat4.create();            // m = new mat4
        // mat4.identity(m);                   // m = identity
       // mat4.translate(m, [1, 2, 3], m);    // m *= translation([1, 2, 3])
        mat4.rotateX(this.vMatrix, -this.dY, this.m);  // m *= rotationX(Math.PI * 0.5)
        mat4.rotateY(this.vMatrix, -this.dX, this.m); 
       
        this.axis = mat4.getAxis(this.vMatrix, 2);
        this.axis = vec3.negate(this.axis);
       // console.log('this.axis = ' + this.axis);
       // this.front = vec3.normalize(this.axis);
        ///this.front = vec3.transformQuat(this.front, this.q);

        // glMatrix.vec3.normalize(this.front, this.front);
    }


}