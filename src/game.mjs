const rBlock = /^\s*#\s*(\d+)\s*$/;
const rNewLine = /\r?\n/;

const books = {
	'harrison-harry_become-steel_rat': {
		author: 'Гарри Гаррисон',
		name: 'Стань стальной крысой!'
	},
	'packard-edward_the-mystery-of-chimney-rock': {
		author: 'Эдвард Паккард',
		name: 'Тайна Заброшенного Замка'
	},
	'brightfield-richard_hijacked': {
		author: 'Ричард Брайтфилд',
		name: 'Похищены!'
	},
	'jay-leibold_you-are-a-millionaire': {
		author: 'Джей Либолд',
		name: 'Ты — миллионер'
	},
	'jay-leibold_secret-of-the-ninja': {
		author: 'Джей Либолд',
		name: 'Секрет ниндзя'
	},
	'montgomery-raymond-almiran_journey-under-the-sea': {
		author: 'Рэймонд Алмиран Монтгомери',
		name: 'Путешествие на дно моря'
	},
	'montgomery-raymond-almiran_behind-the-wheel': {
		author: 'Рэймонд Алмиран Монтгомери',
		name: 'За рулём'
	},
	'wilhelm-doug_scene-of-the-crime': {
		author: 'Дуг Уилхелм',
		name: 'Место преступления'
	},
	'sara-compton_spencer-compton_daredevil-park': {
		author: 'Сара и Спенсер Комптон',
		name: 'Луна-парк для смельчаков'
	},
	'koltz-tony_vampire-express': {
		author: 'Тони Кольтц',
		name: 'В поезде с вампирами'
	},
	'montgomery-ramsey_outlaw-gulch': {
		author: 'Рэмси Монтгомери',
		name: 'Каньон разбойников'
	},
	//'test'                            : 'Test',
};

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
	constructor() {

		this.container = document.querySelector('.container');
		this.gameDiv = document.querySelector('.game');
		this.visDiv = document.querySelector('.vis');

		this.startLink = document.querySelector('.menu [data-action=start]');

		this.listLink = document.querySelector('.menu [data-action=list]');
		this.listLink.addEventListener('click', () => {
			const url = new URL(location.href);
			url.searchParams.delete('book');
			url.hash = '';
			this.listLink.href = url.toString();
		});

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

		this.vis.on('stabilized', _ => {
			if (!this.way) {
				return;
			}
			localStorage.setItem(`${this.base}-nodes`, JSON.stringify(this.vis.getPositions()));
		});


		this.converter = new showdown.Converter({optionKey: 'value'});

		this.step = this.step.bind(this);

		this.vis.on('click', params => {
			const id = this.vis.getNodeAt(params.pointer.DOM);
			if (Number.isInteger(id)) {
				location.hash = id;
			}
		});

	}

	way = true;

	/** @type {HTMLAnchorElement} */ listLink;
	/** @type {HTMLAnchorElement} */ startLink;

	/** @type {HTMLElement} */ container;
	/** @type {HTMLElement} */ gameDiv;
	/** @type {HTMLElement} */ visDiv;

	/** @type {string} */ base;

	/** @type {Map<number, Child>} */ childs = new Map();


	/** @type {number[]} */ history = [];

	/**
	 * @private
	 * @param {string} text
	 */
	parse(text) {
		let index = -1;

		let nodePosition = {};

		if (this.way) {
			try {
				nodePosition = JSON.parse(localStorage.getItem(`${this.base}-nodes`) ?? '{}')
			} catch (_) {}
		}


		const complete = () => {
			const child = this.childs[index];
			if (!child) {
				console.warn('complete: no child');
				return;
			}

			child.text = child.text.trim();

			const matches = child.text.matchAll(/\[[^\]]+]\(#(\d+)\)/g);
			for (const match of matches) {
				const to = +match[1];
				const id = `${index}-${to}`;

				if (this.way && !this.edges.get(id)) {
					const edge = this.edges.get(`${to}-${index}`);
					if (edge) {
						this.edges.update([{id: edge.id, arrows: 'to, from'}]);
					} else {
						this.edges.add({id: id, from: index, to: to, arrows: 'to'});
					}
				}
			}

			child.text = this.converter.makeHtml(child.text).replaceAll('src="image/', `src="book/${this.base}/image/`);


			if (this.way) {
				const node = {id: index, label: `${index}`, fixed: false};
				if (nodePosition[node.id]) {
					node.x = nodePosition[node.id].x;
					node.y = nodePosition[node.id].y;
				}

				this.nodes.add(node);
			}
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

		if (this.way) {
			this.nodes.update([{id: id, shape: 'box', color: {background: '#00d025'}}]);

			if (this.history.length > 1) {
				const prev = this.history[this.history.length - 2];
				this.edges
				    .get()
				    .filter(edge => edge.from === prev && edge.to === id || edge.from === id && edge.to === prev)
				    .forEach(edge => {
					    this.edges.update([{id: edge.id, color: {color: '#00d025', highlight: '#76f887'}}]);
				    });
			}

			this.vis.focus(id, {
				offset: {
					x: this.container.offsetWidth * .5,
					y: 0
				},
				animation: {
					duration: 1000,
					easingFunction: 'easeInOutQuad',
				},
			});
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
		this.way = url.searchParams.has('way');
		this.container.classList.toggle('container-way', this.way);

		const request = await fetch(path);
		const response = await request.text();
		this.parse(response);

		addEventListener(`hashchange`, this.step);

		if (!this.way) {
			this.visDiv.style.pointerEvents = 'none';
		}

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

			for (const [k, v] of Object.entries(books)) {
				const url = new URL(location.href);
				if (!author || author !== v.author) {
					this.gameDiv.insertAdjacentHTML('beforeend', `<div class="menu-head">${v.author}</div>`);
					author = v.author;
				}

				url.searchParams.delete('way');
				url.searchParams.set('book', k);
				const a = url.toString();
				url.searchParams.set('way', '1');
				const b = url.toString();
				this.gameDiv.insertAdjacentHTML('beforeend', `<div class="menu-item"><a href="${a}" class="button">${v.name}</a><a href="${b}" class="button" title="Отображать маршрут">🪡</a></div>`);
			}

			if (0) {
				author = undefined;
				let out = '\n';

				for (const [k, v] of Object.entries(books)) {
					if (!author || author !== v.author) {
						out += `### ${v.author}`+'\n\n';

						author = v.author;
					}
					out += `[${v.name}](https://nazarpunk.github.io/gamebook/?book=${k})`+'\n\n';
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
		open(`https://www.litmir.me/BookBinary/194829/1393940999/i_${n}.png/${i}`, '_blank');
	}
}


export {Game};