// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import "hardhat/console.sol";
import "./lib/StringUtils.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Domains is ERC721URIStorage, ReentrancyGuard {
    string public tld;
    address payable public immutable owner;
    uint256 private _tokenIdCounter;

    constructor(
        string memory _tld
    ) payable ERC721("Scholar Name Service", "SNS") {
        owner = payable(msg.sender);
        tld = _tld;
        console.log("Top level domain: ", tld);
    }

    error Unauthorized();
    error AlreadyRegistered();
    error InvalidName(string name);
    error InsufficientPayment(uint required, uint provided);

    event DomainRegistered(string name, address indexed owner, uint256 tokenId);
    event DomainTransferred(
        string name,
        address indexed from,
        address indexed to
    );
    event DomainPurchased(
        string name,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 price
    );

    string svgPartOne =
        '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#B)" d="M0 0h270v270H0z"/><defs><filter id="A" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-10.081 6.032-6.85 3.934-10.081 6.032c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616c-.384-.665-.594-1.418-.608-2.187v-9.31c-.013-.775.185-1.538.572-2.208a4.25 4.25 0 0 1 1.625-1.595l7.884-4.59c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v6.032l6.85-4.065v-6.032c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595L41.456 24.59c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595c-.387.67-.585 1.434-.572 2.208v17.441c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l10.081-5.901 6.85-4.065 10.081-5.901c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v9.311c.013.775-.185 1.538-.572 2.208a4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616c-.385-.665-.594-1.418-.608-2.187v-6.032l-6.85 4.065v6.032c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l14.864-8.655c.657-.394 1.204-.95 1.589-1.616s.594-1.418.609-2.187V55.538c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="#fff"/><defs><linearGradient id="B" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="#cb5eee"/><stop offset="1" stop-color="#0cd7e4" stop-opacity=".99"/></linearGradient></defs><text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#A)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">';
    string svgPartTwo = "</text></svg>";

    struct Rental {
        address renter;
        uint256 endTime;
    }

    mapping(string => address) public domains;
    mapping(string => string) public records;
    mapping(uint => string) public names;
    mapping(string => Rental) public domainRentals;
    mapping(address => string[]) private userDomains;

    uint256 public constant MINIMUM_RENTAL_DURATION = 1 days;
    uint256 public constant MAXIMUM_RENTAL_DURATION = 365 days;

    uint256 public constant RENTAL_PRICE_PER_DAY = 0.01 ether;

    error RentalNotAvailable();
    error InvalidRentalDuration();
    error RentalAlreadyExists();

    event DomainRented(
        string name,
        address indexed renter,
        uint256 startTime,
        uint256 endTime
    );
    event RentalCanceled(string name, address indexed renter);

    modifier onlyOwner() {
        require(isOwner());
        _;
    }
    modifier checkPayment(string calldata name) {
        require(msg.value >= price(name), "Not enough Ether paid");
        _;
    }

    function topLevelDomain() public view returns (string memory) {
        return tld;
    }

    function price(string calldata name) public pure returns (uint) {
        uint len = StringUtils.strlen(name);
        require(len > 0);
        if (len == 3) {
            return 5 * 10 ** 17; // 0.5 ETH
        } else if (len == 4) {
            return 3 * 10 ** 17;
        } else {
            return 1 * 10 ** 17;
        }
    }

    function registerDomain(
        string calldata name
    ) public payable nonReentrant checkPayment(name) {
        if (domains[name] != address(0)) revert AlreadyRegistered();
        if (!valid(name)) revert InvalidName(name);

        string memory _name = string(abi.encodePacked(name, ".", tld));
        string memory finalSvg = string(
            abi.encodePacked(svgPartOne, _name, svgPartTwo)
        );

        uint256 newRecordId = _tokenIdCounter;
        uint256 length = StringUtils.strlen(name);
        string memory strLen = Strings.toString(length);

        console.log(
            "Registering %s.%s on the contract with tokenID %d",
            name,
            tld,
            newRecordId
        );

        string memory json = Base64.encode(
            abi.encodePacked(
                "{"
                '"name":"',
                _name,
                '", '
                '"description": "A domain for scholars",'
                '"image": "data:image/svg+xml;base64,',
                Base64.encode(bytes(finalSvg)),
                '", '
                '"length": "',
                strLen,
                '"'
            )
        );
        string memory finalTokenUri = string(
            abi.encodePacked("data:application/json;base64,", json)
        );

        console.log(
            "\n--------------------------------------------------------"
        );
        console.log("Final tokenURI", finalTokenUri);
        console.log(
            "--------------------------------------------------------\n"
        );

        _safeMint(msg.sender, newRecordId);
        _setTokenURI(newRecordId, finalTokenUri);
        domains[name] = msg.sender;
        userDomains[msg.sender].push(name);
        names[newRecordId] = name;

        _tokenIdCounter++;

        console.log("%s has registered a domain!", msg.sender);
        emit DomainRegistered(name, msg.sender, _tokenIdCounter);
    }

    function getDomainOwner(
        string calldata name
    ) public view returns (address) {
        return domains[name];
    }

    function setRecord(string calldata name, string calldata record) public {
        Rental memory currentRental = domainRentals[name];
        if (currentRental.endTime > block.timestamp) revert Unauthorized();
        if (msg.sender != domains[name]) revert Unauthorized();
        records[name] = record;
    }

    function getRecord(
        string calldata name
    ) public view returns (string memory) {
        return records[name];
    }

    function isOwner() public view returns (bool) {
        return msg.sender == owner;
    }

    function withdraw() public onlyOwner nonReentrant {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }

    function checkDomainAvailability(
        string calldata name
    ) public view returns (bool) {
        bool available = domains[name] == address(0);
        return available;
    }

    function valid(string calldata name) public pure returns (bool) {
        uint len = StringUtils.strlen(name);
        if (len < 3 || len > 15) {
            return false;
        }
        for (uint i = 0; i < len; i++) {
            uint8 charCode = uint8(bytes(name)[i]);
            if (charCode < 97 || charCode > 122) {
                return false;
            }
        }
        return true;
    }

    function transferDomain(string calldata name, address to) public {
        Rental memory currentRental = domainRentals[name];

        // Cannot transfer if domain is currently rented
        if (
            currentRental.renter != address(0) &&
            currentRental.endTime > block.timestamp
        ) revert Unauthorized();
        if (domains[name] != msg.sender) revert Unauthorized();
        require(to != address(0), "Cannot transfer to the zero address");

        address previousOwner = domains[name];

        uint tokenId = 0;
        for (uint i = 0; i < _tokenIdCounter; i++) {
            if (keccak256(bytes(names[i])) == keccak256(bytes(name))) {
                tokenId = i;
                break;
            }
        }

        _transfer(msg.sender, to, tokenId);

        domains[name] = to;
        userDomains[to].push(name);
        _removeDomainFromUser(msg.sender, name);
        emit DomainTransferred(name, previousOwner, to);
        console.log(
            "Domain %s transferred from %s to %s",
            name,
            msg.sender,
            to
        );
    }

    function rentDomain(
        string calldata name,
        uint256 rentalDays
    ) public payable nonReentrant {
        if (rentalDays < 1 || rentalDays > 365) revert InvalidRentalDuration();

        address domainOwner = domains[name];
        if (domainOwner == address(0)) revert InvalidName(name);

        Rental memory currentRental = domainRentals[name];
        if (
            currentRental.renter != address(0) &&
            currentRental.endTime > block.timestamp
        ) revert RentalNotAvailable();

        uint256 totalRentalCost = rentalDays * RENTAL_PRICE_PER_DAY;
        if (msg.value < totalRentalCost)
            revert InsufficientPayment(totalRentalCost, msg.value);

        domainRentals[name] = Rental({
            renter: msg.sender,
            endTime: block.timestamp + (rentalDays * 1 days)
        });

        emit DomainRented(
            name,
            msg.sender,
            block.timestamp,
            block.timestamp + (rentalDays * 1 days)
        );

        if (msg.value > totalRentalCost) {
            payable(msg.sender).transfer(msg.value - totalRentalCost);
        }
    }

    function cancelRental(string calldata name) public nonReentrant {
        Rental storage currentRental = domainRentals[name];

        if (currentRental.renter != msg.sender) revert Unauthorized();

        if (currentRental.endTime <= block.timestamp)
            revert RentalNotAvailable();

        emit RentalCanceled(name, msg.sender);

        delete domainRentals[name];
    }

    function isDomainAvailableForRent(
        string calldata name
    ) public view returns (bool) {
        Rental memory currentRental = domainRentals[name];

        // Check if domain exists and is not currently rented
        return (domains[name] != address(0) &&
            currentRental.endTime <= block.timestamp);
    }

    function getRentalDetails(
        string calldata name
    ) public view returns (address renter, uint256 endTime) {
        Rental memory currentRental = domainRentals[name];
        return (currentRental.renter, currentRental.endTime);
    }

    function getDomainsForUser(
        address user
    ) external view returns (string[] memory) {
        return userDomains[user];
    }

    function _removeDomainFromUser(address user, string memory name) internal {
        string[] storage domainsList = userDomains[user];
        for (uint256 i = 0; i < domainsList.length; i++) {
            if (
                keccak256(abi.encodePacked(domainsList[i])) ==
                keccak256(abi.encodePacked(name))
            ) {
                // Replace the removed domain with the last element
                domainsList[i] = domainsList[domainsList.length - 1];
                // Remove the last element
                domainsList.pop();
                break;
            }
        }
    }
}
