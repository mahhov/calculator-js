const path = require('path');
const {ViewHandle, TrayHelper, ShortcutListener, appReadyPromise} = require('js-desktop-base');

TrayHelper.createExitTray('resources/calculator-solid.png', 'calculator');

class MyViewHandle extends ViewHandle {
	constructor() {
		super({
			width: 500,
			height: 500,
			frame: false,
			thickFrame: false,
			show: true,
			webPreferences: {nodeIntegration: true}
		}, path.join(__dirname, './view.html'));
		// ShortcutListener.add('Control+Shift+Z', this.show.bind(this));
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

let view = new MyViewHandle();
