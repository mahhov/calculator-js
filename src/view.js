const {ipcRenderer: ipc} = require('electron');
const Calc = require('./calc');

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
	constructor() {
		this.size = $('#output').childElementCount;
		this.clear();
	}

	clear() {
		this.valuePairs = Array(this.size).fill([]);
		this.updateView();
	}

	push(valuePair) {
		this.valuePairs.push(valuePair);
		this.valuePairs.shift();
		this.updateView();
	}

	updateView() {
		this.valuePairs.forEach((valuePair, i) => {
			let row = $('#output').children[i];
			$$(row, '.left').textContent = valuePair[0];
			$$(row, '.right').textContent = valuePair[1] ? '=' + valuePair[1] : '';
		});
	}

	get prevResults() {
		return this.valuePairs
			.map(a => a[1])
			.reverse();
	}
}

let outputs = new Outputs();

let alwaysOnTop;

document.body.addEventListener('keydown', ({altKey, ctrlKey, shiftKey, code}) => {
	$('#input').focus();
	switch (code) {
		case 'Enter':
			if (altKey) {
				alwaysOnTop = !alwaysOnTop;
				$('html').classList.toggle('always-on-top', alwaysOnTop);
				ipcSend({name: 'sticky', value: alwaysOnTop});
			} else {
				let input = $('#input').value;
				outputs.push([input, Calc.do(input, outputs.prevResults)]);
			}
			break;

		case 'ArrowUp':
		case 'ArrowDown':
			if (ctrlKey)
				;
			break;

		case 'Escape':
			if (shiftKey)
				outputs.clear();
			else
				$('#input').value = '';
			break;
	}
});

let ipcSend = message => ipc.send('window-request', message);
