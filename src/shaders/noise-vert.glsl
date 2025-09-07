#version 300 es

precision highp float;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

void main() {
   gl_Position = vs_Pos;
}
