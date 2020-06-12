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
const TURN_INC = 180;
const PITCH_INC = 10;
const PITCH_LIMIT = 10;
const MOVE_INC = 4;
const HORIZONTAL_RESOLUTION = 320;

let time = 0;
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
    radius: 0.25,
    speedZ: 0,
    fov: 120, // Field ov view in degrees
};

const getMapCell = createCellGetter(map.walls, map.width);

const keyMap = { };

const canvas = document.createElement('canvas');
document.getElementById('app').appendChild(canvas);
canvas.tabIndex = 0;
canvas.focus();
canvas.id = 'canvas';

const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;

const updateCamere = ({ movementX, movementY }) => {
    rotateCamera(camera, TURN_INC * MOUSE_HORZ_SENSITIVITY * (movementX / canvas.width));
    camera.pitchY = clamp(camera.pitchY - MOUSE_VERT_SENSITIVITY * PITCH_INC * (movementY / canvas.height), -PITCH_LIMIT, PITCH_LIMIT);
};

const lockChangeAlert = () => {
    if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
        document.addEventListener("mousemove", updateCamere, false);
    } else {
        document.removeEventListener("mousemove", updateCamere, false);
    }
}

document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

canvas.addEventListener('keydown', (event) => keyMap[event.key.toLowerCase()] = true);
canvas.addEventListener('keyup', (event) => keyMap[event.key.toLowerCase()] = false);
canvas.onclick = function() {
    if (canvas.requestPointerLock) {
        canvas.requestPointerLock();
    }
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

const isWall = (map, x, y) => !!getMapCell((x | 0), (y | 0));

const moveCamera = (camera, delta) => {
    const { x = 0, y = 0, z = 0, radius } = camera;
    const { x: dx = 0, y: dy = 0, dz = 0 } = delta;

    let signX = Math.sign(dx);
    let signY = Math.sign(dy);

    signX = signX ? signX : -signY;
    signY = signY ? signY : signX;
    const x1 = (x + radius * signX);
    const y1 = (y - radius * signY);
    const x2 = (x - radius * signX);
    const y2 = (y + radius * signY);

    if (!isWall(map, x1 + dx, y1) && !isWall(map, x1 + dx, y2)) camera.x = x + dx;
    if (!isWall(map, x2, y2 + dy) && !isWall(map, x1, y2 + dy)) camera.y = y + dy;

    if (z + dz < -0.5 + radius) camera.z = -0.5 + radius; // floor
    else if (z + dz > 0.5 - radius) camera.z = 0.5 - radius; // ceiling
    else camera.z = z + dz;
};

const moveCameraFPS = (camera, frontDelta, strafeDelta = 0) => {
    const { viewX, viewY } = camera;
    moveCamera(camera, {
        x: viewX * frontDelta - viewY * strafeDelta,
        y: viewY * frontDelta + viewX * strafeDelta,
        z: 0,
     });
};

const rotateCamera = (camera, angleOffset) => {
    camera.angle += angleOffset;
    const rad = camera.angle * TO_RAD;
    camera.viewX = Math.cos(rad);
    camera.viewY = Math.sin(rad);
};

const cameraCommands = {
    w: (deltaTime) => moveCameraFPS(camera, MOVE_INC * deltaTime, 0),
    arrowup: (deltaTime) => moveCameraFPS(camera, MOVE_INC * deltaTime, 0),
    up: (deltaTime) => moveCameraFPS(camera, MOVE_INC * deltaTime, 0),
    s: (deltaTime) => moveCameraFPS(camera, -MOVE_INC * deltaTime, 0),
    arrowdown: (deltaTime) => moveCameraFPS(camera, -MOVE_INC * deltaTime, 0),
    down: (deltaTime) => moveCameraFPS(camera, -MOVE_INC * deltaTime, 0),
    arrowleft: (deltaTime) => rotateCamera(camera, -TURN_INC * deltaTime),
    left: (deltaTime) => rotateCamera(camera, -TURN_INC * deltaTime),
    arrowright: (deltaTime) => rotateCamera(camera, TURN_INC * deltaTime),
    right: (deltaTime) => rotateCamera(camera, TURN_INC * deltaTime),
    a: (deltaTime) => moveCameraFPS(camera, 0, -MOVE_INC * deltaTime),
    d: (deltaTime) => moveCameraFPS(camera, 0, +MOVE_INC * deltaTime),
    q: (deltaTime) => camera.pitchY = clamp(camera.pitchY + PITCH_INC * deltaTime, -PITCH_LIMIT, PITCH_LIMIT),
    e: (deltaTime) => camera.pitchY = clamp(camera.pitchY - PITCH_INC * deltaTime, -PITCH_LIMIT, PITCH_LIMIT),
    z: (deltaTime) => moveCamera(camera, { z: -MOVE_INC * deltaTime }),
    x: (deltaTime) => moveCamera(camera, { z: +MOVE_INC * deltaTime }),
    ' ': () => { if (camera.speedZ === 0) camera.speedZ = 0.1; },
};

const animationLoop = (timeStep = 0) => {
    resize();
    const now = timeStep * 0.001; // to senconds
    const deltaTime = now - time;
    const fps = deltaTime > 0 ? 1 / deltaTime : 0;
    frameCount++;
    fpsAccum = fpsAccum < 0 ? fps : fpsAccum + fps;
    time = now;
    
    //ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    renderer(camera);
    ctx.putImageData(imgData, 0, 0);

    Object.keys(keyMap)
        .filter(key => keyMap[key] && cameraCommands[key])
        .forEach(key => cameraCommands[key](deltaTime));

    camera.z += camera.speedZ;
    camera.speedZ -= 0.9 * deltaTime;
    if (camera.z < 0) {
        camera.speedZ = 0;
        camera.z = 0;
    }

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
