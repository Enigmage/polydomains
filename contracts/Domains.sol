// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.27;

import "hardhat/console.sol";

contract Domains {
    string public tld;

    mapping(string => address) public domains;
    mapping(string => string) public records;

    constructor(string memory _tld) payable {
        tld = _tld;
        console.log("Top level domain: ", tld);
    }

    function topLevelDomain() public view returns (string memory) {
        return tld;
    }

    function registerDomain(string calldata name) public {
        domains[name] = msg.sender;
        console.log("%s has registered a domain!", msg.sender);
    }

    function getDomainOwner(
        string calldata name
    ) public view returns (address) {
        return domains[name];
    }

    function setRecord(string calldata name, string calldata record) public {
        require(domains[name] == msg.sender);
        records[name] = record;
    }

    function getRecord(
        string calldata name
    ) public view returns (string memory) {
        return records[name];
    }
}
