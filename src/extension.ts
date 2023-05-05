
import * as vscode from 'vscode';

const basePriority = 20; //10000000;

interface Option {
	commandId: string
	icon: string
	colorId?: string,
	rawColor?: string
	text?: string
}

let startDebugStatusBarItem: vscode.StatusBarItem;
let pauseDebugStatusBarItem: vscode.StatusBarItem;
let restartDebugStatusBarItem: vscode.StatusBarItem;
let hotReloadDebugStatusBarItem: vscode.StatusBarItem;
let stopDebugStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
	createStatusBarItems(context);
	
	showDebugNotActiveStatusItems();

	context.subscriptions.push(vscode.debug.onDidStartDebugSession(showDebugActiveStatusItems));
	context.subscriptions.push(vscode.debug.onDidTerminateDebugSession(showDebugNotActiveStatusItems));
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
	}, basePriority);

	pauseDebugStatusBarItem = createStatusItem({
		commandId: 'workbench.action.debug.pause',
		icon: 'debug-pause',
		colorId: 'debugIcon.pauseForeground'
	}, basePriority);

	hotReloadDebugStatusBarItem = createStatusItem({
		commandId: 'flutter.hotReload',
		icon: 'zap',
		rawColor: 'yellow'
	}, basePriority - 1);

	restartDebugStatusBarItem = createStatusItem({
		commandId: 'workbench.action.debug.restart',
		icon: 'debug-restart',
		colorId: 'debugIcon.restartForeground'
	}, basePriority - 2);

	stopDebugStatusBarItem = createStatusItem({
		commandId: 'workbench.action.debug.stop',
		icon: 'debug-stop',
		colorId: 'debugIcon.stopForeground',
	}, basePriority - 3);
};

const showDebugActiveStatusItems = () => {
	startDebugStatusBarItem.hide();

	pauseDebugStatusBarItem.show();
	hotReloadDebugStatusBarItem.show();
	restartDebugStatusBarItem.show();
	stopDebugStatusBarItem.show();
};

const showDebugNotActiveStatusItems = () => {
	pauseDebugStatusBarItem.hide();
	hotReloadDebugStatusBarItem.hide();
	restartDebugStatusBarItem.hide();
	stopDebugStatusBarItem.hide();

	startDebugStatusBarItem.show();
};
