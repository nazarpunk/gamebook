const rButton = /^\s*->\s*(\d+)\s*$/;
const rBlock = /^\s*\{\s*(\d+)\s*}\s*$/;
const rNewLine = /\r?\n/;

class Button {
	/**
	 * @param {number} id
	 * @param {string} text
	 */
	constructor(id, text) {
		this.id = id;
		this.text = text;
	}
}

class Child {
	/**
	 * @param {number} id
	 * @param {string} text
	 * @param {Button[]} buttons
	 */
	constructor(id, text, buttons) {
		this.id = id;
		this.text = text;
		this.buttons = [];
	}
}


class Game {
	/**
	 * @param {HTMLElement} container
	 * @param {string} path
	 */
	constructor(container, path) {
		this.path = path;

		this.gameDiv = document.createElement('div');
		this.gameDiv.classList.add('game');
		this.gameDiv.style.display = 'none';
		container.appendChild(this.gameDiv);

		this.visDiv = document.createElement('div');
		this.visDiv.classList.add('vis');
		container.appendChild(this.visDiv);

		this.nodes = new vis.DataSet();
		this.edges = new vis.DataSet();

		this.vis = new vis.Network(
			this.visDiv,
			{
				nodes: this.nodes,
				edges: this.edges,
			}, {
				layout: {
					improvedLayout: false
				}
			}
		);

		this.converter = new showdown.Converter();

		this.step = this.step.bind(this);
	}

	/** @type {HTMLElement} */ gameDiv;
	/** @type {HTMLElement} */ visDiv;

	/** @type {Map<number, Child>} */ childs = new Map();

	/**
	 * @private
	 * @param {string} text
	 */
	parse(text) {
		let index = -1;

		const complete = () => {
			const child = this.childs[index];

			child.text = child.text.trim();

			const matches = child.text.matchAll(/\[\d+]\(#(\d+)\)/g);
			for (const match of matches) {
				const to = +match[1];
				const id = `${index}-${to}`;

				if (!this.edges.get(id)) {
					this.edges.add({id: id, from: index, to: to, arrows: `to`});
				}
			}

			child.text = this.converter.makeHtml(child.text);

			this.nodes.add({id: index, label: `${index}`});
			for (const button of this.childs[index].buttons) {
				button.text = this.converter.makeHtml(button.text.trim());
				this.edges.add({from: index, to: button.id, arrows: `to`});
			}

		};

		for (let str of text.split(rNewLine)) {
			if (rBlock.test(str)) {
				if (index >= 0) complete();
				index = +str.match(rBlock)[1];
				this.childs[index] = new Child(index, '', []);
				continue;
			}

			const child = this.childs[index];

			if (rButton.test(str)) {
				const [, id] = str.match(rButton);
				child.buttons.push(new Button(+id, ''));
				continue;
			}

			if (child.buttons.length) {
				child.buttons[child.buttons.length - 1].text += '\n' + str;
			} else {
				child.text += '\n' + str;
			}
		}
		complete();
	}

	step() {
		let id = +window.location.hash.replace(/\D+/, ``);
		id = isNaN(id) ? 0 : id;

		if (!this.childs.hasOwnProperty(id)) {
			//alert(`Paragraph is missing: ${id}`);
			return;
		}
		this.gameDiv.innerHTML = this.childs[id].text.trim();
		this.gameDiv.querySelectorAll(`p:empty`).forEach(p => p.remove());

		for (const button of this.childs[id].buttons) {
			this.gameDiv.insertAdjacentHTML(`beforeend`, `<a href="#${button.id}" class="button">${button.text}</a>`);
		}

	};

	async start() {
		const request = await fetch(this.path);
		const response = await request.text();
		this.parse(response);

		//this.vis.setData({nodes: this.nodes, edges: this.edges});

		addEventListener(`hashchange`, this.step);
		this.step();
		this.gameDiv.style.removeProperty('display');

		document.querySelectorAll('.loader').forEach(e => e.remove());
	}
}

export {Game};