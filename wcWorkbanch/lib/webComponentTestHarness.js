/*
    webComponentTestHarness.js
    a lil UI for playin' with webComponents

*/
import { wcScreen } from '../../lib/webComponents/wcScreen.js';
import { wcBarChart } from '../../lib/webComponents/wcBarChart.js';
import { wcFormElement } from '../../lib/webComponents/wcFormElement.js';
import { wcToggle } from '../../lib/webComponents/wcToggle.js';
import { epochTimestamp } from '../../lib/noiceCore.js';
class webComponentTestHarness extends wcScreen {




static classID = webComponentTestHarness;
static classAttributeDefaults = {
    // needed boilerplate (it is what it is)
    disabled: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    has_focus: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true },
    fit_parent: { observed: true, accessor: true, type: 'bool', value: false, forceAttribute: true, forceInit: true },
    name: { observed: true, accessor: true, type: 'str', value: 'wcScreen', forceAttribute: true, forceInit: true },
    menu_label: { observed: true, accessor: true, type: 'str', value: 'wcScreen', forceAttribute: true, forceInit: true },
    menu_order: { observed: true, accessor: true, type: 'float', value: '0', forceAttribute: true, forceInit: true }

    // add custom element attributes here if needed
};

// also boilerplate
static observedAttributes = Object.keys(this.classID.classAttributeDefaults).filter((a) =>{ return(this.classID.classAttributeDefaults[a].observed === true); });




/*
    constructor
*/
constructor(args){
    // boilerplate
    super(args);
    this._className = 'webComponentTestHarness';    // change me
    this._version = 1;

    // attributeChangeHandlers
    this.attributeChangeHandlers = {
        // more boilerplate
        name: (a,o,n,s) => { s.setName(n); },
        menu_label: (a,o,n,s) => { s.setMenuLabel(n); },
        menu_order: (a,o,n,s) => { s.setMenuOrder(n); },

        /*
            put your custom attribute change handlers here
            ex
            label_position: (attributeName, oldValue, newValue, selfReference) => { selfReference.setLabelPosition(newValue, oldValue); },
        */
    };

    // merge object defaults
    this.mergeClassDefaults({
        // boilerplate
        _content: null,
        _menu_icon_mask: null

        // put custom attribute defaults here
    });

    // hackarooni
    this.setContent();
    this.setStyleSheet();

    // more hackaliciousness
    let that = this;
    this.addEventListener('DOMConnected', (evt) => { that.fitParent(); });
    that.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) { if (entry.contentBoxSize) { that.fitParent(); } }
    });
    that.resizeObserver.observe(document.documentElement);
    that.resizeObserver.observe(that);
}




/*
    getAttributeDefaults()
    override this in each subclass, as I can't find a more elegant way of
    referencing the static class vars in an overridable way

    also  boilerplate just be sure to replace the class name symbo
*/
getAttributeDefaults(){ return(webComponentTestHarness.classAttributeDefaults); }
getStyleDefaults(){ return(webComponentTestHarness.classStyleDefaults); }




/*
    ------------------------------------------------------------
    custom stuffs
    ------------------------------------------------------------
*/




/*
    content setter
*/
setContent(){
    this.content = `
        <!-- html content goes here -->
        <div class="container">
            <div class="header" data-_name="header">
                <h2 class="title">The Lorem</h2>
                <div class="buttonContainer">
                    <button>Sit</button>
                    <button>Dolor</button>
                    <button>Ipsum</button>
                </div>
            </div>
            <div class="main" data-_name="main">
                <div class="bcTest">
                    <wc-bar-chart data-_name="chart"></wc-bar-chart>
                    <div class="ctrl">
                        <wc-form-element type="number" label="bars" label_position="left" capture_value_on="focusoutOrReturn" data-_name="num_bars"></wc-form-element>
                        <wc-toggle data-_name="animateToggle" label="animate load" label_position="left"></wc-toggle>
                        <wc-toggle data-_name="animatePhaseToggle" label="animate phase" label_position="left"></wc-toggle>
                    </div>
                </div>
            </div>
        </div>
    `;
}



/*
    stylesheet setter
*/
setStyleSheet(){
    this.styleSheet = `
        /* css content goes here */
        .container .header {
          display: grid;
          grid-template-columns: auto auto;
          align-items: center;
        }
        .container .header .buttonContainer {
          display: flex;
          flex-direction: row-reverse;
        }
        .container .header .buttonContainer button {
          margin-right: .5em;
        }
        div[data-_name="main"]{
            overflow-y: auto;
        }
        div.bcTest {
            display: grid;
            grid-template-columns: auto auto;
        }
        div.ctrl {
            font-size: 1rem;
        }

    `;
}




/*
    initializedCallback setter
*/
initializedCallback(slf){
    // do thine one-time setups here
    slf._elements.num_bars.captureValueCallback = (value, self, event) => {
        slf.populateChart(value, slf._elements.animateToggle.on);
    };
    slf._elements.animateToggle.captureValueCallback = (value) => {
        slf.populateChart(slf._elements.num_bars.value, value);
    };
    slf._elements.animatePhaseToggle.captureValueCallback = (value) => {
        slf.animateChart(value);
    };
};


/*
    populateChart(num, animate)
*/
populateChart(num, animate){
    let barTest = [];
    let x = 0;
    for (let i=0; i<num; i++){
        x = ((Math.PI*1.25)/num)*i;
        barTest.push({
            name: `test_${i}`,
            value: (Math.sin(x)*.5 + .5)*100,
            order: i
        });

        // lets try an overlay
        barTest.push({
            name: `test_overlay_${i}`,
            parent_name: `test_${i}`,
            value: (Math.sin(x)*.5 + .5)*66,
            order: i
        });

        // lets try annother overlay
        barTest.push({
            name: `test_overlayB_${i}`,
            parent_name: `test_overlay_${i}`,
            value: (Math.sin(x)*.5 + .5)*22,
            order: i,
            fill: "green"
        });
    }
    this._elements.chart.setBars(barTest, (animate === true));
}




/*
    updateChart(num, phase)
*/
updateChart(num, phase){
    for (let i=0; i<num; i++){
        let x = ((Math.PI*1.25)/num)*i;
        this._elements.chart.updateBar({
            name: `test_${i}`,
            value: (Math.sin(x + phase)*.5+.5)*100,
            order: i
        });
    }
}




/*
    animateChart(bool, num)
*/
animateChart(b){
    if (b === true){
        this.runAnimation = true;
        let that = this;
        function recursor(){
            that.updateChart(that._elements.num_bars.value, Math.cos(epochTimestamp(true)/3500)*Math.PI*8);
            if (that.runAnimation === true){ requestAnimationFrame(() => {recursor(); }); }
        }
        recursor();
    }else{
        this.runAnimation = false;
    }
}




/*
    gainFocusCallback
*/
gainFocusCallback(focusArgs, slf){
    let that = this;
    return(new Promise((toot, boot) => {
        /*
            toot(slf) (or that) to proceed
            boot(error) to abort focus change
        */

        // quick test set for the barChart

        //that._elements.chart.bars = barTest;

        toot(that);
    }));
}




/*
    loseFocusCallback
*/
loseFocusCallback(focusArgs, slf){
    let that = this;
    return(new Promise((toot, boot) => {
        /*
            toot(slf) (or that) to proceed
            boot(error) to abort focus change
        */
        toot(that);
    }));
}




/*
    fitParent()
    this adjusts the height of .main because imma be honest

    I'm sure it can be done native CSS.
    I have neither the patience nor the inclination at the moment.
    "ain't nobody got time fo dat"
*/
fitParent(){
    if (this.initialized){
        if(
            (this.parentElement instanceof Element) &&
            (this._elements.main instanceof Element) &&
            (this._elements.header instanceof Element)
        ){
            let d = this.parentElement.getBoundingClientRect();
            let h = this._elements.header.getBoundingClientRect();
            this._elements.main.style.height = `${document.documentElement.clientHeight - d.y - h.height}px`;
        }
    }
}




/*
    custom menu icon
*/
get menu_icon_mask(){ return(`url('data:image/svg+xml;utf8,${this.pooIcon}')`); }



/*
    pooIcon
*/
get pooIcon(){return(encodeURIComponent(`<svg
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:svg="http://www.w3.org/2000/svg"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   version="1.1"
   viewBox="0 -256 1792 1792"
   id="svg1173"
   sodipodi:docname="poo-icon.svg"
   inkscape:version="1.0.2 (e86c8708, 2021-01-15)">
  <metadata
     id="metadata1179">
    <rdf:RDF>
      <cc:Work
         rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type
           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
        <dc:title></dc:title>
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <defs
     id="defs1177" />
  <sodipodi:namedview
     pagecolor="#ffffff"
     bordercolor="#666666"
     borderopacity="1"
     objecttolerance="10"
     gridtolerance="10"
     guidetolerance="10"
     inkscape:pageopacity="0"
     inkscape:pageshadow="2"
     inkscape:window-width="1920"
     inkscape:window-height="1147"
     id="namedview1175"
     showgrid="false"
     inkscape:zoom="0.26763521"
     inkscape:cx="838.08535"
     inkscape:cy="838.08535"
     inkscape:window-x="1440"
     inkscape:window-y="25"
     inkscape:window-maximized="1"
     inkscape:current-layer="svg1173"
     inkscape:document-rotation="0" />
  <path
     d="m 1399.5509,891.5361 c 9.1325,-31.81719 23.3366,-101.99107 -7.5798,-158.20812 -20.492,-37.27861 -57.8802,-62.70874 -111.1213,-75.59047 a 13.359105,12.658376 0 0 1 -7.288,-19.95225 283.33063,268.46901 0 0 0 2.102,-35.88775 l 0.028,-1.48578 c 0.4432,-18.27739 -0.1562,-39.56707 -8.018,-58.95954 -10.8323,-26.69768 -33.1573,-43.92127 -49.975,-53.66702 a 163.5624,154.98301 0 0 0 -35.6071,-15.33461 c -3.127,-0.81501 -25.1831,-4.66697 -35.7806,-6.51896 -11.5879,-2.02277 -17.1691,-3.0179 -19.9656,-6.89116 A 857.31955,812.35033 0 0 1 818.41289,623.30191 c 26.57008,32.2316 43.20591,77.43947 43.20591,127.54189 A 227.72974,215.78457 0 0 1 831.91109,859.445 c 52.48235,-13.56707 109.77368,-31.58026 167.52052,-72.74335 a 247.20888,234.24196 0 0 1 -2.89864,-35.85785 c 0,-97.60062 62.84883,-177.00232 140.10053,-177.00232 77.2517,0 140.1002,79.4017 140.1002,177.00232 0,97.60061 -62.8488,177.00231 -140.1002,177.00231 -62.3345,0 -115.2416,-51.7287 -133.3686,-122.97058 -61.50082,41.80246 -136.68801,66.94784 -191.37963,81.00706 -24.41918,26.12481 -55.93785,41.96352 -90.367,41.96352 a 110.8588,105.04389 0 0 1 -58.28988,-16.25275 c -107.8665,9.95688 -207.99343,10.43333 -225.68066,10.43333 -1.60707,0 -2.46168,-0.003 -2.65334,-0.004 -25.04583,12.49384 -76.96975,42.67166 -83.31127,47.45186 a 166.98753,158.22848 0 0 0 -54.44869,131.66925 165.23955,156.57219 0 0 0 83.55814,119.5861 c 34.81406,18.163 74.37675,24.8247 115.68021,25.1543 136.85172,-19.1331 775.91122,-120.3066 903.17972,-354.34836 z m -257.7503,103.64873 c -42.6695,73.07597 -134.3064,121.26097 -227.43715,121.26507 q -9.16026,0 -18.32927,-0.6297 a 242.48587,229.76669 0 0 1 -29.9956,-3.8684 c -82.4894,-15.6802 -141.07309,-68.6189 -175.68996,-110.2644 -7.81805,-9.40387 -10.85827,-19.25239 -8.56499,-27.73881 a 23.774216,22.52718 0 0 1 16.17481,-15.83684 41.303458,39.136957 0 0 1 15.9228,-0.4772 c 129.38073,12.65938 245.8619,13.9927 356.10566,4.11541 6.2804,-0.56389 12.5959,-1.39086 18.9197,-2.2182 8.9735,-1.1689 18.2599,-2.38301 27.4156,-2.83143 12.3179,-0.55156 22.6899,3.68754 27.459,11.49049 4.4737,7.33398 3.7524,17.17016 -1.9806,26.99401 z"
     style="fill:#bfbf18;stroke-width:3.8389;fill-opacity:0.75"
     id="path1067" />
  <path
     d="m 1399.8621,924.0233 c 0.3372,0.18236 0.6456,0.39797 1.0044,0.55492 101.4182,44.27104 150.8023,98.32518 146.7978,160.65948 -4.4564,69.3802 -82.1163,127.0845 -156.5183,148.2262 -71.8571,20.4171 -150.4812,17.0424 -226.534,13.7913 -14.7586,-0.6341 -29.4309,-1.2597 -43.9375,-1.7122 a 2386.1671,2261.0048 0 0 1 -266.17173,-22.9033 c -9.37306,-1.3004 -19.21502,-3.2757 -29.63081,-5.3706 -12.83092,-2.5796 -25.87677,-5.0855 -38.91671,-6.633 227.01915,-51.2787 510.92225,-141.8066 613.90685,-286.6128 z M 581.41657,750.8438 c 0,-97.60062 62.84883,-177.00232 140.10017,-177.00232 31.55219,0 60.60248,13.40452 84.04795,35.72594 0.17905,-0.0635 0.30603,-0.19655 0.49178,-0.24962 172.9467,-49.37896 286.95323,-143.54951 315.48333,-168.9546 -9.2035,-44.42462 -20.4459,-89.45947 -38.0795,-125.50567 A 382.97998,362.89142 0 0 0 958.56164,171.84576 C 900.49931,132.67368 807.2814,90.542743 783.22781,113.39219 c -4.17838,3.97154 -5.37728,12.02561 -3.22282,21.55313 1.11174,4.91398 2.32799,9.75808 3.52688,14.54874 7.79202,31.06832 15.84472,63.19454 -8.69553,96.53038 a 253.4057,240.11374 0 0 1 -15.83604,18.82484 c -11.09292,12.28495 -20.6746,22.89878 -23.59336,38.26216 -4.30852,22.64803 -0.0276,49.32515 3.75285,72.86218 a 12.933852,12.255429 0 0 1 -0.0777,2.65093 c 26.43363,2.47755 94.03151,-1.91626 147.91783,-29.91661 a 8.8948432,8.4282795 0 1 1 8.54803,14.78305 c -45.64038,23.71789 -103.21645,32.402 -140.52609,32.40611 a 106.81356,101.21084 0 0 1 -32.02505,-3.46706 c -23.04912,8.74576 -96.04439,40.72475 -128.87159,105.33966 -22.03834,43.36971 -22.10775,93.7154 -0.19995,149.63761 a 13.350941,12.65064 0 0 1 -9.92005,16.80395 c -0.66886,0.12743 -69.58118,13.90638 -108.32437,71.6107 -28.5447,42.51397 -34.25167,98.31698 -16.94777,165.85749 v 0.007 a 13.223992,12.530351 0 0 1 0.31431,3.32918 c 35.47621,-0.43199 105.95064,-2.11021 183.07222,-8.49988 C 605.49657,864.5547 581.41656,811.2098 581.41656,750.84258 Z"
     style="fill:#bfbf18;stroke-width:3.8389;fill-opacity:1"
     id="path1069" />
  <path
     d="m 788.97658,752.95064 c 0,50.04151 -29.86941,90.60819 -66.71448,90.60819 -36.84507,0 -66.71448,-40.56668 -66.71448,-90.60819 0,-50.04151 29.86901,-90.60856 66.71448,-90.60856 36.84547,0 66.71448,40.56743 66.71448,90.60856 z m 348.39762,90.60819 c 36.8455,0 66.7145,-40.56668 66.7145,-90.60819 0,-50.04151 -29.869,-90.60856 -66.7145,-90.60856 -36.8454,0 -66.7144,40.56743 -66.7144,90.60856 0,50.04114 29.8694,90.60819 66.7144,90.60819 z m 4.4265,151.626 c -42.6696,73.07597 -134.3065,121.26097 -227.43721,121.26507 q -9.16026,0 -18.32927,-0.6297 a 242.39453,229.68015 0 0 1 -29.99521,-3.8687 c -82.48979,-15.6799 -141.07348,-68.6186 -175.69035,-110.2641 -7.81805,-9.40425 -10.85866,-19.25239 -8.56538,-27.73881 a 23.775675,22.528563 0 0 1 16.1748,-15.83684 41.305706,39.139087 0 0 1 15.9232,-0.4772 c 129.38072,12.65938 245.8619,13.9927 356.10572,4.11541 6.2807,-0.56389 12.5958,-1.39086 18.92,-2.2182 8.9732,-1.1689 18.2595,-2.38301 27.4152,-2.83143 12.3179,-0.55156 22.6895,3.68754 27.459,11.49049 4.4737,7.33398 3.7524,17.17016 -1.9806,26.99401 z m -5.7161,-22.77546 c -3.5966,-5.89341 -12.205,-7.65908 -19.3104,-7.28876 -8.774,0.42825 -17.8604,1.61358 -26.6513,2.76155 -6.4544,0.84378 -12.8913,1.68346 -19.3018,2.2552 -110.83455,9.94343 -227.88915,8.58919 -357.86064,-4.11541 a 68.522876,64.928626 0 0 0 -6.94964,-0.45665 20.298371,19.233655 0 0 0 -5.60285,0.64611 14.940461,14.156785 0 0 0 -10.00721,9.82347 c -2.14539,7.94346 3.42276,16.21165 6.93189,20.43394 33.6964,40.53868 90.62097,92.04468 170.46096,107.21858 a 233.52044,221.27152 0 0 0 28.88348,3.729 c 94.3817,6.5066 194.18411,-42.4071 237.34031,-116.3141 4.1258,-7.0623 4.8905,-14.05062 2.0672,-18.69293 z m 131.7537,-221.56595 c 0,93.10068 -58.7426,168.57344 -131.2055,168.57344 -59.3002,0 -109.3608,-50.57214 -125.6089,-119.95904 -1.1015,-4.70247 -2.0866,-9.46997 -2.8686,-14.33537 a 240.19863,227.59942 0 0 1 -2.7276,-34.27903 c 0,-93.1003 58.7431,-168.57381 131.2051,-168.57381 72.4628,0 131.2055,75.47351 131.2055,168.57381 z m -8.8967,3.8e-4 c 0,-88.30367 -54.8651,-160.14494 -122.3096,-160.14494 -67.4444,0 -122.31,71.84127 -122.31,160.14494 0,88.30366 54.8656,160.14456 122.31,160.14456 67.4445,0 122.3096,-71.8409 122.3096,-160.14456 z m -406.21583,-3.8e-4 a 216.22435,204.88267 0 0 1 -33.2756,111.91506 158.0674,149.77625 0 0 1 -19.38974,22.89018 c -21.91293,21.11031 -49.04303,33.7682 -78.53975,33.7682 a 101.69078,96.356762 0 0 1 -49.67047,-12.58913 121.80174,115.41284 0 0 1 -17.50976,-11.37914 c -38.29913,-29.43866 -64.02486,-83.09447 -64.02486,-144.60517 0,-93.1003 58.74263,-168.57381 131.20509,-168.57381 29.44861,0 56.53769,12.61753 78.43287,33.66544 q 4.82062,4.6339 9.28236,9.79918 c 26.64146,30.85382 43.48986,75.39802 43.48986,125.10919 z m -8.89902,3.8e-4 c 0,-88.30367 -54.86594,-160.14494 -122.31001,-160.14494 -67.44407,0 -122.30962,71.84127 -122.30962,160.14494 0,88.30366 54.86555,160.14456 122.30962,160.14456 67.44407,0 122.31001,-71.8409 122.31001,-160.14456 z"
     style="fill:#bfbf18;stroke-width:3.8389;fill-opacity:1"
     id="path1071" />
</svg>`))}


/*
    warningIcon
*/
get warningIcon(){return(encodeURIComponent(`<svg
    version="1.1"
    id="Capa_1"
    x="0px"
    y="0px"
    viewBox="0 0 486.463 486.463"
    style="enable-background:new 0 0 486.463 486.463;"
    xml:space="preserve"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:svg="http://www.w3.org/2000/svg"><defs
    id="defs45" />
 <g
    id="g10"
    style="stroke:none;fill:#000000;fill-opacity:1">
 	<g
    fill="#E600A1"
    stroke="#595959"
    id="g8"
    style="stroke:none;fill:#000000;fill-opacity:1">
 		<path
    d="M243.225,333.382c-13.6,0-25,11.4-25,25s11.4,25,25,25c13.1,0,25-11.4,24.4-24.4    C268.225,344.682,256.925,333.382,243.225,333.382z"
    id="path2"
    style="stroke:none;fill:#000000;fill-opacity:1" />
 		<path
    d="M474.625,421.982c15.7-27.1,15.8-59.4,0.2-86.4l-156.6-271.2c-15.5-27.3-43.5-43.5-74.9-43.5s-59.4,16.3-74.9,43.4    l-156.8,271.5c-15.6,27.3-15.5,59.8,0.3,86.9c15.6,26.8,43.5,42.9,74.7,42.9h312.8    C430.725,465.582,458.825,449.282,474.625,421.982z M440.625,402.382c-8.7,15-24.1,23.9-41.3,23.9h-312.8    c-17,0-32.3-8.7-40.8-23.4c-8.6-14.9-8.7-32.7-0.1-47.7l156.8-271.4c8.5-14.9,23.7-23.7,40.9-23.7c17.1,0,32.4,8.9,40.9,23.8    l156.7,271.4C449.325,369.882,449.225,387.482,440.625,402.382z"
    id="path4"
    style="stroke:none;fill:#000000;fill-opacity:1" />
 		<path
    d="M237.025,157.882c-11.9,3.4-19.3,14.2-19.3,27.3c0.6,7.9,1.1,15.9,1.7,23.8c1.7,30.1,3.4,59.6,5.1,89.7    c0.6,10.2,8.5,17.6,18.7,17.6c10.2,0,18.2-7.9,18.7-18.2c0-6.2,0-11.9,0.6-18.2c1.1-19.3,2.3-38.6,3.4-57.9    c0.6-12.5,1.7-25,2.3-37.5c0-4.5-0.6-8.5-2.3-12.5C260.825,160.782,248.925,155.082,237.025,157.882z"
    id="path6"
    style="stroke:none;fill:#000000;fill-opacity:1" />
 	</g>
 </g>
 <g
    id="g12">
 </g>
 <g
    id="g14">
 </g>
 <g
    id="g16">
 </g>
 <g
    id="g18">
 </g>
 <g
    id="g20">
 </g>
 <g
    id="g22">
 </g>
 <g
    id="g24">
 </g>
 <g
    id="g26">
 </g>
 <g
    id="g28">
 </g>
 <g
    id="g30">
 </g>
 <g
    id="g32">
 </g>
 <g
    id="g34">
 </g>
 <g
    id="g36">
 </g>
 <g
    id="g38">
 </g>
 <g
    id="g40">
 </g>
</svg>`))}



}

// more boilerplate, replace the registerElement string and the className
const _classRegistration = webComponentTestHarness.registerElement('wc-test-harness');
export { _classRegistration as webComponentTestHarness };
