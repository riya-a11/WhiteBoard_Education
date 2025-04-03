// In the startDrawing function:
function startDrawing(e) {
    if (currentTool === 'undo' || currentTool === 'redo' || currentTool === 'clear' || textInputActive) return;
    
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    
    // For shapes, store the initial position
    if (['rectangle', 'circle', 'line'].includes(currentTool)) {
        tempShape = {
            tool: currentTool,
            color: currentColor,
            x1: lastX,
            y1: lastY,
            x2: lastX, // Initialize with same position
            y2: lastY,
            lineWidth: currentLineWidth
        };
    } else if (currentTool === 'pencil' || currentTool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
    }
    
    socket.emit('cursorMove', { x: e.offsetX, y: e.offsetY, userId });
}

// In the draw function:
function draw(e) {
    if (!isDrawing) {
        socket.emit('cursorMove', { x: e.offsetX, y: e.offsetY, userId });
        return;
    }
    
    const x = e.offsetX;
    const y = e.offsetY;
    
    switch (currentTool) {
        case 'pencil':
            ctx.strokeStyle = currentColor;
            ctx.lineTo(x, y);
            ctx.stroke();
            break;
            
        case 'eraser':
            ctx.strokeStyle = '#ffffff';
            ctx.lineTo(x, y);
            ctx.stroke();
            break;
            
        case 'line':
        case 'rectangle':
        case 'circle':
            // Update the temporary shape
            tempShape.x2 = x;
            tempShape.y2 = y;
            
            // Redraw the whiteboard (to clear previous preview)
            redrawWhiteboard();
            
            // Draw the preview
            drawAction(tempShape, false);
            break;
    }
    
    [lastX, lastY] = [x, y];
    
    // Send drawing data for pencil/eraser only
    if (currentTool === 'pencil' || currentTool === 'eraser') {
        socket.emit('draw', {
            tool: currentTool,
            color: currentTool === 'pencil' ? currentColor : '#ffffff',
            x1: lastX,
            y1: lastY,
            x2: x,
            y2: y,
            lineWidth: currentLineWidth,
            userId
        });
    }
}

// In the stopDrawing function:
function stopDrawing(e) {
    if (!isDrawing || currentTool === 'text') return;
    
    const x = e.offsetX;
    const y = e.offsetY;
    
    if (['rectangle', 'circle', 'line'].includes(currentTool)) {
        // Finalize the shape
        const shape = {
            ...tempShape,
            x2: x,
            y2: y
        };
        
        // Add to history
        addToHistory(shape);
        
        // Send to server
        socket.emit('draw', shape);
        
        // Redraw to make it permanent
        redrawWhiteboard();
    } else if (currentTool === 'pencil' || currentTool === 'eraser') {
        ctx.closePath();
    }
    
    isDrawing = false;
    tempShape = null;
}
