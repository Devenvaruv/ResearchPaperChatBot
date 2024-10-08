import React, { useState } from 'react';

function App() {

  const [pdfFile, setPdfFile] = useState(null);

  const handleFileChange = (event) => {
    setPdfFile(event.target.files[0]);
  };

  return (
    <div className="App">
      <h2>"PLACEHOLDER PLACEHOLDER"</h2>
      <h3>"PLACEHOLDER LOREM"</h3>
      <div>
        <input type="file" accept=".pdf" onChange={handleFileChange}/>
        <button style={{ margineLeft: '10px'}}> Upload PDF</button>
      </div>
    </div>
  );
}

export default App;
