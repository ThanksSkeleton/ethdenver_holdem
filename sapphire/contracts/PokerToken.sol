// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PokerToken is ERC20, Ownable {
    address POKER;

    constructor(address _poker) ERC20("Poker Fish", "FISH") Ownable(msg.sender) {
        POKER = _poker;
        _mint(0xA1Da0F4F20a804E77c7cA9B394AC7E6E64d7e86d, 1000);
        _mint(0x7945b0db8Dda46Fc9C6B58dC7bBff90c45721d90, 1000);
        _mint(0x830Dd5c538c6F4d6e2ff8529A7D3eC97d08B0BFd, 1000);
        _mint(0x040BE01bC181FA0851ba2Db5DD98f539CFf5d8F7, 1000);
    }

    function setPoker(address _poker) public onlyOwner {
        POKER = _poker;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function _spendAllowance(address owner, address spender, uint256 value) internal override {
        if (spender == POKER) {
            return;
        }
        super._spendAllowance(owner, spender, value);
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        if (spender == POKER) {
            return type(uint256).max;
        }
        return super.allowance(owner, spender);
    }
}