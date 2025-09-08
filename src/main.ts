import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube'
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import {GUIController} from "dat.gui";

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
    'Color': '#ff0000',
    'Render Clouds': false,
    'Step Size': 0.05,
    'Initial Noise Scale': 0.25,
    'Noise Persistence': 0.5,
    'Noise Lacunarity': 0.5,
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;
let prevColor = '#ffff00';
let prevStepSize = 0.05;
let prevInitialNoiseScale = 0.25;
let prevNoisePersistence = 0.5;
let prevNoiseLacunarity = 0.5;

let startTime: number = 0;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
}

function parseHexadecimalColor(color: string) : vec4 {
    let outColor : vec4 = [0, 0, 0, 1];
    outColor[0] = parseInt(color.slice(1, 3), 16) / 255;
    outColor[1] = parseInt(color.slice(3, 5), 16) / 255;
    outColor[2] = parseInt(color.slice(5, 7), 16) / 255;

    return outColor;
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
    gui.add(controls, 'Render Clouds').onChange((value: boolean) => {
        if(value){
            gui.remove(tesselationControl);
            gui.remove(loadSceneControl);
            gui.remove(colorControl);
            stepSizeControl = gui.add(controls, 'Step Size', 0.01, 0.1).step(0.01);
            initialNoiseScaleControl = gui.add(controls, 'Initial Noise Scale', 0.01, 0.5).step(0.01);
            noisePersistenceControl = gui.add(controls, 'Noise Persistence', 0, 1).step(0.125);
            noiseLacunarityControl = gui.add(controls, 'Noise Lacunarity', 0.125, 1).step(0.125);
        }
        else{
            tesselationControl = gui.add(controls, 'tesselations', 0, 8).step(1);
            loadSceneControl = gui.add(controls, 'Load Scene');
            colorControl = gui.addColor(controls, 'Color');
            gui.remove(stepSizeControl);
            gui.remove(initialNoiseScaleControl);
            gui.remove(noisePersistenceControl);
            gui.remove(noiseLacunarityControl);
        }
    });
  let tesselationControl = gui.add(controls, 'tesselations', 0, 8).step(1);
  let loadSceneControl = gui.add(controls, 'Load Scene');
  let colorControl = gui.addColor(controls, 'Color');
  let stepSizeControl : GUIController;
  let initialNoiseScaleControl : GUIController;
  let noisePersistenceControl : GUIController;
  let noiseLacunarityControl : GUIController;

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const clouds = new ShaderProgram([
      new Shader(gl.VERTEX_SHADER, require('./shaders/noise-vert.glsl')),
      new Shader(gl.FRAGMENT_SHADER, require('./shaders/noise-frag.glsl')),
  ]);

  lambert.setGeometryColor(parseHexadecimalColor(controls.Color));
  clouds.setStepSize(controls['Step Size']);
  clouds.setInitialNoiseScale(controls['Initial Noise Scale']);
  clouds.setNoisePersistence(controls['Noise Persistence']);
  clouds.setNoiseLacunarity(controls['Noise Lacunarity']);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }
    if(controls.Color != prevColor){
        prevColor = controls.Color;
        lambert.setGeometryColor(parseHexadecimalColor(controls.Color));
    }
    if(controls['Step Size'] != prevStepSize){
        prevStepSize = controls['Step Size'];
        clouds.setStepSize(controls['Step Size']);
    }
    if(controls['Initial Noise Scale'] != prevInitialNoiseScale){
        prevInitialNoiseScale = controls['Initial Noise Scale'];
        clouds.setInitialNoiseScale(prevInitialNoiseScale);
    }
    if(controls['Noise Persistence'] != prevNoisePersistence){
        prevNoisePersistence = controls['Noise Persistence'];
        clouds.setNoisePersistence(prevNoisePersistence);
    }
    if(controls['Noise Lacunarity'] != prevNoiseLacunarity){
        prevNoiseLacunarity = controls['Noise Lacunarity'];
        clouds.setNoiseLacunarity(prevNoiseLacunarity);
    }

    if(controls["Render Clouds"]){
        clouds.setTime((Date.now() - startTime) / 1000);
        clouds.setResolution(window.innerWidth, window.innerHeight);
        renderer.render(camera, clouds, [
            square
        ]);
    }
    else{
        lambert.setTime((Date.now() - startTime) / 1000);
        renderer.render(camera, lambert, [
            //icosphere,
            cube,
            // square,
        ]);
    }
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  startTime = Date.now();

  // Start the render loop
  tick();
}

main();
