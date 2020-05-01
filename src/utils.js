import PALETTE from "./palette";

const TO_RAD = Math.PI / 180;

const createCellGetter = (cells, width) => (col, row) => cells[col + row * width] || 0;

const getColorShade = (color, brightness) => {
    const r = (((color >> 24) & 0xFF) * brightness) | 0;
    const g = (((color >> 16) & 0xFF) * brightness) | 0;
    const b = (((color >>  8) & 0xFF) * brightness) | 0;
    const a = (color >> 0) & 0xFF;

    return (r << 24) | (g << 16) | (b << 8) | a;
}

const getTextureColor = (texture, px, py, brightness = 1) => {
    const [w] = texture;
    const color8 = texture[2 + px * w + py] * 4;
    const r = Math.round(PALETTE[color8 + 0] * brightness);
    const g = Math.round(PALETTE[color8 + 1] * brightness);
    const b = Math.round(PALETTE[color8 + 2] * brightness);
    const a = PALETTE[color8 + 3];

    return (r << 24) | (g << 16) | (b << 8) | a;
}

const getTextureColorFromUV = (texture, u, v, brightness = 1) => {
    const [w, h] = texture;
    return getTextureColor(texture, ((u * w) | 0) % w, ((v * h) | 0) % h, brightness);
};

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const createPlotter = imageData => (
    (px, py, rgba) => {
        if (px < 0 || px >= imageData.width || py < 0 || py >= imageData.height) return;
        const offset = (px + py * imageData.width) * 4;
        imageData.data[offset + 0] = (rgba >> 24) & 0xFF; // r
        imageData.data[offset + 1] = (rgba >> 16) & 0xFF; // g
        imageData.data[offset + 2] = (rgba >>  8) & 0xFF; // b
        imageData.data[offset + 3] = (rgba >>  0) & 0xFF; // alpha
    }
);

export {
    createPlotter,
    createCellGetter,
    getColorShade,
    getTextureColor,
    getTextureColorFromUV,
    clamp,
    TO_RAD,
};
