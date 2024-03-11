// Note that Froala Editor has to be required separately.

import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.css';
import 'file-loader?name=[name].[ext]!./basic.html';

import FroalaEditor from 'react-froala-wysiwyg';
import React from 'react';
import ReactDOM from 'react-dom';

// Render Froala Editor component.
ReactDOM.render(<FroalaEditor tag='textarea' config={{
  pluginsEnabled: ['align', 'link'],
  language: 'ro',
  events: {
    initialized: function (e) {
      var editor = this;
      console.log('@@@@@@initialized', editor, e);
    }
  }
}} />, document.getElementById('editor'));

