
import { Geometry } from '../Geometry.js';
export class RectangleGeometry extends Geometry {
    constructor(width, height, segmentsX, segmentsY) {
        super();
        this.width = width;
        this.height = height;
        this.segmentsX = segmentsX;
        this.segmentsY = segmentsY;

        // Calculate step size for each axis
        const stepX = width / segmentsX;
        const stepY = height / segmentsY;

        // Generate vertex positions, texture coordinates, normals, tangents, and vertex indices
        this.vertices = [];
        this.uvs = [];
        this.normals = [];
        this.tangents = [];
        this.indices = [];

        for (let j = 0; j <= segmentsY; j++) {
            for (let i = 0; i <= segmentsX; i++) {
                // Calculate vertex position
                const x = -width / 2 + i * stepX;
                const y = -height / 2 + j * stepY;
                const z = 0; // Assuming the rectangle lies in the XY plane

                this.vertices.push(x, y, z);

                // Calculate texture coordinates
                const u = i / segmentsX;
                const v = j / segmentsY;

                this.uvs.push(u, 1 - v);

                // Calculate normal vector (same for all vertices)
                this.normals.push(0, 0, 1); // Assuming the normal vector points along the positive Z-axis

                // Calculate tangent vector (same for all vertices)
                this.tangents.push(1, 0, 0); // Assuming the tangent vector points along the positive X-axis

                // Generate vertex indices
                if (i < segmentsX && j < segmentsY) {
                    const currentIndex = i + j * (segmentsX + 1);
                    const nextIndex = currentIndex + segmentsX + 1;

                    // Generate indices for two triangles forming a quad
                    this.indices.push(currentIndex, currentIndex + 1, nextIndex);
                    this.indices.push(currentIndex + 1, nextIndex + 1, nextIndex);

                    // this.indices.push(currentIndex, nextIndex, currentIndex + 1);
                    // this.indices.push(currentIndex + 1, nextIndex, nextIndex + 1);
                }
            }
        }
    }
}