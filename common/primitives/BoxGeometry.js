

export class BoxGeometry {
    constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.widthSegments = Math.floor(widthSegments);
        this.heightSegments = Math.floor(heightSegments);
        this.depthSegments = Math.floor(depthSegments);
      

        // Calculate step size for each axis
        const stepX = this.width / this.widthSegments;
        const stepY = this.height / this.heightSegments;
        const stepZ = this.depth / this.depthSegments;

        // Generate vertex positions, texture coordinates, normals, tangents, and vertex indices
        this.vertices = [];
        this.uvs = [];
        this.normals = [];
        this.tangents = [];
        this.indices = [];

        // build each side of the box geometry  //Генерируем каждую грань куба отдельно

        // px
        this.buildPlane(1, 0, 0, this.depth, this.height, this.depthSegments, this.heightSegments, this.width * 0.5);
        // // nx
        this.buildPlane(-1, 0, 0, this.depth, this.height, this.depthSegments, this.heightSegments, this.width * -0.5);
        // // py
        this.buildPlane(0, 1, 0, this.width, this.depth, this.widthSegments, this.depthSegments, this.height * 0.5);
        // // ny
        this.buildPlane(0, -1, 0, this.width, this.depth, this.widthSegments, this.depthSegments, this.height * -0.5);
        // nz
        this.buildPlane(0, 0, -1, this.width, this.height, this.widthSegments, this.heightSegments, this.depth * 0.5);
        // pz
        this.buildPlane(0, 0, 1, this.width, this.height, this.widthSegments, this.heightSegments, this.depth * -0.5);     
       
    }


    buildPlane(nx, ny, nz, width, height, segmentsX, segmentsY, depth){

        const verticesLength = this.vertices.length/3;
        const positiveDepth = depth < 0 ? true : false;

        for (let j = 0; j <= segmentsY; j++) {
            for (let i = 0; i <= segmentsX; i++) {
               
                const stepX = width / segmentsX;
                const stepY = height / segmentsY;

                // Calculate vertex position
                const x = -width / 2 + i * stepX;
                const y = -height / 2 + j * stepY;
                const z = 0; // Assuming the rectangle lies in the XY plane

                //+-X;
                if ((nx == 1 && ny == 0 && nz == 0) || (nx == -1 && ny == 0 && nz == 0)) {
                    this.vertices.push(z + depth, y, x); 
                } 
                //+-Y;
                else if ((nx == 0 && ny == 1 && nz == 0) || (nx == 0 && ny == -1 && nz == 0)) {
                    this.vertices.push(x, z + depth, y); 
                } 
                //+-Z;
                else if ((nx == 0 && ny == 0 && nz == 1) || (nx == 0 && ny == 0 && nz == -1)) {
                    this.vertices.push(x, y, z - depth);
                }
               
                // Calculate texture coordinates
                const u = i / segmentsX;
                const v = j / segmentsY;

                this.uvs.push(u, v);

                // Calculate normal vector (same for all vertices)
                this.normals.push(nx, ny, nz); // Assuming the normal vector points along the positive Z-axis 0, 0, 1

                // Calculate tangent vector (same for all vertices)
                this.tangents.push(nz, ny, nx); // Assuming the tangent vector points along the positive X-axis 1, 0, 0


                // Generate vertex indices
                if (i < segmentsX && j < segmentsY) {
                    const currentIndex = i + j * (segmentsX + 1) + verticesLength;
                    const nextIndex = currentIndex + segmentsX + 1;

                    // Generate indices for two triangles forming a quad
                    if (positiveDepth){
                       this.indices.push(currentIndex, currentIndex + 1, nextIndex);
                        this.indices.push(currentIndex + 1, nextIndex + 1, nextIndex); 
                    }else{
                       this.indices.push(currentIndex, nextIndex, currentIndex + 1);
                       this.indices.push(currentIndex + 1, nextIndex, nextIndex + 1); }
                    }
            }
        }
    }
}