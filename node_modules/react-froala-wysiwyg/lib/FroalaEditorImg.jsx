import FroalaEditorFunctionality from './FroalaEditorFunctionality.jsx';
import React from 'react';

export default class FroalaEditorImg extends FroalaEditorFunctionality {
  render () {
    return (
      <img ref={el => this.el = el}/>
    );
  }
}