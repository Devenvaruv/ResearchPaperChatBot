import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import firebaseApp from "./firebase";
import {
  getAuth,
  signInWithRedirect,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
} from "firebase/auth";

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [quiz, setQuiz] = useState([]);

  const [userId, setUserId] = useState("");

  const [researchPapers, setResearchPapers] = useState([]);
  const [index, setIndex] = useState("u-74505");
  const [namespace, setNamespace] = useState("p-34987");

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const auth = getAuth(firebaseApp);
    try {
      const result = await signInWithPopup(auth, provider);
      setUserId(result.user.uid);
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
        setIndex("u-" + hashCode(user.uid));
        getResearchPaper();
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

  const handleGenerateQuiz = async () => {
    try {
      const formData = new URLSearchParams();
      formData.append("index" , index);
      formData.append("namespace", namespace);

      const response = await axios.post(
        "http://localhost:8080/api/generate-quiz",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      console.log("FFFFF");

      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  const getResearchPaper = async (event) => {
    
    try {
      const apiKey = "";
      const apiVersion = "2024-10";
      

      const url = `https://${index}-wi5mspm.svc.aped-4627-b74a.pinecone.io/describe_index_stats`
      
      
      const response = await axios.get(url, {
        headers: {
          'Api-Key': apiKey,
          'X-Pinecone-API-Version': apiVersion,
        },
      });
      console.log("deven: " , response);   
      const namespaces = response.data.namespaces;
      const papersArr = Object.keys(namespaces);
      setResearchPapers(papersArr)

      console.log("Papers: ", papersArr); 
    } catch (error) {
      console.log("ERROR: ", error);
      
    }
    console.log(researchPapers)

  }

  const handleChatSubmit = async (event) => {
    event.preventDefault();

    if (!chatInput.trim()) {
      return;
    }

    setChatLog([...chatLog, { sender: "user", message: chatInput }]);

    try {
      const formData = new URLSearchParams();
      formData.append("index", index);
      formData.append("text", chatInput);
      formData.append("namespace", namespace);

      const response = await axios.post(
        "http://localhost:8080/api/search",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      setChatLog((prevLog) => [
        ...prevLog,
        { sender: "bot", message: response.data },
      ]);
    } catch (error) {
      console.log("ERROR: ", error);
      setChatLog((prevLog) => [
        ...prevLog,
        { sender: "bot", message: "Error: Unable to get a response." },
      ]);
    }

    setChatInput("");
  };

  const handleInputChange = (event) => {
    setChatInput(event.target.value);
  };

  const handleUpload = async () => {

    if (!pdfFile) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("index", index);
    formData.append("namespace", "p-" + hashCode(pdfFile.name));

    try {
      const response = await axios.post(
        "http://localhost:8080/api/upload-pdf",
        formData
      );
      alert(response.data);
    } catch (error) {
      console.log("error uploading: ", error);
      alert("failed to upload pdf.");
    }

    const formData2 = new FormData();
    formData2.append("text", "p-" + hashCode(pdfFile.name));
    formData2.append("index", index);
    formData2.append("namespace", "papers");
    formData2.append("metaData", pdfFile.name);

    try {
      const response2 = await axios.post(
        "http://localhost:8080/api/update-paper-list",
        formData2
      );
      alert(response2.data)
    } catch (error) {
      console.log("error uploading: ", error);
      alert("error" , error);
    }

    getResearchPaper();

    setNamespace("p-" + hashCode(pdfFile.name));
    
  };

  function hashCode(str) {
    let hash = 0, i, chr;

    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }

    hash = Math.abs(hash) % 100000;
    return hash.toString().padStart(5, "0");
  }

  return (
    <>
      {!userId ? (
        <div className="login-page">
          <div className="login-container">
            <h1 className="login-title">
              Welcome to the Research Paper Assistant
            </h1>
            <p className="login-subtitle">
              {" "}
              A Better way to understand your research
            </p>
            <button
              className="login-button"
              type="button"
              onClick={signInWithGoogle}
            >
              <i className="google-icon"></i>Sign in with Google
            </button>
          </div>
        </div>
      ) : (
        <div className="app-container">
          <h2 className="app-title">Research Paper Assistant</h2>
          <h3 className="app-subtitle">Current Paper</h3>
          <div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="upload-input"
            />
            <button
              className="upload-button"
              onClick={handleUpload}
              style={{ marginLeft: "10px" }}
            >
              {" "}
              Upload PDF
            </button>
          </div>

          <div>
            {researchPapers.map((paper, index) => (
              <button
                key={index}
                onClick={() => {
                  setNamespace(paper);
                  setChatLog([]);
                }}
              >
                {paper}
              </button>
            ))}
          </div>

          <button onClick={handleGenerateQuiz}>Quiz!</button>
          {quiz.length > 0 && (
            <div>
              <h3>Quiz Time!</h3>
              {quiz.map((question, qIndex) => (
                <div key={qIndex}>
                  <p>{question.question}</p>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex}>
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        value={option}
                      />
                      <label>{option}</label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="chat-container">
            <div className="chat-log">
              {chatLog.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    textAlign: entry.sender === "user" ? "right" : "left",
                    margin: "10px 0",
                  }}
                >
                  <strong>{entry.sender === "user" ? "You" : "Bot"}:</strong>{" "}
                  {entry.message}
                </div>
              ))}
            </div>

            <form className="chat-input-form" onSubmit={handleChatSubmit}>
              <input
                className="chat-input"
                type="text"
                value={chatInput}
                onChange={handleInputChange}
                placeholder="Type your message..."
                style={{ flex: "1", padding: "10px", marginRight: "10px" }}
              />
              <button
                className="chat-submit-button"
                type="submit"
                style={{ padding: "10px 20px" }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
