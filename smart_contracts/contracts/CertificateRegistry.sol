// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {
    struct Record {
        address issuer;
        uint256 timestamp;
        bool revoked;
        string enrollmentNumber;
    }

    mapping(bytes32 => Record) private records;

    event Registered(bytes32 indexed pdfHash, address indexed issuer, string enrollmentNumber);
    event Revoked(bytes32 indexed pdfHash, address indexed issuer);

    function registerCertificate(bytes32 pdfHash, string calldata enrollmentNumber) external {
        require(pdfHash != bytes32(0), "invalid hash");
        Record storage r = records[pdfHash];
        require(r.timestamp == 0, "already registered");
        r.issuer = msg.sender;
        r.timestamp = block.timestamp;
        r.revoked = false;
        r.enrollmentNumber = enrollmentNumber;
        emit Registered(pdfHash, msg.sender, enrollmentNumber);
    }

    function isRegistered(bytes32 pdfHash) external view returns (bool) {
        return records[pdfHash].timestamp != 0;
    }

    function getRecord(bytes32 pdfHash) external view returns (Record memory) {
        return records[pdfHash];
    }

    function revokeCertificate(bytes32 pdfHash) external {
        Record storage r = records[pdfHash];
        require(r.timestamp != 0, "not registered");
        require(msg.sender == r.issuer, "only issuer");
        require(!r.revoked, "already revoked");
        r.revoked = true;
        emit Revoked(pdfHash, msg.sender);
    }
}
