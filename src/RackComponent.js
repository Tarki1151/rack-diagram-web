const RackComponent = ({ cabinet, data, position, handleDrag, gridSize }) => {
  // ... (diğer kodlar değişmedi)

  const draggableRef = React.createRef();

  return (
    <Draggable
      position={position}
      onDrag={(e, data) => handleDrag(cabinet, e, data)}
      nodeRef={draggableRef}
      grid={gridSize > 0 ? [gridSize, gridSize] : undefined} // Izgara Yok için grid devre dışı
    >
      <div className="rack" ref={draggableRef}>
        <h3>{cabinet}</h3>
        <Stage width={200} height={600}>
          {/* ... (içerik değişmedi) */}
        </Stage>
      </div>
    </Draggable>
  );
};