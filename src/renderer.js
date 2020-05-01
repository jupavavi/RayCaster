import {
    createCellGetter,
    createPlotter,
    getTextureColorFromUV,
    clamp,
    TO_RAD,
} from "./utils";
import { verticalCaster, horizontalCaster } from "./casters";

const textScale = 1;

export default (map, imageData) => {
    const plot = createPlotter(imageData);

    const { textures } = map;
    const getMapCell = createCellGetter(map.walls, map.width);
    const getCeilingCell = createCellGetter(map.ceiling, map.width);
    const getFloorCell = createCellGetter(map.floor, map.width);
    const { width, height } = imageData;
    const outWallHitData = {};
    const outCeilingHitData = {};

    const renderFlat = (screenX, screenY, camera, ray, cellGetter) => {
        const {
            texX: ctexX,
            texY: ctexY,
            col,
            row,
            sqrDist,
        } = horizontalCaster(outCeilingHitData, camera, ray);
        const texture = textures[cellGetter(col, row) || 0];
        const u = ctexX * textScale;
        const v = ctexY * textScale;
        const distShade = clamp((2 / sqrDist), 0, 1);
        const color = getTextureColorFromUV(texture, u, v, distShade);
        plot(screenX, screenY, color);
    };

    return (camera) => {
        const { x, y, z, viewX, viewY, fov, pitchY } = camera;
        const ratio = width / height;
        const f = ratio / Math.tan((fov * TO_RAD) / 2);
        const planeX = -viewY * f;
        const planeY = viewX * f;
        const halfHeight = (height / 2) | 0;
        const ray = { x: 0, y: 0, z: 0 };
        const offsetY = pitchY * halfHeight;
    
        for (let sx = 0; sx < width; sx++) {
            // calculate ray position and direction
            const cameraX = 2 * sx / width - 1; // x-coordinate in camera space
            ray.x = viewX + planeX * cameraX;
            ray.y = viewY + planeY * cameraX;

            // for (let sy = 0; sy < height; sy++) plot(sx, sy, 0xFFFFFFFF); // clears screen
    
            verticalCaster(outWallHitData, camera, ray, getMapCell);
            const {
                projDist,
                side,
                hitX,
                hitY,
                texX,
                col: wallCol,
                row: wallRow,
            } = outWallHitData;
    
            const wallTexture = textures[getMapCell(wallCol, wallRow) ||  0];    
            const wallSqrtDist = (hitX - x) * (hitX - x) + (hitY - y) * (hitY - y);
    
            // Calculate height of line to draw on screen
            const lineHeight = (height / projDist) | 0;
    
            //calculate lowest and highest pixel to fill in current stripe
            const projZ = 2 * z * halfHeight / projDist;
            const hallfOffsetY = (offsetY / 2) | 0;
            const floor = (((-lineHeight + height) / 2) | 0) + hallfOffsetY + projZ;
            const ceiling = (((lineHeight + height) / 2) | 0) + hallfOffsetY + projZ;
            const wallStart = floor < 0 ? 0 : floor;
            const wallEnd = (ceiling >= height ? height - 1 : ceiling);            
            const textX = texX * textScale;    
            const limitY = Math.max(wallEnd, halfHeight) + 1;
    
            for (let sy = -Math.abs(hallfOffsetY); sy < limitY; sy++) {
                const ceilingY = sy + hallfOffsetY;
                const floorY = height - sy + hallfOffsetY - 1;
                ray.z = 1 - sy / (halfHeight);

                if (wallEnd < floorY) {
                    // render floor
                    renderFlat(sx, floorY, camera, ray, getFloorCell);
                }
                if (ceilingY < wallStart) {
                    // render ceiling
                    camera.z *= -1;
                    renderFlat(sx, ceilingY, camera, ray, getCeilingCell);
                    camera.z *= -1;
                }

                if (sy >= wallStart && sy <= wallEnd) {
                    // render wall
                    const distShade = clamp((2 / wallSqrtDist), 0, 1) * (side === 0 ? 1 : 0.75);
                    const textY = (sy - floor) / lineHeight * textScale;                    
                    const color = getTextureColorFromUV(wallTexture, textX, textY, distShade);
                    plot(sx, sy, color);
                }
            }
        }
    };
};
