require.config({ paths: { 'vs': '../node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {

	// Through the options literal, the behaviour of the editor can be easily customized.
	// Here are a few examples of config options that can be passed to the editor.
	// You can also call editor.updateOptions at any time to change the options.

	let typeContainer = document.getElementById("type-container");
	let btnRun = document.getElementById("btn-run");
	btnRun.onclick = submitCode;

	let defaultCode = [
		'<!DOCTYPE html>',
		'<html>',
		'<head>',
		'<meta charset="utf-8">',
		'<title>文档标题</title>',
		'</head>',
		'<body>',
		'	<h1>我的第一个HTML页面</h1>',
		'	<p>我的第一个段落。</p>',
		'</body>',
		'</html>'
	].join('\n');

	monaco.languages.html.htmlDefaults = true;

	let editor = monaco.editor.create(typeContainer, {
		value: defaultCode,
		language: "html",

		lineNumbers: "on",
		roundedSelection: false,
		scrollBeyondLastLine: false,
		readOnly: false,
		theme: "vs-dark",
	});

	// editor.updateOptions({
	// 	theme: "hc-black"
	// });

	// console.log(editor.getValue());
	console.log(btnRun.click);

	submitCode();

	function submitCode() {
		// console.log(editor.getValue());
		// if (editor) { editor.save(); }
		let text = editor.getValue();
		let ifr = document.createElement("iframe");
		ifr.setAttribute("frameborder", "0");
		ifr.setAttribute("id", "iframeResult");
		ifr.setAttribute("name", "iframeResult");
		ifr.setAttribute("width", "100%");
		ifr.setAttribute("height", "100%");
		document.getElementById("run-container").innerHTML = "";
		document.getElementById("run-container").appendChild(ifr);

		let ifrWindow = (ifr.contentWindow) ? ifr.contentWindow : (ifr.contentDocument.document) ? ifr.contentDocument.document : ifr.contentDocument;
		// console.log(ifr.setAttribute);
		ifrWindow.document.open();
		ifrWindow.document.write(text);
		ifrWindow.document.close();

	}

	window.addEventListener("resize",()=>{
		editor.updateOptions();
	});
});


