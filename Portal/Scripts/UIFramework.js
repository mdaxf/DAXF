var UI;
(function (UI) {
 /*
        common UI functions and classes
        Ajax Call
    */
        UI.CONTROLLER_URL = "api/ui";
        class Ajax {
            constructor(token) {
              this.token = token;
            }
          
            initializeRequest(method, url, stream) {
              return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open(method, `${url}`, true);                
                xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
                if (stream) {
                  xhr.responseType = 'stream';
                }
                xhr.onload = () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                  } else {
                    reject(xhr.statusText);
                  }
                };
                xhr.onerror = () => reject(xhr.statusText);
                xhr.onabort = () => reject('abort');
                xhr.send();
              });
            }
          
            get(url, stream) {
              return this.initializeRequest('GET', url, stream);
            }
          
            post(url, data) {
              return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${UI.CONTROLLER_URL}/${url}`, true);
                xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onload = () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                  } else {
                    reject(xhr.statusText);
                  }
                };
                xhr.onerror = () => reject(xhr.statusText);
                xhr.onabort = () => reject('abort');
                xhr.send(JSON.stringify(data));
              });
            }
          
            delete(url) {
              return this.initializeRequest('DELETE', url);
            }
          }
        UI.Ajax = Ajax;    
})(UI || (UI = {}));
(function (UI) {    
    function generateUUID(){
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;    
    }
    UI.generateUUID = generateUUID;

})(UI || (UI = {}));


(function (UI){



    class UISession{
        constructor(configurator){
            let defaultconfig = {
                "name": "ui-root",
                "level": 0
            }
            this.configurator = this.configurator || defaultconfig;

            this.stack = [];
            this.snapshoot ={
                "stack":[],
                "configurator":this.configurator,
                "sessionData":{},
                "immediateData":{}
            };
            this._item = {};
            this._inputs = {};
            this._outputs = {};
            this.model = {};
            this.children = [];
        }
        popFromStack(sliceIdx) {
            if (typeof (sliceIdx) !== "undefined") {
                this.stack = this.stack.slice(0, sliceIdx);
            }
            else if (this._item === this.stack[this.stack.length - 1])
                this.stack.pop();
            this._item = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
            if (this._item) {
                delete this._item.panelViews[UI.Layout.POPUP_PANEL_ID];
                this.model = this._item.model;
            }
            else {
                this.model = null;
            }
        }
        pushToStack(stackItem, replaceCurrentScreen) {
            if (stackItem.screenNavigationType === UI.NavigationType.Home)
                this.stack = [];
            if (stackItem.screenNavigationType !== UI.NavigationType.Immediate) {
                if (this.currentItem == null || this.stack.length === 0 || (this.stack[this.stack.length - 1].screenInstance !== stackItem.screenInstance && !replaceCurrentScreen))
                    this.stack.push(stackItem);
                else
                    this.stack[this.stack.length - 1] = stackItem;
            }
            this._item = stackItem;
        }
        joinSnapshoot(snapshoot) {
            Session.joinObject(this.snapshoot.sessionObject, snapshoot.sessionObject);
            Session.joinObject(this.snapshoot.immediateObject, snapshoot.immediateObject);
        }
    }
    UI.Session = UISession;

})(UI || (UI = {}));

(function (UI) {
  

    /*
        UI Stucture:
        UI - > Page -> Panels -> View

    */

    const unitStyle = {
        0: "%",
        1: "px",
    };
    const orientationClass = {
        0: "vertical",
        1: "horizontal",
        2: "floating",
    };
    class Panel{
        /*
            {
                name: "panel-name",
                orientation: 0, // 0: vertical, 1: horizontal, 2: floating  
                view: {
                    name: "view-name",
                    type: "view-type",
                    file: "view-content",
                    code: "view-code",
                    script: "view-script",
                    style: "view-style"
                } 

            }
        */
        constructor(page,configuration){
            this.page = page;
            this.configuration  = configuration;
            this.view = null;
            this.panel = null;
        }
        create(){
            this.panel = document.createElement("div");
            this.panel.className = "ui-panel";
            this.panel.classList.add(`panel_${this.configuration.name}`);
            this.panel.classList.add(orientationClass[this.configuration.orientation]);
            let paneliId = 'panel_'+UI.generateUUID();
            this.panel.setAttribute("id", paneliId);
            this.panel.id = paneliId;
            this.panelElement = this.panel;
            if(this.configuration.inlinestyle){
                this.panelElement.setAttribute("style", this.configuration.inlinestyle);
            }   
            this.displayview();
            this.page.pageElement.appendChild(this.panel);
            return this;
        }
        clear(){
            if(this.view)
                this.view.clear();

            this.panel.innerHTML = "";
        }
        changeview(view){
            this.clear();
            this.configuration.view = view;
            this.displayview();
        }
        displayview(){
            if(this.configuration.view){
                let view = new View(this,this.configuration.view);
                view.create();
                this.view = view;
            }
        }
    }
    class View{
        /*
            {
                name: "view-name",
                type: "view-type",
                content: "view-content",
                file: "view-content",
                code: "view-code",
                script: "view-script",
                style: "view-style"

            }

        */
        constructor(Panel, configuration){
            this.configuration = configuration;
            this.Panel = Panel; 
            this.id = 'view_'+UI.generateUUID();
        }
        clear(){
            const elements = document.querySelectorAll(`[viewID="${this.id}"]`);
            for (let i = 0; i < elements.length; i++) {
            elements[i].remove();
            }
        }
        create(){
            console.log(this, this.Panel.panelElement);
            if(this.configuration.content){                
                this.content = this.configuration.content;
               // this.htmlRewrite(this.Panel.panelElement, this.content);
                this.Panel.panelElement.innerHTML =this.content;
            }
            if(this.configuration.file)
                this.loadfile(this.configuration.file).then((response) => {    
                    this.content = response.data;
                  //  this.htmlRewrite(this.Panel.panelElement, this.content);
                     this.Panel.panel.innerHTML =this.content;
                }).catch((error) => {   
                    console.log(error);
                }) 
            if(this.configuration.script){
                this.loadfile(this.configuration.script).then((response) => {    
                    this.script = response.data;
                    this.createScriptContent(this.view.script);
                }).catch((error) => {   
                    console.log(error);
                })  
            }
            if(this.configuration.style){
                this.createStyleContent(this.configuration.style);                
            }  

            if(this.configuration.inlinestyle){
                this.Panel.panelElement.setAttribute("style", this.configuration.inlinestyle);
            }            
            return this;
        }
        async loadfile(file){
            UI.Ajax.get(file).then((response) => {
                return response;
            }).catch((error) => {
                console.log(error);
            })
        }
        createScript(path) {
            var s = document.createElement("script");
            s.src = path;
            s.setAttribute("viewid", this.id);
            document.head.appendChild(s);
            return s;
        }
        createScriptContent(Content) {
            var s = document.createElement("script");
            s.type = "text/javascript";
            s.setAttribute("viewid", this.id);
            s.textContent =Content;
            document.head.appendChild(s);
            return s;
        }
        createStyle(link) {
            var s = document.createElement("link");
            s.href = link;
            s.rel = "stylesheet";
            s.setAttribute("viewid", this.id);
            document.head.appendChild(s);
            return s;
        }
        createStyleContent(Content) {
            var s = document.createElement("style");
            s.setAttribute("type", "text/css");
            s.setAttribute("viewid", this.id);
            s.textContent  = Content;
            document.head.appendChild(s);
            return s;
        }
 
    }
    
    class Page{
            /*
            sample configuration
            {
                "name": "root page",
                "panels": [{
                        "name": "header",
                        "orientation": 1,
                        "view": {
                            "name": "generic header",
                            "type": "view-type",
                            "content": "<div> header content </div>",
                            "style": "{ \"background-color\": \"blue\", \"height\": \"20%\"}"
                        }
                    },
                    {
                        "name": "content",
                        "orientation": 1,
                        "view": {
                            "name": "generic header",
                            "type": "view-type",
                            "content": "<div> this is the content </div>",
                            "style": "{\"background-color\": \"blue\", \"height\": \"80%\"}"
                        }
                    }
                ]
            }
        */    
        constructor(configuration){
            this.configuration = configuration;
            this.page={};
            this.panels = [];
            const elements = document.getElementsByClassName('ui-page');
            for (let i = 0; i < elements.length; i++) {
                elements[i].remove();
            }
            this.create();
            console.log(this);
        }
        create(){
           // this.clear();
            let page = document.createElement("div");
            page.className = "ui-page";
            let id = 'page_'+UI.generateUUID();
            page.setAttribute("id", id);
            page.setAttribute("style", "width:100%;height:100%;position:absolute;top:0;left:0;")
            this.page.id = id;
            this.page.element = page;
            this.pageElement = page;
            this.buildpagepanels();
            document.body.appendChild(page);
            return page;
        }
        buildpagepanels(){
            this.page.panels = [];
            for (let i = 0; i < this.configuration.panels.length; i++) {
                let panel = new Panel(this,this.configuration.panels[i]);
                this.page.panel = panel.create();
                this.panels.push(panel);
            }
        }
        clear(){
            this.page.innerHTML = "";
            this.panels.each((panel) => {
                panel.clear();
            });
            this.panels = [];
            this.page={};
        }          

    }
    UI.Page = Page;

})(UI || (UI = {}));

(function (UI) {
    function startpage(pagefile){
        console.log(pagefile);
        let ajax = new UI.Ajax("");
        ajax.get(pagefile,false).then((response) => {
            console.log(response)
            let page = new UI.Page(JSON.parse(response));

            //page.create();            
        }).catch((error) => {
            console.log(error);
        })
    }
    UI.startpage = startpage;
    function startbyconfig(configuration){
        let page = new UI.Page(configuration);
        page.create();
    }
    UI.startbyconfig = startbyconfig;
})(UI || (UI = {}));

console.log("UI loaded");
console.log(UI.Ajax);

