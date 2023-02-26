import {books} from './book.mjs';

const rBlock = /^\s*#\s*(\d+)\s*$/;
const rNewLine = /\r?\n/;

const graphUrlKey = 'graph';

class Child {
	/**
	 * @param {number} id
	 */
	constructor(id) {
		this.id = id;
	}

	text = '';
}


class Game {
	_vis = false;

	constructor() {

		this.container = document.querySelector('.container');
		this.gameDiv = document.querySelector('.game');

		this.graphDiv = document.querySelector('.graph');

		this.startLink = document.querySelector('.menu [data-action=start]');

		this.listLink = document.querySelector('.menu [data-action=list]');
		this.listLink.addEventListener('click', () => {
			const url = new URL(location.href);
			url.searchParams.delete('book');
			url.hash = '';
			this.listLink.href = url.toString();
		});

		this.graph = ForceGraph3D({controlType: 'orbit'})(this.graphDiv)
		.graphData({nodes: this.nodes, links: this.links})
		.linkDirectionalArrowLength(6)
		.linkDirectionalArrowRelPos(1)
		.linkDirectionalArrowColor(() => '#f00')
		.backgroundColor('#242526')
		.showNavInfo(false)
		.nodeThreeObject(node => {
			const sprite = new SpriteText(node.id);
			sprite.color = "#fff";
			sprite.backgroundColor = "#155f96";
			sprite.padding = [6, 2];
			sprite.textHeight = 5;
			sprite.fontWeight = 500;
			sprite.borderRadius = 2;
			return sprite;
		});

		if (this._vis) {
			this.vis = new vis.Network();
			this.vis.on('click', params => {
				const id = this.vis.getNodeAt(params.pointer.DOM);
				if (Number.isInteger(id)) {
					location.hash = id;
				}
			});
		}

		this.converter = new showdown.Converter({optionKey: 'value'});

		this.step = this.step.bind(this);
	}

	graphEnable = true;

	/** @type {HTMLAnchorElement} */ listLink;
	/** @type {HTMLAnchorElement} */ startLink;

	/** @type {HTMLElement} */ container;
	/** @type {HTMLElement} */ gameDiv;
	/** @type {HTMLElement} */ graphDiv;

	/** @type {string} */ base;

	/** @type {Map<number, Child>} */ childs = new Map();

	nodes = [];
	links = [];

	/** @type {number[]} */ history = [];

	/**
	 * @private
	 * @param {string} text
	 */
	parse(text) {
		let index = -1;

		const complete = () => {
			const child = this.childs[index];
			if (!child) {
				console.warn('complete: no child');
				return;
			}

			child.text = child.text.trim();

			if (this.graphEnable) {
				const matches = child.text.matchAll(/\[[^\]]+]\(#(\d+)\)/g);
				for (const match of matches) {
					this.links.push({
						source: index,
						target: +match[1],
					});
				}

				this.nodes.push({id: index});
			}

			child.text = this.converter.makeHtml(child.text).replaceAll('src="image/', `src="book/${this.base}/image/`);
		};

		for (let str of text.split(rNewLine)) {
			if (rBlock.test(str)) {
				if (index >= 0) complete();
				index = +str.match(rBlock)[1];
				this.childs[index] = new Child(index);
				continue;
			}

			const child = this.childs[index];
			if (child) {
				child.text += '\n' + str;
			} else {
				console.warn('parse: no child');
			}
		}
		complete();


		this.graph.graphData({nodes: this.nodes, links: this.links});

	}

	step() {
		let id = +window.location.hash.replace(/\D+/, ``);
		id = isNaN(id) ? 0 : id;

		this.history.push(id);

		this.startLink.ariaDisabled = id > 0 ? 'false' : 'true';

		if (!this.childs.hasOwnProperty(id)) {
			console.warn(`Paragraph is missing: ${id}`);
			return;
		}
		this.gameDiv.innerHTML = this.childs[id].text;

		scroll(0, 0);

		if (this._vis) {
			if (this.graphEnable) {
				this.nodes.update([{id: id, shape: 'box', color: {background: '#00d025'}}]);

				if (this.history.length > 1) {
					const prev = this.history[this.history.length - 2];
					this.edges.get().filter(edge => edge.from === prev && edge.to === id || edge.from === id && edge.to === prev).forEach(edge => {
						this.edges.update([{id: edge.id, color: {color: '#00d025', highlight: '#76f887'}}]);
					});
				}

				this.vis.focus(id, {
					offset: {
						x: this.container.offsetWidth * .5, y: 0
					}, animation: {
						duration: 1000, easingFunction: 'easeInOutQuad',
					},

				});
			}
		}


	};

	/**
	 * @param base
	 * @return {Promise<void>}
	 */
	async start(base) {
		this.base = base;

		const path = `/gamebook/book/${base}/book.md`;

		const url = new URL(location.href);
		this.graphEnable = url.searchParams.has(graphUrlKey);
		document.body.classList.toggle('with-graph', this.graphEnable);

		const request = await fetch(path);
		const response = await request.text();
		this.parse(response);

		addEventListener(`hashchange`, this.step);

		this.step();
	}

	async route() {
		const url = new URL(location.href);
		const book = url.searchParams.get('book');

		if (books[book]) {
			document.body.classList.add('loading');
			await this.start(book);
			document.body.classList.remove('loading');
		} else {
			let author;

			this.graphDiv.style.pointerEvents = 'none';

			for (const [k, v] of Object.entries(books)) {
				const url = new URL(location.href);
				if (!author || author !== v.author) {
					this.gameDiv.insertAdjacentHTML('beforeend', `<div class="menu-head">${v.author}</div>`);
					author = v.author;
				}

				url.searchParams.delete(graphUrlKey);
				url.searchParams.set('book', k);
				const a = url.toString();
				url.searchParams.set(graphUrlKey, '1');
				const b = url.toString();
				this.gameDiv.insertAdjacentHTML('beforeend', `<div class="menu-item"><a href="${a}" class="button">${v.name}</a><a href="${b}" class="button" title="Отображать маршрут">🪡</a></div>`);
			}

			if (0) {
				author = undefined;
				let out = '\n';

				for (const [k, v] of Object.entries(books)) {
					if (!author || author !== v.author) {
						out += `### ${v.author}` + '\n\n';

						author = v.author;
					}
					out += `[${v.name}](https://nazarpunk.github.io/gamebook/?book=${k})` + '\n\n';
				}
				console.log(out);
			}

		}
	}
}

const game = new Game();
game.route().then(_ => {});

if (0) {
	for (let i = 29; i > 0; i--) {
		const n = String(i).padStart(3, '0');
		open(`https://www.litmir.me/BookBinary/194960/1394024815/i_${n}.png/${i}`, '_blank');
	}
}


export {Game};