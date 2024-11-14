import React, { useEffect } from "react";
import './styles/App.css';

const App: React.FC = () => {

  const checkIfWalletIsConnected = () => {
    // First make sure we have access to window.ethereum
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
  }

  // Create a function to render if wallet is not connected yet
  const renderNotConnectedContainer = () => (
    <div className="connect-wallet-container">
      <img src="https://media.giphy.com/media/3ohhwytHcusSCXXOUg/giphy.gif" alt="Ninja gif" /> <br/>
      <button className="cta-button connect-wallet-button">
        Connect Wallet
      </button>
    </div>
  );

  // This runs our function when the page loads.
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
              <p className="title">PolyDomains</p>
              <p className="subtitle">ENS on Polygon</p>
          </header>
        </div>
        {renderNotConnectedContainer()}
        <div className="footer-container">
        </div>
      </div>
    </div>
  );
};

export default App;