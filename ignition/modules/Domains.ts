// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DomainsModule = buildModule("DomainsModule", m => {
  const domains = m.contract("Domains");

  const register = m.call(domains, "register", ["doom"]);

  const record = m.call(domains, "setRecord", [
    "doom",
    "https://github.com/Enigmage",
  ]);

  m.call(domains, "getRecord", ["doom"], { after: [register, record] });

  return { domains };
});

export default DomainsModule;
