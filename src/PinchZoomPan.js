import React from 'react';
import PropTypes from 'prop-types';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SETTLE_RANGE = 0.001;
const ADDITIONAL_LIMIT = 0.2;
const DOUBLE_TAP_THRESHOLD = 300;
const ANIMATION_SPEED = 0.04;
const RESET_ANIMATION_SPEED = 0.08;
const INITIAL_X = 0;
const INITIAL_Y = 0;
const INITIAL_SCALE = 1;
const X_TOLERANCE = 15;
const Y_TOLERANCE = 15;
const SCALE_FACTOR = 0.03;

const settle = (val, target, range) => {
  const lowerRange = val > target - range && val < target;
  const upperRange = val < target + range && val > target;
  return lowerRange || upperRange ? target : val;
};

const inverse = (x) => x * -1;

const getPointFromTouch = (touch, element) => {
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

const getEventPosition = (e) => {
  const x = typeof e.clientX === 'undefined' ? e.changedTouches[0].clientX : e.clientX;
  const y = typeof e.clientY === 'undefined' ? e.changedTouches[0].clientY : e.clientY;
  return new Point(x, y);
}

class Point extends Array {
  //static get [Symbol.species]() { return Point; }
  get x() {
    return this[0];
  }
  //get x() => this[0];
  //get x() { return this[0]; }

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
    // if(!(s instanceof Number)) {
    if(isNaN(s)) {
      throw new TypeError("Points can only be multiplied by scalar numbers");
    }
    return this.map((val) => val * s);
  }

  divide(s) {
    if(isNaN(s)) {
      throw new TypeError("Points can only be divided by scalar numbers");
    }
    return this.map((val) => val / s);

  }

  // clone() {}

  // equals() {}

  // ...

}

class PinchZoomPan extends React.Component {
  constructor() {
    super(...arguments);
    this.state = this.getInititalState();


    // get autobind working
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);

  }

  zoomTo(scale, midpoint) {
    const frame = () => {
      if (this.state.scale === scale) return null;

      const distance = scale - this.state.scale;
      const targetScale = this.state.scale + (ANIMATION_SPEED * distance);

      this.zoom(settle(targetScale, scale, SETTLE_RANGE), midpoint);
      this.animation = requestAnimationFrame(frame);
    };

    this.animation = requestAnimationFrame(frame);
  }

  reset() {
    const frame = () => {
      if (this.state.scale === INITIAL_SCALE && this.state.x === INITIAL_X && this.state.y === INITIAL_Y) return null;
      const distance = INITIAL_SCALE - this.state.scale;
      const distanceX = INITIAL_X - this.state.x;
      const distanceY = INITIAL_Y - this.state.y;

      const targetScale = settle(this.state.scale + (RESET_ANIMATION_SPEED * distance), INITIAL_SCALE, SETTLE_RANGE);
      const targetX = settle(this.state.x + (RESET_ANIMATION_SPEED * distanceX), INITIAL_X, SETTLE_RANGE);
      const targetY = settle(this.state.y + (RESET_ANIMATION_SPEED * distanceY), INITIAL_Y, SETTLE_RANGE);

      const nextWidth = this.props.width * targetScale;
      const nextHeight = this.props.height * targetScale;

      this.setState({
        x: targetX,
        y: targetY,
        scale: targetScale,
        width: nextWidth,
        height: nextHeight,
        translate: new Point(targetX, targetY),
      }, () => {
        this.animation = requestAnimationFrame(frame);
      });
    };

    this.animation = requestAnimationFrame(frame);
  }

  getInititalState() {
    return {
      x: INITIAL_X,
      y: INITIAL_Y,
      scale: INITIAL_SCALE,
      width: this.props.width,
      height: this.props.height,
      translate: new Point(INITIAL_X, INITIAL_Y),
      dragging: false,
      dragged: false
    };
  }

  handleTouchStart(event) {
    this.animation && cancelAnimationFrame(this.animation);
    if (event.touches.length === 2) this.handlePinchStart(event);
    if (event.touches.length === 1) this.handleTapStart(event);
  }

  handleTouchMove(event) {
    if (event.touches.length === 2) this.handlePinchMove(event);
    if (event.touches.length === 1) this.handlePanMove(event);
  }

  handleTouchEnd(event) {
    if (event.touches.length > 0) return null;
    
    if (this.state.scale > MAX_SCALE) return this.zoomTo(MAX_SCALE, this.lastMidpoint);
    if (this.state.scale < MIN_SCALE) return this.zoomTo(MIN_SCALE, this.lastMidpoint);

    if (this.lastTouchEnd && this.lastTouchEnd + DOUBLE_TAP_THRESHOLD > event.timeStamp) {
      this.reset();
    }

    this.lastTouchEnd = event.timeStamp;
  }

  handleTapStart(event) {
    this.lastPanPoint = getPointFromTouch(event.touches[0], this.container);
  }

  handlePanMove(event) {
    if (this.state.scale === 1) return null;

    event.preventDefault();

    const point = getPointFromTouch(event.touches[0], this.container);
    const nextX = this.state.x + point.x - this.lastPanPoint.x;
    const nextY = this.state.y + point.y - this.lastPanPoint.y;

    this.setState({
      x: between(this.props.width - this.state.width, 0, nextX),
      y: between(this.props.height - this.state.height, 0, nextY),
    });
    
    this.lastPanPoint = point;
  }

  handlePinchStart(event) {
    const pointA = getPointFromTouch(event.touches[0], this.container);
    const pointB = getPointFromTouch(event.touches[1], this.container);
    this.lastDistance = getDistanceBetweenPoints(pointA, pointB);
  }

  handlePinchMove(event) {
    event.preventDefault();
    const pointA = getPointFromTouch(event.touches[0], this.container);
    const pointB = getPointFromTouch(event.touches[1], this.container);
    const distance = getDistanceBetweenPoints(pointA, pointB);
    const midpoint = getMidpoint(pointA, pointB);
    const scale = between(MIN_SCALE - ADDITIONAL_LIMIT, MAX_SCALE + ADDITIONAL_LIMIT, this.state.scale * (distance / this.lastDistance));

    this.zoom(scale, midpoint);

    this.lastMidpoint = midpoint;
    this.lastDistance = distance;
  }

  zoom(scale, midpoint) {
    const nextWidth = this.props.width * scale;
    const nextHeight = this.props.height * scale;
    const nextX = this.state.x + (inverse(midpoint.x * scale) * (nextWidth - this.state.width) / nextWidth);
    const nextY = this.state.y + (inverse(midpoint.y * scale) * (nextHeight - this.state.height) / nextHeight);

    this.setState({
      width: nextWidth,
      height: nextHeight,
      x: nextX,
      y: nextY,
      scale,
    });
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
          this.panM(
            current,
            this.state.last, 
            this.state.translate 
          )
        );
      }
  }

  panM(current, last, translate) {
    // Subtract the current Event Point from the last Event Point
    const delta = current.subtract(last);
    // Add the delta to the current Translation
    const next = translate.add(delta);
    // Return the current Event Point as the new last Event Point
    // and the next Translate Point as the new current Translate Point
    //console.log({current, last, translate, delta, next})
    return {
      last: current,
      translate: next,
      x: next.x,
      y: next.y,
    };
  }

  handleMouseUp(e) {
    this.setState({dragging: false, dragged: true}); 
    if(this.state.dragged) {
      // e.stopPropagation();
    } 
  }

  handleWheel(e) {
    const current = getEventPosition(e);
    //console.log(current);
    this.setState(
      this.zoomM(
        current,
        e.deltaY, // get rid of. Use SCALE_FACTOR instead
        this.state.translate,
        this.state.scale
      )
    )
  }

  zoomM(current, delta, translate, scale) {
    //const ratio = (1 - (scale - delta * SCALE_FACTOR) / scale);
    const nextScale = scale + (-delta) * SCALE_FACTOR;
    const ratio = (1 - nextScale / scale);

    const next = translate.add(
      current
      .subtract(translate)
      .multiply(ratio)
    );

    console.log({next, nextScale, scale, delta, SCALE_FACTOR, ratio});

    return {
      translate: next,
      scale: nextScale,
      x: next.x,
      y: next.y,
    }
  }

  render() {
    //console.log(this.state);
    return (
      <g 
        ref={(ref) => this.container = ref}
        onTouchStart={this.handleTouchStart}
        onTouchMove={this.handleTouchMove}
        onTouchEnd={this.handleTouchEnd}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onMouseUp={this.handleMouseUp}
        onWheel={this.handleWheel}

        style={{
          overflow: 'hidden',
          width: this.props.width,
          height: this.props.height,
        }}
      >
        {this.props.children(this.state.x, this.state.y, this.state.scale, this.state.dragging, this.state.dragged)} 
      </g>
    );
  }
}

PinchZoomPan.propTypes = {
  children: PropTypes.func.isRequired,
};

export default PinchZoomPan;
