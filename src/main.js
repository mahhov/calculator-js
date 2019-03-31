const path = require('path');
const {app} = require('electron');
const {ViewHandle, TrayHelper, ShortcutListener} = require('js-desktop-base');

let trayIcon = path.join(__dirname, '../resources/calculator-solid.png');
TrayHelper.createExitTray(trayIcon, 'Calculator');

class CalcViewHandle extends ViewHandle {
	constructor() {
		super({
			width: 500,
			height: 500,
			frame: false,
			thickFrame: false,
			show: false,
			webPreferences: {nodeIntegration: true}
		}, path.join(__dirname, './view.html'));

		this.setupHideInsteadOfClose();
	}

	async setupHideInsteadOfClose() {
		(await this.window).on('close', ev => {
			if (!this.quitting) {
				ev.preventDefault();
				this.hide();
			}
		});

		app.on('before-quit', () => this.quitting = true);
	}

	async onMessage(message) {
		switch (message.name) {
			case 'hide':
				this.hide();
				break;
			case 'sticky':
				(await this.window).setAlwaysOnTop(message.value);
				break;
			default:
				console.error('Unknown window request:', message);
		}
	}
}

let viewHandle = new CalcViewHandle();

ShortcutListener.add('Control+Shift+C', viewHandle.show.bind(viewHandle));

setInterval(() => 0, 100);
