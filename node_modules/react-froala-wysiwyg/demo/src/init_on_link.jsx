// Note that Froala Editor has to be required separately

import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.css';
import 'froala-editor/js/plugins.pkgd.min.js';


import FroalaEditorA from 'react-froala-wysiwyg/FroalaEditorA';
import React from 'react';
import ReactDOM from 'react-dom';

// Render Froala Editor component.
class EditorComponent extends React.Component {
  constructor() {
    super();

    this.state = {
      content: {
        href: 'https://www.froala.com/wysiwyg-editor'
      },
      initControls: null
    };

    this.handleModelChange = this.handleModelChange.bind(this);
  }

  handleModelChange (model) {
    this.setState({
      content: model
    });
  }

  render () {
    return(
      <div className="sample">
        <h2>Editor on 'a' tag.</h2>
        <div>
          <FroalaEditorA
            model={this.state.content}
            onModelChange={this.handleModelChange}
          >
           Froala
          </FroalaEditorA>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<EditorComponent/>, document.getElementById('editor'));

import "file-loader?name=[name].[ext]!./init_on_link.html";