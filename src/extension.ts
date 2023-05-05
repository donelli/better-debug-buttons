
import { existsSync } from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';

// TODO: allow the user to defined which buttons he want
// TODO: allow to choose the color of the buttons: `According to debug theme` or `According to status bar theme`
// TODO: message saying that he needs to hide the default debug floating buttons (only in the first time?)
// TODO: add step into button
// TODO: add step out button
// TODO: add step over button
// TODO: add the `Open devtools` button o dart or flutter projects ????
// TODO: allow to defined if the buttons go on left or right
// TODO: write readme
// TODO: add license

const basePriority = 20;
const startDebugPriority = basePriority;
const pauseContinuePriority = basePriority;
const hotReloadPriority = basePriority - 1;
const restartPriority = basePriority - 2;
const stopPriority = basePriority - 3;

interface Option {
	commandId?: string
	icon: string
	colorId?: string,
	rawColor?: string
	text?: string
}

enum DebugStatus {
	notStarted,
	starting,
	paused,
	running,
}

let startDebugStatusBarItem: vscode.StatusBarItem;
let startingDebugStatusBarItem: vscode.StatusBarItem;

let continueDebugStatusBarItem: vscode.StatusBarItem;
let pauseDebugStatusBarItem: vscode.StatusBarItem;
let restartDebugStatusBarItem: vscode.StatusBarItem;
let hotReloadDebugStatusBarItem: vscode.StatusBarItem;
let stopDebugStatusBarItem: vscode.StatusBarItem;

let currentDebugStatus: DebugStatus = DebugStatus.notStarted;
let isOnDartEnvironment = false;

export function activate(context: vscode.ExtensionContext) {
	createStatusBarItems(context);
	
	updateStatusBar();

	context.subscriptions.push(vscode.debug.onDidStartDebugSession((e) => {
		currentDebugStatus = DebugStatus.starting;
		updateStatusBar();
		updateIsOnDartEnvironment(e.workspaceFolder?.uri);
	}));

	context.subscriptions.push(vscode.debug.onDidTerminateDebugSession(() => {
		currentDebugStatus = DebugStatus.notStarted;
		updateStatusBar();
	}));

	vscode.debug.registerDebugAdapterTrackerFactory('*', {
		createDebugAdapterTracker(session: vscode.DebugSession) {
			return {
				onDidSendMessage: message => {
					const command = message?.command;

					if (command === 'pause') {
						currentDebugStatus = DebugStatus.paused;
						updateStatusBar();
					} else if (command === 'continue') {
						currentDebugStatus = DebugStatus.running;
						updateStatusBar();
					} else if (command === 'configurationDone') {
						if (currentDebugStatus === DebugStatus.starting) {
							currentDebugStatus = DebugStatus.running;
							updateStatusBar();
						}
					} else if (command) {
						console.log('->', command);
					}
					// stepIn
					// stepOut
					// next
				},
			};
		}
	});
}

export function deactivate() {}

const createStatusBarItems = (context: vscode.ExtensionContext) => {

	const createStatusItem = (option: Option, priority: number) => {
		const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority);
		statusBar.text = `$(${option.icon})` + (option.text ? ` ${option.text}` : '');
		statusBar.command = option.commandId;

		if (option.colorId) {
			statusBar.color = new vscode.ThemeColor(option.colorId);
		} else if (option.rawColor) {
			statusBar.color = option.rawColor;
		}

		context.subscriptions.push(statusBar);

		return statusBar;
	};

	startDebugStatusBarItem = createStatusItem({
		commandId: 'workbench.action.debug.start',
		icon: 'debug-start',
		text: 'Start debugging',
		colorId: 'debugIcon.startForeground'
	}, startDebugPriority);

	startingDebugStatusBarItem = createStatusItem({
		icon: 'sync~spin',
		text: 'Starting debug session...',
		colorId: 'debugIcon.startForeground'
	}, startDebugPriority);

	continueDebugStatusBarItem = createStatusItem({
		commandId: 'workbench.action.debug.continue',
		icon: 'debug-continue',
		colorId: 'debugIcon.continueForeground'
	}, pauseContinuePriority);

	pauseDebugStatusBarItem = createStatusItem({
		commandId: 'workbench.action.debug.pause',
		icon: 'debug-pause',
		colorId: 'debugIcon.pauseForeground'
	}, pauseContinuePriority);

	hotReloadDebugStatusBarItem = createStatusItem({
		commandId: 'flutter.hotReload',
		icon: 'zap',
		rawColor: 'yellow'
	}, hotReloadPriority);

	restartDebugStatusBarItem = createStatusItem({
		commandId: 'workbench.action.debug.restart',
		icon: 'debug-restart',
		colorId: 'debugIcon.restartForeground'
	}, restartPriority);

	stopDebugStatusBarItem = createStatusItem({
		commandId: 'workbench.action.debug.stop',
		icon: 'debug-stop',
		colorId: 'debugIcon.stopForeground',
	}, stopPriority);
};

const updateIsOnDartEnvironment = (uri?: vscode.Uri) => {
	let newIsOnDartEnvironment = false;
	if (uri) {
		const pubspecUrl = join(uri.path, 'pubspec.yaml');
		newIsOnDartEnvironment =  existsSync(pubspecUrl);
	}

	if (newIsOnDartEnvironment !== isOnDartEnvironment) {
		isOnDartEnvironment = newIsOnDartEnvironment;
		updateStatusBar();
	}
};

const updateStatusBar = () => {
	if (currentDebugStatus === DebugStatus.notStarted || currentDebugStatus === DebugStatus.starting) {
		pauseDebugStatusBarItem.hide();
		hotReloadDebugStatusBarItem.hide();
		restartDebugStatusBarItem.hide();
		stopDebugStatusBarItem.hide();

		if (currentDebugStatus === DebugStatus.notStarted) {
			startingDebugStatusBarItem.hide();
			startDebugStatusBarItem.show();
		} else {
			startingDebugStatusBarItem.show();
			startDebugStatusBarItem.hide();
		}
		
		return;
	}

	startDebugStatusBarItem.hide();
	startingDebugStatusBarItem.hide();

	if (currentDebugStatus === DebugStatus.paused) {
		continueDebugStatusBarItem.show();
		pauseDebugStatusBarItem.hide();
	} else {
		continueDebugStatusBarItem.hide();
		pauseDebugStatusBarItem.show();
	}

	if (isOnDartEnvironment) {
		hotReloadDebugStatusBarItem.show();
	} else {
		hotReloadDebugStatusBarItem.hide();
	}
	
	restartDebugStatusBarItem.show();
	stopDebugStatusBarItem.show();
};
