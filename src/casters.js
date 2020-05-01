export const horizontalCaster = (outHitData = {}, camera, ray) => {
    const { x, y, z } = camera;
    const { x: rayX, y: rayY, z: rayZ } = ray;
    const dz = 1 + 2 * z;
    const dx = rayX * dz / rayZ;
    const dy = rayY * dz / rayZ;
    const cx = x + dx;
    const cy = y + dy;

    const col = cx | 0;
    const row = cy | 0;

    const texX = Math.abs(cx - col);
    const texY = Math.abs(cy - row);
    
    outHitData.col = col;
    outHitData.row = row;
    outHitData.texX = texX;
    outHitData.texY = texY;
    outHitData.sqrDist = dx * dx + dy * dy;

    return outHitData;
};

export const verticalCaster = (outHitData = {}, camera, ray, cellGetter) => {
    const { x, y } = camera;
    const { x: rayX, y: rayY } = ray;
    const deltaDistX = rayX === 0 ? Infinity : Math.abs(1 / rayX);
    const deltaDistY = rayY === 0 ? Infinity : Math.abs(1 / rayY);
    let col = x | 0;
    let row = y | 0;

    let stepX = rayX < 0 ? -1 : 1;
    let stepY = rayY < 0 ? -1 : 1;
    let sideDistX = (rayX < 0 ? (x - col) : (col + 1 - x)) * deltaDistX;
    let sideDistY = (rayY < 0 ? (y - row) : (row + 1 - y)) * deltaDistY;
    let side = 0;

    do {
        // jump to next map square, OR in x-direction, OR in y-direction
        if (sideDistX < sideDistY) {
            sideDistX += deltaDistX;
            col += stepX;
            side = 0;
        } else {
            sideDistY += deltaDistY;
            row += stepY;
            side = 1;
        }
        //Check if ray has hit a wall
    } while (!cellGetter(col, row));

    const dx = side === 0 ? (col - x + (1 - stepX) / 2) : col - x;
    const dy = side === 1 ? (row - y + (1 - stepY) / 2) : row - y;

    const projDist = side === 0 ? (dx / rayX) : (dy / rayY);

    const tx = projDist * rayX + x - col;
    const ty = projDist * rayY + y - row;

    outHitData.col = col;
    outHitData.row = row;
    outHitData.projDist = projDist;
    outHitData.side = side;
    outHitData.texX = side === 1 ? tx : ty;
    outHitData.hitX = tx + col;
    outHitData.hitY = ty + row;

    return outHitData;
}
