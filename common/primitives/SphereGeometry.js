import { Geometry } from '../Geometry.js';
export class SphereGeometry extends Geometry {
    constructor(radius = 1, widthSegments = 32, heightSegments = 16, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI) {
        super();
        this.type = 'SphereGeometry';
        this.radius = radius;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
        this.phiStart = phiStart;
        this.phiLength = phiLength;
        this.thetaStart = thetaStart;
        this.thetaLength = thetaLength;

        // Generate vertex positions, texture coordinates, normals, tangents, and vertex indices
        // this.vertices = [];
        // this.uvs = [];
        // this.normals = [];
        // this.tangents = [];
        // this.indices = [];

        const vertexCount = (widthSegments + 1) * (heightSegments + 1);
        const phiEnd = phiStart + phiLength;
        const thetaEnd = thetaStart + thetaLength;

        for (let iy = 0; iy <= heightSegments; iy++) {
            const v = iy / heightSegments;
            const theta = thetaStart + v * thetaLength;

            for (let ix = 0; ix <= widthSegments; ix++) {
                const u = ix / widthSegments;
                const phi = phiStart + u * phiLength;

                // Calculate vertex position
                const x = -radius * Math.cos(phi) * Math.sin(theta);
                const y = radius * Math.cos(theta);
                const z = radius * Math.sin(phi) * Math.sin(theta);

                this.vertices.push(x, y, z);

                // Calculate texture coordinates
                this.uvs.push(u, v); // Invert v-axis to match the typical convention

                // Calculate normal vector
                const normal = [x, y, z];
                this.normals.push(...normal);

                // Calculate tangent vector (same for all vertices)
                let tangent  = [radius * Math.sin(phi), 0, radius * Math.cos(phi)];
                this.tangents.push(...tangent); // Assuming the tangent vector points along the positive X-axis

                if (iy < heightSegments && ix < widthSegments) {
                    const currentIndex = ix + iy * (widthSegments + 1);
                    const nextIndexX = currentIndex + 1;
                    const nextIndexY = currentIndex + widthSegments + 1;
                    const nextIndexXY = nextIndexY + 1;

                    // Generate indices for two triangles of each face
                    // this.indices.push(currentIndex, nextIndexX, nextIndexY);
                    // this.indices.push(nextIndexY, nextIndexX, nextIndexXY);

                    this.indices.push(currentIndex, nextIndexY, nextIndexX);
                    this.indices.push(nextIndexY, nextIndexXY, nextIndexX);
                }
            }
        }
    }
}