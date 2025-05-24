
import { Geometry } from '../Geometry.js';
export class BoxGeometry extends Geometry{
    constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
        super();
        this.type = 'BoxGeometry';
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
        this.buildPlane(1, 0, 0, this.depth, this.height, this.depthSegments, this.heightSegments, this.width, 1, false);
        // nx
        this.buildPlane(-1, 0, 0, this.depth, this.height, this.depthSegments, this.heightSegments, this.width, -1, true);
        // py
        this.buildPlane(0, 1, 0, this.width, this.depth, this.widthSegments, this.depthSegments, this.height, -1, true);
        // ny
        this.buildPlane(0, -1, 0, this.width, this.depth, this.widthSegments, this.depthSegments, this.height, 1, false);
        // pz
        this.buildPlane(0, 0, 1, this.width, this.height, this.widthSegments, this.heightSegments, this.depth, 1, true);
        // nz
        this.buildPlane(0, 0, -1, this.width, this.height, this.widthSegments, this.heightSegments, this.depth, -1,false);     
       
    }


    buildPlane(nx, ny, nz, width, height, segmentsX, segmentsY, depth, positive, ccw){

        const verticesLength = this.vertices.length/3;
        const positiveDepth = positive < 0 ? false : true;
  

        for (let j = 0; j <= segmentsY; j++) {
            for (let i = 0; i <= segmentsX; i++) {
               
                const stepX = width / segmentsX;
                const stepY = height / segmentsY;

                // Calculate vertex position
                const x = -width / 2 + i * stepX;
                const y = -height / 2 + j * stepY;
                const z = 0; // Assuming the rectangle lies in the XY plane

                // Calculate texture coordinates
                const u = i / segmentsX;
                const v = j / segmentsY;

                //+-X;
                if ((nx == 1 && ny == 0 && nz == 0) || (nx == -1 && ny == 0 && nz == 0)) {
                    this.vertices.push(z + depth * positive * 0.5, y, x); 
                   
                    this.normals.push(1 * positive, 0, 0); // Assuming the normal vector points along the positive Z-axis 0, 0, 1
                    this.tangents.push(0, 0, -1 * positive); // Assuming the tangent vector points along the positive X-axis 1, 0, 0
                    
                    if (ccw) {
                        this.uvs.push(u, 1 -v);
                    } else {
                        this.uvs.push(1 - u, 1 - v);
                    }
                } 
                //+-Y;
                else if ((nx == 0 && ny == 1 && nz == 0) || (nx == 0 && ny == -1 && nz == 0)) {
                    this.vertices.push(x, z + depth * positive * 0.5, y); 
                   
                    this.normals.push(0, 1 * positive, 0); // Assuming the normal vector points along the positive Z-axis 0, 0, 1
                    this.tangents.push(-1 * positive, 0, 0); // Assuming the tangent vector points along the positive X-axis 1, 0, 0
                    
                    if (ccw) {
                        this.uvs.push(u, 1 - v);
                    } else {
                        this.uvs.push(1 - u,1 - v);
                    }
                } 
                //+-Z;
                else if ((nx == 0 && ny == 0 && nz == 1) || (nx == 0 && ny == 0 && nz == -1)) {
                    this.vertices.push(x, y, z + depth * positive * 0.5);
               
                    this.normals.push(0, 0, 1 * positive); // Assuming the normal vector points along the positive Z-axis 0, 0, 1
                    this.tangents.push(1 * positive, 0, 0); // Assuming the tangent vector points along the positive X-axis 1, 0, 0
                    
                    if (ccw) {
                        this.uvs.push(u, 1 - v);
                    } else {
                        this.uvs.push(1 - u, 1 - v);
                    }
                    
                }
                          

              
                          

                // Generate vertex indices
                if (i < segmentsX && j < segmentsY) {
                    const currentIndex = i + j * (segmentsX + 1) + verticesLength;
                    const nextIndex = currentIndex + segmentsX + 1;

                    // Generate indices for two triangles forming a quad
                    if (ccw){
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