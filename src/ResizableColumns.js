import './resizableColumns.css';

const DATA_API = 'resizableColumns';
const DATA_COLUMNS_ID = 'resizable-columns-id';
const DATA_COLUMN_ID = 'resizable-column-id';
const DATA_TH = 'th';

const CLASS_TABLE_RESIZING = 'rc-table-resizing';
const CLASS_COLUMN_RESIZING = 'rc-column-resizing';
const CLASS_HANDLE = 'rc-handle';
const CLASS_HANDLE_CONTAINER = 'rc-handle-container';

const EVENT_RESIZE_START = 'column:resize:start';
const EVENT_RESIZE = 'column:resize';
const EVENT_RESIZE_STOP = 'column:resize:stop';

const SELECTOR_UNRESIZABLE = `[data-noresize]`;

function setWidth(element, width) {
    width = width.toFixed(2);
    width = width > 0 ? width : 0;
    element.style.width = width + '%';
}

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
    return element ? parseFloat(element.style.width.replace('%', '')) : 0;
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

function ResizableColumns(table, options) {  
    if(!table || !table.tagName || table.tagName !== 'TABLE') {
      console.error('The ResizableColumns action applies only to table DOM elements.');
    }

    this.options = Object.assign({}, ResizableColumns.defaults, options);
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
    
    this.refreshHeaders();
    this.restoreColumnWidths();
    this.syncHandleWidths();
    
    // bindEvents(this.window, 'resize', this.syncHandleWidths.bind(this));
    this.window.addEventListener('resize', this.syncHandleWidthsCallback);
  
  return {
    update(value) {

    },
    destroy() {
        let $table = this.table;
        let handles = this.handleContainer.querySelectorAll('.'+CLASS_HANDLE);

        this.window.removeEventListener('resize', this.syncHandleWidthsCallback);        
        handles.forEach(el => {
            el.removeEventListener('mousedown', this.onPointerDownCallback);
            el.removeEventListener('touchstart', this.onPointerDownCallback);
        });

        this.operation = null;
        this.handleContainer.parentNode.removeChild(this.handleContainer);
        this.handleContainer = null;
        this.tableHeaders = null;
        this.table = null;
        this.ownerDocument = null;
        this.window = null;
        this.options = null;

        return $table;
    }
  };  
}

ResizableColumns.prototype = {
    createHandles: function() {
        let ref = this.handleContainer;
        if (ref != null) {
            ref.parentNode.removeChild(ref);
        }

        this.handleContainer = document.createElement('div');
        this.handleContainer.className = CLASS_HANDLE_CONTAINER;
        this.table.parentNode.insertBefore(this.handleContainer, this.table);

        for (let i = 0; i < (this.tableHeaders.length-1); i++) {
            const el = this.tableHeaders[i];
            
            let current = this.tableHeaders[i];
            let next = this.tableHeaders[i + 1];

            if (!next || current.matches(SELECTOR_UNRESIZABLE) || next.matches(SELECTOR_UNRESIZABLE)) {
                return;
            }

            let handle = document.createElement('div');
                handle.className = CLASS_HANDLE;
            this.handleContainer.appendChild(handle);
        };

        
        let handles = this.handleContainer.querySelectorAll('.'+CLASS_HANDLE);
        handles.forEach(el => {
            el.addEventListener('mousedown', this.onPointerDownCallback);
            el.addEventListener('touchstart', this.onPointerDownCallback);
        });
    },
    assignPercentageWidths: function() {
        this.tableHeaders.forEach((el, _) => {
            setWidth(el, el.offsetWidth / this.table.offsetWidth * 100);
        });
    },
    refreshHeaders: function() {
        // Allow the selector to be both a regular selctor string as well as
        // a dynamic callback
        let getHeaders = this.options.getHeaders;
        if(typeof getHeaders !== 'function') {
            console.error('ResizableColumns: options.getHeaders requires a function that returns the list of headers');
            return;
        }
        this.tableHeaders = Array.from(getHeaders.call(null, this.table)).filter(el => isVisible(el));

        // Assign percentage widths first, then create drag handles
        this.assignPercentageWidths();
        this.createHandles();
    },
    restoreColumnWidths: function() {
        this.tableHeaders.forEach((el, _) => {

        if(this.options.store && !el.matches(SELECTOR_UNRESIZABLE)) {
            let width = this.options.store.get(
                this.generateColumnId(el)
            );

            if(width != null) {
                setWidth(el, width);
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
    saveColumnWidths: function() {
        this.tableHeaders.forEach((el, _) => {

        if (this.options.store && !el.matches(SELECTOR_UNRESIZABLE)) {
            this.options.store.set(
                this.generateColumnId(el),
                parseWidth(el)
            );
        }
        });
    },    
    syncHandleWidths: function() {
        let container = this.handleContainer;

        setWidthPx(container, this.table.offsetWidth);

        let height = this.options.resizeFromBody ?
            this.table.offsetHeight :
            this.table.querySelector('thead').offsetHeight;

        container
        .querySelectorAll('.'+CLASS_HANDLE)
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

        // Ignore non-resizable columns
        let currentGrip = event.currentTarget;
        if(currentGrip.matches(SELECTOR_UNRESIZABLE)) {
        return;
        }

        let gripIndex = indexOfElementInParent(currentGrip);
        let leftColumn = this.tableHeaders[gripIndex];
        if(leftColumn && leftColumn.matches(SELECTOR_UNRESIZABLE)) {
            leftColumn = null;
        }
        let rightColumn = this.tableHeaders[gripIndex + 1];        
        if(rightColumn && rightColumn.matches(SELECTOR_UNRESIZABLE)) {
            rightColumn = null;
        }

        let leftWidth = parseWidth(leftColumn);
        let rightWidth = parseWidth(rightColumn);

        this.operation = {
            leftColumn, rightColumn, currentGrip,

            startX: getPointerX(event),

            widths: {
                left: leftWidth,
                right: rightWidth
            },
            newWidths: {
                left: leftWidth,
                right: rightWidth
            }
        };

        this.ownerDocument.addEventListener('mousemove', this.onPointerMoveCallback);
        this.ownerDocument.addEventListener('touchmove', this.onPointerMoveCallback);
        this.ownerDocument.addEventListener('mouseup', this.onPointerUpCallback);
        this.ownerDocument.addEventListener('touchend', this.onPointerUpCallback);

        this.handleContainer.className += ` ${CLASS_TABLE_RESIZING}`;
        this.table.className += ` ${CLASS_TABLE_RESIZING}`;

        leftColumn.className += ` ${CLASS_COLUMN_RESIZING}`;
        rightColumn.className += ` ${CLASS_COLUMN_RESIZING}`;
        currentGrip.className += ` ${CLASS_COLUMN_RESIZING}`;
        
        this.table.dispatchEvent(
            new CustomEvent('resize-columns-start', {
            detail: { 
                leftColumn,
                rightColumn,
                leftWidth,
                rightWidth
             },
            })
        );

        event.preventDefault();
    },
    onPointerMove: function(event) {
        let op = this.operation;
        if(!this.operation) { return; }

        // Determine the delta change between start and new mouse position, as a percentage of the table width
        let difference = (getPointerX(event) - op.startX) / this.table.offsetWidth * 100;
        if(difference === 0) {
            return;
        }

        let leftColumn = op.leftColumn;
        let rightColumn = op.rightColumn;
        let widthLeft, widthRight;

        if(difference > 0) {
            widthLeft = this.constrainWidth(op.widths.left + (op.widths.right - op.newWidths.right));
            widthRight = this.constrainWidth(op.widths.right - difference);
        }
        else if(difference < 0) {
            widthLeft = this.constrainWidth(op.widths.left + difference);
            widthRight = this.constrainWidth(op.widths.right + (op.widths.left - op.newWidths.left));
        }

        if(leftColumn) {
            setWidth(leftColumn, widthLeft);
        }
        if(rightColumn) {
            setWidth(rightColumn, widthRight);
        }

        op.newWidths.left = widthLeft;
        op.newWidths.right = widthRight;

        
        this.table.dispatchEvent(
            new CustomEvent('resize-columns-move', {
            detail: { 
                leftColumn: op.leftColumn,
                rightColumn: op.rightColumn,
                leftWidth: widthLeft,
                rightWidth: widthRight
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

        op.leftColumn.className = op.leftColumn.className.replace(' '+CLASS_COLUMN_RESIZING, '');
        op.rightColumn.className = op.rightColumn.className.replace(' '+CLASS_COLUMN_RESIZING, '');
        op.currentGrip.className = op.currentGrip.className.replace(' '+CLASS_COLUMN_RESIZING, '');

        this.syncHandleWidths();
        this.saveColumnWidths();

        this.operation = null;

        
        this.table.dispatchEvent(
            new CustomEvent('resize-columns-stop', {
            detail: { 
                leftColumn: op.leftColumn,
                rightColumn: op.rightColumn,
                leftWidth: op.newWidths.left,
                rightWidth: op.newWidths.right
             },
            })
        );
    }
}

ResizableColumns.constructor = ResizableColumns;

ResizableColumns.defaults = {
  getHeaders: function(table) {
    const thead = table.querySelector('thead');
    
    if(thead) {
        return thead.querySelectorAll('th');
    } else {
        const tr = table.querySelector('tr');
        return tr.querySelectorAll('td');
    }
  },
  store: window.store,
  syncHandlers: true,
  resizeFromBody: true,
  maxWidth: null,
  minWidth: 0.01
};

ResizableColumns.count = 0;

export default function(node, options) {
    return new ResizableColumns(node, options);
}