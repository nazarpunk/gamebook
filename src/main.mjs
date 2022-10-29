import {Game} from './game.mjs';

const game = new Game(document.body, '/gamebook/book/rat.md');
game.start().then(_ => {});
