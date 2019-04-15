// Code taken directly from: https://blog.rapid7.com/2016/05/25/building-svg-maps-with-react/
// Code then modified with functions from: https://gist.github.com/iammerrick/c4bbac856222d65d3a11dad1c42bdcca
import React from 'react';
//import autobind from 'autobind-decorator'

export default (ComposedComponent) => {
  const X_TOLERANCE = 15;
  const Y_TOLERANCE = 15;
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  const ADDITIONAL_LIMIT = 0.2;



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


  //@autobind
  class SvgMap extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        matrix: [1, 0, 0, 1, 0, 0],
        dragging: false,
        dragged: false,
        x: 0,
        y: 0,
        scale: 1,
        width: this.props.width,
        height: this.props.height
      };

      this.onDragStart = this.onDragStart.bind(this);
      this.onDragMove = this.onDragMove.bind(this);
      this.onDragEnd = this.onDragEnd.bind(this);
      this.onWheel = this.onWheel.bind(this);
      this.pan = this.pan.bind(this);
      this.zoom = this.zoom.bind(this);
      this.handleTouchStart = this.handleTouchStart.bind(this);
      this.handleTouchMove = this.handleTouchMove.bind(this);
      this.handleTouchEnd = this.handleTouchEnd.bind(this);      
    }
  
    onDragStart(e) {
      // Find start position of drag based on touch/mouse coordinates.
      const startX = typeof e.clientX === 'undefined' ? e.changedTouches[0].clientX : e.clientX;
      const startY = typeof e.clientY === 'undefined' ? e.changedTouches[0].clientY : e.clientY;
  
      // Update state with above coordinates, and set dragging to true.
      const state = {
        dragging: true,
        dragged: false,
        startX,
        startY,
        initX: startX,
        initY: startY,
        // x: startX,
        // y: startY,
        x: 0,
        y: 0,
        scale: 1,
      };
  
      this.setState(state);
      e.props = {};
      e.persist();
      e.props.dragging = true;
      e.props.dragged = false;

      //e.stopPropagation();

    }
  
    onDragMove(e) {
      // First check if the state is dragging, if not we can just return
      // so we do not move unless the user wants to move
      if (!this.state.dragging) {
        return;
      }

      // Test to see if the movement (dx) is greater than the treshold
      e.persist();
      e.props = {};
      e.props.dragging = true;

        //e.stopPropagation();
  
      // Get the new x coordinates
      const x = typeof e.clientX === 'undefined' ? e.changedTouches[0].clientX : e.clientX;
      const y = typeof e.clientY === 'undefined' ? e.changedTouches[0].clientY : e.clientY;
  
      // Take the delta where we are minus where we came from.
      const dx = x - this.state.startX;
      const dy = y - this.state.startY;
  
      const ix = x - this.state.initX;
      const iy = y - this.state.initY;


      let dragged = false;

      // Once the 
      if(this.state.dragged === true || (Math.abs(ix) > X_TOLERANCE || Math.abs(iy) > Y_TOLERANCE)) {
        console.log(dx, dy);
        dragged = true;
        // Pan using the deltas
        this.pan(dx, dy);
        

      }

      // Update the state
      this.setState({
        startX: x,
        startY: y,
        //x,
        //y,
        x: this.state.x + dx,
        y: this.state.y + dy,

        dragged: dragged         
      });
    }
  
    onDragEnd(e) {
      this.setState({ dragging: false});
      e.persist();
       e.props = {};
      e.props.dragging = false;
      //e.props.dragged = true;

      //e.stopPropagation();

    }
  

    handleTouchStart(e) {
      if (e.touches.length === 2) this.handlePinchStart(e);
      if (e.touches.length === 1) this.onDragStart(e);      

    }

    handleTouchMove(e) {
      if (e.touches.length === 2) this.handlePinchMove(e);
      if (e.touches.length === 1) this.onDragMove(e);
    }

    handleTouchEnd(e) {
      if (e.touches.length > 0) return null;
      this.lastTouchEnd = e.timeStamp;
    }

    handlePinchStart(e) {
      const pointA = getPointFromTouch(e.touches[0], this.container);
      const pointB = getPointFromTouch(e.touches[1], this.container);
      this.lastDistance = getDistanceBetweenPoints(pointA, pointB);
    }

    handlePinchMove(e) {
      e.preventDefault();
      const pointA = getPointFromTouch(e.touches[0], this.container);
      const pointB = getPointFromTouch(e.touches[1], this.container);
      const distance = getDistanceBetweenPoints(pointA, pointB);
      const midpoint = getMidpoint(pointA, pointB);
      const scale = between(MIN_SCALE - ADDITIONAL_LIMIT, MAX_SCALE + ADDITIONAL_LIMIT, this.state.scale * (distance / this.lastDistance));

      this.zoom(scale, midpoint);

      this.lastMidpoint = midpoint;
      this.lastDistance = distance;      
    }

    handlePinchEnd(e) {

    }


    onWheel(e) {
      const rect = this.container.getBoundingClientRect();
//      const center = {x: e.clientX - rect.left, y: e.clientY - rect.top};

//       if (e.deltaY < 0) {
//         this.zoom(this.state.scale + (-deltaY/3) * factor;
// , center);
//       } else {
//         this.zoom(this.state.scale - 0.05, center);
//       }

      this.wheelZoom(e.deltaY, {x: e.clientX, y: e.clientY});

    }
  
    pan(dx, dy) {
      // const m = this.state.matrix;
      // m[4] += dx;
      // m[5] += dy;
      // this.setState({ matrix: m });

      //this.setState({x: this.state.x + dx, y: this.state.y + dy})
    }
  
    pinchZoom(scale, midpoint) {

    }

    wheelZoom(deltaY, midpoint) {
      const factor = 0.1
      let scale = this.state.scale + (-deltaY/3) * factor;
      const ratio = (1 - scale / this.state.scale);

      let nextX = this.state.x;
      let nextY = this.state.y;

      nextX += (midpoint.x - this.state.x) * ratio;
      nextY += (midpoint.y - this.state.y) * ratio;

      this.setState({
        x: nextX,
        y: nextY,
        scale: scale,
      })

    }

    zoom(scale, midpoint) {
      console.log(this.state);
      const m = this.state.matrix;
      const len = m.length;
      for (let i = 0; i < len; i++) {
        m[i] *= scale;
      }

      //const nextWidth = this.props.width * scale;
      //const nextHeight = this.props.height * scale;
      const nextWidth = this.state.width * scale;
      const nextHeight = this.state.height * scale;

      const nextX = this.state.x + (inverse(midpoint.x * scale) * (nextWidth - this.state.width) / nextWidth);
      const nextY = this.state.y + (inverse(midpoint.y * scale) * (nextHeight - this.state.height) / nextHeight);      


      m[4] += (1 - scale) * this.props.width / 2;
      m[5] += (1 - scale) * this.props.height / 2;

      m[4] = nextX;
      m[5] = nextY;

      this.setState({ 
        matrix: m,
        width: nextWidth,
        height: nextHeight,
        x: nextX,
        y: nextY,
        scale: scale,
       });
    } 
  
    render() {
      const { height, width, className, id, ...other} = this.props;
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          height={height}
          width={width}
          className={className}
          id={id}
          ref={(ref) => this.container = ref}          
          onMouseDownCapture={this.onDragStart}
          onTouchStartCapture={this.handleTouchStart}
          onMouseMoveCapture={this.onDragMove}
          onTouchMoveCapture={this.handleTouchMove}
          onMouseUpCapture={this.onDragEnd}
          onTouchEndCapture={this.handleTouchEnd}
          onWheelCapture={this.onWheel}>
          {/*<g transform={`matrix(${this.state.matrix.join(' ')})`}>*/}
          <g style={{
            pointerEvents: this.state.scale ? 'auto' : 'none',
            transform: `translate3d(${this.state.x}px, ${this.state.y}px, 0) scale(${this.state.scale})`,
            transformOrigin: '0 0' //transformOrign: top left
          }}>

            <ComposedComponent
              {...other}
              pan={this.pan}
              zoom={this.zoom}
              dragging={this.state.dragging}
              dragged={this.state.dragged}
            ></ComposedComponent>
          </g>
        </svg>
      );
    }
  }
  
  // SvgMap.propTypes = {
  //   settings: {
  //     width: React.PropTypes.number.isRequired,
  //     height: React.PropTypes.number.isRequired,
  //   }
  // };
  
  return SvgMap;
}


//function useTouchEvents(component) {
/*function useTouchEvents(event) {



  //return {x:x, y:y, dragging:dragging}
}

function useSvgMap(component) {

  //return {this.pan, this.zoom, this.dragging, this.x, this.y, this.transform, this.bind}
}
*/