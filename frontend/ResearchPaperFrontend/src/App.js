import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import firebaseApp from './firebase';
import { getAuth, signInWithRedirect, GoogleAuthProvider, getRedirectResult, signInWithPopup } from "firebase/auth";



function App() {

  const [pdfFile, setPdfFile] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [userId, setUserId] = useState("");

  const [index, setIndex] = useState('test');
  const [namespace, setNamespace] = useState('namespac');

  

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth(firebaseApp);
    try {
      const result = await signInWithPopup(auth, provider);
      setUserId(result.user);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }

    signInWithRedirect(auth, provider);
  };

  useEffect(() => {
    const auth = getAuth(firebaseApp);

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("User signed in via redirect:", result.user);
          setUserId(result.user.uid);
        } else {
          console.log("No user returned from redirect result");
        }
      })
      .catch((error) => console.error("Sign-in error:", error));

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        console.log("User is signed in:", user);
        setUserId(user.uid);
      } else {
        // No user is signed in.
        console.log("No user is signed in.");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (event) => {
    setPdfFile(event.target.files[0]);
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();

    if(!chatInput.trim()) {
      return;
    }
  
    setChatLog([...chatLog, { sender: 'user', message: chatInput}]);
  
    try {
      const formData = new URLSearchParams();
      formData.append('index', index);
      formData.append('text', chatInput);
      formData.append('namespace', namespace);

      const response = await axios.post('http://localhost:8080/api/search', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      setChatLog((prevLog) => [...prevLog, { sender: 'bot', message: response.data }]);
    } catch (error) {
      console.log('ERROR: ' , error );
      setChatLog((prevLog) => [
        ...prevLog,
        { sender: 'bot', message: 'Error: Unable to get a response.' },
      ]);
    }

    setChatInput('');
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
    formData.append('index', index);

    try {
      const response = await axios.post('http://localhost:8080/api/upload-pdf', formData);
      alert(response.data);
    } catch (error) {
      console.log("error uploading: " , error);
      alert("failed to upload pdf.");
    }
    
  }

  return (
    <>
    {!userId ? (<button type="button" onClick={signInWithGoogle}>
          Sign in with Google
          {userId}
        </button>) : (
    <div className="app-container">
      <h2 className="app-title">Research Paper Assistant</h2>
      <h3 className="app-subtitle">Current Paper</h3>
      <div>
        <input type="file" accept=".pdf" onChange={handleFileChange} className="upload-input"/>
        <button className="upload-button" onClick={handleUpload} style={{ marginLeft: '10px'}}> Upload PDF</button>
      </div>

      <div className="chat-container">

      <div className="chat-log">
        {chatLog.map((entry, index) => (
          <div key={index} style={{ textAlign: entry.sender === 'user' ? 'right' : 'left',margin: '10px 0'}}>
            <strong>{entry.sender === 'user' ? 'You' : 'Bot'}:</strong> {entry.message}
          </div>  
        ))}
      </div>

      <form className= "chat-input-form" onSubmit={handleChatSubmit} >
        <input className= "chat-input" type="text" value={chatInput} onChange={handleInputChange}
        placeholder="Type your message..."
        style={{ flex: '1', padding: '10px', marginRight: '10px'}}
        />
        <button className="chat-submit-button" type="submit" style={{ padding: '10px 20px'}}>
          Send
        </button>
      </form>
    </div>
            
    </div>) }
    </>
  );
}

export default App;
