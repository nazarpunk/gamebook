import {Game} from './game.mjs';

const game = new Game(document.body, '../book/rat.md');
game.start().then(_ => {});
