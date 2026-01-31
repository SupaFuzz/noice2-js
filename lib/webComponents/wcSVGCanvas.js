/*
    wcSVGCanvas.js
    1/30/26 Amy Hicox <amy@hicox.com>

    it's an SVG like I made for wcBarChart with nothing in it
    but with the coordinate system set to euclidean 0 origin center
    (as God intended).

    events:
        * render_svg - fires when the empty svg is spawned so you can draw stuff in a callback
*/
import { noiceAutonomousCustomElement } from '../noiceAutonomousCustomElement.js';
import { noiceRadialPolygonPath } from '../noiceRadialPolygonPath.js';

class wcSVGCanvas extends noiceAutonomousCustomElement {

static classID = wcSVGCanvas;
static classAttributeDefaults = {
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    chart_size: { observed: false, accessor: true, type: 'int', value: 200 },
    width: { observed: true, accessor: true, type: 'str', value: '25em', forceAttribute: true },
    height: { observed: true, accessor: true, type: 'str', value: '15.45em', forceAttribute: true },
    origin_at_center: { observed: true, accessor: true, type: 'bool', value: true },
}
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {
    'background-color': { value: 'hsl(233 6% 13.6%)', global: true },
    'overlay-color': { value: 'hsl(233 6% 25%/.66)', global: true }
}




/*
    constructor
*/
constructor(args){
    super();
    this._className = 'wcSVGCanvas';
    this._version = 1;
    this.cssVarPrefix = '--wc-svgcanvas';
    this._paths = [];
    this._aspectRatio = null;

    this.attributeDefaults = JSON.parse(JSON.stringify(wcSVGCanvas.classAttributeDefaults));
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
        origin_at_center: (name, oldValue, newValue, slf) => {
            if (slf.initialized && (slf.svgDOMObject instanceof Element)){
                slf.setAspectRatio().then((aspectRatio) => {
                    slf.svgDOMObject.setAttribute('viewBox', `${(newValue)?(slf.chart_size/-2):0} ${(newValue)?((slf.chart_size/aspectRatio)/-2):0} ${slf.chart_size} ${slf.chart_size/aspectRatio}`);
                }).catch((error) => {
                    slf.log(`origin_at_center attributeChangeHandler | setAspectRatio() threw unexpectedly: ${error}`);
                });
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
    return(wcSVGCanvas.classAttributeDefaults);
}
getStyleDefaults(){
    return(wcSVGCanvas.classStyleDefaults);
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
                that.DOMElement.insertAdjacentHTML('afterbegin', `<svg id="supafuzz" viewBox="${(that.origin_at_center)?(that.chart_size/-2):0} ${(that.origin_at_center)?((that.chart_size/aspectRatio)/-2):0} ${that.chart_size} ${that.chart_size/aspectRatio}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" data-maxy="${that.chart_size/aspectRatio}" data-maxx="${that.chart_size}"></svg>`);
                that.svgDOMObject = that.DOMElement.querySelector('#supafuzz');
                that.dispatchEvent(new CustomEvent('render_svg', { detail: { self: that, svgElement: that.svgDOMObject }}));
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
    clear()
    what it says on the tin
    ok so right here I've decided the paths are gonna have class="fuzz"

*/
clear(){
    if ((this.initialized) && (that.svgDOMObject instanceof Element)){
        that.svgDOMObject.innerHTML = '';
    }
}





/*
    updatePath(name, data)
    we are gonna find the existing path with dataset.name = name and update the named attributes on args
*/
updatePath(name, args){
    if ((args instanceof Object) && this.isNotNull(name) && (this.svgDOMObject instanceof Element)){
        const p = this.svgDOMObject.querySelectorAll(`path[data-name="${name}"]`);
        if ((p instanceof Array) && (p.length > 0) && (p[0] instanceof Element)){ Object.keys(args).forEach((a) => { p[0].setAttribute(a, args[a]); }); }
    }
}




/*
    addPath(args)
    make a path with the args on the svg
    if you wanna be able to update it, set dataset.name
*/
addPath(args){
    if ((args instanceof Object) && (this.svgDOMObject instanceof Element)){
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        Object.keys(args).forEach((a) => { path.setAttribute(a, args[a]); });
        this.svgDOMObject.appendChild(path);
    }
}




/*
    paths getter/setter
*/
get paths(){ return((this.svgDOMObject instanceof Element)?Array.from(this.svgDOMObject.querySelectorAll(`path`)):[]); }
set paths(v){ this.setPaths(v, false); }
setPaths(v, animateBool){
    let that = this;
    return(new Promise((t,b) => {
        if (v instanceof Array){
            if (animateBool === true){
                function recursor(idx){
                    if (idx < v.length){
                        // ya path better have dataset.name or there'll be issues updating it
                        that.svgDOMObject.appendChild(v[idx]);
                        requestAnimationFrame(() => {recursor(idx + 1); });
                    }else{
                        t(true);
                    }
                }
                recursor(0);
            }else{
                v.forEach((p) => { that.svgDOMObject.appendChild(p); });
                t(true);
            }
        }
    }));
}




/*
    getPath(name)
    if we've gotta bar with the name, return it's ._bars
    entry with .DOMElement populated with the bar element
*/
getPath(name){
    if (this.isNotNull(name) && (this.svgDOMObject instanceof Element)){
        return(this.svgDOMObject.querySelector(`path.fuzz[data-name="${name}"]`));
    }
}




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
        //console.log("spawnedSVG");
    }).catch((error) => {
        // placeholder
        that.log(error);
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
`)};




}
const _classRegistration = wcSVGCanvas.registerElement('wc-svgcanvas');
export { _classRegistration as wcSVGCanvas };
