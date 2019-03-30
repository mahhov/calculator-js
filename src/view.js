const {ipcRenderer: ipc} = require('electron');
const Calc = require('./Calc');

const $ = document.querySelector.bind(document);
const $$ = (el, query) => el.querySelector(query);
const $c = document.createElement.bind(document);

ipc.on('window-command', (_, command) => {
	console.log('received', command);
	switch (command.name) {
		case 'open':
			break;
		default:
			console.error('Unknown window command:', command);
	}
});

class Outputs {
	constructor(size) {
		this.size = size;
		for (let i = 0; i < size; i++)
			$('#output').appendChild(Outputs.createRowEl());
		this.clear();
		this.clearSelected();
	}

	static createRowEl() {
		let row = $c('div');
		row.classList.add('row');

		let left = $c('div');
		left.classList.add('left');
		row.appendChild(left);

		let right = $c('div');
		right.classList.add('right');
		row.appendChild(right);

		return row;
	}

	clear() {
		this.valuePairs = Array(this.size).fill(['']);
		this.updateView();
	}

	push(valuePair) {
		this.valuePairs.push(valuePair);
		this.valuePairs.shift();
		this.updateView();
	}

	get prevResults() {
		return this.valuePairs
			.map(a => a[1])
			.reverse();
	}

	clearSelected() {
		this.selected = this.size;
		this.updateView();
	}

	selectUp() {
		if (--this.selected < 0)
			this.clearSelected();
		this.updateView();
	}

	selectDown() {
		if (++this.selected > this.size)
			this.selected = 0;
		this.updateView();
	}

	get hasSelected() {
		return this.selected !== this.size;
	}

	get selectedLeft() {
		return this.valuePairs[this.selected][0];
	}

	updateView() {
		this.valuePairs.forEach((valuePair, i) => {
			let row = $('#output').children[i];
			row.classList.toggle('selected', i === this.selected);
			$$(row, '.left').textContent = valuePair[0];
			$$(row, '.right').textContent = valuePair[0] ? '= ' + valuePair[1] : '';
		});
	}
}

let outputs = new Outputs(9);

let alwaysOnTop;

document.body.addEventListener('keydown', ev => {
	let {altKey, ctrlKey, shiftKey, code} = ev;
	$('#input').focus();

	switch (code) {
		case 'Enter':
			if (altKey) {
				alwaysOnTop = !alwaysOnTop;
				$('html').classList.toggle('always-on-top', alwaysOnTop);
				ipcSend({name: 'sticky', value: alwaysOnTop});
			} else if (outputs.hkasSelected)
				$('#input').value = outputs.selectedLeft;
			else {
				let input = $('#input').value;
				outputs.push([input, Calc.do(input, outputs.prevResults)]);
			}
			break;

		case 'ArrowUp':
			outputs.selectUp();
			ev.preventDefault();
			break;
		case 'ArrowDown':
			ev.preventDefault();
			outputs.selectDown();
			break;

		case 'Escape':
			if (shiftKey)
				outputs.clear();
			else if (outputs.hasSelected)
				outputs.clearSelected();
			else
				$('#input').value = '';
			break;

		default:
			outputs.clearSelected();
	}
});

let ipcSend = message => ipc.send('window-request', message);
