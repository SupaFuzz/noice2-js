/*
    testUIOne.js
    show status of parcel checkIns by center, etc
*/
import { noiceCoreUIScreen } from '../../../lib/noiceCoreUI.js';
import { noiceObjectCore } from '../../../lib/noiceCore.js';
import { noiceCoreValue } from '../../../lib/noiceCoreValue.js';
import { noiceCoreRow } from '../../../lib/noiceCoreRow.js';

class dataClassDemo extends noiceCoreUIScreen {




/*
    constructor
*/
constructor(args, defaults, callback){
    super(
        args,
        noiceObjectCore.mergeClassDefaults({
            _version: 1,
            _className: 'dataClassDemo',
            pies: {},
            debug: false,
            _isTyping:              false,
            isTypingCheckInterval:  150,   // 100 == 10 times a second
            isTypingTimeout:        500,   // half a second
            scanIndicatorTimeout:   (1000 * 30), // 30 seconds
            _shiftFlag:             false,
            _scanBuffer:            [],
            _found:                 [],
            scanListener:           null,
        }, defaults),
        callback
    );
}




/*
    html
*/
get html(){return(`
    <div class="chartContainer" data-templatename="chartContainer" data-templateattribute="true"></div>
    <div class="scanCage" data-templatename="scanCage" data-templateattribute="true" style="color: rgb(240, 240, 240);display:grid;"></div>
`)}




/*
    setupCallback(self)
    perform these actions (just once) after render but before focus is gained
*/
setupCallback(self){
    let that = this;

    // fix layout for chart grid stuffs
    that.DOMElement.style.alignItems = 'baseline';
    that.DOMElement.style.justifyContent = 'flex-start';
    that.DOMElement.style.display = "grid";
    that._DOMElements.chartContainer.style.padding = '1em';

    // placeholder message
    let bs = document.createElement('h1');
    bs.style.width="max-content";
    bs.textContent = `${that._className} v${that._version} | work in progress`
    that.chartContainer = bs;

    // lets try making a coreValue object and see if we can do some stuff with it
    let btnTestCreate = document.createElement('button');
    btnTestCreate.textContent = 'noiceCoreValue.create()';
    btnTestCreate.addEventListener('click', (evt) => {
        that.coreValue = that.createCoreValue();
    });
    that._DOMElements.scanCage.appendChild(btnTestCreate);

    // let's try making a row
    let btnTestRow = document.createElement('button');
    btnTestRow.textContent = 'noiceCoreRow.create()';
    btnTestRow.addEventListener('click', (evt) => {
        that.coreRow = that.createCoreRow();
    });
    that._DOMElements.scanCage.appendChild(btnTestRow);

}




/*
    createCoreRow()
*/
createCoreRow(){
    try {
        let coreRow = new noiceCoreRow({
            rowData: {
                entryId:    '000000000000001',
                status:     "I'm Ready",
                createDate: 1712023281,
                user:       'sbsquarepants',
                subject:    'you forgot the pickles'
            },
            fieldConfig: {
                status: {
                    values: ["I'm Ready", "Open", "Closed"],
                    enforceMenuValues: true,
                    nullable: false
                },
                createDate: {
                    type: "TIME",
                    storeAs: 'epoch',
                    showAs: 'dateTimeLocale',
                    nullable: false
                },
                user: {
                    type: "AUID",
                    storeAs: "auid",
                    showAs: "full name",
                    nullable: false
                },
                subject: {
                    nullable: false
                },
                entryId: {
                    type: 'char',
                    maxLength: 15,
                    nullable: false
                }
            },
            saveOnChange: false,
            saveCallback: (rowData, selfRef) => {return(new Promise((toot, boot) => {
                // simulate saving
                console.log("fake saving! ...");
                setTimeout(() => { toot(rowData); }, 1000)
            }))},
        });
        return(coreRow);
    }catch(e){
        console.log(`createCoreRow() | object instantiation failed: ${e}`, e);
    }
}



/*
    createCoreValue()
*/
createCoreValue(){
    try {
        let coreValue = new noiceCoreValue({
            defaultValue: 'dork',
            nullable: false,
            editable: true,
            debug: true,
            validationStateChangeCallback: (hasErrors, hasWarnings, errors, slf) => {
                slf.log(`[validationStateChangeCallback]: errors: ${hasErrors} (${errors.filter((a)=>{return(a.severity=="error")}).length}), warnings: ${hasWarnings} (${errors.filter((a)=>{return(a.severity=="warning")}).length})`)
            },
            editableStateChangeCallback: (toBool, fromBool, slf) => {
                slf.log(`[editableStateChangeCallback] ${fromBool} -> ${toBool}`);
            },
            nullableStateChangeCallback: (toBool, fromBool, slf) => {
                slf.log(`[nullableStateChangeCallback] ${fromBool} -> ${toBool}`);
            },
            valueChangeCallback: (n, o, slf) => {
                return(new Promise((_t,_b) => {
                    slf.log(`[valueChangeCallback] ${o} -> ${n}`);
                    // demonstrate thine asyncrhony
                    setTimeout(() => { _t(n); }, 100);
                }));
            },
            valueChangedCallback: async (n, o, slf) => {
                slf.log(`[valueChangedCallback] ${o} -> ${n}`);
                return(n);
            }
        });
        return(coreValue)
    }catch(e){
        console.log(e);
    }
}


/*
    gainFocus()
    the UI is gaining focus from a previously unfocused state
*/
gainFocus(focusArgs){
    let that = this;
    return (new Promise(function(toot, boot){


        // be outa here wit ya badass ...
        toot(true);
    }));
}




/*
    losefocus(forusArgs)
    fires every time we gain focus
*/
loseFocus(focusArgs){
    let that = this;
    return(new Promise((toot, boot) => {

        // unbind the scanHandler from the keydown event
        if (that.scanListener instanceof Function){
            document.removeEventListener('keydown', that.scanListener);
            that.scanListener = null;
        }

        // toot unless you wanna abort, then boot
        toot(true);

    }));
}

}
export { dataClassDemo };
