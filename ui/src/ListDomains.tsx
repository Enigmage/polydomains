import React, { useEffect, useState } from "react";
import './styles/App.css';
import {ethers} from "ethers";
import { CONTRACT_ADDRESS } from "./config";
import contractAbi from './contracts/Domains.sol/Domains.json';
const tld = ".scholar"

const ListDomains: React.FC = () => {
  const [domains, setDomains] = useState(Array<string>);

  const listRegisteredDomains = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
  
        const account = await signer.getAddress();
        console.log("Connected account:", account);
  
        const domainsProxy = await contract.getDomainsForUser(account);

        const domains: string[] = Array.from(domainsProxy);
  
        console.log("Registered domains:", domains);

        setDomains(domains);
      }
    } catch (error) {
      console.log("Error fetching domains:", error);
    }
  };

  useEffect(()=>{
    listRegisteredDomains();
  }, []);

  const renderOutput = () =>{
    return (
        <div>
          <ul>
            {domains.length > 0 ? (
              domains.map((domain, index) => (
                <li key={index}>{domain}{tld}</li>
              ))
            ) : (
              <li>No domains registered</li>
            )}
          </ul>
        </div>
      );
	}

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
              <div className="left">
                <p className="title">PolyDomains</p>
                <p className="subtitle">SNS on Hardhat</p>
              </div>
          </header>
        </div>
            <div className="output-container">
                {renderOutput()}
            </div>
      </div>
    </div>
  );
};

export default ListDomains;