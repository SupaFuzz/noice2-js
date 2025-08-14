/*
    noiceMezoAPI.js
    this extends noicePGRestAPI to implement Mezo specific
    functions n such
*/
'use strict';
import { noicePGRestAPI } from './noicePGRestAPI.js';
import { noiceException } from './noiceCore.js';

class noiceMezoAPI extends noicePGRestAPI {




/*
    constructor({
        protocol:   http | https (default https)
        server:     <hostname>
        port:       <portNumber> (optionally specify a nonstandard port number)
    })
*/
constructor (args){
    super(args, {
        _version:   1,
        _className: 'noiceMezoAPI',
        debug: false,
        protocol: 'https',
        proxyPath: null,
        token: null
    });
} // end constructor




/*
    putFile({
        fileName: <str>,
        data: <Uint8Array>,
        progressCallback: <function(receivedBytes, totalBytes, completeBool)>
        dbSchema: <str, optional: default 'mezo'>
    })

    create a record on mezo.files with the specified fileName
    and binary data. If progressCallback is speciufied call it with progress info

    if progressCallback is specified, we're gonna swap to the older hxr-based fetch()
    else we're just gonna use the new thing. I suppose when someday fetch API gets progress
    event support we can remove the switch, yo
*/
putFile(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            args.hasOwnProperty('fileName') &&
            that.isNotNull(args.fileName) &&
            (args.data instanceof Uint8Array)
        ){
            if (args.progressCallback instanceof Function){

                // old school hotness with upload progress
                that.fetch({
                    endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/rpc/put_file`,
                    method: 'POST',
                    expectHtmlStatus: 200,
                    responseType: 'text',
                    content: args.data,
                    headers: {
                      'Authorization': `Bearer ${that.token}`,
                      'Content-Type': 'application/octet-stream',
                      'Content-Profile': args.hasOwnProperty('dbSchema')?args.dbSchema:'mezo',
                      'X-filename': args.fileName
                    },
                    uploadProgressCallback: (evt) => {
                        if ((evt.lengthComputable) && (! isNaN(parseInt(evt.loaded))) && (! isNaN(parseInt(evt.total)))){
                            args.progressCallback(parseInt(evt.loaded), parseInt(evt.total), false);
                        }
                    }
                }).then((resp) => {
                    toot({id: resp.responseText});
                }).catch((error) => {
                    boot(new noiceException({
                        messageNumber: 400,
                        messageType: 'server',
                        message: `rest call failed: ${error}`,
                        thrownBy: `${that._className} v${that._version} | putFile()`,
                        args: args,
                        errorObject: error
                    }));
                });

            }else{
                // new school and works in node, but no progress
                that.apiFetch({
                    endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/rpc/put_file`,
                    method: 'POST',
                    expectHtmlStatus: 200,
                    responseType: 'text',
                    headers: {
                      'Authorization': `Bearer ${that.token}`,
                      'Content-Type': 'application/octet-stream',
                      'Content-Profile': args.hasOwnProperty('dbSchema')?args.dbSchema:'mezo',
                      'X-filename': args.fileName
                    },
                    body: new Blob([args.data], { type: 'application/octet-stream' })
                }).then((r) => {
                    toot({id: r});
                }).catch((error) => {
                    boot(new noiceException({
                        messageNumber: 400,
                        messageType: 'server',
                        message: `rest call failed: ${error}`,
                        thrownBy: `${that._className} v${that._version} | putFile()`,
                        args: args,
                        errorObject: error
                    }));
                });
            }

        }else{
            boot(new noiceException({
                messageNumber: 400,
                messageType: 'internal',
                message: `invalid input`,
                thrownBy: `${that._className} v${that._version} | putFile()`,
                args: args
            }));
        }
    }));
}




/*
    getFile({
        fileName:           <str>,
        getData:            <bool, default: true> // TO-DO
        progressCallback:   <function(receivedBytes, totalBytes, completeBool)>
        schemaName:         <str optional, default: 'mezo'>
        matchField:         <str optional, default: 'name'>
    })

    fetch the specified file_id from mezo.files
    returning this datastructure:
    {
        type: <mimeType>,
        file_name: <str>,
        size: <int>,
        last_modified: <date>,
        data: <Uint8Array>
    }

    if getData is false, do not include the 'data' key above

    if progressCallback is specified call that with progress info as data is retrieved

    NOTE: getData is still to-do ... actually might be better modeled as a
    getFileMeta or something I dunno
*/
getFile(args){
    let that = this;
    return(new Promise((toot, boot) => {
        if (
            (args instanceof Object) &&
            args.hasOwnProperty('fileName') &&
            that.isNotNull(args.fileName)
        ){

            if ( args.hasOwnProperty('getData') && (args.getData === false) ){

                // just get the meta and return the struct without the data attribute on it
                this.getRows({
                    table: `${args.hasOwnProperty('schemaName')?args.schemaName:'mezo'}.files`,
                    field_list: ['type', 'name', 'modified_date', 'size'],
                    query: `${args.hasOwnProperty('matchField')?args.matchField:'name'}=eq.${args.fileName}`
                }).then((r) => {
                    if ((r instanceof Array) && (r.length > 0)){
                        toot({
                            type: r[0].type,
                            file_name: r[0].name,
                            size: r[0].size,
                            last_modified: r[0].modified_date
                        });
                    }else{
                        // boot no response
                        boot(new noiceException({
                            messageNumber: 404,
                            messageType: 'server',
                            message: `rest call failed: ${error}`,
                            thrownBy: `${that._className} v${that._version} | getFile() | getData: false | no match on fileName`,
                            args: args,
                            errorObject: error
                        }));
                    }
                }).catch((error) => {
                    // boot rest call failed
                    boot(new noiceException({
                        messageNumber: 400,
                        messageType: 'server',
                        message: `rest call failed: ${error}`,
                        thrownBy: `${that._className} v${that._version} | getFile() | getData: false`,
                        args: args,
                        errorObject: error
                    }));
                });

            }else{
                // do ieeet
                let fetchArgs = {
                    endpoint: `${that.protocol}://${that.server}:${that.port}/${that.isNotNull(that.proxyPath)?that.proxyPath:''}/rpc/get_file?${args.hasOwnProperty('matchField')?args.matchField:'name'}=${args.fileName}`,
                    method: 'GET',
                    expectHtmlStatus: 200,
                    responseType: 'headersAndBuffer',
                    headers: {
                      'Authorization': `Bearer ${that.token}`,
                      'Accept': 'application/octet-stream',
                      'Accept-Profile': args.hasOwnProperty('schemaName')?args.schemaName:'mezo'
                    }
                }
                if (args.progressCallback instanceof Function){ fetchArgs.progressCallback = args.progressCallback; }
                that.apiFetch(fetchArgs).then((resp) => {
                    if (
                        (resp instanceof Object) &&
                        resp.hasOwnProperty('headers') &&
                        resp.hasOwnProperty('buffer')
                    ){
                        toot({
                            type: resp.headers.get('Content-Type'),
                            file_name: resp.headers.get('X-Filename'),
                            size: resp.headers.get('Content-Length'),
                            last_modified: resp.headers.get('X-filedate'),
                            data: resp.buffer
                        });
                    }else{
                        // error: unknown server response
                        boot(new noiceException({
                            messageNumber: 422,
                            messageType: 'internal',
                            message: `cannot parse server response, missing headers or payload`,
                            thrownBy: `${that._className} v${that._version} | getFile()`,
                            args: args
                        }));
                    }
                }).catch((error) => {
                    boot(new noiceException({
                        messageNumber: 400,
                        messageType: 'server',
                        message: `rest call failed: ${error}`,
                        thrownBy: `${that._className} v${that._version} | getFile()`,
                        args: args,
                        errorObject: error
                    }));
                });
            }
        }else{
            boot(new noiceException({
                messageNumber: 400,
                messageType: 'internal',
                message: `invalid input`,
                thrownBy: `${that._className} v${that._version} | getFile()`,
                args: args
            }));
        }
    }));
}




}
export { noiceMezoAPI };
