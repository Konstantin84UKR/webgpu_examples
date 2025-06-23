//import * as glMatrix from "../common/glm/index.js";
//import { copy } from "../common/glm/mat2.js";




export class mainSIM {
	constructor(){
		// Initialize the physics scene
		this.physicsScene = {
			gravity: new Vector2(0, -9.78 * 10),
			dt: 1.0 / 60.0,
			numSteps: 100,
			worldSize: new Vector2(20, 20),
			paused: true,
			wireCenter: new Vector2(),
			wireRadius: 0.0,
			beads: [],
			friction: 0.999999,
		};

		this.simMinWidth = 20.0;
		this.simWidth = 100;
	    this.simHeight = 100;

		this.setupScene();
		//this.startSimulation();
	}
	// Canvas setup --------------------------------

	///** @type {HTMLCanvasElement} */
	// const canvas = document.getElementById("canvas");
	// canvas.width = 600;
	// canvas.height = 600;
	// const ctx = canvas.getContext('2d');

	// const simMinWidth = 20.0;
	// const cScale = Math.min(canvas.width, canvas.height) / simMinWidth;
	// const simWidth = canvas.width / cScale;
	// const simHeight = canvas.height / cScale;

	// const startTime = performance.now();

	// function cX(pos) {
	// 	return pos.x * cScale;
	// }
	// function cY(pos) {
	// 	return canvas.height - pos.y * cScale;
	// }
	// vector math -------------------------------------------------------



	// Scene ---------------------------------------
 

	setupScene() {
		
		this.physicsScene.wireCenter.x = 0;
		this.physicsScene.wireCenter.y = 0;
		this.physicsScene.wireRadius = this.simMinWidth * 0.4;
		
		var pos = new Vector2(
			this.physicsScene.wireCenter.x + this.physicsScene.wireRadius, 
			this.physicsScene.wireCenter.y);

		this.physicsScene.beads.push(new Ball(1.5, 1.5, pos, new Vector2(),this.physicsScene.friction,this.physicsScene.wireRadius));
		
		var pos1 = new Vector2(
			this.physicsScene.wireCenter.x + Math.cos(2) * this.physicsScene.wireRadius, 
			this.physicsScene.wireCenter.y + Math.sin(2) * this.physicsScene.wireRadius);
		
			this.physicsScene.beads.push(new Ball(2.0, 2.0, pos1, new Vector2(),this.physicsScene.friction,this.physicsScene.wireRadius));

		var pos2 = new Vector2(
			this.physicsScene.wireCenter.x + Math.cos(1) * this.physicsScene.wireRadius, 
			this.physicsScene.wireCenter.y + Math.sin(1) * this.physicsScene.wireRadius);
		
			this.physicsScene.beads.push(new Ball(1.0, 1.0, pos2, new Vector2(),this.physicsScene.friction,this.physicsScene.wireRadius));	
		

	}



	// Drawing -------------------------------------
	// function drawcircle(pos,radius,filled) {
	// 	ctx.beginPath();
	// 	ctx.arc(
	// 		cX(pos),cY(pos), cScale * radius , 0.0 ,Math.PI * 2
	// 	)
	// 	ctx.closePath();
	// 	if(filled){
	// 		ctx.fill();
	// 	}else{
	// 		ctx.stroke();
	// 	}
	// }

	// function drawLine(start,end,lineWidth, color) {
		
	// 	ctx.strokeStyle = color;
	// 	ctx.beginPath();
	// 	ctx.moveTo( cX(start), cY(start));
	// 	ctx.lineTo( cX(end), cY(end));
	// 	ctx.lineWidth =  cScale * lineWidth;
	// 	ctx.stroke();
	// }
	
	// function draw() {
			
		
	// 	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// 	ctx.lineWidth = 4.0;		
	// 	ctx.strokeStyle = "#5588ff"
	// 	drawcircle(physicsScene.wireCenter, physicsScene.wireRadius , false)
		
	// 	for (let index = 0; index < physicsScene.beads.length; index++) {
			
	// 		let bead = physicsScene.beads[index];
	// 		//bead
	// 		ctx.fillStyle = "#88ff55"
	// 		drawcircle(physicsScene.wireCenter, 0.3 , true)
	// 		drawLine(physicsScene.wireCenter, bead.pos, 0.1,"#88ff55")
			
	// 		ctx.fillStyle = "#ff8855"		
	// 		drawcircle(bead.pos, bead.radius ,true);			
	// 	}
		
	// }
	
	// ------------------------------------------------------

	// Simulation ----------------------------------
	handleBallCollision(ball1, ball2, restitution) {
        let dir = new Vector2();
		dir.subtractVectors(ball2.pos, ball1.pos);
		let d = dir.length();
		if (d == 0.0 || d > ball1.radius + ball2.radius)
			return;

		dir.scale(1.0 / d);

		let corr = (ball1.radius + ball2.radius - d) / 2.0;
		ball1.pos.add(dir, -corr);
		ball2.pos.add(dir, corr);

		let v1 = ball1.vel.dot(dir);
		let v2 = ball2.vel.dot(dir);

		let m1 = ball1.mass;
		let m2 = ball2.mass;

		let newV1 = (m1 * v1 + m2 * v2 - m2 * (v1 - v2) * restitution) / (m1 + m2);
		let newV2 = (m1 * v1 + m2 * v2 - m1 * (v2 - v1) * restitution) / (m1 + m2);

		ball1.vel.add(dir, newV1 - v1);
		ball2.vel.add(dir, newV2 - v2);

    }
	simulate() {
		
		let sdt = this.physicsScene.dt/this.physicsScene.numSteps;

		for (let step  = 0; step  < this.physicsScene.numSteps; step++) {
			
			for (let i = 0; i < this.physicsScene.beads.length; i++) {
				const bead = this.physicsScene.beads[i];
				bead.startStep(sdt, this.physicsScene.gravity);
				bead.keepOnWire(this.physicsScene.wireCenter)
				bead.endStep(sdt);

				for (let j = 0; j < this.physicsScene.beads.length; j++) {
					if(i == j){
						continue;
					}
					const bead1 = this.physicsScene.beads[j];
					 this.handleBallCollision(bead, bead1, bead.restitution);
				}
			}
			
		}
	}
	// // make browser to call repeatedly -------------
	// function update() {
	// 	simulate();
	// 	//draw();
	// 	requestAnimationFrame(update);
	// }
	// setupScene();
	// update();
}


class Vector2 {
		constructor(x = 0.0, y = 0.0) {
			this.x = x;
			this.y = y;
		}

		set(v) {
			this.x = v.x; this.y = v.y;
		}

		clone() {
			return new Vector2(this.x, this.y);
		}

		add(v, s = 1.0) {
			this.x += v.x * s;
			this.y += v.y * s;
			return this;
		}

		addVectors(a, b) {
			this.x = a.x + b.x;
			this.y = a.y + b.y;
			return this;
		}

		subtract(v, s = 1.0) {
			this.x -= v.x * s;
			this.y -= v.y * s;
			return this;
		}

		subtractVectors(a, b) {
			this.x = a.x - b.x;
			this.y = a.y - b.y;
			return this;
		}

		length() {
			return Math.sqrt(this.x * this.x + this.y * this.y);
		}

		scale(s) {
			this.x *= s;
			this.y *= s;
		}

		dot(v) {
			return this.x * v.x + this.y * v.y;
		}
		perp() {
			return new Vector2(-this.y, this.x);
		}
		negativ() {
			return new Vector2(-this.x, -this.y);
		}
		normalize() {
			let L = this.length();
			this.x = this.x / L;
			this.y = this.y / L;
		}

		reflect(incidentVector, normalVector) {
			// Нормализация векторов
			incidentVector.normalize();
			normalVector.normalize();

			// Вычисление проекции
			//const projection = normalizedIncidentVector.dot(normalizedNormalVector) * normalizedNormalVector;
			normalVector.scale(incidentVector.dot(normalVector));
			let reflectedVector = normalVector.clone();
			// Вычисление вектора отражения
			reflectedVector.scale(2);
			reflectedVector.subtract(incidentVector, 1);

			return reflectedVector;
		}
	}


	class Ball {
		constructor(radius, mass, pos, vel,friction,wireRadius) {
			this.radius = radius;
			this.mass = mass;
			this.pos = pos.clone();
			this.prevPos = pos.clone();
			this.vel = vel.clone();
			this.sleep = false;
			this.restitution = .95
			this.friction = friction
			this.wireRadius = wireRadius
			
		}
		startStep(dt,gravity){
			this.vel.add(gravity,dt);
			this.prevPos.set(this.pos);
			this.pos.add(this.vel,dt);
		}
		keepOnWire(center){
			let dir = new Vector2();
			dir.subtractVectors(this.pos,center);
			let len = dir.length();
			if(len==0.0){
				return;
			}
			dir.scale(1.0/len);
			let lambda = this.wireRadius - len;
			this.pos.add(dir,lambda);
			return lambda;
		}
		endStep(dt){
			this.vel.subtractVectors(this.pos,this.prevPos);
			this.vel.scale(1.0/dt);
			this.vel.scale(this.friction)
		}
	}

