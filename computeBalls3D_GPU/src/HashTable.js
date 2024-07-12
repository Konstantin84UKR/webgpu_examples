export class HashTable{
	constructor(tablScale,boxWidth){
		
		// this.tablScale = tablScale;
		this.map = new Map();		
		//this.tableColumns = tablScale * simMinWidth;
		this.cells = tablScale * tablScale * tablScale;
		this.pixelOneCells = boxWidth/tablScale;
		// this.cScale = cScale;

	}

	hashCoords(xi, yi, zi) {

		var h = (xi * 92837111) ^ (yi * 689287499) ^ (zi * 283923481);	// fantasy function
		return Math.abs(h) % this.cells; 
	}
	
	hashCoordsNew(xi, yi, zi) {
		var h = 'x'+xi+'y'+yi +'z'+zi;	// fantasy function
		return h; 
	}


	getGrid(cell) {
		let hashCode = this.hashCoords(cell.x, cell.y, cell.z);
		if(this.map.has(hashCode)){
			return this.map.get(hashCode)	
		}else{
			let arr = [];
			this.map.set(hashCode , arr);
			return this.map.get(hashCode)	
		}	
	}

	setGrid(cell, ball) {
		
		let hashCode = this.hashCoords(cell.x, cell.y, cell.z);
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
		
		// let x = Math.max(Math.trunc(((ball.position[0] + 50) / this.pixelOneCells)),0); //Math.trunc()
		// let y = Math.max(Math.trunc(((ball.position[1] + 50) / this.pixelOneCells)),0);
        // let z = Math.max(Math.trunc(((ball.position[2] + 50) / this.pixelOneCells)),0);	

		let x = Math.trunc(((ball.position[0]) / this.pixelOneCells)); //Math.trunc()
		let y = Math.trunc(((ball.position[1]) / this.pixelOneCells));
        let z = Math.trunc(((ball.position[2]) / this.pixelOneCells));	

		return {x,y,z}
	}
	
}
