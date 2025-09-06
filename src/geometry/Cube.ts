import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
    buffer: ArrayBuffer;
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    center: vec4;

    constructor(center: vec3, public sideLength: number){
        super();
        this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    }

    create(){

    }

    getFaceNormals() : Float32Array {
        let faceNormals: Float32Array = new Float32Array(6 * 4);
        let sign: number = 1;
        for (let i: number = 0; i < 6; i++) {
            faceNormals[i * 4 + Math.floor(i / 2)] = sign;
            sign *= -1;
        }
        return faceNormals;
    }

    faceIndexToNormal(faceIndex: number) : Float32Array {
        let faceNormal: Float32Array = new Float32Array(4);
        // This makes the order +X, -X, +Y, -Y, +Z, -Z
        faceNormal[Math.floor(faceIndex / 2)] = 1 - (faceIndex & 1) * 2;
        return faceNormal;
    }

    vertexIndexToPosition(vertexIndex: number): Float32Array {
        let vertexPosition: Float32Array = new Float32Array(4);
        /*
        This will follow:
        (1, 1, 1)
        (-1, 1, 1)
        (1, -1, 1),
        (-1, -1, 1),
        (1, 1, -1)
        (-1, 1, -1)
        (1, -1, -1),
        (-1, -1, -1)
         */
        vertexPosition[0] = (vertexIndex & 1) == 0 ? 1 : -1;
        vertexPosition[1] = (vertexIndex & 2) == 0 ? 1 : -1;
        vertexPosition[2] = (vertexIndex & 4) == 0 ? 1 : -1;
        vertexPosition[3] = 1;
        return vertexPosition;
    }

    getVertexPositions(): Float32Array {
        let vertexPositions: Float32Array = new Float32Array(8 * 4);
        for(let i: number = 0; i < 8; i++) {
            let vertexPosition: Float32Array = this.vertexIndexToPosition(i);
            vertexPositions[i * 4] = vertexPosition[0];
            vertexPositions[i * 4 + 1] = vertexPosition[1];
            vertexPositions[i * 4 + 2] = vertexPosition[2];
            vertexPositions[i * 4 + 3] = vertexPosition[3];
        }
        return vertexPositions;
    }
}

export default Cube;