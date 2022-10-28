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
		this.container = document.createElement('div');
		container.appendChild(this.container);
		this.path = path;
	}

	/** @type {HTMLElement} */
	container;

	/** @type {Map<number, Child>} */
	childs = new Map();
	nodes = [];
	edges = [];

	/**
	 * @private
	 * @param {string} text
	 */
	parse(text) {
		let index = -1;
		let content = ``;
		/** @type {Button[]} */
		let buttons = [];

		const save = () => {
			this.nodes.push({id: index, label: `${index}`});

			this.childs[index] = new Child(index,content.trim(),buttons);
			content = ``;

			for (const button of buttons) {
				button.text = button.text.trim();
				this.edges.push({from: index, to: button.id, arrows: `to`});
			}

			buttons = [];
		};

		for (let str of text.split(rNewLine)) {
			if (rBlock.test(str)) {
				if (index >= 0) save();
				index = +str.match(rBlock)[1];
				continue;
			}

			if (rButton.test(str)) {
				const [, id] = str.match(rButton);
				buttons.push(new Button(+id, ''));
				continue;
			}

			if (buttons.length) {
				buttons[buttons.length - 1].text += '\n' + str;
			} else {
				content += '\n' + str;
			}

		}
		save();

		console.log(this.childs);
	}


	async start() {
		const request = await fetch(this.path);
		const response = await request.text();
		this.parse(response);
	}
}

export {Game};