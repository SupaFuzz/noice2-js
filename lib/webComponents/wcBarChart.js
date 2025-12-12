/*
    wcBarChart.js
    12/11/25 Amy Hicox <amy@hicox.com>

    it's gonna be a bar chart
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';

class wcBarChart extends noiceAutonomousCustomElement {

static classID = wcBarChart;
static classAttributeDefaults = {
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    label: { observed: true, accessor: true, type: 'elementAttribute', value: '' },
    label_position: { observed: true, accessor: true, type: 'enum', value: 'none', values: ['top', 'bottom', 'none'], forceAttribute: true },
    chart_size: { observed: false, accessor: true, type: 'int', value: 200 },
    width: { observed: true, accessor: true, type: 'str', value: '25em', forceAttribute: true },
    height: { observed: true, accessor: true, type: 'str', value: '15.54em', forceAttribute: true },
}
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {
    'color': { value: 'hsl(233 6% 56.1%)', global: true },
    'stroke': { value: 'hsl(233 6% 37%)', global: true },
    'stroke-width': { value: '0', global: true },
    'background-color': { value: 'hsl(233 6% 13.6%)', global: true }
}




/*
    constructor
*/
constructor(args){
    super();
    this._className = 'wcBarChart';
    this._version = 1;
    this.cssVarPrefix = '--wc-bar-chart';

    this.attributeDefaults = JSON.parse(JSON.stringify(wcBarChart.classAttributeDefaults));
    this.initConstructorArgs(args);
    this.spawnAttributeAccessors();

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        width: (name, oldValue, newValue, slf) => {
            if (slf.isNull(newValue)){
                slf.style.removeProperty('width');
            }else{
                slf.style.width = `${newValue}`;
            }
        },
        height: (name, oldValue, newValue, slf) => {
            if (slf.isNull(newValue)){
                slf.style.removeProperty('height');
            }else{
                slf.style.height = `${newValue}`;
            }
        }
    };
}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way
*/
getAttributeDefaults(){
    return(wcBarChart.classAttributeDefaults);
}
getStyleDefaults(){
    return(wcBarChart.classStyleDefaults);
}




/*
    getHTMLContent()
*/
getHTMLContent(){


    // the container div
    let div = document.createElement('div');
    div.className = this._className;

    // the svg
    div.insertAdjacentHTML('afterbegin', `
        <svg viewBox="0 0 ${this.chart_size} ${this.chart_size/1.618}" width="99%" height="99%" xmlns="http://www.w3.org/2000/svg">
            <rect class="bar" x="0" y="${(this.chart_size/1.618) - ((this.chart_size/1.618)*.80)}" width="20" height="${(this.chart_size/1.618)*.80}"></rect>
        </svg>
    `);
    this.svgDOMObject = div.querySelector('svg');

    /*
        LOH 12/11/25 @ 2244
        this demonstrates how to do it.
        There's gonna be a lotta fun manually calculating margins and stuff
        but should be doable. 
    */

    return(div);
}




/*
    initializedCallback(slf)
    anything you need to do only once, but *after* everything is rendered
    and this.initialized is set.

    this is called from .initialize() and .setType() (sometimes)
*/
initializedCallback(){
    let that = this;
}



/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: block;
        position: relative;
        height: ${this.height};
        width: ${this.width};
        background-color: ${this.styleVar('background-color')};
    }
    :host([disabled="true"]){
        opacity: .5;
        filter: grayscale(.9);
    }
    rect.bar {
        fill: ${this.styleVar('color')};
    }
`)};



}
const _classRegistration = wcBarChart.registerElement('wc-bar-chart');
export { _classRegistration as wcBarChart };
