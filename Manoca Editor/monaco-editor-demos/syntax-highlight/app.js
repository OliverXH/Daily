require.config({ paths: { 'vs': '../node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], function () {

    // 初始化变量
    var fileCounter = 0;
    var editorArray = [];
    var defaultCode = [
        'function helloWorld() {',
        '   console.log("Hello world!");',
        '}'
    ].join('\n');

    // 定义编辑器主题
    monaco.editor.defineTheme('myTheme', {
        base: 'vs',
        inherit: true,
        rules: [{ background: 'EDF9FA' }],
        // colors: { 'editor.lineHighlightBackground': '#0000FF20' }
    });
    monaco.editor.setTheme('myTheme');

    // 新建一个编辑器
    function newEditor(container_id, code, language) {
        var model = monaco.editor.createModel(code, language);
        var editor = monaco.editor.create(document.getElementById(container_id), {
            model: model,
        });
        editorArray.push(editor);
        return editor;
    }

    // 新建一个 div
    function addNewEditor(code, language) {
        var new_container = document.createElement("DIV");
        new_container.id = "container-" + fileCounter.toString(10);
        new_container.className = "container";
        document.getElementById("root").appendChild(new_container);
        newEditor(new_container.id, code, language);
        fileCounter += 1;
    }

    addNewEditor(defaultCode, 'javascript');

    // 语法高亮
    var languageSelected = document.querySelector('.language');    
    languageSelected.onchange = function () {
        monaco.editor.setModelLanguage(window.monaco.editor.getModels()[0], languageSelected.value)
    }

});