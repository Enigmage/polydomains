import { expect } from "chai";
import hre from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Domains", () => {
  it("should set the right top level domain", async () => {
    const expectedTld = "scholar";
    const domain = await hre.ethers.deployContract("Domains", ["scholar"]);

    expect(await domain.topLevelDomain()).to.equal(expectedTld);
  });

  it("should set the domain for sender and return the owner for domain", async () => {
    const [deployer, _] = await hre.ethers.getSigners();
    const sampleDomain = "doom";
    const factory = await hre.ethers.getContractFactory("Domains");
    const domain = await factory.deploy("doom");
    await domain.waitForDeployment();

    const txn = await domain.connect(deployer).registerDomain(sampleDomain);
    await txn.wait();

    const ownerOfDomain = await domain.getDomainOwner(sampleDomain);
    console.log(`Domain ${sampleDomain} owned by ${ownerOfDomain}`);

    expect(ownerOfDomain).to.equal(deployer.address);
  });
});
