import hre from "hardhat";
import { expect, should } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { assertArgumentCount, parseUnits } from "ethers";

describe("mytoken deploy", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];
  before("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      18,
    ]);
  });
  it("should return name", async () => {
    expect(await myTokenC.name()).equal("MyToken");
  });
  it("should return symbol", async () => {
    expect(await myTokenC.symbol()).equal("MT");
  });
  it("should return decimals", async () => {
    expect(await myTokenC.decimals()).equal(18);
  });
  it("should return 0 totalSupply", async () => {
    expect(await myTokenC.totalSupply()).equal(1n * 10n ** 18n);
  });
  it("should return 1MT balance for signer 0", async () => {
    expect(await myTokenC.balanceOf(signers[0].address)).equal(1n * 10n ** 18n);
  });
  it("should have 0.5MT", async () => {
    const signer1 = signers[1]
    await myTokenC.transfer(hre.ethers.parseUnits("0.5", 18), signer1.address);
    expect(await myTokenC.balanceOf(signer1)).equal(hre.ethers.parseUnits("0.5", 18)
  })
});
