document.addEventListener(`DOMContentLoaded`, () => {

	const $script = document.getElementById(`game`)
		, text    = $script.textContent
		, data    = {}
		, rex_id  = /^\s*#(\d+)$/
		, rex_btn = /^\s*\|(\d+)(.*)$/
		, rex_nl  = /\r?\n/;

	let index   = -1,
	    content = ``,
	    buttons = [];


	const nodes = []
		, edges = [];

	const save = () => {
		nodes.push({id: index, label: `${index}`});

		data[index] = {
			text   : content,
			buttons: buttons
		};
		content = ``;

		for (const btn of buttons) edges.push({from: index, to: btn[0], arrows: `to`});

		buttons = [];
	};

	for (let str of text.split(rex_nl)) {
		if (rex_id.test(str)) {
			if (index >= 0) save();
			index = +str.match(rex_id)[1];
		} else if (rex_btn.test(str)) {
			const [, id, text] = str.match(rex_btn);
			buttons.push([+id, text.trim()]);
		} else {
			content += `<p>${str}</p>`;
		}
	}
	save();

	const $main = document.querySelector(`main`);

	const step = () => {
		let id = +window.location.hash.replace(/\D+/, ``);
		id = isNaN(id) ? 0 : id;

		if (!data.hasOwnProperty(id)) {
			alert(`Paragraph is missing: ${id}`);
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

	// vis
	new vis.Network(document.getElementById('vis'), {
		nodes: new vis.DataSet(nodes),
		edges: new vis.DataSet(edges)
	}, {});

});
