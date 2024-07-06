export class HashTable{
	constructor(tablScale,simMinWidth,cScale){
		
		this.tablScale = tablScale;
		this.map = new Map();		
		this.tableColumns = tablScale * simMinWidth;
		this.cells = tablScale * tablScale;
		this.pixelOneCells = cScale / tablScale;
		this.cScale = cScale;

	}

	hashCoords(xi, yi, zi) {

		xi = Math.trunc(xi);
		yi = Math.trunc(yi);
		zi = Math.trunc(zi);

		var h = (xi * 92837111) ^ (yi * 689287499) ^ (zi * 283923481);	// fantasy function
		return Math.abs(h) % this.cells; 
	}
	
	hashCoordsNew(xi, yi, zi) {


		if(xi == undefined){
			zi= 1;
		}

		if(yi == undefined){
			zi= 1;
		}
		//  xi = Math.max(xi,0);
		//  yi = Math.max(yi,0);
		// zi = Math.trunc(zi);

		var h = 'x'+xi+'y'+yi;	// fantasy function
		return h; 
	}


	getGrid(cell) {
		let hashCode = this.hashCoordsNew(cell.x, cell.y, cell.z);
		if(this.map.has(hashCode)){
			return this.map.get(hashCode)	
		}else{
			let arr = [];
			this.map.set(hashCode , arr);
			return this.map.get(hashCode)	
		}	
	}

	setGrid(cell, ball) {
		
		let hashCode = this.hashCoordsNew(cell.x, cell.y, cell.z);
		let arr = [];
		if(this.map.has(hashCode)){
			arr = this.getGrid(cell);
			arr.push(ball);	
		}else{
			arr.push(ball);	
			this.map.set(hashCode , arr);
		}		
	}

	clearHashSet(){
		this.map.clear();
	}

	cellCoords(ball){
		
		let x = Math.max(Math.trunc((ball.position[0] / this.pixelOneCells)),0); //Math.trunc()
		let y = Math.max(Math.trunc((ball.position[1] / this.pixelOneCells)),0);
        let z = Math.max(Math.trunc((ball.position[2] / this.pixelOneCells)),0);	

		return {x,y,z}
	}
	
}
