async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const LotteryToken = await ethers.getContractFactory("LotteryToken");
  const lotteryToken = await LotteryToken.deploy();

  console.log("LotteryToken address:", lotteryToken.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
