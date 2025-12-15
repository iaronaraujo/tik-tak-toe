import React from 'react'

export default function Square({ value, onClick }){
  return (
    <button aria-label={value ? `square-${value}` : 'square'} className="square" onClick={onClick}>
      {value}
    </button>
  );
}
