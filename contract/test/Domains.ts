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

    const sampleDomain = "scholar";
    const domain = await hre.ethers.deployContract("Domains", [sampleDomain]);
    await domain.waitForDeployment();

    const txn = await domain
      .connect(deployer)
      .registerDomain(sampleDomain, { value: hre.ethers.parseEther("0.1") });
    await txn.wait();

    const ownerOfDomain = await domain.getDomainOwner(sampleDomain);
    console.log(`Domain ${sampleDomain} owned by ${ownerOfDomain}`);

    expect(ownerOfDomain).to.equal(deployer.address);
  });
  it("should set record for one domain", async () => {
    const [deployer, randomPerson] = await hre.ethers.getSigners();
    const sampleDomain = "aviral";
    const sampleTLD = "scholar";
    const domain = await hre.ethers.deployContract("Domains", [sampleTLD]);
    await domain.waitForDeployment();

    // domain registered
    const txn = await domain
      .connect(deployer)
      .registerDomain(sampleDomain, { value: hre.ethers.parseEther("0.1") });
    await txn.wait();

    await domain.connect(deployer).setRecord(sampleDomain, "some data");
    const data = await domain.getRecord(sampleDomain);
    console.log(`The data is ${data}`);

    try {
      await domain
        .connect(randomPerson)
        .setRecord(sampleDomain, "conflicting data");
    } catch (e) {
      console.log("Cannot set record for existing domain...");
    }
  });
  it("should register a domain, set multiple records, and resolve those records", async () => {
    const [deployer] = await hre.ethers.getSigners();

    const sampleTopLevelDomain = "scholar";
    const sampleDomain = "aviral";
    const domain = await hre.ethers.deployContract("Domains", [
      sampleTopLevelDomain,
    ]);
    await domain.waitForDeployment();

    const txn = await domain
      .connect(deployer)
      .registerDomain(sampleDomain, { value: hre.ethers.parseEther("0.1") });
    await txn.wait();

    const ownerOfDomain = await domain.getDomainOwner(sampleDomain);
    console.log(`Domain ${sampleDomain} owned by ${ownerOfDomain}`);
    expect(ownerOfDomain).to.equal(deployer.address);

    const recordValue1 = "avrialtiwari.com";

    await domain.connect(deployer).setRecord(sampleDomain, recordValue1);

    const resolvedRecord1 = await domain.getRecord(sampleDomain);
    console.log(`Record for ${sampleDomain}: ${resolvedRecord1}`);
    expect(resolvedRecord1).to.include(recordValue1);
  });
});
