/*
    wcSpinner.js
    an SVG loading spinner thing

    credit where credit is due, got the idea from here
    https://glennmccomb.com/articles/building-a-pure-css-animated-svg-spinner/
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';

class wcSpinner extends noiceAutonomousCustomElement {




static classID = wcSpinner;
static classAttributeDefaults = {
    run_animation: { observed: true, accessor: true, type: 'bool', value: true, forceAttribute: true },
    size: { observed: true, accessor: true, type: 'str', value: '1em', forceAttribute: true },
    color: { observed: true, accessor: true, type: 'str', value: '', forceAttribute: true, forceInit: true },
}
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });

static classStyleDefaults = {
    'size': { value: 'auto', global: true },
    'opacity-transition': { value: '.66s', global: true },
    'dash-array': { value: '283', global: true },
    'dash-offset': { value: '280', global: true },
    'min': { value: '75', global: true },
    'max': { value: '280', global: true },
    'rotate-duration': { value: '2s', global: true },
    'animate-duration': { value: '1.4s', global: true },
    'color': { value: 'red', global: true }
}




/*
    constructor
*/
constructor(args){
    super();
    this._className = 'wcSpinner';
    this._version = 1;
    this._initialized = false;
    this.cssVarPrefix = '--wc-spinner';

    this.attributeDefaults = JSON.parse(JSON.stringify(wcSpinner.classAttributeDefaults));
    this.initConstructorArgs(args);
    this.spawnAttributeAccessors();

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        size:  (name, oldValue, newValue, slf) => { slf.setSize(newValue); },
        color:  (name, oldValue, newValue, slf) => { slf.setColor(newValue); },
    };

}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(wcSpinner.classAttributeDefaults);
}
getStyleDefaults(){
    return(wcSpinner.classStyleDefaults);
}




/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;
    div.style.width = this.size;
    div.style.height = this.size;
    div.insertAdjacentHTML('afterbegin', `
        <svg data-_name="spinna" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle data-_name="circle" cx="50" cy="50" r="45"/>
        </svg>
    `);

    return(div);
}




/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: block;
    }
    div.${this._className} {
        position: relative;
    }
    :host([run_animation="true"]) svg {
        animation: ${this.styleVar('rotate-duration')} linear infinite svg-animation;
        opacity: 1;
    }
    svg {
        position: absolute;
        max-width: 100px;
        transition: opacity ${this.styleVar('opacity-transition')} ease-in;
        opacity: 0;
        width: ${this.styleVar('size')};
        height: ${this.styleVar('size')};
    }
    @keyframes svg-animation {
      0% {
        transform: rotateZ(0deg);
      }
      100% {
        transform: rotateZ(360deg)
      }
    }
    :host([run_animation="true"]) circle {
        animation: ${this.styleVar('animate-duration')} ease-in-out infinite both circle-animation;
    }
    circle {
      display: block;
      fill: transparent;
      stroke: ${this.styleVar('color')};
      stroke-linecap: round;
      stroke-dasharray: ${this.styleVar('dash-array')};
      stroke-dashoffset: ${this.styleVar('dash-offset')};
      stroke-width: 10px;
      transform-origin: 50% 50%;
    }
    @keyframes circle-animation {
      0%,
      25% {
        stroke-dashoffset: ${this.styleVar('max')};
        transform: rotate(0);
      }

      50%,
      75% {
        stroke-dashoffset: ${this.styleVar('min')};
        transform: rotate(45deg);
      }

      100% {
        stroke-dashoffset: ${this.styleVar('max')};
        transform: rotate(360deg);
      }
    }
`)}




/*
    setSize(str)
    override the css styleVar with an img style attribute
*/
setSize(str){ if (this._elements.spinna instanceof Element){
    if (this.isNull(str)){
        this._elements.spinna.style.removeProperty('width');
        this._elements.spinna.style.removeProperty('height');
    }else{
        this._elements.spinna.style.width = str;
        this._elements.spinna.style.height = str;
    }
}}




/*
    setColor(str)
    override the css styleVar with an img style attribute
*/
setColor(str){ if (this._elements.circle instanceof Element){
    if (this.isNull(str)){
        this._elements.circle.style.removeProperty('stroke');
    }else{
        this._elements.circle.style.stroke = str;
    }
}}




}
const _classRegistration = wcSpinner.registerElement('wc-spinner');
export { _classRegistration as wcSpinner };
