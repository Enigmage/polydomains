import React, { useState } from "react";
import './styles/App.css';
import {ethers} from "ethers";
import {contractAddr as CONTRACT_ADDRESS} from './config';
import contractAbi from './contracts/Domains.sol/Domains.json';

const tld = '.scholar';

const Resolve: React.FC = () => {
  const [domain, setDomain] = useState('');

  const resolveDomain = async () => {
    // Don't run if the domain is empty
    if (!domain) { return }
    // Alert the user if the domain is too short
    if (domain.length < 3) {
      alert('Domain must be at least 3 characters long');
      return;
    }
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
        let record;
        record = await contract.getRecord(domain);
        console.log(record);
        if(record){
          window.open(record, '_blank');
        } else {
          alert("Domain not registered!");
        }

      }
    }
    catch(error){
      console.log(error);
    }
  }

  const renderInputForm = () =>{
		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>

				<div className="button-container">
					<button className='cta-button mint-button' disabled={undefined} onClick={resolveDomain}>
						Resolve
					</button>
				</div>

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
                <p className="subtitle">ENS on Polygon</p>
              </div>
          </header>
        </div>
        {renderInputForm()}
        <div className="footer-container"></div>
      </div>
    </div>
  );
};

export default Resolve;