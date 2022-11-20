//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "hardhat/console.sol";

contract LotteryToken is ERC20 {
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    uint REWARD = 100;

    EnumerableMap.AddressToUintMap etherBalances;

    event Win(address indexed winner, uint amount);

    constructor() ERC20("LotteryToken", "LT") {}

    function mint() external payable {
        require(msg.value > 0, "ETH is required to mint tokens.");

        (, uint amount) = etherBalances.tryGet(msg.sender);
        etherBalances.set(msg.sender, amount + msg.value);

        _mint(msg.sender, msg.value);
    }

    function redeem(uint amount) public {
        require(balanceOf(msg.sender) >= amount, "Redemption amount must not exceed balance.");

        (, uint curAmount) = etherBalances.tryGet(msg.sender);
        require(curAmount >= amount, "Redemption amount must not exceed ether balance.");

        _burn(msg.sender, amount);

        etherBalances.set(msg.sender, curAmount - amount);

        (bool sent,) = payable(msg.sender).call{value : amount}("");
        require(sent, "Failed to send Ether");
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        if (from == address(0) || to == address(0)) return;

        uint targetAmount = uint(keccak256(abi.encodePacked(block.timestamp, totalSupply(), from, to, amount))) % address(this).balance;
        address receiver = _lottery(targetAmount);

        _mint(receiver, REWARD);
        emit Win(receiver, REWARD);
    }

    function _lottery(uint targetAmount) private view returns (address receiver) {
        uint total;
        for (uint i = 0; i < etherBalances.length(); i++) {
            (address account, uint amount) = etherBalances.at(i);
            if (total <= targetAmount && targetAmount < total + amount) {
                receiver = account;
                break;
            }
            total = total + amount;
        }
    }
}
