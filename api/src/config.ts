import { ethers } from "ethers";

import Domains from "../../contract/artifacts/contracts/Domains.sol/Domains.json";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const contractAddr = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

const walletPrivateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new ethers.Wallet(walletPrivateKey, provider);
// const contractABI = [
//   "function registerDomain(string name) public payable",
//   "function transferDomain(string name, address newOwner) public",
//   "function createSubdomain(string name, string subdomain) public",
//   "function renewDomain(string name) public payable",
//   "function getSubdomains(string name) public view returns (string[])",
// ];

const contract = new ethers.Contract(contractAddr, Domains.abi, wallet);

export { provider, contractAddr, contract };
