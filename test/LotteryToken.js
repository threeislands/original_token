const {expect} = require("chai");

const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");

describe("LotteryToken contract", function () {
  async function deployLotteryTokenFixture() {
    const LotteryToken = await ethers.getContractFactory("LotteryToken");

    const [owner, addr1, addr2] = await ethers.getSigners();

    const lotteryToken = await LotteryToken.deploy();

    await lotteryToken.deployed();

    return {lotteryToken, owner, addr1, addr2};
  }

  describe("Mint", function () {

    it("Should mint token", async function () {
      const {lotteryToken, owner} = await loadFixture(deployLotteryTokenFixture);

      await expect(lotteryToken.mint({value: 100}))
          .to.changeTokenBalance(lotteryToken, owner, 100)
          .to.changeEtherBalances([owner, lotteryToken], [-100, 100])
    });
  });

  describe("Transfer", function () {
    it("Should transfer token and win reward", async function () {
      const {lotteryToken, owner, addr1} = await loadFixture(deployLotteryTokenFixture);

      await lotteryToken.mint({value: 100})

      await expect(lotteryToken.transfer(addr1.address, 50))
          .to.changeTokenBalances(lotteryToken, [owner, addr1], [50, 50])
    });

    it("Should emit event", async function () {
      const {lotteryToken, owner, addr1} = await loadFixture(deployLotteryTokenFixture);

      await lotteryToken.mint({value: 100})

      await expect(lotteryToken.transfer(addr1.address, 50))
          .to.emit(lotteryToken, "Win").withArgs(owner.address, 100)
    });

    it("Should increase total supply", async function() {
      const {lotteryToken, owner, addr1, addr2} = await loadFixture(deployLotteryTokenFixture);

      await lotteryToken.mint({value: 100})
      await lotteryToken.connect(addr1).mint({value: 100})
      await lotteryToken.connect(addr2).mint({value: 100})

      await expect(lotteryToken.transfer(addr1.address, 10))
      await expect(lotteryToken.connect(addr1).transfer(addr2.address, 20))
      await expect(lotteryToken.connect(addr2).transfer(owner.address, 30))

      expect(await lotteryToken.connect(owner).totalSupply()).to.equal(600)
    });
  });

  describe("Redeem", function () {
    it("Should redeem ETH", async function () {
      const {lotteryToken, owner, addr1} = await loadFixture(deployLotteryTokenFixture);

      await lotteryToken.mint({value: 100})

      await expect(lotteryToken.redeem(100))
          .to.changeTokenBalance(lotteryToken, owner, -100)
          .to.changeEtherBalances([owner, lotteryToken], [100, -100])
    });

    it("Should revert redemption", async function () {
      const {lotteryToken, addr1} = await loadFixture(deployLotteryTokenFixture);

      await lotteryToken.mint({value: 1000})
      await lotteryToken.transfer(addr1.address, 500)

      await expect(lotteryToken.redeem(1000))
          .to.be.revertedWith("Redemption amount must not exceed balance.");
    });
  });
});
