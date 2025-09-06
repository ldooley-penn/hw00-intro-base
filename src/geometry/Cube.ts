import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    center: vec4;

    constructor(center: vec3){
        super();
        this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    }

    create(){
        this.positions = new Float32Array(4 * 6 * 4); // 4 vertices/side * 6 sides * 4 floats/vertex
        this.normals = new Float32Array(this.positions.length); // One normal per-position
        this.indices = new Uint32Array(2 * 3 * 6); // 2 triangles/side * 3 vertices/triangle * 6 sides
        // Iterate over each face
        for(let faceIndex: number = 0; faceIndex < 6; faceIndex++) {
            let [facePositions, faceNormals, faceIndices] = this.getFaceData(faceIndex, faceIndex * 4);

            this.positions.set(facePositions, faceIndex * 4 * 4);
            this.normals.set(faceNormals, faceIndex * 4 * 4);
            this.indices.set(faceIndices, faceIndex * 2 * 3);
        }

        this.generateIdx();
        this.generatePos();
        this.generateNor();

        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

        console.log(`Created cube`);
    }

    isFacePositive(faceIndex: number) : boolean {
        return (faceIndex & 1) == 0;
    }

    faceIndexToAxis(faceIndex: number) : number {
        return Math.floor(faceIndex / 2);
    }

    // Returns positions, normals, and indices from a face index
    getFaceData(faceIndex: number, startingIndex: number): [Float32Array, Float32Array, Uint32Array] {
        let facePositions: Float32Array = new Float32Array(4 * 4);
        let faceNormals: Float32Array = new Float32Array(4 * 4);

        let faceAxisIndex = this.faceIndexToAxis(faceIndex);
        let perpAxisIndex1 = (faceAxisIndex + 1) % 3;
        let perpAxisIndex2 = (faceAxisIndex + 2) % 3;
        if(!this.isFacePositive(faceIndex)){
            [perpAxisIndex1, perpAxisIndex2] = [perpAxisIndex2, perpAxisIndex1];
        }
        /* In terms of perp axis 1 and 2, the order of vertices should be:
            ++
            -+,
            --,
            +-
        */
        let vertexPositions2D: number[] = [
            1, 1,
            -1, 1,
            -1, -1,
            1, -1];

        let faceAxisValue = this.isFacePositive(faceIndex) ? 1 : -1;

        for(let vertexIndex = 0; vertexIndex < 4; vertexIndex++){
            facePositions[vertexIndex * 4 + faceAxisIndex] = faceAxisValue + this.center[faceAxisIndex];
            facePositions[vertexIndex * 4 + perpAxisIndex1] = vertexPositions2D[vertexIndex * 2] + this.center[perpAxisIndex1];
            facePositions[vertexIndex * 4 + perpAxisIndex2] = vertexPositions2D[vertexIndex * 2 + 1] + this.center[perpAxisIndex2];
            facePositions[vertexIndex * 4 + 3] = 1;

            console.log(facePositions[vertexIndex * 4]);
            console.log(facePositions[vertexIndex * 4 + 1]);
            console.log(facePositions[vertexIndex * 4 + 2]);
            console.log();

            faceNormals[vertexIndex * 4 + faceAxisIndex] = faceAxisValue;
        }

        let faceIndicesSource: number[] = [
            0, 1, 2,
            2, 3, 0
        ];

        let faceIndices: Uint32Array = Uint32Array.from(faceIndicesSource, (index) => index + startingIndex);

        return [facePositions, faceNormals, faceIndices];
    }
}

export default Cube;