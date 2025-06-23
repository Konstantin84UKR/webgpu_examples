import { Geometry } from '../Geometry.js';
export class TorusGeometry extends Geometry {
    constructor(radius, tubeRadius,	radialSegments, tubularSegments, scaleUV = 1,scaleTubeUV = 1) {
        if (radius <= 0 || tubeRadius <= 0) {
            throw new Error('Radius and tube radius must be greater than zero.');
        }
        super();

        this.radius = radius;
        this.tubeRadius = tubeRadius;
        this.radialSegments = radialSegments;
        this.tubularSegments = tubularSegments;
    
    
        this.vertices = [];
        this.uvs = [];
        this.normals = [];
        this.tangents = [];
        this.indices = [];


         for (let j = 0; j <= radialSegments; j++) {
            for (let i = 0; i <= tubularSegments; i++) {

                // Calculate angle for the current segment
                const u = i / tubularSegments * Math.PI * 2; // Angle around the tube
                const v = j / radialSegments * Math.PI * 2; // Angle along the tube

                // Calculate vertex position
                const x = (this.radius + this.tubeRadius * Math.cos(v)) * Math.cos(u);
                const y = (this.radius + this.tubeRadius * Math.cos(v)) * Math.sin(u);
                const z = this.tubeRadius * Math.sin(v);

                this.vertices.push(x, y, z);

                // Calculate texture coordinates
                this.uvs.push(i / tubularSegments * scaleUV, j / radialSegments * scaleTubeUV );

                // Calculate normal vector
                this.normals.push(Math.cos(v) * Math.cos(u), Math.cos(v) * Math.sin(u), Math.sin(v));

                // Calculate tangent vector
                this.tangents.push(-Math.sin(u), Math.cos(u), 0);

                // Generate vertex indices
                if (i < tubularSegments && j < radialSegments) {
                    const currentIndex = i + j * (tubularSegments + 1);
                    const nextIndex = currentIndex + tubularSegments + 1;

                    // Generate indices for two triangles forming a quad
                    this.indices.push(currentIndex, currentIndex + 1, nextIndex);
                    this.indices.push(currentIndex + 1, nextIndex + 1, nextIndex);
                }

            }
         }
     }
}