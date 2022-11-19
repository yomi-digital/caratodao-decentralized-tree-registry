// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Base64.sol";

contract CaratoDaoRegistry is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Tree {
        string status;
        string coordinates;
        string plantingDate;
        string details;
    }

    mapping(uint256 => Tree) private _trees;
    mapping(address => bool) public _members;
    uint256 private _round;
    uint256 public _active_members;

    constructor() ERC721("CaratoTrees", "CTT") {
        _active_members = 1;
        _members[msg.sender] = true;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        Tree memory tree = _trees[tokenId];
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        "{",
                        "'status': '",
                        tree.status,
                        "',",
                        "'coordinates': '",
                        tree.coordinates,
                        "',",
                        "'plantingDate': '",
                        tree.plantingDate,
                        "',",
                        "'details': '",
                        tree.details,
                        "',",
                        "}"
                    )
                )
            )
        );
        string memory output = string(
            abi.encodePacked("data:application/json;base64,", json)
        );
        return output;
    }

    
    function consensusThreshold() public view returns (uint256) {
        uint256 oneThird = _active_members / 3;
        return oneThird;
    }

    function getDecisionMessage() public view returns (bytes memory) {
        // This should be different for different kind of decisions
        return abi.encodePacked(Strings.toString(_round));
    }

    function verifyMemberSignature(bytes memory signature)
        public
        view
        returns (address)
    {
        bytes memory message = getDecisionMessage();
        bytes32 hashed = ECDSA.toEthSignedMessageHash(message);
        address recovered = ECDSA.recover(hashed, signature);
        return recovered;
    }

    function verifyConsensus(bytes[] memory signatures) public returns (bool) {
        for (uint256 i = 0; i < signatures.length; i++) {
            bytes memory signature = signatures[i];
            address voter = verifyMemberSignature(signature);
            require(_members[voter], "This signature is not valid");
        }
        _round++;
        if (signatures.length >= consensusThreshold()) {
            return true;
        } else {
            return false;
        }
    }

    function fixMember(
        address member,
        bool status,
        bytes[] memory signatures
    ) external {
        require(verifyConsensus(signatures), "Consensus not reached");
        _members[member] = status;
        if (status) {
            _active_members++;
        } else {
            _active_members--;
        }
    }

    function mintTree(bytes[] memory signatures)
        public
        returns (uint256 tokenId)
    {
        require(verifyConsensus(signatures), "Consensus not reached");
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        _mint(address(this), newTokenId);
        return newTokenId;
    }

    function updateTree(
        bytes[] memory signatures,
        uint256 tokenId,
        string memory status,
        string memory coordinates,
        string memory plantingDate,
        string memory details
    ) public {
        require(verifyConsensus(signatures), "Consensus not reached");
        require(
            ownerOf(tokenId) !=
                address(0x0000000000000000000000000000000000000000),
            "Token does not exists."
        );
        _trees[tokenId].status = status;
        _trees[tokenId].coordinates = coordinates;
        _trees[tokenId].plantingDate = plantingDate;
        _trees[tokenId].details = details;
    }

    function getTree(uint256 _tokenId)
        public
        view
        returns (
            string memory status,
            string memory coordinates,
            string memory plantingDate,
            string memory details
        )
    {
        require(
            ownerOf(_tokenId) !=
                address(0x0000000000000000000000000000000000000000),
            "Token does not exists."
        );
        Tree memory tree = _trees[_tokenId];
        return (tree.status, tree.coordinates, tree.plantingDate, tree.details);
    }
}
