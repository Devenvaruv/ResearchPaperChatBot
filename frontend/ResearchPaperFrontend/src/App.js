import React, { useState } from 'react';
import axios from 'axios';

function App() {

  const [pdfFile, setPdfFile] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([]);

  const handleFileChange = (event) => {
    setPdfFile(event.target.files[0]);
  };

  const handleInputChange = (event) => {
    setChatInput(event.target.value);
  }

  const handleUpload = async () => {
    if(!pdfFile) {
      alert("Please select a file");
      return;
    }
  

    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('index', 'test');

    try {
      const response = await axios.post('http://localhost:8080/api/upload-pdf', formData);
      alert(response.data);
    } catch (error) {
      console.log("error uploading: " , error);
      alert("failed to upload pdf.");
    }
  }

  return (
    <div className="App">
      <h2>"PLACEHOLDER PLACEHOLDER"</h2>
      <h3>"PLACEHOLDER LOREM"</h3>
      <div>
        <input type="file" accept=".pdf" onChange={handleFileChange}/>
        <button style={{ margineLeft: '10px'}}> Upload PDF</button>
      </div>

      <div>
        {chatLog.map((entry, index) => (
          <div key={index} style={{ margin: '10px 0'}}>
            <strong>{entry.sender === 'user' ? 'You' : 'Bot'}:</strong> {entry.message}
          </div>  
        ))}
      </div>

      <form >
        <input type="text" value={chatInput} onChange={handleInputChange}
        placeholder="Type your message..."
        style={{ flex: '1', padding: '10px', marginRight: '10px'}}
        />
        <button type="submit" style={{ padding: '10px 20px'}}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
