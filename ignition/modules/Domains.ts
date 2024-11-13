// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DomainsModule = buildModule("DomainsModule", m => {
  const domains = m.contract("Domains");

  m.call(domains, "getAddress", ["doom"]);
  m.call(domains, "register", ["doom"]);

  return { domains };
});

export default DomainsModule;
