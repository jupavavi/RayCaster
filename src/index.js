import "./styles.css";
import {
    createCellGetter,
    TO_RAD,
    clamp,
} from "./utils";
import map from "./map1.js";
import createRenderer from "./renderer";

const MOUSE_HORZ_SENSITIVITY = 0.5;
const MOUSE_VERT_SENSITIVITY = 0.15;
const CAMERA_RADIUS = 0.25;
const TURN_INC = 180;
const PITCH_INC = 10;
const PITCH_LIMIT = 10;
const MOVE_INC = 4;
const HORIZONTAL_RESOLUTION = 320;

let time = performance.now();
let frameCount = 0;
let fpsAccum = -1;

const camera = {
    x: 3.5,
    y: 3.5,
    z: 0,
    viewX: 1,
    viewY: 0,
    angle: 0,
    pitchY: 0,
    fov: 120, // Field ov view in degrees
};

const getMapCell = createCellGetter(map.walls, map.width);

const keyMap = { };

const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
canvas.focus();
canvas.id = 'canvas';

const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

const updatePosition = ({ movementX, movementY }) => {
    rotateCamera(camera, TURN_INC * MOUSE_HORZ_SENSITIVITY * (movementX / canvas.width));
    camera.pitchY = clamp(camera.pitchY - MOUSE_VERT_SENSITIVITY * PITCH_INC * (movementY / canvas.height), -PITCH_LIMIT, PITCH_LIMIT);
};

const lockChangeAlert = () => {
    if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
        document.addEventListener("mousemove", updatePosition, false);
    } else {
        document.removeEventListener("mousemove", updatePosition, false);
    }
}

document.getElementById('app').appendChild(canvas);
document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

canvas.addEventListener('keydown', (event) => keyMap[event.key.toLowerCase()] = true);
canvas.addEventListener('keyup', (event) => keyMap[event.key.toLowerCase()] = false);
canvas.onclick = function() {
    canvas.requestPointerLock();
}

let imgData = ctx.createImageData(canvas.width, canvas.height);
let renderer = createRenderer(map, imgData);

const resize = () => {
    const pixelWidth = canvas.clientWidth;
    const pixelHeight = canvas.clientHeight;
    const ratio = pixelWidth / pixelHeight;
    const newHeight = (HORIZONTAL_RESOLUTION / ratio) | 0;
    if (canvas.height !== newHeight) {
        canvas.width = HORIZONTAL_RESOLUTION;
        canvas.height = newHeight;
        if (canvas.width > 0 && canvas.height > 0) {
            imgData = ctx.createImageData(canvas.width, canvas.height);
            renderer = createRenderer(map, imgData);
        }
    }
};

const moveCamera = (camera, frontDelta, strafeDelta = 0) => {
    const { x, y, viewX, viewY } = camera;
    const dx = viewX * frontDelta - viewY * strafeDelta;
    const dy = viewY * frontDelta + viewX * strafeDelta;
    const newX = x + dx;
    const newY = y + dy;
    let col = x | 0;
    let row = y | 0;
    let newCol = (newX + CAMERA_RADIUS * Math.sign(dx)) | 0;
    let newRow = (newY + CAMERA_RADIUS * Math.sign(dy)) | 0;
    // TODO: fix bug with the corners
    if (!getMapCell(newCol, row)) camera.x = newX;
    if (!getMapCell(col, newRow)) camera.y = newY;
};

const rotateCamera = (camera, angleOffset) => {
    camera.angle += angleOffset;
    const rad = camera.angle * TO_RAD;
    camera.viewX = Math.cos(rad);
    camera.viewY = Math.sin(rad);
};

const cameraCommands = {
    w: (deltaTime) => moveCamera(camera, MOVE_INC * deltaTime, 0),
    arrowup: (deltaTime) => moveCamera(camera, MOVE_INC * deltaTime, 0),
    up: (deltaTime) => moveCamera(camera, MOVE_INC * deltaTime, 0),
    s: (deltaTime) => moveCamera(camera, -MOVE_INC * deltaTime, 0),
    arrowdown: (deltaTime) => moveCamera(camera, -MOVE_INC * deltaTime, 0),
    down: (deltaTime) => moveCamera(camera, -MOVE_INC * deltaTime, 0),
    arrowleft: (deltaTime) => rotateCamera(camera, -TURN_INC * deltaTime),
    left: (deltaTime) => rotateCamera(camera, -TURN_INC * deltaTime),
    arrowright: (deltaTime) => rotateCamera(camera, TURN_INC * deltaTime),
    right: (deltaTime) => rotateCamera(camera, TURN_INC * deltaTime),
    a: (deltaTime) => moveCamera(camera, 0, -MOVE_INC * deltaTime),
    d: (deltaTime) => moveCamera(camera, 0, MOVE_INC * deltaTime),
    q: (deltaTime) => camera.pitchY = clamp(camera.pitchY + PITCH_INC * deltaTime, -PITCH_LIMIT, PITCH_LIMIT),
    e: (deltaTime) => camera.pitchY = clamp(camera.pitchY - PITCH_INC * deltaTime, -PITCH_LIMIT, PITCH_LIMIT),
    z: (deltaTime) => camera.z = clamp(camera.z - MOVE_INC * deltaTime, -10, 10),
    x: (deltaTime) => camera.z = clamp(camera.z + MOVE_INC * deltaTime, -10, 10),
};

const animationLoop = (timeStep = 0) => {
    resize();
    const now = timeStep * 0.001; // to senconds
    const deltaTime = now - time;
    const fps = 1 / deltaTime;
    frameCount++;
    fpsAccum = fpsAccum < 0 ? fps : fpsAccum + fps;
    time = now;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    renderer(camera);
    ctx.putImageData(imgData, 0, 0);

    Object.keys(keyMap)
        .filter(key => keyMap[key] && cameraCommands[key])
        .forEach(key => cameraCommands[key](deltaTime));

    ctx.font = '10px Monaco';
    ctx.fillStyle = '#000000';
    ctx.fillText(`${(fps).toFixed(0)} FPS`, 8, 11);
    ctx.fillText(`${(fpsAccum / frameCount).toFixed(0)} AFPS`, 8, 21);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${(fps).toFixed(0)} FPS`, 8, 10);
    ctx.fillText(`${(fpsAccum / frameCount).toFixed(0)} AFPS`, 8, 20);
    requestAnimationFrame(animationLoop);
};

animationLoop();
