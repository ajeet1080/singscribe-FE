import FroalaEditorFunctionality from './FroalaEditorFunctionality.jsx';
import React from 'react';

export default class FroalaEditorButton extends FroalaEditorFunctionality {

  render () {
    return (
      <button ref={el => this.el = el}>{this.props.children}</button>
    );
  }
}