import React, { Component } from 'react';
import SvgMap from './SvgMap';
import './Game.css';

// https://www.redblobgames.com/grids/hexagons/
function Hex(props) {
    // Hex positioning parameters
    // https://www.redblobgames.com/grids/hexagons/#coordinates-axial
    const {q,r} = props.position;
    // Board settings parameters
    const orientType = props.settings.orientType,
          orient = orientType === "point-top" ? 0.5 : 0,
          offset = props.settings.origin,
          size = props.settings.hexSize;
    // Id parameters
    const pathId = "q" + q + "r" + r;
    // Board display parameters
    const displayTypes = props.settings.display.types,
          displayValues = props.settings.display.values;
    // Hex entities parameters
    const hexTypes = props.entities.types,
          hexValues = props.entities.values,
          displayClasses = hexTypes
                            .filter(type => displayTypes.includes(type))
                            .concat(hexValues
                                .filter(value => displayValues.includes(value))
                            ).join(" ");

    // Find x,y center of Hex
    let center = {};
    if(orientType === "point-top") {
        center.x = (size * Math.sqrt(3) * (q + r/2)) + offset.x; // 
        center.y = (size * 3/2 * r) + offset.y;
    } else {
        center.x = (size * 3/2 * q) + offset.x;
        center.y = (size * Math.sqrt(3) * (r + q/2)) + offset.y;
    }

    // Construct x,y SVG path based on x,y center, q,r coord, hex size, orient
    let path = "";
    for(let i = 0; i < 7; i++) {
        // If this is the first point in the path, move drawing cursor (i.e.
        // pick the pen up off the paper and move) to that point
        if( i % 7 === 0) { 
            path += "M";
        // Otherwise, draw a line from the cursor's last point to the new point
        } else {
            path += "L";
        }

        // Angle from starting point to the `i`th corner of the hexagon
        let angle = 2 * Math.PI / 6 * (i + orient); 

        // Scale and offset x,y components of the corners angle by center point
        // and hex size
        path += center.x + size * Math.cos(angle) + ","
        path += center.y + size * Math.sin(angle);
    }


    return (
        <path 
            id={pathId}
            className={displayClasses}
            d={path}
            onClick={props.onClick}
        />
    );
}

class Board extends Component {

    renderHex(hex, settings) {
        return (
            <Hex
                key={"q" + hex.coord.q + "r" + hex.coord.r}
                position={hex.coord}
                settings={settings}
                entities={hex.entities}
                onClick={() => this.props.onClick(hex, this.props.dragging)}
            />
        )
    }

    render() {
        //const hexes = this.props.history[this.props.turn].hexes.map(
        const hexes = this.props.hexes.map(
            hexRow => hexRow.map(
                hex => this.renderHex(hex, this.props.settings)
            )
        );

        return (
            <g 
                id="board" 
                className="board" 
            >
                {hexes}
            </g>
        )
    }
}

/**
 * Class for game.
 *
 * @class      Game (name)
 */
class Game extends Component {
    constructor(props) {
        super(props);

        let defaultSettings = (props && props.settings) ? props.settings : {};        
        let settings = {
            orientType: defaultSettings.orientType || "point-top",
            hexSize: defaultSettings.hexSize || 30,
            width: defaultSettings.width || 11,
            height: defaultSettings.height || 11,
            origin: defaultSettings.origin || {x: 75, y: 75},     
            display: defaultSettings.display || {
                types: ["goal", "hex", "red", "blue"],
                values: ["red", "blue", "locked", "neighbor", "checked"]
            },
        }

        this.state = {
            settings: settings,
            hexes: makeBoard(settings.height, settings.width),
            redIsNext: true,
            turn: 0,
        };

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(currentHex, dragging) {
        // If the hex has already been selected do nothing.
        console.log(dragging);
        if(currentHex.entities.values.includes("locked") || dragging) {
            return;
        }
        // get the current player
        let player = this.state.redIsNext ? "red" : "blue",
            hexes = this.state.hexes;

        // add "locked" and current player color values to the selected hex
        // Should this be setState?
        this.setState({
            hexes: hexes.map((hexRow, q) => hexRow.map((hex, r) => {
                let entities = hex.entities;
                let values = entities.values;
                if(hex === currentHex) {
                     entities.values = values.concat(["locked", player])
                }
                return hex;
            })),
        });

        let victory = false;
        // filter for all hexes that have the "start" type for the 
        // appropriate player
        let startHexes = hexes.flat().filter(hex => {
            return (
                includesAll(
                    hex.entities.types, 
                    ["start", player]
                )
            )
        });
        for(let startHex of startHexes) {
            // Clear all checked values each time startHex iterates
            this.setState({
                hexes: hexes.map(hexRow => hexRow.map(hex => {
                    hex.entities.values = 
                      hex.entities.values.filter(value => value !== "checked");
                    return hex;
                }))
            });
            // check if there is a path from the current startHex to any endHex
            victory = checkVictory(startHex, player, this.state.hexes);
            // if a path was found we don't need to check for more paths
            if(victory) break;
        }

        // If a path was found notify the player
        if(victory) {
            alert(player + " won!");
        }

        // set the current player to the next player
        this.setState({
            turn: this.state.turn + 1,
            redIsNext: !this.state.redIsNext
        });
    }

    render() {
        return (
            <svg 
                width={943 /*document.body.clientWidth*/}
                height={622 /*document.documentElement.clientHeight - 39*/}
                id="playArea"
                className="playArea" 
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
                onContextMenu={() => false}
            >
                <Board 
                    settings={this.state.settings}
                    hexes={this.state.hexes}
                    onClick={this.handleClick}
                    dragging={this.props.dragging}
                />
            </svg>

        )
    }
}


//
// Utility function: return true is all elements in array2 are in array1
//
// @param      {Array}   array1  The array 1
// @param      {<type>}  array2  The array 2
// @return     {<type>}  { description_of_the_return_value }
//
function includesAll(array1, array2) {
    return array2.every(val => array1.includes(val));
}


//
// Initialize a new hex board for the given height and width
//
// @param      {number}  height  The height
// @param      {number}  width   The width
// @return     {Array}   The initialized hex board
//
function makeBoard(height, width) {
    // Create a 2-D array to store the hexes
    let hexes = Array(height).fill(
                    Array(width).fill(null)
                );
    // Build and return the initial hex board position
    return hexes.map((hexRow, q)  => {
        return hexRow.map((hex, r) => {
            hex = {};
            // Coordinate system:
            // https://www.redblobgames.com/grids/hexagons/#coordinates-axial
            hex.coord = {"q": q, "r": r};
            // 'types' represent an inherent property of the hex cell,
            // 'values' repesent an entity that is later assigned to the cell
            // by a player.
            hex.entities = {"types":["hex"], "values":[]};
            let types = hex.entities.types;
            // If the current hex is on the left or right side of the board
            if(q === 0 || q === height - 1) {
                // mark it a goal hex for red player
                types.push("red");
                types.push("goal");
                // If it is on the left, mark it as a start goal
                if(q === 0) types.push("start");
                // Otherwise mark it as an end goal
                else types.push("end");
            };
            // If the current hex is on the top or bottom side of the board
            if(r === 0 || r === width - 1) {
                // mark it as a goal hex for blue player
                types.push("blue")
                types.push("goal");
                // If it is on the top, mark it as a start goal
                if(r === 0) types.push("start");
                // Otherwise mark it as an end goal
                else types.push("end");
            };
            // Which side has the start and end goals is arbitrary, 
            // but necessary for the checkVictory search to work.

            return hex;
        })
    });
}

//
// Recursive depth first search of the current hex's neighbors
//
// @param      {Array}              hex     The hex board
// @param      {string}             player  The player
// @param      {Array}              hexes   The hexes
// @return     {boolean}            Has the player won
//
function checkVictory(hex, player, hexes) {
    let victory = false,
        values = hex.entities.values,
        types = hex.entities.types;

    // If the current hex exist, has been selected by the current player.
    // and has not already been checked for a path
    if(
        hex 
        && values.some(val => val === player)
        && !values.find(val => val === "checked")
    ) {
        // Mark the current hex as checked
        values.push("checked");
        // If the current hex has the current player's end type (which 
        // should only exist on goal types), we do not need to check any 
        // more hexes and can declare victory
        if(includesAll(types, [player, "end"])) {
            return victory = true;
        // Otherwise, we will run checkVictory on all the neighboring hexes
        // until we find an end goal hex or have checked all hexes that are 
        // connected to one of the starting goal hexes
        } else {
            for (let neighbor of getHexNeighbors(hex, hexes)) {
                victory = checkVictory(neighbor, player, hexes); 
                if(victory === true) break; 
            }                   
        }
    }

    return victory;
}

//
// Return an array of the 6 (or less) neighboring hexes of the passed in hex
//
// @param      {Object}  centerHex  The center hex
// @param      {Array}   hexes      The hexes
// @return     {Array}   The hex's neighbors.
//
function getHexNeighbors(centerHex, hexes) {
    // Array of neighbor q,r coordinates
    let directions = [
       [+1,  0], [+1, -1], [0, -1],
       [-1,  0], [-1, +1], [0, +1]
    ]

    // find (6) neighbor hexes
    // https://www.redblobgames.com/grids/hexagons/#neighbors-axial
    let neighbors = hexes.flat().filter(hex => {
        for(let i = 0; i < 6; i++) {
            let d = directions[i];
            if (
                hex.coord.q === centerHex.coord.q + d[0]
                && hex.coord.r === centerHex.coord.r + d[1]
            ) {
                return true;
            }
        }
        return false;
    });

    return neighbors;       
}


export default SvgMap(Game);