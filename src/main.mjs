import {Game} from './game.mjs';

const game = new Game(document.body, '/book/rat.md');
game.start();


if (0) {
	const step = () => {
		let id = +window.location.hash.replace(/\D+/, ``);
		id = isNaN(id) ? 0 : id;

		if (!data.hasOwnProperty(id)) {
			//alert(`Paragraph is missing: ${id}`);
			return;
		}
		$main.innerHTML = data[id].text.trim();
		$main.querySelectorAll(`p:empty`).forEach($p => $p.remove());

		for (const btn of data[id].buttons) {
			$main.insertAdjacentHTML(`beforeend`, `<a href="#${btn[0]}" class="button">${btn[1]} <span>${btn[0]}</span></a>`);
		}

	};

	addEventListener(`hashchange`, step);
	step();


	if (0) {
		new vis.Network(document.getElementById('vis'), {
			nodes: new vis.DataSet(nodes),
			edges: new vis.DataSet(edges)
		}, {});
	}
}
