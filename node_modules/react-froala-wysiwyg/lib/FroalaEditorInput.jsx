import FroalaEditorFunctionality from './FroalaEditorFunctionality.jsx';
import React from 'react';

export default class FroalaEditorInput extends FroalaEditorFunctionality {

  render () {
    return (
      <input ref={el => this.el = el}/>
    );
  }
}