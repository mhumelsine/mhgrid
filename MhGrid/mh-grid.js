var temp = {
    'firstName': {
        display:'First Name',
        type:'text',
        href:function(d){}
    }
};

(function ($) {
    $.fn.mhgrid = function (template, options) {
        var id = 0;
        var rootElementId = $(this).attr('id');

        if (rootElementId === undefined) {
            id++;
            rootElementId = 'mh-grid-' + id;
            $(this).attr('id', rootElementId);
        }
            
        return new Grid(rootElementId);


        //CELL
        function Cell(containerType) {
            this.cellType = 'td';
            this.containerType = containerType;
        }
        Cell.prototype.create = function (display, propName, href) {
            var cell = helpers.create(this.containerType);

            if (href) {
                cell.attr('href', href(propName));
            }
            cell.text(displayValue);

            if (propName) {
                cell.data('propName', propName);
            }
            return helpers.create(this.cellType).append(cell);
        }
        function HeaderCell(containerType) {
            Cell.call(this, containerType);
            this.cellType = 'th';
        }
        HeaderCell.prototype = Object.create(Cell.prototype);
        HeaderCell.prototype.constructor = HeaderCell;

        //GRID
        function Grid(rootElementId) {
            //public props
            this.data; //should be populated on refresh()



            //private props
            var props, //object properties
            enums = {
                sortDirection: {
                    ASC: 'asc',
                    DESC: 'desc'
                }
            },
            templates = {
                headerLink: helpers.create('a').addClass('mh-grid-header-link'),
                pagingLink: helpers.create('a').addClass('mh-grid-page-link'),
                prevNextButton: helpers.create('button').addClass('mh-grid-btn'),
                grid: "<div class='mh-grid-grid-wrapper'><table id='__this__-mh-grid-grid' class='mh-grid-gird'><thead id='__this__-mh-grid-headers'></thead><tbody id='__this__-mh-grid-data'></tbody><tfoot></tfoot></table><div></div></div>"
            },
            helpers = {
                tagify: function (tagName) {
                    return '<' + tagName + '>';
                },
                getId: function (id) {
                    return root.grid + '-' + id;
                },
                create: function (elementType) {
                    return $(helpers.tagify(elementType));
                },
                pagination: {
                    linkCount: 25,
                    pageSize: 15,
                    itemCount: 0,
                    totalPages: 0,
                    page: 1,
                    orderBy: '',
                    sortDirection: enums.sortDirection.ASC,
                    prevLink: templates.pagingLink.clone()
                                .text(settings.prevMarker)
                                .on('click', function () {
                                    goToPage(helpers.pagination.page - 1);
                                }),
                    nextLink: templates.pagingLink.clone()
                                .text(settings.nextMarker)
                                .on('click', function () {
                                    goToPage(helpers.pagination.page + 1);
                                })
                },
                sort: {
                    date: function (x, y) { return newDate(x).getTime() - newDate(y).getTime(); },
                    number: function (x, y) { return x - y; },
                    text: undefined //default sort behavior
                }
            },
            root = {
                grid: helpers.create(templates.grid.replace(/__this__/g, rootElementId)),
                headers: $(rootElementId + '-mh-grid-headers'),
                pagination: $(rootElementId + '-mh-pagination'),
                data: $(rootElementId + '-mh-grid-data'),
            },
            settings = $.extend({
                pagination: {
                    prevMarker: '<',
                    nextMarker: '>',
                    initialOrderByColumn: undefined
                }
            }, options);

            function buildDataRow(obj) {
                var row = helpers.create('tr'),
                    cell = new Cell('div');

                for (var i = 0; i < props.length; i++) {
                    row.append(
                        helpers.create('div').addClass('col-label').text(props[i].display),
                        cell.create(obj[props[i]] || ' ', props[i], props[i].href));
                }
            }

            function buildHeaderRow() {
                var row = helpers.create('tr'),
                    header = new HeaderCell('a');

                for (var i = 0; i < props.length; i++) {
                    row.append(header.create(props[i].display, props[i]));
                }
            }

            this.clear = function (all) {
                if (all) {
                    for (prop in root) {
                        root[prop].empty();
                    }
                } else {
                    root.data.empty();
                }
            }

            function buildPaginationLink(pageNumber) {
                return templates.pagingLink
                    .clone()
                    .data('page', pageNumber);
            }
            function buildPagination() {
                root.pagination.empty();

                //toggle prev / next
                if (helpers.pagination.page > 1) {
                    root.pagination.append(helpers.pagination.prevLink);
                }

                var last = helpers.pagination.totalPages;

                if (helpers.pagination.totalPages > helpers.pagination.linkCount) {
                    last = helpers.pagination.page + helpers.pagination.linkCount;
                    if (last > helpers.pagination.totalPages) {
                        last = helpers.pagination.totalPages - 1;
                    }
                }
                root.pagination.append(helpers.pagination.prevLink);
                root.pagination.append(buildPaginationLink(1));
                for (var i = helpers.pagination.page; i <= last; i++) {
                    root.pagination.append(buildPaginationLink(i));
                }
                root.pagination.append(buildPaginationLink(helpers.pagination.totalPages));

                if (helpers.pagination.page < helpers.pagination.totalPages) {
                    root.pagination.append(helpers.pagination.nextLink);
                }
                //add selected
                root.pagination.find('[data-page="' + helpers.pagination.page + '"]').addClass('selected');

                //add listener
                root.pagination.find('a.mh-grid-page-link').on('click', function () {
                    e.preventDefault();
                    var page = e.data('page');
                    if (helpers.pagination.page !== page) {
                        goToPage(page);
                    }
                });
            }
            function goToPage(pageNumber) {
                if (pageNumber === helpers.pagination.page) {
                    //nothing to do
                    return;
                }

                helpers.pagination.page = pageNumber;
                clear();
                sort();

                var start = (helpers.pagination.page - 1) * helpers.pagination.totalPages,
                    stop = start + helpers.pagination.pageSize;

                //check for overrun
                if (stop > data.length) {
                    stop = data.length;
                }

                //add data to table
                for (var i = start; i < stop; i++) {
                    root.data.append(buildDataRow(data[i]));
                }
                buildPagination();
            }
            function sort() {
                var sorted = [],
                    vals = [];

                for (var i = 0; i < data.length; i++) {
                    vals[i] = data[i][helpers.pagination.orderBy];
                }

                vals.sort(helpers.sort(props[helpers.pagination.orderBy].type));

                if (helpers.pagination.sortDirection === enums.sortDirection.DESC) {
                    vals.reverse();
                }

                for (var i = 0; i < vals.length; i++) {
                    for (var j = 0; j < data.length; j++) {
                        if (vals[i] === data[j][helpers.pagination.orderBy]) {
                            sorted.push(data[j]);
                            data.splice(j, i);
                            break;
                        }
                    }
                }
                data = sorted;
                vals = null;
            }          
            this.refreshInternal = function () {
                var p = helpers.pagination;
                p.itemCount = this.data.length;
                p.orderBy = settings.initialOrderByColumn || keys[0];

                if (this.data.length === 0) {
                    clear();
                    p.totalPages = 0;
                } else {
                    p.totalPages = Math.ceil(p.itemCount / p.pageSize);
                    this.goToPage(1);
                }

                if (typeof callback === 'function') {
                    callback();
                }
            }
            function init() {
                if (Object.keys) {
                    props = Object.keys(template);
                } else {
                    props = [];
                    for (prop in template) {
                        props.push(prop);
                    }
                }
                $('#' + rootElementId).empty().append(root.grid);
            }
            return this;
        }
        Grid.prototype.refresh = function (data, callback) {
            if (data === undefined) {
                //throw new Error(0001, 'Data cannot be undefined');
            } else {
                this.data = data;
                this.refreshInternal();
            }
        }
    };
})(jQuery);
