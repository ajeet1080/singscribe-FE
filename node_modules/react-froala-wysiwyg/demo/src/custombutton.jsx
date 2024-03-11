import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.css';
import 'file-loader?name=[name].[ext]!./custombutton.html';

import FroalaEditor from 'react-froala-wysiwyg';
import React from 'react';
import ReactDOM from 'react-dom';
import Froalaeditor from 'froala-editor';
Froalaeditor.DefineIcon('alert', {NAME: 'info', SVG_KEY: 'help'});
  Froalaeditor.RegisterCommand('alert', {
    title: 'Hello',
    focus: false,
    undo: false,
    refreshAfterCallback: false,
    callback: function () {
      alert('Hello!');
    }
  });

  Froalaeditor.DefineIcon('clear', {NAME: 'remove', SVG_KEY: 'remove'});
  Froalaeditor.RegisterCommand('clear', {
    title: 'Clear HTML',
    focus: false,
    undo: true,
    refreshAfterCallback: true,
    callback: function () {
      this.html.set('');
      this.events.focus();
    }
  });

  Froalaeditor.DefineIcon('insert', {NAME: 'plus', SVG_KEY: 'add'});
  Froalaeditor.RegisterCommand('insert', {
    title: 'Insert HTML',
    focus: true,
    undo: true,
    refreshAfterCallback: true,
    callback: function () {
      this.html.insert('My New HTML');
    }
  });

// Render Froala Editor component.
ReactDOM.render(<FroalaEditor tag='textarea' config={{pluginsEnabled:['align', 'link'], language: 'ro', toolbarButtons: [['undo', 'redo' , 'bold'], ['alert', 'clear', 'insert']]}} />, document.getElementById('editor'));