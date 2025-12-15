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
    overlay_offset: { observed: false, accessor: true, type: 'float', value: 2 },
    show_labels: { observed: true, accessor: true, type: 'bool', value: false },
    label_height: { observed: false, accessor: true, type: 'float', value: 20 }
}
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {
    'color': { value: 'hsl(233 6% 56.1%)', global: true },
    'stroke': { value: 'hsl(233 6% 37%)', global: true },
    'stroke-width': { value: '0', global: true },
    'background-color': { value: 'hsl(233 6% 13.6%)', global: true },
    'overlay-color': { value: 'hsl(233 6% 25%/.66)', global: true }
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
        bar_radius: (name, oldValue, newValue, slf) => { slf.renderBars(); },
        overlay_offset: (name, oldValue, newValue, slf) => { slf.renderBars(); },
        show_labels: (name, oldValue, newValue, slf) => { slf.toggleLabels(newValue); }
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
    return(new Promise((toot, boot) => {
        // remove any existing ones
        that.svgDOMObject.querySelectorAll('rect.bar').forEach((el) => { el.remove(); });

        /*
            since we're gonna recurse until they all get rendered
            we gotta filter invalid _bar's:
                * that don't have a name, value or order attribute
                * orphans that have a parent_name attribute that does not exist as a 'name' in ._bars
        */
        const queue = that._bars.filter((b) => {return(
            (b instanceof Object) &&
            b.hasOwnProperty('name') &&
            that.isNotNull(b.name) &&
            b.hasOwnProperty('value') &&
            (! isNaN(parseFloat(b.value))) &&
            b.hasOwnProperty('order') &&
            (! isNaN(parseFloat(b.order))) && (
                (!(b.hasOwnProperty('parent_name') && that.isNotNull(b.parent_name))) || (
                    (
                        b.hasOwnProperty('parent_name') &&
                        that.isNotNull(b.parent_name) &&
                        (that._bars.filter((a) => {return(a.name == b.parent_name)}).length > 0)
                    )
                )
            )
        )}).sort((a,b) => {return(
            parseFloat(a.order) - parseFloat(b.order)
        )});

        const base_layer = queue.filter((b) =>{
            return(! (b.hasOwnProperty('parent_name') && that.isNotNull(b.parent_name)) )
        });

        // calculate width & gap
        let maxy = parseFloat(that.svgDOMObject.dataset.maxy);
        let maxx = parseFloat(that.svgDOMObject.dataset.maxx);
        let gap_width = 0;
        let bar_width = 0;
        if ((base_layer.length * that.max_bar_width) < maxx){
            // centered
            gap_width = ((maxx - (base_layer.length * that.max_bar_width))/(base_layer.length + 1));
            bar_width = that.max_bar_width;
        }else{
            // squashed
            let e2e = (maxx/base_layer.length);
            gap_width = (e2e/8);
            bar_width = ((maxx - (gap_width * (base_layer.length + 1)))/base_layer.length);
        }

        let oof_counter = 0;
        function recursor(){
            const parents = Array.from(that.svgDOMObject.querySelectorAll('rect.bar'));
            const q = queue.filter((b) => {return(
                parents.filter((el) => {return(el.dataset.name == b.name)}).length == 0
            )});
            if (q.length > 0){
                q.forEach((b, idx) => {
                    let bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    bar.classList.add("bar");

                    ['value', 'name', 'order', 'label'].forEach((a) => { bar.dataset[a] = b[a]; });
                    ['fill', 'stroke', 'stroke-width'].filter((a) => {return(b.hasOwnProperty(a))}).forEach((a) => { bar.setAttribute(a, b[a]); });
                    let height = (Math.abs(b.value) <= 100)?maxy*(Math.abs(b.value)/100):maxy;
                    bar.setAttribute('height', height);
                    bar.setAttribute('y', (maxy - height));
                    if (b.hasOwnProperty('parent_name') && that.isNotNull(b.parent_name)){

                        // has parent, if already spawned lay it on top, else wait for the next pass
                        let p = parents.filter((el) => {return(el.dataset.name == b.parent_name)});
                        if (p.length > 0){
                            if (!((b.hasOwnProperty('fill') && that.isNotNull(b.fill)))){ bar.classList.add("overlay"); }
                            bar.setAttribute('width', parseFloat(p[0].getAttribute('width')) - that.overlay_offset);
                            bar.setAttribute('x', parseFloat(p[0].getAttribute('x')) + (that.overlay_offset/2));
                            if (that.bar_radius){
                                ['rx','ry'].forEach((a) => { bar.setAttribute(a, (parseFloat(bar.getAttribute('width'))/that.bar_radius_ratio)); });
                            }
                            that.svgDOMObject.appendChild(bar);
                        }
                    }else{
                        // no parent
                        bar.dataset.base_layer = true;
                        if (!((b.hasOwnProperty('fill') && that.isNotNull(b.fill)))){ bar.classList.add("base_layer"); }
                        bar.setAttribute('width', bar_width);
                        bar.setAttribute('x', gap_width + ((bar_width + gap_width)*oof_counter));
                        if (that.bar_radius){
                            ['rx','ry'].forEach((a) => { bar.setAttribute(a, (bar_width/that.bar_radius_ratio)); });
                        }
                        that.svgDOMObject.appendChild(bar);
                        oof_counter ++;
                    }
                });
                // recurse
                Promise.resolve().then(() => {recursor(); })
            }else{
                toot(Array.from(that.svgDOMObject.querySelectorAll('rect.bar')));
            }
        }
        recursor();
    }));
}



/*
    clear()
    what it says on the tin
*/
clear(){
    this._rows = [];
    if (this.initialized){
        that.svgDOMObject.querySelectorAll('rect.bar').forEach((el) => { el.remove(); });
        that.svgDOMObject.querySelectorAll('text.label').forEach((el) => { el.remove(); });
    }
}




/*
    toggleLabels(bool)
    show or hide labels
    true shows 'em'
*/
toggleLabels(bool){
     let that = this;
     if (that.initialized){
         let maxy = parseFloat(that.svgDOMObject.dataset.maxy);
         let maxx = parseFloat(that.svgDOMObject.dataset.maxx);
         const bars = Array.from(that.svgDOMObject.querySelectorAll('rect.bar'));
         if (bool === true){

             // pull the bars up by .label_height pixels (svg pseudo-pixels)
             bars.forEach((bar) => {

                // recalculate height
                let v = parseFloat(bar.dataset.value);
                if (! isNaN(v)){
                    let height = (Math.abs(v) <= 100)?(maxy - that.label_height)*(Math.abs(v)/100):(maxy - that.label_height);
                    bar.setAttribute('height', height);
                    bar.setAttribute('y', ((maxy - that.label_height) - height));
                }

             });

             // add text elements
             bars.filter((el) => {return(
                 el.dataset &&
                 el.dataset.base_layer &&
                 (el.dataset.base_layer == "true")
             )}).forEach((bar) => {
                 let txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                 txt.classList.add("label");
                 txt.setAttribute('x', parseFloat(bar.getAttribute('x')));
                 txt.setAttribute('y', maxy);
                 txt.setAttribute('textLength', parseFloat(bar.getAttribute('width')));
                 txt.textContent = "A"; // test
                 that.svgDOMObject.appendChild(txt);
             });

             /*
                12/15/25 @ COB (late)
                ugh. text is a mighty problem.
                it appears it can only be styled from CSS for one thing
                the y-coordinate is the baseline for another
                units for sizing are EXTREMELY unclear
                and vertcal / horizontal alignment? PLEASE!

                so ... I dunno I can't be the first person to have this problem
                I guess in the morning, see if there's some way to just embed a damn
                div in here I can use regular-ass CSS/grid or whatever because
                this situation is BONKERS by comparison.
             */

         }else{
             // TODO: remove text elements
             that.svgDOMObject.querySelectorAll('text.label').forEach((el) => {el.remove(); });

             // pull the bars back down to the bottom
             // pull the bars up by .label_height pixels (svg pseudo-pixels)
             bars.forEach((bar) => {

                // recalculate height
                let v = parseFloat(bar.dataset.value);
                if (! isNaN(v)){
                    let height = (Math.abs(v) <= 100)?(maxy)*(Math.abs(v)/100):(maxy);
                    bar.setAttribute('height', height);
                    bar.setAttribute('y', ((maxy) - height));
                }

             });
         }
     }
}




/*
    updateBar({
        name: <unique_string>,
        value: <percent, float 0 - 100>,
        fill: <css color value> (optional, if not specified uses --wc-bar-chart-color)
        stroke: <css color value> (optional, if not specified uses --wc-bar-chart-stroke)
        stroke-width: <css width value> (optional, if not specified uses --wc-bar-chart-stroke-width)
        order: <int> (optional, if not specified, auto-generated)
    })
    all options are optional except name
    we are gonna find the existing bar with dataset.name = name and update the named attributes
*/
updateBar(args){
    if ((args instanceof Object) && args.hasOwnProperty('name') && this.isNotNull(args.name)){
        let el = this.svgDOMObject.querySelector(`rect.bar[data-name="${args.name}"]`);
        if (el instanceof Element){
            let maxy = parseFloat(this.svgDOMObject.dataset.maxy);
            Object.keys(args).filter((a) =>{return (a!='name')}).forEach((a) => {
                if (a == 'value'){
                    let height = (Math.abs(args[a]) <= 100)?maxy*(Math.abs(args[a])/100):maxy;
                    el.setAttribute('height', height);
                    el.setAttribute('y', (maxy - height));
                }else{
                    el.setAttribute(a, args[a]);
                }
            })
        }
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
        parent_name: <unique_string> optional
        label: <str> optional (keep it real short, 3 or 4 chars at most it's SKINNY in there yo)
    })

    if you specify parent_name, and a bar with that name already exists, we're gonna slap this one
    right on top of it with .overlay_offset number of (svg "pixels") narrower than the parent in
    --wc-bar-chart-overlay-color by default but if you got more than one layer it's probably
    best to send your own colors on the arg
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
set bars(v){ this.setBars(v, false); }

setBars(v, animateBool){
    let that = this;
    return(new Promise((t,b) => {
        if (v instanceof Array){
            if (animateBool === true){
                that._bars = [];
                function recursor(idx){
                    if (idx < v.length){
                        that.addBar(v[idx]);
                        requestAnimationFrame(() => {recursor(idx + 1); });
                    }else{
                        t(true);
                    }
                }
                recursor(0);
            }else{
                that._bars = v;
                that.renderBars();
                t(true);
            }
        }
    }));
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
        //console.log(error);
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
    rect.bar.overlay {
        fill: ${this.styleVar('overlay-color')};
    }
    rect.bar.base_layer {
        fill: ${this.styleVar('color')};
    }
`)};



}
const _classRegistration = wcBarChart.registerElement('wc-bar-chart');
export { _classRegistration as wcBarChart };
