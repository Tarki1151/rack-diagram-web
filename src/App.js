const App = () => {
  const [cabinets, setCabinets] = useState({});
  const [positions, setPositions] = useState({});
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState(null);
  const [gridSize, setGridSize] = useState(10); // Varsayılan 10x10 grid

  // ... (uploadFile ve handleDrag değişmedi)

  const handleGridChange = (e) => {
    setGridSize(parseInt(e.target.value));
  };

  return (
    <div className="app">
      <h1>Rack Diagram Web</h1>
      <UploadComponent setFile={setFile} uploadFile={uploadFile} errors={errors} />
      <div>
        <label htmlFor="gridSize">Snap-to-Grid Boyutu: </label>
        <select id="gridSize" value={gridSize} onChange={handleGridChange}>
          <option value={0}>Izgara Yok</option>
          <option value={5}>5x5</option>
          <option value={10}>10x10</option>
          <option value={15}>15x15</option>
        </select>
      </div>
      <div className="system-room">
        {Object.entries(cabinets).map(([cabinet, data]) => (
          <RackComponent
            key={cabinet}
            cabinet={cabinet}
            data={data}
            position={positions[cabinet]}
            handleDrag={handleDrag}
            gridSize={gridSize}
          />
        ))}
      </div>
    </div>
  );
};