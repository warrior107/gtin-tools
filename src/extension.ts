'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "gtin-tools" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.convertToGtin', () => {
        // The code you place here will be executed every time your command is executed

        //get opened editor
        var editor = vscode.window.activeTextEditor;

        // if an editor is not opened
        if (!editor) {
            vscode.window.showWarningMessage('No open editor.');
            return;
        }

        var selections = editor.selections
        var editStores = [];

        for (let i = 0; i < selections.length; i++) {
            const selection = selections[i];

            if (selection.isEmpty) {
                return;
            }

            var start = selection.start;
            var end = selection.end;

            var range = new vscode.Range(start, end);

            var upcString = editor.document.getText(range);
            var gtin = createGtins(upcString);

            if (gtin == null) {
                vscode.window.showWarningMessage('Invalid text select. Please select a valid UPC number.');
                return;
            }

            editStores[i] = new EditStore(range, start, gtin);
        }

        editor.edit(editorEdit => {

            for (let i = 0; i < editStores.length; i++) {
                const editStore = editStores[i];
                editorEdit.delete(editStore.range);
                editorEdit.insert(editStore.start, editStore.gtin);
            }
        });
    });

    context.subscriptions.push(disposable);
}

function createGtins(upcString:string) {
    
    var upcs = upcString.split('\n');
    var gtins = [];

    for (let i = 0; i < upcs.length; i++) {
        gtins[i] = convertToGtin(upcs[i]);
    }

    return gtins.join('\n');
}

function convertToGtin(upc: string) {

    upc = upc.trim();

    if(upc.length == 0){
        return upc;
    }

    if(upc.length == 14){
        return upc;
    }

    if (testString(upc)) {
        upc = "0000000000000" + upc;
        upc = upc.substring(upc.length - 13);

        var even = 0;
        var odd = 0;

        for (let i = 0; i < upc.length; i++) {

            if (i % 2 == 0) {
                odd = odd + parseInt(upc[i]);
            }
            else {
                even = even + parseInt(upc[i]);
            }
        }

        var cd = ((odd * 3) + even) % 10;

        if (cd != 0) {
            cd = 10 - cd
        }

        return upc + cd;
    }
    else {
        return upc;
    }
}

function testString(upc: string) {
    var numRegex = new RegExp("^([0-9]*)$");
    return numRegex.test(upc);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

export class EditStore {

    readonly range: vscode.Range;
    readonly start: vscode.Position;
    readonly gtin: string;

    constructor(range: vscode.Range, start: vscode.Position, gtin: string) {
        this.range = range;
        this.start = start;
        this.gtin = gtin;
    }
}
