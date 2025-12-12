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
    height: { observed: true, accessor: true, type: 'str', value: '15.45em', forceAttribute: true },
    max_bar_width: { observed: false, accessor: true, type: 'float', value: 20 },
    bar_radius_ratio: { observed: false, accessor: true, type: 'float', value: 4 },
    bar_radius: { observed: true, accessor: true, type: 'bool', value: true },
}
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {
    'color': { value: 'hsl(233 6% 56.1%)', global: true },
    'stroke': { value: 'hsl(233 6% 37%)', global: true },
    'stroke-width': { value: '0', global: true },
    'background-color': { value: 'hsl(233 6% 13.6%)', global: true },
}




/*
    constructor
*/
constructor(args){
    super();
    this._className = 'wcBarChart';
    this._version = 1;
    this.cssVarPrefix = '--wc-bar-chart';
    this._bars = [];
    this._aspectRatio = null;

    this.attributeDefaults = JSON.parse(JSON.stringify(wcBarChart.classAttributeDefaults));
    this.initConstructorArgs(args);
    this.spawnAttributeAccessors();

    // attributeChangeHandlers
    let that = this;
    this.attributeChangeHandlers = {
        width: (name, oldValue, newValue, slf) => {
            if (slf.isNull(newValue)){
                slf.style.removeProperty('width');
            }else{
                // default units are px if not specified
                slf.style.width = `${newValue}${/^\d+$/.test(newValue)?'px':''}`;
            }
            that.setAspectRatio();
        },
        height: (name, oldValue, newValue, slf) => {
            if (slf.isNull(newValue)){
                slf.style.removeProperty('height');
            }else{
                // default units are px if not specified
                slf.style.height = `${newValue}${/^\d+$/.test(newValue)?'px':''}`;
            }
            that.setAspectRatio();
        },
        bar_radius_ratio: (name, oldValue, newValue, slf) => { slf.renderBars(); },
        bar_radius: (name, oldValue, newValue, slf) => { slf.renderBars(); }
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
    setAspectRatio()
*/
setAspectRatio(){
    let that = this;
    return(new Promise((t) => {
        requestAnimationFrame(() => {
            let w = parseFloat(that.width);
            let h = parseFloat(that.height);
            if ((! isNaN(w)) && (! isNaN(h)) && (h > 0)){
                that._aspectRatio = (w / h);
            }else{
                that._aspectRatio = null;
            }
            t(that._aspectRatio);
        });
    }));
}



/*
    getHTMLContent()
*/
getHTMLContent(){

    // the container div
    let div = document.createElement('div');
    div.className = this._className;
    return(div);
}




/*
    spawnSVG()
    this can't happen inside getHTMLContent for reasons of the
    _aspectRatio needing to set asynchronously.

    this gets called from initializedCallback() but probably also
    every time width or height gets changed
*/
spawnSVG(){
    let that = this;
    return(new Promise((toot, boot) => {
        if ((that.initialized) && (that.DOMElement instanceof Element)){
            if (that.svgDOMObject instanceof Element){ that.svgDOMObject.remove(); }
            this.setAspectRatio().then((aspectRatio) => {
                that.DOMElement.insertAdjacentHTML('afterbegin', `<svg id="barchart" viewBox="0 0 ${that.chart_size} ${that.chart_size/aspectRatio}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" data-maxy="${that.chart_size/aspectRatio}" data-maxx="${that.chart_size}"></svg>`);
                that.svgDOMObject = that.DOMElement.querySelector('#barchart');
                that.renderBars();
                toot(that.svgDOMObject);
            }).catch((error) => {
                that.log(`spawnSVG() | setAspectRatio() threw unexpectedly: ${error}`);
                toot(false);
            });
        }else{
            toot(false);
        }
    }));
}



/*
    renderBars()
    "it's where the magic happens!"
*/
renderBars(){
    let that = this;

    // remove any existing ones
    that.svgDOMObject.querySelectorAll('rect.bar').forEach((el) => { el.remove(); });

    let queue = that._bars.filter((b) => {return(
        (b instanceof Object) &&
        b.hasOwnProperty('name') &&
        that.isNotNull(b.name) &&
        b.hasOwnProperty('value') &&
        (! isNaN(parseFloat(b.value))) &&
        b.hasOwnProperty('order') &&
        (! isNaN(parseFloat(b.order)))
    )}).sort((a,b) => {return(
        parseFloat(a.order) - parseFloat(b.order)
    )});
    if (queue.length > 0){

        // calculate width & gap
        let maxy = parseFloat(that.svgDOMObject.dataset.maxy);
        let maxx = parseFloat(that.svgDOMObject.dataset.maxx);
        let gap_width = 0;
        let bar_width = 0;
        if ((queue.length * that.max_bar_width) < maxx){
            // centered
            gap_width = ((maxx - (queue.length * that.max_bar_width))/(queue.length + 1));
            bar_width = that.max_bar_width;
        }else{
            // squashed
            let e2e = (maxx/queue.length);
            gap_width = (e2e/8);
            bar_width = ((maxx - (gap_width * (queue.length + 1)))/queue.length);
        }
        queue.map((b, idx) => {
            let bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.classList.add("bar");
            ['value', 'name', 'order'].forEach((a) => { bar.dataset[a] = b[a]; });
            ['color', 'stroke', 'stroke-width'].filter((a) => {return(b.hasOwnProperty(a))}).forEach((a) => { bar.setAttribute(a, b[a]); });
            let height = (Math.abs(b.value) <= 100)?maxy*(Math.abs(b.value)/100):maxy;
            bar.setAttribute('height', height);
            bar.setAttribute('width', bar_width);
            bar.setAttribute('y', (maxy - height));
            bar.setAttribute('x', gap_width + ((bar_width + gap_width)*idx));
            if (that.bar_radius){
                ['rx','ry'].forEach((a) => { bar.setAttribute(a, (bar_width/that.bar_radius_ratio)); });
            }
            return(bar);
        }).forEach((el) => {
            that.svgDOMObject.appendChild(el);
        });
    }
}




/*
    addBar({
        name: <unique_string>,
        value: <percent, float 0 - 100>,
        color: <css color value> (optional, if not specified uses --wc-bar-chart-color)
        stroke: <css color value> (optional, if not specified uses --wc-bar-chart-stroke)
        stroke-width: <css width value> (optional, if not specified uses --wc-bar-chart-stroke-width)
        order: <int> (optional, if not specified, auto-generated)
    })
*/
addBar(args){
    if (
        (args instanceof Object) &&
        args.hasOwnProperty('name') &&
        this.isNotNull(args.name) &&
        args.hasOwnProperty('value') &&
        (! isNaN(parseFloat(args.value)))
    ){
        let chk = this._bars.filter((a) => {return(
            (a instanceof Object) &&
            a.hasOwnProperty('name') &&
            (a.name == args.name)
        )});
        if (chk.length == 0){
            this._bars.push(args);
        }
        this.renderBars();
    }
}




/*
    bars getter/setter
*/
get bars(){ return(this._bars); }
set bars(v){
    if (v instanceof Array){
        let that = this;
        this._bars = [];
        function recursor(idx){
            if (idx < v.length){
                that.addBar(v[idx]);
                requestAnimationFrame(() => {recursor(idx + 1); });
            }
        }
        recursor(0);
    }
}




/*
    LOH 12/12/25 @ 1645 -- COB
    evrything works. Some things we need

        * an option not to animate on the bars setter above
          actrually maybe just a separate async function that can
          resolve when the animated row-setter is done

        * an option to clear the chart

        * labels?

        * mouseover / click effects?

        * sub-charts?

    anyhow. not bad for hacking it out in a day and a half
    while going through a breakup and all the damn rest
    callin' it a day

*/



/*
    initializedCallback(slf)
    anything you need to do only once, but *after* everything is rendered
    and this.initialized is set.

    this is called from .initialize() and .setType() (sometimes)
*/
initializedCallback(){
    let that = this;
    that.spawnSVG().then((r) => {
        // placeholder
        console.log("spawnedSVG");
    }).catch((error) => {
        // placeholder
        console.log(error);
    })
}



/*
    defaultStyle getter
*/
get defaultStyle(){return(`
    :host {
        display: block;
        position: relative;
        height: ${this.height}${/^\d+$/.test(this.height)?'px':''};
        width: ${this.width}${/^\d+$/.test(this.width)?'px':''};
        background-color: ${this.styleVar('background-color')};
    }
    :host([disabled="true"]){
        opacity: .5;
        filter: grayscale(.9);
    }
    div.${this._className} {
        padding: 0;
        margin: 0;
    }
    rect.bar {
        fill: ${this.styleVar('color')};
        rx: ${this.styleVar('chart-border-radius')};
        ry: ${this.styleVar('chart-border-radius')};
    }
`)};



}
const _classRegistration = wcBarChart.registerElement('wc-bar-chart');
export { _classRegistration as wcBarChart };
