import hre from "hardhat";
import { expect, should } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { assertArgumentCount, parseUnits } from "ethers";
import { extendConfig } from "hardhat/config";
import { DECIMALS, MINTING_AMOUNT } from "./constant";

describe("My Token", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];
  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);
  });
  describe("Basic state value check", () => {
    it("should return name", async () => {
      expect(await myTokenC.name()).equal("MyToken");
    });
    it("should return symbol", async () => {
      expect(await myTokenC.symbol()).equal("MT");
    });
    it("should return decimals", async () => {
      expect(await myTokenC.decimals()).equal(DECIMALS);
    });
    it("should return 0 totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(
        MINTING_AMOUNT * 10n ** DECIMALS
      );
    });
  });
  describe("Mint", () => {
    it("should return 1MT balance for signer 0", async () => {
      expect(await myTokenC.balanceOf(signers[0].address)).equal(
        MINTING_AMOUNT * 10n ** DECIMALS
      );
    });
  });
  describe("Transfer", () => {
    it("should have 0.5MT", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits("0.5", DECIMALS),
          signer1.address
        )
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(
          signer0.address,
          signer1.address,
          hre.ethers.parseUnits("0.5", DECIMALS)
        );
      expect(await myTokenC.balanceOf(signer1.address)).equal(
        hre.ethers.parseUnits("0.5", DECIMALS)
      );
    });
    it("should be reverted with insufficient balance error", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS),
          signer1.address
        )
      ).to.be.revertedWith("insufficient balance");
    });
    describe("TransferFrom", () => {
      it("should emit Approval event", async () => {
        const signer1 = signers[1];
        await expect(
          myTokenC.approve(
            signer1.address,
            hre.ethers.parseUnits("10", DECIMALS)
          )
        )
          .to.emit(myTokenC, "Approval")
          .withArgs(signer1.address, hre.ethers.parseUnits("10", DECIMALS));
      });
      it("should be reverted with insufficient allowance error", async () => {
        const signer0 = signers[0];
        const signer1 = signers[1];
        await expect(
          myTokenC
            .connect(signer1)
            .transferFrom(
              signer0.address,
              signer1.address,
              hre.ethers.parseUnits("1", DECIMALS)
            )
        ).to.be.revertedWith("insufficient allowance");
      });
      it("balance check after moving 1MT(HW)", async () => {
        const signer0 = signers[0];
        const signer1 = signers[1];
        const amount = hre.ethers.parseUnits("1", DECIMALS);

        const s0_before = await myTokenC.balanceOf(signer0.address);
        const s1_before = await myTokenC.balanceOf(signer1.address);

        await myTokenC.approve(signer1.address, amount);

        await expect(
          myTokenC
            .connect(signer1)
            .transferFrom(signer0.address, signer1.address, amount)
        )
          .to.emit(myTokenC, "Transfer")
          .withArgs(signer0.address, signer1.address, amount);

        console.log(
          "signer0 balance: ",
          hre.ethers.formatUnits(
            await myTokenC.balanceOf(signer0.address),
            DECIMALS
          )
        );
        console.log(
          "signer1 balance: ",
          hre.ethers.formatUnits(
            await myTokenC.balanceOf(signer1.address),
            DECIMALS
          )
        );
        expect(await myTokenC.balanceOf(signer0.address)).equal(
          s0_before - amount
        );
        expect(await myTokenC.balanceOf(signer1.address)).equal(
          s1_before + amount
        );
      });
    });
  });
});
