mouse = function (impactDistance, cutDistance, slpy, slp_ftr) {
    this.influenceDistance = impactDistance;
    this.cuttingDistance = cutDistance;
    this.slippy = slpy;
    this.slipFactor = slp_ftr;
    this.x = 0;
    this.y = 0;
    this.currentDrag = { x: 0, y: 0 };
    this.clickX = 0;
    this.clickY = 0;
    this.dragX = 0;
    this.dragY = 0;
    this.key = 0;
    this.heldnodes = [];
    this.dragBox = null;
    this.dragBoxBoundaries = { left: 0, right: 0, top: 0, buttom: 0 };
};

mouse.prototype.touches = function (node) {
    if (node.pinned)
        return false;
    if (this.hasDragBox)
        return node.isInBox(this.dragBoxBoundaries.left, this.dragBoxBoundaries.right, this.dragBoxBoundaries.top, this.dragBoxBoundaries.buttom)
    else
        return this.cursorDistanceTo(node) <= this.influenceDistance;
};

mouse.prototype.grabs = function (node) {
    return this.clickDistanceTo(node) <= this.influenceDistance;
};

mouse.prototype.cuts = function (node) {
    return this.cursorDistanceTo(node) <= this.cuttingDistance;
};

mouse.prototype.cursorDistanceTo = function (node) {
    return Math.sqrt(Math.pow(node.clientX - this.x, 2) + Math.pow(node.clientY - this.y, 2));
};

mouse.prototype.clickDistanceTo = function (node) {
    return Math.sqrt(Math.pow(node.clientX - this.clickX, 2) + Math.pow(node.clientY - this.clickY, 2));
};

mouse.prototype.updateDragBoxBoundaries = function () {
    this.dragBoxBoundaries.left = this.dragBox.offsetLeft;
    this.dragBoxBoundaries.right = this.dragBox.offsetLeft + this.dragBox.offsetWidth;
    this.dragBoxBoundaries.top = this.dragBox.offsetTop;
    this.dragBoxBoundaries.buttom = this.dragBox.offsetTop + this.dragBox.offsetHeight;
};

Object.defineProperties(mouse.prototype, {
    isUp: { get: function () { return this.key === 0 } },
    hasDragBox: { get: function () { return this.dragBox !== null } },
});

bindMouseHandlers = function () {

    pyGrid.canvas.oncontextmenu = function (contextEvent) { contextEvent.preventDefault(); };

    pyGrid.onmousedown = function (mouseDownEvent) {
        pyGrid.mouse.key = mouseDownEvent.which;
        pyGrid.mouse.clickX = mouseDownEvent.x;
        pyGrid.mouse.clickY = mouseDownEvent.y;
        if (mouseDownEvent.target == pyGrid.canvas) {
            if (pyGrid.mouse.key == 1) {
                if (pyGrid.mouse.slippy) {

                } else {
                    graph.nodes.forEach(function (p) {
                        if (pyGrid.mouse.grabs(p)) {
                            p.heldByMouse = true;
                            p.positionAtClickX = p.x;
                            p.positionAtClickY = p.y;
                            pyGrid.mouse.heldnodes.push(p);
                        }
                    });
                }
            }
            if (pyGrid.mouse.key == 2) graph.nodes.forEach(function (p) {
                if (pyGrid.mouse.grabs(p)) p.pin();
            });
        } else if (mouseDownEvent.target.className == 'dragbox') {
            pyGrid.mouse.dragBox = mouseDownEvent.target;
            pyGrid.mouse.updateDragBoxBoundaries();  // Caching for performance reasons!
        }
        mouseDownEvent.preventDefault();
    };

    pyGrid.onmousemove = function (moveEvent) {
        var currentDragStartX = pyGrid.mouse.x;
        var currentDragStartY = pyGrid.mouse.y;
        pyGrid.mouse.x = moveEvent.pageX;
        pyGrid.mouse.y = moveEvent.pageY;
        pyGrid.mouse.currentDrag.x = pyGrid.mouse.x - currentDragStartX;
        pyGrid.mouse.currentDrag.y = pyGrid.mouse.y - currentDragStartY;
        if (pyGrid.mouse.key == 1) {
            if (pyGrid.mouse.hasDragBox) {
                pyGrid.mouse.dragBox.style.left = pyGrid.mouse.dragBox.offsetLeft + pyGrid.mouse.currentDrag.x + "px";
                pyGrid.mouse.dragBox.style.top = pyGrid.mouse.dragBox.offsetTop + pyGrid.mouse.currentDrag.y + "px";
                pyGrid.mouse.updateDragBoxBoundaries();  // Caching for performance reasons!
            }
            // var affectedNodes = pyGrid.mouse.slippy ? graph.nodes : pyGrid.mouse.heldnodes;
            if (pyGrid.mouse.slippy) {
                graph.nodes.forEach(function (p) {
                    if (pyGrid.mouse.touches(p)) {
                        p.x += pyGrid.mouse.currentDrag.x * pyGrid.mouse.slipFactor;
                        p.y += pyGrid.mouse.currentDrag.y * pyGrid.mouse.slipFactor;
                    }
                });
            } else {
                pyGrid.mouse.heldnodes.forEach(function (p) {
                    p.x += pyGrid.mouse.currentDrag.x;
                    p.y += pyGrid.mouse.currentDrag.y;
                    p.speed.x = { x: 0, y: 0, z: 0 };   // For nodes affected by mouse, there's no inertia nor previous speed!
                });
            }
        }

        moveEvent.preventDefault();
    };

    pyGrid.onmouseup = function (releaseEvent) {
        pyGrid.mouse.heldnodes.forEach(function (p) { p.heldByMouse = false });
        pyGrid.mouse.dragX = releaseEvent.x - pyGrid.mouse.clickX;
        pyGrid.mouse.dragY = releaseEvent.y - pyGrid.mouse.clickY;
        pyGrid.mouse.key = 0;
        pyGrid.mouse.heldnodes = [];
        pyGrid.mouse.dragBox = null;
        releaseEvent.preventDefault();
    };
}
