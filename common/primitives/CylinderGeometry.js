import { Geometry } from '../Geometry.js';

export class CylinderGeometry extends Geometry {
    constructor(radiusTop = 1, radiusBottom = 1, height = 1, radialSegments = 32, heightSegments = 1, openEnded = false, thetaStart = 0, thetaLength = Math.PI * 2) {
        super();
        this.type = 'CylinderGeometry';
        this.radiusTop = radiusTop;
        this.radiusBottom = radiusBottom;
        this.height = height;
        this.radialSegments = radialSegments;
        this.heightSegments = heightSegments;
        this.openEnded = openEnded;
        this.thetaStart = thetaStart;
        this.thetaLength = thetaLength;

        // Generate vertex positions, texture coordinates, normals, tangents, and vertex indices
        // this.vertices = [];
        // this.uvs = [];
        // this.normals = [];
        // this.tangents = [];
        // this.indices = [];

        const heightHalf = height / 2;
        const radialStep = thetaLength / radialSegments;
        const heightStep = height / heightSegments;

        let vertexIndex = 0;

        // // Generate top and bottom vertices
        // for (let y = 0; y <= heightSegments; y++) {
        //     const yPos = y * heightStep - heightHalf;

        //     for (let i = 0; i <= radialSegments; i++) {
        //         const theta = thetaStart + i * radialStep;
        //         const cosTheta = Math.cos(theta);
        //         const sinTheta = Math.sin(theta);

        //         // Calculate vertex position
        //         const x = cosTheta * (radiusTop - radiusBottom) / 2;
        //         const z = sinTheta * (radiusTop - radiusBottom) / 2;

        //         this.vertices.push(x, yPos, z);

        //         // Calculate texture coordinates
        //         const u = i / radialSegments;
        //         const v = 1 - y / heightSegments;

        //         this.uvs.push(u, v);

        //         // Calculate normal vector
        //         const normal = [cosTheta, 0, sinTheta];
        //         this.normals.push(...normal);

        //         // Calculate tangent vector
        //         const tangent = [-sinTheta, 0, cosTheta];
        //         this.tangents.push(...tangent);

        //         // Generate vertex indices
        //         if (y < heightSegments && i < radialSegments) {
        //             const currentIndex = vertexIndex;
        //             const nextIndex = currentIndex + radialSegments + 1;

        //             // Generate indices for triangles
        //             this.indices.push(currentIndex, currentIndex + 1, nextIndex);
        //             this.indices.push(currentIndex + 1, nextIndex + 1, nextIndex);
        //         }

        //         vertexIndex++;
        //     }
        // }

        // Generate side vertices
        for (let y = 0; y <= heightSegments; y++) {
            const yPos = y * heightStep - heightHalf;
          
            // radiusBottom vs radiusTop
            const mixVal = y / heightSegments;     
            const yScale = 1 * (1 - mixVal) + (radiusTop / radiusBottom) * mixVal; // // x * (1−a) + y*a  // mix

            for (let i = 0; i <= radialSegments; i++) {
                const theta = thetaStart + i * radialStep;
                const cosTheta = Math.cos(theta);
                const sinTheta = Math.sin(theta);

                // Calculate vertex position
                const x = cosTheta * radiusBottom * yScale;
                const z = sinTheta * radiusBottom * yScale;

                this.vertices.push(x, yPos, z);

                // Calculate texture coordinates
                const u = i / radialSegments * radiusTop *2;
                const v = 1 - y / heightSegments * heightHalf ;

                this.uvs.push(u, v);

                // Calculate normal vector
                const normal = [cosTheta, 0, sinTheta];
                this.normals.push(...normal);

                // Calculate tangent vector  //TODO
                const tangent = [-sinTheta, 0, cosTheta];
                this.tangents.push(...tangent);

                // Generate vertex indices
                if (y < heightSegments && i < radialSegments) {
                    const currentIndex = vertexIndex;
                    const nextIndex = currentIndex + radialSegments + 1;

                    // Generate indices for triangles
                    this.indices.push(currentIndex + 1, currentIndex, nextIndex);
                    this.indices.push(currentIndex + 1, nextIndex, nextIndex + 1);
                }

                vertexIndex++;
            }
        }

        // Cap the cylinder ends if openEnded is false
        if (!openEnded) {
           
            // // Generate top cap
            const topCenterIndex = vertexIndex + 1;
            
            this.vertices.push(0, heightHalf, 0);
            this.uvs.push(0.5, 0.5);
            this.normals.push(0, 1, 0);
            this.tangents.push(1, 0, 0);
            
            for (let i = 0; i <= radialSegments; i++) {
                
                const theta = thetaStart + i * radialStep;
                const cosTheta = Math.cos(theta);
                const sinTheta = Math.sin(theta);

                // Calculate vertex position
                const x = cosTheta * radiusTop;
                const z = sinTheta * radiusTop;

                this.vertices.push(x, heightHalf, z);

                // Calculate texture coordinates
                const u = (cosTheta * 0.5) + 0.5;
                const v = (sinTheta * 0.5) + 0.5;
                this.uvs.push(u, v);
                this.normals.push(0, 1, 0);
                this.tangents.push(1, 0, 0);

                vertexIndex++;
            }  

            for (let i = 1; i <= radialSegments; i++) {
                const currentIndex = topCenterIndex + i ;
                const nextIndex = topCenterIndex + i + 1;

                this.indices.push(topCenterIndex, nextIndex, currentIndex);
            }

            // Generate top cap
            const bottomCenterIndex = vertexIndex+1;

            this.vertices.push(0, -heightHalf, 0);
            this.uvs.push(0.5, 0.5);
            this.normals.push(0, -1, 0);
            this.tangents.push(-1, 0, 0);

            for (let i = 0; i <= radialSegments; i++) {

                const theta = thetaStart + i * radialStep;
                const cosTheta = Math.cos(theta);
                const sinTheta = Math.sin(theta);

                // Calculate vertex position
                const x = cosTheta * radiusBottom;
                const z = sinTheta * radiusBottom;

                this.vertices.push(x, -heightHalf, z);

                // Calculate texture coordinates
                const u = (cosTheta * 0.5) + 0.5;
                const v = (sinTheta * 0.5) + 0.5;
                this.uvs.push(u, v);
                this.normals.push(0, -1, 0);
                this.tangents.push(-1, 0, 0);

                vertexIndex++;
            }

            for (let i = 1; i <= radialSegments; i++) {
                const currentIndex = bottomCenterIndex + i;
                const nextIndex = bottomCenterIndex + i + 1;

                this.indices.push(bottomCenterIndex, currentIndex, nextIndex);
            }
        }
    }
}