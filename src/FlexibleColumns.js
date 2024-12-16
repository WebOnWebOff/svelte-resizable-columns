const DATA_API = 'flexibleColumns';
const DATA_COLUMNS_ID = 'flexible-columns-id';
const DATA_COLUMN_ID = 'flexible-column-id';
const DATA_TH = 'th';

const CLASS_TABLE_RESIZING = 'fc-table-resizing';
const CLASS_COLUMN_RESIZING = 'fc-column-resizing';
const CLASS_HANDLE = 'fc-handle';
const CLASS_HANDLE_NORESIZE = 'fc-handle-noresize';
const CLASS_HANDLE_CONTAINER = 'fc-handle-container';

const EVENT_RESIZE_START = 'column:resize:start';
const EVENT_RESIZE = 'column:resize';
const EVENT_RESIZE_STOP = 'column:resize:stop';

const SELECTOR_UNRESIZABLE = `[noresize]`;

function setWidthPx(element, width) {
    width = width.toFixed(2);
    width = width > 0 ? width : 0;
    element.style.width = width + 'px';
}

function setHeightPx(element, height) {
    height = height.toFixed(2);
    height = height > 0 ? height : 0;
    element.style.height = height + 'px';
}

function setLeftPx(element, left) {
    left = left.toFixed(2);
    left = left > 0 ? left : 0;
    element.style.left = left + 'px';
}

function getPointerX(event) {
    if (event.type.indexOf('touch') === 0) {
    return (event.originalEvent.touches[0] || event.originalEvent.changedTouches[0]).pageX;
    }
    return event.pageX;
}

function parseWidth(element) {
    return element ? parseFloat(element.style.width.replace('%', '').replace('px', '')) : 0;
}

function getActualWidth(element) {
    return element ? parseFloat(element.offsetWidth) : 0;
}

function indexOfElementInParent(el) {
    if(el && el.parentNode && el.parentNode.children) {
        const children = el.parentNode.children,
        numItems = children.length;
        for (let index = 0; index < children.length; index++) {
            const element = children[index];
            if(element === el) {
                return index;
            }
        }
    }
    return -1;
}

function isVisible(el) {
    return el && el.style &&
        el.style.display !== 'none' &&
        el.style.visible !== 'hidden' &&
        (!el.type || el.type !== 'hidden');
}

function FlexibleColumns(table, options) {  
    if(!table || !table.tagName || table.tagName !== 'TABLE') {
      console.error('The FlexibleColumns action applies only to table DOM elements.');
    }

    table.FlexibleColumns = this;
    this.options = Object.assign({}, FlexibleColumns.defaults, options);
    this.window = window;
    this.ownerDocument = table.ownerDocument;
    this.table = table;
    this.handleContainer;
    this.tableHeaders;
    
    this.syncHandleWidthsCallback = this.syncHandleWidths.bind(this);
    this.onPointerMoveCallback = this.onPointerMove.bind(this);
    this.onPointerUpCallback = this.onPointerUp.bind(this);
    this.onPointerDownCallback = this.onPointerDown.bind(this);
    this.onPointerMoveCallback = this.onPointerMove.bind(this);
    
    this.setTableMinWidth();
    this.refreshHeaders();
    this.restoreColumnWidths();
    this.syncHandleWidths();
    
    this.window.addEventListener('resize', this.syncHandleWidthsCallback);

    //TODO: find better solution; when table columns adjust after a delay,
    setTimeout(() => {
        this.syncHandleWidths();
        if(this.table) {
            this.table.dispatchEvent(
                new CustomEvent('flexible-columns-initiated', {
                    detail: { 
                        tableWidth: getActualWidth(this.table)
                    }
                })
            );    
        }  
    }, 2000);
  
  return {
    update({syncHandlers}) {
        this.syncHandleWidths();
    },
    destroy() {

        let self = table.FlexibleColumns;
        table.FlexibleColumns = null;

        let handles = self.handleContainer.querySelectorAll('.'+CLASS_HANDLE);

        self.window.removeEventListener('resize', self.syncHandleWidthsCallback);        
        handles.forEach(el => {
            el.removeEventListener('mousedown', self.onPointerDownCallback);
            el.removeEventListener('touchstart', self.onPointerDownCallback);
        });

        self.operation = null;
        self.handleContainer.parentNode.removeChild(self.handleContainer);
        self.handleContainer = null;
        self.tableHeaders = null;
        self.table = null;
        self.ownerDocument = null;
        self.window = null;
        self.options = null;
    }
  };  
}

FlexibleColumns.prototype = {
    setTableMinWidth: function() {
        let width = this.options.minWidthTable,
            table = this.table;

        if(this.options.minWidthTable && this.options.minWidthTable === 'parent') {
            width = table.parentNode.offsetWidth;
        } else {            
            if (!this.options.minWidthTable) {
                width = table.offsetWidth;
            }
        }
        //is minWidth above maxWidth? Use maxWidth
        if(this.options.maxWidthTable && this.options.maxWidthTable > 0) {
            width = Math.min(this.options.maxWidthTable, width);
        }
        //is table currently below minWidth? Use actual width
        width = Math.min(table.offsetWidth, width);
        this.options.minWidthTable = width;
    },
    createHandles: function() {
        let ref = this.handleContainer;
        if (ref != null) {
            ref.parentNode.removeChild(ref);
        }

        this.handleContainer = document.createElement('div');
        this.handleContainer.className = CLASS_HANDLE_CONTAINER;
        this.table.parentNode.insertBefore(this.handleContainer, this.table);

        for (let i = 0; i < (this.tableHeaders.length); i++) {
            const el = this.tableHeaders[i];
            
            let current = this.tableHeaders[i];
            // let next = this.tableHeaders[i + 1];


            let handle = document.createElement('div');            
            if (current.matches(SELECTOR_UNRESIZABLE)) {
                handle.className = CLASS_HANDLE_NORESIZE;
            } else {
                handle.className = CLASS_HANDLE;
            }
            this.handleContainer.appendChild(handle);
        };

        
        let handles = this.handleContainer.querySelectorAll('.'+CLASS_HANDLE);
        handles.forEach(el => {
            el.addEventListener('mousedown', this.onPointerDownCallback);
            el.addEventListener('touchstart', this.onPointerDownCallback);
        });
    },
    refreshHeaders: function() {
        // Allow the selector to be both a regular selctor string as well as
        // a dynamic callback
        let getHeaders = this.options.getHeaders;
        if(typeof getHeaders !== 'function') {
            console.error('FlexibleColumns: options.getHeaders requires a function that returns the list of headers');
            return;
        }
        this.tableHeaders = Array.from(getHeaders.call(null, this.table)).filter(el => isVisible(el));

        this.createHandles();
    },
    restoreTableWidth: function() {
        const tableId = this.options.getTableId && this.options.getTableId(this.table);
        if(tableId && this.options.store) {
            let width = parseFloat(this.options.store.get(
                this.options.storePrefix + tableId
            ));
            if(width) {
                width = Math.max(width, this.table.offsetWidth);
                setWidthPx(this.table, width);
            }
        }
    },
    restoreColumnWidths: function() {
        this.restoreTableWidth();
        this.tableHeaders.forEach((el) => {
            const columnId = this.options.getColumnId && this.options.getColumnId(this.table, el);
            if(columnId && this.options.store && !el.matches(SELECTOR_UNRESIZABLE)) {
                let width = parseFloat(this.options.store.get(
                    this.options.storePrefix + columnId
                ));
                if(width) {
                    setWidthPx(el, width);
                }
            }
        });
    },
    generateColumnId: function($el) {
        return this.table.data(DATA_COLUMNS_ID) + '-' + $el.data(DATA_COLUMN_ID);
    },
    constrainWidth: function(width) {
        if (this.options.minWidth != undefined) {
            width = Math.max(this.options.minWidth, width);
        }

        if (this.options.maxWidth != undefined) {
            width = Math.min(this.options.maxWidth, width);
        }

        return width;
    },
    constrainTableWidth: function(width) {
        if (this.options.minWidthTable) {
            width = Math.max(this.options.minWidthTable, width);
        }

        if (this.options.maxWidthTable) {
            width = Math.min(this.options.maxWidthTable, width);
        }

        return width;
    },
    validateNewWidths: function(colWidth, tableWidth) {
        return colWidth === this.constrainWidth(colWidth) &&
            tableWidth === this.constrainTableWidth(tableWidth);
    },
    saveColumnWidths: function() {
        this.saveTableWidth();
        this.tableHeaders.forEach((el) => {
            this.saveColumnWidth(el);
        });
    },
    saveTableWidth: function(el) {
        const tableId = this.options.getTableId && this.options.getTableId(this.table);
        if (tableId && this.options.store) {
            let newWidth = this.table.offsetWidth;
            // let newWidth = parseWidth(el);
            // if(isNaN(newWidth) || !newWidth) {
            //     newWidth = el.offsetWidth;
            // }

            this.options.store.set(
                this.options.storePrefix + tableId,
                newWidth
            );
        }
    },
    saveColumnWidth: function(el) {
        const columnId = this.options.getColumnId && this.options.getColumnId(this.table, el);
        if (columnId && this.options.store && !el.matches(SELECTOR_UNRESIZABLE)) {
            let newWidth = el.offsetWidth;
            // let newWidth = parseWidth(el);
            // if(isNaN(newWidth) || !newWidth) {
            //     newWidth = el.offsetWidth;
            // }

            this.options.store.set(
                this.options.storePrefix + columnId,
                newWidth
            );
        }
    },    
    syncHandleWidths: function() {
        let container = this.handleContainer;
        
        if(!container) {
            return;
        }

        setWidthPx(container, this.table.offsetWidth);

        let height = this.options.resizeFromBody ?
            this.table.offsetHeight :
            this.table.querySelector('thead').offsetHeight;

        container
        .querySelectorAll('div')
        // .querySelectorAll('.'+CLASS_HANDLE)
        .forEach((el, i) => {

            let header = this.tableHeaders[i];

            let left = header.clientWidth + (
                header.offsetLeft - this.handleContainer.offsetLeft
            ) + parseInt(getComputedStyle(this.handleContainer.parentNode).paddingLeft);

            setHeightPx(el, height);
            setLeftPx(el, left);
        });
    },
    onPointerDown: function(event) {
        // Only applies to left-click dragging
        if(event.which !== 1) { return; }

        // If a previous operation is defined, we missed the last mouseup.
        // Probably gobbled up by user mousing out the window then releasing.
        // We'll simulate a pointerup here prior to it
        if(this.operation) {
            this.onPointerUp(event);
        }

        // Ignore non-flexible columns
        let currentGrip = event.currentTarget;
        if(currentGrip.matches(SELECTOR_UNRESIZABLE)) {
            return;
        }

        let gripIndex = indexOfElementInParent(currentGrip);
        let column = this.tableHeaders[gripIndex];
        if(column && column.matches(SELECTOR_UNRESIZABLE)) {
            column = null;
        }

        let columnWidth = getActualWidth(column);
        let tableWidth = getActualWidth(this.table);

        this.operation = {
            column, currentGrip,
            table: this.table,

            startX: getPointerX(event),

            widths: {
                column: columnWidth,
                table: tableWidth
            },
            newWidths: {
                column: columnWidth,
                // right: rightWidth
                table: tableWidth
            }
        };

        this.ownerDocument.addEventListener('mousemove', this.onPointerMoveCallback);
        this.ownerDocument.addEventListener('touchmove', this.onPointerMoveCallback);
        this.ownerDocument.addEventListener('mouseup', this.onPointerUpCallback);
        this.ownerDocument.addEventListener('touchend', this.onPointerUpCallback);

        this.handleContainer.className += ` ${CLASS_TABLE_RESIZING}`;
        this.table.className += ` ${CLASS_TABLE_RESIZING}`;

        if(column) column.className += ` ${CLASS_COLUMN_RESIZING}`;
        currentGrip.className += ` ${CLASS_COLUMN_RESIZING}`;
        
        this.table.dispatchEvent(
            new CustomEvent('flexible-columns-start', {
            detail: { 
                column,
                columnWidth,
                tableWidth
             },
            })
        );

        event.preventDefault();
    },
    onPointerMove: function(event) {
        let op = this.operation;
        if(!this.operation) { return; }

        // Determine the delta change between start and new mouse position
        let difference = (getPointerX(event) - op.startX);
        if(difference === 0) {
            return;
        }

        let column = op.column;
        let table = this.table;
        let widthLeft, widthTable;

        if(difference !== 0) {
            widthLeft = op.widths.column + difference;
            widthTable = op.widths.table + difference;
        }

        if(!this.validateNewWidths(widthLeft, widthTable)) {
            return;
        }

        if(column) {
            setWidthPx(column, widthLeft);
        }

        if(table) {
            setWidthPx(table, widthTable);
        }

        op.newWidths.column = widthLeft;
        op.newWidths.table = widthTable;

        
        this.table.dispatchEvent(
            new CustomEvent('flexible-columns-move', {
            detail: { 
                column: op.column,
                columnWidth: widthLeft,
                tableWidth: widthTable
             },
            })
        );
    },
    onPointerUp: function(event) {
        let op = this.operation;
        if(!this.operation) { return; }

        this.ownerDocument.removeEventListener('mousemove', this.onPointerMoveCallback);
        this.ownerDocument.removeEventListener('touchmove', this.onPointerMoveCallback);
        this.ownerDocument.removeEventListener('mouseup', this.onPointerUpCallback);
        this.ownerDocument.removeEventListener('touchend', this.onPointerUpCallback);

        this.handleContainer.className = this.handleContainer.className.replace(' '+CLASS_TABLE_RESIZING, '');
        this.table.className = this.table.className.replace(' '+CLASS_TABLE_RESIZING, '');

        if(op.column) op.column.className = op.column.className.replace(' '+CLASS_COLUMN_RESIZING, '');
        op.currentGrip.className = op.currentGrip.className.replace(' '+CLASS_COLUMN_RESIZING, '');

        this.syncHandleWidths();
        this.saveColumnWidths();
        // this.saveColumnWidth(op.column);

        this.operation = null;

        
        this.table.dispatchEvent(
            new CustomEvent('flexible-columns-stop', {
            detail: { 
                column: op.column,
                // rightColumn: op.rightColumn,
                columnWidth: op.newWidths.column,
                tableWidth: op.newWidths.table
             },
            })
        );
    }
}

FlexibleColumns.constructor = FlexibleColumns;

FlexibleColumns.defaults = {
  getHeaders: function(table) {
    const thead = table.querySelector('thead');
    
    if(thead) {
        return thead.querySelectorAll('th');
    } else {
        const tr = table.querySelector('tr');
        return tr.querySelectorAll('td');
    }
  },
  getTableId: (table) => {
    return table && table.getAttribute('table-id');
  },
  getColumnId: (table, column) => {
    const tableId = table && table.getAttribute('table-id');
    const columnId = column && column.getAttribute('column-id');
    return [tableId, columnId].filter(Boolean).join('$');
  },
  store: {
    get: (id) => localStorage && localStorage.getItem(id),
    set: (id, val) => localStorage && localStorage.setItem(id, val),
  },
  syncHandlers: true,
  resizeFromBody: true,
  maxWidth: null,
  minWidth: 0.01,
  maxWidthTable: null,
  minWidthTable: 'parent',
  storePrefix: 'FlexibleColumns$'  
};

FlexibleColumns.count = 0;

export default function(node, options) {
    return new FlexibleColumns(node, options);
}
