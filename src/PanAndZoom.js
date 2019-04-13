// Code taken directly from: https://blog.rapid7.com/2016/05/25/building-svg-maps-with-react/
// Code then modified with functions from: https://gist.github.com/iammerrick/c4bbac856222d65d3a11dad1c42bdcca
import React from 'react';
//import autobind from 'autobind-decorator'
import PropTypes from 'prop-types';

export default (ComposedComponent) => {
  const X_TOLERANCE = 15;
  const Y_TOLERANCE = 15;
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  const ADDITIONAL_LIMIT = 0.2;
  const SCALE_FACTOR = 0.03;


  const inverse = (x) => x * -1;

  const getPointFromTouch = (touch, element) => {
    //const rect = (element && element.getBoundingClientRect()) || {top:0, left:0}; 
    const rect = element.getBoundingClientRect(); 

    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const getMidpoint = (pointA, pointB) => ({
      x: (pointA.x + pointB.x) / 2,
      y: (pointA.y + pointB.y) / 2,
  });

  const getDistanceBetweenPoints = (pointA, pointB) => (
    Math.sqrt(Math.pow(pointA.y - pointB.y, 2) + Math.pow(pointA.x - pointB.x, 2))
  );

  const between = (min, max, value) => Math.min(max, Math.max(min, value));


function getEventPosition(e) {
  const x = typeof e.clientX === 'undefined' ? e.changedTouches[0].clientX : e.clientX;
  const y = typeof e.clientY === 'undefined' ? e.changedTouches[0].clientY : e.clientY;
  return new Point(x, y);
}

class Point extends Array {
  //static get [Symbol.species]() { return Point; }
  get x() {
    return this[0];
  }
  set x(x) {
    this[0] = x;
  }
  get y() {
    return this[1];
  }
  set y(y) {
    this[1] = y;
  }
  get z() {
    return this[2];
  }
  set z(z) {
    this[2] = z;
  }
  get w() {
    return this[3];
  }
  set w(w) {
    this[3] = w;
  }

  add(x, y, z, w) {
    if(x instanceof Point) {
      return this.map((val, i) => val + x[i]);
    } else {
      return this.map((val, i) => val + this.arguments[i]);
    }
  }

  subtract(x, y, z, w) {
    if(x instanceof Point) {
      return this.map((val, i) => val - x[i]);
    } else {
      return this.map((val, i) => val - this.arguments[i]);
    }
  }

  multiply(s) {
    if(!(s instanceof Number)) 
      throw new TypeError("Points can only be multiplied by scalar numbers");
    return this.map((val) => val * s);
  }

  // clone() {}

  // equals() {}

  // ...

}

// function addArray(array1, array2) {
//     return array1.map((val, i) => val + array2[i]);
// }

// function subtractArray(array1, array2) {
//     return array1.map((val, i) => val - array2[i]);
// }

class PanAndZoom extends React.Component {
  constructor(props) {
    super(props);
    this.setState({
      translate: new Point(0, 0),
      scale: 1
    });

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    //this.handleTouchStart = this.handleTouchStart.bind(this);
    //this.handleTouchMove = this.handleTouchMove.bind(this);
    //this.handleTouchEnd = this.handleTouchEnd.bind(this);      

    //this.pan = this.pan.bind(this);
    this.zoom = this.zoom.bind(this);
  }

  handleMouseDown(e) {
    // Find start position of drag based on touch/mouse coordinates.
    const start = getEventPosition(e);
    // Update state with above coordinates, and set dragging to true.
    // const state = {
    this.setState({
      start: start,
      init: start,
      last: start,
      dragging: true,
      dragged: false,
    });  
  }

  handleMouseMove(e) {
      // First check if the state is dragging, if not we can just return
      // so we do not move unless the user wants to move
      if (!this.state.dragging) {
        return;
      }

      const current = getEventPosition(e);

      if (
        this.state.dragged
        // This conditional should be moved to the handleTouchMove function 
        // (a mouse pointer doesn't usuallly need tolerance to differentiate 
        // between a click and a drag)
        || Math.abs(Math.max(...current.subtract(this.state.start))) > X_TOLERANCE 
      ) {
        this.setState(
          this.pan(
            current,
            this.state.last, 
            this.state.translate 
          )
        );
      }
  }

  pan(current, last, translate) {
    // Subtract the current Event Point from the last Event Point
    const delta = current.subtract(last);
    // Add the delta to the current Translation
    const next = translate.add(delta);
    // Return the current Event Point as the new last Event Point
    // and the next Translate Point as the new current Translate Point
    return {
      last: current,
      translate: next
    };
  }

  handleMouseUp(e) {
    this.setState({dragging: false, dragState: 'DRAGGED', dragged: true}); 
    if(this.state.dragged) {
      e.stopPropagation();
    } 
  }

  handleWheel(e) {
    const current = getEventPosition(e);

    this.setState(
      this.zoom(
        current,
        e.deltaY, // get rid of. Use SCALE_FACTOR instead
        this.state.translate,
        this.state.scale
      )
    )
  }

  zoom(current, delta, translate, scale) {
    //const ratio = (1 - (scale - delta * SCALE_FACTOR) / scale);
    const nextScale = scale + (-delta) * SCALE_FACTOR;
    const ratio = (1 - nextScale / scale);

    const next = translate.add(
      current
      .subtract(translate)
      .multiply(ratio)
    );

    return {
      translate: next,
      scale: nextScale,
    }
  }

  render() {
    console.log(this.props.children);
    if( this.props.children instanceof Function) {
      return (this.props.children({
        x: this.state.translate.x,
        y: this.state.translate.y,
        scale: this.state.scale,
        dragging: this.state.dragging,
        dragged: this.state.dragged,
        bind: {
        onMouseDownCapture: this.handleMouseDown,
        //onTouchStartCapture={this.handleTouchStart}
        onMouseMoveCapture: this.handleMouseMove,
        //onTouchMoveCapture={this.handleTouchMove}
        onMouseUpCapture: this.handleMouseUp,
        //onTouchEndCapture={this.handleTouchEnd}
        onWheelCapture: this.handleWheel
        }
      }))
    } else {

    return (
      <ComposedComponent
        x={this.state.x}
        y={this.state.y}
        scale={this.state.scale}
        dragState={this.state.dragState}
        onMouseDownCapture={this.handleMouseDown}
        //onTouchStartCapture={this.handleTouchStart}
        onMouseMoveCapture={this.handleMouseMove}
        //onTouchMoveCapture={this.handleTouchMove}
        onMouseUpCapture={this.handleMouseUp}
        //onTouchEndCapture={this.handleTouchEnd}
        onWheelCapture={this.handleWheel}
        pan={this.pan}
        zoom={this.zoom}
        style={{
          pointerEvents: this.state.scale ? 'auto' : 'none',
          transform: `translate3d(${this.state.translate.x}px, 
                                  ${this.state.translate.y}px, 0) 
                      scale(${this.state.scale})`,
          transformOrign: '0 0'}}
      ></ComposedComponent>
    );
    }
  }

}

PanAndZoom.propTypes = {
  children: PropTypes.func.isRequired,
};


return PanAndZoom;
}
