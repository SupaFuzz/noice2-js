/*
    wcBarChart.js
    12/11/25 Amy Hicox <amy@hicox.com>

    it's an SVG bar chart!
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
    label_height: { observed: false, accessor: true, type: 'float', value: 20 },
    scale_values: { observed: true, accessor: true, type: 'bool', value: false }
}
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });
static classStyleDefaults = {
    'color': { value: 'hsl(233 6% 56.1%)', global: true },
    'stroke': { value: 'hsl(233 6% 37%)', global: true },
    'stroke-width': { value: '0', global: true },
    'background-color': { value: 'hsl(233 6% 13.6%)', global: true },
    'overlay-color': { value: 'hsl(233 6% 25%/.66)', global: true },
    'label-font-color': { value: 'hsl(233 6% 88%)', global: true },
    'label-font-size': { value: '.35rem', global: true },
    'label-font-family': { value: 'monospace', global: true },
    'label-rotate': { value: '-90deg', global: true },
    'label-highlight-color': { value: 'hsl(233 6% 99%)', global: true },
    'hover-color': { value: 'hsl(233 6% 99%/.7)', global: true },
    'overlay-hover-color': { value: 'hsl(233 6% 25%/.66)', global: true },
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
        if (that.svgDOMObject instanceof Element){
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

            // handle data scaling
            if ((queue.length) && (that.scale_values == true)){
                const bs = queue.slice();
                bs.sort((a,b) => {return( parseFloat(b.value) - parseFloat(a.value) )});
                let hwm = bs[0].value;
                queue.forEach((bar) => {
                    bar.scaled_value = ((parseFloat(bar.value) / parseFloat(hwm)) *100);
                });
            }


            const base_layer = queue.filter((b) =>{
                return(! (b.hasOwnProperty('parent_name') && that.isNotNull(b.parent_name)) )
            });

            // calculate width & gap
            let maxy = (parseFloat(this.svgDOMObject.dataset.maxy) - (this.show_labels?this.label_height:0));
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

                        ['value', 'scaled_value', 'name', 'order', 'label', 'enable_hover', 'highlight_label', 'click_callback'].filter((at) => {return(b.hasOwnProperty(at))}).forEach((a) => { bar.dataset[a] = b[a]; });
                        ['fill', 'stroke', 'stroke-width'].filter((a) => {return(b.hasOwnProperty(a))}).forEach((a) => { bar.setAttribute(a, b[a]); });
                        if (b.hasOwnProperty('click_callback') && that.isNotNull(b.click_callback)){
                            bar.addEventListener('click', (evt) => {
                                that.dispatchEvent(new CustomEvent(b.click_callback, { detail: {self: that, barElement: bar, ui: b.name }}));
                            });
                        }
                        let height = (Math.abs((that.scale_values == true)?b.scaled_value:b.value) <= 100)?maxy*(Math.abs((that.scale_values == true)?b.scaled_value:b.value)/100):maxy;
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
                    that.toggleLabels(that.show_labels);
                    toot(Array.from(that.svgDOMObject.querySelectorAll('rect.bar')));
                }
            }
            recursor();
        }else{
            toot(false);
        }
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
         that.svgDOMObject.querySelectorAll('foreignObject.label').forEach((el) => {el.remove(); });
         let maxy = parseFloat(that.svgDOMObject.dataset.maxy);
         let maxx = parseFloat(that.svgDOMObject.dataset.maxx);
         const bars = Array.from(that.svgDOMObject.querySelectorAll('rect.bar'));
         if (bool === true){

             // pull the bars up by .label_height pixels (svg pseudo-pixels)
             bars.forEach((bar) => {

                // recalculate height
                let v = parseFloat((that.scale_values == true)?bar.dataset.scaled_value:bar.dataset.value);
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

                 let txt = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
                 txt.classList.add("label");
                 txt.setAttribute('x', parseFloat(bar.getAttribute('x')));
                 txt.setAttribute('y', parseFloat(bar.getAttribute('y')) + parseFloat(bar.getAttribute('height')));
                 txt.setAttribute('width', parseFloat(bar.getAttribute('width')));
                 txt.setAttribute('height', that.label_height);
                 let div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
                 div.classList.add('textLabel');
                 div.dataset.name = bar.dataset.name;
                 if (bar.dataset && bar.dataset.highlight_label && (bar.dataset.highlight_label == "true")){ div.classList.add("highlight"); }
                 div.innerHTML = `<span>${(bar.dataset && bar.dataset.label && that.isNotNull(bar.dataset.label))?bar.dataset.label:''}</span>`;
                 txt.appendChild(div);
                 that.svgDOMObject.appendChild(txt);

                 if (bar.dataset && bar.dataset.click_callback && that.isNotNull(bar.dataset.click_callback)){
                     txt.addEventListener('click', (evt) => {
                         that.dispatchEvent(new CustomEvent(bar.dataset.click_callback, { detail: {self: that, barElement: bar, ui: bar.dataset.name }}));
                     });
                 }

             });

         }else{
             // TODO: remove text elements
             that.svgDOMObject.querySelectorAll('foreignObject.label').forEach((el) => {el.remove(); });

             // pull the bars back down to the bottom
             // pull the bars up by .label_height pixels (svg pseudo-pixels)
             bars.forEach((bar) => {

                // recalculate height
                let v = parseFloat((that.scale_values == true)?bar.dataset.scaled_value:bar.dataset.value);
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
        highlight_label: <bool>
    })
    all options are optional except name
    we are gonna find the existing bar with dataset.name = name and update the named attributes
*/
updateBar(args){
    if ((args instanceof Object) && args.hasOwnProperty('name') && this.isNotNull(args.name)){
        let bar = null;
        let tmp = this._bars.filter((b) => {return(b.hasOwnProperty('name') && (b.name == args.name))});
        if (tmp.length > 0){ bar = tmp[0]; }
        let el = this.svgDOMObject.querySelector(`rect.bar[data-name="${args.name}"]`);
        let label = this.svgDOMObject.querySelector(`div.textLabel[data-name="${args.name}"]`);
        if ((el instanceof Element) && (bar instanceof Object)){
            let maxy = (parseFloat(this.svgDOMObject.dataset.maxy) - (this.show_labels?this.label_height:0));

            // update dataset & element attributes & ._bars values
            ['value', 'scaled_value', 'name', 'order', 'label', 'enable_hover', 'highlight_label'].filter((a) => { return(args.hasOwnProperty(a)) }).forEach((a) => { el.dataset[a] = bar[a]= args[a]; });
            ['fill', 'stroke', 'stroke-width'].filter((a) => {return(args.hasOwnProperty(a))}).forEach((a) => {
                bar[a] = args[a];
                el.setAttribute(a, args[a]);
            });

            // update label highlight and text
            if ((label instanceof Element) && (this.show_labels == true)){
                if (args.hasOwnProperty('label')){
                    let sp = label.querySelector('span');
                    if (sp instanceof Element){ sp.textContent = args.label; }
                }
                if (el.dataset && el.dataset.highlight_label && (el.dataset.highlight_label == "true")){
                    label.classList.add("highlight");
                }else{
                    label.classList.remove("highlight");
                }
            }

            // update height
            if (args.hasOwnProperty('value')){
                if (this.scale_values == true){

                    // hard mode lol
                    let queue = this._bars.filter((b) => {return(
                        (b instanceof Object) &&
                        b.hasOwnProperty('name') &&
                        this.isNotNull(b.name) &&
                        b.hasOwnProperty('value') &&
                        (! isNaN(parseFloat(b.value))) &&
                        b.hasOwnProperty('order') &&
                        (! isNaN(parseFloat(b.order))) && (
                            (!(b.hasOwnProperty('parent_name') && this.isNotNull(b.parent_name))) || (
                                (
                                    b.hasOwnProperty('parent_name') &&
                                    this.isNotNull(b.parent_name) &&
                                    (this._bars.filter((a) => {return(a.name == b.parent_name)}).length > 0)
                                )
                            )
                        )
                    )});
                    const bs = queue.slice();
                    bs.sort((a,b) => {return( parseFloat(b.value) - parseFloat(a.value) )});
                    let hwm = bs[0].value;

                    if (parseFloat(args.value) > hwm){
                        // really hard mode -- recalculate all scaled values and heights
                        queue.forEach((bar) => {
                            bar.scaled_value = ((parseFloat(bar.value) / parseFloat(hwm)) *100);
                            let ell = this.svgDOMObject.querySelector(`rect.bar[data-name="${bar.name}"]`);
                            if (ell instanceof Element){
                                ell.dataset.scaled_value = bar.scaled_value;
                                let height = (Math.abs(bar.scaled_value) <= 100)?maxy*(Math.abs(bar.scaled_value)/100):maxy;
                                el.setAttribute('height', height);
                                el.setAttribute('y', (maxy - height));
                            }
                        }, this);
                    }else{
                        // medium mode, if I'm being honest
                        el.dataset.scaled_value = bar.scaled_value = ((parseFloat(args.value) / parseFloat(hwm)) *100);
                        let height = (Math.abs(bar.scaled_value) <= 100)?maxy*(Math.abs(bar.scaled_value)/100):maxy;
                        el.setAttribute('height', height);
                        el.setAttribute('y', (maxy - height));

                    }

                }else{
                    // easy mode!
                    let height = (Math.abs(args.value) <= 100)?maxy*(Math.abs(args.value)/100):maxy;
                    el.setAttribute('height', height);
                    el.setAttribute('y', (maxy - height));
                }
            }
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
        enable_hover: <bool> - enable the hover effect (hover-color) for this bar
        highlight_label: <bool> - give the label span class="highlight"
        click_callback: <function(self, barElement, name)>
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
            if (args.click_callback instanceof Function){
                let that = this;
                let ref = args.click_callback;
                args.click_callback = `bar_click_${args.name}`;
                this.addEventListener(`bar_click_${args.name}`, (evt) => { ref(that, evt.detail.barElement, args.name); });
            }
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
    rect.bar.overlay[data-enable_hover="true"]:hover {
        fill: ${this.styleVar('overlay-hover-color')};
    }
    rect.bar.base_layer[data-enable_hover="true"]:hover {
        fill: ${this.styleVar('hover-color')};
    }
    rect.bar.base_layer {
        fill: ${this.styleVar('color')};
    }
    foreignObject.label div.textLabel {
        display: grid;
        place-content: center;
        overflow: hidden;
        height: calc(100% - 3px);
        width: calc(100% - 3px);
        color: ${this.styleVar('label-font-color')};
        font-size: ${this.styleVar('label-font-size')};
        font-family: ${this.styleVar('label-font-family')};
        border-bottom-width: 1px;
        border-bottom-style: solid;
        border-bottom-color: transparent;
    }
    foreignObject.label div.textLabel.highlight {
        color: ${this.styleVar('label-highlight-color')};
        border-bottom-color: ${this.styleVar('label-highlight-color')};
    }
    foreignObject.label div.textLabel span {
        transform: rotate(${this.styleVar('label-rotate')});
        cursor: default;
    }
`)};




}
const _classRegistration = wcBarChart.registerElement('wc-bar-chart');
export { _classRegistration as wcBarChart };
