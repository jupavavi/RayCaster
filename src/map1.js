import texture1 from "./texture1";
import texture2 from "./texture2";
import texture3 from "./texture3";
import texture4 from "./texture4";
import texture5 from "./texture5";
import texture6 from "./texture6";
import texture7 from "./texture7";

export default {
    width: 8,
    height: 8,
    players: [
        {
            x: 3.5, // in the middle of col 3
            y: 3.5, // in the middle of row 3
            viewX: 1,
            viewY: 0,
            angle: 0,
        },
    ],
    textures: [
        [1, 1, 0x00],
        texture1,
        texture2,
        texture3,
        texture4,
        texture5,
        texture6,
        texture7,
    ],
    walls: [
        2, 2, 1, 1, 1, 4, 4, 4,
        2, 0, 2, 0, 0, 0, 0, 4,
        2, 0, 0, 0, 0, 4, 0, 4,
        1, 0, 0, 0, 0, 4, 0, 4,
        1, 0, 0, 0, 0, 0, 0, 4,
        1, 0, 0, 0, 4, 4, 4, 4,
        1, 1, 0, 0, 0, 0, 0, 1,
        1, 3, 3, 3, 4, 4, 4, 1,
    ],
    ceiling: [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 7, 1, 7, 1, 7, 7, 1,
        1, 7, 1, 7, 1, 1, 7, 1,
        1, 1, 1, 1, 1, 1, 7, 1,
        1, 1, 1, 1, 1, 7, 7, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 7, 1, 7, 1, 7, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
    ],
    floor: [
        5, 5, 5, 5, 5, 5, 5, 5,
        5, 2, 5, 2, 5, 1, 1, 5,
        5, 2, 2, 2, 5, 5, 1, 5,
        5, 5, 5, 5, 5, 5, 1, 5,
        5, 5, 5, 5, 5, 1, 1, 5,
        5, 5, 5, 5, 5, 5, 5, 5,
        5, 5, 5, 5, 1, 1, 1, 5,
        5, 5, 5, 5, 5, 5, 5, 5,
    ],
};
