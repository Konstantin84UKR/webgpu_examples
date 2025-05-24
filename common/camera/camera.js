import {
    mat4, vec3, quat
} from '../../camera/src/wgpu-matrix.module.js';

export class Camera {
    constructor(canvas, eye = vec3.create(0.0, 0.0, 10.0), front = vec3.create(0.0, 0.0, -1.0),) {
        this.canvas = canvas;
        this.cameraBuffer = null;
        this.pMatrix = mat4.identity();
        this.vMatrix = mat4.identity();
        this.vMatrixRotOnly = mat4.identity();
        this.worldMatrix = mat4.identity();

        this.speedCamera = 0.01;

        this.fovy = 45 * Math.PI / 180;

        this.eye = eye;
        this.front = front;
        this.upWorld = vec3.create(0.0, 1.0, 0.0);
        this.right = vec3.cross(this.front, this.upWorld);
        this.up = vec3.cross(this.right, this.front);

        

        // console.log(this.front);
        // console.log(this.up);
        // console.log(this.right);

        this.look = vec3.add(this.eye, this.front);

        this.yaw = 90.0 * Math.PI / 180;//-90.0*Math.PI/180;
        this.pitch = 0.0;//-90.0*Math.PI/180;


        this.deltaTime = 1.0;

        this.drag = false;
        this.old_x = undefined;
        this.old_y = undefined;
        this.dX = 0.0;
        this.dY = 0.0;

        window.addEventListener("keydown", this.onkeydown.bind(this), false);
        window.addEventListener("keypress", this.onkeypress.bind(this), false);
        window.addEventListener("keyup", this.onkeyup.bind(this), false);

        this.canvas.addEventListener("mousedown", this.mouseDown.bind(this), false);
        this.canvas.addEventListener("mouseout", this.mouseOut.bind(this), false);
        this.canvas.addEventListener("mousemove", this.mouseMove.bind(this), false);
        this.canvas.addEventListener("mouseup", this.mouseUp.bind(this), false);

        this.update();
    }

    setPosition(v) {
        this.eye = vec3.create(v[0], v[1], v[2]);
        //this.look = vec3.create(v[0], v[1], v[2]);

        this.update();
    }
    setLook(v) {
       
        this.front = vec3.create(v[0], v[1], v[2]);
        this.updateCameraVectors()
        this.update();
    }

    setDeltaTime(t) {
        this.deltaTime = t;
    }

    lookAt() {
        // glMatrix.vec3.add(this.look, this.front, this.eye);
        // //glMatrix.vec3.normalize(this.look,this.look); 
        // glMatrix.mat4.lookAt(this.vMatrix, this.eye, this.look, this.up);        
    }

    update() {

        this.pMatrix = mat4.perspective(this.fovy, this.canvas.width / this.canvas.height, 1, 500);
        this.vMatrix = mat4.lookAt(this.eye, this.look, this.up);

        this.vMatrixRotOnly = mat4.copy(this.vMatrix);
        this.vMatrixRotOnly[12] = 0;
        this.vMatrixRotOnly[13] = 0;
        this.vMatrixRotOnly[14] = 0;

        // this.front = mat4.getAxis(this.vMatrix, 2);
        // this.updateCameraVectors();


    }

    getMatrixWorld() {
        this.updateCameraVectors();


    }

    updateCameraVectors() {

        this.look = vec3.add(this.eye, this.front);
        this.right = vec3.cross(this.front, this.upWorld);
        this.up = vec3.cross(this.right, this.front);

        const Fz = vec3.normalize(this.front); 
        const Rx = vec3.normalize(this.right);
        const Uy = vec3.normalize(this.up);      

        this.worldMatrix = mat4.create(
            Rx[0], Rx[1], Rx[2], this.eye[0],
            Uy[0], Uy[1], Uy[2], this.eye[1], 
            Fz[0], Fz[1], Fz[2], this.eye[2], 
            0, 0, 0, 1);

    }


    translate_eye(key) {
        let temp = vec3.create(0, 0, 0);
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
                break;
            
            case "D":
                temp = vec3.cross(this.up, this.front);
                temp = vec3.normalize(temp);
                temp = vec3.negate(temp);
                break;

            case "Q":                
                temp = vec3.normalize(this.up);
                temp = vec3.negate(temp);
                break;

            case "E":               
                temp = vec3.normalize(this.up);              
                break;        
            default:
                this.eye = vec3.add(this.eye, temp);
                break;
        }
        temp = vec3.scale(temp, this.speedCamera * this.deltaTime);
        this.eye = vec3.add(this.eye, temp);
        this.look = vec3.add(this.look, temp);

        console.log("this.front = " + this.front);

        this.update();
    }

    rotate_eye(key) {

        this.dX = 0;
        this.dY = 0;

        switch (key) {
            case "ArrowRight":
                this.dX = (this.canvas.width * this.speedCamera) / this.canvas.width * Math.PI;
                break;
            case "ArrowLeft":
                this.dX = (this.canvas.width * -this.speedCamera) / this.canvas.width * Math.PI;
                break;
            case "ArrowUp":
                this.dY = (this.canvas.height * -this.speedCamera) / this.canvas.height * Math.PI;
                break;
            case "ArrowDown":
                this.dY = (this.canvas.height * this.speedCamera) / this.canvas.height * Math.PI;
                break;
            default:
                this.dX = 0;
                this.dY = 0;
                break;
        }

        this.yaw -= this.dX;
        this.pitch -= this.dY;

        this.upDateRotate();
        this.updateCameraVectors();
        this.update();
    }

    onkeydown(e) {

        if (e.key === "ArrowRight") { this.rotate_eye('ArrowRight') }
        if (e.key === "ArrowLeft") { this.rotate_eye('ArrowLeft') }
        if (e.key === "ArrowUp") { this.rotate_eye('ArrowUp') }
        if (e.key === "ArrowDown") { this.rotate_eye('ArrowDown') }

    };

    onkeypress(e) {

        if (e.key === "w") { this.translate_eye('W') }
        if (e.key === "s") { this.translate_eye('S') }
        if (e.key === "a") { this.translate_eye('A') }
        if (e.key === "d") { this.translate_eye('D') }

        if (e.key === "q") { this.translate_eye('Q') }
        if (e.key === "e") { this.translate_eye('E') }


        // if (e.key === "ArrowRight") { this.rotate_eye('ArrowRight') }
        // if (e.key === "ArrowLeft") { this.rotate_eye('ArrowLeft') }
        // if (e.key === "ArrowUp") { this.rotate_eye('ArrowUp') }
        // if (e.key === "ArrowDown") { this.rotate_eye('ArrowDown') }

    };

    onkeyup(e) {
    }


    mouseDown(e) {
        // console.log('mouseDown');
        if (e.which == 2) {
            this.drag = true;
            //if (this.old_x == undefined){
            this.old_x = e.pageX;

            //}
            if (this.old_y == undefined) {
                this.old_y = e.pageY;
            }
            e.preventDefault();
            return false;
        }

    }

    mouseUp(e) {
        if (e.which == 2) {
            this.drag = false;
            this.old_x = undefined;
            this.old_y = undefined;
            // this.updateCameraVectors();
        }
    }

    mouseMove(e) {
        if (!this.drag) {
            return false;
        } else {


            this.dX = 0.5 * (e.pageX - this.old_x) / this.canvas.width * Math.PI;
            this.dY = 0.5 * (e.pageY - this.old_y) / this.canvas.height * Math.PI;

            this.yaw -= this.dX;
            this.pitch -= this.dY;

            this.old_x = e.pageX;
            this.old_y = e.pageY;


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

        if (this.pitch > Math.PI * 0.49) {
            this.pitch = Math.PI * 0.49;
        }
        if (this.pitch < Math.PI * -0.49) {
            this.pitch = Math.PI * -0.49;
        }

        this.front[0] += Math.cos(-this.yaw) * Math.cos(this.pitch);
        this.front[1] += Math.sin(this.pitch);
        this.front[2] += Math.sin(-this.yaw) * Math.cos(this.pitch);

        this.front = vec3.normalize(this.front);

    }

    createBuffer(device) {
       
        const cameraBuffer = device.createBuffer({
                size: 64 + 64,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        }); 

        this.cameraBuffer = cameraBuffer;
    }

    updateBuffer(device) {
       // this.updateCameraVectors();
        device.queue.writeBuffer(this.cameraBuffer, 0, this.pMatrix);
        device.queue.writeBuffer(this.cameraBuffer, 64, this.vMatrix);
    }
}