import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers, network} from "hardhat";

describe("Forwarder", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployContractFixture() {
        const signers = await ethers.getSigners();

        const Contract = await ethers.getContractFactory("Forwarder");
        const ContractInstance = await Contract.deploy();
        await ContractInstance.deployed()

        return {signers, ContractInstance};
    }

    async function deployTestTokenFixture() {
        const signers = await ethers.getSigners();

        // Deploy a test token
        const TestToken = await ethers.getContractFactory("TestToken");
        const token = await TestToken.connect(signers[2]).deploy(1000000000000000);
        await token.deployed();

        return token
    }

    describe("Deployment", function () {
        it("Should set parentAddress to owner's address", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await expect(await ContractInstance.parentAddress()).to.equal(signers[0].address);
        });
    });

    describe("Deposit", function () {
        it("Should emit ForwarderDeposited", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await expect(signers[1].sendTransaction({
                to: ContractInstance.address,
                value: ethers.utils.parseEther("1.0")
            }))
                .to.emit(ContractInstance, 'ForwarderDeposited')
                .withArgs(signers[1].address, ethers.utils.parseEther("1.0"));
        });
        it("Should reject zero value deposit", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await expect(signers[1].sendTransaction({
                to: ContractInstance.address,
                value: ethers.utils.parseEther("0")
            }))
                .to.be.revertedWith('Forwarder: Zero value transfer ?');
        });
    });

    describe("Change parent", function () {
        it("-God- can do it", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);
            const _random_address = '0xF9d80fe1bb6078D115d1CD16e89f05eA7F14D969'

            // Change parent to random address
            await ContractInstance.changeParent(_random_address);
            await expect(await ContractInstance.parentAddress()).to.equal(_random_address);
        });
        it("And no one else !", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);
            const _random_address = '0xF9d80fe1bb6078D115d1CD16e89f05eA7F14D969'

            // Change parent to random address by non-owner
            await expect(ContractInstance.connect(signers[2]).changeParent(
                _random_address))
                .to.be.revertedWith('Forwarder: caller is not the main wallet');
        });
    });

    describe("Collect tokens", function () {
        it("-God- can do it", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);
            const token = await loadFixture(deployTestTokenFixture);

            // Send an amount to the forwarder contract
            const _amount = 50
            await token.transfer(ContractInstance.address, _amount);

            // Mark initial balances (before collecting tokens)
            await expect(await token.balanceOf(await ContractInstance.address))
                .to.equal(50)
            await expect(await token.balanceOf(await ContractInstance.parentAddress()))
                .to.equal(0)

            // Collect tokens using the owner account (signers[0])
            await expect(ContractInstance.collectTokens(token.address))
                .to.emit(ContractInstance, 'TokensCollected');

            // Post transfer balances
            await expect(await token.balanceOf(await ContractInstance.address))
                .to.equal(0)
            await expect(await token.balanceOf(await ContractInstance.parentAddress()))
                .to.equal(50)
        });
        it("And no one else !", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);
            const token = await loadFixture(deployTestTokenFixture);

            // Send an amount to the forwarder contract
            const _amount = 50
            await token.transfer(ContractInstance.address, _amount);

            // Collect tokens using a lambda account
            await expect(ContractInstance.connect(signers[1]).collectTokens(token.address))
                .to.be.revertedWith('Forwarder: caller is not the main wallet');
        });
        it("Forwards must be topped up with tokens", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);
            const token = await loadFixture(deployTestTokenFixture);

            // Collect tokens
            await expect(ContractInstance.collectTokens(token.address))
                .to.be.revertedWith('Forwarder: Empty token balance !');
        });
    });

    describe("Collect tokens", function () {
        it("-God- can do it", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);
            const token = await loadFixture(deployTestTokenFixture);

            // Send an amount to the forwarder contract
            const _amount = 50
            await token.transfer(ContractInstance.address, _amount);

            // Mark initial balances (before collecting tokens)
            await expect(await token.balanceOf(await ContractInstance.address))
                .to.equal(50)
            await expect(await token.balanceOf(await ContractInstance.parentAddress()))
                .to.equal(0)

            // Collect tokens using the owner account (signers[0])
            await ContractInstance.collectTokens(token.address);

            // Post transfer balances
            await expect(await token.balanceOf(await ContractInstance.address))
                .to.equal(0)
            await expect(await token.balanceOf(await ContractInstance.parentAddress()))
                .to.equal(50)
        });
        it("And no one else !", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);
            const token = await loadFixture(deployTestTokenFixture);

            // Send an amount to the forwarder contract
            const _amount = 50
            await token.transfer(ContractInstance.address, _amount);

            // Collect tokens using a lambda account
            await expect(ContractInstance.connect(signers[1]).collectTokens(token.address))
                .to.be.revertedWith('Forwarder: caller is not the main wallet');
        });
        it("Forwards must be topped up with tokens", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);
            const token = await loadFixture(deployTestTokenFixture);

            // Collect tokens
            await expect(ContractInstance.collectTokens(token.address))
                .to.be.revertedWith('Forwarder: Empty token balance !');
        });
    });

    describe("Collect tokens", function () {
        it("-God- can do it", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);
            const token = await loadFixture(deployTestTokenFixture);

            // Send an amount to the forwarder contract
            const _amount = 50
            await token.transfer(ContractInstance.address, _amount);

            // Mark initial balances (before collecting tokens)
            await expect(await token.balanceOf(await ContractInstance.address))
                .to.equal(50)
            await expect(await token.balanceOf(await ContractInstance.parentAddress()))
                .to.equal(0)

            // Collect tokens using the owner account (signers[0])
            await ContractInstance.collectTokens(token.address);

            // Post transfer balances
            await expect(await token.balanceOf(await ContractInstance.address))
                .to.equal(0)
            await expect(await token.balanceOf(await ContractInstance.parentAddress()))
                .to.equal(50)
        });
        it("And no one else !", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);
            const token = await loadFixture(deployTestTokenFixture);

            // Send an amount to the forwarder contract
            const _amount = 50
            await token.transfer(ContractInstance.address, _amount);

            // Collect tokens using a lambda account
            await expect(ContractInstance.connect(signers[1]).collectTokens(token.address))
                .to.be.revertedWith('Forwarder: caller is not the main wallet');
        });
        it("Forwarder must be topped up with tokens", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);
            const token = await loadFixture(deployTestTokenFixture);

            // Collect tokens
            await expect(ContractInstance.collectTokens(token.address))
                .to.be.revertedWith('Forwarder: Empty token balance !');
        });
    });

    describe("Collect native currency", function () {
        it("It works", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await network.provider.send("hardhat_setBalance", [
                ContractInstance.address,
                "0x10",
            ]);

            // Collect tokens using the owner account (signers[0])
            await ContractInstance.collect();

            // Post transfer balances
            await expect(await ethers.provider.getBalance(ContractInstance.address)).to.equal(0)
        });
        it("Anyone can do it", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await network.provider.send("hardhat_setBalance", [
                ContractInstance.address,
                "0x10",
            ]);

            // Collect tokens using the owner account (signers[0])
            await ContractInstance.connect(signers[1]).collect();

            // Post transfer balances
            await expect(await ethers.provider.getBalance(ContractInstance.address)).to.equal(0)
        });
        it("Forwarder must be topped up", async function () {
            const {signers, ContractInstance} = await loadFixture(deployContractFixture);

            await network.provider.send("hardhat_setBalance", [
                ContractInstance.address,
                "0x0",
            ]);

            // Collect using the owner account
            await expect(ContractInstance.collect())
                .to.be.revertedWith('Forwarder: Empty balance !');
        });
    });
});
