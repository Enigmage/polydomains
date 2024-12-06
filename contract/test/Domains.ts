import { expect } from "chai";
import hre from "hardhat";
import { Domains } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Domains Contract Tests", () => {
  let domain: Domains;
  let deployer: HardhatEthersSigner;
  let randomPerson: HardhatEthersSigner;
  let anotherPerson: HardhatEthersSigner;
  const sampleTLD = "scholar";
  const sampleDomain = "aviral";

  beforeEach(async () => {
    [deployer, randomPerson, anotherPerson] = await hre.ethers.getSigners();
    domain = await hre.ethers.deployContract("Domains", [sampleTLD]);
    await domain.waitForDeployment();

    // Register the domain first
    const txn = await domain
      .connect(deployer)
      .registerDomain(sampleDomain, { value: hre.ethers.parseEther("0.1") });
    await txn.wait();
  });

  // Existing tests remain mostly the same...
  it("should set the right top-level domain", async () => {
    const expectedTld = "scholar";
    expect(await domain.topLevelDomain()).to.equal(expectedTld);
  });

  // Modified tests to account for rental functionality
  it("should prevent setting record during an active rental", async () => {
    // Rent the domain
    const rentalTxn = await domain
      .connect(randomPerson)
      .rentDomain(sampleDomain, 10, {
        value: hre.ethers.parseEther("0.1"),
      });
    await rentalTxn.wait();

    // Try to set record as domain owner during rental
    await expect(
      domain.connect(deployer).setRecord(sampleDomain, "some data")
    ).to.be.revertedWithCustomError(domain, "Unauthorized");
  });

  it("should prevent domain transfer during an active rental", async () => {
    // Rent the domain
    const rentalTxn = await domain
      .connect(randomPerson)
      .rentDomain(sampleDomain, 10, {
        value: hre.ethers.parseEther("0.1"),
      });
    await rentalTxn.wait();

    // Try to transfer domain during rental
    await expect(
      domain
        .connect(deployer)
        .transferDomain(sampleDomain, anotherPerson.address)
    ).to.be.revertedWithCustomError(domain, "Unauthorized");
  });

  // Rental Functionality Tests
  describe("Domain Rental", () => {
    it("should allow renting an available domain", async () => {
      // Check initial availability
      const initialAvailability = await domain.isDomainAvailableForRent(
        sampleDomain
      );
      expect(initialAvailability).to.be.true;

      // Rent the domain
      const rentalTxn = await domain
        .connect(randomPerson)
        .rentDomain(sampleDomain, 10, {
          value: hre.ethers.parseEther("0.1"),
        });
      await rentalTxn.wait();

      // Check rental details
      const [renter, endTime] = await domain.getRentalDetails(sampleDomain);
      expect(renter).to.equal(randomPerson.address);
      expect(endTime).to.be.gt(0);

      // Check availability
      const availabilityAfterRental = await domain.isDomainAvailableForRent(
        sampleDomain
      );
      expect(availabilityAfterRental).to.be.false;
    });

    it("should prevent renting an already rented domain", async () => {
      // First rental
      const firstRentalTxn = await domain
        .connect(randomPerson)
        .rentDomain(sampleDomain, 10, {
          value: hre.ethers.parseEther("0.1"),
        });
      await firstRentalTxn.wait();

      // Try to rent again
      await expect(
        domain.connect(anotherPerson).rentDomain(sampleDomain, 5, {
          value: hre.ethers.parseEther("0.1"),
        })
      ).to.be.revertedWithCustomError(domain, "RentalNotAvailable");
    });

    it("should allow canceling an ongoing rental", async () => {
      // Rent the domain
      const rentalTxn = await domain
        .connect(randomPerson)
        .rentDomain(sampleDomain, 10, {
          value: hre.ethers.parseEther("0.1"),
        });
      await rentalTxn.wait();

      // Cancel rental
      const cancelTxn = await domain
        .connect(randomPerson)
        .cancelRental(sampleDomain);
      await cancelTxn.wait();

      // Check availability
      const availabilityAfterCancel = await domain.isDomainAvailableForRent(
        sampleDomain
      );
      expect(availabilityAfterCancel).to.be.true;

      // Verify rental details are cleared
      const [renter, endTime] = await domain.getRentalDetails(sampleDomain);
      expect(renter).to.equal(hre.ethers.ZeroAddress);
      expect(endTime).to.equal(0);
    });

    it("should prevent canceling a rental by non-renter", async () => {
      // Rent the domain
      const rentalTxn = await domain
        .connect(randomPerson)
        .rentDomain(sampleDomain, 10, {
          value: hre.ethers.parseEther("0.1"),
        });
      await rentalTxn.wait();

      // Try to cancel by another address
      await expect(
        domain.connect(anotherPerson).cancelRental(sampleDomain)
      ).to.be.revertedWithCustomError(domain, "Unauthorized");
    });

    it("should reject rental with insufficient payment", async () => {
      // Try to rent with insufficient payment
      await expect(
        domain.connect(randomPerson).rentDomain(sampleDomain, 10, {
          value: hre.ethers.parseEther("0.01"),
        })
      ).to.be.revertedWithCustomError(domain, "InsufficientPayment");
    });

    it("should reject rental with invalid duration", async () => {
      // Try to rent with too short duration
      await expect(
        domain.connect(randomPerson).rentDomain(sampleDomain, 0, {
          value: hre.ethers.parseEther("0.1"),
        })
      ).to.be.revertedWithCustomError(domain, "InvalidRentalDuration");

      // Try to rent with too long duration
      await expect(
        domain.connect(randomPerson).rentDomain(sampleDomain, 366, {
          value: hre.ethers.parseEther("0.1"),
        })
      ).to.be.revertedWithCustomError(domain, "InvalidRentalDuration");
    });

    it("should prevent renting a non-existent domain", async () => {
      await expect(
        domain.connect(randomPerson).rentDomain("nonexistent", 10, {
          value: hre.ethers.parseEther("0.1"),
        })
      ).to.be.revertedWithCustomError(domain, "InvalidName");
    });
  });

  // Existing tests remain the same...
  it("should allow the owner to withdraw funds", async function() {
    // Register additional domains to accumulate funds
    const additionalDomainTxn = await domain
      .connect(randomPerson)
      .registerDomain("another", { value: hre.ethers.parseEther("1") });
    await additionalDomainTxn.wait();

    // Rent a domain to add more funds
    const rentalTxn = await domain
      .connect(anotherPerson)
      .rentDomain(sampleDomain, 10, {
        value: hre.ethers.parseEther("0.1"),
      });
    await rentalTxn.wait();

    let ownerBalance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(
      "Balance of owner before withdrawal:",
      hre.ethers.formatEther(ownerBalance)
    );

    const withdrawTxn = await domain.connect(deployer).withdraw();
    await withdrawTxn.wait();

    const contractBalance = await hre.ethers.provider.getBalance(
      domain.getAddress()
    );
    ownerBalance = await hre.ethers.provider.getBalance(deployer.address);

    console.log(
      "Contract balance after withdrawal:",
      hre.ethers.formatEther(contractBalance)
    );
    console.log(
      "Balance of owner after withdrawal:",
      hre.ethers.formatEther(ownerBalance)
    );

    expect(contractBalance).to.equal(0n);
  });
});
